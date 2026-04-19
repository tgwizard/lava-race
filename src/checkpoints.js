export function createProgress() {
  // Car spawns on the start line (checkpoint 0), so "next expected" is 1.
  // `started: true` so crossing 0 after a full lap increments lapCount.
  return { lastCheckpoint: 0, lapCount: 0, started: true };
}

export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = sign((dx - cx) * (ay - cy) - (dy - cy) * (ax - cx));
  const d2 = sign((dx - cx) * (by - cy) - (dy - cy) * (bx - cx));
  const d3 = sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
  const d4 = sign((bx - ax) * (dy - ay) - (by - ay) * (dx - ax));
  if (d1 !== d2 && d3 !== d4 && d1 !== 0 && d2 !== 0 && d3 !== 0 && d4 !== 0) return true;
  return false;
}
function sign(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }

export function updateProgress(progress, checkpoints, count, from, to) {
  const nextIdx = (progress.lastCheckpoint + 1) % count;
  const cp = checkpoints[nextIdx];
  if (segmentsIntersect(from.x, from.y, to.x, to.y, cp.ax, cp.ay, cp.bx, cp.by)) {
    progress.lastCheckpoint = nextIdx;
    if (nextIdx === 0 && progress.started) {
      progress.lapCount += 1;
    }
    progress.started = true;
  }
}
