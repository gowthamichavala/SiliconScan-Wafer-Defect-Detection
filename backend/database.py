import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, Text, desc
)
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = Path(__file__).resolve().parent / "wafer_history.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class PredictionRecord(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(32), default=lambda: datetime.now().isoformat())
    filename = Column(String(255), nullable=False)
    predicted_class = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    inference_time_ms = Column(Float, nullable=False)
    is_defective = Column(Boolean, nullable=False)
    image_url = Column(String(255), nullable=True)
    heatmap_url = Column(String(255), nullable=True)
    probabilities_json = Column(Text, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        try:
            probs = json.loads(self.probabilities_json)
        except Exception:
            probs = {}

        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "filename": self.filename,
            "predicted_class": self.predicted_class,
            "confidence": round(self.confidence, 4),
            "inference_time_ms": round(self.inference_time_ms, 2),
            "is_defective": self.is_defective,
            "image_url": self.image_url,
            "heatmap_url": self.heatmap_url,
            "probabilities": probs
        }

def init_db():
    Base.metadata.create_all(bind=engine)

def save_prediction(
    filename: str,
    predicted_class: str,
    confidence: float,
    inference_time_ms: float,
    is_defective: bool,
    probabilities: Dict[str, float],
    image_url: Optional[str] = None,
    heatmap_url: Optional[str] = None,
    timestamp: Optional[str] = None
) -> Dict[str, Any]:
    if timestamp is None:
        timestamp = datetime.now().isoformat()

    db = SessionLocal()
    try:
        record = PredictionRecord(
            timestamp=timestamp,
            filename=filename,
            predicted_class=predicted_class,
            confidence=confidence,
            inference_time_ms=inference_time_ms,
            is_defective=is_defective,
            image_url=image_url,
            heatmap_url=heatmap_url,
            probabilities_json=json.dumps(probabilities)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record.to_dict()
    finally:
        db.close()

def get_history(
    limit: int = 50,
    offset: int = 0,
    class_filter: Optional[str] = None,
    defective_filter: Optional[bool] = None
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        query = db.query(PredictionRecord)
        if class_filter:
            query = query.filter(PredictionRecord.predicted_class == class_filter)
        if defective_filter is not None:
            query = query.filter(PredictionRecord.is_defective == defective_filter)

        total_count = query.count()
        records = query.order_by(desc(PredictionRecord.id)).offset(offset).limit(limit).all()

        return {
            "total": total_count,
            "items": [r.to_dict() for r in records]
        }
    finally:
        db.close()

def delete_history_item(record_id: int) -> bool:
    db = SessionLocal()
    try:
        record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False
    finally:
        db.close()

def clear_all_history() -> int:
    db = SessionLocal()
    try:
        count = db.query(PredictionRecord).delete()
        db.commit()
        return count
    finally:
        db.close()

def get_history_stats() -> Dict[str, Any]:
    db = SessionLocal()
    try:
        total = db.query(PredictionRecord).count()
        normal = db.query(PredictionRecord).filter(PredictionRecord.is_defective == False).count()
        defective = total - normal

        # Per class distribution in history
        from sqlalchemy import func
        class_counts = (
            db.query(PredictionRecord.predicted_class, func.count(PredictionRecord.id))
            .group_by(PredictionRecord.predicted_class)
            .all()
        )
        distribution = {cls: cnt for cls, cnt in class_counts}

        # Average confidence and latency
        avg_conf = db.query(func.avg(PredictionRecord.confidence)).scalar() or 0.0
        avg_time = db.query(func.avg(PredictionRecord.inference_time_ms)).scalar() or 0.0

        return {
            "total_inspected": total,
            "normal_count": normal,
            "defective_count": defective,
            "defect_rate": round((defective / total) * 100, 2) if total > 0 else 0.0,
            "average_confidence": round(float(avg_conf), 4),
            "average_inference_time_ms": round(float(avg_time), 2),
            "class_distribution": distribution
        }
    finally:
        db.close()
