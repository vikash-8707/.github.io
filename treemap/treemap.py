#!/usr/bin/env python3
"""
Dynamic Plotly Treemap connected to PostgreSQL.
Queries data directly from PostgreSQL ('auth_db') and displays the interactive Treemap.
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
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gapminder');"
        )).scalar()
        if not result:
            print("Table 'gapminder' not found in PostgreSQL. Seeding from plotly.express...")
            df_seed = px.data.gapminder()
            df_seed.to_sql("gapminder", engine, if_exists="replace", index=False)
            print("Successfully inserted gapminder data into PostgreSQL.")

def create_treemap(
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
    Fetches data dynamically from PostgreSQL and renders the Plotly Treemap.
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
    
    treemap_path = []
    if root_constant:
        treemap_path.append(px.Constant(root_constant))
    treemap_path.extend(path)

    # 3. Calculate weighted midpoint (lifeExp weighted by pop)
    if values in df.columns and color in df.columns:
        midpoint = np.average(df[color], weights=df[values])
        print(f"Calculated weighted midpoint for {color} (weighted by {values}): {midpoint:.2f}")
    else:
        midpoint = df[color].mean() if color in df.columns else None

    # 4. Create Treemap
    fig = px.treemap(
        df,
        path=treemap_path,
        values=values,
        color=color,
        labels={"lifeExp": "Value", "pop": "Population"},
        hover_data=hover_data or ['iso_alpha'],
        color_continuous_scale=color_scale,
        color_continuous_midpoint=midpoint
    )

    # 5. Apply layout margin matching user's exact specification
    fig.update_layout(
        title=f"World Population Distribution ({year})",
        coloraxis_colorbar_title_text="",
        margin=dict(t=50, l=25, r=25, b=25)
    )

    # Save HTML copy for local viewing
    fig.write_html("treemap.html")
    print("Saved chart to 'treemap.html'.")

    # 6. Display chart
    print("Displaying Treemap...")
    fig.show()
    return fig

if __name__ == "__main__":
    # Run with default year = 2007 (matches user snippet)
    create_treemap(year=2007)
