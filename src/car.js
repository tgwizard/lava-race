import { CONFIG } from './config.js';

export function createCar(x, y, angle) {
  return { x, y, angle, speed: 0 };
}

export function respawnCar(car, { x, y, angle }) {
  car.x = x;
  car.y = y;
  car.angle = angle;
  car.speed = 0;
}

export function stepCar(car, input, dt) {
  if (input.thrust) car.speed += CONFIG.thrustAccel * dt;
  if (input.brake)  car.speed -= CONFIG.brakeAccel  * dt;
  if (car.speed < CONFIG.reverseCap) car.speed = CONFIG.reverseCap;

  car.speed *= Math.exp(-CONFIG.drag * dt);

  const turnRate = CONFIG.baseTurn / (1 + Math.abs(car.speed) * CONFIG.speedTurnPenalty);
  car.angle += input.turn * turnRate * dt;

  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
}
