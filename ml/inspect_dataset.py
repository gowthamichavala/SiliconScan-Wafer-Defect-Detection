import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

from config import DATASET_DIR, RESULTS_DIR, CLASSES

def inspect_dataset():
    print("=" * 60)
    print("SEMICONDUCTOR WAFER DATASET INSPECTION & VALIDATION")
    print("=" * 60)

    if not DATASET_DIR.exists():
        print(f"ERROR: Dataset directory does not exist: {DATASET_DIR}")
        print("Run 'python ml/generate_dataset.py' to generate a dataset first.")
        return False

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    class_dirs = [d for d in DATASET_DIR.iterdir() if d.is_dir()]
    if not class_dirs:
        print(f"ERROR: No class subdirectories found in {DATASET_DIR}")
        return False

    summary = {
        "dataset_path": str(DATASET_DIR),
        "total_images": 0,
        "classes": {},
        "image_shapes": {},
        "valid": True,
        "warnings": []
    }

    print(f"Dataset root: {DATASET_DIR}")
    print(f"Found {len(class_dirs)} class directories.\n")
    print(f"{'Class Name':<15} | {'Count':<8} | {'Sample Dimensions':<20} | {'Mode':<6}")
    print("-" * 60)

    for c_dir in sorted(class_dirs, key=lambda x: x.name):
        c_name = c_dir.name
        img_files = list(c_dir.glob("*.png")) + list(c_dir.glob("*.jpg")) + list(c_dir.glob("*.jpeg"))
        count = len(img_files)
        summary["total_images"] += count
        summary["classes"][c_name] = count

        sample_shape_str = "None"
        sample_mode = "None"

        if count > 0:
            with Image.open(img_files[0]) as img:
                sample_shape_str = f"{img.size[0]}x{img.size[1]}"
                sample_mode = img.mode
                summary["image_shapes"][c_name] = {
                    "size": list(img.size),
                    "mode": img.mode
                }
        else:
            summary["valid"] = False
            summary["warnings"].append(f"Directory {c_name} has 0 images.")

        print(f"{c_name:<15} | {count:<8} | {sample_shape_str:<20} | {sample_mode:<6}")

    print("-" * 60)
    print(f"Total Dataset Images: {summary['total_images']}")

    # Check for missing standard classes
    missing_classes = set(CLASSES) - set(summary["classes"].keys())
    if missing_classes:
        msg = f"Missing standard defect classes: {missing_classes}"
        print(f"Warning: {msg}")
        summary["warnings"].append(msg)

    # Save summary JSON
    summary_path = RESULTS_DIR / "dataset_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nSaved dataset summary to: {summary_path}")

    # Generate Class Distribution Plot
    classes_list = list(summary["classes"].keys())
    counts = [summary["classes"][c] for c in classes_list]

    plt.figure(figsize=(10, 5))
    bars = plt.bar(classes_list, counts, color="#0284c7", edgecolor="#0369a1", width=0.6)
    plt.title("Semiconductor Wafer Map Defect Class Distribution", fontsize=13, pad=15)
    plt.xlabel("Defect Class", fontsize=11)
    plt.ylabel("Number of Samples", fontsize=11)
    plt.xticks(rotation=30, ha="right")
    plt.grid(axis="y", linestyle="--", alpha=0.5)

    # Add count labels on top of bars
    for bar in bars:
        height = bar.get_height()
        plt.annotate(f"{height}",
                     xy=(bar.get_x() + bar.get_width() / 2, height),
                     xytext=(0, 3),
                     textcoords="offset points",
                     ha="center", va="bottom", fontsize=9)

    plt.tight_layout()
    chart_path = RESULTS_DIR / "class_distribution.png"
    plt.savefig(chart_path, dpi=200)
    plt.close()
    print(f"Saved class distribution chart to: {chart_path}")
    print("=" * 60)

    return summary["valid"]

if __name__ == "__main__":
    inspect_dataset()
