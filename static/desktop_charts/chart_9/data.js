/**
 * Dataset for Flourish 3D Viewer v4.0.1 Replica (Ridgeline Surface Model)
 * 10 categorized series spanning monthly metrics with characteristic peaks & valleys.
 */

const RIDGE_DATA = {
  // X-Axis labels across the front edge
  xLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

  // 10 Depth Series (From Back to Front: Cyan -> Orchid -> Radiant Magenta)
  series: [
    {
      id: "series-10",
      name: "Technology Index",
      color: "#06b6d4", // Electric Cyan
      values: [1.1, 1.25, 1.4, 1.35, 1.6, 1.55, 1.45, 1.3, 1.15, 0.9, 0.7, 0.5],
      unit: "$B Growth"
    },
    {
      id: "series-9",
      name: "Clean Energy",
      color: "#0ea5e9", // Sky Blue
      values: [0.9, 1.15, 1.3, 1.48, 1.4, 1.5, 1.35, 1.2, 1.05, 0.85, 0.65, 0.45],
      unit: "$B Growth"
    },
    {
      id: "series-8",
      name: "Healthcare",
      color: "#38bdf8", // Light Sky Blue
      values: [0.75, 0.95, 1.2, 1.38, 1.52, 1.42, 1.25, 1.1, 0.95, 0.8, 0.6, 0.4],
      unit: "$B Growth"
    },
    {
      id: "series-7",
      name: "Biotechnology",
      color: "#818cf8", // Periwinkle Blue
      values: [0.6, 0.8, 1.05, 1.25, 1.35, 1.45, 1.3, 1.15, 1.0, 0.75, 0.55, 0.35],
      unit: "$B Growth"
    },
    {
      id: "series-6",
      name: "E-Commerce",
      color: "#a855f7", // Purple / Violet
      values: [0.5, 0.7, 0.9, 1.12, 1.28, 1.35, 1.2, 1.05, 0.9, 0.7, 0.5, 0.3],
      unit: "$B Growth"
    },
    {
      id: "series-5",
      name: "Financial Tech",
      color: "#c084fc", // Lavender
      values: [0.4, 0.58, 0.78, 0.98, 1.18, 1.25, 1.1, 0.98, 0.85, 0.68, 0.48, 0.28],
      unit: "$B Growth"
    },
    {
      id: "series-4",
      name: "Real Estate",
      color: "#e879f9", // Light Fuchsia
      values: [0.35, 0.5, 0.68, 0.85, 1.05, 1.15, 1.02, 0.9, 0.8, 0.62, 0.45, 0.25],
      unit: "$B Growth"
    },
    {
      id: "series-3",
      name: "Consumer Goods",
      color: "#f472b6", // Pastel Orchid
      values: [0.3, 0.42, 0.58, 0.72, 0.9, 1.05, 0.95, 0.88, 0.82, 0.6, 0.4, 0.22],
      unit: "$B Growth"
    },
    {
      id: "series-2",
      name: "Robotics & AI",
      color: "#fb7185", // Coral Rose
      values: [0.25, 0.35, 0.48, 0.62, 0.8, 0.92, 0.85, 0.98, 1.12, 0.75, 0.5, 0.2],
      unit: "$B Growth"
    },
    {
      id: "series-1",
      name: "Digital Media",
      color: "#ec4899", // Radiant Magenta (Front Slice)
      values: [0.2, 0.3, 0.4, 0.52, 0.68, 0.75, 0.62, 0.85, 1.28, 0.95, 0.72, 0.18],
      unit: "$B Growth"
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RIDGE_DATA;
}
