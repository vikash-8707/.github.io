# Isotype Visualization (1 BHK & 2 BHK Flat Inventory)

A clean, responsive **Isotype pictogram visualization** built with vanilla JavaScript, CSS, and SVG, adapted from the **Vega-Altair Isotype bar chart gallery** (`https://altair-viz.github.io/gallery/isotype.html`).

Substitutes the original animal pictograms (cattle, pigs, sheep) with **1 BHK, 2 BHK, and 3 BHK residential flat/apartment floorplan pictograms** across residential towers.

---

## 📁 Files in `chart_7`

1. **`index.html`**:
   - The main visualization page replicating the Vega-Altair gallery layout.
   - Includes interactive filter buttons (`All Flats`, `1 BHK`, `2 BHK`, `3 BHK`) and real-time inventory counter adjusters (`+` / `−`).
   - Includes syntax-highlighted code tabs (`Method syntax` | `Attribute syntax`) with a "Copy code" button.
2. **`isotype.js`**:
   - Reusable `IsotypeFlatChart` component.
   - Generates vector-sharp SVG apartment floorplans with interior room dividers, windows, and balcony cutouts.
   - Interactive unit hover tooltips displaying unit codes, carpet area, estimated price, and layout specs.
   - Action menu (`•••`) with options to export as PNG/SVG.
3. **`data.js`**:
   - Data structure containing towers (`Tower A (Downtown)` and `Tower B (Suburban)`) and flat counts matching the exact proportions of the Altair example.
   - Color palettes:
     - **1 BHK**: Terracotta / Coral (`#c85a48`)
     - **2 BHK**: Charcoal Slate (`#374151`)
     - **3 BHK**: Steel Blue (`#4a7c92`)
4. **`style.css`**:
   - Clean, modern layout matching the Altair documentation page, rotated vertical labels, and tooltips.
5. **`embed-example.html`**:
   - Minimal standalone embed snippet for integrating the chart into any web app.

---

## 🚀 How to Run

Open `index.html` directly in your browser:

```bash
open index.html
```

Or serve with any static web server:

```bash
npx serve .
# or
python3 -m http.server 8080
```
