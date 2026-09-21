import os
import math
import random
from pathlib import Path
import numpy as np
from PIL import Image

from config import DATASET_DIR, SAMPLES_DIR, CLASSES, IMAGE_SIZE, RANDOM_SEED

def create_wafer_disc(size=IMAGE_SIZE, radius=None):
    """Generates base wafer mask and die grid background."""
    if radius is None:
        radius = size // 2 - 3
    center = size / 2.0 - 0.5
    y, x = np.ogrid[:size, :size]
    dist_from_center = np.sqrt((x - center)**2 + (y - center)**2)
    wafer_mask = dist_from_center <= radius

    # Base wafer background: medium gray (die level ~128) with subtle fabrication noise
    base = np.zeros((size, size), dtype=np.uint8)
    die_noise = np.random.randint(118, 136, size=(size, size), dtype=np.uint8)
    base[wafer_mask] = die_noise[wafer_mask]

    # Outline wafer edge slightly (notch / bevel edge contrast)
    edge_mask = (dist_from_center <= radius) & (dist_from_center >= radius - 1.5)
    base[edge_mask] = np.clip(base[edge_mask] + 25, 0, 255)

    return base, wafer_mask, dist_from_center, (center, center), radius

def add_defect_pixels(canvas, mask, coords, intensity_range=(230, 255)):
    """Applies bright defect die pixels onto the wafer within the valid mask."""
    for r, c in coords:
        if 0 <= r < canvas.shape[0] and 0 <= c < canvas.shape[1] and mask[r, c]:
            val = random.randint(intensity_range[0], intensity_range[1])
            canvas[r, c] = val

def generate_normal(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    # Rare random isolated single noise dies (0-3 dies max)
    noise_count = random.randint(0, 3)
    coords = []
    for _ in range(noise_count):
        coords.append((random.randint(0, size - 1), random.randint(0, size - 1)))
    add_defect_pixels(canvas, mask, coords, (200, 240))
    return canvas

def generate_center(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    cy, cx = center
    # Center jitter slightly
    cy += random.uniform(-2.5, 2.5)
    cx += random.uniform(-2.5, 2.5)
    sigma = random.uniform(4.0, 7.5)

    y, x = np.ogrid[:size, :size]
    d2 = (x - cx)**2 + (y - cy)**2
    prob = np.exp(-d2 / (2 * (sigma**2)))
    density = random.uniform(0.70, 0.95)

    defect_coords = []
    for r in range(size):
        for c in range(size):
            if mask[r, c] and prob[r, c] > 0.15:
                if random.random() < prob[r, c] * density:
                    defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_donut(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    cy, cx = center
    cy += random.uniform(-1.5, 1.5)
    cx += random.uniform(-1.5, 1.5)

    ring_r = random.uniform(9.0, 16.0)
    ring_w = random.uniform(2.5, 4.5)

    y, x = np.ogrid[:size, :size]
    curr_d = np.sqrt((x - cx)**2 + (y - cy)**2)
    ring_dist = np.abs(curr_d - ring_r)

    prob = np.exp(-(ring_dist**2) / (2 * (ring_w**2)))
    # Occasionally make donut arc partial or variable density
    angle = np.arctan2(y - cy, x - cx)
    arc_mask = np.ones_like(prob)
    if random.random() < 0.25:
        cutoff = random.uniform(-math.pi, math.pi)
        span = random.uniform(math.pi * 1.2, math.pi * 1.8)
        arc_mask = ((angle - cutoff) % (2 * math.pi)) < span

    defect_coords = []
    for r in range(size):
        for c in range(size):
            if mask[r, c] and prob[r, c] > 0.25 and arc_mask[r, c]:
                if random.random() < prob[r, c] * random.uniform(0.75, 0.95):
                    defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_edge_loc(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    cy, cx = center
    angle = random.uniform(0, 2 * math.pi)
    target_x = cx + (radius - 2.5) * math.cos(angle)
    target_y = cy + (radius - 2.5) * math.sin(angle)

    sigma_r = random.uniform(3.0, 5.0)
    sigma_a = random.uniform(4.0, 7.0)

    defect_coords = []
    y, x = np.ogrid[:size, :size]
    curr_d = np.sqrt((x - target_x)**2 + (y - target_y)**2)
    prob = np.exp(-(curr_d**2) / (2 * (sigma_r**2)))

    for r in range(size):
        for c in range(size):
            if mask[r, c] and prob[r, c] > 0.20:
                if random.random() < prob[r, c] * random.uniform(0.75, 0.95):
                    defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_edge_ring(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    ring_width = random.uniform(2.0, 4.0)

    # Perimeter defect dies
    defect_coords = []
    gap_start = random.uniform(0, 2 * math.pi)
    gap_span = random.uniform(0, math.pi * 0.4) if random.random() < 0.35 else 0

    for r in range(size):
        for c in range(size):
            if mask[r, c]:
                d = dist[r, c]
                if radius - ring_width <= d <= radius:
                    ang = math.atan2(r - center[0], c - center[1])
                    in_gap = gap_span > 0 and ((ang - gap_start) % (2 * math.pi)) < gap_span
                    if not in_gap and random.random() < random.uniform(0.70, 0.92):
                        defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_loc(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    cy, cx = center

    # Mid-range off-center location (radius between 8 and 18 pixels)
    loc_r = random.uniform(8.0, 18.0)
    loc_ang = random.uniform(0, 2 * math.pi)
    target_x = cx + loc_r * math.cos(loc_ang)
    target_y = cy + loc_r * math.sin(loc_ang)

    sigma = random.uniform(3.5, 6.0)
    y, x = np.ogrid[:size, :size]
    curr_d = (x - target_x)**2 + (y - target_y)**2
    prob = np.exp(-curr_d / (2 * (sigma**2)))

    defect_coords = []
    for r in range(size):
        for c in range(size):
            if mask[r, c] and prob[r, c] > 0.20:
                if random.random() < prob[r, c] * random.uniform(0.75, 0.95):
                    defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_near_full(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    defect_density = random.uniform(0.55, 0.85)

    defect_coords = []
    for r in range(size):
        for c in range(size):
            if mask[r, c] and random.random() < defect_density:
                defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_random(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    # Uniformly scattered defect dies (6% - 15% density)
    scatter_density = random.uniform(0.06, 0.15)

    defect_coords = []
    for r in range(size):
        for c in range(size):
            if mask[r, c] and random.random() < scatter_density:
                defect_coords.append((r, c))

    add_defect_pixels(canvas, mask, defect_coords)
    return canvas

def generate_scratch(size=IMAGE_SIZE):
    canvas, mask, dist, center, radius = create_wafer_disc(size)
    cy, cx = center

    # Scratch generated using quadratic/cubic Bezier curve
    p0 = (random.uniform(cx - 20, cx + 20), random.uniform(cy - 20, cy + 20))
    p2 = (p0[0] + random.uniform(-25, 25), p0[1] + random.uniform(-25, 25))
    p1 = ((p0[0] + p2[0]) / 2 + random.uniform(-10, 10), (p0[1] + p2[1]) / 2 + random.uniform(-10, 10))

    t_vals = np.linspace(0, 1, 80)
    defect_coords = set()

    for t in t_vals:
        xt = (1-t)**2 * p0[0] + 2*(1-t)*t * p1[0] + t**2 * p2[0]
        yt = (1-t)**2 * p0[1] + 2*(1-t)*t * p1[1] + t**2 * p2[1]

        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                rx, ry = int(round(xt + dx)), int(round(yt + dy))
                if 0 <= ry < size and 0 <= rx < size and mask[ry, rx]:
                    if random.random() < 0.85:
                        defect_coords.add((ry, rx))

    add_defect_pixels(canvas, mask, list(defect_coords))
    return canvas

GENERATORS = {
    "Normal": generate_normal,
    "Center": generate_center,
    "Donut": generate_donut,
    "Edge-Loc": generate_edge_loc,
    "Edge-Ring": generate_edge_ring,
    "Loc": generate_loc,
    "Near-full": generate_near_full,
    "Random": generate_random,
    "Scratch": generate_scratch
}

def generate_dataset(num_per_class: int = 150):
    """
    Generates a balanced dataset of semiconductor wafer maps across all 9 classes.
    """
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    print(f"Generating synthetic wafer dataset: {num_per_class} images per class (Total: {num_per_class * len(CLASSES)})...")

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

    for class_name in CLASSES:
        class_folder = DATASET_DIR / class_name
        class_folder.mkdir(parents=True, exist_ok=True)
        gen_func = GENERATORS[class_name]

        for i in range(num_per_class):
            img_arr = gen_func(IMAGE_SIZE)
            img = Image.fromarray(img_arr, mode="L")
            img_path = class_folder / f"wafer_{class_name.lower().replace('-', '_')}_{i:04d}.png"
            img.save(img_path)

        # Also save one representative sample in samples/ for UI demo testing
        sample_img_arr = gen_func(IMAGE_SIZE)
        sample_img = Image.fromarray(sample_img_arr, mode="L")
        sample_path = SAMPLES_DIR / f"{class_name}_sample.png"
        sample_img.save(sample_path)
        print(f"  [OK] Generated {num_per_class} wafers for '{class_name}' -> Sample saved: {sample_path.name}")

    print("Dataset generation complete!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate realistic semiconductor wafer dataset")
    parser.add_argument("--count", type=int, default=150, help="Number of images per class (default: 150)")
    args = parser.parse_args()
    generate_dataset(args.count)
