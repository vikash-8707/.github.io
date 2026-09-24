/**
 * US Energy Flow Data (2017 LLNL Energy Sankey Dataset)
 * Units: Quads (Quadrillion British Thermal Units)
 * Note: Features the exact 'Petroleum' -> 'Industrial' flow of 8.38 quads from Flourish v13.0.1.
 */

const ENERGY_SANKEY_DATA = {
  nodes: [
    // Source Energy (Left Column)
    { id: "Solar", name: "Solar", category: "source", color: "#eab308" },
    { id: "Nuclear", name: "Nuclear", category: "source", color: "#ef4444" },
    { id: "Hydro", name: "Hydro", category: "source", color: "#0ea5e9" },
    { id: "Wind", name: "Wind", category: "source", color: "#14b8a6" },
    { id: "Geothermal", name: "Geothermal", category: "source", color: "#d97706" },
    { id: "Natural Gas", name: "Natural Gas", category: "source", color: "#f97316" },
    { id: "Coal", name: "Coal", category: "source", color: "#64748b" },
    { id: "Biomass", name: "Biomass", category: "source", color: "#16a34a" },
    { id: "Petroleum", name: "Petroleum", category: "source", color: "#1d4ed8" }, // Flourish Blue
    { id: "Net Imports", name: "Net Imports", category: "source", color: "#94a3b8" },

    // Conversion & Intermediate (Middle Column)
    { id: "Electricity Generation", name: "Electricity Generation", category: "conversion", color: "#7dd3fc" },

    // End-Use Sectors (Middle-Right Column)
    { id: "Residential", name: "Residential", category: "sector", color: "#2dd4bf" },
    { id: "Commercial", name: "Commercial", category: "sector", color: "#a3e635" },
    { id: "Industrial", name: "Industrial", category: "sector", color: "#f43f5e" }, // Flourish Pink
    { id: "Transportation", name: "Transportation", category: "sector", color: "#c084fc" },

    // Final Outputs (Right Column)
    { id: "Rejected Energy", name: "Rejected Energy", category: "destination", color: "#fed7aa" }, // Sand/Tan
    { id: "Energy Services", name: "Energy Services", category: "destination", color: "#c7d2fe" }  // Lavender/Blue
  ],

  links: [
    // 1. Sources -> Electricity Generation
    { source: "Solar", target: "Electricity Generation", value: 0.50 },
    { source: "Nuclear", target: "Electricity Generation", value: 8.42 },
    { source: "Hydro", target: "Electricity Generation", value: 2.77 },
    { source: "Wind", target: "Electricity Generation", value: 2.35 },
    { source: "Geothermal", target: "Electricity Generation", value: 0.16 },
    { source: "Natural Gas", target: "Electricity Generation", value: 9.54 },
    { source: "Coal", target: "Electricity Generation", value: 12.70 },
    { source: "Biomass", target: "Electricity Generation", value: 0.52 },
    { source: "Petroleum", target: "Electricity Generation", value: 0.28 },
    { source: "Net Imports", target: "Electricity Generation", value: 0.14 },

    // 2. Sources -> Direct End-Use Sectors
    { source: "Solar", target: "Residential", value: 0.17 },
    { source: "Solar", target: "Commercial", value: 0.05 },
    { source: "Solar", target: "Industrial", value: 0.02 },

    { source: "Geothermal", target: "Residential", value: 0.04 },
    { source: "Geothermal", target: "Commercial", value: 0.02 },
    { source: "Geothermal", target: "Industrial", value: 0.01 },

    { source: "Natural Gas", target: "Residential", value: 4.88 },
    { source: "Natural Gas", target: "Commercial", value: 3.47 },
    { source: "Natural Gas", target: "Industrial", value: 9.77 },
    { source: "Natural Gas", target: "Transportation", value: 0.86 },

    { source: "Coal", target: "Commercial", value: 0.04 },
    { source: "Coal", target: "Industrial", value: 1.25 },

    { source: "Biomass", target: "Residential", value: 0.51 },
    { source: "Biomass", target: "Commercial", value: 0.14 },
    { source: "Biomass", target: "Industrial", value: 2.45 },
    { source: "Biomass", target: "Transportation", value: 1.37 },

    // PETROLEUM FLOWS (Highlight: Petroleum -> Industrial = 8.38)
    { source: "Petroleum", target: "Residential", value: 0.94 },
    { source: "Petroleum", target: "Commercial", value: 0.61 },
    { source: "Petroleum", target: "Industrial", value: 8.38 }, // Primary focus flow
    { source: "Petroleum", target: "Transportation", value: 25.80 },

    // 3. Electricity Generation -> Sectors & Losses
    { source: "Electricity Generation", target: "Residential", value: 4.67 },
    { source: "Electricity Generation", target: "Commercial", value: 4.63 },
    { source: "Electricity Generation", target: "Industrial", value: 3.32 },
    { source: "Electricity Generation", target: "Transportation", value: 0.03 },
    { source: "Electricity Generation", target: "Rejected Energy", value: 24.73 },

    // 4. End-Use Sectors -> Final Destinations
    { source: "Residential", target: "Rejected Energy", value: 3.30 },
    { source: "Residential", target: "Energy Services", value: 7.91 },

    { source: "Commercial", target: "Rejected Energy", value: 3.03 },
    { source: "Commercial", target: "Energy Services", value: 5.93 },

    { source: "Industrial", target: "Rejected Energy", value: 5.05 },
    { source: "Industrial", target: "Energy Services", value: 20.15 },

    { source: "Transportation", target: "Rejected Energy", value: 22.50 },
    { source: "Transportation", target: "Energy Services", value: 5.56 }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ENERGY_SANKEY_DATA };
}
