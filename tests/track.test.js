import { describe, it, assertTrue, assertApprox } from '../src/test-runner.js';
import { generateTrack, generateValidTrack } from '../src/track.js';
import { CONFIG } from '../src/config.js';

describe('track.generateTrack', () => {
  it('is deterministic for the same seed', () => {
    const a = generateTrack(12345);
    const b = generateTrack(12345);
    assertApprox(a.centerline[0].x, b.centerline[0].x, 1e-9);
    assertApprox(a.centerline[10].y, b.centerline[10].y, 1e-9);
  });

  it('width is wide at start/end and narrow mid-lap', () => {
    const t = generateTrack(42);
    assertApprox(t.widthAt(0), CONFIG.widthStart, 1);
    assertApprox(t.widthAt(1 - 1e-9), CONFIG.widthStart, 1);
    assertApprox(t.widthAt(0.5), CONFIG.widthEnd, 1);
    assertTrue(t.widthAt(0.5) < t.widthAt(0.1),
      `mid (${t.widthAt(0.5)}) should be narrower than near start (${t.widthAt(0.1)})`);
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

describe('track.generateValidTrack', () => {
  it('returns a track within attempt budget', () => {
    let seedCounter = 1;
    const t = generateValidTrack(() => seedCounter++, 80);
    assertTrue(t !== null, 'should find a valid track');
    assertTrue(t.valid === true);
  });

  it('returned track has no offset-polygon cusps', () => {
    let seedCounter = 100;
    const t = generateValidTrack(() => seedCounter++, 80);
    assertTrue(t !== null);
    const cl = t.centerline;
    for (let i = 0; i < cl.length; i++) {
      const j = (i + 1) % cl.length;
      const tx = cl[i].tx, ty = cl[i].ty;
      const dix = t.inner[j].x - t.inner[i].x;
      const diy = t.inner[j].y - t.inner[i].y;
      const dox = t.outer[j].x - t.outer[i].x;
      const doy = t.outer[j].y - t.outer[i].y;
      assertTrue(dix * tx + diy * ty > 0, `inner cusp at ${i}`);
      assertTrue(dox * tx + doy * ty > 0, `outer cusp at ${i}`);
    }
  });
});
