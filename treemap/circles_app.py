"""
FastAPI Server for Flourish-Style Circle Packing - Port 8051.
Connected directly to PostgreSQL ('auth_db').
Authentic Flourish Studio Replication:
- Translucent white glass bubbles on vibrant solid continent backgrounds
- Zero ghost circles during zoom (other continents fade to opacity 0)
- Strict text threshold (only radius >= 24px get labels; small circles remain clean bubbles)
- Intelligent truncation with '...' matching Flourish (Philip..., Russ..., etc.)
- Perfectly centered zoom with '⤺ Back to All Continents' button
"""

import json
import os
import pandas as pd
from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse
from sqlalchemy import create_engine, text

app = FastAPI(title="Flourish Circles Visualizer (Port 8051)")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://vikashkumarbharti@localhost:5432/auth_db"
)
engine = create_engine(DATABASE_URL)

def ensure_gapminder_data():
    try:
        with engine.connect() as conn:
            exists = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gapminder');"
            )).scalar()
            if not exists:
                import plotly.express as px
                df_seed = px.data.gapminder()
                df_seed.to_sql("gapminder", engine, if_exists="replace", index=False)
    except Exception as e:
        print(f"[Warning] DB Check: {e}")

@app.on_event("startup")
def startup():
    ensure_gapminder_data()

@app.api_route("/favicon.ico", methods=["GET", "HEAD"], include_in_schema=False)
def favicon():
    return Response(status_code=204)

SOUTH_ASIA = {'India', 'Pakistan', 'Bangladesh', 'Afghanistan', 'Sri Lanka', 'Nepal'}
NORTH_AMERICA = {'United States', 'Canada'}
MENA = {
    'Egypt', 'Iran', 'Iraq', 'Algeria', 'Morocco', 'Tunisia', 'Jordan',
    'Lebanon', 'Syria', 'Yemen', 'Kuwait', 'Bahrain', 'Oman', 'Israel',
    'Libya', 'West Bank and Gaza'
}

def map_flourish_region(row):
    c = row['country']
    cont = row['continent']
    if c in SOUTH_ASIA:
        return 'South Asia'
    if c in NORTH_AMERICA:
        return 'North America'
    if c in MENA:
        return 'Middle East & North Africa'
    if cont == 'Asia' or cont == 'Oceania':
        return 'East Asia & Pacific'
    if cont == 'Americas':
        return 'Latin America & Caribbean'
    if cont == 'Europe':
        return 'Europe & Central Asia'
    if cont == 'Africa':
        return 'Sub-Saharan Africa'
    return cont

def get_flourish_data():
    ensure_gapminder_data()
    sql = "SELECT * FROM gapminder WHERE year = 2007"
    df = pd.read_sql(sql, engine)
    df['region'] = df.apply(map_flourish_region, axis=1)

    region_metadata = {
        "Latin America & Caribbean":  {"color": "#f97316", "title": "LATIN AMERICA & CARIBBEAN"},
        "Europe & Central Asia":      {"color": "#ec4899", "title": "EUROPE & CENTRAL ASIA"},
        "Middle East & North Africa": {"color": "#eab308", "title": "MIDDLE EAST & NORTH AFRICA"},
        "East Asia & Pacific":        {"color": "#2563eb", "title": "EAST ASIA & PACIFIC"},
        "South Asia":                 {"color": "#0284c7", "title": "SOUTH ASIA"},
        "North America":              {"color": "#0d9488", "title": "NORTH AMERICA"},
        "Sub-Saharan Africa":         {"color": "#9333ea", "title": "SUB-SAHARAN AFRICA"}
    }

    clusters = []
    for region_name, meta in region_metadata.items():
        reg_df = df[df['region'] == region_name]
        if reg_df.empty:
            continue
            
        countries = []
        for _, row in reg_df.iterrows():
            countries.append({
                "name": row["country"],
                "value": int(row["pop"]),
                "lifeExp": float(row["lifeExp"]),
                "gdpPercap": float(row["gdpPercap"]),
                "iso": row["iso_alpha"],
                "region": region_name
            })

        clusters.append({
            "name": region_name,
            "displayTitle": meta["title"],
            "color": meta["color"],
            "totalPop": int(reg_df["pop"].sum()),
            "children": countries
        })

    return clusters

@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
def circles_view():
    clusters = get_flourish_data()
    clusters_json = json.dumps(clusters)

    region_options = '<option value="all">🌍 All Continents (Zoom Out)</option>'
    for c in clusters:
        region_options += f'<option value="{c["name"]}">{c["name"]}</option>'

    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flourish Circles Visualizer (Port 8051)</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        html, body {{
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #f8fafc;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            -webkit-font-smoothing: antialiased;
        }}
        /* Top Navigation Header */
        .top-nav {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            z-index: 100;
            height: 56px;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }}
        .nav-left {{
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        .nav-brand {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
        }}
        .brand-dot {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ec4899, #8b5cf6);
            box-shadow: 0 0 8px rgba(236, 72, 153, 0.4);
        }}
        /* Filter Pill */
        .filter-group {{
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f1f5f9;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid #cbd5e1;
        }}
        .filter-label {{
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        .region-select {{
            padding: 4px 12px;
            font-size: 0.82rem;
            font-weight: 600;
            color: #0f172a;
            background: #ffffff;
            border: 1px solid #94a3b8;
            border-radius: 20px;
            outline: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }}
        .region-select:focus {{
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25);
        }}
        /* Back to All Continents Button */
        .btn-back-zoom {{
            display: none;
            align-items: center;
            gap: 6px;
            padding: 6px 16px;
            font-size: 0.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: #ffffff;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 2px 8px rgba(109, 40, 217, 0.35);
        }}
        .btn-back-zoom:hover {{
            background: linear-gradient(135deg, #6d28d9, #5b21b6);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(109, 40, 217, 0.45);
        }}
        .btn-back-zoom.visible {{
            display: inline-flex;
            animation: fadeInPill 0.3s ease-out;
        }}
        @keyframes fadeInPill {{
            from {{ opacity: 0; transform: scale(0.92); }}
            to {{ opacity: 1; transform: scale(1); }}
        }}
        .status-badge {{
            font-size: 0.82rem;
            font-weight: 500;
            color: #64748b;
        }}
        .status-badge strong {{
            color: #0f172a;
            font-weight: 700;
        }}
        /* Port navigation tabs */
        .nav-right {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .port-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.15s ease;
        }}
        .port-badge.active {{
            background: #8b5cf6;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.35);
        }}
        .port-badge:not(.active) {{
            background: #f1f5f9;
            color: #64748b;
        }}
        .port-badge:not(.active):hover {{
            background: #e2e8f0;
            color: #0f172a;
        }}
        /* Canvas Viewport */
        .chart-container {{
            flex: 1;
            width: 100vw;
            height: calc(100vh - 56px);
            position: relative;
            background: #ffffff;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        svg {{
            display: block;
            width: 100%;
            height: 100%;
            user-select: none;
        }}
        /* Non-scaling strokes ensure strokes NEVER get fat on zoom */
        circle.country-bubble {{
            vector-effect: non-scaling-stroke;
            transition: fill 0.15s ease, stroke 0.15s ease;
        }}
        circle.region-bg {{
            vector-effect: non-scaling-stroke;
        }}
        /* Tooltip */
        .tooltip {{
            position: absolute;
            pointer-events: none;
            background: rgba(15, 23, 42, 0.94);
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 0.82rem;
            box-shadow: 0 12px 30px rgba(0,0,0,0.3);
            display: none;
            z-index: 300;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.15);
            line-height: 1.55;
            min-width: 170px;
        }}
        .tooltip-title {{
            font-size: 0.96rem;
            font-weight: 800;
            color: #38bdf8;
            margin-bottom: 5px;
            border-bottom: 1px solid rgba(255,255,255,0.12);
            padding-bottom: 4px;
        }}
        .tooltip-row {{
            display: flex;
            justify-content: space-between;
            gap: 16px;
            color: #cbd5e1;
        }}
        .tooltip-row strong {{
            color: #ffffff;
        }}
    </style>
</head>
<body>
    <header class="top-nav">
        <div class="nav-left">
            <div class="nav-brand">
                <span class="brand-dot"></span>
                <span>Flourish Circles</span>
            </div>
            
            <!-- Continent Filter -->
            <div class="filter-group">
                <span class="filter-label">Continent:</span>
                <select id="region-select" class="region-select">
                    {region_options}
                </select>
            </div>

            <!-- Back Button -->
            <button class="btn-back-zoom" id="btn-back-zoom" title="Zoom out to all continents">
                ⤺ Back to All Continents
            </button>

            <!-- Status Breadcrumb -->
            <span class="status-badge" id="status-badge">Click any continent to zoom in</span>
        </div>

        <div class="nav-right">
            <a href="http://127.0.0.1:8000" class="port-badge">Port 8000: Treemap ↗</a>
            <a href="http://127.0.0.1:8050" class="port-badge">Port 8050: Sunburst ↗</a>
            <a href="http://127.0.0.1:8051" class="port-badge active">Port 8051: Circles</a>
        </div>
    </header>

    <main class="chart-container" id="chart-container">
        <div class="tooltip" id="tooltip"></div>
    </main>

    <script>
    const rawClustersData = {clusters_json};
    const container = document.getElementById('chart-container');
    const tooltip = document.getElementById('tooltip');
    const regionSelect = document.getElementById('region-select');
    const btnBackZoom = document.getElementById('btn-back-zoom');
    const statusBadge = document.getElementById('status-badge');

    function formatPop(num) {{
        if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
        if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
        return Number(num).toLocaleString();
    }}

    let currentZoomedRegion = null;
    let svg = null;
    let mainGroup = null;
    let clusterGroups = {{}};
    let clusterMeta = {{}};
    let overviewViewBox = null;

    function buildLayout() {{
        d3.select("#chart-container").select("svg").remove();

        // 1. Exact Flourish Radius Calibration
        const baseRadiusMap = {{
            "East Asia & Pacific":        140,
            "South Asia":                 118,
            "Europe & Central Asia":      96,
            "Sub-Saharan Africa":         92,
            "Latin America & Caribbean":  82,
            "Middle East & North Africa": 70,
            "North America":              62
        }};

        rawClustersData.forEach(cluster => {{
            const r = baseRadiusMap[cluster.name] || 78;
            cluster.radius = r;

            // Pack countries to fill 92% of the continent circle with crisp padding
            const packDiameter = r * 2 * 0.92;
            const pack = d3.pack()
                .size([packDiameter, packDiameter])
                .padding(2);

            const root = d3.hierarchy({{ name: cluster.name, children: cluster.children }})
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value);

            pack(root);
            cluster.packRoot = root;
            cluster.packDiameter = packDiameter;
        }});

        // 2. Exact Flourish Clustered Positions
        const flourishPositions = {{
            "Latin America & Caribbean":  {{ x: -145, y: -135 }},
            "Europe & Central Asia":      {{ x:   15, y: -155 }},
            "Middle East & North Africa": {{ x:  170, y: -130 }},
            "East Asia & Pacific":        {{ x: -105, y:   55 }},
            "South Asia":                 {{ x:  125, y:   65 }},
            "North America":              {{ x: -160, y:  220 }},
            "Sub-Saharan Africa":         {{ x:   10, y:  240 }}
        }};

        rawClustersData.forEach(d => {{
            const pos = flourishPositions[d.name] || {{ x: 0, y: 0 }};
            d.x = pos.x;
            d.y = pos.y;
        }});

        // Run soft simulation to ensure perfect touching without overlaps
        const sim = d3.forceSimulation(rawClustersData)
            .force("collide", d3.forceCollide(d => d.radius + 1.2).strength(1.0))
            .force("x", d3.forceX(d => flourishPositions[d.name].x).strength(0.85))
            .force("y", d3.forceY(d => flourishPositions[d.name].y).strength(0.85))
            .stop();

        for (let i = 0; i < 280; ++i) sim.tick();

        // 3. Compute Overview Bounding Box with aspect ratio matching
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        rawClustersData.forEach(d => {{
            minX = Math.min(minX, d.x - d.radius);
            maxX = Math.max(maxX, d.x + d.radius);
            minY = Math.min(minY, d.y - d.radius - 22);
            maxY = Math.max(maxY, d.y + d.radius);
        }});

        const padX = 28;
        const padY = 32;
        const bboxW = (maxX - minX) + padX * 2;
        const bboxH = (maxY - minY) + padY * 2;
        const bboxCenterX = (minX + maxX) / 2;
        const bboxCenterY = (minY + maxY) / 2;

        overviewViewBox = {{
            x: bboxCenterX - bboxW / 2,
            y: bboxCenterY - bboxH / 2,
            width: bboxW,
            height: bboxH
        }};

        // 4. Create SVG
        svg = d3.select("#chart-container").append("svg")
            .attr("viewBox", `${{overviewViewBox.x}} ${{overviewViewBox.y}} ${{overviewViewBox.width}} ${{overviewViewBox.height}}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Background click zooms out
        svg.append("rect")
            .attr("class", "canvas-bg")
            .attr("x", -2000)
            .attr("y", -2000)
            .attr("width", 4000)
            .attr("height", 4000)
            .attr("fill", "transparent")
            .style("cursor", "default")
            .on("click", () => zoomOut());

        const defs = svg.append("defs");
        mainGroup = svg.append("g").attr("class", "flourish-clusters");

        clusterGroups = {{}};
        clusterMeta = {{}};

        rawClustersData.forEach((cluster) => {{
            const cGroup = mainGroup.append("g")
                .attr("class", `cluster-group cluster-${{cluster.name.replace(/[^a-zA-Z]/g, '')}}`)
                .attr("transform", `translate(${{cluster.x}},${{cluster.y}})`);

            clusterGroups[cluster.name] = cGroup;
            clusterMeta[cluster.name] = cluster;

            const r = cluster.radius;

            // Arc for curved header along top edge
            const arcR = r * 0.93;
            const arcId = `arc-${{cluster.name.replace(/[^a-zA-Z]/g, '')}}`;
            defs.append("path")
                .attr("id", arcId)
                .attr("d", `M ${{-arcR * 0.94}},${{0}} A ${{arcR}},${{arcR}} 0 0,1 ${{arcR * 0.94}},${{0}}`);

            // Solid Vibrant Continent Container Circle
            cGroup.append("circle")
                .attr("class", "region-bg")
                .attr("r", r)
                .attr("fill", cluster.color)
                .attr("fill-opacity", 0.95)
                .attr("stroke", cluster.color)
                .attr("stroke-width", 1.5)
                .style("cursor", "pointer")
                .on("click", (event) => {{
                    event.stopPropagation();
                    zoomToRegion(cluster.name);
                }});

            // Country Bubbles Group
            const countryGroup = cGroup.append("g")
                .attr("class", "countries")
                .attr("transform", `translate(0, ${{r * 0.03}})`);

            const countries = cluster.packRoot.descendants().slice(1);
            const halfD = cluster.packDiameter / 2;

            // Flourish Frosted Translucent Bubbles
            countryGroup.selectAll("circle.country-bubble")
                .data(countries)
                .join("circle")
                .attr("class", "country-bubble")
                .attr("cx", d => d.x - halfD)
                .attr("cy", d => d.y - halfD)
                .attr("r", d => Math.max(2, d.r))
                .attr("fill", "rgba(255, 255, 255, 0.22)")
                .attr("stroke", "rgba(255, 255, 255, 0.45)")
                .attr("stroke-width", 1)
                .style("cursor", "pointer")
                .on("mouseover", function(event, d) {{
                    d3.select(this)
                        .attr("fill", "rgba(255, 255, 255, 0.42)")
                        .attr("stroke", "#ffffff")
                        .attr("stroke-width", 1.8);
                    tooltip.style.display = "block";
                    tooltip.innerHTML = `
                        <div class="tooltip-title">${{d.data.name}}</div>
                        <div class="tooltip-row"><span>Region:</span> <strong>${{cluster.name}}</strong></div>
                        <div class="tooltip-row"><span>Population:</span> <strong>${{Number(d.data.value).toLocaleString()}}</strong></div>
                        <div class="tooltip-row"><span>Metric Index:</span> <strong>${{d.data.lifeExp.toFixed(1)}} yrs</strong></div>
                        <div class="tooltip-row"><span>GDP per Capita:</span> <strong>$${{Number(Math.round(d.data.gdpPercap)).toLocaleString()}}</strong></div>
                    `;
                }})
                .on("mousemove", function(event) {{
                    tooltip.style.left = (event.clientX + 14) + "px";
                    tooltip.style.top = (event.clientY + 14) + "px";
                }})
                .on("mouseout", function(event, d) {{
                    d3.select(this)
                        .attr("fill", "rgba(255, 255, 255, 0.22)")
                        .attr("stroke", "rgba(255, 255, 255, 0.45)")
                        .attr("stroke-width", 1);
                    tooltip.style.display = "none";
                }})
                .on("click", (event) => {{
                    event.stopPropagation();
                    zoomToRegion(cluster.name);
                }});

            // Country Labels (Strict threshold for overview to keep chart sparkling clean)
            const labelGroup = countryGroup.append("g").attr("class", "country-labels");

            labelGroup.selectAll("text.country-label")
                .data(countries)
                .join("text")
                .attr("class", "country-label")
                .attr("x", d => d.x - halfD)
                .attr("y", d => d.y - halfD)
                .attr("text-anchor", "middle")
                .attr("fill", "#ffffff")
                .attr("font-weight", "700")
                .attr("pointer-events", "none")
                .each(function(d) {{
                    renderLabel(d3.select(this), d, halfD, false);
                }});

            // Curved Header Text
            const arcText = cGroup.append("text")
                .attr("class", "curved-header")
                .attr("pointer-events", "none")
                .attr("fill", "#1e293b")
                .attr("font-weight", "800")
                .attr("font-size", Math.max(9.5, Math.min(r / 10.5, 13)))
                .attr("letter-spacing", "0.05em");

            arcText.append("textPath")
                .attr("href", `#${{arcId}}`)
                .attr("startOffset", "50%")
                .attr("text-anchor", "middle")
                .text(cluster.displayTitle);
        }});
    }}

    // Multi-line word wrapping helper: preserves FULL words without trimming
    function splitCountryName(name) {{
        if (name === "United States") return ["United", "States"];
        if (name === "United Kingdom") return ["United", "Kingdom"];
        if (name === "Dominican Republic") return ["Dominican", "Republic"];
        if (name === "South Africa") return ["South", "Africa"];
        if (name === "Saudi Arabia") return ["Saudi", "Arabia"];
        if (name === "Czech Republic") return ["Czech", "Republic"];
        if (name === "Slovak Republic") return ["Slovak", "Republic"];
        if (name === "Sierra Leone") return ["Sierra", "Leone"];
        if (name === "Burkina Faso") return ["Burkina", "Faso"];
        if (name === "El Salvador") return ["El", "Salvador"];
        if (name === "New Zealand") return ["New", "Zealand"];
        if (name === "Puerto Rico") return ["Puerto", "Rico"];
        if (name === "Cote d'Ivoire") return ["Cote", "d'Ivoire"];
        if (name === "Equatorial Guinea") return ["Equatorial", "Guinea"];
        if (name === "Central African Republic") return ["Central African", "Republic"];
        if (name === "Bosnia and Herzegovina") return ["Bosnia &", "Herzegovina"];
        if (name === "Trinidad and Tobago") return ["Trinidad &", "Tobago"];
        if (name === "Sao Tome and Principe") return ["Sao Tome &", "Principe"];
        if (name === "West Bank and Gaza") return ["West Bank", "& Gaza"];
        if (name === "Hong Kong, China") return ["Hong Kong,", "China"];
        if (name === "Korea, Rep.") return ["Korea,", "Rep."];
        if (name === "Korea, Dem. Rep.") return ["Dem. Rep.", "Korea"];
        if (name === "Congo, Dem. Rep.") return ["Dem. Rep.", "Congo"];
        if (name === "Congo, Rep.") return ["Rep.", "Congo"];
        if (name === "Yemen, Rep.") return ["Yemen,", "Rep."];

        if (name.includes(" ") && !name.includes(",")) {{
            const parts = name.split(" ");
            if (parts.length === 2) return parts;
        }}
        return [name];
    }}

    // Smart Label Renderer: ALWAYS renders FULL country names (ZERO trimming or '...')
    function renderLabel(textSel, d, halfD, isZoomed) {{
        textSel.selectAll("*").remove();

        const name = d.data.name;
        const r = d.r;
        const lines = splitCountryName(name);
        const maxWordLen = Math.max(...lines.map(l => l.length));

        if (!isZoomed) {{
            // OVERVIEW MODE:
            // Calculate proportional font size to fit full word in circle diameter
            const fitFontSize = (1.82 * r) / (maxWordLen * 0.56);
            const fontSize = Math.min(13.5, fitFontSize);

            // If bubble is too small to fit full word legibly (min 7.5px),
            // keep bubble clean without clutter (full details on hover)
            if (fontSize < 7.5 || r < 14) return;

            const lineHeight = 1.15;
            const totalLines = lines.length;
            const startDy = totalLines === 1 ? 0.35 : -((totalLines - 1) * lineHeight / 2) + 0.32;

            lines.forEach((line, i) => {{
                textSel.append("tspan")
                    .attr("x", d.x - halfD)
                    .attr("dy", i === 0 ? `${{startDy}}em` : `${{lineHeight}}em`)
                    .attr("font-size", fontSize)
                    .attr("font-weight", "700")
                    .text(line); // FULL NAME, NO TRIMMING!
            }});
        }} else {{
            // ZOOMED MODE:
            // Scaled view has abundant space for full names and population
            if (r < 10) return; // Very tiny dots remain clean bubbles

            const fitFontSize = (1.85 * r) / (maxWordLen * 0.56);

            if (r >= 20) {{
                // Multi-line: Full Country Name + Formatted Population
                const fontSize = Math.max(9.5, Math.min(16, fitFontSize));
                const totalLines = lines.length + 1;
                const lineHeight = 1.15;
                const startDy = -((totalLines - 1) * lineHeight / 2) + 0.32;

                lines.forEach((line, i) => {{
                    textSel.append("tspan")
                        .attr("x", d.x - halfD)
                        .attr("dy", i === 0 ? `${{startDy}}em` : `${{lineHeight}}em`)
                        .attr("font-size", fontSize)
                        .attr("font-weight", "700")
                        .text(line); // FULL NAME, NO TRIMMING!
                }});

                textSel.append("tspan")
                    .attr("x", d.x - halfD)
                    .attr("dy", `${{lineHeight}}em`)
                    .attr("font-size", Math.max(8.5, fontSize * 0.76))
                    .attr("font-weight", "500")
                    .attr("fill", "rgba(255, 255, 255, 0.92)")
                    .text(formatPop(d.data.value));
            }} else {{
                // Medium bubble: Full Country Name only
                const fontSize = Math.max(8, Math.min(12, fitFontSize));
                const lineHeight = 1.15;
                const totalLines = lines.length;
                const startDy = totalLines === 1 ? 0.35 : -((totalLines - 1) * lineHeight / 2) + 0.32;

                lines.forEach((line, i) => {{
                    textSel.append("tspan")
                        .attr("x", d.x - halfD)
                        .attr("dy", i === 0 ? `${{startDy}}em` : `${{lineHeight}}em`)
                        .attr("font-size", fontSize)
                        .attr("font-weight", "700")
                        .text(line); // FULL NAME, NO TRIMMING!
                }});
            }}
        }}
    }}

    // ZOOM TO REGION: Perfectly isolated, centered, ZERO ghost bubbles!
    function zoomToRegion(regionName) {{
        const cluster = clusterMeta[regionName];
        if (!cluster) return;

        currentZoomedRegion = regionName;
        regionSelect.value = regionName;
        btnBackZoom.classList.add("visible");
        statusBadge.innerHTML = `Zoomed in: <strong>${{regionName}}</strong> (${{formatPop(cluster.totalPop)}} pop)`;

        // Calculate aspect-ratio-matched viewBox centered exactly on the cluster
        const rect = container.getBoundingClientRect();
        const aspect = rect.width / rect.height;

        // Cluster circle occupies 84% of height
        const vHeight = (cluster.radius * 2) / 0.84;
        const vWidth = vHeight * aspect;
        const vMinX = cluster.x - vWidth / 2;
        const vMinY = cluster.y - vHeight / 2;

        svg.transition()
            .duration(700)
            .ease(d3.easeCubicInOut)
            .attr("viewBox", `${{vMinX}} ${{vMinY}} ${{vWidth}} ${{vHeight}}`);

        // Hide curved header on zoomed cluster
        clusterGroups[regionName].select(".curved-header")
            .transition()
            .duration(250)
            .attr("opacity", 0);

        // Update labels for zoomed cluster (show name + pop)
        const halfD = cluster.packDiameter / 2;
        clusterGroups[regionName].selectAll("text.country-label")
            .each(function(d) {{
                renderLabel(d3.select(this), d, halfD, true);
            }});

        // CRITICAL: Immediately hide all other clusters completely (ZERO GHOST CIRCLES!)
        Object.keys(clusterGroups).forEach(name => {{
            if (name !== regionName) {{
                clusterGroups[name].transition().duration(250)
                    .attr("opacity", 0)
                    .style("display", "none")
                    .style("pointer-events", "none");
            }} else {{
                clusterGroups[name]
                    .style("display", "inline")
                    .style("pointer-events", "all")
                    .transition().duration(400)
                    .attr("opacity", 1);
            }}
        }});
    }}

    // ZOOM OUT TO ALL CONTINENTS
    function zoomOut() {{
        currentZoomedRegion = null;
        regionSelect.value = "all";
        btnBackZoom.classList.remove("visible");
        statusBadge.innerHTML = "Click any continent to zoom in";

        // Restore display of all clusters first
        Object.keys(clusterGroups).forEach(name => {{
            clusterGroups[name]
                .style("display", "inline")
                .style("pointer-events", "all");
        }});

        // Smooth viewBox restore
        svg.transition()
            .duration(700)
            .ease(d3.easeCubicInOut)
            .attr("viewBox", `${{overviewViewBox.x}} ${{overviewViewBox.y}} ${{overviewViewBox.width}} ${{overviewViewBox.height}}`);

        // Fade all clusters back in
        Object.keys(clusterGroups).forEach(name => {{
            const cGroup = clusterGroups[name];
            cGroup.transition().duration(500)
                .attr("opacity", 1);

            // Restore curved headers
            cGroup.select(".curved-header")
                .transition().duration(500)
                .attr("opacity", 1);

            // Restore overview labels (clean, minimal)
            const cHalfD = clusterMeta[name].packDiameter / 2;
            cGroup.selectAll("text.country-label")
                .each(function(d) {{
                    renderLabel(d3.select(this), d, cHalfD, false);
                }});
        }});
    }}

    regionSelect.addEventListener("change", function(e) {{
        if (e.target.value === "all") {{
            zoomOut();
        }} else {{
            zoomToRegion(e.target.value);
        }}
    }});

    btnBackZoom.addEventListener("click", function(e) {{
        e.stopPropagation();
        zoomOut();
    }});

    window.addEventListener("resize", () => {{
        buildLayout();
        if (currentZoomedRegion) {{
            zoomToRegion(currentZoomedRegion);
        }}
    }});

    buildLayout();
    </script>
</body>
</html>"""
    return HTMLResponse(content=page_html)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("circles_app:app", host="127.0.0.1", port=8051, reload=True)
