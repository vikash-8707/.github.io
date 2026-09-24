# 📊 All Charts - Universal Visual Analytics Hub

A unified visualization suite combining **14 interactive chart engines** into a single dashboard.

---

## 🌐 Hosting on GitHub & GitHub Pages

This project is fully optimized for **GitHub Pages**. All 14 interactive charts are pre-compiled and standalone, meaning they can run on GitHub Pages without requiring an active Python backend!

### Step 1: Create a Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Name your repository (for example: `all-charts` or `interactive-charts`).
3. Leave it as **Public**. Do **not** initialize with README or .gitignore (we already created them).
4. Click **Create repository**.

### Step 2: Link & Push from Your Terminal
Run the following commands inside this directory:
```bash
# Add your GitHub remote (replace with your repository URL)
git remote add origin https://github.com/vikash-8707/all-charts.git

# Rename branch to main if not already
git branch -M main

# Push all code and charts
git push -u origin main
```

### Step 3: Enable Free GitHub Pages Hosting
1. On GitHub, go to your repository **Settings** (tab at the top).
2. In the left sidebar, click **Pages**.
3. Under **Branch**, select `main` and folder `/ (root)`.
4. Click **Save**.
5. Within 1–2 minutes, your live site will be ready at:
   ```
   https://vikash-8707.github.io/all-charts/
   ```

---

## 💻 How to Embed Any Chart "Somewhere Else"

Once published on GitHub Pages (or running locally), you can embed the entire dashboard or any specific chart inside **any other website, blog, Notion, portfolio, or CMS** using standard HTML `<iframe>` tags:

### 1. Embed the Entire Master Dashboard
```html
<iframe
  src="https://vikash-8707.github.io/all-charts/"
  width="100%"
  height="900"
  frameborder="0"
  allowfullscreen>
</iframe>
```

### 2. Embed Individual Charts
| Chart | Live Embed URL | Embed Code Snippet |
|---|---|---|
| **Flourish Speedometer** | `.../chart_2/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_2/index.html" width="100%" height="550" frameborder="0"></iframe>` |
| **Bubble Cluster** | `.../chart_3/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_3/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **Friends Chord Diagram** | `.../chart_4/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_4/index.html" width="100%" height="650" frameborder="0"></iframe>` |
| **US Migration Stream** | `.../chart_5/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_5/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **Sankey Energy Flow** | `.../chart_6/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_6/index.html" width="100%" height="650" frameborder="0"></iframe>` |
| **Isotype Inventory** | `.../chart_7/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_7/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **India Marker Map** | `.../chart_8/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_8/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **3D Ridgeline Surface** | `.../chart_9/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart_9/index.html" width="100%" height="650" frameborder="0"></iframe>` |
| **3D Marker Map (Gurgaon)** | `.../chart/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **Gapminder Treemap** | `.../treemap/treemap.html` | `<iframe src="https://vikash-8707.github.io/all-charts/treemap/treemap.html" width="100%" height="600" frameborder="0"></iframe>` |
| **Gapminder Sunburst** | `.../treemap/sunburst.html` | `<iframe src="https://vikash-8707.github.io/all-charts/treemap/sunburst.html" width="100%" height="600" frameborder="0"></iframe>` |
| **Altair Violin Studio** | `.../chart2/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart2/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **3D Bivariate Bar** | `.../chart3/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/chart3/index.html" width="100%" height="600" frameborder="0"></iframe>` |
| **3D Math Surface** | `.../math/index.html` | `<iframe src="https://vikash-8707.github.io/all-charts/math/index.html" width="100%" height="600" frameborder="0"></iframe>` |

---

## 🚀 Running Locally

### Option 1: Standalone Local File (Instant)
Double-click **`index.html`** or **`all_charts.html`** in this folder to open directly in any browser.

### Option 2: Interactive Web Server (Python Backend)
```bash
python3 -m pip install -r requirements.txt
python3 run.py
```
Open **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** in your browser.

---

## 📁 Directory Structure & Chart Engines

| Folder | Visualization Engine | Technology | Description |
|---|---|---|---|
| **`treemap/`** | PostgreSQL Treemap & Sunburst | Plotly Express | Nested rectangles and concentric rings by Population. |
| **`chart/`** | 3D Marker Map (Gurgaon) | MapLibre GL 3D, OpenFreeMap | 3D vector tile engine with 60° tilt, building extrusions. |
| **`chart2/`** | Altair Density & Violin Studio | Vega-Lite / Altair | Continuous probability density & violin distributions. |
| **`chart3/`** | 3D Bivariate Bar Studio | Plotly 3D WebGL | 2D histogram binning rendered as extruded 3D voxels. |
| **`chart_2/`** | Flourish Speedometer Gauge | SVG Arc, CSS 3D Shading | 3D speedometer dial with physical inertia. |
| **`chart_3/`** | Packed Bubble Cluster | D3.js v7 Force Physics | Country packed bubble cluster with force physics. |
| **`chart_4/`** | Character Chord Diagram | D3.js v7 Chord & Gradients | Friends dialogue flow ribbons with two-tone gradients. |
| **`chart_5/`** | US Migration Stream | D3.js MonotoneX | 190-year immigration trends (1820–2009). |
| **`chart_6/`** | Sankey Energy Flow | D3.js & d3-sankey | National energy transformation flow in quads. |
| **`chart_7/`** | Isotype Flat Inventory | SVG Floorplans, Vega Style | Residential flat breakdown (1, 2, 3 BHK). |
| **`chart_8/`** | India Metropolitan Map | Leaflet.js 1.9, CartoDB | 32 curated hubs across India with metro capitals. |
| **`chart_9/`** | 3D Ridgeline Surface | Three.js (r128), WebGL 3D | 10 extruded mountain ribbon layers on graphite turntable. |
| **`math/`** | 3D Mathematical Surface | Plotly 3D WebGL | Cubic polynomial surface with Viridis colormap. |
| **`index.html`** | Master Dashboard | Pure HTML/CSS/JS | 4-block alternating layout with modals and fullscreen views. |
