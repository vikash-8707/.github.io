/**
 * Flourish India Marker Map (v13.0.1 Style)
 * Centered on India with custom building, photo, and video markers across
 * major state capitals, metropolitan hubs, heritage landmarks, and scenic destinations.
 */

class FlourishMarkerMap {
  constructor(containerId, markersData, options = {}) {
    this.containerId = containerId;
    this.markersData = markersData;

    this.config = Object.assign({
      initialCenter: [22.0, 79.5], // Geographic center of India
      initialZoom: 5,
      minZoom: 4,
      maxZoom: 18,
      activeFilter: 'all' // 'all', 'building', 'photo', 'video'
    }, options);

    this.initMap();
    this.renderMarkers();
  }

  initMap() {
    // Initialize Leaflet Map centered on India
    this.map = L.map(this.containerId, {
      center: this.config.initialCenter,
      zoom: this.config.initialZoom,
      minZoom: this.config.minZoom,
      maxZoom: this.config.maxZoom,
      zoomControl: false, // Custom zoom buttons in top right
      attributionControl: false
    });

    // Klokantech / Flourish style base tile layer (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    // Marker Layer Group
    this.markerLayerGroup = L.layerGroup().addTo(this.map);

    // Setup Custom Zoom Controls in Top Right
    this.setupZoomControls();
  }

  getIconSvg(type) {
    if (type === 'photo') {
      // Black Square with Mountains & Sun (Photo icon)
      return `
        <svg viewBox="0 0 24 24" class="svg-icon svg-photo">
          <rect x="2" y="3" width="20" height="18" rx="2" fill="#0f172a"/>
          <circle cx="16" cy="8" r="2.2" fill="#ffffff"/>
          <polygon points="4,18 9,11 13,15 16,10 20,18" fill="#ffffff"/>
        </svg>
      `;
    } else if (type === 'video') {
      // Black Circle with Play Triangle (Video marker)
      return `
        <svg viewBox="0 0 24 24" class="svg-icon svg-video">
          <circle cx="12" cy="12" r="11" fill="#0f172a"/>
          <polygon points="9.5,7 17,12 9.5,17" fill="#ffffff"/>
        </svg>
      `;
    } else {
      // Black Office Tower with Windows (Building marker)
      return `
        <svg viewBox="0 0 24 24" class="svg-icon svg-building">
          <rect x="5" y="2" width="14" height="20" rx="1.5" fill="#0f172a"/>
          <!-- Window Grid -->
          <rect x="7" y="4.5" width="2.3" height="2.3" fill="#ffffff"/>
          <rect x="10.8" y="4.5" width="2.3" height="2.3" fill="#ffffff"/>
          <rect x="14.6" y="4.5" width="2.3" height="2.3" fill="#ffffff"/>
          
          <rect x="7" y="8.5" width="2.3" height="2.3" fill="#ffffff"/>
          <rect x="10.8" y="8.5" width="2.3" height="2.3" fill="#ffffff"/>
          <rect x="14.6" y="8.5" width="2.3" height="2.3" fill="#ffffff"/>
          
          <rect x="7" y="12.5" width="2.3" height="2.3" fill="#ffffff"/>
          <rect x="10.8" y="12.5" width="2.3" height="2.3" fill="#ffffff"/>
          <rect x="14.6" y="12.5" width="2.3" height="2.3" fill="#ffffff"/>
          <!-- Doorway -->
          <rect x="10" y="17" width="4" height="5" fill="#ffffff"/>
        </svg>
      `;
    }
  }

  renderMarkers() {
    this.markerLayerGroup.clearLayers();

    this.markersData.forEach(d => {
      if (this.config.activeFilter !== 'all' && this.config.activeFilter !== d.type) {
        return;
      }

      const iconHtml = `
        <div class="flourish-marker-item marker-${d.type}">
          <div class="marker-icon-box">${this.getIconSvg(d.type)}</div>
          <span class="marker-label-text">${d.city}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-flourish-div-icon',
        iconSize: [140, 28],
        iconAnchor: [12, 14],
        popupAnchor: [10, -14]
      });

      const marker = L.marker([d.lat, d.lng], { icon: customIcon });

      // Build Flourish Style Popup Card
      let mediaPreview = '';
      if (d.type === 'photo' && d.imageUrl) {
        mediaPreview = `
          <div class="popup-photo-preview">
            <img src="${d.imageUrl}" alt="${d.city}" loading="lazy" />
          </div>
        `;
      } else if (d.type === 'video') {
        mediaPreview = `
          <div class="popup-video-preview">
            <div class="video-play-banner">
              <span class="play-btn-circle">▶</span>
              <span class="video-title-tag">${d.videoTitle || 'Scenic Aerial Tour'}</span>
            </div>
          </div>
        `;
      }

      const popupContent = `
        <div class="flourish-popup-card">
          ${mediaPreview}
          <div class="popup-header-row">
            <span class="popup-category-badge badge-${d.type}">${d.category || 'City'}</span>
            <span class="popup-country">${d.country}</span>
          </div>
          <h3 class="popup-city-title">${d.city}</h3>
          <p class="popup-desc">${d.description || ''}</p>
          <div class="popup-meta-row">
            <span><b>Details:</b> ${d.population}</span>
            <span><b>Coordinates:</b> ${d.lat.toFixed(4)}°N, ${d.lng.toFixed(4)}°E</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'flourish-custom-popup'
      });

      this.markerLayerGroup.addLayer(marker);
    });
  }

  setupZoomControls() {
    const zoomContainer = document.createElement('div');
    zoomContainer.className = 'custom-zoom-control';
    zoomContainer.innerHTML = `
      <button type="button" class="zoom-btn" id="zoomInBtn" title="Zoom in" aria-label="Zoom in">+</button>
      <button type="button" class="zoom-btn" id="zoomOutBtn" title="Zoom out" aria-label="Zoom out">−</button>
      <button type="button" class="zoom-btn" id="zoomResetBtn" title="Reset to All India" aria-label="Reset to All India">⌂</button>
    `;

    document.getElementById(this.containerId).appendChild(zoomContainer);

    zoomContainer.querySelector('#zoomInBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.map.zoomIn();
    });

    zoomContainer.querySelector('#zoomOutBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.map.zoomOut();
    });

    zoomContainer.querySelector('#zoomResetBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.flyToIndia();
    });
  }

  // Smooth camera navigation
  flyToIndia() {
    this.map.flyTo(this.config.initialCenter, this.config.initialZoom, { duration: 1.2 });
  }

  flyToGurgaon() {
    this.map.flyTo([28.4595, 77.0266], 12, { duration: 1.5 });
  }

  // Filter markers by type (all, building, photo, video)
  setFilter(filterType) {
    this.config.activeFilter = filterType;
    this.renderMarkers();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlourishMarkerMap;
} else if (typeof window !== 'undefined') {
  window.FlourishMarkerMap = FlourishMarkerMap;
}
