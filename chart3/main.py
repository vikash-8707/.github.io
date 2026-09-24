"""
FastAPI Server for 3D Bivariate Bar Chart Studio (chart3).
Provides interactive dashboard, standalone iframe embed, Plotly JSON API, and Matplotlib PNG export.
"""

import io
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Query, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server
import matplotlib.pyplot as plt

from chart3.database import get_postgres_schema
from chart3.postgres_3d_barchart import Postgres3DBarChart

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="3D Bivariate Bar Chart API (chart3)",
    description="High-performance 3D Bivariate Bar Charts querying PostgreSQL data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/", response_class=FileResponse)
async def serve_dashboard():
    """Serves the interactive 3D Bar Chart dashboard."""
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/schema")
async def get_schema():
    """Returns list of PostgreSQL tables and their numeric columns."""
    return get_postgres_schema()


@app.get("/api/chart")
async def get_chart_spec(
    table: str = Query("cars_data", description="PostgreSQL table name"),
    x_col: str = Query("Horsepower", description="Numeric column for X-axis"),
    y_col: str = Query("Miles_per_Gallon", description="Numeric column for Y-axis"),
    bins: int = Query(6, ge=2, le=20, description="Bin count per axis"),
    colormap: str = Query("Viridis", description="Color scheme name"),
    theme: str = Query("light", description="Theme: dark or light")
):
    """Returns Plotly 3D Figure specification as JSON."""
    chart = Postgres3DBarChart(
        table_name=table,
        x_col=x_col,
        y_col=y_col,
        bins=bins
    )
    chart.fetch_data()
    fig = chart.plot_plotly(colormap=colormap, theme=theme)
    
    # Calculate stats
    total_samples = len(chart.df) if chart.df is not None else 0
    max_count = int(chart.hist.max()) if chart.hist is not None else 0
    
    return {
        "spec": fig.to_dict(),
        "total_samples": total_samples,
        "max_bin_count": max_count,
        "table": table,
        "x_col": x_col,
        "y_col": y_col,
        "bins": bins
    }


@app.get("/api/chart/image")
async def get_chart_image(
    table: str = Query("cars_data"),
    x_col: str = Query("Horsepower"),
    y_col: str = Query("Miles_per_Gallon"),
    bins: int = Query(6, ge=2, le=20),
    colormap: str = Query("viridis"),
    theme: str = Query("light"),
    elevation: float = Query(28.0),
    azimuth: float = Query(-55.0)
):
    """Generates high-resolution Matplotlib 3D Bar PNG image."""
    chart = Postgres3DBarChart(
        table_name=table,
        x_col=x_col,
        y_col=y_col,
        bins=bins
    )
    chart.fetch_data()

    buf = io.BytesIO()
    fig = chart.plot_matplotlib(
        colormap=colormap.lower(),
        theme=theme,
        elevation=elevation,
        azimuth=azimuth,
        show=False
    )
    fig.savefig(buf, format="png", dpi=200, bbox_inches="tight", facecolor="#ffffff" if theme == "light" else "#0b0f19")
    plt.close(fig)
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")


@app.get("/embed", response_class=HTMLResponse)
async def embed_chart(
    table: str = Query("cars_data"),
    x_col: str = Query("Horsepower"),
    y_col: str = Query("Miles_per_Gallon"),
    bins: int = Query(6),
    colormap: str = Query("Viridis"),
    theme: str = Query("light")
):
    """Standalone full-screen interactive 3D Bar Chart for iframes."""
    chart = Postgres3DBarChart(
        table_name=table,
        x_col=x_col,
        y_col=y_col,
        bins=bins
    )
    chart.fetch_data()
    fig = chart.plot_plotly(colormap=colormap, theme=theme)
    bg_color = "#07090e" if theme == "dark" else "#ffffff"
    chart_html = fig.to_html(
        full_html=False,
        include_plotlyjs="cdn",
        config={"responsive": True, "displaylogo": False}
    )

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Bivariate Bar Chart (chart3)</title>
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
