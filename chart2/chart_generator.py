"""
Altair Chart Generator Module for Chart2.
Provides dynamic violin and density plots based on user's Altair snippet.
"""

from typing import Optional, List, Dict, Any
import altair as alt
import pandas as pd
import numpy as np


def compute_auto_extent(df: pd.DataFrame, metric: str) -> List[float]:
    """Compute reasonable extent bounds for density estimation."""
    values = df[metric].dropna().values
    if len(values) == 0:
        return [0.0, 100.0]
    vmin = float(np.min(values))
    vmax = float(np.max(values))
    span = max(vmax - vmin, 1.0)
    # Add 5% padding
    lower = max(0.0, vmin - span * 0.05) if vmin >= 0 else vmin - span * 0.05
    upper = vmax + span * 0.05
    return [round(lower, 2), round(upper, 2)]


def generate_violin_chart(
    df: pd.DataFrame,
    metric: str = "Miles_per_Gallon",
    groupby: str = "Origin",
    extent: Optional[List[float]] = None,
    bandwidth: Optional[float] = None,
    stack: str = "center",
    width: int = 110,
    spacing: int = 4,
    color_scheme: str = "tableau10",
    opacity: float = 0.85,
    theme: str = "dark",
    metric_title: Optional[str] = None,
    group_title: Optional[str] = None,
    stroke_outline: bool = True
) -> alt.Chart:
    """
    Generate dynamic Altair violin density chart directly expanding the user's snippet.
    """
    if df.empty:
        raise ValueError("DataFrame is empty. Cannot generate chart.")

    if metric not in df.columns:
        raise ValueError(f"Metric '{metric}' not found in DataFrame.")

    if groupby not in df.columns:
        raise ValueError(f"Grouping column '{groupby}' not found in DataFrame.")

    # Clean data copy
    data_df = df.dropna(subset=[metric, groupby]).copy()
    if data_df.empty:
        raise ValueError(f"No valid data after dropping nulls for {metric} and {groupby}")

    # Determine extent
    if not extent or len(extent) != 2:
        extent = compute_auto_extent(data_df, metric)

    # Format human-friendly labels
    y_title = metric_title or metric.replace("_", " ")
    col_title = group_title or groupby.replace("_", " ")

    # Density transform kwargs
    density_kwargs: Dict[str, Any] = {
        "as_": [metric, "density"],
        "extent": extent,
        "groupby": [groupby]
    }
    if bandwidth is not None and bandwidth > 0:
        density_kwargs["bandwidth"] = float(bandwidth)

    # Mark parameters
    mark_kwargs: Dict[str, Any] = {
        "orient": "horizontal",
        "opacity": opacity
    }
    if stroke_outline:
        mark_kwargs["stroke"] = "#cbd5e1" if theme == "dark" else "#334155"
        mark_kwargs["strokeWidth"] = 1.0

    # Base chart with user snippet transform
    chart = alt.Chart(data_df, width=width).transform_density(
        metric,
        **density_kwargs
    ).mark_area(
        **mark_kwargs
    ).encode(
        alt.X("density:Q")
            .stack(stack if stack in ["center", "zero", "normalize"] else None)
            .impute(None)
            .title(None)
            .axis(labels=False, values=[0], grid=False, ticks=True),
        alt.Y(f"{metric}:Q")
            .title(y_title),
        alt.Color(f"{groupby}:N", scale=alt.Scale(scheme=color_scheme), legend=alt.Legend(title=col_title)),
        alt.Column(f"{groupby}:N", spacing=spacing)
            .header(
                title=col_title,
                titleOrient="bottom",
                labelOrient="bottom",
                labelPadding=4,
                titlePadding=10
            ),
        tooltip=[
            alt.Tooltip(f"{groupby}:N", title=col_title),
            alt.Tooltip(f"{metric}:Q", format=".2f", title=y_title),
            alt.Tooltip("density:Q", format=".4f", title="Probability Density")
        ]
    )

    # Apply Dark or Light Theme styling
    if theme == "dark":
        chart = chart.configure(
            background="#0b0f19"
        ).configure_axis(
            domainColor="#334155",
            gridColor="#1e293b",
            labelColor="#94a3b8",
            titleColor="#f1f5f9",
            labelFontSize=11,
            titleFontSize=12,
            titleFont="Inter, system-ui, sans-serif",
            labelFont="Inter, system-ui, sans-serif"
        ).configure_header(
            labelColor="#f1f5f9",
            titleColor="#cbd5e1",
            labelFontSize=12,
            titleFontSize=13,
            labelFont="Inter, system-ui, sans-serif",
            titleFont="Inter, system-ui, sans-serif"
        ).configure_legend(
            labelColor="#cbd5e1",
            titleColor="#f1f5f9",
            labelFontSize=11,
            titleFontSize=12,
            fillColor="#111827",
            strokeColor="#1f2937",
            padding=10,
            cornerRadius=8
        ).configure_view(
            stroke=None
        )
    else:
        chart = chart.configure(
            background="#ffffff"
        ).configure_axis(
            domainColor="#cbd5e1",
            gridColor="#f1f5f9",
            labelColor="#475569",
            titleColor="#0f172a",
            labelFontSize=11,
            titleFontSize=12,
            titleFont="Inter, system-ui, sans-serif",
            labelFont="Inter, system-ui, sans-serif"
        ).configure_header(
            labelColor="#0f172a",
            titleColor="#334155",
            labelFontSize=12,
            titleFontSize=13,
            labelFont="Inter, system-ui, sans-serif",
            titleFont="Inter, system-ui, sans-serif"
        ).configure_legend(
            labelColor="#334155",
            titleColor="#0f172a",
            labelFontSize=11,
            titleFontSize=12,
            fillColor="#f8fafc",
            strokeColor="#e2e8f0",
            padding=10,
            cornerRadius=8
        ).configure_view(
            stroke=None
        )

    return chart


def get_chart_json_spec(chart: alt.Chart) -> Dict[str, Any]:
    """Convert Altair chart into Vega-Lite JSON specification."""
    return chart.to_dict()


def generate_python_code_snippet(
    metric: str = "Miles_per_Gallon",
    groupby: str = "Origin",
    extent: Optional[List[float]] = None,
    bandwidth: Optional[float] = None,
    stack: str = "center",
    width: int = 100,
    spacing: int = 0,
    color_scheme: str = "tableau10",
    theme: str = "dark"
) -> str:
    """Generate exact reproducible Python Altair code."""
    bw_arg = f",\n    bandwidth={bandwidth}" if bandwidth else ""
    extent_arg = f",\n    extent={extent}" if extent else ""
    
    return f"""import altair as alt
from altair.datasets import data

# Load dataset
df = data.cars()

# Dynamic Violin Density Chart
chart = alt.Chart(df, width={width}).transform_density(
    '{metric}',
    as_=['{metric}', 'density']{extent_arg}{bw_arg},
    groupby=['{groupby}']
).mark_area(orient='horizontal').encode(
    alt.X('density:Q')
        .stack('{stack}')
        .impute(None)
        .title(None)
        .axis(labels=False, values=[0], grid=False, ticks=True),
    alt.Y('{metric}:Q'),
    alt.Color('{groupby}:N', scale=alt.Scale(scheme='{color_scheme}')),
    alt.Column('{groupby}:N', spacing={spacing})
        .header(titleOrient='bottom', labelOrient='bottom', labelPadding=0)
).configure_view(
    stroke=None
)

chart.show()
"""


def render_standalone_embed_html(chart: alt.Chart, theme: str = "dark") -> str:
    """Render full HTML document with embedded Vega-Lite chart for iframes."""
    bg_color = "#0b0f19" if theme == "dark" else "#ffffff"
    spec_json = chart.to_json()
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Altair Density Chart</title>
    <!-- Vega & Vega-Lite & Vega-Embed libraries -->
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        html, body {{
            width: 100%;
            height: 100%;
            background: {bg_color};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }}
        #vis {{
            max-width: 100%;
            display: flex;
            justify-content: center;
            padding: 16px;
        }}
    </style>
</head>
<body>
    <div id="vis"></div>
    <script>
        const spec = {spec_json};
        vegaEmbed('#vis', spec, {{
            renderer: 'svg',
            actions: {{
                export: true,
                source: false,
                compiled: false,
                editor: false
            }}
        }}).catch(console.error);
    </script>
</body>
</html>"""
