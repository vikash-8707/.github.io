# Dynamic Altair Violin & Density Studio (`chart2`)

An interactive, high-performance web application and API built with **Altair**, **Vega-Lite**, and **FastAPI**. It turns static Altair `transform_density` violin plots into a dynamic visual analytics dashboard.

---

## Quick Start

### 1. Launch the Server
From the project root:
```bash
python3 chart2/run.py
```
Or with uvicorn:
```bash
uvicorn chart2.main:app --port 8001 --reload
```

### 2. Open in Browser
- **Interactive Dashboard & 3D Studio**: [http://127.0.0.1:8001](http://127.0.0.1:8001)
- **Standalone 3D Car Model View**: [http://127.0.0.1:8001/embed/3d](http://127.0.0.1:8001/embed/3d)
- **Standalone 2D Density Embed**: [http://127.0.0.1:8001/embed](http://127.0.0.1:8001/embed)
- **Interactive API Documentation**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## Features

- **PostgreSQL Database Backend (`auth_db`)**:
  - Live SQLAlchemy connection querying `cars_data`.
  - Live connection health status badge in header.
  - Query distinct vehicles, numeric aggregations, and filtered records directly from PostgreSQL.
- **Interactive Three.js WebGL 3D Car Studio**:
  - Sculpted sports car with aerodynamic curves, spoiler, tinted glass, detailed wheels, and brake calipers.
  - Realistic automotive PBR materials (`MeshPhysicalMaterial`) with clearcoat, roughness, and metalness reflections.
  - Paint palette: Crimson Red, Electric Cyan, Midnight Onyx, Liquid Gold, Racing Green, Pearl White, Cyber Violet.
  - Finish presets: Metallic Gloss, Satin Matte, Chrome Mirror, Cyber Wireframe.
  - Interactive OrbitControls (rotate, zoom, pan) with 5 camera presets (3/4 Cinematic, Front, Side, Rear, Top).
  - Wheel spin and auto-rotation tied to real engine horsepower.
  - Hotspot part inspection: Click glowing spheres on the car to inspect **Engine**, **Wheels**, **Cabin**, or **Exhaust**.
- **Dynamic Altair Density / Violin Plots**:
  - Explore distributions of `Miles_per_Gallon`, `Horsepower`, `Displacement`, `Weight_in_lbs`, and `Acceleration`.
  - Facet by `Origin`, `Cylinders`, or `Year`.
  - Bandwidth slider, Extent sliders, Symmetric Violin (`center`) vs Half-Density (`zero`).
- **Developer Tools**:
  - Live generated Python Altair code.
  - Vega-Lite 5 JSON specification inspector.
  - Embeddable iframe views (`/embed` and `/embed/3d`).

---

## Iframe Embedding

You can embed the chart into any website or report with custom query parameters:

```html
<iframe
    src="http://127.0.0.1:8001/embed?metric=Miles_per_Gallon&groupby=Origin&theme=dark&stack=center"
    width="100%"
    height="480"
    frameborder="0"
    style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>
```

### Supported Embed Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `metric` | string | `Miles_per_Gallon` | Numeric column for Y-axis |
| `groupby` | string | `Origin` | Categorical column for facet columns & colors |
| `bandwidth` | float | auto | KDE smoothing bandwidth |
| `stack` | string | `center` | `center` for symmetric violin, `zero` for half density |
| `width` | int | `110` | Width per column facet in pixels |
| `spacing` | int | `4` | Spacing between column facets |
| `color_scheme` | string | `tableau10` | Vega color palette name |
| `opacity` | float | `0.85` | Density area opacity (0.1 - 1.0) |
| `theme` | string | `dark` | `dark` or `light` |
| `origins` | string | None | Comma-separated origins, e.g. `USA,Japan` |
| `cylinders` | string | None | Comma-separated cylinders, e.g. `4,6` |
| `min_year` | int | `1970` | Filter minimum production year |
| `max_year` | int | `1982` | Filter maximum production year |

---

## File Structure

```
chart2/
├── chart_generator.py   # Altair violin chart builder, dark/light themes, code generator
├── database.py          # Data provider, filtering, schema, and statistical calculations
├── main.py              # FastAPI server (Dashboard, Embed, REST API)
├── run.py               # Launcher on port 8001
├── README.md            # Documentation
└── static/
    ├── app.js           # Client reactive state, Vega-Embed renderer, and UI logic
    ├── index.html       # Modern glassmorphic dashboard HTML
    └── style.css        # Premium typography, animations, responsive design
```
