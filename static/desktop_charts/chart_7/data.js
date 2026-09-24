/**
 * Real Estate Isotype Visualization Data
 * Distribution of 1 BHK, 2 BHK, and 3 BHK flats across residential towers/projects.
 * Preserves the exact proportions of the Altair/Vega-Lite Isotype example:
 * - Tower A (Great Britain): 3 units of 1 BHK, 2 units of 2 BHK, 10 units of 3 BHK
 * - Tower B (United States): 10 units of 1 BHK, 6 units of 2 BHK, 7 units of 3 BHK
 */

const FLAT_TYPES = {
  "1bhk": {
    id: "1bhk",
    label: "1 BHK Flats",
    shortLabel: "1 BHK",
    color: "#c85a48", // Terracotta / Coral matching Altair cattle row
    areaSqFt: "620 – 680 sq.ft",
    avgPrice: "$145,000",
    features: "1 Bedroom · 1 Bath · Kitchen · Living Room",
    // Clean, scalable SVG path for 1 BHK flat icon (viewBox 0 0 52 32)
    svgPath: "M4 4h44a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 4v8h14V8H8zm18 0v8h18V8H26zm-18 12v4h10v-4H8zm18 0v6h8v-6h-8z"
  },
  "2bhk": {
    id: "2bhk",
    label: "2 BHK Flats",
    shortLabel: "2 BHK",
    color: "#374151", // Charcoal slate matching Altair pig row
    areaSqFt: "980 – 1,150 sq.ft",
    avgPrice: "$235,000",
    features: "2 Bedrooms · 2 Baths · Kitchen · Living Room · Balcony",
    // Clean, scalable SVG path for 2 BHK flat icon (viewBox 0 0 52 32)
    svgPath: "M3 4h46a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 4v7h10V8H7zm14 0v7h10V8H21zm14 0v7h10V8H35zm-28 11v5h8v-5H7zm12 0v5h6v-5h-6zm10 0v5h12v-5H29z"
  },
  "3bhk": {
    id: "3bhk",
    label: "3 BHK Flats",
    shortLabel: "3 BHK",
    color: "#4a7c92", // Steel blue matching Altair sheep row
    areaSqFt: "1,450 – 1,720 sq.ft",
    avgPrice: "$360,000",
    features: "3 Bedrooms · 3 Baths · Modular Kitchen · Foyer · 2 Balconies",
    // Clean, scalable SVG path for 3 BHK flat icon (viewBox 0 0 52 32)
    svgPath: "M2 3h48a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm4 4v6h8V7H6zm12 0v6h8V7H18zm12 0v6h8V7H30zm12 0v6h6V7H42zm-36 10v7h6v-7H6zm10 0v7h10v-7H16zm14 0v7h10v-7H30zm14 0v7h6v-7H44z"
  }
};

const ISOTYPE_PROJECTS_DATA = [
  {
    id: "tower_a",
    name: "Tower A (Downtown)",
    units: [
      { type: "1bhk", count: 3 },
      { type: "2bhk", count: 2 },
      { type: "3bhk", count: 10 }
    ]
  },
  {
    id: "tower_b",
    name: "Tower B (Suburban)",
    units: [
      { type: "1bhk", count: 10 },
      { type: "2bhk", count: 6 },
      { type: "3bhk", count: 7 }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FLAT_TYPES, ISOTYPE_PROJECTS_DATA };
}
