import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createGame } from './game.js';
import { drawFrame } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();
const game = createGame();

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
  const dt = Math.min(1/30, (now - last) / 1000);
  last = now;
  game.step(dt, input);
  drawFrame(ctx, game.render());
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
