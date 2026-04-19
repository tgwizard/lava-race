export const CONFIG = {
  // Logical drawing resolution. The canvas is letterboxed to fit the viewport.
  world: { width: 1600, height: 1000 },

  // Car physics
  thrustAccel: 600,       // px/s^2
  brakeAccel: 900,        // px/s^2
  reverseCap: -150,       // px/s, slow backup speed
  drag: 0.6,              // per second (exponential-ish)
  baseTurn: 3.5,          // rad/s at speed=0
  speedTurnPenalty: 0.004, // turnRate = baseTurn / (1 + speed*penalty)

  // Track generation
  // Control points are placed around an ellipse and each is pulled toward the
  // INNER band or pushed to the OUTER band. The inner/outer pattern is
  // randomized (with a cap on consecutive runs) and the control-point count
  // varies per seed — so every track has a different lobe count and shape
  // rather than the same symmetric star.
  controlPointsRange: [8, 13],  // inclusive; picked per track
  maxRunLength: 2,              // no more than N inner-or-outer in a row
  baseRadiusX: 680,             // max: 680 + widthStart/2 ≤ world/2 − margin
  baseRadiusY: 400,
  innerBand: [0.45, 0.78],      // multipliers for inner points
  outerBand: [0.85, 1.0],       // multipliers for outer points
  angularJitter: 0.22,          // radians — bigger jitter = less symmetric
  widthStart: 150,              // "wide" width on straights
  widthEnd: 95,                 // "narrow" width in the middle of the lap
  // Track also auto-narrows at sharp corners so offset polygons don't cusp.
  checkpointCount: 6,
  lapsToWin: 3,

  // Respawn
  respawnFreezeMs: 500,

  // Colors
  colors: {
    bg: '#07060a',
    trackFill: '#15121a',
    trackEdge: '#ff8a3d',
    lavaA: '#ff3d00',
    lavaB: '#ffd000',
    centerlineDash: 'rgba(255, 220, 140, 0.25)',
    red: '#ff2a6d',
    blue: '#05d9ff',
    hud: '#e8e8ff',
  },
};
