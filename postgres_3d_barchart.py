"""
================================================================================
Production-Grade 3D Bivariate Bar Chart from PostgreSQL
================================================================================
Author: Antigravity Assistant
Description:
    Reads 2D numeric data from a PostgreSQL database, computes a bivariate
    histogram (np.histogram2d), and renders high-fidelity 3D bar visualizations
    using both Matplotlib (publication quality) and Plotly (interactive WebGL).

Features:
    - Robust PostgreSQL connection via SQLAlchemy with pooling & error handling.
    - Automatic NaN filtering and data validation.
    - Offline fallback to synthetic data if database is temporarily unavailable.
    - Matplotlib 3D Bar renderer with depth shading, elevation, and high-DPI export.
    - Plotly 3D Vectorized Mesh renderer for 60-FPS interactive web exploration.
    - CLI interface with argparse for standalone or scriptable execution.
================================================================================
"""

import os
import sys
import argparse
from typing import Optional, Tuple, List, Dict, Any, Union
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# Matplotlib imports
import matplotlib
import matplotlib.pyplot as plt
from matplotlib import cm
from matplotlib.colors import Normalize

# Plotly imports
import plotly.graph_objects as go


# Default PostgreSQL URI (reads from environment if available)
DEFAULT_POSTGRES_URI = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://vikashkumarbharti@localhost:5432/auth_db"
)


class Postgres3DBarChart:
    """
    Constructs and renders 3D bivariate bar charts from PostgreSQL data.
    """

    def __init__(
        self,
        db_uri: str = DEFAULT_POSTGRES_URI,
        table_name: str = "cars_data",
        x_col: str = "Horsepower",
        y_col: str = "Miles_per_Gallon",
        bins: Union[int, Tuple[int, int]] = 6,
        x_label: Optional[str] = None,
        y_label: Optional[str] = None,
        z_label: str = "",
        title: Optional[str] = None
    ):
        """
        Initialize the 3D Bar Chart configuration.

        :param db_uri: SQLAlchemy connection string.
        :param table_name: Target PostgreSQL table name.
        :param x_col: Name of column for X-axis.
        :param y_col: Name of column for Y-axis.
        :param bins: Number of histogram bins (int or (x_bins, y_bins)).
        :param x_label: Human-readable label for X-axis.
        :param y_label: Human-readable label for Y-axis.
        :param z_label: Label for Z-axis count.
        :param title: Chart title.
        """
        self.db_uri = db_uri
        self.table_name = table_name
        self.x_col = x_col
        self.y_col = y_col
        self.bins = (bins, bins) if isinstance(bins, int) else bins
        self.x_label = x_label or x_col.replace("_", " ")
        self.y_label = y_label or y_col.replace("_", " ")
        self.z_label = z_label
        self.title = title or f"3D Bivariate Distribution: {self.x_label} vs {self.y_label}"

        self.df: Optional[pd.DataFrame] = None
        self.hist: Optional[np.ndarray] = None
        self.xedges: Optional[np.ndarray] = None
        self.yedges: Optional[np.ndarray] = None
        self.engine: Optional[Engine] = None

    def connect(self) -> Engine:
        """Establish or return cached SQLAlchemy engine."""
        if self.engine is None:
            self.engine = create_engine(
                self.db_uri,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10
            )
        return self.engine

    def fetch_data(self) -> pd.DataFrame:
        """
        Fetch requested columns from PostgreSQL, handling nulls and errors.
        Falls back to synthetic data if database connection fails.
        """
        query = f"""
            SELECT "{self.x_col}", "{self.y_col}"
            FROM "{self.table_name}"
            WHERE "{self.x_col}" IS NOT NULL 
              AND "{self.y_col}" IS NOT NULL
        """
        try:
            eng = self.connect()
            with eng.connect() as conn:
                df = pd.read_sql(text(query), conn)
            
            if df.empty:
                raise ValueError(f"Table '{self.table_name}' returned 0 non-null rows.")

            # Coerce to numeric
            df[self.x_col] = pd.to_numeric(df[self.x_col], errors="coerce")
            df[self.y_col] = pd.to_numeric(df[self.y_col], errors="coerce")
            df = df.dropna()

            print(f"✓ Fetched {len(df)} rows from PostgreSQL [{self.table_name}].")
            self.df = df
            return df

        except Exception as err:
            print(f"⚠️ PostgreSQL query failed ({err}). Generating synthetic fallback data.")
            return self._generate_fallback_data()

    def _generate_fallback_data(self) -> pd.DataFrame:
        """Generates realistic correlated fallback data if PostgreSQL is unreachable."""
        np.random.seed(42)
        n = 300
        x = np.random.uniform(50, 230, n)
        y = np.clip(50 - 0.18 * x + np.random.normal(0, 4, n), 8, 48)
        self.df = pd.DataFrame({self.x_col: x, self.y_col: y})
        return self.df

    def compute_bivariate_histogram(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Compute 2D histogram from dataframe.
        Returns: (hist_matrix, xedges, yedges)
        """
        if self.df is None:
            self.fetch_data()

        x_vals = self.df[self.x_col].values
        y_vals = self.df[self.y_col].values

        hist, xedges, yedges = np.histogram2d(
            x_vals,
            y_vals,
            bins=self.bins
        )
        self.hist = hist
        self.xedges = xedges
        self.yedges = yedges
        return hist, xedges, yedges

    def plot_matplotlib(
        self,
        colormap: str = "viridis",
        theme: str = "light",
        alpha: float = 0.88,
        bar_gap_ratio: float = 0.85,
        elevation: float = 28.0,
        azimuth: float = -55.0,
        figsize: Tuple[int, int] = (11, 8),
        save_path: Optional[str] = None,
        show: bool = True
    ) -> plt.Figure:
        """
        Render publication-quality Matplotlib 3D Bar Chart.

        :param colormap: Matplotlib colormap (e.g. 'viridis', 'plasma', 'coolwarm').
        :param theme: 'dark' or 'light' styling.
        :param alpha: Bar opacity (0.0 - 1.0).
        :param bar_gap_ratio: Width ratio for bars (0.85 leaves subtle gap).
        :param elevation: Viewing elevation angle in degrees.
        :param azimuth: Viewing azimuth angle in degrees.
        :param figsize: Figure size in inches.
        :param save_path: Optional file path to save PNG/PDF image.
        :param show: Whether to invoke plt.show().
        :return: matplotlib Figure instance.
        """
        if self.hist is None:
            self.compute_bivariate_histogram()

        # Construct 3D bar coordinates
        nx, ny = self.hist.shape
        xpos, ypos = np.meshgrid(self.xedges[:-1], self.yedges[:-1], indexing="ij")
        xpos = xpos.ravel()
        ypos = ypos.ravel()
        zpos = np.zeros_like(xpos)

        dx = (self.xedges[1] - self.xedges[0]) * bar_gap_ratio
        dy = (self.yedges[1] - self.yedges[0]) * bar_gap_ratio
        dz = self.hist.ravel()

        # Setup Theme Colors
        if theme == "dark":
            bg_color = "#0b0f19"
            card_color = "#111827"
            text_color = "#f8fafc"
            grid_color = "#334155"
            edge_color = "#475569"
        else:
            bg_color = "#ffffff"
            card_color = "#f8fafc"
            text_color = "#0f172a"
            grid_color = "#cbd5e1"
            edge_color = "#334155"

        fig = plt.figure(figsize=figsize, facecolor=bg_color)
        ax = fig.add_subplot(projection="3d", facecolor=card_color)

        # Normalize colors to frequency height
        norm = Normalize(vmin=0, vmax=max(dz.max(), 1))
        cmap = getattr(cm, colormap, cm.viridis)
        colors = cmap(norm(dz))

        # Render 3D Bars
        ax.bar3d(
            xpos,
            ypos,
            zpos,
            dx,
            dy,
            dz,
            color=colors,
            zsort="average",
            alpha=alpha,
            edgecolor=edge_color,
            linewidth=0.6,
            shade=True
        )

        # Axis styling & labels
        ax.set_xlabel(f"\n{self.x_label}", fontsize=11, fontweight="bold", color=text_color, labelpad=10)
        ax.set_ylabel(f"\n{self.y_label}", fontsize=11, fontweight="bold", color=text_color, labelpad=10)
        ax.set_zlabel(f"\n{self.z_label}", fontsize=11, fontweight="bold", color=text_color, labelpad=10)
        ax.set_title(self.title, fontsize=14, fontweight="bold", color=text_color, pad=20)

        # Tick styling
        ax.tick_params(colors=text_color, labelsize=9)
        ax.xaxis.pane.set_edgecolor(grid_color)
        ax.yaxis.pane.set_edgecolor(grid_color)
        ax.zaxis.pane.set_edgecolor(grid_color)
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        ax.grid(color=grid_color, linestyle="--", linewidth=0.5, alpha=0.5)

        # Camera view angle
        ax.view_init(elev=elevation, azim=azimuth)

        # Colorbar
        sm = cm.ScalarMappable(cmap=cmap, norm=norm)
        sm.set_array([])
        cbar = fig.colorbar(sm, ax=ax, shrink=0.55, aspect=14, pad=0.08)
        cbar.set_label(self.z_label, color=text_color, fontsize=10, fontweight="bold")
        cbar.ax.tick_params(colors=text_color)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches="tight", facecolor=bg_color)
            print(f"✓ Saved Matplotlib 3D chart image to: {save_path}")

        if show:
            plt.show()

        return fig

    def plot_plotly(
        self,
        colormap: str = "Viridis",
        theme: str = "light",
        opacity: float = 0.92,
        bar_gap_ratio: float = 0.82,
        save_html: Optional[str] = None,
        show: bool = False
    ) -> go.Figure:
        """
        Render interactive 3D WebGL Bar Chart using Plotly.

        :param colormap: Plotly colorscale ('Viridis', 'Plasma', 'Inferno', 'Turbo', 'Blues').
        :param theme: 'dark' or 'light'.
        :param opacity: Bar opacity (0.1 - 1.0).
        :param bar_gap_ratio: Gap ratio between bars.
        :param save_html: Optional file path to export standalone HTML.
        :param show: Whether to open in web browser.
        :return: plotly.graph_objects.Figure instance.
        """
        if self.hist is None:
            self.compute_bivariate_histogram()

        nx, ny = self.hist.shape
        all_x, all_y, all_z = [], [], []
        all_i, all_j, all_k = [], [], []
        intensity = []

        # 12 triangles per 3D box (8 vertices)
        base_i = [7, 0, 0, 0, 4, 4, 2, 6, 4, 0, 3, 7]
        base_j = [3, 4, 1, 2, 5, 6, 5, 2, 0, 1, 6, 3]
        base_k = [0, 7, 2, 3, 6, 7, 1, 1, 5, 5, 7, 6]

        bar_idx = 0
        for xi in range(nx):
            for yi in range(ny):
                dz = float(self.hist[xi, yi])
                if dz <= 0:
                    continue

                x = float(self.xedges[xi])
                y = float(self.yedges[yi])
                dx = float((self.xedges[xi + 1] - self.xedges[xi]) * bar_gap_ratio)
                dy = float((self.yedges[yi + 1] - self.yedges[yi]) * bar_gap_ratio)

                # 8 vertices for rectangular cuboid
                vx = [x, x + dx, x + dx, x, x, x + dx, x + dx, x]
                vy = [y, y, y + dy, y + dy, y, y, y + dy, y + dy]
                vz = [0.0, 0.0, 0.0, 0.0, dz, dz, dz, dz]

                offset = bar_idx * 8
                all_x.extend(vx)
                all_y.extend(vy)
                all_z.extend(vz)
                all_i.extend([idx + offset for idx in base_i])
                all_j.extend([idx + offset for idx in base_j])
                all_k.extend([idx + offset for idx in base_k])
                intensity.extend([dz] * 8)
                bar_idx += 1

        mesh = go.Mesh3d(
            x=all_x,
            y=all_y,
            z=all_z,
            i=all_i,
            j=all_j,
            k=all_k,
            intensity=intensity,
            colorscale=colormap,
            opacity=opacity,
            flatshading=True,
            colorbar=dict(
                title=dict(text=self.z_label, font=dict(color="#f8fafc" if theme == "dark" else "#0f172a")),
                tickfont=dict(color="#cbd5e1" if theme == "dark" else "#475569"),
                len=0.75,
                thickness=18
            ),
            hoverinfo="skip"
        )

        # Setup Layout
        bg_color = "#07090e" if theme == "dark" else "#ffffff"
        text_color = "#f8fafc" if theme == "dark" else "#0f172a"
        grid_color = "#1e293b" if theme == "dark" else "#e2e8f0"

        layout = go.Layout(
            title=dict(
                text=self.title,
                font=dict(size=18, family="Inter, sans-serif", color=text_color),
                x=0.5,
                y=0.95
            ),
            paper_bgcolor=bg_color,
            plot_bgcolor=bg_color,
            scene=dict(
                xaxis=dict(
                    title=dict(text=self.x_label, font=dict(color=text_color, size=12)),
                    tickfont=dict(color="#94a3b8"),
                    gridcolor=grid_color,
                    backgroundcolor=bg_color,
                    showbackground=True
                ),
                yaxis=dict(
                    title=dict(text=self.y_label, font=dict(color=text_color, size=12)),
                    tickfont=dict(color="#94a3b8"),
                    gridcolor=grid_color,
                    backgroundcolor=bg_color,
                    showbackground=True
                ),
                zaxis=dict(
                    title=dict(text=self.z_label, font=dict(color=text_color, size=12)),
                    tickfont=dict(color="#94a3b8"),
                    gridcolor=grid_color,
                    backgroundcolor=bg_color,
                    showbackground=True
                ),
                camera=dict(
                    eye=dict(x=1.65, y=-1.65, z=1.2)
                )
            ),
            margin=dict(l=20, r=20, b=20, t=50)
        )

        fig = go.Figure(data=[mesh], layout=layout)

        if save_html:
            fig.write_html(save_html, include_plotlyjs="cdn", full_html=True)
            print(f"✓ Saved interactive Plotly 3D HTML to: {save_html}")

        if show:
            fig.show()

        return fig


# CLI Entry Point
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate 3D Bivariate Bar Chart from PostgreSQL")
    parser.add_argument("--db-uri", default=DEFAULT_POSTGRES_URI, help="PostgreSQL connection URI")
    parser.add_argument("--table", default="cars_data", help="PostgreSQL table name")
    parser.add_argument("--x", default="Horsepower", help="X-axis column")
    parser.add_argument("--y", default="Miles_per_Gallon", help="Y-axis column")
    parser.add_argument("--bins", type=int, default=6, help="Histogram bins per axis")
    parser.add_argument("--colormap", default="viridis", help="Colormap (viridis, plasma, etc.)")
    parser.add_argument("--theme", choices=["dark", "light"], default="dark", help="Color theme")
    parser.add_argument("--interactive", action="store_true", help="Render interactive Plotly 3D HTML")
    parser.add_argument("--save-img", default=None, help="Save Matplotlib image to file (e.g. chart.png)")
    parser.add_argument("--save-html", default=None, help="Save Plotly HTML to file (e.g. chart.html)")

    args = parser.parse_args()

    chart = Postgres3DBarChart(
        db_uri=args.db_uri,
        table_name=args.table,
        x_col=args.x,
        y_col=args.y,
        bins=args.bins
    )

    chart.fetch_data()
    chart.compute_bivariate_histogram()

    if args.interactive or args.save_html:
        html_out = args.save_html or "bivariate_3d_chart.html"
        chart.plot_plotly(colormap=args.colormap.capitalize(), theme=args.theme, save_html=html_out, show=args.interactive)
    else:
        img_out = args.save_img or "bivariate_3d_chart.png"
        chart.plot_matplotlib(colormap=args.colormap.lower(), theme=args.theme, save_path=img_out, show=False)
        print(f"✓ Generated 3D bar chart saved to: {img_out}")
