/**
 * Chart3: 3D Bivariate Bar Studio Frontend Client
 */

let schemaData = null;
let currentTheme = 'dark';
let activePane = 'plotly-pane';
let debounceTimer = null;

const state = {
    table: 'cars_data',
    x_col: 'Horsepower',
    y_col: 'Miles_per_Gallon',
    bins: 6,
    colormap: 'Viridis',
    elevation: 28,
    azimuth: -55
};

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initEventListeners();
    await loadSchema();
    triggerUpdate();
});

function initTheme() {
    const saved = localStorage.getItem('chart3_theme');
    if (saved === 'light') {
        document.body.classList.add('light-theme');
        currentTheme = 'light';
        document.getElementById('theme-icon').className = 'ph-bold ph-moon';
    }
}

async function loadSchema() {
    try {
        const res = await fetch('/api/schema');
        schemaData = await res.json();

        const tableSelect = document.getElementById('table-select');
        tableSelect.innerHTML = '';

        if (schemaData.tables && schemaData.tables.length > 0) {
            schemaData.tables.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.table_name;
                opt.textContent = `${t.table_name} (${t.row_count} rows)`;
                tableSelect.appendChild(opt);
            });

            state.table = schemaData.default_table || schemaData.tables[0].table_name;
            tableSelect.value = state.table;
            populateColumnSelectors(state.table);
        }
    } catch (err) {
        console.warn('Failed to load schema:', err);
    }
}

function populateColumnSelectors(tableName) {
    const xSelect = document.getElementById('x-col-select');
    const ySelect = document.getElementById('y-col-select');
    xSelect.innerHTML = '';
    ySelect.innerHTML = '';

    const tableMeta = schemaData.tables.find(t => t.table_name === tableName);
    if (!tableMeta || !tableMeta.numeric_columns) return;

    const cols = tableMeta.numeric_columns;
    cols.forEach((col, idx) => {
        const optX = document.createElement('option');
        optX.value = col;
        optX.textContent = col.replace('_', ' ');
        xSelect.appendChild(optX);

        const optY = document.createElement('option');
        optY.value = col;
        optY.textContent = col.replace('_', ' ');
        ySelect.appendChild(optY);
    });

    if (cols.includes('Horsepower') && cols.includes('Miles_per_Gallon')) {
        state.x_col = 'Horsepower';
        state.y_col = 'Miles_per_Gallon';
    } else if (cols.length >= 2) {
        state.x_col = cols[0];
        state.y_col = cols[1];
    }

    xSelect.value = state.x_col;
    ySelect.value = state.y_col;
}

function initEventListeners() {
    document.getElementById('table-select').addEventListener('change', (e) => {
        state.table = e.target.value;
        populateColumnSelectors(state.table);
        triggerUpdate();
    });

    document.getElementById('x-col-select').addEventListener('change', (e) => {
        state.x_col = e.target.value;
        triggerUpdate();
    });

    document.getElementById('y-col-select').addEventListener('change', (e) => {
        state.y_col = e.target.value;
        triggerUpdate();
    });

    document.getElementById('bins-slider').addEventListener('input', (e) => {
        state.bins = parseInt(e.target.value);
        document.getElementById('bins-val').textContent = `${state.bins} x ${state.bins}`;
        triggerUpdate();
    });

    document.getElementById('colormap-select').addEventListener('change', (e) => {
        state.colormap = e.target.value;
        triggerUpdate();
    });

    document.getElementById('elev-slider').addEventListener('input', (e) => {
        state.elevation = parseFloat(e.target.value);
        document.getElementById('elev-val').textContent = `${state.elevation}°`;
        if (activePane === 'image-pane') updateMatplotlibImage();
    });

    document.getElementById('azim-slider').addEventListener('input', (e) => {
        state.azimuth = parseFloat(e.target.value);
        document.getElementById('azim-val').textContent = `${state.azimuth}°`;
        if (activePane === 'image-pane') updateMatplotlibImage();
    });

    // Theme Toggle
    document.getElementById('theme-btn').addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        currentTheme = isLight ? 'light' : 'dark';
        localStorage.setItem('chart3_theme', currentTheme);
        document.getElementById('theme-icon').className = isLight ? 'ph-bold ph-moon' : 'ph-bold ph-sun';
        triggerUpdate();
    });

    // Tab Navigation
    document.querySelectorAll('.vis-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.vis-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            activePane = btn.dataset.pane;
            const target = document.getElementById(activePane);
            if (target) target.classList.add('active');

            if (activePane === 'image-pane') {
                updateMatplotlibImage();
            } else if (activePane === 'code-pane') {
                updateCodeSnippet();
            }
        });
    });

    // Copy Code Button
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        const codeText = document.getElementById('code-snippet-pre').textContent;
        navigator.clipboard.writeText(codeText);
        const btn = document.getElementById('copy-code-btn');
        btn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy Code'; }, 1800);
    });

    // Embed Modal
    const modal = document.getElementById('embed-modal');
    document.getElementById('open-embed-btn').addEventListener('click', () => {
        updateEmbedModal();
        modal.classList.add('open');
    });

    document.getElementById('close-embed-btn').addEventListener('click', () => {
        modal.classList.remove('open');
    });

    document.getElementById('copy-embed-btn').addEventListener('click', () => {
        const code = document.getElementById('embed-code-area').value;
        navigator.clipboard.writeText(code);
        const btn = document.getElementById('copy-embed-btn');
        btn.innerHTML = '<i class="ph-bold ph-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="ph-bold ph-copy"></i> Copy Iframe'; }, 1800);
    });

    document.getElementById('open-embed-tab-btn').addEventListener('click', () => {
        const url = `${window.location.origin}/embed?table=${state.table}&x_col=${state.x_col}&y_col=${state.y_col}&bins=${state.bins}&colormap=${state.colormap}&theme=${currentTheme}`;
        window.open(url, '_blank');
    });
}

function triggerUpdate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchAndUpdateChart();
    }, 120);
}

async function fetchAndUpdateChart() {
    try {
        const params = new URLSearchParams({
            table: state.table,
            x_col: state.x_col,
            y_col: state.y_col,
            bins: state.bins,
            colormap: state.colormap,
            theme: currentTheme
        });

        const res = await fetch(`/api/chart?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch chart spec');
        const data = await res.json();

        // Render Plotly 3D
        Plotly.react('plotly-3d-div', data.spec.data, data.spec.layout, { responsive: true, displaylogo: false });

        // Update KPIs
        document.getElementById('kpi-records').textContent = data.total_samples || '0';
        document.getElementById('kpi-peak').textContent = data.max_bin_count || '0';
        document.getElementById('kpi-table').textContent = data.table;
        document.getElementById('chart-heading').textContent = `3D Bivariate Distribution: ${state.x_col} vs ${state.y_col} (${state.table})`;

        if (activePane === 'image-pane') updateMatplotlibImage();
        if (activePane === 'code-pane') updateCodeSnippet();

    } catch (err) {
        console.error('Render error:', err);
    }
}

function updateMatplotlibImage() {
    const params = new URLSearchParams({
        table: state.table,
        x_col: state.x_col,
        y_col: state.y_col,
        bins: state.bins,
        colormap: state.colormap.toLowerCase(),
        theme: currentTheme,
        elevation: state.elevation,
        azimuth: state.azimuth
    });
    document.getElementById('matplotlib-img').src = `/api/chart/image?${params.toString()}&t=${Date.now()}`;
}

function updateCodeSnippet() {
    const code = `import numpy as np
import pandas as pd
from sqlalchemy import create_engine
import matplotlib.pyplot as plt
from matplotlib import cm
from matplotlib.colors import Normalize

# 1. Connect to PostgreSQL
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/auth_db")
query = 'SELECT "${state.x_col}", "${state.y_col}" FROM "${state.table}" WHERE "${state.x_col}" IS NOT NULL AND "${state.y_col}" IS NOT NULL'
df = pd.read_sql(query, engine)

# 2. Compute 2D Bivariate Histogram
x = df["${state.x_col}"].values
y = df["${state.y_col}"].values
hist, xedges, yedges = np.histogram2d(x, y, bins=${state.bins})

# 3. Construct 3D Bars
xpos, ypos = np.meshgrid(xedges[:-1], yedges[:-1], indexing="ij")
xpos = xpos.ravel()
ypos = ypos.ravel()
zpos = np.zeros_like(xpos)

dx = (xedges[1] - xedges[0]) * 0.85
dy = (yedges[1] - yedges[0]) * 0.85
dz = hist.ravel()

# 4. Render 3D Bar Chart
fig = plt.figure(figsize=(10, 7), facecolor="${currentTheme === 'dark' ? '#0b0f19' : '#ffffff'}")
ax = fig.add_subplot(projection="3d", facecolor="${currentTheme === 'dark' ? '#111827' : '#f8fafc'}")

norm = Normalize(vmin=0, vmax=max(dz.max(), 1))
colors = cm.${state.colormap.toLowerCase()}(norm(dz))

ax.bar3d(xpos, ypos, zpos, dx, dy, dz, color=colors, zsort="average", alpha=0.9, edgecolor="black", linewidth=0.5)
ax.set_xlabel("${state.x_col}")
ax.set_ylabel("${state.y_col}")
ax.set_zlabel("")
ax.set_title("3D Bivariate Histogram: ${state.x_col} vs ${state.y_col}")
ax.view_init(elev=${state.elevation}, azim=${state.azimuth})

plt.tight_layout()
plt.show()
`;
    document.getElementById('code-snippet-pre').textContent = code;
}

function updateEmbedModal() {
    const url = `${window.location.origin}/embed?table=${state.table}&x_col=${state.x_col}&y_col=${state.y_col}&bins=${state.bins}&colormap=${state.colormap}&theme=${currentTheme}`;
    const iframeCode = `<iframe src="${url}" width="100%" height="520" frameborder="0" style="border-radius:12px; border:1px solid rgba(255,255,255,0.1);"></iframe>`;
    document.getElementById('embed-code-area').value = iframeCode;
}
