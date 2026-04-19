// Closed Catmull-Rom spline → dense polyline, with per-sample tangent.
// Returns [{x, y, tx, ty, cumulative, perimeter}] where (tx,ty) is a unit tangent,
// and cumulative is arc length from sample 0.

export function sampleClosedSpline(points, samplesPerSegment = 20) {
  const n = points.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      out.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  // Tangents and arc-length (closing segment wraps via modulo).
  let cum = 0;
  for (let i = 0; i < out.length; i++) {
    const next = out[(i + 1) % out.length];
    const dx = next.x - out[i].x;
    const dy = next.y - out[i].y;
    const len = Math.hypot(dx, dy) || 1;
    out[i].tx = dx / len;
    out[i].ty = dy / len;
    out[i].cumulative = cum;
    cum += len;
  }
  for (const p of out) p.perimeter = cum;
  return out;
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * t +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
  );
  const y = 0.5 * (
    (2 * p1.y) +
    (-p0.y + p2.y) * t +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  );
  return { x, y };
}
