import { describe, it, assertApprox, assertTrue } from '../src/test-runner.js';
import { mulberry32 } from '../src/rng.js';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 5; i++) assertApprox(a(), b(), 1e-12);
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      assertTrue(v >= 0 && v < 1, `out of range: ${v}`);
    }
  });

  it('different seeds diverge', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    assertTrue(a() !== b());
  });
});
