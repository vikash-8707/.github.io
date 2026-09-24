import os
import shutil
import subprocess
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
STATIC_THUMB_DIR = BASE_DIR / "static" / "thumbnails"
ROOT_THUMB_DIR = BASE_DIR / "thumbnails"

STATIC_THUMB_DIR.mkdir(parents=True, exist_ok=True)
ROOT_THUMB_DIR.mkdir(parents=True, exist_ok=True)

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CHARTS = [
    {
        "id": "treemap",
        "name": "treemap.png",
        "url": "http://127.0.0.1:8000/treemap",
        "budget": 4500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "sunburst",
        "name": "sunburst.png",
        "url": "http://127.0.0.1:8000/sunburst",
        "budget": 4500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart",
        "name": "chart_map.png",
        "url": "http://127.0.0.1:8000/static/chart/index.html",
        "budget": 6000,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart2",
        "name": "chart_violin.png",
        "url": "http://127.0.0.1:8000/chart2/embed?theme=light",
        "budget": 5000,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart3",
        "name": "chart_bivariate.png",
        "url": "http://127.0.0.1:8000/chart3/embed?theme=light",
        "budget": 5000,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_2",
        "name": "chart_gauge.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_2/index.html?thumb=1",
        "budget": 3500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_3",
        "name": "chart_bubble.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_3/index.html",
        "budget": 5000,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_4",
        "name": "chart_chord.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_4/index.html",
        "budget": 4500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_5",
        "name": "chart_stream.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_5/index.html",
        "budget": 4500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_6",
        "name": "chart_sankey.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_6/index.html",
        "budget": 4500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_7",
        "name": "chart_isotype.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_7/index.html",
        "budget": 4500,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_8",
        "name": "chart_indiamap.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_8/index.html",
        "budget": 5000,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "chart_9",
        "name": "chart_ridgeline.png",
        "url": "http://127.0.0.1:8000/static/desktop_charts/chart_9/index.html",
        "budget": 5000,
        "width": 1000,
        "height": 1000
    },
    {
        "id": "math",
        "name": "chart_surface.png",
        "url": "http://127.0.0.1:8000/embed",
        "budget": 5000,
        "width": 1000,
        "height": 1000
    }
]

from PIL import Image, ImageChops

def smart_crop_fit(image_path, pad_ratio=0.05):
    """Crops and pads into a 1:1 square so the chart is pixel-perfect on square cards."""
    try:
        im = Image.open(image_path).convert('RGB')
        w, h = im.size
        
        corners = [im.getpixel((2, 2)), im.getpixel((w-3, 2)), im.getpixel((2, h-3)), im.getpixel((w-3, h-3))]
        bg_color = max(set(corners), key=corners.count)
        
        bg = Image.new('RGB', (w, h), bg_color)
        diff = ImageChops.difference(im, bg)
        bbox = diff.getbbox()
        if not bbox:
            return
        
        bx0, by0, bx1, by1 = bbox
        bw = bx1 - bx0
        bh = by1 - by0
        
        # If it's already full-bleed (e.g. 3D map)
        if bw >= 0.95 * w and bh >= 0.95 * h:
            side = min(w, h)
            x0 = (w - side) // 2
            y0 = (h - side) // 2
            cropped = im.crop((x0, y0, x0 + side, y0 + side)).resize((1000, 1000), Image.Resampling.LANCZOS)
            cropped.save(image_path)
            return

        cx = (bx0 + bx1) / 2.0
        cy = (by0 + by1) / 2.0
        
        max_dim = max(bw, bh)
        side = int(max_dim * (1 + 2 * pad_ratio))
        
        sq = Image.new('RGB', (side, side), bg_color)
        x0 = int(cx - side / 2.0)
        y0 = int(cy - side / 2.0)
        x1 = x0 + side
        y1 = y0 + side
        
        src_x0 = max(0, x0)
        src_y0 = max(0, y0)
        src_x1 = min(w, x1)
        src_y1 = min(h, y1)
        
        paste_x = src_x0 - x0
        paste_y = src_y0 - y0
        
        cropped_part = im.crop((src_x0, src_y0, src_x1, src_y1))
        sq.paste(cropped_part, (paste_x, paste_y))
        
        res = sq.resize((1000, 1000), Image.Resampling.LANCZOS)
        res.save(image_path)
    except Exception as e:
        print(f"    (crop-fit notice for {image_path.name}: {e})")

import sys

# Support filtering specific charts by CLI argument: python3 create_thumbnails.py [chart_id ...]
filter_args = [a.lower() for a in sys.argv[1:] if not a.startswith("-")]
targets = [c for c in CHARTS if not filter_args or c["id"].lower() in filter_args or c["name"].lower() in filter_args]

if filter_args:
    print(f"Filtering: Generating thumbnails for {len(targets)} of {len(CHARTS)} charts ({', '.join(t['id'] for t in targets)})...")
else:
    print(f"Generating thumbnails for all {len(CHARTS)} charts...")

for i, chart in enumerate(targets, start=1):
    out_file = STATIC_THUMB_DIR / chart["name"]
    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--hide-scrollbars",
        "--mute-audio",
        "--disable-background-networking",
        f"--window-size={chart['width']},{chart['height']}",
        f"--virtual-time-budget={chart['budget']}",
        f"--screenshot={out_file}",
        chart["url"]
    ]
    print(f"[{i}/{len(targets)}] Capturing {chart['id']} -> {chart['name']} ...")
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if out_file.exists() and out_file.stat().st_size > 0:
            # Apply edge-to-edge full fit optimization
            smart_crop_fit(out_file)
            shutil.copy2(out_file, ROOT_THUMB_DIR / chart["name"])
            print(f"    ✓ Success: {out_file.stat().st_size} bytes")
        else:
            print(f"    ✗ Failed (empty file): {chart['id']}")
    except Exception as e:
        print(f"    ✗ Error: {e}")

print("Thumbnail generation complete.")
