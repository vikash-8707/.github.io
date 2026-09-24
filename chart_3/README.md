# Flourish Data Explorer (Bubble Cluster) - v26.1.1

A complete, pixel-accurate replica of the **Flourish Studio Data Explorer / Bubble Cluster visualization (v26.1.1)** built with **HTML, CSS, and JavaScript (D3.js)**.

---

## 📁 Files in this Folder

1. **`index.html`**
   - The interactive visualization with the packed bubble cluster of countries.
   - Contains real-time interactive controls matching the Flourish sidebar:
     - **Position**: `None` (single cluster) vs `Region` (splits into 5 continent clusters!).
     - **Size**: `None` (uniform) vs `Population` vs `GDP`.
     - **Color**: `None` (Flourish grey) vs `Region` (colored by continent).
     - **Filter**: Filter by continent.
     - **Search (`🔍`)**: Search and highlight any country in real time.
     - **Reset Zoom (`⟲`)**: Pan & zoom controls.

2. **`bubble-chart.js`**
   - Reusable `FlourishBubbleChart` class.
   - Implements D3.js force-directed packing physics with collision detection, spring drag-and-drop, and dynamic cluster splitting.
   - Displays the exact dark badge tooltip seen in Flourish on hover.

3. **`data.js`**
   - Rich dataset of ~120 real-world countries matching the screenshot (Chad, Yemen, Italy, France, India, Peru, Antigua and Barbuda, etc.) with population, region, GDP, and capital cities.

4. **`style.css`**
   - Modern stylesheet replicating the Flourish interface and dark tooltips.

5. **`embed-example.html`**
   - A minimalist, copy-pasteable example showing how to embed this bubble chart in any webpage.

---

## 🚀 How to Run & View

Open `index.html` in your web browser:
```bash
open index.html
```

Or start a local web server:
```bash
python3 -m http.server 3000
```
Then visit `http://localhost:3000`.

---

## 🛠️ How to Embed in Another Webpage

### Step 1: Add a container `<div>` in your HTML
```html
<div id="my-bubble-chart" style="width: 100%; height: 600px;"></div>
```

### Step 2: Include D3.js and chart scripts
```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="data.js"></script>
<script src="bubble-chart.js"></script>
```

### Step 3: Initialize the Chart
```javascript
const chart = new FlourishBubbleChart('#my-bubble-chart', COUNTRIES_DATA, {
  position: 'none',   // 'none' or 'region'
  sizeBy: 'none',     // 'none', 'pop', or 'gdp'
  colorBy: 'none'     // 'none' or 'region'
});
```
