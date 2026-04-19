import { CONFIG } from './config.js';

// Pre-seeded "sea" of lava hotspots: fixed origins with independent phases,
// orbit radii, and pulse speeds. Each one draws as a radial gradient every
// frame, additively blended to produce a shifting molten surface.
const HOTSPOTS = Array.from({ length: 7 }, (_, i) => ({
  cx: 0.15 + 0.7 * ((i * 0.37) % 1),
  cy: 0.15 + 0.7 * ((i * 0.61) % 1),
  orbitRx: 0.05 + 0.07 * ((i * 0.29) % 1),
  orbitRy: 0.05 + 0.07 * ((i * 0.43) % 1),
  orbitSpeed: 0.15 + 0.25 * ((i * 0.19) % 1),
  orbitPhase: i * 1.17,
  pulseSpeed: 0.6 + 0.9 * ((i * 0.53) % 1),
  pulsePhase: i * 2.13,
  baseRadius: 0.18 + 0.12 * ((i * 0.71) % 1),
  pulseAmp: 0.35,
}));

export function drawFrame(ctx, state) {
  const { track, cars, checkpoints, hud, overlay } = state;

  drawLava(ctx);
  if (track) drawTrack(ctx, track);
  if (checkpoints) drawCheckpoints(ctx, checkpoints);

  for (const c of cars) drawCar(ctx, c);

  if (hud) drawHud(ctx, hud);
  if (overlay) drawOverlay(ctx, overlay);
}

function drawLava(ctx) {
  const W = CONFIG.world.width, H = CONFIG.world.height;
  const t = performance.now() / 1000;

  // Deep base: a slow breathing gradient from dark crimson to molten orange.
  const breathe = 0.5 + 0.5 * Math.sin(t * 0.35);
  const baseA = lerpColor('#3a0a00', '#5a1200', breathe);
  const baseB = lerpColor('#ff6a00', '#ff4500', breathe);
  const base = ctx.createLinearGradient(0, 0, W * 0.4, H);
  base.addColorStop(0, baseA);
  base.addColorStop(0.6, baseB);
  base.addColorStop(1, baseA);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Hotspots: additive radial gradients that drift and pulse.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of HOTSPOTS) {
    const cx = (s.cx + Math.cos(t * s.orbitSpeed + s.orbitPhase) * s.orbitRx) * W;
    const cy = (s.cy + Math.sin(t * s.orbitSpeed + s.orbitPhase) * s.orbitRy) * H;
    const pulse = 0.5 + 0.5 * Math.sin(t * s.pulseSpeed + s.pulsePhase);
    const radius = (s.baseRadius + s.pulseAmp * s.baseRadius * (pulse - 0.5)) * W;
    const alpha = 0.35 + 0.3 * pulse;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(255, 240, 150, ${alpha.toFixed(3)})`);
    g.addColorStop(0.4, `rgba(255, 110, 20, ${(alpha * 0.55).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();

  // Dark vignette to keep the edges feeling molten-heavy.
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function lerpColor(a, b, t) {
  const ah = parseHex(a), bh = parseHex(b);
  const r = Math.round(ah[0] + (bh[0] - ah[0]) * t);
  const g = Math.round(ah[1] + (bh[1] - ah[1]) * t);
  const bl = Math.round(ah[2] + (bh[2] - ah[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function parseHex(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}

function drawTrack(ctx, track) {
  ctx.save();
  ctx.fillStyle = CONFIG.colors.trackFill;
  ctx.beginPath();
  ctx.moveTo(track.outer[0].x, track.outer[0].y);
  for (const p of track.outer) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.moveTo(track.inner[0].x, track.inner[0].y);
  for (let i = track.inner.length - 1; i >= 0; i--) ctx.lineTo(track.inner[i].x, track.inner[i].y);
  ctx.closePath();
  ctx.fill('evenodd');
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = CONFIG.colors.trackEdge;
  ctx.shadowColor = CONFIG.colors.trackEdge;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  for (let i = 0; i < track.outer.length; i++) {
    const p = track.outer[i];
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < track.inner.length; i++) {
    const p = track.inner[i];
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = CONFIG.colors.centerlineDash;
  ctx.setLineDash([10, 14]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < track.centerline.length; i++) {
    const p = track.centerline[i];
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawCheckpoints(ctx, checkpoints) {
  ctx.save();
  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    if (i === 0) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 20;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.moveTo(cp.ax, cp.ay);
    ctx.lineTo(cp.bx, cp.by);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = car.color;
  ctx.shadowColor = car.color;
  ctx.shadowBlur = car.respawning ? 8 : 26;
  ctx.globalAlpha = car.respawning ? 0.35 + 0.3 * Math.sin(performance.now() / 40) : 1;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-14, 12);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-14, -12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, hud) {
  drawHudBox(ctx, {
    x: 32, y: 24,
    label: 'RED',
    value: `${hud.red} / ${hud.laps}`,
    color: CONFIG.colors.red,
    align: 'left',
  });
  drawHudBox(ctx, {
    x: CONFIG.world.width - 32, y: 24,
    label: 'BLUE',
    value: `${hud.blue} / ${hud.laps}`,
    color: CONFIG.colors.blue,
    align: 'right',
  });
}

function drawHudBox(ctx, { x, y, label, value, color, align }) {
  const boxW = 260, boxH = 84, radius = 14;
  const boxX = align === 'right' ? x - boxW : x;
  const boxY = y;

  ctx.save();
  // Panel: semi-transparent dark fill with colored glow border.
  ctx.beginPath();
  roundRect(ctx, boxX, boxY, boxW, boxH, radius);
  ctx.fillStyle = 'rgba(10, 8, 16, 0.72)';
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.restore();

  // Label (small, dim) and value (large, neon).
  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const padX = 18;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.85;
  ctx.fillText(label, boxX + padX, boxY + 12);

  ctx.globalAlpha = 1;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(value, boxX + padX, boxY + 32);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function drawOverlay(ctx, overlay) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = overlay.color || CONFIG.colors.hud;
  ctx.shadowColor = overlay.color || CONFIG.colors.hud;
  ctx.shadowBlur = 30;
  ctx.font = `bold ${overlay.size || 96}px system-ui, sans-serif`;
  ctx.fillText(overlay.title, CONFIG.world.width / 2, CONFIG.world.height / 2 - 40);
  if (overlay.subtitle) {
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.shadowBlur = 10;
    ctx.fillStyle = CONFIG.colors.hud;
    ctx.shadowColor = CONFIG.colors.hud;
    ctx.fillText(overlay.subtitle, CONFIG.world.width / 2, CONFIG.world.height / 2 + 40);
  }
  ctx.restore();
}
