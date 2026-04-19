import { CONFIG } from './config.js';
import { mulberry32 } from './rng.js';
import { sampleClosedSpline } from './spline.js';

export function generateTrack(seed) {
  const rnd = mulberry32(seed);
  const cx = CONFIG.world.width / 2;
  const cy = CONFIG.world.height / 2;
  const n = CONFIG.controlPoints;
  const [rMin, rMax] = CONFIG.radiusJitter;

  const controls = [];
  for (let i = 0; i < n; i++) {
    const baseA = (i / n) * Math.PI * 2;
    const a = baseA + (rnd() - 0.5) * 2 * CONFIG.angularJitter;
    const r = CONFIG.baseRadius * (rMin + rnd() * (rMax - rMin));
    controls.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }

  const centerline = sampleClosedSpline(controls, 24);
  const perimeter = centerline[0].perimeter;

  function widthAt(s) {
    // Smooth "peanut" profile: wide at s=0 and s=1, narrow near s=0.5.
    // sin(π·s)² is 0 at endpoints and 1 at the middle.
    const clamped = ((s % 1) + 1) % 1;
    const t = Math.sin(Math.PI * clamped);
    const tightness = t * t;
    return CONFIG.widthStart + (CONFIG.widthEnd - CONFIG.widthStart) * tightness;
  }

  const widths = centerline.map(p => widthAt(p.cumulative / perimeter));
  const inner = [];
  const outer = [];
  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    const nx = -p.ty, ny = p.tx;
    const w = widths[i] / 2;
    inner.push({ x: p.x - nx * w, y: p.y - ny * w });
    outer.push({ x: p.x + nx * w, y: p.y + ny * w });
  }

  return {
    seed,
    controls,
    centerline,
    inner,
    outer,
    widths,
    perimeter,
    widthAt,
  };
}

export function validateTrack(track) {
  const cl = track.centerline;

  // (1) World bounds: centerline and both offset polygons must stay inside.
  const margin = 20;
  const W = CONFIG.world.width, H = CONFIG.world.height;
  for (let i = 0; i < cl.length; i++) {
    const a = cl[i], inn = track.inner[i], out = track.outer[i];
    for (const p of [a, inn, out]) {
      if (p.x < margin || p.y < margin || p.x > W - margin || p.y > H - margin) return false;
    }
  }

  // (2) No cusps: the offset polygon must not fold back relative to the centerline tangent.
  for (let i = 0; i < cl.length; i++) {
    const j = (i + 1) % cl.length;
    const tx = cl[i].tx, ty = cl[i].ty;
    const dix = track.inner[j].x - track.inner[i].x;
    const diy = track.inner[j].y - track.inner[i].y;
    const dox = track.outer[j].x - track.outer[i].x;
    const doy = track.outer[j].y - track.outer[i].y;
    if (dix * tx + diy * ty <= 0) return false;
    if (dox * tx + doy * ty <= 0) return false;
  }

  // (3) Non-adjacent centerline points must be far enough apart that their
  // offset strips don't touch. Minimum distance = mean of their widths, +5%.
  const STEP = 4;
  const SKIP = 28;
  for (let i = 0; i < cl.length; i += STEP) {
    for (let j = i + SKIP; j < cl.length - SKIP; j += STEP) {
      const dx = cl[i].x - cl[j].x;
      const dy = cl[i].y - cl[j].y;
      const minSep = (track.widths[i] + track.widths[j]) * 0.5 * 1.05;
      if (dx*dx + dy*dy < minSep * minSep) return false;
    }
  }

  return true;
}

function defaultSeedSource() {
  return (Math.random() * 2 ** 32) >>> 0;
}

export function generateValidTrack(seedSource = defaultSeedSource, maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    const seed = seedSource();
    const t = generateTrack(seed);
    if (validateTrack(t)) {
      t.valid = true;
      return t;
    }
  }
  return null;
}
