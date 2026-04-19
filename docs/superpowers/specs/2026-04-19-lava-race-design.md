# Lava Race — Design

Two-player hot-seat browser racing game. One keyboard, red car (WASD) vs blue car (Arrow keys). Procedurally generated closed-loop track; off-track is lava. First to 3 laps wins.

Deployed as a static site on GitHub Pages at `tgwizard/lava-race`.

## Goals

- Fast, low-friction two-player fun on a single laptop.
- Each session plays on a fresh track, so muscle memory doesn't dominate.
- Neon, arcade feel — distinctive but cheap to render at 60fps on a 2D canvas.
- Single-page static site, zero build step, zero runtime dependencies.

## Non-goals

- Multiplayer over network, AI opponents, mobile/touch controls, sound.
- Car tuning, power-ups, or multiple car classes.
- Asset pipeline or WebGL. Plain Canvas 2D only.

## Controls

| Action       | Red (P1) | Blue (P2)   |
|--------------|----------|-------------|
| Accelerate   | `W`      | `ArrowUp`   |
| Brake/Reverse| `S`      | `ArrowDown` |
| Turn left    | `A`      | `ArrowLeft` |
| Turn right   | `D`      | `ArrowRight`|

`Space` advances title → countdown → play → finish → new track.

## Rendering & camera

- Single `<canvas>` scaled to the viewport, letterboxed to preserve aspect.
- One shared camera: the whole track fits on screen at all times so both players see each other. No split-screen, no follow.
- Neon aesthetic: near-black background, glowing strokes via `shadowBlur` + `shadowColor`. Red = `#ff2a6d`, Blue = `#05d9ff`. Lava = hot orange/yellow gradient.

## Physics

Top-down 2D. Each car has state `{x, y, angle, speed}`. Per fixed-timestep tick (60 Hz):

- Thrust: `W`/`Up` adds `+thrustAccel * dt` to `speed`. No upper cap.
- Brake: `S`/`Down` adds `-brakeAccel * dt` to `speed`. Clamped at small negative (slow reverse).
- Drag: `speed *= (1 - drag * dt)` each frame. Releasing thrust gradually slows.
- Steering: `A`/`D` adds `±turnRate(speed) * dt` to `angle`. Turn rate falls off with speed, e.g. `turnRate = baseTurn / (1 + speed * speedTurnPenalty)`. Fast cars turn wide; this is the core "decelerate to turn" mechanic.
- Integration: `x += cos(angle) * speed * dt`, `y += sin(angle) * speed * dt`.

Constants live in `src/config.js` for easy tuning. Reasonable starting values:
- `thrustAccel ≈ 600 px/s²`
- `brakeAccel ≈ 900 px/s²`
- `drag ≈ 0.6 /s`
- `baseTurn ≈ 3.5 rad/s`, `speedTurnPenalty ≈ 0.004`

Cars do not collide with each other (avoids griefing and simplifies physics).

## Track generation

Goal: a smooth closed loop that's wide and forgiving at the start and tightens later.

1. **Skeleton**: pick `N` (e.g. 10–14) control points on a circle of radius `R`, each with jittered radius (`R * rand(0.55, 1.0)`) and a small angular jitter so the loop isn't symmetric.
2. **Centerline**: interpolate the control points with a closed Catmull-Rom spline, sampled to a dense polyline (hundreds of points) indexed by arc length.
3. **Width profile**: width at arc-length fraction `s ∈ [0, 1)` is `lerp(wideW, narrowW, easeIn(s))`, e.g. `wideW ≈ 220 px`, `narrowW ≈ 70 px`. `s = 0` is the start line, progress wraps to 0 across the line, so the narrow part is "just before the finish."
4. **Geometry**: extrude the centerline by ±width/2 along its normal to get inner/outer polygons.
5. **Validation**: reject generated tracks where self-intersection or min width violations occur (retry up to K times). Simple check: ensure minimum distance between non-adjacent centerline samples stays above `narrowW + margin`.
6. **Rasterization**: paint the track once to an offscreen canvas (the "track mask"):
   - Fill whole canvas with lava (animated at render time, but the mask itself just marks lava vs track).
   - Fill the track polygon in a flat color.
   - Track surface color = dark charcoal with a subtle dashed centerline guide.
   - Edge glow via stroked polygon with `shadowBlur`.
7. **Lava check**: for collision detection, read pixels from a small, low-res mask canvas (e.g. 1:1 or 1:2). A car is "in lava" if the pixel under its center is lava.

## Checkpoints, laps, and respawn

- Sample `M` checkpoints (e.g. `M = 12`) uniformly along the centerline by arc length. Checkpoint 0 is the start/finish line.
- Each checkpoint is a line segment perpendicular to the centerline spanning the track width.
- A car has `lastCheckpoint` (index) and `lapCount`. It must cross checkpoint `(lastCheckpoint + 1) mod M` to advance. Out-of-order crossings are ignored.
- Crossing checkpoint 0 (the start line) after having hit checkpoint `M-1` in this lap → `lapCount += 1`.
- On lava: car freezes for 500 ms (flash + "melting" visual), then respawns at the `lastCheckpoint`'s midpoint, facing along the centerline tangent, `speed = 0`.

## Game states

State machine in `src/game.js`:

- `title` — "Lava Race" + controls + "Press Space".
- `countdown` — 3, 2, 1, Go (1 s each).
- `race` — physics + rendering running.
- `finish` — winner banner, "Space for new track".

On entering `title` or `finish → title`, regenerate track.

## Project layout

```
index.html
style.css
src/
  main.js          # entry, wires modules together, boots game loop
  game.js          # state machine + lap/checkpoint logic
  car.js           # physics, respawn
  track.js         # procedural generation, mask, checkpoints
  input.js         # keyboard state for both players
  render.js        # draw track, cars, HUD, state overlays
  config.js        # tunable constants
.github/workflows/pages.yml  # deploy on push to main
```

ES modules loaded directly from `index.html` (`<script type="module" src="src/main.js">`). No bundler, no npm install needed to run — just open `index.html` or serve the directory.

## Deployment

GitHub Actions workflow publishes the repository root to GitHub Pages on every push to `main`. Repo must be public and Pages must be configured to "GitHub Actions" source (one-time manual setup by the repo owner).

## Testing strategy

This is a small interactive project with no meaningful pure-logic complexity beyond track generation and checkpoint progression. Rather than unit tests:

- **Pure helpers** (spline sampling, checkpoint line-crossing, width profile) — small vitest-free assertions in a `tests.html` page opened in the browser, or skip if trivial.
- **Manual playtest checklist** in the repo README: generate 5 tracks, verify no self-intersections; drive into lava, verify respawn; complete 3 laps on both sides.

No CI test job; rely on manual verification for a project this size.

## Open risks and mitigations

- **Track self-intersection** — handled by retry with validation.
- **Over-narrow segments** — width floor enforced; validation rejects bad layouts.
- **Pixel-read performance** — use a low-res mask; one read per car per frame is cheap.
- **Extreme speeds tunnelling through narrow track** — substep physics when `speed * dt > min_track_width / 4`.
