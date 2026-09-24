/**
 * Isotype Visualization (Flat & Apartment Distribution)
 * Replicates the Vega-Altair Isotype chart layout substituting animal pictograms
 * with 1 BHK, 2 BHK, and 3 BHK residential flat icons.
 * Features interactive filter buttons, direct add buttons, and inline row adders.
 */

class IsotypeFlatChart {
  constructor(container, data, flatTypes, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.originalData = JSON.parse(JSON.stringify(data));
    this.data = JSON.parse(JSON.stringify(data));
    this.flatTypes = flatTypes;

    this.config = Object.assign({
      iconWidth: 42,
      iconHeight: 26,
      activeFilter: 'all', // 'all', '1bhk', '2bhk', '3bhk'
    }, options);

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'isotype-chart-wrapper';

    // Render Vega action menu button (...) in the top right
    const actionMenu = this.createActionMenu();
    chartWrapper.appendChild(actionMenu);

    // Render each project/location box (e.g. Tower A, Tower B)
    this.data.forEach((project) => {
      const groupCard = document.createElement('div');
      groupCard.className = 'isotype-group-card';
      groupCard.dataset.projectId = project.id;

      // Left rotated/vertical label
      const leftLabel = document.createElement('div');
      leftLabel.className = 'isotype-group-label';
      leftLabel.innerHTML = `<span>${project.name}</span>`;
      groupCard.appendChild(leftLabel);

      // Main pictogram content area
      const contentArea = document.createElement('div');
      contentArea.className = 'isotype-group-content';

      // Rows for 1 BHK, 2 BHK, 3 BHK
      project.units.forEach(unitRow => {
        if (this.config.activeFilter !== 'all' && this.config.activeFilter !== unitRow.type) {
          return;
        }

        const typeInfo = this.flatTypes[unitRow.type];
        if (!typeInfo) return;

        const rowEl = document.createElement('div');
        rowEl.className = `isotype-row row-${unitRow.type}`;
        rowEl.dataset.type = unitRow.type;

        // Render repeated flat icons
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'isotype-icons-list';

        for (let i = 0; i < unitRow.count; i++) {
          const iconEl = this.createFlatIcon(unitRow.type, typeInfo, project, i + 1);
          iconsContainer.appendChild(iconEl);
        }

        rowEl.appendChild(iconsContainer);
        contentArea.appendChild(rowEl);
      });

      groupCard.appendChild(contentArea);
      chartWrapper.appendChild(groupCard);
    });

    this.container.appendChild(chartWrapper);
    this.setupTooltips();
  }

  createFlatIcon(type, typeInfo, project, unitIndex) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'isotype-icon-item';
    iconWrapper.dataset.project = project.name;
    iconWrapper.dataset.type = typeInfo.label;
    iconWrapper.dataset.unitNumber = `Unit ${unitIndex * 102 + (type === '1bhk' ? 1 : type === '2bhk' ? 2 : 3)}`;
    iconWrapper.dataset.area = typeInfo.areaSqFt;
    iconWrapper.dataset.price = typeInfo.avgPrice;
    iconWrapper.dataset.features = typeInfo.features;

    // Detailed SVG for modern residential flat / apartment layout
    let pathContent = '';
    if (type === '1bhk') {
      pathContent = `
        <svg viewBox="0 0 54 32" class="flat-svg" style="fill: ${typeInfo.color};">
          <rect x="2" y="2" width="50" height="28" rx="2" fill="${typeInfo.color}" />
          <rect x="5" y="5" width="18" height="13" rx="1" fill="#ffffff" />
          <rect x="7" y="7" width="7" height="9" rx="1" fill="${typeInfo.color}" opacity="0.8" />
          <rect x="5" y="20" width="10" height="8" rx="1" fill="#ffffff" />
          <rect x="25" y="5" width="24" height="15" rx="1" fill="#ffffff" />
          <rect x="25" y="22" width="14" height="6" rx="1" fill="#ffffff" />
          <rect x="41" y="22" width="6" height="6" fill="#ffffff" />
        </svg>
      `;
    } else if (type === '2bhk') {
      pathContent = `
        <svg viewBox="0 0 54 32" class="flat-svg" style="fill: ${typeInfo.color};">
          <rect x="2" y="2" width="50" height="28" rx="2" fill="${typeInfo.color}" />
          <rect x="5" y="5" width="14" height="12" rx="1" fill="#ffffff" />
          <rect x="7" y="7" width="6" height="8" rx="1" fill="${typeInfo.color}" opacity="0.8" />
          <rect x="21" y="5" width="14" height="12" rx="1" fill="#ffffff" />
          <rect x="23" y="7" width="6" height="8" rx="1" fill="${typeInfo.color}" opacity="0.8" />
          <rect x="37" y="5" width="12" height="12" rx="1" fill="#ffffff" />
          <rect x="5" y="19" width="22" height="9" rx="1" fill="#ffffff" />
          <rect x="29" y="19" width="12" height="9" rx="1" fill="#ffffff" />
          <rect x="43" y="19" width="6" height="9" fill="#ffffff" />
        </svg>
      `;
    } else {
      pathContent = `
        <svg viewBox="0 0 54 32" class="flat-svg" style="fill: ${typeInfo.color};">
          <rect x="2" y="2" width="50" height="28" rx="2" fill="${typeInfo.color}" />
          <rect x="5" y="5" width="11" height="11" rx="1" fill="#ffffff" />
          <rect x="6" y="6" width="5" height="7" rx="1" fill="${typeInfo.color}" opacity="0.8" />
          <rect x="18" y="5" width="11" height="11" rx="1" fill="#ffffff" />
          <rect x="19" y="6" width="5" height="7" rx="1" fill="${typeInfo.color}" opacity="0.8" />
          <rect x="31" y="5" width="11" height="11" rx="1" fill="#ffffff" />
          <rect x="44" y="5" width="5" height="11" fill="#ffffff" />
          <rect x="5" y="18" width="24" height="10" rx="1" fill="#ffffff" />
          <rect x="31" y="18" width="11" height="10" rx="1" fill="#ffffff" />
          <rect x="44" y="18" width="5" height="10" fill="#ffffff" />
        </svg>
      `;
    }

    iconWrapper.innerHTML = pathContent;
    return iconWrapper;
  }

  createActionMenu() {
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'vega-action-wrapper';

    actionWrapper.innerHTML = `
      <button type="button" class="vega-action-btn" title="View options" aria-label="Action Menu">
        <span>•••</span>
      </button>
      <div class="vega-action-dropdown">
        <a href="#png" class="dropdown-item" id="actionSavePng">Save as PNG</a>
        <a href="#svg" class="dropdown-item" id="actionSaveSvg">Save as SVG</a>
        <a href="#reset" class="dropdown-item" id="actionResetData">Reset Counts</a>
      </div>
    `;

    const btn = actionWrapper.querySelector('.vega-action-btn');
    const dropdown = actionWrapper.querySelector('.vega-action-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });

    actionWrapper.querySelector('#actionSavePng').addEventListener('click', (e) => {
      e.preventDefault();
      this.exportImage('png');
    });

    actionWrapper.querySelector('#actionSaveSvg').addEventListener('click', (e) => {
      e.preventDefault();
      this.exportImage('svg');
    });

    actionWrapper.querySelector('#actionResetData').addEventListener('click', (e) => {
      e.preventDefault();
      this.resetCounts();
    });

    return actionWrapper;
  }

  setupTooltips() {
    let tooltipEl = document.querySelector('.isotype-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'isotype-tooltip';
      document.body.appendChild(tooltipEl);
    }

    document.querySelectorAll('.isotype-icon-item').forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const { project, type, unitNumber, area, price, features } = item.dataset;
        tooltipEl.innerHTML = `
          <div class="tip-badge">${project}</div>
          <div class="tip-unit-title">${unitNumber} (${type})</div>
          <div class="tip-details">
            <div><b>Area:</b> ${area}</div>
            <div><b>Price:</b> ${price}</div>
            <div class="tip-features">${features}</div>
          </div>
        `;
        tooltipEl.style.display = 'block';
        tooltipEl.style.opacity = '1';
        this.positionTooltip(e, tooltipEl);
      });

      item.addEventListener('mousemove', (e) => {
        this.positionTooltip(e, tooltipEl);
      });

      item.addEventListener('mouseleave', () => {
        tooltipEl.style.opacity = '0';
        tooltipEl.style.display = 'none';
      });
    });
  }

  positionTooltip(e, tooltipEl) {
    const x = e.clientX;
    const y = e.clientY;
    tooltipEl.style.left = `${x + 15}px`;
    tooltipEl.style.top = `${y - 15}px`;
  }

  // Filter Flats (e.g. 'all', '1bhk', '2bhk', '3bhk')
  setFilter(filterType) {
    this.config.activeFilter = filterType;
    this.render();
  }

  // Add a unit of specific flat type (default Tower A)
  addUnit(type, projectId = 'tower_a') {
    this.updateCount(projectId, type, 1);
  }

  // Add / Remove units dynamically
  updateCount(projectId, unitType, delta) {
    const project = this.data.find(p => p.id === projectId);
    if (!project) return;

    const unit = project.units.find(u => u.type === unitType);
    if (!unit) return;

    unit.count = Math.max(0, Math.min(30, unit.count + delta));
    this.render();
  }

  // Reset to original data
  resetCounts() {
    this.data = JSON.parse(JSON.stringify(this.originalData));
    this.render();
  }

  // Export helper
  exportImage(format) {
    alert(`Exporting ${format.toUpperCase()} image of Isotype Visualization...`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = IsotypeFlatChart;
} else if (typeof window !== 'undefined') {
  window.IsotypeFlatChart = IsotypeFlatChart;
}
