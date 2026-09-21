import argparse
import time
from pathlib import Path
from PIL import Image
import torch
from torchvision import transforms

from config import CHECKPOINT_DIR, IMAGE_SIZE, DEFECT_DESCRIPTIONS
from model import WaferCNN
import sys
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))
from gradcam import GradCAM

def predict_cli(image_path: str, output_cam: str = None):
    print("=" * 60)
    print("SEMICONDUCTOR WAFER AI PREDICTION & GRAD-CAM")
    print("=" * 60)

    img_file = Path(image_path)
    if not img_file.exists():
        raise FileNotFoundError(f"Image not found at: {image_path}")

    ckpt_path = CHECKPOINT_DIR / "best_wafer_cnn.pth"
    if not ckpt_path.exists():
        raise FileNotFoundError(f"Trained checkpoint not found at: {ckpt_path}. Run training first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(ckpt_path, map_location=device)
    classes = ckpt["classes"]

    model = WaferCNN(num_classes=len(classes)).to(device)
    model.load_state_dict(ckpt["model_state"])
    model.eval()

    # Preprocessing
    raw_img = Image.open(img_file)
    tfm = transforms.Compose([
        transforms.Grayscale(num_output_channels=1),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])
    tensor = tfm(raw_img).unsqueeze(0).to(device)
    tensor.requires_grad = True

    # Inference
    t0 = time.perf_counter()
    logits = model(tensor)
    probs = torch.softmax(logits, dim=1)[0]
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    conf, pred_idx = probs.max(0)
    pred_class = classes[pred_idx.item()]
    conf_pct = conf.item() * 100.0

    # Grad-CAM
    cam_engine = GradCAM(model, model.get_target_layer())
    cam_np = cam_engine.generate_cam(tensor, target_class=pred_idx.item())
    heat_img, overlay_img = cam_engine.overlay_heatmap(raw_img, cam_np)

    print(f"Target Image   : {img_file.name}")
    print(f"Predicted Defect: {pred_class}")
    print(f"Confidence     : {conf_pct:.2f}%")
    print(f"Inference Time : {elapsed_ms:.2f} ms")
    print(f"Classification : {'DEFECT DETECTED' if pred_class != 'Normal' else 'NORMAL WAFER'}")
    print("\nClass Probabilities:")
    for i, c_name in enumerate(classes):
        bar = "#" * int(probs[i].item() * 25)
        print(f"  {c_name:<10}: {probs[i].item()*100:5.2f}% | {bar}")

    print(f"\nEngineering Explanation:")
    print(f"  {DEFECT_DESCRIPTIONS.get(pred_class, 'Defect detected.')}")

    if output_cam:
        out_path = Path(output_cam)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        overlay_img.save(out_path)
        print(f"\nGrad-CAM heatmap overlay saved to: {out_path}")

    print("=" * 60)
    return pred_class, conf.item()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict semiconductor wafer defect and generate Grad-CAM")
    parser.add_argument("--image", required=True, help="Path to wafer map image")
    parser.add_argument("--output-cam", default="results/sample_gradcam.png", help="Path to save Grad-CAM overlay")
    args = parser.parse_args()
    predict_cli(args.image, args.output_cam)
