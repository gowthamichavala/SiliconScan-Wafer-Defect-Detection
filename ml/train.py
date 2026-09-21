import time
import json
from datetime import datetime
from pathlib import Path
import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from config import DATASET_DIR, CHECKPOINT_DIR, RESULTS_DIR, EPOCHS, LEARNING_RATE, IMAGE_SIZE
from data import build_loaders
from model import WaferCNN

def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, targets in loader:
        images, targets = images.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(targets).sum().item()
        total += images.size(0)

    return running_loss / total, correct / total

@torch.no_grad()
def evaluate_epoch(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, targets in loader:
        images, targets = images.to(device), targets.to(device)
        outputs = model(images)
        loss = criterion(outputs, targets)

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(targets).sum().item()
        total += images.size(0)

    return running_loss / total, correct / total

def plot_training_curves(history, save_path):
    epochs = range(1, len(history["train_loss"]) + 1)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))

    # Loss plot
    ax1.plot(epochs, history["train_loss"], "o-", label="Train Loss", color="#0284c7")
    ax1.plot(epochs, history["val_loss"], "s--", label="Val Loss", color="#e11d48")
    ax1.set_title("Training & Validation Loss", fontsize=12)
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Cross Entropy Loss")
    ax1.grid(True, linestyle="--", alpha=0.5)
    ax1.legend()

    # Accuracy plot
    ax2.plot(epochs, [a * 100 for a in history["train_acc"]], "o-", label="Train Acc", color="#0284c7")
    ax2.plot(epochs, [a * 100 for a in history["val_acc"]], "s--", label="Val Acc", color="#10b981")
    ax2.set_title("Training & Validation Accuracy", fontsize=12)
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy (%)")
    ax2.grid(True, linestyle="--", alpha=0.5)
    ax2.legend()

    plt.tight_layout()
    plt.savefig(save_path, dpi=200)
    plt.close()

def main():
    print("=" * 60)
    print("STARTING WAFER DEFECT DETECTION CNN TRAINING PIPELINE")
    print("=" * 60)

    if not DATASET_DIR.exists() or not any(DATASET_DIR.iterdir()):
        raise FileNotFoundError(
            f"Dataset directory '{DATASET_DIR}' is empty. Run 'python ml/generate_dataset.py' first."
        )

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Compute Device : {device}")

    # Build data loaders
    train_loader, val_loader, test_loader, classes = build_loaders(DATASET_DIR)
    print(f"Classes ({len(classes)}): {classes}")
    print(f"Train samples  : {len(train_loader.dataset)}")
    print(f"Val samples    : {len(val_loader.dataset)}")
    print(f"Test samples   : {len(test_loader.dataset)}")
    print(f"Epochs         : {EPOCHS}")
    print(f"Initial LR     : {LEARNING_RATE}")
    print("-" * 60)

    model = WaferCNN(num_classes=len(classes)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)

    best_val_acc = 0.0
    best_checkpoint_path = CHECKPOINT_DIR / "best_wafer_cnn.pth"

    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "epochs": EPOCHS
    }

    start_total_time = time.time()

    for epoch in range(1, EPOCHS + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        va_loss, va_acc = evaluate_epoch(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        scheduler.step(va_acc)

        history["train_loss"].append(round(tr_loss, 4))
        history["train_acc"].append(round(tr_acc, 4))
        history["val_loss"].append(round(va_loss, 4))
        history["val_acc"].append(round(va_acc, 4))

        is_best = va_acc > best_val_acc
        if is_best:
            best_val_acc = va_acc
            torch.save({
                "model_state": model.state_dict(),
                "classes": classes,
                "image_size": IMAGE_SIZE,
                "val_accuracy": best_val_acc,
                "epoch": epoch,
                "created_at": datetime.now().isoformat()
            }, best_checkpoint_path)

        flag = " [BEST SAVED]" if is_best else ""
        print(f"Epoch {epoch:02d}/{EPOCHS:02d} | "
              f"Train Loss: {tr_loss:.4f} Acc: {tr_acc*100:5.2f}% | "
              f"Val Loss: {va_loss:.4f} Acc: {va_acc*100:5.2f}% | "
              f"Time: {elapsed:4.1f}s{flag}")

    total_time = time.time() - start_total_time
    print("-" * 60)
    print(f"Training completed in {total_time:.1f}s")
    print(f"Best Validation Accuracy: {best_val_acc * 100:.2f}%")
    print(f"Saved Checkpoint: {best_checkpoint_path}")

    # Save training curves and history
    curves_path = RESULTS_DIR / "training_curves.png"
    plot_training_curves(history, curves_path)
    print(f"Saved Training Curves: {curves_path}")

    with open(RESULTS_DIR / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)

    print("=" * 60)

if __name__ == "__main__":
    main()
