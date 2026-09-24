/**
 * Stacked Area Migration Chart (PlotSet Style)
 * Replicates the "Migration to the US by World Region, 1820-2009" visualization
 * using D3.js with smooth monotone curves, interactive scrubbing, and layer highlighting.
 */

class StackedMigrationChart {
  constructor(container, data, categories, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.data = data;
    this.categories = categories;

    this.config = Object.assign({
      aspectRatio: 0.50,
      margin: { top: 24, right: 28, bottom: 42, left: 45 },
      selectedCategory: null
    }, options);

    // Fast Color & Label lookups
    this.colorMap = new Map();
    this.labelMap = new Map();
    this.categories.forEach(c => {
      this.colorMap.set(c.id, c.color);
      this.labelMap.set(c.id, c.label);
    });

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    const rect = this.container.getBoundingClientRect();
    const width = Math.max(680, rect.width || 1040);
    const height = Math.round(width * this.config.aspectRatio);

    this.width = width;
    this.height = height;

    const { margin } = this.config;
    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'migration-chart-svg');

    // Main Group
    this.g = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Grid lines group (behind areas)
    this.gridGroup = this.g.append('g').attr('class', 'grid-layer');

    // Stacked areas group
    this.areasGroup = this.g.append('g').attr('class', 'areas-layer');

    // Top envelope outline (black boundary line)
    this.topLinePath = this.g.append('path').attr('class', 'top-envelope-line');

    // Axes groups
    this.xAxisGroup = this.g.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0, ${this.innerHeight})`);

    this.yAxisGroup = this.g.append('g')
      .attr('class', 'axis y-axis');

    // Interactive Hover Scrubber Elements
    this.hoverGroup = this.g.append('g').attr('class', 'hover-layer').style('display', 'none');
    
    this.hoverLine = this.hoverGroup.append('line')
      .attr('class', 'scrubber-line')
      .attr('y1', 0)
      .attr('y2', this.innerHeight)
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3 3');

    this.hoverTopDot = this.hoverGroup.append('circle')
      .attr('r', 4.5)
      .attr('fill', '#0f172a')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Tooltip overlay element
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'migration-tooltip')
      .style('opacity', 0);

    // Invisible pointer capture overlay
    this.overlay = this.g.append('rect')
      .attr('class', 'pointer-overlay')
      .attr('width', this.innerWidth)
      .attr('height', this.innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    this.setupInteractions();
    this.render();

    // Auto-resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newRect = this.container.getBoundingClientRect();
        if (Math.abs(newRect.width - this.width) > 15) {
          this.init();
        }
      }, 100);
    });
  }

  render() {
    const { data, categories, innerWidth, innerHeight } = this;

    // 1. Stack Generator
    const categoryKeys = categories.map(c => c.id);
    const stack = d3.stack()
      .keys(categoryKeys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(data);

    // 2. Scales
    const xExtent = d3.extent(data, d => d.year);
    this.xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);

    // Fixed 0 to 12m Y-axis matching PlotSet visualization
    this.yScale = d3.scaleLinear()
      .domain([0, 12])
      .range([innerHeight, 0]);

    // 3. Horizontal Gridlines (2, 4, 6, 8, 10, 12)
    const yTicks = [0, 2, 4, 6, 8, 10, 12];
    this.gridGroup.selectAll('.grid-line')
      .data(yTicks.filter(t => t > 0))
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => this.yScale(d))
      .attr('y2', d => this.yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    // 4. Area Generator with Smooth Monotone Curves
    this.areaGenerator = d3.area()
      .x(d => this.xScale(d.data.year))
      .y0(d => this.yScale(d[0]))
      .y1(d => this.yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // 5. Draw Colored Stacked Area Layers
    this.layerPaths = this.areasGroup.selectAll('.area-layer')
      .data(series, d => d.key)
      .join('path')
      .attr('class', d => `area-layer layer-${d.key}`)
      .attr('d', this.areaGenerator)
      .attr('fill', d => this.colorMap.get(d.key))
      .attr('opacity', d => {
        if (!this.config.selectedCategory) return 0.98;
        return this.config.selectedCategory === d.key ? 1.0 : 0.12;
      })
      .attr('stroke', d => this.colorMap.get(d.key))
      .attr('stroke-width', 0.4);

    // 6. Draw Top Envelope Outline (Dark tracing line from PlotSet)
    const topValues = data.map(d => {
      let total = 0;
      categoryKeys.forEach(k => { total += d[k] || 0; });
      return { year: d.year, total: total };
    });

    this.topEnvelopeData = topValues;

    const topLine = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.total))
      .curve(d3.curveMonotoneX);

    this.topLinePath
      .datum(topValues)
      .attr('d', topLine)
      .attr('fill', 'none')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.8)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');

    // 7. X Axis with 5-year tick marks
    const allYears = data.map(d => d.year);
    const xAxis = d3.axisBottom(this.xScale)
      .tickValues(allYears)
      .tickFormat(d => d)
      .tickSize(5);

    this.xAxisGroup.call(xAxis);

    // Style X Axis Ticks & Baseline
    this.xAxisGroup.select('.domain')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.2);

    this.xAxisGroup.selectAll('.tick line')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1);

    this.xAxisGroup.selectAll('.tick text')
      .attr('fill', '#334155')
      .style('font-family', 'inherit')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .attr('dy', '10px');

    // 8. Y Axis (Formatted as 0, 2m, 4m, 6m, 8m, 10m, 12m)
    const yAxis = d3.axisLeft(this.yScale)
      .tickValues(yTicks)
      .tickFormat(d => (d === 0 ? '0' : `${d}m`))
      .tickSize(0);

    this.yAxisGroup.call(yAxis);
    this.yAxisGroup.select('.domain').remove();
    this.yAxisGroup.selectAll('.tick text')
      .attr('fill', '#334155')
      .style('font-family', 'inherit')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .attr('x', -8);
  }

  setupInteractions() {
    const bisectYear = d3.bisector(d => d.year).left;

    this.overlay
      .on('mouseenter', () => {
        this.hoverGroup.style('display', null);
        this.tooltip.style('display', 'block');
        this.tooltip.transition().duration(120).style('opacity', 1);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const yearVal = this.xScale.invert(mx);
        
        // Find nearest data point
        const idx = bisectYear(this.data, yearVal);
        const d0 = this.data[idx - 1];
        const d1 = this.data[idx];
        const point = (!d0 || (d1 && (yearVal - d0.year > d1.year - yearVal))) ? d1 : d0;

        if (!point) return;

        const px = this.xScale(point.year);

        // Find total envelope height at this year
        const topPoint = this.topEnvelopeData.find(t => t.year === point.year);
        const topY = topPoint ? this.yScale(topPoint.total) : this.innerHeight;

        // Position vertical scrubber line & top dot
        this.hoverLine.attr('x1', px).attr('x2', px);
        this.hoverTopDot.attr('cx', px).attr('cy', topY);

        // Calculate breakdown for this year
        let total = 0;
        const activeCategories = [];

        this.categories.forEach(cat => {
          const val = point[cat.id] || 0;
          if (val > 0) {
            total += val;
            activeCategories.push({
              id: cat.id,
              label: cat.label,
              val: val,
              color: cat.color
            });
          }
        });

        activeCategories.sort((a, b) => b.val - a.val);

        // Tooltip Content
        const decadeStart = point.year - 5;
        const decadeEnd = point.year + 5;
        const totalFormatted = (total >= 1) ? `${total.toFixed(2)} Million` : `${Math.round(total * 1000).toLocaleString()} Thousand`;

        let listHtml = '';
        activeCategories.slice(0, 7).forEach(item => {
          const itemVal = item.val >= 1 ? `${item.val.toFixed(2)}M` : `${Math.round(item.val * 1000)}k`;
          listHtml += `
            <div class="tooltip-country-row">
              <span class="tooltip-color-dot" style="background: ${item.color};"></span>
              <span class="tooltip-country-name">${item.label}</span>
              <span class="tooltip-country-val">${itemVal}</span>
            </div>
          `;
        });

        if (activeCategories.length > 7) {
          const otherCount = activeCategories.length - 7;
          listHtml += `<div class="tooltip-more-note">+ ${otherCount} more regions</div>`;
        }

        this.tooltip.html(`
          <div class="migration-tooltip-box">
            <div class="tooltip-year-badge">${point.year} <span class="tooltip-range">(${decadeStart}–${decadeEnd})</span></div>
            <div class="tooltip-total-row">Total: <b>${totalFormatted}</b></div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-countries-list">${listHtml}</div>
          </div>
        `);

        // Position Tooltip
        const bounds = this.container.getBoundingClientRect();
        const tooltipX = px + this.config.margin.left;
        const isRightHalf = px > this.innerWidth * 0.62;

        this.tooltip
          .style('left', `${tooltipX}px`)
          .style('top', `${Math.min(topY + this.config.margin.top, this.innerHeight * 0.5)}px`)
          .style('transform', isRightHalf ? 'translate(-105%, -45%)' : 'translate(14px, -45%)');
      })
      .on('mouseleave', () => {
        this.hoverGroup.style('display', 'none');
        this.tooltip.transition().duration(150).style('opacity', 0).on('end', () => {
          this.tooltip.style('display', 'none');
        });
      });
  }

  // Highlight specific region/country layer
  highlightCategory(categoryId) {
    this.config.selectedCategory = categoryId;
    if (this.layerPaths) {
      this.layerPaths
        .transition().duration(200)
        .attr('opacity', d => {
          if (!categoryId) return 0.98;
          return d.key === categoryId ? 1.0 : 0.12;
        });
    }
  }

  resetHighlight() {
    this.config.selectedCategory = null;
    if (this.layerPaths) {
      this.layerPaths
        .transition().duration(200)
        .attr('opacity', 0.98);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StackedMigrationChart;
} else if (typeof window !== 'undefined') {
  window.StackedMigrationChart = StackedMigrationChart;
}
