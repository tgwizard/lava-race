// Tiny particle system. Each car owns one array via createParticles().
// Particles are plain objects { x, y, vx, vy, life, max, size, color }.

const MAX_PARTICLES = 260;

export function createParticles() {
  return [];
}

export function emitThrust(particles, car, dt) {
  // Exhaust: spawn just behind the car along its heading, with some
  // backwards-pointing velocity plus a spray cone, warm colors.
  const rate = 80; // per second
  let toEmit = rate * dt + Math.random();
  while (toEmit >= 1 && particles.length < MAX_PARTICLES) {
    toEmit -= 1;
    const back = -14;
    const spread = 6;
    const ox = Math.cos(car.angle) * back + (Math.random() - 0.5) * spread;
    const oy = Math.sin(car.angle) * back + (Math.random() - 0.5) * spread;
    const backSpeed = 80 + Math.random() * 120;
    const coneAngle = car.angle + Math.PI + (Math.random() - 0.5) * 0.6;
    particles.push({
      x: car.x + ox,
      y: car.y + oy,
      vx: Math.cos(coneAngle) * backSpeed + car.speed * 0.1 * Math.cos(car.angle),
      vy: Math.sin(coneAngle) * backSpeed + car.speed * 0.1 * Math.sin(car.angle),
      life: 0.35 + Math.random() * 0.25,
      max:  0.6,
      size: 6 + Math.random() * 5,
      color: pickExhaustColor(),
    });
  }
}

export function emitBrake(particles, car, dt) {
  // Brake smoke: bigger, slower puffs from the rear. Only meaningful when
  // actually moving — don't spew smoke while stationary.
  if (Math.abs(car.speed) < 20) return;
  const rate = 40;
  let toEmit = rate * dt + Math.random();
  while (toEmit >= 1 && particles.length < MAX_PARTICLES) {
    toEmit -= 1;
    const side = (Math.random() - 0.5) * 14; // jitter across the rear width
    const nx = -Math.sin(car.angle), ny = Math.cos(car.angle);
    const back = -12;
    const ox = Math.cos(car.angle) * back + nx * side;
    const oy = Math.sin(car.angle) * back + ny * side;
    particles.push({
      x: car.x + ox,
      y: car.y + oy,
      vx: (Math.random() - 0.5) * 40 + car.speed * 0.05 * Math.cos(car.angle),
      vy: (Math.random() - 0.5) * 40 + car.speed * 0.05 * Math.sin(car.angle),
      life: 0.5 + Math.random() * 0.3,
      max:  0.8,
      size: 9 + Math.random() * 6,
      color: 'rgba(220, 220, 230, 1)',
      smoke: true,
    });
  }
}

export function stepParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Slight drag so particles aren't straight-line rockets.
    p.vx *= 1 - 2 * dt;
    p.vy *= 1 - 2 * dt;
    if (p.smoke) {
      // Smoke grows as it ages
      p.size += 14 * dt;
    }
  }
}

function pickExhaustColor() {
  const r = Math.random();
  if (r < 0.4) return 'rgba(255, 240, 160, 1)';
  if (r < 0.75) return 'rgba(255, 160, 40, 1)';
  return 'rgba(255, 70, 20, 1)';
}
