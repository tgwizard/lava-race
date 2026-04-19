import { describe, it, assertTrue, assertApprox } from '../src/test-runner.js';
import { generateTrack } from '../src/track.js';
import { CONFIG } from '../src/config.js';

describe('track.generateTrack', () => {
  it('is deterministic for the same seed', () => {
    const a = generateTrack(12345);
    const b = generateTrack(12345);
    assertApprox(a.centerline[0].x, b.centerline[0].x, 1e-9);
    assertApprox(a.centerline[10].y, b.centerline[10].y, 1e-9);
  });

  it('width starts wide and ends narrow', () => {
    const t = generateTrack(42);
    assertTrue(t.widthAt(0) > t.widthAt(0.95),
      `wide at start (${t.widthAt(0)}) should exceed narrow near end (${t.widthAt(0.95)})`);
    assertApprox(t.widthAt(0), CONFIG.widthStart, 1);
    assertApprox(t.widthAt(1 - 1e-6), CONFIG.widthEnd, 1);
  });

  it('inner and outer polygons have the same number of points as centerline', () => {
    const t = generateTrack(7);
    assertTrue(t.inner.length === t.centerline.length);
    assertTrue(t.outer.length === t.centerline.length);
  });

  it('a centerline sample lies equidistant from inner and outer at same index', () => {
    const t = generateTrack(7);
    for (let i = 0; i < t.centerline.length; i += 50) {
      const c = t.centerline[i], inn = t.inner[i], out = t.outer[i];
      const d1 = Math.hypot(c.x - inn.x, c.y - inn.y);
      const d2 = Math.hypot(c.x - out.x, c.y - out.y);
      assertApprox(d1, d2, 1e-3, `symmetry at ${i}`);
    }
  });
});
