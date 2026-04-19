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
  // Control points alternate between an INNER band and an OUTER band of an
  // ellipse. The spline smooths through alternating in/out points, creating
  // inflection points (S-curves) — driving the loop forces you to turn both
  // ways rather than riding one continuous arc.
  controlPoints: 10,            // 5 in/out pairs → 5 lobes; fewer points
                                //   give each lobe more arc length to resolve.
  baseRadiusX: 680,             // max: 680 + widthStart/2 ≤ world/2 − margin
  baseRadiusY: 400,
  innerBand: [0.55, 0.75],      // multipliers for even-index "inner" points
  outerBand: [0.88, 1.0],       // multipliers for odd-index "outer" points
  angularJitter: 0.1,           // radians
  widthStart: 150,              // "wide" width on straights
  widthEnd: 75,                 // "narrow" width in the middle of the lap
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
