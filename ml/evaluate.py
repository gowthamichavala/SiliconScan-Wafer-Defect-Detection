import json
from pathlib import Path
import numpy as np
import torch
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from config import DATASET_DIR, CHECKPOINT_DIR, RESULTS_DIR, IMAGE_SIZE
from data import build_loaders
from model import WaferCNN

def plot_confusion_matrix(cm, classes, save_path):
    fig, ax = plt.subplots(figsize=(9, 8))
    im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=classes,
        yticklabels=classes,
        title="Semiconductor Wafer Defect Confusion Matrix (Test Split)",
        ylabel="True Defect Class",
        xlabel="Predicted Defect Class"
    )
    plt.setp(ax.get_xticklabels(), rotation=40, ha="right", rotation_mode="anchor")

    # Loop over data dimensions and create text annotations
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            ax.text(j, i, f"{val}",
                    ha="center", va="center",
                    color="white" if val > thresh else "black",
                    fontsize=9, fontweight="bold" if i == j else "normal")

    plt.tight_layout()
    plt.savefig(save_path, dpi=200)
    plt.close()

def evaluate():
    print("=" * 60)
    print("INDEPENDENT TEST SET EVALUATION")
    print("=" * 60)

    checkpoint_path = CHECKPOINT_DIR / "best_wafer_cnn.pth"
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}. Train the model first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    classes = checkpoint["classes"]

    # Load model
    model = WaferCNN(num_classes=len(classes)).to(device)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    # Load test split
    _, _, test_loader, _ = build_loaders(DATASET_DIR)
    print(f"Evaluating model on {len(test_loader.dataset)} test wafer images...")

    y_true = []
    y_pred = []
    y_probs = []

    with torch.no_grad():
        for images, targets in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = outputs.max(1)

            y_true.extend(targets.cpu().numpy().tolist())
            y_pred.extend(preds.cpu().numpy().tolist())
            y_probs.extend(probs.cpu().numpy().tolist())

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # Compute standard scientific metrics
    accuracy = float(accuracy_score(y_true, y_pred))
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)

    report_dict = classification_report(y_true, y_pred, target_names=classes, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    # Save Confusion Matrix figure
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    cm_path = RESULTS_DIR / "confusion_matrix.png"
    plot_confusion_matrix(cm, classes, cm_path)

    # Build per-class breakdown
    per_class = {}
    for c_name in classes:
        per_class[c_name] = {
            "precision": round(float(report_dict[c_name]["precision"]), 4),
            "recall": round(float(report_dict[c_name]["recall"]), 4),
            "f1_score": round(float(report_dict[c_name]["f1-score"]), 4),
            "support": int(report_dict[c_name]["support"])
        }

    metrics_payload = {
        "status": "trained",
        "evaluated_at": checkpoint.get("created_at", "N/A"),
        "test_samples": len(y_true),
        "overall": {
            "accuracy": round(accuracy, 4),
            "macro_precision": round(float(p_macro), 4),
            "macro_recall": round(float(r_macro), 4),
            "macro_f1": round(float(f1_macro), 4),
            "weighted_precision": round(float(p_weighted), 4),
            "weighted_recall": round(float(r_weighted), 4),
            "weighted_f1": round(float(f1_weighted), 4)
        },
        "classes": classes,
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_image": "confusion_matrix.png"
    }

    metrics_json_path = RESULTS_DIR / "metrics.json"
    with open(metrics_json_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\nOverall Test Accuracy : {accuracy * 100:.2f}%")
    print(f"Macro F1-Score        : {f1_macro:.4f}")
    print(f"Macro Precision       : {p_macro:.4f}")
    print(f"Macro Recall          : {r_macro:.4f}\n")
    print(f"{'Class':<12} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 60)
    for c_name in classes:
        pc = per_class[c_name]
        print(f"{c_name:<12} | {pc['precision']:<10.4f} | {pc['recall']:<10.4f} | {pc['f1_score']:<10.4f} | {pc['support']:<8}")

    print("-" * 60)
    print(f"Saved evaluation metrics JSON: {metrics_json_path}")
    print(f"Saved confusion matrix plot   : {cm_path}")
    print("=" * 60)
    return metrics_payload

if __name__ == "__main__":
    evaluate()
