// Two-player keyboard state. Red = WASD, Blue = Arrows.
// Consumers read `input.red.thrust`, `input.red.turn` (−1, 0, +1), etc.

const KEYS = {
  red:  { thrust: 'KeyW', brake: 'KeyS', left: 'KeyA', right: 'KeyD' },
  blue: { thrust: 'ArrowUp', brake: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
  start: 'Space',
};

export function createInput() {
  const pressed = new Set();

  window.addEventListener('keydown', (e) => {
    if (Object.values(KEYS.red).includes(e.code) ||
        Object.values(KEYS.blue).includes(e.code) ||
        e.code === KEYS.start) {
      e.preventDefault();
    }
    pressed.add(e.code);
  });
  window.addEventListener('keyup', (e) => { pressed.delete(e.code); });
  window.addEventListener('blur', () => pressed.clear());

  function readPlayer(keys) {
    return {
      thrust: pressed.has(keys.thrust),
      brake: pressed.has(keys.brake),
      turn: (pressed.has(keys.right) ? 1 : 0) - (pressed.has(keys.left) ? 1 : 0),
    };
  }

  return {
    get red()   { return readPlayer(KEYS.red); },
    get blue()  { return readPlayer(KEYS.blue); },
    get start() { return pressed.has(KEYS.start); },
    consumeStart() {
      const had = pressed.has(KEYS.start);
      pressed.delete(KEYS.start);
      return had;
    },
  };
}
