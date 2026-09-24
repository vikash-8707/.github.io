# Flourish Chord Diagram (v11.0.1)

A complete, pixel-accurate replica of the **Flourish Studio Chord Diagram visualization (v11.0.1)** built with **HTML, CSS, and JavaScript (D3.js)**.

Features the classic *Friends* character interaction flow (Phoebe, Chandler, Monica, Ross, Rachel, Joey) with two-tone linear gradient ribbons and interactive focus/defocus states.

---

## 📁 Files in this Folder

1. **`index.html`**
   - The interactive visualization with the chord flow diagram and the exact Flourish settings sidebar.
   - Includes real-time controls:
     - **Default opacity** (0.75)
     - **Focused opacity** (1.0)
     - **Defocused opacity** (0.10)
     - **Highlight chords** (focus specific pairings like Joey ⇄ Chandler or Ross ⇄ Rachel)
     - **Show chord values on hover** & **Keep on click** toggles.

2. **`chord.js`**
   - Self-contained, reusable `FlourishChordDiagram` class.
   - Built on D3.js v7 chord and ribbon geometry.
   - Handles dynamic two-color SVG linear gradients (`<linearGradient>`), smooth opacity transitions, hover focus/defocus, and dark tooltip popups.

3. **`data.js`**
   - Interaction matrix of the 6 Friends characters matching the exact arc proportions and colors from the screenshot.

4. **`style.css`**
   - Modern stylesheet replicating the Flourish interface, toggle switches, and tooltips.

5. **`embed-example.html`**
   - A minimalist, copy-pasteable example showing how to embed this chord diagram in any webpage in 4 simple steps.

---

## 🚀 How to Run & View

Open `index.html` in your web browser:
```bash
open index.html
```

Or run a local web server:
```bash
python3 -m http.server 3000
```
Then visit `http://localhost:3000`.

---

## 🛠️ How to Embed in Any Webpage

### Step 1: Add a container `<div>`
```html
<div id="my-chord-chart" style="width: 100%; max-width: 760px; height: 720px; margin: 0 auto;"></div>
```

### Step 2: Include D3.js and chart scripts
```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="data.js"></script>
<script src="chord.js"></script>
```

### Step 3: Initialize the Diagram
```javascript
const chord = new FlourishChordDiagram('#my-chord-chart', CHORD_DATA, {
  defaultOpacity: 0.75,
  focusedOpacity: 1.0,
  defocusedOpacity: 0.10,
  defaultFocusPair: ['Joey', 'Chandler']
});
```
