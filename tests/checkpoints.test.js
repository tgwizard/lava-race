import { describe, it, assertEqual, assertTrue } from '../src/test-runner.js';
import { generateValidTrack, generateCheckpoints } from '../src/track.js';
import { segmentsIntersect, updateProgress, createProgress } from '../src/checkpoints.js';

describe('checkpoints.segmentsIntersect', () => {
  it('detects a clear crossing', () => {
    assertTrue(segmentsIntersect(0, 0, 10, 10, 0, 10, 10, 0));
  });
  it('rejects non-crossing segments', () => {
    assertTrue(!segmentsIntersect(0, 0, 1, 0, 0, 1, 1, 1));
  });
  it('handles touching endpoints as non-crossing', () => {
    assertTrue(!segmentsIntersect(0, 0, 1, 0, 1, 0, 2, 0));
  });
});

describe('checkpoints.updateProgress', () => {
  let seedCounter = 4242;
  const track = generateValidTrack(() => seedCounter++, 80);
  const cps = generateCheckpoints(track, 12);

  it('advances across a crossing that intersects next checkpoint', () => {
    const p = createProgress();
    const cp1 = cps[1];
    // Synthesize an explicit crossing: a line perpendicular to the checkpoint segment.
    const midX = (cp1.ax + cp1.bx) / 2;
    const midY = (cp1.ay + cp1.by) / 2;
    const dx = cp1.bx - cp1.ax, dy = cp1.by - cp1.ay;
    const nx = -dy, ny = dx; // perpendicular
    const mag = Math.hypot(nx, ny);
    const ux = nx / mag, uy = ny / mag;
    const K = 50;
    const before = { x: midX - ux * K, y: midY - uy * K };
    const after  = { x: midX + ux * K, y: midY + uy * K };

    // First ensure updateProgress starts at -1 so next = 0 — pass 0 check first.
    p.lastCheckpoint = 0;
    p.started = true;
    updateProgress(p, cps, 12, before, after);
    assertEqual(p.lastCheckpoint, 1);
  });

  it('ignores out-of-order crossings', () => {
    const p = createProgress();
    p.lastCheckpoint = 3;
    updateProgress(p, cps, 12, { x: -1000, y: -1000 }, { x: -999, y: -1000 });
    assertEqual(p.lastCheckpoint, 3);
  });

  it('increments lap count only when crossing checkpoint 0 after starting', () => {
    const p = createProgress();
    p.lastCheckpoint = 11;
    p.started = true;
    const cp0 = cps[0];
    const midX = (cp0.ax + cp0.bx) / 2;
    const midY = (cp0.ay + cp0.by) / 2;
    const dx = cp0.bx - cp0.ax, dy = cp0.by - cp0.ay;
    const nx = -dy, ny = dx;
    const mag = Math.hypot(nx, ny);
    const ux = nx / mag, uy = ny / mag;
    const K = 50;
    updateProgress(p, cps, 12,
      { x: midX - ux * K, y: midY - uy * K },
      { x: midX + ux * K, y: midY + uy * K });
    assertEqual(p.lastCheckpoint, 0);
    assertEqual(p.lapCount, 1);
  });
});
