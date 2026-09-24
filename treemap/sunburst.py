#!/usr/bin/env python3
"""
Dynamic Plotly Sunburst Chart connected to PostgreSQL.
Queries data directly from PostgreSQL ('auth_db') and displays the interactive Sunburst.
"""

import os
import numpy as np
import pandas as pd
import plotly.express as px
from sqlalchemy import create_engine, text

# PostgreSQL Database Connection URI
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://vikashkumarbharti@localhost:5432/auth_db"
)

def get_engine():
    return create_engine(DATABASE_URL)

def ensure_table_exists(engine):
    """Ensure the gapminder table is present in PostgreSQL."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gapminder');"
            )).scalar()
            if not result:
                print("Table 'gapminder' not found in PostgreSQL. Seeding from plotly.express...")
                df_seed = px.data.gapminder()
                df_seed.to_sql("gapminder", engine, if_exists="replace", index=False)
                print("Successfully inserted gapminder data into PostgreSQL.")
    except Exception as e:
        print(f"[Warning] DB Check: {e}")

def create_sunburst(
    year: int = 2007,
    table: str = "gapminder",
    path: list = None,
    values: str = "pop",
    color: str = "lifeExp",
    hover_data: list = None,
    color_scale: str = "RdBu",
    root_constant: str = "world"
):
    """
    Fetches data dynamically from PostgreSQL and renders the Plotly Sunburst.
    Matches the same approach as the Treemap chart.
    """
    engine = get_engine()
    ensure_table_exists(engine)
    
    # 1. Fetch data dynamically from PostgreSQL
    sql = f"SELECT * FROM {table}"
    if year is not None and "gapminder" in table:
        sql += f" WHERE year = {year}"
        
    print(f"Querying PostgreSQL: {sql}")
    df = pd.read_sql(sql, engine)
    print(f"Loaded {len(df)} records from PostgreSQL.")

    if df.empty:
        raise ValueError(f"No records returned from PostgreSQL for query: {sql}")

    # 2. Build hierarchical path
    if path is None:
        path = ['continent', 'country']
    
    sunburst_path = []
    if root_constant:
        sunburst_path.append(px.Constant(root_constant))
    sunburst_path.extend(path)

    # 3. Calculate weighted midpoint (lifeExp weighted by pop)
    if values in df.columns and color in df.columns and pd.api.types.is_numeric_dtype(df[color]):
        midpoint = np.average(df[color], weights=df[values])
        print(f"Calculated weighted midpoint for {color} (weighted by {values}): {midpoint:.2f}")
    else:
        midpoint = None

    # 4. Create Sunburst Chart
    sunburst_kwargs = {
        "data_frame": df,
        "path": sunburst_path,
        "values": values,
        "labels": {"lifeExp": "Value", "pop": "Population"},
        "hover_data": hover_data or ['iso_alpha']
    }

    if color in df.columns:
        sunburst_kwargs["color"] = color
        if pd.api.types.is_numeric_dtype(df[color]):
            sunburst_kwargs["color_continuous_scale"] = color_scale
            if midpoint is not None:
                sunburst_kwargs["color_continuous_midpoint"] = midpoint

    fig = px.sunburst(**sunburst_kwargs)

    # 5. Apply layout margin
    fig.update_layout(
        title=f"World Population Distribution ({year})",
        coloraxis_colorbar_title_text="",
        margin=dict(t=50, l=25, r=25, b=25)
    )

    # Save HTML copy for local viewing
    fig.write_html("sunburst.html")
    print("Saved chart to 'sunburst.html'.")

    # 6. Display chart
    print("Displaying Sunburst...")
    fig.show()
    return fig

if __name__ == "__main__":
    # Run with default year = 2007
    create_sunburst(year=2007)
