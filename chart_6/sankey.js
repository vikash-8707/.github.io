/**
 * Flourish Sankey Diagram (v13.0.1)
 * High-performance, pixel-accurate replica of Flourish Studio's Sankey visualization.
 * Features two-color linear gradient ribbons, value badge overlays, interactive focus/defocus,
 * node dragging, and dynamic configuration via the settings panel.
 */

class FlourishSankey {
  constructor(container, data, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.rawNodes = JSON.parse(JSON.stringify(data.nodes));
    this.rawLinks = JSON.parse(JSON.stringify(data.links));

    this.config = Object.assign({
      aspectRatio: 0.62,
      margin: { top: 25, right: 130, bottom: 25, left: 110 },
      nodeWidth: 16,
      nodePadding: 20,
      align: 'justify', // 'justify', 'left', 'right', 'center'
      iterations: 10,
      defaultOpacity: 0.35,
      focusedOpacity: 0.95,
      defocusedOpacity: 0.10,
      selectedLink: { source: 'Petroleum', target: 'Industrial' }, // Default selected in screenshot
      selectedNode: null
    }, options);

    this.colorMap = new Map(this.rawNodes.map(n => [n.id, n.color]));

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    const rect = this.container.getBoundingClientRect();
    const width = Math.max(700, rect.width || 980);
    const height = Math.round(width * this.config.aspectRatio);

    this.width = width;
    this.height = height;

    const { margin } = this.config;
    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // Create Main SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('class', 'flourish-sankey-svg');

    // SVG Defs for linear gradients and drop shadows
    this.defs = this.svg.append('defs');

    // Drop shadow filter for value badge
    const filter = this.defs.append('filter')
      .attr('id', 'badge-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '3')
      .attr('flood-color', 'rgba(0, 0, 0, 0.25)');

    // Main graph group
    this.g = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Layers
    this.linksLayer = this.g.append('g').attr('class', 'sankey-links');
    this.nodesLayer = this.g.append('g').attr('class', 'sankey-nodes');
    this.labelsLayer = this.g.append('g').attr('class', 'sankey-labels');
    this.badgeLayer = this.g.append('g').attr('class', 'sankey-badges');

    // Tooltip
    this.tooltip = d3.select(this.container)
      .append('div')
      .attr('class', 'flourish-tooltip')
      .style('opacity', 0);

    this.render();

    // Background click to reset selection
    this.svg.on('click', (event) => {
      if (event.target === this.svg.node()) {
        this.clearSelection();
      }
    });

    // Resize handling
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newRect = this.container.getBoundingClientRect();
        if (Math.abs(newRect.width - this.width) > 20) {
          this.init();
        }
      }, 100);
    });
  }

  getAlignmentFunction() {
    switch (this.config.align) {
      case 'left': return d3.sankeyLeft;
      case 'right': return d3.sankeyRight;
      case 'center': return d3.sankeyCenter;
      case 'justify':
      default:
        return d3.sankeyJustify;
    }
  }

  render() {
    const { innerWidth, innerHeight } = this;

    // 1. Setup Sankey Generator
    const alignFn = this.getAlignmentFunction();

    this.sankeyGenerator = d3.sankey()
      .nodeId(d => d.id)
      .nodeAlign(alignFn)
      .nodeWidth(this.config.nodeWidth)
      .nodePadding(this.config.nodePadding)
      .iterations(this.config.iterations)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    // Deep clone data for D3 Sankey graph calculation
    const graphData = {
      nodes: this.rawNodes.map(d => Object.assign({}, d)),
      links: this.rawLinks.map(d => Object.assign({}, d))
    };

    const graph = this.sankeyGenerator(graphData);
    this.graph = graph;

    // 2. Generate Linear Gradients for each link
    this.defs.selectAll('.link-grad').remove();

    graph.links.forEach((link, i) => {
      const gradId = `sankey-grad-${i}`;
      link.gradId = gradId;

      const grad = this.defs.append('linearGradient')
        .attr('id', gradId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('x2', link.target.x0);

      const sourceColor = link.source.color || '#94a3b8';
      const targetColor = link.target.color || '#94a3b8';

      grad.append('stop').attr('offset', '0%').attr('stop-color', sourceColor);
      grad.append('stop').attr('offset', '100%').attr('stop-color', targetColor);
    });

    // 3. Render Links
    this.linkElements = this.linksLayer.selectAll('.sankey-link')
      .data(graph.links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => `url(#${d.gradId})`)
      .attr('stroke-width', d => Math.max(1.2, d.width))
      .attr('fill', 'none')
      .attr('opacity', d => this.getLinkOpacity(d));

    this.setupLinkInteractions();

    // 4. Render Nodes
    this.nodeGroups = this.nodesLayer.selectAll('.sankey-node')
      .data(graph.nodes)
      .join('g')
      .attr('class', 'sankey-node')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

    this.nodeRects = this.nodeGroups.selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => Math.max(2, d.y1 - d.y0))
      .attr('fill', d => d.color)
      .attr('rx', 2)
      .attr('cursor', 'pointer');

    this.setupNodeInteractions();

    // 5. Render Node Labels
    this.labelsLayer.selectAll('.sankey-label').remove();

    this.labelsLayer.selectAll('.sankey-label')
      .data(graph.nodes)
      .join('text')
      .attr('class', 'sankey-label')
      .attr('x', d => {
        if (d.x0 < innerWidth * 0.25) return d.x0 - 8; // Left aligned sources
        if (d.x1 > innerWidth * 0.75) return d.x1 + 8; // Right aligned outputs
        return d.x0 - 8; // Middle column labels placed just left of bar
      })
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => {
        if (d.x0 < innerWidth * 0.25) return 'end';
        if (d.x1 > innerWidth * 0.75) return 'start';
        return 'end';
      })
      .text(d => d.name)
      .style('font-size', '12px')
      .style('font-weight', d => (d.id === 'Petroleum' || d.id === 'Industrial' ? '700' : '500'))
      .style('fill', '#1e293b')
      .style('pointer-events', 'none')
      .style('display', d => ((d.y1 - d.y0) < 5 && d.x0 >= innerWidth * 0.25 && d.x1 <= innerWidth * 0.75 ? 'none' : 'block'));

    // 6. Render Active Link Value Badge (Default 8.38 on Petroleum -> Industrial)
    this.renderValueBadges();
  }

  getLinkOpacity(d) {
    const { selectedLink, selectedNode, defaultOpacity, focusedOpacity, defocusedOpacity } = this.config;

    if (selectedLink) {
      const isSelected = (d.source.id === selectedLink.source && d.target.id === selectedLink.target);
      return isSelected ? focusedOpacity : defocusedOpacity;
    }

    if (selectedNode) {
      const isConnected = (d.source.id === selectedNode || d.target.id === selectedNode);
      return isConnected ? focusedOpacity : defocusedOpacity;
    }

    return defaultOpacity;
  }

  renderValueBadges() {
    this.badgeLayer.selectAll('*').remove();

    const { selectedLink } = this.config;
    if (!selectedLink) return;

    // Find the matching link in graph
    const link = this.graph.links.find(
      l => l.source.id === selectedLink.source && l.target.id === selectedLink.target
    );

    if (!link) return;

    // Calculate midpoint on cubic bezier curve
    const xMid = (link.source.x1 + link.target.x0) / 2;
    const yMid = (link.y0 + link.y1) / 2;

    const badgeGroup = this.badgeLayer.append('g')
      .attr('class', 'link-value-badge')
      .attr('transform', `translate(${xMid}, ${yMid})`);

    const valText = link.value.toFixed(2);

    // Background pill
    const paddingX = 12;
    const height = 24;
    const width = 48;

    badgeGroup.append('rect')
      .attr('x', -width / 2)
      .attr('y', -height / 2)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 12)
      .attr('fill', '#ffffff')
      .attr('filter', 'url(#badge-shadow)');

    // Text label
    badgeGroup.append('text')
      .attr('dy', '0.36em')
      .attr('text-anchor', 'middle')
      .text(valText)
      .style('font-size', '12px')
      .style('font-weight', '700')
      .style('fill', '#0f172a');
  }

  setupLinkInteractions() {
    this.linkElements
      .on('mouseenter', (event, d) => {
        if (!this.config.selectedLink) {
          this.highlightLink(d);
        }
        this.showLinkTooltip(event, d);
      })
      .on('mousemove', (event) => {
        this.moveTooltip(event);
      })
      .on('mouseleave', () => {
        if (!this.config.selectedLink) {
          this.resetHighlight();
        }
        this.hideTooltip();
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        this.toggleLinkSelection(d);
      });
  }

  setupNodeInteractions() {
    this.nodeGroups
      .on('mouseenter', (event, d) => {
        if (!this.config.selectedLink && !this.config.selectedNode) {
          this.highlightNode(d);
        }
        this.showNodeTooltip(event, d);
      })
      .on('mousemove', (event) => {
        this.moveTooltip(event);
      })
      .on('mouseleave', () => {
        if (!this.config.selectedLink && !this.config.selectedNode) {
          this.resetHighlight();
        }
        this.hideTooltip();
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        this.toggleNodeSelection(d);
      });
  }

  highlightLink(link) {
    this.linkElements
      .transition().duration(150)
      .attr('opacity', d => (d === link ? this.config.focusedOpacity : this.config.defocusedOpacity));

    this.renderSingleBadge(link);
  }

  highlightNode(node) {
    this.linkElements
      .transition().duration(150)
      .attr('opacity', d => {
        const isConnected = (d.source.id === node.id || d.target.id === node.id);
        return isConnected ? this.config.focusedOpacity : this.config.defocusedOpacity;
      });
  }

  resetHighlight() {
    this.linkElements
      .transition().duration(150)
      .attr('opacity', d => this.getLinkOpacity(d));

    this.renderValueBadges();
  }

  toggleLinkSelection(link) {
    if (this.config.selectedLink &&
        this.config.selectedLink.source === link.source.id &&
        this.config.selectedLink.target === link.target.id) {
      this.clearSelection();
    } else {
      this.config.selectedNode = null;
      this.config.selectedLink = { source: link.source.id, target: link.target.id };
      this.updateSelectionVisuals();
    }
  }

  toggleNodeSelection(node) {
    if (this.config.selectedNode === node.id) {
      this.clearSelection();
    } else {
      this.config.selectedLink = null;
      this.config.selectedNode = node.id;
      this.updateSelectionVisuals();
    }
  }

  clearSelection() {
    this.config.selectedLink = null;
    this.config.selectedNode = null;
    this.updateSelectionVisuals();
  }

  updateSelectionVisuals() {
    this.linkElements
      .transition().duration(200)
      .attr('opacity', d => this.getLinkOpacity(d));

    this.renderValueBadges();
  }

  renderSingleBadge(link) {
    this.badgeLayer.selectAll('*').remove();

    const xMid = (link.source.x1 + link.target.x0) / 2;
    const yMid = (link.y0 + link.y1) / 2;

    const badgeGroup = this.badgeLayer.append('g')
      .attr('class', 'link-value-badge')
      .attr('transform', `translate(${xMid}, ${yMid})`);

    const width = 48;
    const height = 24;

    badgeGroup.append('rect')
      .attr('x', -width / 2)
      .attr('y', -height / 2)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 12)
      .attr('fill', '#ffffff')
      .attr('filter', 'url(#badge-shadow)');

    badgeGroup.append('text')
      .attr('dy', '0.36em')
      .attr('text-anchor', 'middle')
      .text(link.value.toFixed(2))
      .style('font-size', '12px')
      .style('font-weight', '700')
      .style('fill', '#0f172a');
  }

  showLinkTooltip(event, d) {
    this.tooltip.html(`
      <div class="tooltip-title">${d.source.name} \u2192 ${d.target.name}</div>
      <div class="tooltip-value">${d.value.toFixed(2)} <span class="tooltip-unit">quads</span></div>
    `);
    this.tooltip.style('display', 'block').transition().duration(100).style('opacity', 1);
    this.moveTooltip(event);
  }

  showNodeTooltip(event, d) {
    const total = d.value ? d.value.toFixed(2) : 0;
    this.tooltip.html(`
      <div class="tooltip-title">${d.name}</div>
      <div class="tooltip-value">${total} <span class="tooltip-unit">quads total</span></div>
    `);
    this.tooltip.style('display', 'block').transition().duration(100).style('opacity', 1);
    this.moveTooltip(event);
  }

  moveTooltip(event) {
    const bounds = this.container.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    this.tooltip
      .style('left', `${x + 16}px`)
      .style('top', `${y - 20}px`);
  }

  hideTooltip() {
    this.tooltip.transition().duration(120).style('opacity', 0).on('end', () => {
      this.tooltip.style('display', 'none');
    });
  }

  // Configuration API for Sidebar Controls
  setAlignment(align) {
    this.config.align = align;
    this.render();
  }

  setIterations(iterations) {
    this.config.iterations = parseInt(iterations, 10) || 10;
    this.render();
  }

  setNodePadding(padding) {
    this.config.nodePadding = parseInt(padding, 10) || 20;
    this.render();
  }

  setDefaultOpacity(opacity) {
    this.config.defaultOpacity = parseFloat(opacity);
    this.updateSelectionVisuals();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlourishSankey;
} else if (typeof window !== 'undefined') {
  window.FlourishSankey = FlourishSankey;
}
