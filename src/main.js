import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createCar, stepCar } from './car.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();
const car = createCar(CONFIG.world.width / 2, CONFIG.world.height / 2, 0);

function resize() {
  const { innerWidth: w, innerHeight: h } = window;
  const ratio = CONFIG.world.width / CONFIG.world.height;
  let width = w, height = Math.round(w / ratio);
  if (height > h) { height = h; width = Math.round(h * ratio); }
  canvas.width = CONFIG.world.width;
  canvas.height = CONFIG.world.height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
function tick(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  stepCar(car, input.red, dt);

  ctx.fillStyle = CONFIG.colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = CONFIG.colors.red;
  ctx.shadowBlur = 24; ctx.shadowColor = CONFIG.colors.red;
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(-14, 10); ctx.lineTo(-14, -10); ctx.closePath();
  ctx.fill();
  ctx.restore();

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
