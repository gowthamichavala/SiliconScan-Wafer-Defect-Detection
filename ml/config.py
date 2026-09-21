from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT_DIR / "ml" / "dataset"
CHECKPOINT_DIR = ROOT_DIR / "ml" / "checkpoints"
RESULTS_DIR = ROOT_DIR / "results"
SAMPLES_DIR = ROOT_DIR / "samples"
BACKEND_UPLOADS_DIR = ROOT_DIR / "backend" / "uploads"

# Image and training hyperparameters
IMAGE_SIZE = 64
BATCH_SIZE = 32
NUM_CLASSES = 9
EPOCHS = 8
LEARNING_RATE = 0.001
RANDOM_SEED = 42

# 9 Canonical Defect Classes
CLASSES = [
    "Normal",
    "Center",
    "Donut",
    "Edge-Loc",
    "Edge-Ring",
    "Loc",
    "Near-full",
    "Random",
    "Scratch"
]

CLASS_TO_IDX = {name: i for i, name in enumerate(CLASSES)}
IDX_TO_CLASS = {i: name for i, name in enumerate(CLASSES)}

# Technical Fab Descriptions for Explainability
DEFECT_DESCRIPTIONS = {
    "Normal": "Standard wafer without significant spatial clustering or systematic anomalies. Dies pass standard quality thresholds.",
    "Center": "Concentrated defect cluster situated in the center of the wafer map. Typically caused by chemical vapor deposition (CVD), gas flow non-uniformity, or center-biased CMP pressure.",
    "Donut": "Ring-shaped annular defect zone situated between the center and periphery. Frequently associated with thermal annealing temperature gradients, slurry flow stagnation, or spinning non-uniformities.",
    "Edge-Loc": "Localized defect cluster situated along the perimeter/bevel of the wafer. Usually induced by wafer handling pins, edge clamping mechanisms, or robotics end-effector contact.",
    "Edge-Ring": "Continuous or semi-continuous ring of defective dies along the entire outer edge of the wafer. Commonly caused by edge bead removal (EBR) failure, photoresist spin-off buildup, or bevel etch anomalies.",
    "Loc": "Localized defect cluster occurring in an off-center region of the wafer. Arises from localized particle drops, localized etch mask defects, or optical lithography aberrations.",
    "Near-full": "Widespread defect coverage encompassing the vast majority of dies across the wafer. Indicates catastrophic process failure, severe thermal runaway, or chamber contamination.",
    "Random": "Spatially dispersed defective dies without any spatial clustering or geometric pattern. Typical of airborne particle contamination, dielectric micro-voids, or random silicon substrate impurities.",
    "Scratch": "Linear or curvilinear defect trail cutting across adjacent dies. Caused by mechanical handling scratches, robot blade misalignment, or loose abrasive slurry particles dragging across the wafer surface."
}
