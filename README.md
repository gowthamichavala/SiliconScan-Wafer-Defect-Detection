# SiliconScan AI: Semiconductor Wafer Defect Detection & Explainable AI

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![PyTorch 2.x](https://img.shields.io/badge/PyTorch-2.x-EE4C2C.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A genuine, end-to-end academic AI engineering platform designed for automated semiconductor wafer-map defect classification and interpretability. The system inspects silicon wafer maps, identifies 9 canonical defect topologies using a custom deep Convolutional Neural Network (CNN), computes confidence metrics and real-time inference latency, generates **Grad-CAM (Gradient-weighted Class Activation Mapping)** heatmaps highlighting defect regions, logs historical inspections in an SQLite database, and presents actionable telemetry through a modern cleanroom-inspired React dashboard.

---

## Table of Contents
- [Project Overview](#project-overview)
- [The 9 Defect Topologies](#the-9-defect-topologies)
- [System Architecture](#system-architecture)
- [Explainable AI: Grad-CAM](#explainable-ai-grad-cam)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Installation & Setup](#installation--setup)
- [Dataset Generation & Inspection](#dataset-generation--inspection)
- [Model Training & Evaluation](#model-training--evaluation)
- [Running the Backend & Frontend](#running-the-backend--frontend)
- [REST API Reference](#rest-api-reference)
- [Docker Deployment](#docker-deployment)
- [Screenshots & UI Showcase](#screenshots--ui-showcase)
- [Git & GitHub Submission Guidelines](#git--github-submission-guidelines)

---

## Project Overview

In semiconductor manufacturing cleanrooms, thousands of integrated circuit (IC) dies are fabricated concurrently on single crystalline silicon wafer discs. Chemical vapor deposition (CVD), photolithography, wet etching, chemical-mechanical planarization (CMP), and thermal annealing processes frequently introduce microscopic defects.

Traditional manual visual inspection under high-magnification optical microscopes or automated optical inspection (AOI) without deep spatial context cannot keep up with high wafer throughput. **SiliconScan AI** solves this challenge by implementing:
1. **Automated Wafer Map Preprocessing**: High-performance normalization, circular disc masking, and die array filtering.
2. **Deep CNN Defect Classifier**: 4-stage convolutional feature extractor with adaptive pooling and regularization trained across 9 canonical WM-811K defect categories.
3. **Explainable AI (Grad-CAM)**: Visual gradient backpropagation revealing exact spatial activations to assist cleanroom process engineers with root-cause failure analysis.
4. **FastAPI Inspection Service**: High-throughput REST API supporting single wafer inspection and multi-wafer batch processing.
5. **Interactive Cleanroom Dashboard**: Dark-mode industrial web interface for real-time inspection, opacity-blended Grad-CAM exploration, batch CSV exports, and audit history.

---

## The 9 Defect Topologies

SiliconScan AI is calibrated to detect the 9 canonical defect patterns defined in semiconductor manufacturing benchmarks (e.g. WM-811K):

| # | Class Name | Physical Appearance | Cleanroom Root Cause |
|---|---|---|---|
| 1 | **Normal** | Homogeneous die array with high yield | Cleanroom process operating within standard tolerance limits. |
| 2 | **Center** | Concentrated cluster of failed dies at wafer center | CVD gas injector non-uniformity, center-biased CMP downward pressure. |
| 3 | **Donut** | Concentric annular ring between center and edge | Furnace thermal annealing temperature gradients, slurry flow pooling. |
| 4 | **Edge-Loc** | Localized defect cluster on perimeter bevel | Robotic wafer end-effector pincers, vacuum wand edge contact, cassette clamping. |
| 5 | **Edge-Ring** | Continuous or semi-continuous ring along entire edge | Edge Bead Removal (EBR) solvent failure, photoresist spin-off buildup. |
| 6 | **Loc** | Localized off-center defect patch | Localized airborne micro-droplet, lithography reticle dust, localized etch mask error. |
| 7 | **Near-full** | Massive defect coverage across almost all dies | Catastrophic vacuum chamber failure, furnace thermal runaway, massive chemical leak. |
| 8 | **Random** | Uniformly scattered point defects without clustering | Ambient airborne cleanroom particles, dielectric micro-voids, crystal lattice defects. |
| 9 | **Scratch** | Linear or curvilinear scratch mark traversing dies | Mechanical wafer handling abrasion, robotic gripper slip, loose abrasive CMP particles. |

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          SiliconScan AI Flow                           │
└────────────────────────────────────────────────────────────────────────┘

  [ Wafer Image (.png, .jpg, .bmp) ]
                 │
                 ▼
  ┌───────────────────────────────┐
  │  backend/preprocessing.py      │ ── Grayscale conversion, 64x64 bilinear
  │  Die Grid Normalization       │    resampling, PyTorch tensor standardization
  └──────────────┬────────────────┘
                 │
                 ▼
  ┌───────────────────────────────┐
  │  ml/model.py (WaferCNN)       │ ── 4 Conv2D Stages + BatchNorm + ReLU
  │  Deep Feature Extraction      │    Receptive field tuned for wafer geometry
  └──────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌───────────┐     ┌───────────────────────────┐
  │ Softmax   │     │ backend/gradcam.py        │
  │ Logits &  │     │ Gradient Backpropagation  │ ── Feature Map Hooks
  │ Conf. %   │     │ Spatial Activation Heatmap│    Bilinear Jet Overlay
  └─────┬─────┘     └─────────────┬─────────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
  ┌───────────────────────────────┐
  │ backend/main.py (FastAPI)     │ ── Logs inspection to SQLite (wafer_history.db)
  │ REST API Endpoints            │    Saves original & heatmap images to uploads/
  └──────────────┬────────────────┘
                 │
                 ▼
  ┌───────────────────────────────┐
  │ frontend/ (React 18 + Vite)   │ ── Live inspection gauge, Grad-CAM blend slider,
  │ Cleanroom Industrial UI       │    batch lot processing, CSV export, model stats
  └───────────────────────────────┘
```

---

## Explainable AI: Grad-CAM

Gradient-weighted Class Activation Mapping calculates the gradients of the score for target defect class \(c\) with respect to the feature activation maps \(A^k\) of the final convolutional layer:

1. **Neuron Importance Weights \(\alpha_k^c\)** via Global Average Pooling:
   $$\alpha_k^c = \frac{1}{Z} \sum_{i} \sum_{j} \frac{\partial y^c}{\partial A_{i,j}^k}$$

2. **Localization Heatmap \(L_{\text{Grad-CAM}}^c\)** via Rectified Linear Combination:
   $$L_{\text{Grad-CAM}}^c = \text{ReLU}\left(\sum_{k} \alpha_k^c A^k\right)$$

3. **Colormap Overlay**:
   The activation map is scaled to the wafer resolution, converted through a `jet` colormap, and alpha-blended with the original die grid:
   $$I_{\text{overlay}} = (1 - \alpha) \cdot I_{\text{original}} + \alpha \cdot I_{\text{heatmap}}$$

---

## Tech Stack

### Machine Learning & Vision
- **PyTorch 2.x**: Custom convolutional neural network (`WaferCNN`)
- **Torchvision**: Grayscale conversions, geometric augmentations, tensor transforms
- **Scikit-Learn**: Stratified train/test partitioning, classification reports, confusion matrix
- **Matplotlib**: High-resolution confusion matrix generation and loss curves
- **NumPy & Pillow**: Die grid matrix operations and image rasterization

### Backend API & Database
- **FastAPI**: Asynchronous REST framework
- **Uvicorn**: High-performance ASGI server
- **SQLite & SQLAlchemy**: Historical prediction audit trail and persistence
- **Pydantic v2**: Strict request/response validation schemas

### Frontend Client
- **React 18**: Component-driven responsive interface
- **Vite 6**: Fast build tooling and HMR
- **Tailwind CSS**: Custom dark-mode semiconductor cleanroom styling
- **Lucide React**: Clean iconography

---

## Project Directory Structure

```
Wafer detection/
│
├── backend/
│   ├── main.py                # FastAPI endpoints, static mounts, and lifespan
│   ├── inference.py           # Real inference engine with Grad-CAM execution
│   ├── model.py               # WaferCNN PyTorch architecture
│   ├── preprocessing.py       # Image resizing, grayscale normalization
│   ├── gradcam.py             # Grad-CAM hooks, heatmap generation & blending
│   ├── database.py            # SQLite ORM models and history queries
│   ├── schemas.py             # Pydantic v2 response & request schemas
│   ├── requirements.txt       # Backend dependencies
│   ├── Dockerfile             # Backend container configuration
│   └── uploads/               # Stored wafer inputs and Grad-CAM heatmaps
│
├── ml/
│   ├── config.py              # Class definitions, image size, hyperparameters
│   ├── model.py               # Shared WaferCNN definition
│   ├── data.py                # Dataset loaders and stratified splitting
│   ├── generate_dataset.py    # Realistic wafer pattern generator (9 classes)
│   ├── inspect_dataset.py     # Dataset validation and distribution plot
│   ├── train.py               # CNN training loop with checkpoint saving
│   ├── evaluate.py            # Test split evaluation and confusion matrix
│   ├── predict.py             # Standalone CLI prediction & Grad-CAM tool
│   ├── dataset/               # Folder-based image dataset organized by class
│   └── checkpoints/           # Saved PyTorch model weights (best_wafer_cnn.pth)
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar
│   │   ├── pages/             # Dashboard, Single, Batch, History, Metrics, About
│   │   ├── services/api.js    # API client service
│   │   ├── App.jsx            # Top-level view routing
│   │   ├── main.jsx           # React DOM root
│   │   └── index.css          # Tailwind base & custom glow styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── results/                   # Real confusion matrix, metrics JSON, loss plots
├── samples/                   # Curated sample wafers for instant 1-click UI testing
├── docker-compose.yml
├── start.ps1                  # Windows PowerShell one-click launch script
├── .gitignore
└── README.md
```

---

## Installation & Setup

### Prerequisites
- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & **npm**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/wafer-defect-detection.git
cd wafer-defect-detection
```

### 2. Python Virtual Environment Setup
```bash
# Windows
py -3.13 -m venv .venv
.\.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## Dataset Generation & Inspection

SiliconScan AI includes an authentic, physics-grounded synthetic wafer map generator matching all 9 canonical defect classes according to cleanroom manufacturing dynamics.

### Generate Balanced Dataset
```bash
python ml/generate_dataset.py --count 150
```
This generates 150 unique wafer maps per class (1,350 total images) in `ml/dataset/<class_name>/` and pre-bundles reference test samples in `samples/`.

### Inspect & Validate Dataset
```bash
python ml/inspect_dataset.py
```
This validates image resolutions, ensures 0 missing files, outputs summary statistics, and saves the class distribution graph to `results/class_distribution.png`.

*Note: You can also place external real WM-811K image folders directly inside `ml/dataset/`!*

---

## Model Training & Evaluation

### 1. Train the CNN Model
```bash
python ml/train.py
```
- Trains `WaferCNN` across 8 epochs using stratified train/val/test splits (70/15/15).
- Evaluates validation accuracy after every epoch.
- Saves the highest-performing model weights to `ml/checkpoints/best_wafer_cnn.pth`.
- Saves loss and accuracy history plots to `results/training_curves.png`.

### 2. Evaluate on the Unseen Test Split
```bash
python ml/evaluate.py
```
- Tests the saved checkpoint on the independent test set.
- Calculates genuine **Accuracy**, **Macro Precision**, **Macro Recall**, and **Macro F1-Score**.
- Computes per-class performance tables.
- Renders the 9x9 confusion matrix image to `results/confusion_matrix.png`.
- Outputs scientific results to `results/metrics.json`.

### 3. CLI Prediction & Grad-CAM Verification
Test inference on a single wafer directly from your terminal:
```bash
python ml/predict.py --image samples/Center_sample.png --output-cam results/center_gradcam.png
```

---

## Running the Backend & Frontend

### Quick Start (Windows PowerShell)
Run the bundled PowerShell script to start both the FastAPI backend and Vite frontend concurrently:
```powershell
.\start.ps1
```

### Manual Start

#### Terminal 1: Backend
```bash
# Activate .venv
.\.venv\Scripts\activate

# Run FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
Access the Dashboard at: [http://localhost:5173](http://localhost:5173)

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status, model loading state, compute device (CPU/CUDA), PyTorch version |
| `POST` | `/api/predict` | Upload single wafer image (`multipart/form-data`), run CNN + Grad-CAM, log to SQLite |
| `POST` | `/api/batch-predict` | Upload multiple wafer files, process lot, compute yield rate, log to SQLite |
| `GET` | `/api/history` | Query inspection audit log with pagination (`limit`, `offset`) and defect filters |
| `GET` | `/api/history/stats` | Aggregated KPIs: total inspected, normal vs. defective count, defect rate, average latency |
| `DELETE` | `/api/history/{id}` | Delete specific inspection record |
| `DELETE` | `/api/history` | Clear all historical inspection logs |
| `GET` | `/api/metrics` | Retrieve real model evaluation metrics, per-class report, and confusion matrix URL |
| `GET` | `/api/samples` | List pre-bundled sample wafers for 1-click test inspections |

---

## Docker Deployment

To run the entire system in isolated Docker containers:

```bash
docker-compose up --build
```
- Backend will be available at `http://localhost:8000`
- Frontend will be available at `http://localhost:5173`

---

## Screenshots & UI Showcase

*(Add your application screenshots here for your academic report or repository README)*

1. **Fab Overview Dashboard**: Real-time KPIs, defect distribution chart, recent predictions log.
2. **Single Wafer Inspection**: Side-by-side original wafer map and Grad-CAM spatial activation heatmap with blend opacity control.
3. **Batch Processing Table**: Multi-wafer lot inspection with yield rate summary and CSV download.
4. **Model Performance & Confusion Matrix**: 9x9 confusion matrix and per-class scientific precision/recall/F1 metrics.

---

## Git & GitHub Submission Guidelines

```bash
# Initialize git repository
git init
git add .
git commit -m "feat: complete end-to-end semiconductor wafer defect detection system with Grad-CAM and FastAPI"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/your-username/wafer-defect-detection.git
git push -u origin main
```

---

## License & Academic Integrity

This project is submitted as an academic computer vision engineering capstone. All model metrics and evaluation benchmarks are computed from actual model evaluation runs on verified test data.
