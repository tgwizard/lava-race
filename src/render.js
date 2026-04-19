import { CONFIG } from './config.js';

let lavaPhase = 0;

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
  lavaPhase += 0.008;
  const g = ctx.createLinearGradient(0, 0, CONFIG.world.width, CONFIG.world.height);
  g.addColorStop(0, CONFIG.colors.lavaA);
  g.addColorStop(0.5 + 0.2 * Math.sin(lavaPhase), CONFIG.colors.lavaB);
  g.addColorStop(1, CONFIG.colors.lavaA);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
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
  ctx.save();
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.shadowBlur = 12;

  ctx.fillStyle = CONFIG.colors.red;
  ctx.shadowColor = CONFIG.colors.red;
  ctx.textAlign = 'left';
  ctx.fillText(`RED   ${hud.red}/${hud.laps}`, 32, 24);

  ctx.fillStyle = CONFIG.colors.blue;
  ctx.shadowColor = CONFIG.colors.blue;
  ctx.textAlign = 'right';
  ctx.fillText(`${hud.blue}/${hud.laps}   BLUE`, CONFIG.world.width - 32, 24);
  ctx.restore();
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
