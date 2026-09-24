/**
 * Flourish Data Explorer (v26.1.1) Bubble Cluster Chart
 * Replicates the Flourish bubble pack visualization with guaranteed solid bubble backgrounds
 */

class FlourishBubbleChart {
  constructor(container, data, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.rawData = data;
    
    this.config = Object.assign({
      width: 1000,
      height: 680,
      defaultRadius: 28,  // Substantial, readable default bubble radius
      position: 'none',   // 'none' (single cluster) or 'region' (split by continent)
      sizeBy: 'none',     // 'none', 'pop', 'gdp'
      colorBy: 'none',    // 'none' (Flourish grey), 'region'
      filterRegion: 'all',// 'all' or specific region
      aspectRatio: 0.68
    }, options);

    // Flourish Region Color Palette
    this.regionColors = {
      'Africa': '#5271b8',
      'Americas': '#2b74ea',
      'Asia': '#f59e0b',
      'Europe': '#10b981',
      'Oceania': '#8b5cf6'
    };

    this.defaultBubbleColor = '#9e9e9e'; // Exact Flourish screenshot neutral grey

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    
    // Auto-detect container dimensions
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 200) {
      this.config.width = rect.width;
      this.config.height = Math.max(580, rect.width * this.config.aspectRatio);
    }

    // Create SVG Stage
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'flourish-bubble-svg');

    // Zoom container group
    this.g = this.svg.append('g').attr('class', 'bubble-cluster-group');

    // Group for Region Header Labels (when split by continent)
    this.regionTitlesGroup = this.g.append('g').attr('class', 'region-titles-group');

    // Group for Bubbles
    this.bubblesGroup = this.g.append('g').attr('class', 'bubbles-layer');

    // Zoom & Pan behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Tooltip overlay element
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'flourish-bubble-tooltip')
      .style('opacity', 0);

    // Prepare node data & render
    this.updateNodes();
    this.render();
  }

  /** Calculate properly scaled, substantial radius for every bubble */
  updateNodes() {
    const minRadius = 19;  // Never smaller than 19px so text and background are always prominent
    const maxRadius = 48;  // Maximum size for mega-economies/populations

    // Filter data
    let filtered = this.rawData;
    if (this.config.filterRegion !== 'all') {
      filtered = this.rawData.filter(d => d.region.toLowerCase() === this.config.filterRegion.toLowerCase());
    }

    // Power scaling function ensures small nations remain substantial bubbles
    let getRadius = () => this.config.defaultRadius;

    if (this.config.sizeBy === 'pop') {
      const popValues = filtered.map(d => Number(d.pop) || 10000);
      const scale = d3.scalePow()
        .exponent(0.35)
        .domain([d3.min(popValues), d3.max(popValues)])
        .range([minRadius, maxRadius]);

      getRadius = (item) => {
        const val = Number(item.pop) || 10000;
        const r = scale(val);
        return isNaN(r) ? minRadius : Math.max(minRadius, Math.min(maxRadius, r));
      };
    } else if (this.config.sizeBy === 'gdp') {
      const gdpValues = filtered.map(d => Number(d.gdp) || 0.1);
      const scale = d3.scalePow()
        .exponent(0.38)
        .domain([d3.min(gdpValues), d3.max(gdpValues)])
        .range([minRadius, maxRadius]);

      getRadius = (item) => {
        const val = Number(item.gdp) || 0.1;
        const r = scale(val);
        return isNaN(r) ? minRadius : Math.max(minRadius, Math.min(maxRadius, r));
      };
    }

    // Preserve existing node positions so transitions are fluid
    const existingNodeMap = new Map();
    if (this.nodes) {
      this.nodes.forEach(n => existingNodeMap.set(n.name, n));
    }

    this.nodes = filtered.map(d => {
      const existing = existingNodeMap.get(d.name);
      const targetR = getRadius(d);

      if (existing) {
        existing.r = targetR;
        existing.region = d.region;
        existing.pop = d.pop;
        existing.gdp = d.gdp;
        return existing;
      }

      return {
        ...d,
        r: targetR,
        x: this.config.width / 2 + (Math.random() - 0.5) * 160,
        y: this.config.height / 2 + (Math.random() - 0.5) * 160,
        vx: 0,
        vy: 0
      };
    });
  }

  render() {
    const { width, height, position, colorBy } = this.config;

    // Cluster Centers with ample spacing for each continent
    const clusterCenters = {
      'Africa':   { x: width * 0.24, y: height * 0.32, title: 'AFRICA' },
      'Americas': { x: width * 0.22, y: height * 0.72, title: 'AMERICAS' },
      'Asia':     { x: width * 0.52, y: height * 0.48, title: 'ASIA' },
      'Europe':   { x: width * 0.78, y: height * 0.32, title: 'EUROPE' },
      'Oceania':  { x: width * 0.80, y: height * 0.72, title: 'OCEANIA' }
    };

    // Render Continent Region Titles when Position === 'region'
    const regionData = position === 'region' ? Object.keys(clusterCenters).map(k => ({
      key: k,
      name: clusterCenters[k].title,
      x: clusterCenters[k].x,
      y: clusterCenters[k].y - 95
    })) : [];

    this.regionTitlesGroup.selectAll('.region-header-title')
      .data(regionData, d => d.key)
      .join(
        enter => enter.append('text')
          .attr('class', 'region-header-title')
          .attr('x', d => d.x)
          .attr('y', d => d.y)
          .attr('text-anchor', 'middle')
          .attr('opacity', 0)
          .text(d => d.name)
          .call(sel => sel.transition().duration(400).attr('opacity', 1)),
        update => update.call(sel => sel.transition().duration(400)
          .attr('x', d => d.x)
          .attr('y', d => d.y)
          .attr('opacity', 1)),
        exit => exit.call(sel => sel.transition().duration(300).attr('opacity', 0).remove())
      );

    // Setup or update D3 Force Simulation
    if (!this.simulation) {
      this.simulation = d3.forceSimulation(this.nodes);
    } else {
      this.simulation.nodes(this.nodes);
    }

    // Flourish Packing Physics:
    // Inward gravity pull + hard edge-to-edge collision constraint
    this.simulation
      .force('charge', null)
      .force('collide', d3.forceCollide(d => d.r + 1.2).strength(1.0).iterations(4))
      .alphaDecay(0.02);

    if (position === 'region') {
      // Split into 5 continent clusters tightly packed around their regional centers
      this.simulation
        .force('center', null)
        .force('x', d3.forceX(d => clusterCenters[d.region]?.x || width / 2).strength(0.32))
        .force('y', d3.forceY(d => clusterCenters[d.region]?.y || height / 2).strength(0.32));
    } else {
      // Single central tight cluster (Exact Flourish default)
      this.simulation
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX(width / 2).strength(0.18))
        .force('y', d3.forceY(height / 2).strength(0.18));
    }

    // Bind bubble elements
    const bubbleGroups = this.bubblesGroup.selectAll('.bubble-node')
      .data(this.nodes, d => d.name)
      .join(
        enter => {
          const g = enter.append('g')
            .attr('class', 'bubble-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(this.drag(this.simulation));

          g.append('circle')
            .attr('class', 'bubble-circle');

          g.append('text')
            .attr('class', 'bubble-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');

          return g;
        },
        update => update,
        exit => exit.remove()
      );

    // Synchronously and solidly apply radius, fill color, border, and text
    bubbleGroups.each((d, i, nodes) => {
      const g = d3.select(nodes[i]);
      const fillColor = (colorBy === 'region') 
        ? (this.regionColors[d.region] || this.defaultBubbleColor) 
        : this.defaultBubbleColor;
      
      const strokeColor = d3.rgb(fillColor).darker(0.35);

      // Circle - Guaranteed solid visible background!
      g.select('circle')
        .attr('r', d.r)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', 1.5)
        .style('display', 'block')
        .style('opacity', 1);

      // Label - Crisp bold white text inside the bubble!
      const text = g.select('text');
      const fontSize = Math.max(9, Math.min(14, d.r * 0.40));
      text
        .attr('fill', '#ffffff')
        .style('font-size', `${fontSize}px`)
        .style('font-weight', '700');

      // Abbreviate text if bubble is small so text always fits inside the circle
      const maxChars = Math.floor(d.r / 3.0);
      let displayName = d.name;
      if (displayName.length > maxChars && d.r < 32) {
        displayName = displayName.substring(0, Math.max(3, maxChars - 1)) + '…';
      }
      text.text(displayName);
    });

    // Tooltip interactions
    bubbleGroups
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .classed('bubble-hovered', true)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 2.5);

        this.showTooltip(event, d);
      })
      .on('mousemove', (event, d) => {
        this.moveTooltip(event, d);
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .classed('bubble-hovered', false)
          .attr('stroke', d => {
            const fill = colorBy === 'region' ? (this.regionColors[d.region] || this.defaultBubbleColor) : this.defaultBubbleColor;
            return d3.rgb(fill).darker(0.35);
          })
          .attr('stroke-width', 1.5);

        this.hideTooltip();
      });

    // Simulation tick loop
    this.simulation.on('tick', () => {
      bubbleGroups.attr('transform', d => `translate(${d.x.toFixed(1)}, ${d.y.toFixed(1)})`);
    });

    // Re-heat simulation smoothly
    this.simulation.alpha(0.8).restart();
  }

  showTooltip(event, d) {
    const popFormatted = (d.pop >= 1e6) ? `${(d.pop / 1e6).toFixed(1)}M` : `${(d.pop / 1e3).toFixed(0)}K`;

    this.tooltip.html(`
      <div class="tooltip-badge">
        <div class="tooltip-title">${d.name}</div>
        <div class="tooltip-details">
          <span>Region: <b>${d.region}</b></span>
          <span>Pop: <b>${popFormatted}</b></span>
          <span>GDP: <b>$${d.gdp}B</b></span>
        </div>
      </div>
    `);

    this.moveTooltip(event, d);
    this.tooltip.transition().duration(150).style('opacity', 1);
  }

  moveTooltip(event, d) {
    const bounds = this.container.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    this.tooltip
      .style('left', `${x}px`)
      .style('top', `${y - 12}px`);
  }

  hideTooltip() {
    this.tooltip.transition().duration(150).style('opacity', 0);
  }

  // Drag behavior with spring physics
  drag(simulation) {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // Highlight specific country on search
  searchCountry(query) {
    if (!query || !query.trim()) {
      this.bubblesGroup.selectAll('.bubble-circle').classed('bubble-dimmed', false).classed('bubble-searched', false);
      return;
    }

    const q = query.toLowerCase().trim();
    let matchedNode = null;

    this.bubblesGroup.selectAll('.bubble-circle')
      .each((d, i, nodes) => {
        const isMatch = d.name.toLowerCase().includes(q);
        const el = d3.select(nodes[i]);
        if (isMatch) {
          el.classed('bubble-searched', true).classed('bubble-dimmed', false);
          if (!matchedNode) matchedNode = d;
        } else {
          el.classed('bubble-searched', false).classed('bubble-dimmed', true);
        }
      });

    if (matchedNode) {
      this.showTooltip({ clientX: matchedNode.x, clientY: matchedNode.y }, matchedNode);
    }
  }

  // Update configuration dynamically
  setOption(key, val) {
    this.config[key] = val;
    this.updateNodes();
    this.render();
  }

  // Reset zoom view
  resetZoom() {
    this.svg.transition().duration(600).call(this.zoom.transform, d3.zoomIdentity);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlourishBubbleChart;
} else if (typeof window !== 'undefined') {
  window.FlourishBubbleChart = FlourishBubbleChart;
}
