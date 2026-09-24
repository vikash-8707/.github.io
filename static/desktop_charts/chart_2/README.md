# Flourish Gauge v4.0.1 (HTML, CSS & Vanilla JS)

This folder contains a complete, pixel-accurate replica of the **Flourish Studio 3D Horseshoe Gauge (v4.0.1)**.

![Flourish Gauge Preview](gauge_preview.png)

---

## 📁 Files in this Folder

1. **`index.html`**
   - The interactive showcase with the two gauges from the screenshot (**2BHK at 81%** and **3BHK at 48%**).
   - Includes real-time slider controls, re-animation triggers, randomize test button, and responsive design.

2. **`gauge.js`**
   - Self-contained, reusable `FlourishGauge` class.
   - Built on pure SVG and Vanilla JavaScript (zero external dependencies).
   - Handles the 240° horseshoe arc math, precision major/minor ticks, curved segment labels, realistic tapered needle physics, and smooth digital number count-up.

3. **`style.css`**
   - Rich aesthetic styling, modern typography (`Plus Jakarta Sans`), and layout.

4. **`embed-example.html`**
   - A minimalist, copy-pasteable example showing how to put the gauge into any existing HTML/CSS webpage in just 3 steps.

---

## 🚀 How to View & Run

Open `index.html` in your web browser:
```bash
open index.html
```
Or start a local HTTP server:
```bash
python3 -m http.server 3000
```
Then visit `http://localhost:3000`.

---

## 🛠️ How to Embed in Any Other HTML/CSS Webpage

### Step 1: Place a container `<div>` in your HTML
```html
<div id="my-gauge" style="max-width: 440px; margin: 0 auto;"></div>
```

### Step 2: Include `gauge.js`
```html
<script src="gauge.js"></script>
```

### Step 3: Initialize the Gauge in JavaScript
```javascript
const gauge = new FlourishGauge('#my-gauge', {
  label: '2BHK',    // Subtitle label
  value: 81,        // Percentage (0 to 100)
  unit: '%',        // Optional suffix
  animated: true,   // Smooth needle sweep
  duration: 1200    // Animation duration in ms
});
```

### Dynamically update value later:
```javascript
gauge.setValue(92);       // Glides needle to 92% smoothly
gauge.setLabel('Penthouse');
```

---

## 🎨 Segments & Color Customization
You can easily customize or add any segments:
```javascript
new FlourishGauge('#my-gauge', {
  label: 'Occupancy',
  value: 75,
  segments: [
    { from: 0, to: 35, label: 'Unlikely', color: '#3b82f6', textColor: '#ffffff' },
    { from: 35, to: 65, label: 'Toss-Up', color: '#cbd5e1', textColor: '#475569' },
    { from: 65, to: 80, label: 'Likely', color: '#4f70bd', textColor: '#ffffff' },
    { from: 80, to: 100, label: 'Very likely', color: '#091c4d', textColor: '#ffffff', multiLine: true }
  ]
});
```
