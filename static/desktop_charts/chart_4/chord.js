/**
 * Flourish Chord Diagram (v11.0.1)
 * Reusable D3.js Chord Diagram matching Flourish Studio exact design,
 * two-color gradient ribbons, interactive hover focus/defocus, and tooltips.
 */

class FlourishChordDiagram {
  constructor(container, data, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.data = data;

    this.config = Object.assign({
      width: 760,
      height: 720,
      innerRadius: 245,
      outerRadius: 260,
      padAngle: 0.035,
      defaultOpacity: 0.75,
      focusedOpacity: 1.0,
      defocusedOpacity: 0.10,
      showValuesOnHover: false,
      keepValuesOnClick: false,
      showTooltip: false,
      defaultFocusPair: null,
      animated: true
    }, options);

    this.pinnedSelection = null;
    this.init();
  }

  init() {
    this.container.innerHTML = '';

    // Auto-detect container size
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 200) {
      const size = Math.min(rect.width, 760);
      this.config.width = size;
      this.config.height = size;
      this.config.outerRadius = (size / 2) * 0.74;
      this.config.innerRadius = this.config.outerRadius - 15;
    }

    const { width, height } = this.config;

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'flourish-chord-svg');

    // Defs for Linear Gradients
    this.defs = this.svg.append('defs');

    // Main centered container group
    this.g = this.svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Ribbon layer (behind)
    this.ribbonsGroup = this.g.append('g').attr('class', 'ribbons-layer');

    // Arc group (on top)
    this.arcsGroup = this.g.append('g').attr('class', 'arcs-layer');

    // Labels group
    this.labelsGroup = this.g.append('g').attr('class', 'labels-layer');

    // Tooltip
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'flourish-chord-tooltip')
      .style('opacity', 0);

    // Background click to clear pinned selection
    this.svg.on('click', (event) => {
      if (event.target.tagName === 'svg') {
        this.pinnedSelection = null;
        this.resetFocus();
      }
    });

    this.render();

    // Trigger initial focus matching Flourish screenshot (Joey - Chandler)
    if (this.config.defaultFocusPair) {
      setTimeout(() => {
        this.focusPair(this.config.defaultFocusPair[0], this.config.defaultFocusPair[1]);
      }, 300);
    }
  }

  render() {
    const { names, colors, matrix } = this.data;
    const { innerRadius, outerRadius, padAngle } = this.config;

    // Compute Chord Layout
    const chordLayout = d3.chord()
      .padAngle(padAngle)
      .sortSubgroups(d3.descending);

    const chords = chordLayout(matrix);

    // Color Scale
    const colorScale = d3.scaleOrdinal()
      .domain(d3.range(names.length))
      .range(colors);

    // Arc Generator for Outer Rings
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    // Ribbon Generator for Flows
    const ribbon = d3.ribbon()
      .radius(innerRadius);

    // 1. Create Gradient Definitions for every chord
    this.defs.selectAll('*').remove();

    chords.forEach((d) => {
      const gradId = `chord-grad-${d.source.index}-${d.target.index}`;
      const sourceColor = colorScale(d.source.index);
      const targetColor = colorScale(d.target.index);

      // Angle midpoints to orient the linear gradient along the flow direction
      const sourceMidAngle = (d.source.startAngle + d.source.endAngle) / 2;
      const targetMidAngle = (d.target.startAngle + d.target.endAngle) / 2;

      const x1 = Math.sin(sourceMidAngle);
      const y1 = -Math.cos(sourceMidAngle);
      const x2 = Math.sin(targetMidAngle);
      const y2 = -Math.cos(targetMidAngle);

      const grad = this.defs.append('linearGradient')
        .attr('id', gradId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', x1 * innerRadius)
        .attr('y1', y1 * innerRadius)
        .attr('x2', x2 * innerRadius)
        .attr('y2', y2 * innerRadius);

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', sourceColor);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', targetColor);
    });

    // 2. Draw Outer Rings (Arcs)
    const arcGroups = this.arcsGroup.selectAll('.arc-group')
      .data(chords.groups)
      .join('g')
      .attr('class', 'arc-group');

    arcGroups.selectAll('path')
      .data(d => [d])
      .join('path')
      .attr('class', 'chord-arc')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.index))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => this.onArcHover(event, d))
      .on('mousemove', (event, d) => this.moveTooltip(event))
      .on('mouseleave', () => this.onMouseLeave())
      .on('click', (event, d) => this.onArcClick(event, d));

    // 3. Draw Outer Character Labels
    this.labelsGroup.selectAll('.chord-label')
      .data(chords.groups)
      .join('text')
      .attr('class', 'chord-label')
      .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('transform', d => {
        const radius = outerRadius + 16;
        const angleDeg = (d.angle * 180 / Math.PI) - 90;
        return `rotate(${angleDeg}) translate(${radius}) ${d.angle > Math.PI ? 'rotate(180)' : ''}`;
      })
      .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
      .attr('dominant-baseline', 'central')
      .text(d => names[d.index])
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => this.onArcHover(event, d))
      .on('mouseleave', () => this.onMouseLeave())
      .on('click', (event, d) => this.onArcClick(event, d));

    // 4. Draw Chord Ribbons (Flows)
    this.ribbonPaths = this.ribbonsGroup.selectAll('.chord-ribbon')
      .data(chords)
      .join('path')
      .attr('class', 'chord-ribbon')
      .attr('d', ribbon)
      .attr('fill', d => `url(#chord-grad-${d.source.index}-${d.target.index})`)
      .attr('opacity', this.config.defaultOpacity)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => this.onRibbonHover(event, d))
      .on('mousemove', (event, d) => this.moveTooltip(event))
      .on('mouseleave', () => this.onMouseLeave())
      .on('click', (event, d) => this.onRibbonClick(event, d));
  }

  onRibbonHover(event, d) {
    if (this.pinnedSelection) return;
    this.focusRibbon(d);
    if (this.config.showTooltip && this.config.showValuesOnHover) {
      this.showRibbonTooltip(event, d);
    }
  }

  onArcHover(event, d) {
    if (this.pinnedSelection) return;
    this.focusArc(d.index);
    if (this.config.showTooltip && this.config.showValuesOnHover) {
      this.showArcTooltip(event, d);
    }
  }

  onMouseLeave() {
    if (this.pinnedSelection) return;
    this.resetFocus();
    this.hideTooltip();
  }

  onRibbonClick(event, d) {
    event.stopPropagation();
    if (!this.config.keepValuesOnClick) return;

    if (this.pinnedSelection && this.pinnedSelection.type === 'ribbon' && this.pinnedSelection.data === d) {
      this.pinnedSelection = null;
      this.resetFocus();
      this.hideTooltip();
    } else {
      this.pinnedSelection = { type: 'ribbon', data: d };
      this.focusRibbon(d);
      if (this.config.showTooltip) {
        this.showRibbonTooltip(event, d);
      }
    }
  }

  onArcClick(event, d) {
    event.stopPropagation();
    if (!this.config.keepValuesOnClick) return;

    if (this.pinnedSelection && this.pinnedSelection.type === 'arc' && this.pinnedSelection.index === d.index) {
      this.pinnedSelection = null;
      this.resetFocus();
      this.hideTooltip();
    } else {
      this.pinnedSelection = { type: 'arc', index: d.index };
      this.focusArc(d.index);
      if (this.config.showTooltip) {
        this.showArcTooltip(event, d);
      }
    }
  }

  focusRibbon(targetChord) {
    this.ribbonPaths
      .transition().duration(250)
      .attr('opacity', d => {
        const isTarget = (d.source.index === targetChord.source.index && d.target.index === targetChord.target.index) ||
                         (d.source.index === targetChord.target.index && d.target.index === targetChord.source.index);
        return isTarget ? this.config.focusedOpacity : this.config.defocusedOpacity;
      });

    this.arcsGroup.selectAll('.chord-arc')
      .transition().duration(250)
      .attr('opacity', d => {
        const isConnected = d.index === targetChord.source.index || d.index === targetChord.target.index;
        return isConnected ? 1.0 : 0.4;
      });
  }

  focusArc(arcIndex) {
    this.ribbonPaths
      .transition().duration(250)
      .attr('opacity', d => {
        const isConnected = d.source.index === arcIndex || d.target.index === arcIndex;
        return isConnected ? this.config.focusedOpacity : this.config.defocusedOpacity;
      });

    this.arcsGroup.selectAll('.chord-arc')
      .transition().duration(250)
      .attr('opacity', d => d.index === arcIndex ? 1.0 : 0.4);
  }

  focusPair(name1, name2) {
    const idx1 = this.data.names.indexOf(name1);
    const idx2 = this.data.names.indexOf(name2);
    if (idx1 === -1 || idx2 === -1) return;

    this.ribbonPaths
      .transition().duration(400)
      .attr('opacity', d => {
        const isMatch = (d.source.index === idx1 && d.target.index === idx2) ||
                        (d.source.index === idx2 && d.target.index === idx1);
        return isMatch ? this.config.focusedOpacity : this.config.defocusedOpacity;
      });

    this.arcsGroup.selectAll('.chord-arc')
      .transition().duration(400)
      .attr('opacity', d => (d.index === idx1 || d.index === idx2) ? 1.0 : 0.4);
  }

  resetFocus() {
    this.ribbonPaths
      .transition().duration(300)
      .attr('opacity', this.config.defaultOpacity);

    this.arcsGroup.selectAll('.chord-arc')
      .transition().duration(300)
      .attr('opacity', 1.0);
  }

  showRibbonTooltip(event, d) {
    const sName = this.data.names[d.source.index];
    const tName = this.data.names[d.target.index];
    const sVal = d.source.value.toLocaleString();
    const tVal = d.target.value.toLocaleString();

    this.tooltip.html(`
      <div class="chord-tooltip-card">
        <div class="chord-tooltip-header">${sName} ⇄ ${tName}</div>
        <div class="chord-tooltip-row">
          <span>${sName} → ${tName}:</span>
          <b>${sVal}</b>
        </div>
        <div class="chord-tooltip-row">
          <span>${tName} → ${sName}:</span>
          <b>${tVal}</b>
        </div>
      </div>
    `);

    this.moveTooltip(event);
    this.tooltip.transition().duration(150).style('opacity', 1);
  }

  showArcTooltip(event, d) {
    const name = this.data.names[d.index];
    const total = d.value.toLocaleString();

    this.tooltip.html(`
      <div class="chord-tooltip-card">
        <div class="chord-tooltip-header">${name}</div>
        <div class="chord-tooltip-row">
          <span>Total Interactions:</span>
          <b>${total}</b>
        </div>
      </div>
    `);

    this.moveTooltip(event);
    this.tooltip.transition().duration(150).style('opacity', 1);
  }

  moveTooltip(event) {
    const bounds = this.container.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    this.tooltip
      .style('left', `${x}px`)
      .style('top', `${y - 15}px`);
  }

  hideTooltip() {
    this.tooltip.transition().duration(150).style('opacity', 0);
  }

  setOption(key, val) {
    this.config[key] = val;
    this.render();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlourishChordDiagram;
} else if (typeof window !== 'undefined') {
  window.FlourishChordDiagram = FlourishChordDiagram;
}
