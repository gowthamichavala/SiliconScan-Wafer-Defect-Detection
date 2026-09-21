from pathlib import Path
from typing import Tuple, List
import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset
from sklearn.model_selection import train_test_split

from config import IMAGE_SIZE, BATCH_SIZE, RANDOM_SEED, CLASSES

def get_transforms():
    """
    Returns augmentation pipeline for training and deterministic preprocessing for evaluation.
    """
    train_transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])

    eval_transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])

    return train_transform, eval_transform

def build_loaders(
    dataset_dir: Path,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    batch_size: int = BATCH_SIZE
) -> Tuple[DataLoader, DataLoader, DataLoader, List[str]]:
    """
    Loads folder-based wafer dataset, performs stratified train/val/test split,
    and returns PyTorch DataLoaders and class list.
    """
    train_tfm, eval_tfm = get_transforms()

    # Base dataset instances for proper transforms
    base_train_dataset = datasets.ImageFolder(root=str(dataset_dir), transform=train_tfm)
    base_eval_dataset = datasets.ImageFolder(root=str(dataset_dir), transform=eval_tfm)

    # Validate classes
    detected_classes = base_train_dataset.classes
    if len(detected_classes) == 0:
        raise ValueError(f"No class folders found in dataset directory: {dataset_dir}")

    # Stratified split to preserve class proportions
    targets = [target for _, target in base_train_dataset.samples]
    indices = list(range(len(targets)))

    # Train vs Temp (val + test)
    temp_ratio = val_ratio + test_ratio
    train_idx, temp_idx, _, temp_targets = train_test_split(
        indices,
        targets,
        test_size=temp_ratio,
        stratify=targets,
        random_state=RANDOM_SEED
    )

    # Val vs Test
    rel_test_ratio = test_ratio / temp_ratio
    val_idx, test_idx = train_test_split(
        temp_idx,
        test_size=rel_test_ratio,
        stratify=temp_targets,
        random_state=RANDOM_SEED
    )

    train_set = Subset(base_train_dataset, train_idx)
    val_set = Subset(base_eval_dataset, val_idx)
    test_set = Subset(base_eval_dataset, test_idx)

    train_loader = DataLoader(
        train_set, batch_size=batch_size, shuffle=True, num_workers=0, pin_memory=False
    )
    val_loader = DataLoader(
        val_set, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=False
    )
    test_loader = DataLoader(
        test_set, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=False
    )

    return train_loader, val_loader, test_loader, detected_classes
