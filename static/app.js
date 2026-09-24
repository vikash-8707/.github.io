// Dynamic 3D Single Chart & Database Visualization Controller
document.addEventListener('DOMContentLoaded', () => {
    // Top-level DOM Elements
    const chartDiv = document.getElementById('plotly-chart');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const dbStatusText = document.getElementById('db-status-text');
    const statusDot = document.querySelector('.status-dot');
    const chartSourceBadge = document.getElementById('chart-source-badge');
    const chartAxesBadge = document.getElementById('chart-axes-badge');
    const metricLatency = document.getElementById('metric-latency');
    const metricVertices = document.getElementById('metric-vertices');
    
    // Tab Navigation
    const tabBtnDb = document.getElementById('tab-btn-db');
    const tabBtnMath = document.getElementById('tab-btn-math');
    const panelDb = document.getElementById('panel-db');
    const panelMath = document.getElementById('panel-math');
    
    // Database Mode Elements
    const activeDbName = document.getElementById('active-db-name');
    const editDbBtn = document.getElementById('edit-db-btn');
    const dbConnDrawer = document.getElementById('db-conn-drawer');
    const dbUriInput = document.getElementById('db-uri-input');
    const connectDbBtn = document.getElementById('connect-db-btn');
    const cancelDbBtn = document.getElementById('cancel-db-btn');
    const connFeedback = document.getElementById('conn-feedback');
    
    const dbTableSelect = document.getElementById('db-table-select');
    const tableRowCount = document.getElementById('table-row-count');
    const xAxisSelect = document.getElementById('x-axis-select');
    const yAxisSelect = document.getElementById('y-axis-select');
    const zAxisSelect = document.getElementById('z-axis-select');
    const dbColorscale = document.getElementById('db-colorscale');
    const rowLimitSlider = document.getElementById('row-limit-slider');
    const rowLimitVal = document.getElementById('row-limit-val');
    const loadDbChartBtn = document.getElementById('load-db-chart-btn');
    const chartTypeRadios = document.querySelectorAll('input[name="db-chart-type"]');
    
    // Custom SQL Elements
    const sqlDrawerToggle = document.getElementById('sql-drawer-toggle');
    const sqlDrawer = document.getElementById('sql-drawer');
    const sqlArrow = document.getElementById('sql-arrow');
    const customSqlInput = document.getElementById('custom-sql-input');
    const runSqlBtn = document.getElementById('run-sql-btn');
    
    // Math Mode Elements
    const presetSelect = document.getElementById('preset-select');
    const functionSelect = document.getElementById('function-type');
    const powerSlider = document.getElementById('power-slider');
    const powerVal = document.getElementById('power-val');
    const resolutionSlider = document.getElementById('resolution-slider');
    const resolutionVal = document.getElementById('resolution-val');
    const morphToggle = document.getElementById('morph-toggle');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    const mathColorscale = document.getElementById('math-colorscale');
    const updateMathBtn = document.getElementById('update-math-btn');
    
    // Top Nav Controls
    const syncCameraBtn = document.getElementById('sync-camera-btn');
    const snapshotBtn = document.getElementById('snapshot-btn');

    // State Variables
    let activeMode = 'db'; // 'db' or 'math'
    let tablesData = [];
    let isPlotInitialized = false;
    let isFetching = false;
    let isMorphing = false;
    let morphPhase = 0.0;
    let morphAnimationId = null;
    let mathDebounceTimer = null;

    // Presets for Math Surface Mode
    const mathPresets = {
        classic_cubic: { power: 3.0, resolution: 10, function_type: 'polynomial', colorscale: 'Viridis' },
        quadratic_bowl: { power: 2.0, resolution: 30, function_type: 'polynomial', colorscale: 'Plasma' },
        hyperbolic_saddle: { power: 2.0, resolution: 30, function_type: 'saddle', colorscale: 'Turbo' },
        ripple_waves: { power: 1.5, resolution: 35, function_type: 'ripple', colorscale: 'Spectral' }
    };

    // Initialize Application
    async function init() {
        setupEventListeners();
        await loadDatabaseMetadata();
        switchMode('math');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Tab switching
        tabBtnDb.addEventListener('click', () => switchMode('db'));
        tabBtnMath.addEventListener('click', () => switchMode('math'));

        // DB Connection Drawer
        editDbBtn.addEventListener('click', () => {
            dbConnDrawer.classList.toggle('hidden');
        });
        cancelDbBtn.addEventListener('click', () => {
            dbConnDrawer.classList.add('hidden');
            connFeedback.textContent = '';
        });
        connectDbBtn.addEventListener('click', handleDatabaseConnect);

        // Table and Column Selection
        dbTableSelect.addEventListener('change', onTableSelected);
        [xAxisSelect, yAxisSelect, zAxisSelect].forEach(select => {
            select.addEventListener('change', () => {
                updateAxesBadge();
            });
        });

        // Radio Card Selection Styling
        chartTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
                e.target.closest('.radio-card').classList.add('active');
            });
        });

        // Row Limit Slider
        rowLimitSlider.addEventListener('input', (e) => {
            rowLimitVal.textContent = Number(e.target.value).toLocaleString();
        });

        // Custom SQL Drawer Toggle
        sqlDrawerToggle.addEventListener('click', () => {
            const isHidden = sqlDrawer.classList.toggle('hidden');
            sqlArrow.textContent = isHidden ? '▼' : '▲';
        });

        runSqlBtn.addEventListener('click', handleCustomSqlQuery);
        loadDbChartBtn.addEventListener('click', () => updateDatabaseChart());

        // Math Mode Inputs
        powerSlider.addEventListener('input', (e) => {
            powerVal.textContent = parseFloat(e.target.value).toFixed(1);
            debouncedMathUpdate();
        });

        resolutionSlider.addEventListener('input', (e) => {
            resolutionVal.textContent = e.target.value;
            debouncedMathUpdate();
        });

        speedSlider.addEventListener('input', (e) => {
            speedVal.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
        });

        presetSelect.addEventListener('change', (e) => {
            const p = mathPresets[e.target.value];
            if (p) {
                powerSlider.value = p.power;
                powerVal.textContent = p.power.toFixed(1);
                resolutionSlider.value = p.resolution;
                resolutionVal.textContent = p.resolution;
                functionSelect.value = p.function_type;
                mathColorscale.value = p.colorscale;
                updateMathChart(false);
            }
        });

        functionSelect.addEventListener('change', () => updateMathChart(false));
        mathColorscale.addEventListener('change', () => updateMathChart(false));
        updateMathBtn.addEventListener('click', () => updateMathChart(false));

        // Morphing animation toggle
        morphToggle.addEventListener('change', (e) => {
            isMorphing = e.target.checked;
            if (isMorphing) {
                morphLoop();
            } else {
                if (morphAnimationId) cancelAnimationFrame(morphAnimationId);
                morphPhase = 0.0;
                updateMathChart(false);
            }
        });

        // Top Nav Controls
        syncCameraBtn.addEventListener('click', resetCamera);
        snapshotBtn.addEventListener('click', exportSnapshot);

        // Window resize
        window.addEventListener('resize', () => {
            if (isPlotInitialized) Plotly.Plots.resize(chartDiv);
        });
    }

    // Switch between Database and Math mode
    function switchMode(mode) {
        if (activeMode === mode) return;
        activeMode = mode;

        if (mode === 'db') {
            tabBtnDb.classList.add('active');
            tabBtnMath.classList.remove('active');
            panelDb.classList.add('active');
            panelMath.classList.remove('active');

            if (isMorphing) {
                morphToggle.checked = false;
                isMorphing = false;
                if (morphAnimationId) cancelAnimationFrame(morphAnimationId);
            }
            updateDatabaseChart();
        } else {
            tabBtnMath.classList.add('active');
            tabBtnDb.classList.remove('active');
            panelMath.classList.add('active');
            panelDb.classList.remove('active');
            chartSourceBadge.textContent = '📐 Formula Surface';
            chartAxesBadge.textContent = 'z = f(x, y)';
            updateMathChart(false);
        }
    }

    // Load Database Metadata & Schema
    async function loadDatabaseMetadata() {
        try {
            // Get connection info
            const infoRes = await fetch('/api/database/info');
            if (infoRes.ok) {
                const infoData = await infoRes.json();
                const d = infoData.data;
                const dbDisplay = `${(d.dialect || 'postgresql').toUpperCase()} (${d.uri})`;
                activeDbName.textContent = dbDisplay;
                dbStatusText.textContent = 'Connected';
                statusDot.style.background = '#10b981';
            }

            // Get tables
            const tablesRes = await fetch('/api/database/tables');
            if (!tablesRes.ok) throw new Error('Failed to fetch tables list');

            const payload = await tablesRes.json();
            tablesData = payload.tables || [];

            // Populate table selector
            dbTableSelect.innerHTML = '';
            tablesData.forEach((tbl, idx) => {
                const opt = document.createElement('option');
                opt.value = tbl.table_name;
                opt.textContent = `${tbl.table_name} (${tbl.row_count.toLocaleString()} rows)`;
                dbTableSelect.appendChild(opt);
            });

            if (tablesData.length > 0) {
                // If medicine_data or a table with rows exists, select it
                const medIdx = tablesData.findIndex(t => t.table_name === 'medicine_data');
                dbTableSelect.selectedIndex = medIdx !== -1 ? medIdx : 0;
                onTableSelected();
            }
        } catch (err) {
            console.error('Error loading database metadata:', err);
            dbStatusText.textContent = 'Error';
            statusDot.style.background = '#f43f5e';
        }
    }

    // Populate Column Dropdowns when a table is selected
    function onTableSelected() {
        const selectedTableName = dbTableSelect.value;
        const tbl = tablesData.find(t => t.table_name === selectedTableName);
        if (!tbl) return;

        tableRowCount.textContent = `${tbl.row_count.toLocaleString()} rows`;

        // Available columns (prefer numeric columns, fallback to all)
        const numCols = tbl.numeric_columns.length > 0 ? tbl.numeric_columns : tbl.columns.map(c => c.name);

        populateSelect(xAxisSelect, numCols);
        populateSelect(yAxisSelect, numCols);
        populateSelect(zAxisSelect, numCols);

        // Intelligent default assignment
        if (selectedTableName === 'medicine_data') {
            setSelectValue(xAxisSelect, 'price');
            setSelectValue(yAxisSelect, 'stock');
            setSelectValue(zAxisSelect, 'id');
        } else if (selectedTableName === 'sensor_measurements') {
            setSelectValue(xAxisSelect, 'pos_x');
            setSelectValue(yAxisSelect, 'pos_y');
            setSelectValue(zAxisSelect, 'altitude_z');
        } else if (selectedTableName === 'terrain_elevation') {
            setSelectValue(xAxisSelect, 'x_coord');
            setSelectValue(yAxisSelect, 'y_coord');
            setSelectValue(zAxisSelect, 'elevation_z');
        } else if (selectedTableName === 'business_metrics') {
            setSelectValue(xAxisSelect, 'rd_spend_millions');
            setSelectValue(yAxisSelect, 'marketing_spend_millions');
            setSelectValue(zAxisSelect, 'revenue_millions');
        } else {
            // Default first 3 columns
            if (numCols.length >= 3) {
                xAxisSelect.selectedIndex = 0;
                yAxisSelect.selectedIndex = 1;
                zAxisSelect.selectedIndex = 2;
            }
        }

        updateAxesBadge();
    }

    function populateSelect(selectEl, options) {
        selectEl.innerHTML = '';
        options.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            selectEl.appendChild(opt);
        });
    }

    function setSelectValue(selectEl, value) {
        for (let i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value === value) {
                selectEl.selectedIndex = i;
                return;
            }
        }
    }

    function updateAxesBadge() {
        const table = dbTableSelect.value;
        chartSourceBadge.textContent = `🗄️ Database: ${table}`;
        chartAxesBadge.textContent = `Z: ${zAxisSelect.value} vs (${xAxisSelect.value}, ${yAxisSelect.value})`;
    }

    // Get selected chart type
    function getSelectedChartType() {
        const checked = document.querySelector('input[name="db-chart-type"]:checked');
        return checked ? checked.value : 'scatter';
    }

    // Fetch and Render Single 3D Chart from Database
    async function updateDatabaseChart() {
        if (isFetching) return;
        isFetching = true;
        loadingText.textContent = 'Querying database & generating 3D chart...';
        loadingOverlay.classList.add('active');

        const table = dbTableSelect.value;
        const x = xAxisSelect.value;
        const y = yAxisSelect.value;
        const z = zAxisSelect.value;
        const chartType = getSelectedChartType();
        const colorscale = dbColorscale.value;
        const limit = rowLimitSlider.value;

        const params = new URLSearchParams({
            table, x, y, z,
            chart_type: chartType,
            colorscale,
            limit,
            dark_theme: true
        });

        const fetchStartTime = performance.now();

        try {
            const res = await fetch(`/api/database/chart?${params.toString()}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `HTTP ${res.status}`);
            }

            const payload = await res.json();
            const figure = payload.figure;
            const meta = payload.metadata;

            const clientLatency = Math.round(performance.now() - fetchStartTime);
            metricLatency.textContent = `${meta.calculation_time_ms} ms (tot: ${clientLatency}ms)`;
            metricVertices.textContent = meta.row_count.toLocaleString();

            renderPlotlyFigure(figure);
            updateAxesBadge();
        } catch (err) {
            console.error('Error fetching database 3D chart:', err);
            alert(`Error querying database: ${err.message}`);
        } finally {
            isFetching = false;
            loadingOverlay.classList.remove('active');
        }
    }

    // Handle Custom SQL Query Execution
    async function handleCustomSqlQuery() {
        const sql = customSqlInput.value.trim();
        if (!sql) {
            alert('Please enter a SELECT query.');
            return;
        }

        loadingText.textContent = 'Executing custom SQL query...';
        loadingOverlay.classList.add('active');

        const payload = {
            sql: sql,
            x_col: xAxisSelect.value,
            y_col: yAxisSelect.value,
            z_col: zAxisSelect.value,
            chart_type: getSelectedChartType(),
            colorscale: dbColorscale.value,
            dark_theme: true
        };

        const fetchStartTime = performance.now();

        try {
            const res = await fetch('/api/database/query-chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const clientLatency = Math.round(performance.now() - fetchStartTime);
            metricLatency.textContent = `${data.metadata.calculation_time_ms} ms (tot: ${clientLatency}ms)`;
            metricVertices.textContent = data.metadata.row_count.toLocaleString();

            renderPlotlyFigure(data.figure);
            chartSourceBadge.textContent = '⚡ Custom SQL Query';
        } catch (err) {
            alert(`SQL Query Error: ${err.message}`);
        } finally {
            loadingOverlay.classList.remove('active');
        }
    }

    // Connect to Custom Database URI
    async function handleDatabaseConnect() {
        const uri = dbUriInput.value.trim();
        if (!uri) return;

        connFeedback.textContent = 'Connecting...';
        connFeedback.style.color = '#38bdf8';

        try {
            const res = await fetch('/api/database/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uri })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Connection failed');

            connFeedback.textContent = '✓ ' + data.message;
            connFeedback.style.color = '#10b981';

            // Reload table list
            await loadDatabaseMetadata();
            await updateDatabaseChart();

            setTimeout(() => {
                dbConnDrawer.classList.add('hidden');
                connFeedback.textContent = '';
            }, 1800);
        } catch (err) {
            connFeedback.textContent = '✗ ' + err.message;
            connFeedback.style.color = '#f43f5e';
        }
    }

    // Fetch and Render Single 3D Mathematical Surface
    async function updateMathChart(isBackground = false) {
        if (isFetching && isBackground) return;
        isFetching = true;

        if (!isPlotInitialized && !isBackground) {
            loadingText.textContent = 'Computing 3D mathematical surface...';
            loadingOverlay.classList.add('active');
        }

        const params = new URLSearchParams({
            resolution: resolutionSlider.value,
            power: powerSlider.value,
            function_type: functionSelect.value,
            time_offset: morphPhase.toFixed(3),
            colorscale: mathColorscale.value,
            dark_theme: false
        });

        const fetchStartTime = performance.now();

        try {
            const res = await fetch(`/api/chart?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const payload = await res.json();
            const figure = payload.figure;
            const meta = payload.metadata;

            const clientLatency = Math.round(performance.now() - fetchStartTime);
            metricLatency.textContent = `${meta.calculation_time_ms} ms (tot: ${clientLatency}ms)`;
            metricVertices.textContent = meta.total_vertices.toLocaleString();

            renderPlotlyFigure(figure);
        } catch (err) {
            console.error('Error fetching math chart:', err);
        } finally {
            isFetching = false;
            loadingOverlay.classList.remove('active');
        }
    }

    // Debounced update for math sliders
    function debouncedMathUpdate() {
        clearTimeout(mathDebounceTimer);
        mathDebounceTimer = setTimeout(() => {
            updateMathChart(false);
        }, 120);
    }

    // Live Morphing Loop for Math Mode
    function morphLoop() {
        if (!isMorphing) return;
        const speed = parseFloat(speedSlider.value) * 0.08;
        morphPhase = (morphPhase + speed) % (Math.PI * 100);

        if (!isFetching) {
            updateMathChart(true);
        }

        morphAnimationId = requestAnimationFrame(morphLoop);
    }

    // Core Plotly Render Helper (Preserves 3D camera angles across renders)
    function renderPlotlyFigure(figure) {
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['toImage'],
            displaylogo: false
        };

        // Plotly.react smoothly updates data & layout without resetting user rotation
        Plotly.react(chartDiv, figure.data, figure.layout, config).then(() => {
            isPlotInitialized = true;
        });
    }

    // Reset Camera Angle
    function resetCamera() {
        const defaultEye = { x: 1.7, y: 1.7, z: 1.2 };
        Plotly.relayout(chartDiv, { 'scene.camera.eye': defaultEye });
    }

    // Download High-Res PNG
    function exportSnapshot() {
        Plotly.downloadImage(chartDiv, {
            format: 'png',
            width: 1920,
            height: 1080,
            filename: `3d_chart_${activeMode}_${Date.now()}`
        });
    }

    // Start application
    init();
});
