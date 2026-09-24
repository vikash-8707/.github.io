"""
3D Interactive Vector Marker Map in Python (Flourish Style)
Powered by OpenMapTiles / OpenFreeMap and MapLibre GL.

- 3D Building Extrusions (Klokantech 3D style)
- Drag, Rotate, Tilt, and Zoom in 3D
- Custom Numbered Markers & Labels
- Zero API keys required (100% free & open-source)
"""

import json
import os
import webbrowser

def generate_3d_map(
    landmarks=None,
    center_lng=-0.0765,
    center_lat=51.5060,
    zoom=15.3,
    pitch=58,
    bearing=-30,
    output_filename="index.html"
):
    """
    Generates an interactive 3D map matching Flourish's 'Marker Map' (Klokantech 3D).

    :param landmarks: List of dicts with 'id', 'title', 'lat', 'lng', 'desc'
    :param center_lng: Initial map center longitude
    :param center_lat: Initial map center latitude
    :param zoom: Initial zoom level (14-17 is ideal for 3D buildings)
    :param pitch: 3D tilt angle (0 = flat 2D, 60 = 3D perspective)
    :param bearing: 3D camera rotation angle in degrees
    :param output_filename: Path/name of the generated HTML file
    """
    if landmarks is None:
        # Default landmarks matching the River Thames London Flourish screenshot
        landmarks = [
            {
                "id": 1,
                "title": "Tower Bridge",
                "lat": 51.5055,
                "lng": -0.0754,
                "desc": "Iconic suspension bridge built between 1886 and 1894."
            },
            {
                "id": 2,
                "title": "Tower of London",
                "lat": 51.5081,
                "lng": -0.0759,
                "desc": "Historic fortress and UNESCO World Heritage site."
            },
            {
                "id": 3,
                "title": "HMS Belfast",
                "lat": 51.5066,
                "lng": -0.0814,
                "desc": "Town-class light cruiser museum ship anchored on the River Thames."
            },
            {
                "id": 4,
                "title": "City Hall",
                "lat": 51.5048,
                "lng": -0.0790,
                "desc": "Distinctive glass landmark on the south bank of the Thames."
            },
            {
                "id": 5,
                "title": "St. Katharine Docks",
                "lat": 51.5075,
                "lng": -0.0710,
                "desc": "Former commercial dock, now a marina with waterside dining."
            }
        ]

    landmarks_json = json.dumps(landmarks, indent=2)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>3D Interactive Marker Map</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- MapLibre GL (Open-source vector tile map engine) -->
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>

  <style>
    * {{
      box-sizing: border-box;
    }}
    body {{
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }}
    #map {{
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
    }}

    /* Flourish-Style Numbered Marker Pins */
    .flourish-marker {{
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.22));
      transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .flourish-marker:hover {{
      transform: scale(1.12) translateY(-2px);
      z-index: 9999 !important;
    }}
    .marker-number {{
      font-weight: 800;
      font-size: 24px;
      color: #1a73e8;
      text-shadow:
        -2px -2px 0 #fff,
         2px -2px 0 #fff,
        -2px  2px 0 #fff,
         2px  2px 0 #fff,
         0px  3px 8px rgba(0,0,0,0.25);
      margin-right: 6px;
      line-height: 1;
    }}
    .marker-label {{
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
      padding: 5px 11px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #202124;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }}

    /* Control & Info Cards */
    .controls-overlay {{
      position: absolute;
      top: 18px;
      left: 18px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      padding: 14px 18px;
      border-radius: 10px;
      font-size: 13px;
      color: #374151;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(0, 0, 0, 0.06);
      z-index: 10;
      max-width: 320px;
      line-height: 1.45;
    }}
    .controls-overlay h3 {{
      margin: 0 0 6px 0;
      font-size: 15px;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .controls-overlay ul {{
      margin: 6px 0 0 0;
      padding-left: 18px;
    }}
    .controls-overlay li {{
      margin-bottom: 4px;
    }}

    /* Popup Styling */
    .maplibregl-popup-content {{
      border-radius: 8px !important;
      padding: 14px 16px !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18) !important;
      font-family: inherit;
    }}
  </style>
</head>
<body>

<div class="controls-overlay">
  <h3>🗺️ 3D Interactive Map</h3>
  <ul>
    <li><b>Left Click + Drag:</b> Pan across the map</li>
    <li><b>Right Click + Drag:</b> Tilt & rotate in 3D</li>
    <li><b>Ctrl + Drag:</b> Alternative 3D tilt & rotate</li>
    <li><b>Scroll:</b> Smooth zoom in / out</li>
    <li><b>Click any marker:</b> View landmark details</li>
  </ul>
</div>

<div id="map"></div>

<script>
  // OpenFreeMap Liberty style: 100% free OpenMapTiles with 3D buildings layer
  const map = new maplibregl.Map({{
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [{center_lng}, {center_lat}],
    zoom: {zoom},
    pitch: {pitch},      // 3D tilt angle
    bearing: {bearing},  // Rotation angle
    antialias: true
  }});

  // Add 3D Navigation Controls (Zoom in/out, Compass pitch reset)
  map.addControl(new maplibregl.NavigationControl({{
    visualizePitch: true
  }}), 'top-right');

  // Add Scale Control
  map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

  map.on('load', () => {{
    // Enhance 3D extruded buildings appearance
    if (map.getLayer('building-3d')) {{
      map.setPaintProperty('building-3d', 'fill-extrusion-color', '#dfdcda');
      map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.9);
    }}

    // Add Flourish-style custom markers
    const landmarks = {landmarks_json};

    landmarks.forEach(item => {{
      const markerElement = document.createElement('div');
      markerElement.className = 'flourish-marker';
      markerElement.innerHTML = `
        <span class="marker-number">${{item.id}}</span>
        <span class="marker-label">${{item.title}}</span>
      `;

      // Popup with landmark description
      const popup = new maplibregl.Popup({{ offset: 16 }}).setHTML(`
        <div style="font-family: inherit;">
          <h4 style="margin: 0 0 6px 0; color: #1a73e8; font-size: 15px;">#${{item.id}} ${{item.title}}</h4>
          <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.4;">${{item.desc}}</p>
        </div>
      `);

      new maplibregl.Marker({{ element: markerElement, anchor: 'left' }})
        .setLngLat([item.lng, item.lat])
        .setPopup(popup)
        .addTo(map);
    }});
  }});
</script>

</body>
</html>
"""

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(html_content)

    abs_path = os.path.abspath(output_filename)
    print(f"✅ Success! 3D Map generated at:")
    print(f"   {abs_path}")
    return abs_path


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "index.html")
    generate_3d_map(output_filename=output_path)
