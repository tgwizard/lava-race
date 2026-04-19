import { describe, it, assertEqual } from '../src/test-runner.js';

describe('smoke', () => {
  it('math still works', () => {
    assertEqual(1 + 1, 2);
  });
});
