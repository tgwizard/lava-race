import { CONFIG } from './config.js';
import { createInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();

function resize() {
  const { innerWidth: w, innerHeight: h } = window;
  const targetRatio = CONFIG.world.width / CONFIG.world.height;
  let width = w, height = Math.round(w / targetRatio);
  if (height > h) { height = h; width = Math.round(h * targetRatio); }
  canvas.width = CONFIG.world.width;
  canvas.height = CONFIG.world.height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
window.addEventListener('resize', resize);
resize();

function tick() {
  ctx.fillStyle = CONFIG.colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = CONFIG.colors.hud;
  ctx.font = '32px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const r = input.red, b = input.blue;
  ctx.fillText(`Red  thrust=${r.thrust} brake=${r.brake} turn=${r.turn}`, 40, 80);
  ctx.fillText(`Blue thrust=${b.thrust} brake=${b.brake} turn=${b.turn}`, 40, 120);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
