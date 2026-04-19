import { describe, it, assertApprox, assertTrue } from '../src/test-runner.js';
import { createCar, stepCar, respawnCar } from '../src/car.js';
import { CONFIG } from '../src/config.js';

describe('car', () => {
  it('createCar initializes with speed 0', () => {
    const c = createCar(10, 20, 0);
    assertApprox(c.x, 10); assertApprox(c.y, 20);
    assertApprox(c.angle, 0); assertApprox(c.speed, 0);
  });

  it('thrust accelerates in facing direction', () => {
    const c = createCar(0, 0, 0);
    stepCar(c, { thrust: true, brake: false, turn: 0 }, 1);
    // After 1s of thrust and drag, speed ~ thrust*dt then decayed; still positive and large
    assertTrue(c.speed > CONFIG.thrustAccel * 0.3, `speed too low: ${c.speed}`);
    assertTrue(c.x > 0);
    assertApprox(c.y, 0, 1e-6);
  });

  it('turning with no speed barely moves position', () => {
    const c = createCar(0, 0, 0);
    stepCar(c, { thrust: false, brake: false, turn: 1 }, 0.5);
    assertApprox(c.x, 0, 1e-6);
    assertApprox(c.y, 0, 1e-6);
    assertTrue(c.angle > 0, 'angle should increase turning right');
  });

  it('turn rate decreases at high speed', () => {
    const c1 = createCar(0, 0, 0); c1.speed = 0;
    const c2 = createCar(0, 0, 0); c2.speed = 1000;
    stepCar(c1, { thrust: false, brake: false, turn: 1 }, 0.1);
    stepCar(c2, { thrust: false, brake: false, turn: 1 }, 0.1);
    assertTrue(c1.angle > c2.angle, 'slow car should turn more in same time');
  });

  it('drag slows a coasting car', () => {
    const c = createCar(0, 0, 0); c.speed = 500;
    stepCar(c, { thrust: false, brake: false, turn: 0 }, 1);
    assertTrue(c.speed < 500, `expected speed<500, got ${c.speed}`);
  });

  it('brake reduces forward speed and clamps reverse', () => {
    const c = createCar(0, 0, 0); c.speed = 100;
    stepCar(c, { thrust: false, brake: true, turn: 0 }, 1);
    assertTrue(c.speed < 100);

    const c2 = createCar(0, 0, 0); c2.speed = 0;
    stepCar(c2, { thrust: false, brake: true, turn: 0 }, 5);
    assertTrue(c2.speed >= CONFIG.reverseCap, `reverse cap: ${c2.speed}`);
  });

  it('respawn resets speed', () => {
    const c = createCar(0, 0, 0); c.speed = 999;
    respawnCar(c, { x: 50, y: 60, angle: 1.5 });
    assertApprox(c.x, 50); assertApprox(c.y, 60);
    assertApprox(c.angle, 1.5); assertApprox(c.speed, 0);
  });
});
