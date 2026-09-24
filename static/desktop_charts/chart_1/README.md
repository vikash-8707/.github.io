# 3D Interactive Drag Marker Map (Flourish Style)

This folder contains Python scripts that replicate the **Flourish 3D Marker Map (Klokantech 3D / OpenMapTiles)** with 3D extruded buildings, custom numbered markers, and full 3D drag/tilt/rotate controls.

---

## 📁 Files in this Folder

1. **`make_3d_map.py`** (Recommended)
   - Generates a standalone, self-contained interactive 3D map matching Flourish's exact design.
   - Built on MapLibre GL and OpenFreeMap Liberty (OpenMapTiles with 3D buildings).
   - Zero API keys required (100% free and open-source).
   - Output: `index.html`.

2. **`pydeck_3d_map.py`**
   - Alternative implementation using `pydeck` (Deck.gl wrapper for Python).
   - Great for data science pipelines, Pandas DataFrames, and Jupyter Notebooks.
   - Output: `pydeck_map.html`.

3. **`index.html`**
   - Pre-rendered, ready-to-view 3D interactive map.

---

## 🚀 How to Run & View

### 1. View the map in your browser
Double-click `index.html` or open it from terminal:
```bash
open index.html
```

### 2. Re-run or generate with Python
```bash
python3 make_3d_map.py
```

---

## 🎮 How to Interact with the 3D Map
- **Left Click + Drag:** Pan across the map.
- **Right Click + Drag** (or **Ctrl + Drag**): Tilt into 3D and rotate the camera.
- **Scroll Wheel:** Zoom in and out.
- **Click any marker:** Opens an info popup with descriptions.

---

## ⚙️ How to Customize Your Locations

Open [make_3d_map.py](file:///Users/vikashkumarbharti/.gemini/antigravity-ide/scratch/chart/make_3d_map.py) and modify the `landmarks` list:

```python
landmarks = [
    {
        "id": 1,
        "title": "Your Custom Landmark",
        "lat": 51.5055,   # Latitude
        "lng": -0.0754,   # Longitude
        "desc": "Add any notes, description, or stats here."
    }
]
```

To change camera position and 3D angle:
- `pitch`: 3D tilt angle (`0` is flat top-down 2D, `60` is deep 3D perspective).
- `bearing`: Compass rotation in degrees (`0` faces North, `-30` rotates camera slightly north-east).
- `zoom`: Zoom level (`14` to `17` is ideal for 3D buildings).
