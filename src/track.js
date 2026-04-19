import { CONFIG } from './config.js';
import { mulberry32 } from './rng.js';
import { sampleClosedSpline } from './spline.js';

export function generateTrack(seed) {
  const rnd = mulberry32(seed);
  const cx = CONFIG.world.width / 2;
  const cy = CONFIG.world.height / 2;
  const [nMin, nMax] = CONFIG.controlPointsRange;
  const n = nMin + Math.floor(rnd() * (nMax - nMin + 1));
  const [innerMin, innerMax] = CONFIG.innerBand;
  const [outerMin, outerMax] = CONFIG.outerBand;

  // Assign each point inner-or-outer randomly. Cap the run length so the
  // centerline still threads through inflection points (S-curves) rather
  // than bulging in one direction for too long. We force the last point to
  // differ from the first so the closed loop doesn't get a long same-kind
  // run spanning the seam.
  const kinds = new Array(n);
  let run = 0;
  let prev = rnd() < 0.5 ? 0 : 1;
  kinds[0] = prev;
  for (let i = 1; i < n; i++) {
    const forceFlip = run >= CONFIG.maxRunLength;
    const k = forceFlip ? 1 - prev : (rnd() < 0.5 ? 0 : 1);
    kinds[i] = k;
    run = k === prev ? run + 1 : 1;
    prev = k;
  }
  if (kinds[n - 1] === kinds[0]) kinds[n - 1] = 1 - kinds[0];

  const controls = [];
  for (let i = 0; i < n; i++) {
    const baseA = (i / n) * Math.PI * 2;
    const a = baseA + (rnd() - 0.5) * 2 * CONFIG.angularJitter;
    const outer = kinds[i] === 1;
    const lo = outer ? outerMin : innerMin;
    const hi = outer ? outerMax : innerMax;
    const jitter = lo + rnd() * (hi - lo);
    const rx = CONFIG.baseRadiusX * jitter;
    const ry = CONFIG.baseRadiusY * jitter;
    controls.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
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

  // Target widths from the profile; we'll shrink them below wherever offset
  // polygons would cusp.
  const N = centerline.length;
  const widths = new Array(N);
  for (let i = 0; i < N; i++) {
    widths[i] = widthAt(centerline[i].cumulative / perimeter);
  }

  // Iteratively detect offset-segment reversal ("cusp" on inner or outer) and
  // shrink widths around the bad spot until no segment reverses. The window
  // spreads the width reduction across several samples so the track tapers
  // smoothly into a tight corner instead of popping.
  const SHRINK = 0.82;
  const WINDOW = 3;
  const MAX_ITERS = 60;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    let anyBad = false;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const p  = centerline[i],  q  = centerline[j];
      const wi = widths[i] / 2, wj = widths[j] / 2;
      const nix = -p.ty, niy = p.tx;
      const njx = -q.ty, njy = q.tx;

      const innerDx = (q.x - njx * wj) - (p.x - nix * wi);
      const innerDy = (q.y - njy * wj) - (p.y - niy * wi);
      const outerDx = (q.x + njx * wj) - (p.x + nix * wi);
      const outerDy = (q.y + njy * wj) - (p.y + niy * wi);
      const cx = q.x - p.x, cy = q.y - p.y;
      const centerDot = cx * p.tx + cy * p.ty;
      const minDot = centerDot * 0.65;

      if (innerDx * p.tx + innerDy * p.ty < minDot ||
          outerDx * p.tx + outerDy * p.ty < minDot) {
        for (let k = -WINDOW; k <= WINDOW; k++) {
          widths[(i + k + N) % N] *= SHRINK;
        }
        anyBad = true;
      }
    }
    if (!anyBad) break;
  }

  // Clamp to a sensible lower bound and smooth with a small running min
  // so transitions aren't jagged.
  const floor = Math.max(24, CONFIG.widthEnd * 0.4);
  for (let i = 0; i < N; i++) widths[i] = Math.max(widths[i], floor);
  const smoothed = new Array(N);
  const WIN = 3;
  for (let i = 0; i < N; i++) {
    let m = Infinity;
    for (let k = -WIN; k <= WIN; k++) m = Math.min(m, widths[(i + k + N) % N]);
    smoothed[i] = m;
  }
  for (let i = 0; i < N; i++) widths[i] = smoothed[i];
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

// Returns array of checkpoint line segments across the track at evenly-spaced
// arc-length positions. Checkpoint 0 is the start/finish line.
export function generateCheckpoints(track, count = CONFIG.checkpointCount) {
  const cps = [];
  const cl = track.centerline;
  for (let k = 0; k < count; k++) {
    const targetCum = (k / count) * track.perimeter;
    let i = 0;
    while (i < cl.length - 1 && cl[i + 1].cumulative < targetCum) i++;
    const p = cl[i];
    const w = track.widths[i] / 2;
    const nx = -p.ty, ny = p.tx;
    cps.push({
      ax: p.x - nx * w, ay: p.y - ny * w,
      bx: p.x + nx * w, by: p.y + ny * w,
      midX: p.x, midY: p.y,
      angle: Math.atan2(p.ty, p.tx),
    });
  }
  return cps;
}

// Build a small offscreen canvas where TRACK pixels are opaque white and
// LAVA is transparent. Used only for pixel lookups — NOT for rendering.
export function buildTrackMask(track, scale = 0.5) {
  const w = Math.ceil(CONFIG.world.width * scale);
  const h = Math.ceil(CONFIG.world.height * scale);
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext('2d');
  mctx.clearRect(0, 0, w, h);
  mctx.fillStyle = '#fff';
  mctx.beginPath();
  mctx.moveTo(track.outer[0].x * scale, track.outer[0].y * scale);
  for (const p of track.outer) mctx.lineTo(p.x * scale, p.y * scale);
  mctx.closePath();
  mctx.moveTo(track.inner[0].x * scale, track.inner[0].y * scale);
  for (let i = track.inner.length - 1; i >= 0; i--) {
    mctx.lineTo(track.inner[i].x * scale, track.inner[i].y * scale);
  }
  mctx.closePath();
  mctx.fill('evenodd');
  // Cache full image data once for fast lookup.
  const imageData = mctx.getImageData(0, 0, w, h);
  return { canvas: mask, ctx: mctx, data: imageData.data, width: w, height: h, scale };
}
