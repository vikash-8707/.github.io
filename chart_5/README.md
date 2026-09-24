# Migration to the US by World Region (1820–2009)

A pixel-accurate, smooth stacked area chart visualization replicating the PlotSet design using **D3.js v7** and vanilla CSS.

## Features

- **Smooth Organic Curves:** Generated with `d3.curveMonotoneX` for natural continuous stacked area contours.
- **Top Envelope Boundary Line:** Distinctive dark outline (`#0f172a`, 1.8px) tracing the total migration volume.
- **PlotSet Color Scheme:** Exact 20-region palette categorized into European blues/teals, Asian reds/corals, American golds/peaches, African emerald, and Oceanic cyan.
- **Interactive Scrubber & Tooltip:** Move the cursor across the chart to scrub through historical 5-year intervals with breakdowns of contributing regions and decade totals.
- **Interactive Legend:** Hover over any country or region swatch to isolate and highlight that specific band while dimming others; click to lock the highlight.
- **Axes & Gridlines:** Y-axis spanning `0` to `12m` in increments of 2 million with subtle horizontal guidelines; X-axis with 5-year tick marks from `1825` to `2005`.
- **Zero Build Step:** Native vanilla ES6 JavaScript and CSS, requiring no bundlers or node runtime.

## Project Structure

```text
chart_5/
├── index.html          # Main standalone interactive visualization page
├── style.css           # Modern typography, card container, and responsive styles
├── chart.js            # StackedMigrationChart D3 class implementation
├── data.js             # Categorized data points (1825-2005) & region color mappings
├── embed-example.html  # Minimal drop-in embedding snippet
└── README.md           # Documentation
```

## How to Run

Simply open `index.html` in any modern web browser:

```bash
open index.html
```

Or serve locally with any static HTTP server:

```bash
npx serve .
# or
python3 -m http.server 8080
```
