# Flourish Sankey Diagram (v13.0.1)

A complete, pixel-accurate replica of the **Flourish Studio Sankey diagram (v13.0.1)** built with **D3.js v7** and **d3-sankey**.

Visualizes the classic **Lawrence Livermore National Laboratory (LLNL) US Energy Flow diagram (2017)** in quadrillion BTUs (quads), featuring the highlighted **Petroleum → Industrial (8.38 quads)** flow ribbon with gradient transitions and the live Flourish settings sidebar.

---

## 📁 Files in `chart_6`

1. **`index.html`**:
   - The interactive canvas stage containing the Sankey visualization and the Flourish sidebar controls.
   - Includes controls for **Alignment** (`Justify`, `Left`, `Right`, `Center`), **Iterations**, **Mode selection**, and **Sorting**.
2. **`sankey.js`**:
   - Reusable `FlourishSankey` class built on D3.js and `d3-sankey`.
   - Generates dynamic two-color `<linearGradient>` ribbons matching the source and target node colors.
   - Renders the interactive **8.38** value pill badge in the center of the active flow.
   - Interactive focus/defocus states on hover and click for both links and nodes.
3. **`data.js`**:
   - Exact 2017 LLNL energy dataset with 17 balanced nodes across sources, electricity generation, end-use sectors, and final outputs (Rejected Energy & Energy Services).
4. **`style.css`**:
   - Clean Flourish Studio aesthetic, segmented button controls, toggle sliders, and modern typography.
5. **`embed-example.html`**:
   - Standalone embed snippet showing how to embed only the Sankey chart into any dashboard or web application.

---

## 🚀 How to Run

Open `index.html` directly in your browser:

```bash
open index.html
```

Or view with any static HTTP server:

```bash
npx serve .
# or
python3 -m http.server 8080
```
