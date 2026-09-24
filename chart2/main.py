"""
FastAPI Application for Dynamic Altair Violin & Density Plots.
Provides interactive dashboard, standalone iframe embed endpoint, and REST API.
"""

from fastapi import FastAPI, Query, HTTPException, Request, Body
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np

from chart2.database import (
    get_dataset_schema,
    filter_cars_data,
    calculate_group_statistics,
    get_raw_cars_df,
    get_postgres_db_status,
    get_cars_list_from_db
)
from chart2.chart_generator import (
    generate_violin_chart,
    get_chart_json_spec,
    render_standalone_embed_html,
    generate_python_code_snippet
)

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Dynamic Altair Density Visualization API",
    description="Interactive kernel density and violin plots generated dynamically with Altair",
    version="1.0.0"
)

# Enable CORS for cross-origin integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.middleware("http")
async def allow_iframe_embed(request: Request, call_next):
    """Allow chart embedding in iframes from any host."""
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    if request.url.path.startswith("/embed") or request.url.path == "/embed":
        if "x-frame-options" in response.headers:
            del response.headers["x-frame-options"]
        response.headers["Content-Security-Policy"] = "frame-ancestors *"
    return response


# Pydantic Schemas
class ChartRequest(BaseModel):
    metric: str = "Miles_per_Gallon"
    groupby: str = "Origin"
    extent_min: Optional[float] = None
    extent_max: Optional[float] = None
    bandwidth: Optional[float] = None
    stack: str = "center"
    width: int = 110
    spacing: int = 4
    color_scheme: str = "tableau10"
    opacity: float = 0.85
    theme: str = "dark"
    origins: Optional[List[str]] = None
    cylinders: Optional[List[int]] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    stroke_outline: bool = True


@app.get("/", response_class=FileResponse)
async def serve_index():
    """Serves the interactive dashboard interface."""
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/schema")
async def get_schema():
    """Get metadata about available fields and ranges."""
    return get_dataset_schema()


@app.get("/api/chart")
async def get_chart_api(
    metric: str = Query("Miles_per_Gallon", description="Metric to plot on quantitative axis"),
    groupby: str = Query("Origin", description="Categorical field to facet columns by"),
    extent_min: Optional[float] = Query(None, description="Density extent lower bound"),
    extent_max: Optional[float] = Query(None, description="Density extent upper bound"),
    bandwidth: Optional[float] = Query(None, description="KDE smoothing bandwidth"),
    stack: str = Query("center", description="Stacking mode: center, zero, or none"),
    width: int = Query(110, ge=40, le=400, description="Column facet width in px"),
    spacing: int = Query(4, ge=0, le=50, description="Spacing between column facets in px"),
    color_scheme: str = Query("tableau10", description="Color palette scheme"),
    opacity: float = Query(0.85, ge=0.1, le=1.0, description="Area mark opacity"),
    theme: str = Query("dark", description="Visual theme: dark or light"),
    stroke_outline: bool = Query(True, description="Whether to draw outline border"),
    origins: Optional[str] = Query(None, description="Comma-separated origins, e.g. USA,Europe,Japan"),
    cylinders: Optional[str] = Query(None, description="Comma-separated cylinders, e.g. 4,6,8"),
    min_year: Optional[int] = Query(None, description="Minimum production year"),
    max_year: Optional[int] = Query(None, description="Maximum production year")
):
    """Generate dynamic chart specification and metrics."""
    origins_list = [o.strip() for o in origins.split(",") if o.strip()] if origins else None
    cylinders_list = [int(c.strip()) for c in cylinders.split(",") if c.strip().isdigit()] if cylinders else None

    extent = [extent_min, extent_max] if (extent_min is not None and extent_max is not None) else None

    df = filter_cars_data(
        metric=metric,
        groupby=groupby,
        origins=origins_list,
        cylinders=cylinders_list,
        min_year=min_year,
        max_year=max_year
    )

    if df.empty:
        raise HTTPException(status_code=400, detail="No data available for the given filters.")

    try:
        chart = generate_violin_chart(
            df=df,
            metric=metric,
            groupby=groupby,
            extent=extent,
            bandwidth=bandwidth,
            stack=stack,
            width=width,
            spacing=spacing,
            color_scheme=color_scheme,
            opacity=opacity,
            theme=theme,
            stroke_outline=stroke_outline
        )
        spec = get_chart_json_spec(chart)
        stats = calculate_group_statistics(df, metric, groupby)
        code = generate_python_code_snippet(
            metric=metric,
            groupby=groupby,
            extent=extent,
            bandwidth=bandwidth,
            stack=stack,
            width=width,
            spacing=spacing,
            color_scheme=color_scheme,
            theme=theme
        )
        return {
            "spec": spec,
            "stats": stats,
            "code": code,
            "record_count": len(df),
            "theme": theme
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chart")
async def post_chart_api(payload: ChartRequest):
    """Programmatic POST endpoint for dynamic chart generation."""
    extent = [payload.extent_min, payload.extent_max] if (payload.extent_min is not None and payload.extent_max is not None) else None

    df = filter_cars_data(
        metric=payload.metric,
        groupby=payload.groupby,
        origins=payload.origins,
        cylinders=payload.cylinders,
        min_year=payload.min_year,
        max_year=payload.max_year
    )

    if df.empty:
        raise HTTPException(status_code=400, detail="No data available matching filter criteria.")

    try:
        chart = generate_violin_chart(
            df=df,
            metric=payload.metric,
            groupby=payload.groupby,
            extent=extent,
            bandwidth=payload.bandwidth,
            stack=payload.stack,
            width=payload.width,
            spacing=payload.spacing,
            color_scheme=payload.color_scheme,
            opacity=payload.opacity,
            theme=payload.theme,
            stroke_outline=payload.stroke_outline
        )
        spec = get_chart_json_spec(chart)
        stats = calculate_group_statistics(df, payload.metric, payload.groupby)
        code = generate_python_code_snippet(
            metric=payload.metric,
            groupby=payload.groupby,
            extent=extent,
            bandwidth=payload.bandwidth,
            stack=payload.stack,
            width=payload.width,
            spacing=payload.spacing,
            color_scheme=payload.color_scheme,
            theme=payload.theme
        )
        return {
            "spec": spec,
            "stats": stats,
            "code": code,
            "record_count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/embed", response_class=HTMLResponse)
async def embed_chart(
    metric: str = Query("Miles_per_Gallon"),
    groupby: str = Query("Origin"),
    extent_min: Optional[float] = Query(None),
    extent_max: Optional[float] = Query(None),
    bandwidth: Optional[float] = Query(None),
    stack: str = Query("center"),
    width: int = Query(110),
    spacing: int = Query(4),
    color_scheme: str = Query("tableau10"),
    opacity: float = Query(0.85),
    theme: str = Query("light"),
    stroke_outline: bool = Query(True),
    origins: Optional[str] = Query(None),
    cylinders: Optional[str] = Query(None),
    min_year: Optional[int] = Query(None),
    max_year: Optional[int] = Query(None)
):
    """Standalone clean embed view for iframe integrations."""
    origins_list = [o.strip() for o in origins.split(",") if o.strip()] if origins else None
    cylinders_list = [int(c.strip()) for c in cylinders.split(",") if c.strip().isdigit()] if cylinders else None
    extent = [extent_min, extent_max] if (extent_min is not None and extent_max is not None) else None

    df = filter_cars_data(
        metric=metric,
        groupby=groupby,
        origins=origins_list,
        cylinders=cylinders_list,
        min_year=min_year,
        max_year=max_year
    )

    if df.empty:
        return HTMLResponse("<h3>No data matches current filters</h3>", status_code=400)

    try:
        chart = generate_violin_chart(
            df=df,
            metric=metric,
            groupby=groupby,
            extent=extent,
            bandwidth=bandwidth,
            stack=stack,
            width=width,
            spacing=spacing,
            color_scheme=color_scheme,
            opacity=opacity,
            theme=theme,
            stroke_outline=stroke_outline
        )
        html_content = render_standalone_embed_html(chart, theme=theme)
        return HTMLResponse(content=html_content)
    except Exception as e:
        return HTMLResponse(f"<h3>Error generating chart: {e}</h3>", status_code=500)


@app.get("/api/data")
async def get_data_table(
    metric: str = Query("Miles_per_Gallon"),
    groupby: str = Query("Origin"),
    origins: Optional[str] = Query(None),
    cylinders: Optional[str] = Query(None),
    min_year: Optional[int] = Query(None),
    max_year: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Return filtered dataset rows for table preview."""
    origins_list = [o.strip() for o in origins.split(",") if o.strip()] if origins else None
    cylinders_list = [int(c.strip()) for c in cylinders.split(",") if c.strip().isdigit()] if cylinders else None

    df = filter_cars_data(
        metric=metric,
        groupby=groupby,
        origins=origins_list,
        cylinders=cylinders_list,
        min_year=min_year,
        max_year=max_year
    )

    total = len(df)
    sliced = df.iloc[offset:offset + limit]

    # Convert dataframe to json-safe records
    records = []
    for _, row in sliced.iterrows():
        record = {}
        for col in sliced.columns:
            val = row[col]
            if pd.isna(val):
                record[col] = None
            elif hasattr(val, "isoformat"):
                record[col] = val.isoformat()
            elif isinstance(val, (int, float, str, bool)):
                record[col] = val
            else:
                record[col] = str(val)
        records.append(record)

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "records": records,
        "columns": [col for col in df.columns if col != "Year"]
    }


@app.get("/api/db/status")
async def get_database_status():
    """Returns PostgreSQL connection health, tables, and statistics."""
    return get_postgres_db_status()


@app.get("/api/cars/list")
async def get_cars_list():
    """Returns list of unique car models with engine specs from PostgreSQL."""
    cars = get_cars_list_from_db()
    return {
        "total": len(cars),
        "database": "PostgreSQL (auth_db)",
        "cars": cars
    }


@app.get("/embed/3d", response_class=HTMLResponse)
async def embed_3d_car(
    color: str = Query("d90429", description="Hex color without hash for car body paint"),
    finish: str = Query("metallic", description="Paint finish: metallic, matte, chrome, wireframe"),
    autorotate: bool = Query(True, description="Enable auto rotation"),
    underglow: bool = Query(True, description="Enable neon underglow")
):
    """Standalone full-screen Three.js 3D Car Model for iframe embedding."""
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Car Model Viewer</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        html, body {{ width: 100%; height: 100%; overflow: hidden; background: #07090e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }}
        #car-3d-viewport {{ width: 100vw; height: 100vh; display: block; }}
        .hud-overlay {{
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(14, 19, 31, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px 18px;
            color: #f8fafc;
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 13px;
        }}
        .hud-overlay span {{ color: #38bdf8; font-weight: 600; }}
        .badge {{ background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 999px; font-size: 11px; }}
    </style>
</head>
<body>
    <div id="car-3d-viewport"></div>
    <div class="hud-overlay">
        <div><strong>3D Sports Coupe</strong> <span class="badge">Three.js WebGL</span></div>
        <div>Rotate: <span>Drag</span></div>
        <div>Zoom: <span>Scroll</span></div>
    </div>
    <script src="/static/car3d.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', () => {{
            initCar3D('car-3d-viewport');
            if (window.car3DApp) {{
                window.car3DApp.setPaintColor(0x{color});
                window.car3DApp.setFinish('{finish}');
                window.car3DApp.toggleAutoRotate({str(autorotate).lower()});
                window.car3DApp.toggleUnderglow({str(underglow).lower()});
            }}
        }});
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)


@app.get("/api/chart/3d-bars")
async def get_3d_bars_api(
    table: str = Query("cars_data", description="PostgreSQL table name"),
    x_col: str = Query("Horsepower", description="Numeric X column"),
    y_col: str = Query("Miles_per_Gallon", description="Numeric Y column"),
    bins: int = Query(6, ge=2, le=20, description="Bin count per axis"),
    colormap: str = Query("Viridis", description="Color palette name"),
    theme: str = Query("dark", description="Visual theme: dark or light")
):
    """Generates 3D Bivariate Bar Chart specification from PostgreSQL."""
    from postgres_3d_barchart import Postgres3DBarChart
    chart = Postgres3DBarChart(
        table_name=table,
        x_col=x_col,
        y_col=y_col,
        bins=bins
    )
    chart.fetch_data()
    fig = chart.plot_plotly(colormap=colormap, theme=theme)
    return JSONResponse(content=fig.to_dict())


@app.get("/embed/3d-bars", response_class=HTMLResponse)
async def embed_3d_bars(
    table: str = Query("cars_data"),
    x_col: str = Query("Horsepower"),
    y_col: str = Query("Miles_per_Gallon"),
    bins: int = Query(6),
    colormap: str = Query("Viridis"),
    theme: str = Query("light")
):
    """Standalone full-screen 3D Bivariate Bar Chart for iframes."""
    from postgres_3d_barchart import Postgres3DBarChart
    chart = Postgres3DBarChart(
        table_name=table,
        x_col=x_col,
        y_col=y_col,
        bins=bins
    )
    chart.fetch_data()
    fig = chart.plot_plotly(colormap=colormap, theme=theme)
    bg_color = "#07090e" if theme == "dark" else "#ffffff"
    chart_html = fig.to_html(full_html=False, include_plotlyjs="cdn", config={"responsive": True, "displaylogo": False})
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Bivariate Bar Chart</title>
    <style>
        html, body {{ margin: 0; padding: 0; width: 100%; height: 100%; background: {bg_color}; overflow: hidden; }}
        .plotly-graph-div, .js-plotly-plot, .plot-container {{ width: 100vw !important; height: 100vh !important; }}
    </style>
</head>
<body>
    {chart_html}
</body>
</html>"""
    return HTMLResponse(content=html)


