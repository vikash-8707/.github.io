"""
FastAPI Server for Sunburst Chart - Port 8050.
Connected directly to PostgreSQL ('auth_db').
"""

import os
import numpy as np
import pandas as pd
import plotly.express as px
from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse
from sqlalchemy import create_engine, text

app = FastAPI(title="PostgreSQL Sunburst (Port 8050)")

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

@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
def sunburst_view(year: int = 2007, color_by: str = "lifeExp"):
    ensure_gapminder_data()
    sql = f"SELECT * FROM gapminder WHERE year = {year}"
    df = pd.read_sql(sql, engine)

    if color_by == "lifeExp":
        midpoint = float(np.average(df['lifeExp'], weights=df['pop']))
        fig = px.sunburst(
            df,
            path=[px.Constant("world"), 'continent', 'country'],
            values='pop',
            color='lifeExp',
            hover_data=['iso_alpha'],
            color_continuous_scale='RdBu',
            color_continuous_midpoint=midpoint
        )
    else:
        fig = px.sunburst(
            df,
            path=[px.Constant("world"), 'continent', 'country'],
            values='pop',
            color='continent',
            hover_data=['iso_alpha']
        )

    fig.update_layout(
        margin=dict(t=50, l=25, r=25, b=25),
        autosize=True
    )

    chart_html = fig.to_html(include_plotlyjs='cdn', full_html=False, config={'responsive': True})

    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PostgreSQL Sunburst (Port 8050)</title>
    <style>
        html, body {{
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
        }}
        .top-nav {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 24px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            z-index: 100;
        }}
        .nav-left {{
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        .nav-title {{
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
        }}
        .color-selector {{
            display: flex;
            gap: 6px;
        }}
        .pill-btn {{
            font-size: 0.76rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 1px solid #cbd5e1;
            text-decoration: none;
            color: #64748b;
            transition: all 0.15s ease;
        }}
        .pill-btn:hover {{
            border-color: #94a3b8;
            color: #0f172a;
        }}
        .pill-btn.active {{
            background: #e11d48;
            border-color: #e11d48;
            color: #ffffff;
        }}
        .port-badges {{
            display: flex;
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
            background: #e11d48;
            color: #ffffff;
            box-shadow: 0 1px 3px rgba(225, 29, 72, 0.3);
        }}
        .port-badge:not(.active) {{
            background: #e2e8f0;
            color: #475569;
        }}
        .port-badge:not(.active):hover {{
            background: #cbd5e1;
            color: #0f172a;
        }}
        .chart-wrapper {{
            flex: 1;
            width: 100vw;
            height: calc(100vh - 54px);
        }}
    </style>
</head>
<body>
    <div class="top-nav">
        <div class="nav-left">
            <div class="nav-title">☀️ Sunburst Chart (PostgreSQL Live)</div>
            <div class="color-selector">
                <a href="/?color_by=lifeExp" class="pill-btn {'active' if color_by == 'lifeExp' else ''}">RdBu (Continuous Scale)</a>
                <a href="/?color_by=continent" class="pill-btn {'active' if color_by == 'continent' else ''}">By Continent</a>
            </div>
        </div>
        <div class="port-badges">
            <a href="http://127.0.0.1:8000" class="port-badge">Port 8000: Treemap ↗</a>
            <a href="http://127.0.0.1:8050" class="port-badge active">Port 8050: Sunburst</a>
            <a href="http://127.0.0.1:8051" class="port-badge">Port 8051: Circles ↗</a>
        </div>
    </div>
    <div class="chart-wrapper">
        {chart_html}
    </div>
</body>
</html>"""
    return HTMLResponse(content=page_html)

@app.get("/api/chart")
def get_chart_json(year: int = 2007, color_by: str = "lifeExp"):
    sql = f"SELECT * FROM gapminder WHERE year = {year}"
    df = pd.read_sql(sql, engine)
    if color_by == "lifeExp":
        midpoint = float(np.average(df['lifeExp'], weights=df['pop']))
        fig = px.sunburst(
            df,
            path=[px.Constant("world"), 'continent', 'country'],
            values='pop',
            color='lifeExp',
            hover_data=['iso_alpha'],
            color_continuous_scale='RdBu',
            color_continuous_midpoint=midpoint
        )
    else:
        fig = px.sunburst(
            df,
            path=[px.Constant("world"), 'continent', 'country'],
            values='pop',
            color='continent',
            hover_data=['iso_alpha']
        )
    fig.update_layout(margin=dict(t=50, l=25, r=25, b=25))
    return fig.to_dict()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("sunburst_app:app", host="127.0.0.1", port=8050, reload=True)
