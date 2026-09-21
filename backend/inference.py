import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image
import torch

from model import WaferCNN
from preprocessing import load_and_preprocess_image
from gradcam import GradCAM

# Standard Defect Descriptions
DEFECT_DESCRIPTIONS = {
    "Normal": "Standard wafer with normal die yield. No systematic spatial defect clusters detected.",
    "Center": "High-density defect cluster at wafer center. Typically associated with chemical vapor deposition (CVD) flow or center-zone chemical-mechanical polishing (CMP) pressure.",
    "Donut": "Concentric annular ring of defective dies. Often indicates thermal annealing temperature gradients, slurry flow pooling, or spin-coating dynamics.",
    "Edge-Loc": "Localized defect cluster situated on the perimeter. Commonly caused by physical wafer handling pins, vacuum wand contact, or edge clamping mechanisms.",
    "Edge-Ring": "Continuous ring of defects along the outermost circumference. Indicative of edge bead removal (EBR) anomalies or photoresist spin-off issues.",
    "Loc": "Localized defect cluster in an off-center region. Often points to localized particle contamination, micro-scratch clusters, or photolithography reticle anomalies.",
    "Near-full": "Severe defect pattern covering majority of wafer surface. Represents catastrophic fabrication breakdown, chamber thermal runaway, or severe contamination.",
    "Random": "Uniformly distributed point defects without spatial clustering. Reflects random particle contamination, micro-voids, or substrate crystal defects.",
    "Scratch": "Linear or curvilinear defect trail. Direct evidence of mechanical handling abrasion, robot gripper slippage, or abrasive slurry particles dragging across the die surface."
}

class WaferInferenceEngine:
    """
    Inference Engine with real PyTorch forward pass and Grad-CAM generation.
    """
    def __init__(self, checkpoint_path: Optional[Path] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.classes = []
        self.gradcam = None
        self.checkpoint_path = checkpoint_path
        self.is_loaded = False

        if checkpoint_path and checkpoint_path.exists():
            self.load(checkpoint_path)

    def load(self, checkpoint_path: Path):
        self.checkpoint_path = checkpoint_path
        ckpt = torch.load(checkpoint_path, map_location=self.device)
        self.classes = ckpt.get("classes", [
            "Normal", "Center", "Donut", "Edge-Loc", "Edge-Ring",
            "Loc", "Near-full", "Random", "Scratch"
        ])

        self.model = WaferCNN(num_classes=len(self.classes)).to(self.device)
        self.model.load_state_dict(ckpt["model_state"])
        self.model.eval()

        # Initialize Grad-CAM
        self.gradcam = GradCAM(self.model, self.model.get_target_layer())
        self.is_loaded = True

    def predict(
        self,
        image_source,
        filename: str = "wafer.png",
        uploads_dir: Optional[Path] = None
    ) -> Dict[str, Any]:
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Train the model or provide a valid checkpoint first.")

        # 1. Preprocessing
        pil_img, tensor = load_and_preprocess_image(image_source)
        tensor = tensor.to(self.device)

        # 2. Timing and Inference
        t0 = time.perf_counter()
        # Enable grad for Grad-CAM
        with torch.set_grad_enabled(True):
            tensor.requires_grad = True
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)[0]
            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            conf, pred_idx = probs.max(dim=0)
            conf_val = float(conf.item())
            pred_class = self.classes[pred_idx.item()]

            # 3. Grad-CAM generation for top predicted class
            cam_np = self.gradcam.generate_cam(tensor, target_class=pred_idx.item())
            heatmap_img, overlay_img = self.gradcam.overlay_heatmap(pil_img, cam_np, alpha=0.55)

        # 4. Probabilities dictionary
        probs_dict = {
            self.classes[i]: round(float(probs[i].item()), 4)
            for i in range(len(self.classes))
        }

        # 5. Save images if upload directory provided
        image_url = None
        heatmap_url = None

        if uploads_dir:
            orig_dir = uploads_dir / "originals"
            heat_dir = uploads_dir / "heatmaps"
            orig_dir.mkdir(parents=True, exist_ok=True)
            heat_dir.mkdir(parents=True, exist_ok=True)

            unique_id = uuid.uuid4().hex[:10]
            clean_name = Path(filename).stem
            orig_filename = f"{clean_name}_{unique_id}.png"
            heat_filename = f"{clean_name}_heatmap_{unique_id}.png"

            orig_path = orig_dir / orig_filename
            heat_path = heat_dir / heat_filename

            pil_img.save(orig_path)
            overlay_img.save(heat_path)

            image_url = f"/uploads/originals/{orig_filename}"
            heatmap_url = f"/uploads/heatmaps/{heat_filename}"

        return {
            "predicted_class": pred_class,
            "confidence": round(conf_val, 4),
            "inference_time_ms": round(elapsed_ms, 2),
            "is_defective": pred_class != "Normal",
            "probabilities": probs_dict,
            "defect_description": DEFECT_DESCRIPTIONS.get(pred_class, "Wafer defect pattern detected."),
            "image_url": image_url,
            "heatmap_url": heatmap_url
        }

# Global singleton
engine = WaferInferenceEngine()
