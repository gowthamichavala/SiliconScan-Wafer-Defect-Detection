import io
import base64
from typing import Tuple
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
import matplotlib.cm as cm

class GradCAM:
    """
    Gradient-weighted Class Activation Mapping (Grad-CAM) for Convolutional Neural Networks.
    Provides visual interpretability for wafer defect predictions by highlighting the
    regions of the wafer map that influenced the classification decision.
    """
    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        # Register forward and backward hooks
        self._forward_hook = self.target_layer.register_forward_hook(self._save_activations)
        self._backward_hook = self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        # grad_output is a tuple; grad_output[0] is the gradient w.r.t the layer's output
        self.gradients = grad_output[0].detach()

    def generate_cam(self, input_tensor: torch.Tensor, target_class: int = None) -> np.ndarray:
        """
        Generates 2D Grad-CAM heatmap for a single input image tensor (1, C, H, W).
        Returns normalized heatmap array of shape (H, W) in range [0, 1].
        """
        self.model.eval()
        self.model.zero_grad()

        # Forward pass
        logits = self.model(input_tensor)

        if target_class is None:
            target_class = logits.argmax(dim=1).item()

        score = logits[0, target_class]
        score.backward(retain_graph=True)

        gradients = self.gradients[0]     # Shape: (C, H, W)
        activations = self.activations[0] # Shape: (C, H, W)

        # Global average pooling of gradients over spatial dimensions (H, W)
        weights = torch.mean(gradients, dim=(1, 2), keepdim=True)  # Shape: (C, 1, 1)

        # Weighted combination of activation maps
        cam = torch.sum(weights * activations, dim=0)               # Shape: (H, W)
        cam = torch.relu(cam)

        cam_np = cam.cpu().numpy()

        # Normalize to [0, 1]
        max_val = np.max(cam_np)
        min_val = np.min(cam_np)
        if max_val - min_val > 1e-8:
            cam_np = (cam_np - min_val) / (max_val - min_val)
        else:
            cam_np = np.zeros_like(cam_np)

        return cam_np

    def overlay_heatmap(
        self,
        original_img: Image.Image,
        cam_np: np.ndarray,
        alpha: float = 0.5,
        colormap_name: str = "jet"
    ) -> Tuple[Image.Image, Image.Image]:
        """
        Overlays Grad-CAM heatmap onto the original wafer image.
        Returns:
            heatmap_img: standalone colored heatmap Image
            overlay_img: blended image of original wafer and colored heatmap
        """
        orig_w, orig_h = original_img.size

        # Resize CAM to match original image dimensions using bilinear interpolation
        cam_pil = Image.fromarray((cam_np * 255).astype(np.uint8))
        cam_resized = cam_pil.resize((orig_w, orig_h), Image.Resampling.BILINEAR)
        cam_norm = np.array(cam_resized, dtype=np.float32) / 255.0

        # Apply colormap (e.g. Jet)
        import matplotlib
        cmap = matplotlib.colormaps[colormap_name]
        heatmap_rgba = cmap(cam_norm)  # Float array in [0, 1] of shape (H, W, 4)
        heatmap_rgb = (heatmap_rgba[:, :, :3] * 255).astype(np.uint8)
        heatmap_img = Image.fromarray(heatmap_rgb)

        # Prepare original as RGB
        orig_rgb = original_img.convert("RGB")
        orig_arr = np.array(orig_rgb, dtype=np.float32)

        # Blend original and heatmap
        overlay_arr = (1.0 - alpha) * orig_arr + alpha * heatmap_rgb.astype(np.float32)
        overlay_arr = np.clip(overlay_arr, 0, 255).astype(np.uint8)
        overlay_img = Image.fromarray(overlay_arr)

        return heatmap_img, overlay_img

    def close(self):
        """Remove hooks to prevent memory leaks."""
        self._forward_hook.remove()
        self._backward_hook.remove()

def image_to_base64(img: Image.Image, format: str = "PNG") -> str:
    """Converts PIL Image to base64 data URI string."""
    buf = io.BytesIO()
    img.save(buf, format=format)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64,{encoded}"
