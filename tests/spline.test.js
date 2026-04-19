import { describe, it, assertApprox, assertTrue } from '../src/test-runner.js';
import { sampleClosedSpline } from '../src/spline.js';

describe('spline', () => {
  function circlePoints(n, r = 100) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return pts;
  }

  it('returns a polyline whose closing segment loops back to start', () => {
    const pts = sampleClosedSpline(circlePoints(8), 20);
    assertTrue(pts.length >= 160);
    // last point + its tangent to the first should be short compared to perimeter
    const last = pts[pts.length - 1];
    const first = pts[0];
    const gap = Math.hypot(first.x - last.x, first.y - last.y);
    assertTrue(gap < pts[0].perimeter / 10, `closing gap ${gap} too large`);
  });

  it('tangents exist and have unit length', () => {
    const pts = sampleClosedSpline(circlePoints(10), 30);
    for (let i = 0; i < pts.length; i += 30) {
      const mag = Math.hypot(pts[i].tx, pts[i].ty);
      assertApprox(mag, 1, 1e-3, `non-unit tangent at ${i}`);
    }
  });

  it('produces tangent angles that rotate a full 2π around a convex loop', () => {
    const pts = sampleClosedSpline(circlePoints(12), 30);
    let total = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(pts[i].ty, pts[i].tx);
      const b = Math.atan2(pts[(i + 1) % n].ty, pts[(i + 1) % n].tx);
      let d = b - a;
      while (d > Math.PI) d -= 2*Math.PI;
      while (d < -Math.PI) d += 2*Math.PI;
      total += d;
    }
    assertApprox(total, 2*Math.PI, 0.05);
  });
});
