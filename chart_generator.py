import numpy as np
import pandas as pd
import plotly.graph_objects as go
from typing import List, Optional, Dict, Any, Union


def generate_single_3d_chart(
    resolution: int = 10,
    power: float = 3.0,
    x_min: float = -5.0,
    x_max: float = 80.0,
    y_min: float = -5.0,
    y_max: float = 60.0,
    time_offset: float = 0.0,
    function_type: str = "polynomial",
    colorscale: str = "Viridis",
    dark_theme: bool = False,
    title: Optional[str] = None
) -> go.Figure:
    """
    Single 3D Surface matching the Plotly cubic example:
    x, y grids with z = x³ + y³ and a Viridis colorscale.
    """
    res = max(5, min(int(resolution), 80))
    x = np.linspace(x_min, x_max, res)
    y = np.linspace(y_min, y_max, res)
    x_grid, y_grid = np.meshgrid(y, x)

    if function_type == "saddle":
        z = (x_grid ** power) - (y_grid ** power)
    elif function_type == "ripple":
        r = np.sqrt((x_grid - (x_max + x_min) / 2) ** 2 + (y_grid - (y_max + y_min) / 2) ** 2)
        z = np.sin(0.15 * r - time_offset) * (x_max ** power / 10.0)
    elif function_type == "gaussian_peaks":
        cx1, cy1 = (x_max * 0.3, y_max * 0.3)
        cx2, cy2 = (x_max * 0.7, y_max * 0.7)
        z1 = np.exp(-((x_grid - cx1)**2 + (y_grid - cy1)**2) / 400.0)
        z2 = np.exp(-((x_grid - cx2)**2 + (y_grid - cy2)**2) / 400.0)
        z = (z1 - z2) * (x_max ** power / 5.0) + (np.sin(time_offset) * 50)
    else:
        z = (x_grid ** power) + (y_grid ** power)
        if time_offset != 0.0:
            scale = np.max(np.abs(z)) * 0.08 if np.max(np.abs(z)) > 0 else 1.0
            z = z + scale * np.sin(0.1 * x_grid + time_offset) * np.cos(0.1 * y_grid + time_offset)

    fig = go.Figure()
    fig.add_trace(
        go.Surface(
            x=x,
            y=y,
            z=z,
            colorscale=colorscale,
            showscale=False
        )
    )

    chart_title = title if title is not None else "3D surface"

    layout_kwargs: Dict[str, Any] = dict(
        title_text=chart_title,
        autosize=True,
        margin=dict(l=0, r=0, t=48 if chart_title else 0, b=0),
        scene=dict(
            xaxis_title="x",
            yaxis_title="y",
            zaxis_title="z",
            aspectmode="auto",
        )
    )

    if dark_theme:
        layout_kwargs.update(
            paper_bgcolor="#0b0f19",
            plot_bgcolor="#0f172a",
            font=dict(color="#f1f5f9"),
            scene=dict(
                xaxis=dict(backgroundcolor="#0f172a", gridcolor="#334155", title="x"),
                yaxis=dict(backgroundcolor="#0f172a", gridcolor="#334155", title="y"),
                zaxis=dict(backgroundcolor="#0f172a", gridcolor="#334155", title="z"),
                aspectmode="auto",
            )
        )

    fig.update_layout(**layout_kwargs)
    return fig


def generate_database_3d_chart(
    x_data: List[float],
    y_data: List[float],
    z_data: List[float],
    color_data: Optional[List[Any]] = None,
    metadata_records: Optional[List[Dict[str, Any]]] = None,
    x_label: str = "X",
    y_label: str = "Y",
    z_label: str = "Z",
    color_label: Optional[str] = None,
    chart_type: str = "scatter",
    colorscale: str = "Viridis",
    dark_theme: bool = True,
    title: Optional[str] = None
) -> go.Figure:
    """
    Generates a single 3D visualization directly from PostgreSQL/database query results.
    Supports 3D Scatter, 3D Mesh, or 3D Surface with rich metadata hover cards.
    """
    fig = go.Figure()
    x_arr = np.array(x_data, dtype=float)
    y_arr = np.array(y_data, dtype=float)
    z_arr = np.array(z_data, dtype=float)

    # Convert color_data to numeric or categorical encoding if present
    c_vals = z_arr
    if color_data is not None and len(color_data) == len(z_arr):
        try:
            c_vals = np.array(color_data, dtype=float)
        except (ValueError, TypeError):
            # Categorical strings: assign integer codes
            unique_cats = list(dict.fromkeys(color_data))
            cat_map = {cat: idx for idx, cat in enumerate(unique_cats)}
            c_vals = np.array([cat_map[c] for c in color_data], dtype=float)

    bg_color = "#0f172a" if dark_theme else "#ffffff"
    paper_color = "#0b0f19" if dark_theme else "#f8fafc"
    font_color = "#f1f5f9" if dark_theme else "#0f172a"
    grid_color = "#334155" if dark_theme else "#e2e8f0"

    colorbar_config = dict(
        title=dict(text=color_label or z_label, font=dict(color=font_color)),
        tickfont=dict(color="#94a3b8" if dark_theme else "#475569"),
        len=0.75,
        thickness=18,
        outlinewidth=0
    )

    # Build rich hover tooltips from metadata
    hover_texts = []
    if metadata_records and len(metadata_records) == len(x_arr):
        for idx, rec in enumerate(metadata_records):
            # Prioritize identifier/name fields
            title_field = None
            for key in ["name", "title", "device_id", "company_code", "label"]:
                if key in rec and rec[key]:
                    title_field = f"<b>{rec[key]}</b>"
                    break

            lines = []
            if title_field:
                lines.append(title_field)

            lines.append(f"{x_label}: <b>{x_arr[idx]:,.2f}</b>")
            lines.append(f"{y_label}: <b>{y_arr[idx]:,.2f}</b>")
            lines.append(f"{z_label}: <b>{z_arr[idx]:,.2f}</b>")

            # Add extra fields (e.g. category, manufacturer, status)
            extra_count = 0
            for k, v in rec.items():
                if k not in [x_label, y_label, z_label, "name", "title", "device_id", "company_code"]:
                    lines.append(f"{k.capitalize()}: {v}")
                    extra_count += 1
                    if extra_count >= 3:
                        break

            hover_texts.append("<br>".join(lines))
    else:
        hover_texts = [
            f"<b>Point #{i+1}</b><br>{x_label}: {x:.2f}<br>{y_label}: {y:.2f}<br>{z_label}: {z:.2f}"
            for i, (x, y, z) in enumerate(zip(x_arr, y_arr, z_arr))
        ]

    if chart_type == "mesh":
        # 3D Triangulated Mesh
        fig.add_trace(
            go.Mesh3d(
                x=x_arr,
                y=y_arr,
                z=z_arr,
                intensity=c_vals,
                colorscale=colorscale,
                showscale=True,
                colorbar=colorbar_config,
                opacity=0.88,
                hovertext=hover_texts,
                hoverinfo="text",
                lighting=dict(
                    ambient=0.6,
                    diffuse=0.85,
                    specular=0.45,
                    roughness=0.4
                )
            )
        )
    elif chart_type == "surface":
        try:
            df = pd.DataFrame({"x": x_arr, "y": y_arr, "z": z_arr})
            df = df.drop_duplicates(subset=["x", "y"])
            pivot = df.pivot(index="y", columns="x", values="z")
            if pivot.isna().sum().sum() == 0 and pivot.shape[0] > 1 and pivot.shape[1] > 1:
                fig.add_trace(
                    go.Surface(
                        x=pivot.columns.values,
                        y=pivot.index.values,
                        z=pivot.values,
                        colorscale=colorscale,
                        showscale=True,
                        colorbar=colorbar_config,
                        contours_z=dict(show=True, usecolormap=True, highlightcolor="#10b981")
                    )
                )
            else:
                # Fallback to mesh
                fig.add_trace(
                    go.Mesh3d(
                        x=x_arr, y=y_arr, z=z_arr,
                        intensity=c_vals,
                        colorscale=colorscale,
                        showscale=True,
                        colorbar=colorbar_config,
                        hovertext=hover_texts,
                        hoverinfo="text"
                    )
                )
        except Exception:
            fig.add_trace(
                go.Scatter3d(
                    x=x_arr, y=y_arr, z=z_arr,
                    mode="markers",
                    hoverinfo="text",
                    hovertext=hover_texts,
                    marker=dict(
                        size=6,
                        color=c_vals,
                        colorscale=colorscale,
                        showscale=True,
                        colorbar=colorbar_config
                    )
                )
            )
    else:
        # Default: High-fidelity 3D Scatter Points
        fig.add_trace(
            go.Scatter3d(
                x=x_arr,
                y=y_arr,
                z=z_arr,
                mode="markers+text" if len(x_arr) <= 25 else "markers",
                hoverinfo="text",
                hovertext=hover_texts,
                text=[rec.get("name", "") if metadata_records and len(x_arr) <= 25 else "" for rec in (metadata_records or [{} for _ in x_arr])],
                textposition="top center",
                textfont=dict(color="#e2e8f0", size=10),
                marker=dict(
                    size=8 if len(x_arr) <= 100 else 5,
                    color=c_vals,
                    colorscale=colorscale,
                    showscale=True,
                    colorbar=colorbar_config,
                    opacity=0.9,
                    line=dict(width=1, color="#ffffff")
                )
            )
        )

    chart_title = title or f"PostgreSQL 3D Chart: {z_label} vs ({x_label}, {y_label})"

    fig.update_layout(
        title=dict(
            text=chart_title,
            x=0.5,
            xanchor="center",
            font=dict(family="Inter, sans-serif", size=19, color=font_color)
        ),
        autosize=True,
        margin=dict(l=10, r=10, t=50, b=20),
        paper_bgcolor=paper_color,
        plot_bgcolor=bg_color,
        font=dict(color=font_color, family="Inter, sans-serif"),
        scene=dict(
            xaxis=dict(
                backgroundcolor=bg_color,
                gridcolor=grid_color,
                showbackground=True,
                zerolinecolor=grid_color,
                title=dict(text=x_label, font=dict(color=font_color))
            ),
            yaxis=dict(
                backgroundcolor=bg_color,
                gridcolor=grid_color,
                showbackground=True,
                zerolinecolor=grid_color,
                title=dict(text=y_label, font=dict(color=font_color))
            ),
            zaxis=dict(
                backgroundcolor=bg_color,
                gridcolor=grid_color,
                showbackground=True,
                zerolinecolor=grid_color,
                title=dict(text=z_label, font=dict(color=font_color))
            ),
            camera=dict(
                eye=dict(x=1.7, y=1.7, z=1.2)
            )
        )
    )

    return fig


def generate_3d_subplots(*args, **kwargs) -> go.Figure:
    """Backwards compatibility alias that now delegates to single 3D chart."""
    cscale = kwargs.get("colorscales", ["Viridis"])[0] if "colorscales" in kwargs else kwargs.get("colorscale", "Viridis")
    return generate_single_3d_chart(
        resolution=kwargs.get("resolution", 30),
        power=kwargs.get("power", 3.0),
        x_min=kwargs.get("x_min", -5.0),
        x_max=kwargs.get("x_max", 80.0),
        y_min=kwargs.get("y_min", -5.0),
        y_max=kwargs.get("y_max", 60.0),
        time_offset=kwargs.get("time_offset", 0.0),
        function_type=kwargs.get("function_type", "polynomial"),
        colorscale=cscale,
        dark_theme=kwargs.get("dark_theme", True)
    )


def get_figure_json(fig: go.Figure) -> Dict[str, Any]:
    """Serializes figure to Python dict for JSON response."""
    import json
    return json.loads(fig.to_json())
