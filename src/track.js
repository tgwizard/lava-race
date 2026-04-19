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
    const clamped = ((s % 1) + 1) % 1;
    const eased = clamped * clamped;
    return CONFIG.widthStart + (CONFIG.widthEnd - CONFIG.widthStart) * eased;
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
