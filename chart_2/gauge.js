/**
 * FlourishGauge - Exact Replica of Flourish Studio Gauge
 * Highly optimized, energy-efficient vector probability meter.
 * 
 * Performance & Efficiency:
 * - IntersectionObserver & Page Visibility API: Pauses animation loop when off-screen
 *   or in a hidden tab (0% CPU / battery drain when not visible).
 * - Sub-pixel hardware-accelerated transforms (will-change: transform).
 * - Smooth multi-frequency analog needle shake/quiver centered at 48%.
 * - Pure vector graphics with geometricPrecision anti-aliasing.
 */

class FlourishGauge {
  constructor(container, options = {}) {
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }

    if (!this.container) {
      console.error('FlourishGauge: Container element not found.');
      return;
    }

    this.config = Object.assign({
      min: 0,
      max: 100,
      value: options.value !== undefined ? options.value : 48,
      label: options.label !== undefined ? options.label : '3BHK',
      unit: options.unit !== undefined ? options.unit : '%',
      totalSweep: 240,     // Exact 240° horseshoe arc
      startAngle: -120,    // -120° (0%, 7 o'clock)
      endAngle: 120,       // +120° (100%, 5 o'clock)
      outerRadius: 180,    // Wide, thick Flourish arc band
      innerRadius: 88,     // Crisp inner circular edge
      hubRadius: 15,       // Center pivot hub
      cx: 250,
      cy: 215,
      // Perfectly centered 1:1 square viewBox
      viewBox: '50 -25 400 400',
      autoShake: true,     // Active realistic analog needle shake
      shakeIntensity: 0.95,// Natural speedometer needle quiver
      // 5 Flourish segments matching exact colors & proportions
      segments: [
        { 
          from: 0, 
          to: 20, 
          label: '', 
          color: '#2b74ea',  // Flourish Cobalt Blue
          textColor: '#ffffff'
        },
        { 
          from: 20, 
          to: 37, 
          label: 'Unlikely', 
          color: '#9bbdf8',  // Flourish Sky Blue
          textColor: '#1e293b',
          fontSize: '17px',
          fontWeight: '700',
          curved: true
        },
        { 
          from: 37, 
          to: 63, 
          label: 'Toss-Up', 
          color: '#f6f7fb',  // Flourish Off-White / Pale Lilac
          textColor: '#1e293b',
          fontSize: '18px',
          fontWeight: '700',
          curved: true
        },
        { 
          from: 63, 
          to: 80, 
          label: 'Likely', 
          color: '#6f84b6',  // Flourish Steel Lavender / Slate Blue
          textColor: '#ffffff',
          fontSize: '17px',
          fontWeight: '700',
          curved: true
        },
        { 
          from: 80, 
          to: 100, 
          label: 'Very likely', 
          color: '#05194a',  // Flourish Deep Midnight Navy
          textColor: '#ffffff', 
          multiLine: true,
          line1: 'Very',
          line2: 'likely',
          fontSize: '15px',
          fontWeight: '700'
        }
      ]
    }, options);

    this.id = 'flourish_' + Math.random().toString(36).substr(2, 8);
    this.currentValue = this.config.value;
    this.baseAngle = this.valueToAngle(this.currentValue);
    this.isRunning = false;
    this.isVisible = true;

    this.render();

    if (this.config.autoShake) {
      this.initVisibilityController();
      this.startShakeLoop();
    } else {
      this.setAngle(this.baseAngle);
    }
  }

  valueToAngle(val) {
    const clamped = Math.max(this.config.min, Math.min(this.config.max, val));
    const ratio = (clamped - this.config.min) / (this.config.max - this.config.min);
    return this.config.startAngle + ratio * this.config.totalSweep;
  }

  polarToCartesian(angleDeg, radius) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: this.config.cx + radius * Math.sin(rad),
      y: this.config.cy - radius * Math.cos(rad)
    };
  }

  describeArc(startAngle, endAngle, innerR, outerR) {
    const p1 = this.polarToCartesian(startAngle, outerR);
    const p2 = this.polarToCartesian(endAngle, outerR);
    const p3 = this.polarToCartesian(endAngle, innerR);
    const p4 = this.polarToCartesian(startAngle, innerR);

    const angleDiff = Math.abs(endAngle - startAngle);
    const largeArc = angleDiff > 180 ? 1 : 0;

    return [
      `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
      'Z'
    ].join(' ');
  }

  describeTextArc(startAngle, endAngle, radius) {
    const p1 = this.polarToCartesian(startAngle, radius);
    const p2 = this.polarToCartesian(endAngle, radius);
    const angleDiff = Math.abs(endAngle - startAngle);
    const largeArc = angleDiff > 180 ? 1 : 0;
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  render() {
    const { cx, cy, innerRadius, outerRadius, hubRadius, segments, viewBox } = this.config;
    const midRadius = (innerRadius + outerRadius) / 2;

    let segmentsSvg = '';
    let segmentLabelsSvg = '';
    let textPathsDef = '';

    segments.forEach((seg, idx) => {
      const a1 = this.valueToAngle(seg.from);
      const a2 = this.valueToAngle(seg.to);
      const segD = this.describeArc(a1, a2, innerRadius, outerRadius);
      segmentsSvg += `<path d="${segD}" fill="${seg.color}" />\n`;

      if (seg.curved) {
        const pathId = `${this.id}_textpath_${idx}`;
        const pathD = this.describeTextArc(a1, a2, midRadius);
        textPathsDef += `<path id="${pathId}" d="${pathD}" fill="none" />\n`;
        segmentLabelsSvg += `
          <text fill="${seg.textColor}" style="font-size: ${seg.fontSize}; font-weight: ${seg.fontWeight}; font-family: 'Plus Jakarta Sans', sans-serif;">
            <textPath href="#${pathId}" startOffset="50%" text-anchor="middle" dominant-baseline="central" alignment-baseline="middle">
              ${seg.label}
            </textPath>
          </text>
        `;
      } else if (seg.multiLine) {
        const midA = (a1 + a2) / 2;
        const pos = this.polarToCartesian(midA, midRadius);
        segmentLabelsSvg += `
          <g transform="translate(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}) rotate(${midA.toFixed(1)})">
            <text fill="${seg.textColor}" text-anchor="middle" dominant-baseline="central" alignment-baseline="middle" style="font-size: ${seg.fontSize}; font-weight: ${seg.fontWeight}; font-family: 'Plus Jakarta Sans', sans-serif;">
              <tspan x="0" y="-9">${seg.line1}</tspan>
              <tspan x="0" y="9">${seg.line2}</tspan>
            </text>
          </g>
        `;
      }
    });

    // 3D Chiseled Needle Geometry
    const needleLength = outerRadius - 3;
    const baseW = 8.5; // Half-width (17px wide base)
    const tipW = 1.0;  // Sharp needle tip

    const leftFacetD = `M -${tipW} -${needleLength} L 0 -${needleLength} L 0 0 L -${baseW} 0 Z`;
    const rightFacetD = `M 0 -${needleLength} L ${tipW} -${needleLength} L ${baseW} 0 L 0 0 Z`;

    const html = `
      <div class="flourish-gauge-card" id="${this.id}">
        <svg class="flourish-gauge-svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" text-rendering="geometricPrecision" shape-rendering="geometricPrecision">
          <defs>
            <!-- Needle directional shadow -->
            <filter id="${this.id}_needle_shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="2.8" flood-color="rgba(15, 23, 42, 0.32)" />
            </filter>
            <!-- Center hub shadow -->
            <filter id="${this.id}_hub_shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.22)" />
            </filter>
            <!-- Turned Metallic Specular Gradient for Center Hub -->
            <radialGradient id="${this.id}_hub_grad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#64748b" />
              <stop offset="55%" stop-color="#475569" />
              <stop offset="100%" stop-color="#334155" />
            </radialGradient>
            ${textPathsDef}
          </defs>

          <!-- 1. Pure colored segments (No tick lines, no perimeter numbers) -->
          <g class="gauge-segments">
            ${segmentsSvg}
          </g>

          <!-- 2. Clean inner center circular boundary -->
          <circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="#ffffff" />

          <!-- 3. Curved & Rotated segment labels -->
          <g class="gauge-labels">
            ${segmentLabelsSvg}
          </g>

          <!-- 4. 3D Chiseled needle & center hub pivot -->
          <g class="needle-pivot-group" transform="translate(${cx}, ${cy})">
            <g id="${this.id}_needle" transform="rotate(${this.baseAngle.toFixed(2)})" filter="url(#${this.id}_needle_shadow)" style="will-change: transform;">
              <path d="${leftFacetD}" fill="#64748b" class="needle-facet-left" />
              <path d="${rightFacetD}" fill="#334155" class="needle-facet-right" />
            </g>
            <circle cx="0" cy="0" r="${hubRadius}" fill="url(#${this.id}_hub_grad)" stroke="#ffffff" stroke-width="2.5" filter="url(#${this.id}_hub_shadow)" class="gauge-hub-circle" />
          </g>

          <!-- 5. Center readout below hub: '3BHK' and '48%' -->
          <g class="gauge-readout-group" transform="translate(${cx}, ${cy})">
            <text x="0" y="44" class="gauge-readout-label" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#475569" letter-spacing="0.8px">${this.config.label}</text>
            <text x="0" y="80" class="gauge-readout-value" id="${this.id}_val_text" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="44" font-weight="800" fill="#0f172a" letter-spacing="-0.5px">
              ${this.currentValue}${this.config.unit}
            </text>
          </g>
        </svg>
      </div>
    `;

    this.container.innerHTML = html;
    this.needleEl = document.getElementById(`${this.id}_needle`);
    this.valueTextEl = document.getElementById(`${this.id}_val_text`);
  }

  setAngle(angle) {
    if (this.needleEl) {
      this.needleEl.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
    }
  }

  /**
   * Energy-efficient Visibility Controller
   * Automatically suspends requestAnimationFrame when scrolled out of view or tab is hidden.
   */
  initVisibilityController() {
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stopShakeLoop();
      } else if (this.isVisible && !this.isRunning) {
        this.startShakeLoop();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    if ('IntersectionObserver' in window && this.container) {
      this.observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        this.isVisible = entry ? entry.isIntersecting : true;
        if (this.isVisible && !document.hidden) {
          if (!this.isRunning) this.startShakeLoop();
        } else {
          this.stopShakeLoop();
        }
      }, { threshold: 0.05 });
      this.observer.observe(this.container);
    }
  }

  /**
   * Continuous realistic analog needle shake
   * Leaves readout solid at 3BHK 48% and organically vibrates the needle
   */
  startShakeLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = (currentTime) => {
      if (!this.isRunning) return;

      const t = currentTime * 0.001; // seconds

      // Realistic analog speedometer needle vibration
      const sway = Math.sin(t * 2.2) * 0.45;
      const flutter1 = Math.sin(t * 8.5) * 0.55;
      const flutter2 = Math.cos(t * 14.3) * 0.35;
      const microJitter = Math.sin(t * 26.0) * 0.15;

      const shakeOffset = (sway + flutter1 + flutter2 + microJitter) * this.config.shakeIntensity;
      const angle = this.baseAngle + shakeOffset;

      if (this.needleEl) {
        this.needleEl.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  stopShakeLoop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy() {
    this.stopShakeLoop();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}
