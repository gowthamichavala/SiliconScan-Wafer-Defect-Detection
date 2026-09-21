import os
import sys
import json
import time
from pathlib import Path
from typing import List, Optional
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path for local and root execution
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, UploadFile, File, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from schemas import (
    PredictionResponse,
    BatchPredictionResponse,
    HistoryResponse,
    HistoryStatsResponse,
    MetricsResponse,
    HealthResponse,
    SampleWaferItem
)
from database import (
    init_db,
    save_prediction,
    get_history,
    delete_history_item,
    clear_all_history,
    get_history_stats
)
from inference import engine, DEFECT_DESCRIPTIONS

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
UPLOADS_DIR = BASE_DIR / "uploads"
RESULTS_DIR = PROJECT_ROOT / "results"
SAMPLES_DIR = PROJECT_ROOT / "samples"
CHECKPOINT_PATH = PROJECT_ROOT / "ml" / "checkpoints" / "best_wafer_cnn.pth"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "originals").mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "heatmaps").mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    init_db()

    # Load model if checkpoint exists
    if CHECKPOINT_PATH.exists():
        print(f"[Backend] Found checkpoint at {CHECKPOINT_PATH}, loading into inference engine...")
        try:
            engine.load(CHECKPOINT_PATH)
            print(f"[Backend] WaferCNN successfully loaded on {engine.device}")
        except Exception as e:
            print(f"[Backend] Warning: Failed to load checkpoint: {e}")
    else:
        print(f"[Backend] No checkpoint found at {CHECKPOINT_PATH}. Run training pipeline to generate weights.")

    yield
    print("[Backend] Shutting down...")

app = FastAPI(
    title="Semiconductor Wafer Defect Detection API",
    description="Academic AI System for 9-Class Semiconductor Wafer Map Inspection with Grad-CAM Explainability",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
if RESULTS_DIR.exists():
    app.mount("/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")
if SAMPLES_DIR.exists():
    app.mount("/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    import torch
    return {
        "status": "healthy",
        "model_loaded": engine.is_loaded,
        "device": str(engine.device),
        "pytorch_version": torch.__version__,
        "classes": engine.classes if engine.is_loaded else [],
        "active_checkpoint": str(CHECKPOINT_PATH) if CHECKPOINT_PATH.exists() else None
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_single(file: UploadFile = File(...)):
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not loaded yet. Please run training pipeline first."
        )

    # Validate file extension
    valid_exts = {".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tif", ".tiff"}
    ext = Path(file.filename).suffix.lower()
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format '{ext}'. Supported: PNG, JPG, BMP, WEBP, TIFF"
        )

    try:
        contents = await file.read()
        res = engine.predict(contents, filename=file.filename, uploads_dir=UPLOADS_DIR)

        # Save to SQLite history
        record = save_prediction(
            filename=file.filename,
            predicted_class=res["predicted_class"],
            confidence=res["confidence"],
            inference_time_ms=res["inference_time_ms"],
            is_defective=res["is_defective"],
            probabilities=res["probabilities"],
            image_url=res["image_url"],
            heatmap_url=res["heatmap_url"]
        )

        res["id"] = record["id"]
        res["timestamp"] = record["timestamp"]
        res["filename"] = file.filename
        res["status"] = "success"
        return res

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@app.post("/api/batch-predict", response_model=BatchPredictionResponse)
async def predict_batch(files: List[UploadFile] = File(...)):
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not loaded. Please run the training pipeline first."
        )

    if len(files) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided.")

    items = []
    normal_count = 0
    defective_count = 0

    for file in files:
        try:
            contents = await file.read()
            res = engine.predict(contents, filename=file.filename, uploads_dir=UPLOADS_DIR)

            record = save_prediction(
                filename=file.filename,
                predicted_class=res["predicted_class"],
                confidence=res["confidence"],
                inference_time_ms=res["inference_time_ms"],
                is_defective=res["is_defective"],
                probabilities=res["probabilities"],
                image_url=res["image_url"],
                heatmap_url=res["heatmap_url"]
            )

            res["id"] = record["id"]
            res["timestamp"] = record["timestamp"]
            res["filename"] = file.filename
            items.append(res)

            if res["is_defective"]:
                defective_count += 1
            else:
                normal_count += 1

        except Exception as e:
            print(f"[Batch] Error processing {file.filename}: {e}")
            continue

    total_proc = len(items)
    defect_rate = round((defective_count / total_proc) * 100, 2) if total_proc > 0 else 0.0

    return {
        "status": "success",
        "total_processed": total_proc,
        "normal_count": normal_count,
        "defective_count": defective_count,
        "defect_rate": defect_rate,
        "items": items
    }

@app.get("/api/history", response_model=HistoryResponse)
def fetch_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    class_filter: Optional[str] = None,
    defective_filter: Optional[bool] = None
):
    return get_history(limit=limit, offset=offset, class_filter=class_filter, defective_filter=defective_filter)

@app.get("/api/history/stats", response_model=HistoryStatsResponse)
def fetch_history_stats():
    return get_history_stats()

@app.delete("/api/history/{record_id}")
def delete_record(record_id: int):
    success = delete_history_item(record_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")
    return {"status": "deleted", "id": record_id}

@app.delete("/api/history")
def clear_history():
    count = clear_all_history()
    return {"status": "cleared", "deleted_count": count}

@app.get("/api/metrics", response_model=MetricsResponse)
def fetch_metrics():
    metrics_path = RESULTS_DIR / "metrics.json"
    if not metrics_path.exists():
        return {
            "status": "not_trained",
            "message": "Model has not been evaluated yet. Run training and evaluation pipeline."
        }

    try:
        with open(metrics_path, "r") as f:
            data = json.load(f)

        data["confusion_matrix_image_url"] = "/results/confusion_matrix.png"
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read metrics: {e}")

@app.get("/api/samples", response_model=List[SampleWaferItem])
def fetch_samples():
    """Returns curated sample wafer maps for each class to enable 1-click test inspection."""
    samples = []
    if not SAMPLES_DIR.exists():
        return []

    for f in sorted(SAMPLES_DIR.glob("*_sample.png")):
        class_name = f.stem.replace("_sample", "")
        desc = DEFECT_DESCRIPTIONS.get(class_name, "Sample wafer map pattern.")
        samples.append({
            "class_name": class_name,
            "filename": f.name,
            "image_url": f"/samples/{f.name}",
            "description": desc
        })

    return samples
