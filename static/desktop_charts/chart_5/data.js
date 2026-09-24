/**
 * US Migration by World Region (1820-2009)
 * Historical immigration statistics matching the PlotSet stacked area visualization.
 * Numbers recorded by decade (e.g. 1905 = 1900-1910 decade total in millions).
 */

const CATEGORIES = [
  // Europe (Blues & Teals)
  { id: "austria_hungary", label: "Austria-Hungary", region: "Europe", color: "#2575a7" },
  { id: "germany", label: "Germany", region: "Europe", color: "#1b4363" },
  { id: "ireland", label: "Ireland", region: "Europe", color: "#3182bd" },
  { id: "italy", label: "Italy", region: "Europe", color: "#42a5b8" },
  { id: "russia", label: "Russia", region: "Europe", color: "#22707e" },
  { id: "norway_sweden", label: "Norway and Sweden", region: "Europe", color: "#6baed6" },
  { id: "uk", label: "United Kingdom", region: "Europe", color: "#1a506b" },
  { id: "rest_europe", label: "Rest of Europe", region: "Europe", color: "#2b8cbe" },

  // Asia (Reds, Corals & Oranges)
  { id: "china", label: "China", region: "Asia", color: "#b91c1c" },
  { id: "india", label: "India", region: "Asia", color: "#c2410c" },
  { id: "philippines", label: "Philippines", region: "Asia", color: "#e11d48" },
  { id: "rest_asia", label: "Rest of Asia", region: "Asia", color: "#ea580c" },

  // Americas (Golds, Yellows & Peaches)
  { id: "canada", label: "Canada and Newfoundland", region: "Americas", color: "#f97316" },
  { id: "mexico", label: "Mexico", region: "Americas", color: "#f59e0b" },
  { id: "caribbean", label: "Caribbean", region: "Americas", color: "#fbbf24" },
  { id: "rest_america", label: "Rest of America", region: "Americas", color: "#fde68a" },
  { id: "central_america", label: "Central America", region: "Americas", color: "#fdba74" },
  { id: "south_america", label: "South America", region: "Americas", color: "#fed7aa" },

  // Others (Greens & Dark)
  { id: "africa", label: "Africa", region: "Africa", color: "#059669" },
  { id: "oceania", label: "Oceania", region: "Oceania", color: "#155e75" },
  { id: "not_specified", label: "Not Specified", region: "Other", color: "#1f2937" }
];

// Historical immigration data points (in millions)
const MIGRATION_DATA = [
  { year: 1825, uk: 0.05, ireland: 0.06, germany: 0.01, rest_europe: 0.02 },
  { year: 1830, uk: 0.08, ireland: 0.12, germany: 0.04, rest_europe: 0.04 },
  { year: 1835, uk: 0.12, ireland: 0.22, germany: 0.11, rest_europe: 0.06, canada: 0.02 },
  { year: 1840, uk: 0.18, ireland: 0.38, germany: 0.18, rest_europe: 0.08, canada: 0.04 },
  { year: 1845, uk: 0.28, ireland: 0.65, germany: 0.35, rest_europe: 0.12, canada: 0.06 },
  { year: 1850, uk: 0.37, ireland: 1.02, germany: 0.72, norway_sweden: 0.04, rest_europe: 0.16, canada: 0.08 },
  { year: 1855, uk: 0.42, ireland: 1.15, germany: 0.95, norway_sweden: 0.06, rest_europe: 0.18, canada: 0.09, china: 0.04 },
  { year: 1860, uk: 0.35, ireland: 0.88, germany: 0.78, norway_sweden: 0.05, rest_europe: 0.14, canada: 0.07, china: 0.04 },
  { year: 1865, uk: 0.32, ireland: 0.72, germany: 0.64, norway_sweden: 0.06, rest_europe: 0.12, canada: 0.08, china: 0.05 },
  { year: 1870, uk: 0.48, ireland: 0.68, germany: 0.82, norway_sweden: 0.14, rest_europe: 0.19, canada: 0.14, china: 0.06 },
  { year: 1875, uk: 0.54, ireland: 0.58, germany: 0.78, norway_sweden: 0.16, rest_europe: 0.22, canada: 0.18, china: 0.08 },
  { year: 1880, uk: 0.68, ireland: 0.65, germany: 1.12, norway_sweden: 0.29, austria_hungary: 0.12, italy: 0.08, russia: 0.06, rest_europe: 0.32, canada: 0.28, china: 0.11 },
  { year: 1885, uk: 0.82, ireland: 0.72, germany: 1.45, norway_sweden: 0.42, austria_hungary: 0.22, italy: 0.16, russia: 0.14, rest_europe: 0.42, canada: 0.38, china: 0.08 },
  { year: 1890, uk: 0.81, ireland: 0.65, germany: 1.42, norway_sweden: 0.48, austria_hungary: 0.35, italy: 0.31, russia: 0.26, rest_europe: 0.48, canada: 0.42, china: 0.03 },
  { year: 1895, uk: 0.52, ireland: 0.48, germany: 0.88, norway_sweden: 0.36, austria_hungary: 0.48, italy: 0.52, russia: 0.44, rest_europe: 0.42, canada: 0.32 },
  { year: 1900, uk: 0.38, ireland: 0.34, germany: 0.52, norway_sweden: 0.26, austria_hungary: 0.72, italy: 0.92, russia: 0.68, rest_europe: 0.44, canada: 0.24, mexico: 0.04, rest_asia: 0.06 },
  { year: 1905, uk: 0.42, ireland: 0.32, germany: 0.36, norway_sweden: 0.22, austria_hungary: 1.82, italy: 1.74, russia: 1.38, rest_europe: 0.72, canada: 0.32, mexico: 0.08, caribbean: 0.03, rest_asia: 0.19 },
  { year: 1910, uk: 0.40, ireland: 0.28, germany: 0.30, norway_sweden: 0.18, austria_hungary: 1.70, italy: 1.62, russia: 1.25, rest_europe: 0.65, canada: 0.36, mexico: 0.15, caribbean: 0.05, rest_asia: 0.16 },
  { year: 1915, uk: 0.38, ireland: 0.22, germany: 0.18, norway_sweden: 0.12, austria_hungary: 0.95, italy: 1.05, russia: 0.78, rest_europe: 0.48, canada: 0.52, mexico: 0.22, caribbean: 0.05 },
  { year: 1920, uk: 0.28, ireland: 0.16, germany: 0.14, norway_sweden: 0.08, austria_hungary: 0.42, italy: 0.65, russia: 0.34, rest_europe: 0.36, canada: 0.68, mexico: 0.38, caribbean: 0.06 },
  { year: 1925, uk: 0.34, ireland: 0.21, germany: 0.38, norway_sweden: 0.09, austria_hungary: 0.12, italy: 0.38, russia: 0.08, rest_europe: 0.28, canada: 0.92, mexico: 0.49, caribbean: 0.08 },
  { year: 1930, uk: 0.22, ireland: 0.12, germany: 0.24, norway_sweden: 0.05, austria_hungary: 0.06, italy: 0.18, russia: 0.04, rest_europe: 0.16, canada: 0.62, mexico: 0.32, caribbean: 0.05 },
  { year: 1935, uk: 0.08, ireland: 0.04, germany: 0.12, norway_sweden: 0.02, austria_hungary: 0.02, italy: 0.06, russia: 0.01, rest_europe: 0.08, canada: 0.18, mexico: 0.06, caribbean: 0.02 },
  { year: 1940, uk: 0.05, ireland: 0.02, germany: 0.14, norway_sweden: 0.01, austria_hungary: 0.02, italy: 0.04, russia: 0.01, rest_europe: 0.08, canada: 0.14, mexico: 0.05, caribbean: 0.02 },
  { year: 1945, uk: 0.09, ireland: 0.03, germany: 0.08, norway_sweden: 0.01, rest_europe: 0.12, canada: 0.16, mexico: 0.08, caribbean: 0.03, china: 0.02 },
  { year: 1950, uk: 0.18, ireland: 0.05, germany: 0.38, italy: 0.14, rest_europe: 0.34, canada: 0.25, mexico: 0.14, caribbean: 0.05, china: 0.03 },
  { year: 1955, uk: 0.22, ireland: 0.06, germany: 0.48, italy: 0.19, rest_europe: 0.42, canada: 0.38, mexico: 0.28, caribbean: 0.09, china: 0.04, philippines: 0.03 },
  { year: 1960, uk: 0.21, ireland: 0.05, germany: 0.42, italy: 0.18, rest_europe: 0.38, canada: 0.42, mexico: 0.34, caribbean: 0.14, china: 0.05, philippines: 0.04 },
  { year: 1965, uk: 0.23, ireland: 0.04, germany: 0.32, italy: 0.21, rest_europe: 0.35, canada: 0.39, mexico: 0.46, caribbean: 0.32, china: 0.08, philippines: 0.08, india: 0.03, south_america: 0.09 },
  { year: 1970, uk: 0.18, germany: 0.19, italy: 0.18, rest_europe: 0.32, canada: 0.32, mexico: 0.58, caribbean: 0.52, central_america: 0.12, south_america: 0.18, china: 0.14, philippines: 0.21, india: 0.08, rest_asia: 0.22, africa: 0.04 },
  { year: 1975, uk: 0.14, germany: 0.14, italy: 0.12, rest_europe: 0.28, canada: 0.22, mexico: 0.82, caribbean: 0.68, central_america: 0.18, south_america: 0.24, china: 0.18, philippines: 0.31, india: 0.14, rest_asia: 0.38, africa: 0.07 },
  { year: 1980, uk: 0.12, germany: 0.09, rest_europe: 0.26, canada: 0.18, mexico: 1.15, caribbean: 0.84, rest_america: 0.12, central_america: 0.28, south_america: 0.32, china: 0.28, philippines: 0.42, india: 0.22, rest_asia: 0.58, africa: 0.11, oceania: 0.04 },
  { year: 1985, uk: 0.11, germany: 0.08, rest_europe: 0.24, canada: 0.15, mexico: 1.65, caribbean: 0.98, rest_america: 0.18, central_america: 0.42, south_america: 0.41, china: 0.38, philippines: 0.51, india: 0.28, rest_asia: 0.72, africa: 0.16, oceania: 0.04 },
  { year: 1990, uk: 0.14, germany: 0.09, russia: 0.18, rest_europe: 0.32, canada: 0.22, mexico: 2.35, caribbean: 1.18, rest_america: 0.22, central_america: 0.62, south_america: 0.58, china: 0.48, philippines: 0.56, india: 0.36, rest_asia: 0.92, africa: 0.24, oceania: 0.05, not_specified: 0.08 },
  { year: 1995, uk: 0.12, germany: 0.08, russia: 0.26, rest_europe: 0.38, canada: 0.24, mexico: 2.75, caribbean: 1.42, rest_america: 0.28, central_america: 0.78, south_america: 0.72, china: 0.62, philippines: 0.65, india: 0.52, rest_asia: 1.18, africa: 0.42, oceania: 0.06, not_specified: 0.10 },
  { year: 2000, uk: 0.14, germany: 0.07, russia: 0.32, rest_europe: 0.44, canada: 0.25, mexico: 2.85, caribbean: 1.55, rest_america: 0.32, central_america: 0.86, south_america: 0.82, china: 0.74, philippines: 0.70, india: 0.68, rest_asia: 1.32, africa: 0.58, oceania: 0.07, not_specified: 0.12 },
  { year: 2005, uk: 0.16, germany: 0.06, russia: 0.30, rest_europe: 0.46, canada: 0.26, mexico: 2.92, caribbean: 1.62, rest_america: 0.35, central_america: 0.94, south_america: 0.92, china: 0.82, philippines: 0.74, india: 0.78, rest_asia: 1.45, africa: 0.72, oceania: 0.08, not_specified: 0.15 }
];

// Normalize data points so every category key has a default 0
MIGRATION_DATA.forEach(row => {
  CATEGORIES.forEach(cat => {
    if (row[cat.id] === undefined) {
      row[cat.id] = 0;
    }
  });
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATEGORIES, MIGRATION_DATA };
}
