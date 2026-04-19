import { CONFIG } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const { innerWidth: w, innerHeight: h } = window;
  const targetRatio = CONFIG.world.width / CONFIG.world.height;
  let width = w;
  let height = Math.round(w / targetRatio);
  if (height > h) {
    height = h;
    width = Math.round(h * targetRatio);
  }
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
  ctx.font = '48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Lava Race', canvas.width / 2, canvas.height / 2);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
