# Flourish 3D Viewer v4.0.1 (Ridgeline Surface Elevation Model)

An interactive, pixel-accurate WebGL 3D reproduction of the Flourish Studio 3D Viewer ridgeline elevation visualization.

## Features

- **High-Performance Three.js Engine**: Built with Three.js (r128) and OrbitControls for silky-smooth 60fps WebGL rendering.
- **Sculpted 3D Ridgeline Surface**:
  - 10 distinct extruded ribbon layers with smooth Catmull-Rom spline mountain peaks and valleys.
  - Seamless color gradient transitioning from **Electric Cyan** (`#06b6d4`) in the back to **Radiant Magenta** (`#ec4899`) in the front.
  - Crisp crest highlight strokes defining peak silhouettes.
- **Studio Pedestal & Markings**:
  - Circular dark graphite platter (`#1e232b`) with beveled edge catching specular highlights.
  - Dynamic high-resolution canvas texture mapping:
    - X-Axis month ticks along the front edge angled at 50°.
    - Z-Axis category labels and color pill badges along the left edge.
    - Soft contact shadow on the studio ground plane.
- **Studio Lighting**: Key, fill, and rim lighting with soft directional shadows (PCFSoftShadowMap).
- **Interactive Controls**:
  - **OrbitControls**: Left-click drag to rotate 360°, mouse wheel / pinch to zoom, right-click drag to pan.
  - **Camera View Presets**: Isometric (default), Front Elevation, Side Profile, and Top-Down Plan view.
  - **Turntable Mode**: Smooth automated 360° rotation showcase mode.
  - **Raycasting & Tooltips**: Hover over any 3D ridge to view peak metrics, average values, and category details.
  - **Fullscreen**: Toggleable fullscreen matching the bottom-right expand icon in the Flourish viewer.

## Running Locally

Open `index.html` in any modern web browser or serve via:
```bash
open chart_9/index.html
```
