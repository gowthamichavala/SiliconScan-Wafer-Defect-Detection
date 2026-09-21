import io
from typing import Tuple, Union
from PIL import Image
import torch
from torchvision import transforms

IMAGE_SIZE = 64

# Standard inference transform
eval_transforms = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])
])

def load_and_preprocess_image(
    image_source: Union[bytes, io.BytesIO, str]
) -> Tuple[Image.Image, torch.Tensor]:
    """
    Loads an image from raw bytes, BytesIO, or file path, validates it,
    and returns both the original PIL Image and the normalized (1, 1, 64, 64) PyTorch tensor.
    """
    if isinstance(image_source, bytes):
        pil_img = Image.open(io.BytesIO(image_source))
    elif isinstance(image_source, io.BytesIO):
        pil_img = Image.open(image_source)
    elif isinstance(image_source, str):
        pil_img = Image.open(image_source)
    else:
        raise ValueError(f"Unsupported image input type: {type(image_source)}")

    # Convert to RGB if needed to ensure standard PIL handling, then load
    pil_img.load()

    # Preprocess into normalized tensor for WaferCNN
    tensor = eval_transforms(pil_img)
    # Add batch dimension: (1, 1, 64, 64)
    tensor = tensor.unsqueeze(0)

    return pil_img, tensor
