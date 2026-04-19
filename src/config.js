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
  // Elliptical base fills the 16:10 world; more control points and wider
  // jitter give longer, more varied tracks (chicanes, long straights).
  controlPoints: 14,
  baseRadiusX: 680,   // max extent: 680 + widthStart/2 ≤ world/2 − margin
  baseRadiusY: 380,
  radiusJitter: [0.82, 1.0],
  angularJitter: 0.08,         // radians
  widthStart: 160,
  widthEnd: 70,
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
