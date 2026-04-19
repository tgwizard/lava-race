import { CONFIG } from './config.js';
import { createCar, stepCar, respawnCar } from './car.js';
import { generateValidTrack, generateCheckpoints, buildTrackMask } from './track.js';
import { isOnLava } from './collision.js';
import { createProgress, updateProgress } from './checkpoints.js';
import { randomSeed } from './rng.js';
import { createParticles, emitThrust, emitBrake, stepParticles } from './particles.js';

const STATES = { TITLE: 'title', COUNTDOWN: 'countdown', RACE: 'race', FINISH: 'finish' };

export function createGame() {
  let state = STATES.TITLE;
  let stateT = 0;
  let track, checkpoints, mask;
  let red, blue;
  let winner = null;

  function makeTrack() {
    track = generateValidTrack(randomSeed, 400);
    if (!track) throw new Error('Track generation failed after 400 attempts');
    checkpoints = generateCheckpoints(track, CONFIG.checkpointCount);
    mask = buildTrackMask(track, 0.5);

    const cp0 = checkpoints[0];
    const offset = track.widths[0] * 0.18;
    // Perpendicular to cp0.angle
    const nx = -Math.sin(cp0.angle), ny = Math.cos(cp0.angle);
    red  = buildPlayer(CONFIG.colors.red,
      { x: cp0.midX - nx * offset, y: cp0.midY - ny * offset }, cp0.angle);
    blue = buildPlayer(CONFIG.colors.blue,
      { x: cp0.midX + nx * offset, y: cp0.midY + ny * offset }, cp0.angle);
    winner = null;
  }

  function buildPlayer(color, pos, angle) {
    const car = createCar(pos.x, pos.y, angle);
    car.color = color;
    car.respawning = false;
    car.respawnTimer = 0;
    car.progress = createProgress();
    car.lastSpawn = { x: pos.x, y: pos.y, angle };
    car.particles = createParticles();
    return car;
  }

  function resetCarToCheckpoint(car) {
    respawnCar(car, car.lastSpawn);
  }

  function updateSpawnFromCheckpoint(car) {
    if (car.progress.lastCheckpoint < 0) return;
    const cp = checkpoints[car.progress.lastCheckpoint];
    car.lastSpawn = { x: cp.midX, y: cp.midY, angle: cp.angle };
  }

  makeTrack();

  function stepPlayer(car, playerInput, dt) {
    // Particles age regardless of state so they fade out through respawn.
    stepParticles(car.particles, dt);

    if (car.respawning) {
      car.respawnTimer -= dt;
      if (car.respawnTimer <= 0) {
        car.respawning = false;
        resetCarToCheckpoint(car);
      }
      return;
    }
    const prev = { x: car.x, y: car.y };
    const maxStep = CONFIG.widthEnd / 3;
    const distance = Math.abs(car.speed) * dt;
    const substeps = Math.max(1, Math.ceil(distance / maxStep));
    const sdt = dt / substeps;
    for (let i = 0; i < substeps; i++) stepCar(car, playerInput, sdt);

    car.x = Math.max(0, Math.min(CONFIG.world.width, car.x));
    car.y = Math.max(0, Math.min(CONFIG.world.height, car.y));

    if (playerInput.thrust) emitThrust(car.particles, car, dt);
    if (playerInput.brake)  emitBrake(car.particles, car, dt);

    updateProgress(car.progress, checkpoints, CONFIG.checkpointCount, prev, car);
    updateSpawnFromCheckpoint(car);

    if (isOnLava(mask, car.x, car.y)) {
      car.respawning = true;
      car.respawnTimer = CONFIG.respawnFreezeMs / 1000;
      car.speed = 0;
    }
  }

  function step(dt, input) {
    stateT += dt;
    switch (state) {
      case STATES.TITLE:
        if (input.consumeStart()) { state = STATES.COUNTDOWN; stateT = 0; }
        break;
      case STATES.COUNTDOWN:
        if (stateT >= 3) { state = STATES.RACE; stateT = 0; }
        break;
      case STATES.RACE:
        stepPlayer(red,  input.red,  dt);
        stepPlayer(blue, input.blue, dt);
        if (red.progress.lapCount >= CONFIG.lapsToWin)  { winner = 'red';  state = STATES.FINISH; stateT = 0; }
        if (blue.progress.lapCount >= CONFIG.lapsToWin) { winner = 'blue'; state = STATES.FINISH; stateT = 0; }
        break;
      case STATES.FINISH:
        if (input.consumeStart()) { makeTrack(); state = STATES.COUNTDOWN; stateT = 0; }
        break;
    }
  }

  function render() {
    const cars = (state === STATES.RACE || state === STATES.COUNTDOWN || state === STATES.FINISH)
      ? [red, blue] : [];
    let overlay = null;
    if (state === STATES.TITLE) {
      overlay = { title: 'LAVA RACE', subtitle: 'Red: WASD   •   Blue: Arrows   •   Press SPACE', size: 110 };
    } else if (state === STATES.COUNTDOWN) {
      const n = Math.max(1, Math.ceil(3 - stateT));
      overlay = { title: String(n), size: 220 };
    } else if (state === STATES.RACE && stateT < 0.7) {
      overlay = { title: 'GO!', color: '#8fff7a', size: 220 };
    } else if (state === STATES.FINISH) {
      overlay = {
        title: winner === 'red' ? 'RED WINS' : 'BLUE WINS',
        color: winner === 'red' ? CONFIG.colors.red : CONFIG.colors.blue,
        subtitle: 'Press SPACE for a new track',
      };
    }
    return {
      track,
      checkpoints,
      cars,
      hud: state !== STATES.TITLE ? {
        red: red.progress.lapCount, blue: blue.progress.lapCount, laps: CONFIG.lapsToWin,
      } : null,
      overlay,
    };
  }

  return { step, render };
}
