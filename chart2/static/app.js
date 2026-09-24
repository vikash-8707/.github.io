/**
 * Dynamic Altair Density Dashboard Application Client
 */

// Application State
const state = {
    metric: 'Miles_per_Gallon',
    groupby: 'Origin',
    autoBandwidth: true,
    bandwidth: 3.0,
    stack: 'center',
    autoExtent: true,
    extentMin: 5,
    extentMax: 50,
    width: 110,
    spacing: 4,
    opacity: 0.85,
    strokeOutline: true,
    colorScheme: 'tableau10',
    theme: 'dark',
    origins: ['USA', 'Europe', 'Japan'],
    cylinders: [3, 4, 5, 6, 8],
    minYear: 1970,
    maxYear: 1982
};

let debounceTimer = null;
let currentSpec = null;
let currentCode = "";

// Presets Definition
const PRESETS = {
    mpg: {
        metric: 'Miles_per_Gallon',
        groupby: 'Origin',
        autoBandwidth: true,
        bandwidth: 3.0,
        stack: 'center',
        width: 115,
        spacing: 4,
        colorScheme: 'tableau10'
    },
    hp: {
        metric: 'Horsepower',
        groupby: 'Cylinders',
        autoBandwidth: true,
        bandwidth: 12.0,
        stack: 'center',
        width: 90,
        spacing: 6,
        colorScheme: 'plasma'
    },
    weight: {
        metric: 'Weight_in_lbs',
        groupby: 'Origin',
        autoBandwidth: true,
        bandwidth: 250.0,
        stack: 'center',
        width: 120,
        spacing: 8,
        colorScheme: 'viridis'
    },
    accel: {
        metric: 'Acceleration',
        groupby: 'Origin',
        autoBandwidth: true,
        bandwidth: 1.5,
        stack: 'center',
        width: 115,
        spacing: 4,
        colorScheme: 'magma'
    }
};

// DOM Elements Initialization
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initEventListeners();
    await loadInitialSchema();
    await checkPostgresStatus();
    await loadCarsListFor3D();
    init3DStudioControls();
    triggerUpdate();
});

function initTheme() {
    const isLight = localStorage.getItem('altair_theme') === 'light';
    if (isLight) {
        document.body.classList.add('light-theme');
        state.theme = 'light';
        updateThemeIcon(true);
    } else {
        document.body.classList.remove('light-theme');
        state.theme = 'dark';
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isLight) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = isLight ? 'ph-bold ph-moon' : 'ph-bold ph-sun';
    }
}

async function loadInitialSchema() {
    try {
        const res = await fetch('/api/schema');
        if (!res.ok) return;
        const schema = await res.json();
        
        // Update metric extent ranges in sliders if available
        const currentMetricMeta = schema.numeric_columns.find(c => c.id === state.metric);
        if (currentMetricMeta) {
            updateExtentSliderBounds(currentMetricMeta.min, currentMetricMeta.max);
        }
    } catch (e) {
        console.warn('Schema fetch warning:', e);
    }
}

function updateExtentSliderBounds(minVal, maxVal) {
    const minSlider = document.getElementById('extent-min-slider');
    const maxSlider = document.getElementById('extent-max-slider');
    if (minSlider && maxSlider) {
        const floorMin = Math.floor(minVal);
        const ceilMax = Math.ceil(maxVal);
        minSlider.min = floorMin;
        minSlider.max = ceilMax;
        maxSlider.min = floorMin;
        maxSlider.max = ceilMax;

        if (state.autoExtent) {
            state.extentMin = floorMin;
            state.extentMax = ceilMax;
            minSlider.value = floorMin;
            maxSlider.value = ceilMax;
            document.getElementById('extent-min-val').textContent = floorMin;
            document.getElementById('extent-max-val').textContent = ceilMax;
        }
    }
}

function initEventListeners() {
    // Metric Selector
    const metricSelect = document.getElementById('metric-select');
    metricSelect.addEventListener('change', (e) => {
        state.metric = e.target.value;
        onMetricChanged();
    });

    // Groupby Selector
    const groupbySelect = document.getElementById('groupby-select');
    groupbySelect.addEventListener('change', (e) => {
        state.groupby = e.target.value;
        triggerUpdate();
    });

    // Auto Bandwidth Toggle
    const autoBwToggle = document.getElementById('auto-bandwidth-toggle');
    const bwGroup = document.getElementById('bandwidth-group');
    const bwSlider = document.getElementById('bandwidth-slider');
    const bwVal = document.getElementById('bandwidth-val');

    autoBwToggle.addEventListener('change', (e) => {
        state.autoBandwidth = e.target.checked;
        if (state.autoBandwidth) {
            bwGroup.style.opacity = '0.5';
            bwGroup.style.pointerEvents = 'none';
            bwVal.textContent = 'Auto';
        } else {
            bwGroup.style.opacity = '1';
            bwGroup.style.pointerEvents = 'auto';
            bwVal.textContent = bwSlider.value;
            state.bandwidth = parseFloat(bwSlider.value);
        }
        triggerUpdate();
    });

    bwSlider.addEventListener('input', (e) => {
        state.bandwidth = parseFloat(e.target.value);
        bwVal.textContent = state.bandwidth;
        triggerUpdate();
    });

    // Stack Mode Radios
    const stackRadios = document.querySelectorAll('input[name="stack-mode"]');
    stackRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.stack = e.target.value;
            document.getElementById('stack-center-label').classList.toggle('active', state.stack === 'center');
            document.getElementById('stack-zero-label').classList.toggle('active', state.stack === 'zero');
            triggerUpdate();
        });
    });

    // Auto Extent Toggle
    const autoExtentToggle = document.getElementById('auto-extent-toggle');
    const manualExtentContainer = document.getElementById('manual-extent-container');
    autoExtentToggle.addEventListener('change', (e) => {
        state.autoExtent = e.target.checked;
        manualExtentContainer.style.display = state.autoExtent ? 'none' : 'block';
        triggerUpdate();
    });

    // Extent Sliders
    const extentMinSlider = document.getElementById('extent-min-slider');
    const extentMaxSlider = document.getElementById('extent-max-slider');
    extentMinSlider.addEventListener('input', (e) => {
        state.extentMin = parseFloat(e.target.value);
        document.getElementById('extent-min-val').textContent = state.extentMin;
        triggerUpdate();
    });
    extentMaxSlider.addEventListener('input', (e) => {
        state.extentMax = parseFloat(e.target.value);
        document.getElementById('extent-max-val').textContent = state.extentMax;
        triggerUpdate();
    });

    // Width Slider
    const widthSlider = document.getElementById('width-slider');
    widthSlider.addEventListener('input', (e) => {
        state.width = parseInt(e.target.value);
        document.getElementById('width-val').textContent = `${state.width}px`;
        triggerUpdate();
    });

    // Spacing Slider
    const spacingSlider = document.getElementById('spacing-slider');
    spacingSlider.addEventListener('input', (e) => {
        state.spacing = parseInt(e.target.value);
        document.getElementById('spacing-val').textContent = `${state.spacing}px`;
        triggerUpdate();
    });

    // Opacity Slider
    const opacitySlider = document.getElementById('opacity-slider');
    opacitySlider.addEventListener('input', (e) => {
        state.opacity = parseFloat(e.target.value);
        document.getElementById('opacity-val').textContent = state.opacity;
        triggerUpdate();
    });

    // Stroke Toggle
    const strokeToggle = document.getElementById('stroke-toggle');
    strokeToggle.addEventListener('change', (e) => {
        state.strokeOutline = e.target.checked;
        triggerUpdate();
    });

    // Color Scheme Selector
    const colorSchemeSelect = document.getElementById('color-scheme-select');
    colorSchemeSelect.addEventListener('change', (e) => {
        state.colorScheme = e.target.value;
        triggerUpdate();
    });

    // Origin Filter Chips
    const originInputs = document.querySelectorAll('#origin-chips input[type="checkbox"]');
    originInputs.forEach(input => {
        input.addEventListener('change', () => {
            const checked = [];
            originInputs.forEach(i => {
                i.closest('.chip').classList.toggle('active', i.checked);
                if (i.checked) checked.push(i.value);
            });
            state.origins = checked;
            triggerUpdate();
        });
    });

    // Cylinder Filter Chips
    const cylInputs = document.querySelectorAll('#cylinder-chips input[type="checkbox"]');
    cylInputs.forEach(input => {
        input.addEventListener('change', () => {
            const checked = [];
            cylInputs.forEach(i => {
                i.closest('.chip').classList.toggle('active', i.checked);
                if (i.checked) checked.push(parseInt(i.value));
            });
            state.cylinders = checked;
            triggerUpdate();
        });
    });

    // Year Sliders
    const yearMinSlider = document.getElementById('year-min-slider');
    const yearMaxSlider = document.getElementById('year-max-slider');
    yearMinSlider.addEventListener('input', (e) => {
        state.minYear = parseInt(e.target.value);
        document.getElementById('year-min-val').textContent = state.minYear;
        triggerUpdate();
    });
    yearMaxSlider.addEventListener('input', (e) => {
        state.maxYear = parseInt(e.target.value);
        document.getElementById('year-max-val').textContent = state.maxYear;
        triggerUpdate();
    });

    // Reset Filters Button
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        resetAllFilters();
    });

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const presetKey = btn.dataset.preset;
            applyPreset(presetKey);
        });
    });

    // Theme Toggle Button
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        state.theme = isLight ? 'light' : 'dark';
        localStorage.setItem('altair_theme', state.theme);
        updateThemeIcon(isLight);
        triggerUpdate();
    });

    // Tabs Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetPane = document.getElementById(btn.dataset.tab);
            if (targetPane) targetPane.classList.add('active');

            if (btn.dataset.tab === 'data-pane') {
                loadDataTable();
            } else if (btn.dataset.tab === 'car3d-pane') {
                setTimeout(() => {
                    initCar3D('car-3d-viewport');
                }, 60);
            }
        });
    });

    // Copy Code & Spec Buttons
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(currentCode);
        showFeedback(document.getElementById('copy-code-btn'), 'Copied Script!');
    });

    document.getElementById('copy-json-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(currentSpec, null, 2));
        showFeedback(document.getElementById('copy-json-btn'), 'Copied JSON!');
    });

    // Embed Modal Controls
    const modal = document.getElementById('embed-modal');
    document.getElementById('open-embed-modal-btn').addEventListener('click', () => {
        updateEmbedModal();
        modal.classList.add('open');
    });

    document.getElementById('close-embed-modal-btn').addEventListener('click', () => {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    document.getElementById('copy-embed-code-btn').addEventListener('click', () => {
        const codeText = document.getElementById('embed-iframe-code').value;
        navigator.clipboard.writeText(codeText);
        showFeedback(document.getElementById('copy-embed-code-btn'), 'Copied Iframe!');
    });

    document.getElementById('open-embed-newtab-btn').addEventListener('click', () => {
        const url = buildEmbedUrl();
        window.open(url, '_blank');
    });
}

function onMetricChanged() {
    // Update metric title
    const select = document.getElementById('metric-select');
    const label = select.options[select.selectedIndex].text;
    document.getElementById('chart-main-title').textContent = `${label} Distribution by ${state.groupby.replace('_', ' ')}`;
    
    // Auto-scale bandwidth slider sensibly for different metrics
    const bwSlider = document.getElementById('bandwidth-slider');
    if (state.metric === 'Horsepower') {
        bwSlider.max = 40; bwSlider.step = 1; bwSlider.value = 10;
    } else if (state.metric === 'Weight_in_lbs') {
        bwSlider.max = 500; bwSlider.step = 10; bwSlider.value = 250;
    } else if (state.metric === 'Displacement') {
        bwSlider.max = 50; bwSlider.step = 1; bwSlider.value = 20;
    } else {
        bwSlider.max = 20; bwSlider.step = 0.5; bwSlider.value = 3;
    }
    
    triggerUpdate();
}

function resetAllFilters() {
    state.origins = ['USA', 'Europe', 'Japan'];
    state.cylinders = [3, 4, 5, 6, 8];
    state.minYear = 1970;
    state.maxYear = 1982;
    state.autoBandwidth = true;
    state.autoExtent = true;

    // Reset UI inputs
    document.querySelectorAll('#origin-chips input').forEach(i => { i.checked = true; i.closest('.chip').classList.add('active'); });
    document.querySelectorAll('#cylinder-chips input').forEach(i => { i.checked = true; i.closest('.chip').classList.add('active'); });
    document.getElementById('year-min-slider').value = 1970;
    document.getElementById('year-max-slider').value = 1982;
    document.getElementById('year-min-val').textContent = '1970';
    document.getElementById('year-max-val').textContent = '1982';
    document.getElementById('auto-bandwidth-toggle').checked = true;
    document.getElementById('bandwidth-group').style.opacity = '0.5';
    document.getElementById('bandwidth-group').style.pointerEvents = 'none';
    document.getElementById('bandwidth-val').textContent = 'Auto';
    document.getElementById('auto-extent-toggle').checked = true;
    document.getElementById('manual-extent-container').style.display = 'none';

    triggerUpdate();
}

function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === presetKey));

    state.metric = preset.metric;
    state.groupby = preset.groupby;
    state.autoBandwidth = preset.autoBandwidth;
    state.bandwidth = preset.bandwidth;
    state.stack = preset.stack;
    state.width = preset.width;
    state.spacing = preset.spacing;
    state.colorScheme = preset.colorScheme;

    // Synchronize UI elements
    document.getElementById('metric-select').value = state.metric;
    document.getElementById('groupby-select').value = state.groupby;
    document.getElementById('width-slider').value = state.width;
    document.getElementById('width-val').textContent = `${state.width}px`;
    document.getElementById('spacing-slider').value = state.spacing;
    document.getElementById('spacing-val').textContent = `${state.spacing}px`;
    document.getElementById('color-scheme-select').value = state.colorScheme;

    onMetricChanged();
}

function triggerUpdate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchAndUpdateChart();
    }, 120);
}

function buildApiQueryParams() {
    const params = new URLSearchParams();
    params.set('metric', state.metric);
    params.set('groupby', state.groupby);
    params.set('stack', state.stack);
    params.set('width', state.width);
    params.set('spacing', state.spacing);
    params.set('opacity', state.opacity);
    params.set('color_scheme', state.colorScheme);
    params.set('theme', state.theme);
    params.set('stroke_outline', state.strokeOutline);

    if (!state.autoBandwidth && state.bandwidth) {
        params.set('bandwidth', state.bandwidth);
    }
    if (!state.autoExtent && state.extentMin != null && state.extentMax != null) {
        params.set('extent_min', state.extentMin);
        params.set('extent_max', state.extentMax);
    }
    if (state.origins && state.origins.length < 3) {
        params.set('origins', state.origins.join(','));
    }
    if (state.cylinders && state.cylinders.length < 5) {
        params.set('cylinders', state.cylinders.join(','));
    }
    if (state.minYear > 1970) {
        params.set('min_year', state.minYear);
    }
    if (state.maxYear < 1982) {
        params.set('max_year', state.maxYear);
    }

    return params;
}

function buildEmbedUrl() {
    const params = buildApiQueryParams();
    return `${window.location.origin}/embed?${params.toString()}`;
}

function updateEmbedModal() {
    const embedUrl = buildEmbedUrl();
    const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="480" frameborder="0" allowfullscreen style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: ${state.theme === 'dark' ? '#0b0f19' : '#ffffff'};"></iframe>`;
    document.getElementById('embed-iframe-code').value = iframeSnippet;
}

async function fetchAndUpdateChart() {
    const loader = document.getElementById('chart-loader');
    loader.classList.add('active');

    try {
        const params = buildApiQueryParams();
        const res = await fetch(`/api/chart?${params.toString()}`);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Chart generation failed');
        }

        const data = await res.json();
        currentSpec = data.spec;
        currentCode = data.code;

        // Render chart with Vega-Embed
        await vegaEmbed('#vis-container', data.spec, {
            renderer: 'svg',
            theme: state.theme === 'dark' ? 'dark' : 'vox',
            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        });

        // Update KPI highlights
        updateKPIs(data.stats, data.record_count);

        // Update Code & Spec Previews
        document.getElementById('python-code-display').textContent = data.code;
        document.getElementById('json-spec-display').textContent = JSON.stringify(data.spec, null, 2);

        // Update group breakdown bar
        renderGroupBreakdown(data.stats);

        // Update active chart title
        const metricName = document.getElementById('metric-select').selectedOptions[0].text;
        const groupName = document.getElementById('groupby-select').selectedOptions[0].text;
        document.getElementById('chart-main-title').textContent = `${metricName} by ${groupName}`;

    } catch (err) {
        console.error('Render error:', err);
        document.getElementById('vis-container').innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--accent-rose);">
                <i class="ph-bold ph-warning-circle" style="font-size: 36px; margin-bottom: 8px;"></i>
                <p style="font-weight: 600;">Chart Update Error</p>
                <p style="font-size: 12px; opacity: 0.8;">${err.message}</p>
            </div>
        `;
    } finally {
        loader.classList.remove('active');
    }
}

function updateKPIs(stats, totalCount) {
    document.getElementById('kpi-count').textContent = totalCount || '0';

    if (!stats || stats.length === 0) {
        document.getElementById('kpi-mean').textContent = '--';
        document.getElementById('kpi-median').textContent = '--';
        document.getElementById('kpi-std').textContent = '--';
        return;
    }

    // Calculate aggregate weighted averages across groups
    let sumVal = 0;
    let totalN = 0;
    stats.forEach(s => {
        sumVal += s.mean * s.count;
        totalN += s.count;
    });
    const avgMean = totalN > 0 ? (sumVal / totalN).toFixed(2) : '--';
    
    // Pick middle median or overall average median
    const avgMed = (stats.reduce((acc, s) => acc + s.median, 0) / stats.length).toFixed(2);
    const avgStd = (stats.reduce((acc, s) => acc + s.std, 0) / stats.length).toFixed(2);

    document.getElementById('kpi-mean').textContent = avgMean;
    document.getElementById('kpi-median').textContent = avgMed;
    document.getElementById('kpi-std').textContent = avgStd;
}

function renderGroupBreakdown(stats) {
    const bar = document.getElementById('group-breakdown-bar');
    bar.innerHTML = '';

    if (!stats || stats.length === 0) return;

    stats.forEach((s, idx) => {
        const pill = document.createElement('div');
        pill.className = 'group-stat-pill';
        pill.innerHTML = `
            <span class="indicator" style="background: var(--accent-cyan);"></span>
            <strong>${s.group}</strong>: 
            <span>Mean: <b>${s.mean}</b></span>
            <span>Med: <b>${s.median}</b></span>
            <span style="opacity: 0.7;">(N=${s.count})</span>
        `;
        bar.appendChild(pill);
    });
}

async function loadDataTable() {
    const head = document.getElementById('table-head');
    const body = document.getElementById('table-body');
    head.innerHTML = '<tr><th>Loading table data...</th></tr>';
    body.innerHTML = '';

    try {
        const params = buildApiQueryParams();
        params.set('limit', '50');
        const res = await fetch(`/api/data?${params.toString()}`);
        if (!res.ok) throw new Error('Data fetch failed');
        const data = await res.json();

        // Build header
        let headHtml = '<tr>';
        data.columns.forEach(col => {
            headHtml += `<th>${col.replace('_', ' ')}</th>`;
        });
        headHtml += '</tr>';
        head.innerHTML = headHtml;

        // Build body
        let bodyHtml = '';
        data.records.forEach(row => {
            bodyHtml += '<tr>';
            data.columns.forEach(col => {
                const val = row[col];
                bodyHtml += `<td>${val != null ? val : '-'}</td>`;
            });
            bodyHtml += '</tr>';
        });
        body.innerHTML = bodyHtml;

        document.getElementById('tab-data-btn').innerHTML = `<i class="ph-bold ph-table"></i> Records (${data.total})`;

    } catch (err) {
        head.innerHTML = '<tr><th style="color: var(--accent-rose);">Failed to load data rows</th></tr>';
    }
}

function showFeedback(btn, message) {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph-bold ph-check"></i> ${message}`;
    btn.style.borderColor = 'var(--accent-emerald)';
    btn.style.color = 'var(--accent-emerald)';
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.borderColor = '';
        btn.style.color = '';
    }, 1800);
}

/* ============================================================
   PostgreSQL Status & 3D Car Studio Integration
   ============================================================ */

let postgresCarsList = [];

async function checkPostgresStatus() {
    const badge = document.getElementById('db-status-badge');
    if (!badge) return;

    try {
        const res = await fetch('/api/db/status');
        if (!res.ok) throw new Error('DB status check failed');
        const data = await res.json();

        if (data.status === 'connected') {
            badge.innerHTML = `<i class="ph-bold ph-database"></i> PostgreSQL: ${data.database} (${data.cars_count} rows)`;
            badge.style.color = 'var(--accent-emerald)';
            badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            badge.title = `Connected to PostgreSQL database '${data.database}'. Available tables: ${data.tables ? data.tables.join(', ') : 'none'}`;
        } else {
            badge.innerHTML = `<i class="ph-bold ph-warning"></i> PostgreSQL Offline`;
            badge.style.color = 'var(--accent-rose)';
            badge.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        }
    } catch (err) {
        badge.innerHTML = `<i class="ph-bold ph-database"></i> PostgreSQL (auth_db)`;
    }
}

async function loadCarsListFor3D() {
    const dropdown = document.getElementById('car-select-dropdown');
    if (!dropdown) return;

    try {
        const res = await fetch('/api/cars/list');
        if (!res.ok) throw new Error('Cars list fetch failed');
        const data = await res.json();
        postgresCarsList = data.cars || [];

        dropdown.innerHTML = '';
        postgresCarsList.forEach((car, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${car.Name} (${car.Horsepower || '?'} HP - ${car.Origin})`;
            dropdown.appendChild(opt);
        });

        if (postgresCarsList.length > 0) {
            updateTelemetryHUD(postgresCarsList[0]);
        }

        dropdown.addEventListener('change', (e) => {
            const selectedIdx = parseInt(e.target.value);
            const car = postgresCarsList[selectedIdx];
            if (car) {
                updateTelemetryHUD(car);
                
                // Adjust auto-drive speed based on real car horsepower!
                if (window.car3DApp && car.Horsepower) {
                    const normalizedHp = Math.max(0.5, Math.min(2.5, car.Horsepower / 100));
                    window.car3DApp.state.rotateSpeed = normalizedHp;
                    window.car3DApp.state.wheelSpinSpeed = 0.03 * normalizedHp;
                }
            }
        });
    } catch (err) {
        console.warn('Failed to load cars from PostgreSQL for 3D viewer:', err);
    }
}

function updateTelemetryHUD(car) {
    if (!car) return;
    document.getElementById('hud-car-name').textContent = car.Name;
    document.getElementById('hud-car-origin').textContent = car.Origin;
    document.getElementById('hud-hp').textContent = car.Horsepower ? `${car.Horsepower}` : '--';
    document.getElementById('hud-mpg').textContent = car.Miles_per_Gallon ? `${car.Miles_per_Gallon}` : '--';
    document.getElementById('hud-accel').textContent = car.Acceleration ? `${car.Acceleration}s` : '--';
    document.getElementById('hud-weight').textContent = car.Weight_in_lbs ? `${car.Weight_in_lbs}` : '--';
}

function init3DStudioControls() {
    // Paint Color Swatches
    const swatches = document.querySelectorAll('#paint-swatches .color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            const colorHex = parseInt(swatch.dataset.color, 16);
            if (window.car3DApp) {
                window.car3DApp.setPaintColor(colorHex);
            }
        });
    });

    // Finish Shader Dropdown
    const finishSelect = document.getElementById('finish-select');
    if (finishSelect) {
        finishSelect.addEventListener('change', (e) => {
            if (window.car3DApp) {
                window.car3DApp.setFinish(e.target.value);
            }
        });
    }

    // Camera Angle Preset Buttons
    const camButtons = document.querySelectorAll('.camera-angles-bar .cam-btn');
    camButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            camButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const angle = btn.dataset.angle;
            if (window.car3DApp) {
                window.car3DApp.setCameraPreset(angle);
            }
        });
    });

    // Auto-Rotate Toggle
    const autoRotateToggle = document.getElementById('auto-rotate-3d-toggle');
    if (autoRotateToggle) {
        autoRotateToggle.addEventListener('change', (e) => {
            if (window.car3DApp) {
                window.car3DApp.toggleAutoRotate(e.target.checked);
            }
        });
    }

    // Underglow Toggle
    const underglowToggle = document.getElementById('underglow-3d-toggle');
    if (underglowToggle) {
        underglowToggle.addEventListener('change', (e) => {
            if (window.car3DApp) {
                window.car3DApp.toggleUnderglow(e.target.checked);
            }
        });
    }

    // Hotspot Selection Event Listener
    window.addEventListener('carHotspotSelected', (e) => {
        const hotspotId = e.detail.hotspotId;
        const hintBox = document.querySelector('.hud-hotspot-hint');
        if (!hintBox) return;

        if (hotspotId === 'engine') {
            hintBox.innerHTML = `<span style="color: var(--accent-cyan); font-weight:700;"><i class="ph-bold ph-lightning"></i> Engine Bay Inspected:</span> High-output combustion block`;
        } else if (hotspotId === 'wheels') {
            hintBox.innerHTML = `<span style="color: var(--accent-emerald); font-weight:700;"><i class="ph-bold ph-circle"></i> Wheels & Rims Inspected:</span> Alloy multi-spoke rims & disc brakes`;
        } else if (hotspotId === 'cabin') {
            hintBox.innerHTML = `<span style="color: var(--accent-purple); font-weight:700;"><i class="ph-bold ph-user"></i> Cockpit Inspected:</span> Aerodynamic fastback glass canopy`;
        } else if (hotspotId === 'exhaust') {
            hintBox.innerHTML = `<span style="color: var(--accent-amber); font-weight:700;"><i class="ph-bold ph-wind"></i> Exhaust Inspected:</span> Dual performance chrome tips`;
        }
    });
}

