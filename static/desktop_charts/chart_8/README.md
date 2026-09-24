# Flourish India Marker Map (v13.0.1 Style)

An interactive, responsive **India Metropolitan, Heritage & Media Marker Map** replicating the Flourish Studio Marker Map template style using **Leaflet.js**, custom SVG markers, and CartoDB Voyager tiles.

---

## 📁 Files in `chart_8`

1. **`index.html`**:
   - The main interactive map visualization of India.
   - Filter buttons:
     - **All Locations**: 32 major hubs across all regions of India.
     - **Metros & State Capitals**: Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Chandigarh, Lucknow, Bhopal, Patna, etc.
     - **Heritage & Landmarks**: Taj Mahal (Agra), Gateway of India (Mumbai), Hawa Mahal (Jaipur), Golden Temple (Amritsar), Victoria Memorial (Kolkata), Dal Lake (Srinagar).
     - **Scenic Video Tours**: Mumbai Sea Link, Varanasi Ganges Ghats, Kerala Backwaters, Goa Coastline, Ladakh Passes.
   - Quick View Switcher:
     - 🇮🇳 **All India**: Full country panorama.
     - 🏙️ **Gurgaon Focus**: Instant smooth camera zoom into Gurugram / Delhi NCR.
2. **`map.js`**:
   - `FlourishMarkerMap` component centered on India (`22.0° N, 79.5° E`, zoom level 5).
   - Custom SVG markers matching the Flourish screenshot:
     - 🏢 **Building icon**: State capitals and metropolitan tech centers.
     - 🖼️ **Photo icon**: Iconic heritage monuments with high-res photo previews.
     - ▶ **Video icon**: Scenic drone and coastal flyovers.
   - White halo city labels, custom zoom controls (`+`, `−`, and `⌂` reset to India), and rich card popups.
3. **`data.js`**:
   - Accurate GPS coordinates, population stats, descriptions, and media links for 32 iconic Indian locations.
4. **`style.css`**:
   - Clean styling, high-contrast text outlines, card popups, and responsive container.
5. **`embed-example.html`**:
   - Minimal standalone embed snippet for embedding the India map anywhere.

---

## 🚀 How to Run

Open `index.html` directly in your browser:

```bash
open index.html
```

Or serve with any static web server:

```bash
npx serve .
# or
python3 -m http.server 8080
```
