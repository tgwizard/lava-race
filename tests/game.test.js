import { describe, it, assertEqual, assertTrue } from '../src/test-runner.js';
import { createGame } from '../src/game.js';

function makeInput(overrides = {}) {
  const red  = { thrust: false, brake: false, turn: 0 };
  const blue = { thrust: false, brake: false, turn: 0 };
  let startHeld = false;
  return {
    pressStart() { startHeld = true; },
    setRed(v)    { Object.assign(red, v); },
    setBlue(v)   { Object.assign(blue, v); },
    get red()    { return { ...red }; },
    get blue()   { return { ...blue }; },
    get start()  { return startHeld; },
    consumeStart() { const had = startHeld; startHeld = false; return had; },
    ...overrides,
  };
}

function runFrames(game, input, frames, dt = 1 / 60) {
  for (let i = 0; i < frames; i++) game.step(dt, input);
}

describe('game integration', () => {
  it('can be created without throwing', () => {
    const game = createGame();
    assertTrue(game !== null);
    const state = game.render();
    assertTrue(state.track !== undefined);
    assertTrue(state.cars.length === 0, 'title has no cars drawn');
    assertTrue(state.overlay.title === 'LAVA RACE');
  });

  it('SPACE advances title → countdown → race', () => {
    const game = createGame();
    const input = makeInput();

    // Title
    assertEqual(game.render().overlay.title, 'LAVA RACE');

    // Press SPACE → countdown
    input.pressStart();
    runFrames(game, input, 1);
    assertTrue(['3', '2', '1'].includes(game.render().overlay.title),
      `expected countdown, got ${game.render().overlay.title}`);

    // Advance 3.1 seconds → race
    runFrames(game, input, 200); // 200/60 ≈ 3.33s
    const state = game.render();
    assertTrue(state.cars.length === 2, `expected 2 cars, got ${state.cars.length}`);
    assertTrue(state.hud !== null);
  });

  it('red accelerates when thrust held', () => {
    const game = createGame();
    const input = makeInput();
    input.pressStart();
    runFrames(game, input, 200); // into race

    const [red0] = game.render().cars;
    const x0 = red0.x, y0 = red0.y;

    input.setRed({ thrust: true });
    runFrames(game, input, 30); // 0.5s

    const [red1] = game.render().cars;
    const dist = Math.hypot(red1.x - x0, red1.y - y0);
    assertTrue(dist > 1, `expected red to move, dist=${dist}`);
  });

  it('car hitting lava triggers respawn', () => {
    const game = createGame();
    const input = makeInput();
    input.pressStart();
    runFrames(game, input, 200);

    // Teleport red out of bounds to force lava hit
    const state = game.render();
    const red = state.cars[0];
    red.x = 10; // far corner = lava
    red.y = 10;

    runFrames(game, input, 2); // should flip to respawning
    assertTrue(red.respawning === true, 'expected respawning flag after lava contact');

    // Wait ~0.6s; car should be back at last spawn, not at (10,10)
    runFrames(game, input, 40);
    assertTrue(!red.respawning, 'should have finished respawning');
    assertTrue(red.x !== 10 || red.y !== 10, 'car position should have reset');
  });
});
