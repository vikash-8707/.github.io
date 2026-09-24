# 3D Bivariate Bar Studio (`chart3`)

Production-grade 3D Bivariate Bar Chart application and module querying data directly from **PostgreSQL**.

Converts 2D numeric distributions into 3D bars (`np.histogram2d` + 3D Bar Mesh / Extrusion), providing both interactive **WebGL Plotly 3D** and publication-ready **Matplotlib 3D** image exports.

---

## Quick Start

### 1. Launch the Server
From the project root:
```bash
python3 chart3/run.py
```
Or with uvicorn:
```bash
uvicorn chart3.main:app --port 8002 --reload
```

### 2. Open in Browser
- **Interactive Dashboard**: [http://127.0.0.1:8002](http://127.0.0.1:8002)
- **Standalone Embed View**: [http://127.0.0.1:8002/embed](http://127.0.0.1:8002/embed)
- **API Documentation**: [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs)

---

## Standalone Python Script Usage

You can copy and run [`chart3/postgres_3d_barchart.py`](file:///Users/vikashkumarbharti/Desktop/charts/chart3/postgres_3d_barchart.py) in any project or environment:

```python
from chart3.postgres_3d_barchart import Postgres3DBarChart

# Initialize with PostgreSQL table & columns
chart = Postgres3DBarChart(
    db_uri="postgresql+psycopg2://vikashkumarbharti@localhost:5432/auth_db",
    table_name="cars_data",
    x_col="Horsepower",
    y_col="Miles_per_Gallon",
    bins=6
)

# 1. Generate high-res Matplotlib image for reports / PDFs
chart.plot_matplotlib(save_path="bivariate_3d.png", colormap="plasma", theme="dark")

# 2. Or export interactive WebGL Plotly HTML
chart.plot_plotly(save_html="bivariate_3d.html", colormap="Viridis")
```

---

## Iframe Embedding

Embed the live 3D chart on any website, report, or Notion page:

```html
<iframe
    src="http://127.0.0.1:8002/embed?table=cars_data&x_col=Horsepower&y_col=Miles_per_Gallon&bins=6&colormap=Viridis&theme=dark"
    width="100%"
    height="520"
    frameborder="0"
    style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>
```

---

## Directory Structure

```
chart3/
├── postgres_3d_barchart.py  # Standalone production module (Matplotlib + Plotly)
├── database.py              # PostgreSQL table & column schema inspection
├── main.py                  # FastAPI server (Dashboard, Embed, Plotly & PNG API)
├── run.py                   # Runner on port 8002
├── README.md                # Documentation
└── static/
    ├── app.js               # Client reactive logic and Plotly WebGL renderer
    ├── index.html           # Modern glassmorphic dashboard
    └── style.css            # Custom dark/light styling
```
