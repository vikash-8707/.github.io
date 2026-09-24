# 📊 All Charts - Universal Visual Analytics Hub

A unified visualization suite combining **14 interactive chart engines** into a single dashboard.

---

## 🚀 Quick Start

### Option 1: Run the Interactive Web Server (Recommended)
```bash
cd "all charts"
python3 -m pip install -r requirements.txt
python3 run.py
```
Open **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** in your browser.

### Option 2: Standalone Local File
Double-click **`all_charts.html`** in this folder to open it directly in any browser.

---

## 📁 Directory Structure & Chart Engines

| Folder | Visualization Engine | Technology | Description |
|---|---|---|---|
| **`treemap/`** | PostgreSQL Treemap & Sunburst | Plotly Express, PostgreSQL | Nested rectangles and concentric rings by Population and continuous scale. |
| **`chart/`** | 3D Marker Map (Gurgaon) | MapLibre GL 3D, OpenFreeMap | 3D vector tile engine with 60° tilt, building extrusions, and DLF CyberHub landmarks. |
| **`chart2/`** | Altair Density & Violin Studio | Vega-Lite / Altair | Continuous probability density & violin distributions. |
| **`chart3/`** | 3D Bivariate Bar Studio | Plotly 3D WebGL, PostgreSQL | 2D histogram binning rendered as extruded 3D voxels. |
| **`chart_2/`** | Flourish Speedometer Gauge | SVG Arc, CSS 3D Shading | Single 3D speedometer dial with animated needle and dynamic physical inertia. |
| **`chart_3/`** | Packed Bubble Cluster | D3.js v7 Force Physics | Global country packed bubble cluster with force-directed physics. |
| **`chart_4/`** | Character Chord Diagram | D3.js v7 Chord & Gradients | Friends dialogue flow ribbons with two-tone linear gradients. |
| **`chart_5/`** | US Migration Stream | D3.js MonotoneX | 190-year immigration trends (1820–2009) with interactive timeline scrubber. |
| **`chart_6/`** | Sankey Energy Flow | D3.js & d3-sankey | LLNL 2017 national energy transformation flow in quads. |
| **`chart_7/`** | Isotype Flat Inventory | SVG Floorplans, Vega Style | Residential flat breakdown (1 BHK, 2 BHK, 3 BHK) with quantity counters. |
| **`chart_8/`** | India Metropolitan Map | Leaflet.js 1.9, CartoDB | 32 curated hubs across India with metro capitals and tour guides. |
| **`chart_9/`** | 3D Ridgeline Surface | Three.js (r128), WebGL 3D | 10 extruded mountain ribbon layers on graphite turntable platter. |
| **`static/`** | Shared Assets & Embeds | HTML, CSS, JS | Unified web dashboard styling and standalone iframe targets. |
| **`all_charts.html`** | Master Dashboard | Pure HTML/CSS/JS | 4-block alternating layout: `[Blank] [Chart] [Blank] [Chart]`. |
