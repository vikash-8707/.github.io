#!/usr/bin/env python3
"""
Population Circle Packing using Circlify and Matplotlib.
Directly connected to PostgreSQL ('auth_db').
Exact implementation of user's circlify + matplotlib specification.
"""

import os
import matplotlib.pyplot as plt
import circlify
import pandas as pd
from sqlalchemy import create_engine

# 1. Connect to PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://vikashkumarbharti@localhost:5432/auth_db"
)
engine = create_engine(DATABASE_URL)

def get_hierarchical_data_from_db(year: int = 2007):
    """Fetch and organize hierarchical data from PostgreSQL."""
    sql = f"SELECT country, continent, pop FROM gapminder WHERE year = {year}"
    df = pd.read_sql(sql, engine)

    south_asia = {'India', 'Pakistan', 'Bangladesh', 'Afghanistan', 'Sri Lanka', 'Nepal'}
    north_america = {'United States', 'Canada'}

    def get_region(row):
        c = row['country']
        cont = row['continent']
        if c in south_asia:
            return 'South Asia'
        if c in north_america:
            return 'North America'
        if cont == 'Asia' or cont == 'Oceania':
            return 'East Asia & Pacific'
        if cont == 'Americas':
            return 'Latin America'
        if cont == 'Africa':
            return 'Sub-Saharan Africa'
        if cont == 'Europe':
            return 'Europe'
        return cont

    df['region'] = df.apply(get_region, axis=1)

    country_to_region = dict(zip(df['country'], df['region']))
    country_to_pop = dict(zip(df['country'], df['pop']))

    # Build hierarchical data structure for circlify
    data = []
    for region, grp in df.groupby('region'):
        top_countries = grp.sort_values('pop', ascending=False)
        children = []
        for _, row in top_countries.iterrows():
            children.append({
                "id": row['country'],
                "datum": int(row['pop']) / 1e6  # in millions
            })
        data.append({
            "id": region,
            "datum": int(grp['pop'].sum()) / 1e6,
            "children": children
        })

    return data, country_to_region, country_to_pop

def plot_circle_packing(year: int = 2007):
    # 1. Define the hierarchical data structure from PostgreSQL
    print(f"[1/4] Querying PostgreSQL ('auth_db') data for year {year}...")
    data, country_to_region, _ = get_hierarchical_data_from_db(year)

    # 2. Compute the circle positions and radii using circlify
    print("[2/4] Computing circle positions and radii using circlify...")
    circles = circlify.circlify(
        data,
        show_enclosure=True,
        target_enclosure=circlify.Circle(x=0, y=0, r=1)
    )

    # 3. Create the Matplotlib figure
    print("[3/4] Creating the Matplotlib figure...")
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.axis("off")

    # Find the limits to set proper plot boundaries
    lim = max(
        max(abs(circle.x) + circle.r, abs(circle.y) + circle.r)
        for circle in circles
    )
    plt.xlim(-lim, lim)
    plt.ylim(-lim, lim)

    # 4. Define colors for each main region category
    region_colors = {
        "East Asia & Pacific": "#1f77b4",
        "South Asia": "#36a2eb",
        "Sub-Saharan Africa": "#9b59b6",
        "Latin America": "#e67e22",
        "North America": "#1abc9c",
        "Europe": "#e84393"
    }

    # 5. Plot the circles
    for circle in circles:
        if not circle.ex:
            continue

        # Handle the parent (Region) circles
        if circle.level == 1:
            region_name = circle.ex["id"]
            color = region_colors.get(region_name, "#cccccc")

            # Draw main region circle
            ax.add_patch(
                plt.Circle(
                    (circle.x, circle.y),
                    circle.r,
                    alpha=0.2,
                    linewidth=2,
                    color=color,
                )
            )

            # Add Region Title
            plt.annotate(
                region_name.upper(),
                (circle.x, circle.y + circle.r * 0.88),
                va="center",
                ha="center",
                fontsize=9,
                fontweight="bold",
                color=color,
                bbox=dict(boxstyle="round,pad=0.2", fc="white", alpha=0.8, ec="none")
            )

        # Handle the child (Country) circles
        elif circle.level == 2:
            country_name = circle.ex["id"]
            parent_name = country_to_region.get(country_name, "Unknown")
            color = region_colors.get(parent_name, "#cccccc")

            # Draw country circle
            ax.add_patch(
                plt.Circle(
                    (circle.x, circle.y),
                    circle.r,
                    alpha=0.8,
                    linewidth=1,
                    color=color,
                )
            )

            # Add text labels inside country circles if they are big enough
            if circle.r > 0.035:
                plt.annotate(
                    country_name,
                    (circle.x, circle.y),
                    va="center",
                    ha="center",
                    fontsize=8,
                    fontweight="bold",
                    bbox=dict(
                        boxstyle="round,pad=0.2",
                        fc="white",
                        alpha=0.6,
                        ec="none",
                    ),
                )

    plt.title(f"Population Circle Packing by Region ({year}) - PostgreSQL Live", fontsize=15, pad=20)
    plt.tight_layout()

    output_png = "circles_circlify.png"
    plt.savefig(output_png, dpi=300, bbox_inches="tight")
    print(f"[4/4] Saved high-res chart to '{output_png}'")

    print("Displaying chart with plt.show()...")
    plt.show()

if __name__ == "__main__":
    plot_circle_packing(year=2007)
