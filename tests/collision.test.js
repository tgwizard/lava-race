import { describe, it, assertTrue } from '../src/test-runner.js';
import { generateValidTrack, buildTrackMask } from '../src/track.js';
import { isOnLava } from '../src/collision.js';

describe('collision.isOnLava', () => {
  let seedCounter = 9001;
  const track = generateValidTrack(() => seedCounter++, 80);
  const mask = buildTrackMask(track, 0.5);

  it('track exists', () => {
    assertTrue(track !== null);
  });

  it('centerline points are not on lava', () => {
    for (let i = 0; i < track.centerline.length; i += 30) {
      const p = track.centerline[i];
      assertTrue(!isOnLava(mask, p.x, p.y), `lava at centerline ${i} (${p.x},${p.y})`);
    }
  });

  it('far corner pixels are on lava', () => {
    assertTrue(isOnLava(mask, 5, 5));
    assertTrue(isOnLava(mask, 1, 999));
  });

  it('out-of-bounds is treated as lava', () => {
    assertTrue(isOnLava(mask, -10, -10));
    assertTrue(isOnLava(mask, 999999, 999999));
  });
});
