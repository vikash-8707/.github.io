from fastapi import FastAPI, Query, HTTPException, Body, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
import time

from chart_generator import (
    generate_single_3d_chart,
    generate_database_3d_chart,
    get_figure_json
)
import database

BASE_DIR = Path(__file__).resolve().parent

# Auto-initialize database on startup
database.init_database()

app = FastAPI(
    title="Dynamic 3D Chart & Database Visualization API",
    description="High-performance single 3D charts connected dynamically to your database",
    version="2.0.0"
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

# Mount Chart2 and Chart3 apps
try:
    from chart2.main import app as chart2_app
    app.mount("/chart2", chart2_app)
except Exception as e:
    print(f"Warning: Could not mount chart2: {e}")

try:
    from chart3.main import app as chart3_app
    app.mount("/chart3", chart3_app)
except Exception as e:
    print(f"Warning: Could not mount chart3: {e}")



@app.middleware("http")
async def allow_iframe_embed(request: Request, call_next):
    """Allow charts to be framed and disable HTML caching for hot reload."""
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    if request.url.path.endswith(".html") or request.url.path in ["/", "/all", "/treemap", "/sunburst"]:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    if request.url.path.startswith("/embed") or request.url.path.endswith("/embed"):
        if "x-frame-options" in response.headers:
            del response.headers["x-frame-options"]
        response.headers["Content-Security-Policy"] = "frame-ancestors *"
    return response


GURGAON_3D_MARKERS = [
    {
        "id": 1,
        "number": 1,
        "title": "DLF CyberHub",
        "latitude": 28.4951,
        "longitude": 77.0894,
        "description": "Iconic social and dining nexus integrated within India’s premier IT business district.",
        "category": "Commercial",
        "city": "gurgaon"
    },
    {
        "id": 2,
        "number": 2,
        "title": "Gateway Tower",
        "latitude": 28.4990,
        "longitude": 77.0940,
        "description": "Famous ship-shaped glass skyscraper welcoming visitors to Cyber City.",
        "category": "Skyscraper",
        "city": "gurgaon"
    },
    {
        "id": 3,
        "number": 3,
        "title": "Ambience Mall",
        "latitude": 28.5042,
        "longitude": 77.0970,
        "description": "Massive premium retail, dining, and entertainment destination on NH-48.",
        "category": "Shopping",
        "city": "gurgaon"
    },
    {
        "id": 4,
        "number": 4,
        "title": "One Horizon Center",
        "latitude": 28.4485,
        "longitude": 77.0975,
        "description": "Prestigious commercial tower on Golf Course Road, DLF Phase 5.",
        "category": "Skyscraper",
        "city": "gurgaon"
    },
    {
        "id": 5,
        "number": 5,
        "title": "Sector 29 Leisure Hub",
        "latitude": 28.4680,
        "longitude": 77.0678,
        "description": "Lively district with open parks, microbreweries, and dining venues.",
        "category": "Entertainment",
        "city": "gurgaon"
    },
    {
        "id": 6,
        "number": 6,
        "title": "Aravalli Biodiversity Park",
        "latitude": 28.4845,
        "longitude": 77.1085,
        "description": "Ecological reserve and walking trails amidst ancient Aravalli flora.",
        "category": "Park",
        "city": "gurgaon"
    },
    {
        "id": 7,
        "number": 7,
        "title": "The Camellias (DLF 5)",
        "latitude": 28.4550,
        "longitude": 77.0965,
        "description": "Super-luxury architectural skyscrapers along Golf Course Road.",
        "category": "Skyscraper",
        "city": "gurgaon"
    }
]

@app.get("/api/markers", summary="Fetch Gurgaon 3D Map Markers")
def get_map_markers(city: str = "gurgaon"):
    """Return Gurgaon landmarks for the 3D map."""
    return GURGAON_3D_MARKERS



def _chart_only_html(fig) -> str:
    chart_html = fig.to_html(
        full_html=False,
        include_plotlyjs="cdn",
        config={"responsive": True, "displaylogo": False}
    )
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Chart</title>
    <style>
        html, body {{ margin: 0; padding: 0; width: 100%; height: 100%; background: #ffffff; overflow: hidden; }}
        .plotly-graph-div, .js-plotly-plot, .plot-container {{ width: 100vw !important; height: 100vh !important; }}
    </style>
</head>
<body>
    {chart_html}
</body>
</html>"""


def _default_xyz(tables: List[Dict[str, Any]]) -> Tuple[str, str, str, str]:
    """Pick table + X/Y/Z columns when embed URL has no params."""
    if not tables:
        raise HTTPException(status_code=404, detail="No tables found in PostgreSQL.")

    preferred = next((t for t in tables if t["table_name"] == "medicine_data"), tables[0])
    table = preferred["table_name"]
    num = preferred.get("numeric_columns") or [c["name"] for c in preferred.get("columns", [])]
    presets = {
        "medicine_data": ("price", "stock", "id"),
        "sensor_measurements": ("pos_x", "pos_y", "altitude_z"),
        "terrain_elevation": ("x_coord", "y_coord", "elevation_z"),
        "business_metrics": ("rd_spend_millions", "marketing_spend_millions", "revenue_millions"),
    }
    if table in presets:
        x, y, z = presets[table]
        cols = set(num) | {c["name"] for c in preferred.get("columns", [])}
        if x in cols and y in cols and z in cols:
            return table, x, y, z
    if len(num) < 3:
        raise HTTPException(status_code=400, detail=f"Table '{table}' needs at least 3 numeric columns.")
    return table, num[0], num[1], num[2]


# Pydantic Schemas
class ConnectRequest(BaseModel):
    uri: str = Field(..., description="PostgreSQL connection URI, e.g. postgresql+psycopg2://user:pass@host:5432/dbname")


class CustomQueryRequest(BaseModel):
    sql: str = Field(..., description="Custom SQL SELECT query")
    x_col: str
    y_col: str
    z_col: str
    chart_type: str = "scatter"
    colorscale: str = "Viridis"
    dark_theme: bool = True


@app.get("/", response_class=FileResponse)
@app.get("/all", response_class=FileResponse)
@app.get("/all_charts.html", response_class=FileResponse)
async def serve_all_charts():
    """Serves the master all-in-one charts hub (all 14 chart engines)."""
    return FileResponse(BASE_DIR / "static" / "all_charts.html")


@app.get("/treemap", response_class=FileResponse)
async def serve_treemap():
    """Serves standalone PostgreSQL Gapminder Treemap."""
    return FileResponse(BASE_DIR / "static" / "treemap.html")


@app.get("/sunburst", response_class=FileResponse)
async def serve_sunburst():
    """Serves standalone PostgreSQL Gapminder Sunburst."""
    return FileResponse(BASE_DIR / "static" / "sunburst.html")




@app.get("/embed", response_class=HTMLResponse)
async def embed_chart_only(
    table: Optional[str] = Query(None),
    x: Optional[str] = Query(None),
    y: Optional[str] = Query(None),
    z: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    chart_type: str = Query("surface"),
    colorscale: str = Query("Viridis"),
    limit: int = Query(2500, ge=10, le=10000),
    dark_theme: bool = Query(False),
    resolution: int = Query(10, ge=5, le=80),
    power: float = Query(3.0, ge=0.5, le=5.0),
    function_type: str = Query("polynomial")
):
    """
    Chart-only page for embedding on another website (iframe).
    Default: one cubic Surface (z = x³ + y³), same look as the Plotly example.
    """
    try:
        if table and x and y and z:
            data = database.query_table_data(
                table_name=table,
                x_col=x,
                y_col=y,
                z_col=z,
                color_col=color,
                limit=limit
            )
            fig = generate_database_3d_chart(
                x_data=data["x"],
                y_data=data["y"],
                z_data=data["z"],
                color_data=data["color"],
                metadata_records=data.get("metadata"),
                x_label=x,
                y_label=y,
                z_label=z,
                color_label=color or z,
                chart_type=chart_type,
                colorscale=colorscale,
                dark_theme=dark_theme,
                title=""
            )
        else:
            fig = generate_single_3d_chart(
                resolution=resolution,
                power=power,
                x_min=-5.0,
                x_max=80.0,
                y_min=-5.0,
                y_max=60.0,
                function_type=function_type,
                colorscale=colorscale,
                dark_theme=dark_theme,
                title=""
            )
        fig.update_layout(margin=dict(l=0, r=0, t=0, b=0))
        return HTMLResponse(content=_chart_only_html(fig))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# Database Endpoints
# ==========================================

@app.get("/api/database/info")
async def get_db_info():
    """Returns active database connection metadata."""
    try:
        info = database.get_db_info()
        return {"status": "success", "data": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/database/tables")
async def list_database_tables():
    """Lists all tables with their columns, data types, and numeric compatibility."""
    try:
        tables = database.get_tables_metadata()
        return {"status": "success", "tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/database/connect")
async def connect_database(payload: ConnectRequest):
    """Connects to a new database URI and tests connectivity."""
    success, message = database.set_database_uri(payload.uri.strip())
    if not success:
        raise HTTPException(status_code=400, detail=message)

    tables = database.get_tables_metadata()
    return {
        "status": "success",
        "message": message,
        "info": database.get_db_info(),
        "tables": tables
    }


@app.get("/api/database/chart")
async def get_database_chart(
    table: str = Query(..., description="Table name to query"),
    x: str = Query(..., description="Column for X-axis"),
    y: str = Query(..., description="Column for Y-axis"),
    z: str = Query(..., description="Column for Z-axis"),
    color: Optional[str] = Query(None, description="Optional column for color scale"),
    chart_type: str = Query("scatter", description="Chart type: scatter, mesh, or surface"),
    colorscale: str = Query("Viridis", description="Plotly colorscale"),
    limit: int = Query(2500, ge=10, le=10000, description="Max rows to query"),
    dark_theme: bool = Query(True, description="Dark theme mode")
):
    """
    Fetches tabular data directly from database and creates a single 3D Plotly chart.
    """
    start_time = time.time()
    try:
        data = database.query_table_data(
            table_name=table,
            x_col=x,
            y_col=y,
            z_col=z,
            color_col=color,
            limit=limit
        )

        fig = generate_database_3d_chart(
            x_data=data["x"],
            y_data=data["y"],
            z_data=data["z"],
            color_data=data["color"],
            metadata_records=data.get("metadata"),
            x_label=x,
            y_label=y,
            z_label=z,
            color_label=color or z,
            chart_type=chart_type,
            colorscale=colorscale,
            dark_theme=dark_theme,
            title=f"3D Database Analysis — {table} ({z} vs {x}, {y})"
        )

        fig_json = get_figure_json(fig)
        calc_time_ms = round((time.time() - start_time) * 1000, 2)

        return JSONResponse(
            content={
                "status": "success",
                "metadata": {
                    "source": "database",
                    "table": table,
                    "row_count": data["row_count"],
                    "calculation_time_ms": calc_time_ms,
                    "x_col": x,
                    "y_col": y,
                    "z_col": z,
                    "chart_type": chart_type
                },
                "figure": fig_json
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/database/query-chart")
async def query_custom_chart(payload: CustomQueryRequest):
    """
    Runs a custom SQL query and visualizes the designated X, Y, Z columns in 3D.
    """
    start_time = time.time()
    try:
        res = database.execute_custom_query(payload.sql)
        records = res["full_records"]

        for col in [payload.x_col, payload.y_col, payload.z_col]:
            if col not in records:
                raise HTTPException(status_code=400, detail=f"Column '{col}' not found in query results.")

        fig = generate_database_3d_chart(
            x_data=records[payload.x_col],
            y_data=records[payload.y_col],
            z_data=records[payload.z_col],
            metadata_records=res.get("metadata"),
            x_label=payload.x_col,
            y_label=payload.y_col,
            z_label=payload.z_col,
            chart_type=payload.chart_type,
            colorscale=payload.colorscale,
            dark_theme=payload.dark_theme,
            title=f"Custom SQL 3D Visualization ({payload.z_col} vs {payload.x_col}, {payload.y_col})"
        )

        fig_json = get_figure_json(fig)
        calc_time_ms = round((time.time() - start_time) * 1000, 2)

        return JSONResponse(
            content={
                "status": "success",
                "metadata": {
                    "source": "custom_sql",
                    "row_count": res["row_count"],
                    "calculation_time_ms": calc_time_ms,
                    "x_col": payload.x_col,
                    "y_col": payload.y_col,
                    "z_col": payload.z_col,
                    "chart_type": payload.chart_type
                },
                "figure": fig_json
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==========================================
# Mathematical / Single Surface Endpoints
# ==========================================

@app.get("/api/chart")
async def get_chart_data(
    resolution: int = Query(10, ge=5, le=80, description="Grid resolution per axis"),
    power: float = Query(3.0, ge=0.5, le=5.0, description="Formula exponent power"),
    x_min: float = Query(-5.0, description="Minimum X range"),
    x_max: float = Query(80.0, description="Maximum X range"),
    y_min: float = Query(-5.0, description="Minimum Y range"),
    y_max: float = Query(60.0, description="Maximum Y range"),
    time_offset: float = Query(0.0, description="Dynamic phase / animation time parameter"),
    function_type: str = Query("polynomial", description="Surface mathematical formulation"),
    colorscale: str = Query("Viridis", description="Colorscale for 3D Surface"),
    c1: Optional[str] = Query(None, description="Backwards compatible c1 parameter"),
    dark_theme: bool = Query(False, description="Dark mode styling")
):
    """
    Computes single 3D surface data dynamically and returns Plotly JSON specs.
    """
    start_time = time.time()
    cscale = c1 or colorscale

    fig = generate_single_3d_chart(
        resolution=resolution,
        power=power,
        x_min=x_min,
        x_max=x_max,
        y_min=y_min,
        y_max=y_max,
        time_offset=time_offset,
        function_type=function_type,
        colorscale=cscale,
        dark_theme=dark_theme
    )

    fig_json = get_figure_json(fig)
    calc_time_ms = round((time.time() - start_time) * 1000, 2)

    return JSONResponse(
        content={
            "status": "success",
            "metadata": {
                "source": "math_surface",
                "calculation_time_ms": calc_time_ms,
                "grid_points": resolution * resolution,
                "total_vertices": resolution * resolution,
                "function": function_type,
                "power": power
            },
            "figure": fig_json
        }
    )


@app.get("/api/chart/embed", response_class=HTMLResponse)
async def get_chart_embed(
    resolution: int = Query(10, ge=5, le=60),
    power: float = Query(3.0, ge=0.5, le=5.0),
    time_offset: float = Query(0.0),
    function_type: str = Query("polynomial"),
    colorscale: str = Query("Viridis")
):
    """Returns a standalone embeddable single 3D chart HTML page."""
    fig = generate_single_3d_chart(
        resolution=resolution,
        power=power,
        time_offset=time_offset,
        function_type=function_type,
        colorscale=colorscale
    )
    fig.update_layout(margin=dict(l=0, r=0, t=0, b=0))
    return HTMLResponse(content=_chart_only_html(fig))


@app.get("/api/presets")
async def get_presets():
    """Returns preset mathematical geometries and parameters."""
    return {
        "presets": [
            {
                "id": "classic_cubic",
                "name": "Classic Cubic Surface (x³ + y³)",
                "power": 3.0,
                "resolution": 10,
                "function_type": "polynomial",
                "x_min": -5.0, "x_max": 80.0,
                "y_min": -5.0, "y_max": 60.0,
                "colorscale": "Viridis"
            },
            {
                "id": "quadratic_bowl",
                "name": "Parabolic Bowl (x² + y²)",
                "power": 2.0,
                "resolution": 30,
                "function_type": "polynomial",
                "x_min": -30.0, "x_max": 30.0,
                "y_min": -30.0, "y_max": 30.0,
                "colorscale": "Plasma"
            },
            {
                "id": "hyperbolic_saddle",
                "name": "Hyperbolic Saddle (x² - y²)",
                "power": 2.0,
                "resolution": 30,
                "function_type": "saddle",
                "x_min": -25.0, "x_max": 25.0,
                "y_min": -25.0, "y_max": 25.0,
                "colorscale": "Turbo"
            },
            {
                "id": "ripple_waves",
                "name": "Oscillating Circular Ripples",
                "power": 1.5,
                "resolution": 40,
                "function_type": "ripple",
                "x_min": -40.0, "x_max": 40.0,
                "y_min": -40.0, "y_max": 40.0,
                "colorscale": "Spectral"
            }
        ]
    }
