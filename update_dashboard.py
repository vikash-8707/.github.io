import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
HTML_SRC = BASE_DIR / "all_charts.html"
HTML_STATIC = BASE_DIR / "static" / "all_charts.html"

content = HTML_SRC.read_text(encoding="utf-8")

# CSS with all badges, tags, buttons, stage, and thumbnails
css_styles = """
    /* ==========================================================================
       CARD HEADER & BADGES (Clean utility bar, zero title clutter)
       ========================================================================== */
    .card-header {
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
      background: rgba(15, 23, 42, 0.6);
      flex-shrink: 0;
      z-index: 2;
    }

    [data-theme="light"] .card-header {
      background: rgba(248, 250, 252, 0.95);
    }

    .chart-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      flex-wrap: wrap;
    }

    .chart-num-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2.5px 7px;
      border-radius: 5px;
      background: linear-gradient(135deg, var(--accent-primary), #818cf8);
      color: #ffffff;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .chart-num-badge.badge-amber {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .chart-num-badge.badge-cyan {
      background: linear-gradient(135deg, #06b6d4, #0284c7);
    }

    .chart-num-badge.badge-emerald {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .chart-num-badge.badge-purple {
      background: linear-gradient(135deg, #a855f7, #7c3aed);
    }

    .chart-num-badge.badge-rose {
      background: linear-gradient(135deg, #f43f5e, #e11d48);
    }

    .chart-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      display: inline-flex;
      align-items: center;
    }

    [data-theme="light"] .chart-tag {
      background: #e2e8f0;
      color: #334155;
      border-color: rgba(0, 0, 0, 0.08);
    }

    .card-title,
    .card-subtitle {
      display: none !important;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-action-btn {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
    }

    .card-action-btn svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
    }

    .card-action-btn:hover {
      color: #ffffff;
      background: var(--accent-primary);
      border-color: transparent;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    /* Thumbnail Chart Stage */
    .chart-stage {
      position: relative;
      width: 100%;
      flex: 1 1 0;
      min-height: 0;
      background: #090d16;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
    }

    [data-theme="light"] .chart-stage {
      background: #f1f5f9;
    }

    .chart-thumb {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      border-radius: 8px;
      display: block;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
    }

    .chart-card:hover .chart-thumb {
      transform: scale(1.03);
      filter: brightness(1.05);
    }

    /* Hover overlay with interactive button */
    .thumb-overlay {
      position: absolute;
      inset: 0;
      background: rgba(8, 12, 20, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .chart-card:hover .thumb-overlay {
      opacity: 1;
      pointer-events: auto;
    }

    .thumb-action-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 18px;
      border-radius: 30px;
      background: rgba(99, 102, 241, 0.95);
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
      transform: translateY(6px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }

    .thumb-action-pill svg {
      width: 15px;
      height: 15px;
      stroke: currentColor;
    }

    .chart-card:hover .thumb-action-pill {
      transform: translateY(0);
    }

    .thumb-action-pill:hover {
      background: #4f46e5;
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 12px 28px rgba(99, 102, 241, 0.7);
    }
"""

content = re.sub(
    r'/\* Card Header - Sleek top utility bar.*?(?=\.stage-loader)',
    css_styles.strip() + "\n\n    ",
    content,
    flags=re.DOTALL
)

ICON_MAXIMIZE = """<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>"""
ICON_EXTERNAL = """<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>"""

CARD_CONFIGS = [
    {
        "id": "card-treemap",
        "chart_key": "treemap",
        "title": "PostgreSQL Gapminder Treemap",
        "thumb": "static/thumbnails/treemap.png",
        "badges": """<span class="chart-num-badge badge-purple">TREEMAP</span>
            <span class="chart-tag">Plotly Express</span>
            <span class="chart-tag">PostgreSQL</span>"""
    },
    {
        "id": "card-sunburst",
        "chart_key": "sunburst",
        "title": "PostgreSQL Gapminder Sunburst",
        "thumb": "static/thumbnails/sunburst.png",
        "badges": """<span class="chart-num-badge badge-rose">SUNBURST</span>
            <span class="chart-tag">Plotly Express</span>
            <span class="chart-tag">PostgreSQL</span>"""
    },
    {
        "id": "card-desktop-chart",
        "chart_key": "chart",
        "title": "Dynamic 3D Marker Map (Gurgaon)",
        "thumb": "static/thumbnails/chart_map.png",
        "badges": """<span class="chart-num-badge badge-amber">3D MAP</span>
            <span class="chart-tag">MapLibre GL 3D</span>
            <span class="chart-tag">Gurgaon</span>"""
    },
    {
        "id": "card-desktop-chart2",
        "chart_key": "chart2",
        "title": "Altair Density & Violin Studio",
        "thumb": "static/thumbnails/chart_violin.png",
        "badges": """<span class="chart-num-badge badge-cyan">VIOLIN</span>
            <span class="chart-tag">Vega-Lite / Altair</span>
            <span class="chart-tag">KDE</span>"""
    },
    {
        "id": "card-desktop-chart3",
        "chart_key": "chart3",
        "title": "3D Bivariate Bar Studio (PostgreSQL)",
        "thumb": "static/thumbnails/chart_bivariate.png",
        "badges": """<span class="chart-num-badge badge-emerald">3D BARS</span>
            <span class="chart-tag">Plotly 3D WebGL</span>
            <span class="chart-tag">PostgreSQL</span>"""
    },
    {
        "id": "card-chart-2",
        "chart_key": "2",
        "title": "Horseshoe Gauge Studio",
        "thumb": "static/thumbnails/chart_gauge.png",
        "badges": """<span class="chart-num-badge">GAUGE</span>
            <span class="chart-tag">Flourish v4.0.1</span>
            <span class="chart-tag">Dual Dials</span>"""
    },
    {
        "id": "card-chart-3",
        "chart_key": "3",
        "title": "Data Explorer Bubble Cluster",
        "thumb": "static/thumbnails/chart_bubble.png",
        "badges": """<span class="chart-num-badge">BUBBLE</span>
            <span class="chart-tag">Flourish v26.1.1</span>
            <span class="chart-tag">D3 Force</span>"""
    },
    {
        "id": "card-chart-4",
        "chart_key": "4",
        "title": "Friends Chord Diagram",
        "thumb": "static/thumbnails/chart_chord.png",
        "badges": """<span class="chart-num-badge">CHORD</span>
            <span class="chart-tag">Flourish v11.0.1</span>
            <span class="chart-tag">D3 Chord</span>"""
    },
    {
        "id": "card-chart-5",
        "chart_key": "5",
        "title": "US Migration Stacked Area Timeline",
        "thumb": "static/thumbnails/chart_stream.png",
        "badges": """<span class="chart-num-badge">STREAM</span>
            <span class="chart-tag">PlotSet Design</span>
            <span class="chart-tag">190-Yr Timeline</span>"""
    },
    {
        "id": "card-chart-6",
        "chart_key": "6",
        "title": "US Energy Flow Sankey Diagram",
        "thumb": "static/thumbnails/chart_sankey.png",
        "badges": """<span class="chart-num-badge">SANKEY</span>
            <span class="chart-tag">Flourish v13.0.1</span>
            <span class="chart-tag">d3-sankey</span>"""
    },
    {
        "id": "card-chart-7",
        "chart_key": "7",
        "title": "Isotype Flat Inventory Pictogram",
        "thumb": "static/thumbnails/chart_isotype.png",
        "badges": """<span class="chart-num-badge">ISOTYPE</span>
            <span class="chart-tag">Vega Style</span>
            <span class="chart-tag">SVG Inventory</span>"""
    },
    {
        "id": "card-chart-8",
        "chart_key": "8",
        "title": "India Interactive Marker Map",
        "thumb": "static/thumbnails/chart_indiamap.png",
        "badges": """<span class="chart-num-badge">MAP</span>
            <span class="chart-tag">Flourish v13.0.1</span>
            <span class="chart-tag">Leaflet 1.9</span>"""
    },
    {
        "id": "card-chart-9",
        "chart_key": "9",
        "title": "3D Ridgeline Surface Model",
        "thumb": "static/thumbnails/chart_ridgeline.png",
        "badges": """<span class="chart-num-badge">3D RIDGES</span>
            <span class="chart-tag">Flourish v4.0.1</span>
            <span class="chart-tag">Three.js WebGL</span>"""
    },
    {
        "id": "card-chart-math",
        "chart_key": "math",
        "title": "3D Mathematical Surface Explorer",
        "thumb": "static/thumbnails/chart_surface.png",
        "badges": """<span class="chart-num-badge">3D MATH</span>
            <span class="chart-tag">Plotly 3D WebGL</span>
            <span class="chart-tag">FastAPI Engine</span>"""
    }
]

for cfg in CARD_CONFIGS:
    card_id = cfg["id"]
    chart_key = cfg["chart_key"]
    title = cfg["title"]
    thumb = cfg["thumb"]
    badges = cfg["badges"]

    pattern = rf'(<article class="chart-card" id="{card_id}"[^>]*>).*?(<header class="card-header">.*?</header>\s*<div class="chart-stage[^"]*">.*?</div>)\s*(<footer class="card-footer">)'

    new_section = f"""<header class="card-header">
          <div class="chart-badge-row">
            {badges}
          </div>
          <div class="card-actions">
            <button class="card-action-btn btn-maximize" title="Explore Interactive View" data-chart="{chart_key}" data-title="{title}">
              {ICON_MAXIMIZE}
            </button>
            <a href="#" class="card-action-btn btn-ext" title="Open Standalone Tab" data-chart="{chart_key}" target="_blank">
              {ICON_EXTERNAL}
            </a>
          </div>
        </header>
        <div class="chart-stage" data-chart="{chart_key}" data-title="{title}">
          <img class="chart-thumb" src="{thumb}" alt="{title}" loading="lazy">
          <div class="thumb-overlay">
            <button class="thumb-action-pill btn-maximize" data-chart="{chart_key}" data-title="{title}">
              {ICON_MAXIMIZE}
              <span>Interactive View</span>
            </button>
          </div>
        </div>"""

    def repl(m):
        return f"{m.group(1)}\n        {new_section}\n        {m.group(3)}"

    content, n = re.subn(pattern, repl, content, count=1, flags=re.DOTALL)
    print(f"Updated {card_id}: {n}")

HTML_SRC.write_text(content, encoding="utf-8")
HTML_STATIC.write_text(content, encoding="utf-8")
print("Refined dashboard successfully saved!")
