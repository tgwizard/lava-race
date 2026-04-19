import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createCar, stepCar } from './car.js';
import { generateValidTrack } from './track.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();
const track = generateValidTrack(() => (Math.random() * 2**32) >>> 0, 80);
if (!track) throw new Error('failed to generate track');

const start = track.centerline[0];
const car = createCar(start.x, start.y, Math.atan2(start.ty, start.tx));

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

function drawTrack() {
  ctx.fillStyle = CONFIG.colors.lavaA;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = CONFIG.colors.trackFill;
  ctx.beginPath();
  ctx.moveTo(track.outer[0].x, track.outer[0].y);
  for (const p of track.outer) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.moveTo(track.inner[0].x, track.inner[0].y);
  for (let i = track.inner.length - 1; i >= 0; i--) ctx.lineTo(track.inner[i].x, track.inner[i].y);
  ctx.closePath();
  ctx.fill('evenodd');
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(1/30, (now - last) / 1000);
  last = now;
  stepCar(car, input.red, dt);

  drawTrack();
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = CONFIG.colors.red;
  ctx.shadowBlur = 24; ctx.shadowColor = CONFIG.colors.red;
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-14, 10); ctx.lineTo(-14, -10); ctx.closePath(); ctx.fill();
  ctx.restore();

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
