from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class PredictionItem(BaseModel):
    id: Optional[int] = None
    timestamp: str
    filename: str
    predicted_class: str
    confidence: float
    inference_time_ms: float
    is_defective: bool
    image_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    probabilities: Dict[str, float]
    defect_description: Optional[str] = None

class PredictionResponse(PredictionItem):
    status: str = "success"

class BatchPredictionResponse(BaseModel):
    status: str = "success"
    total_processed: int
    normal_count: int
    defective_count: int
    defect_rate: float
    items: List[PredictionItem]

class HistoryResponse(BaseModel):
    total: int
    items: List[PredictionItem]

class HistoryStatsResponse(BaseModel):
    total_inspected: int
    normal_count: int
    defective_count: int
    defect_rate: float
    average_confidence: float
    average_inference_time_ms: float
    class_distribution: Dict[str, int]

class OverallMetrics(BaseModel):
    accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    weighted_precision: float
    weighted_recall: float
    weighted_f1: float

class ClassMetric(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int

class MetricsResponse(BaseModel):
    status: str
    evaluated_at: Optional[str] = None
    test_samples: Optional[int] = None
    overall: Optional[OverallMetrics] = None
    classes: Optional[List[str]] = None
    per_class: Optional[Dict[str, ClassMetric]] = None
    confusion_matrix: Optional[List[List[int]]] = None
    confusion_matrix_image_url: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    pytorch_version: str
    classes: List[str]
    active_checkpoint: Optional[str] = None

class SampleWaferItem(BaseModel):
    class_name: str
    filename: str
    image_url: str
    description: str
