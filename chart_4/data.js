/**
 * Dataset for Flourish Chord Diagram (Friends Interaction Matrix)
 * Exactly matching characters, colors, and chord ribbon proportions from the Flourish screenshot.
 */

const CHORD_DATA = {
  names: ["Phoebe", "Chandler", "Monica", "Ross", "Rachel", "Joey"],
  colors: [
    "#eab308", // Phoebe: Warm Yellow / Gold
    "#2563eb", // Chandler: Royal Blue
    "#0ea5e9", // Monica: Sky Blue
    "#8b5cf6", // Ross: Purple / Violet
    "#ec4899", // Rachel: Pink / Magenta
    "#f97316"  // Joey: Vibrant Orange
  ],
  // 6x6 Matrix of co-occurrences / shared scenes / dialogue exchanges
  matrix: [
    // Phoebe, Chandler, Monica, Ross, Rachel, Joey
    [   0,     430,     560,   640,    710,   750 ], // Phoebe
    [ 430,       0,    2480,   890,    940,  2180 ], // Chandler (huge with Monica & Joey!)
    [ 560,    2480,       0,  1120,   1280,  1020 ], // Monica (huge with Chandler!)
    [ 640,     890,    1120,     0,   2650,   870 ], // Ross (huge with Rachel!)
    [ 710,     940,    1280,  2650,      0,  1190 ], // Rachel (huge with Ross!)
    [ 750,    2180,    1020,   870,   1190,     0 ]  // Joey (huge with Chandler!)
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHORD_DATA;
}
