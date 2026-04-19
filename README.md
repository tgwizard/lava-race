# Lava Race

A two-player hot-seat browser racing game on a procedurally generated track. Don't touch the lava. First to three laps wins.

Play: https://tgwizard.github.io/lava-race/

## Controls

| Action     | Red        | Blue       |
|------------|------------|------------|
| Accelerate | `W`        | `↑`        |
| Brake      | `S`        | `↓`        |
| Turn left  | `A`        | `←`        |
| Turn right | `D`        | `→`        |

`Space` — start / new track after a race finishes.

Thrust has no upper speed cap — decelerate in time or you'll overshoot into the lava. The track widens at the start and narrows through the middle of the lap.

## Run locally

```sh
python3 -m http.server 9922
```

Open `http://localhost:9922/`. Tests are at `http://localhost:9922/tests.html`.

## Playtest checklist

- [ ] Reload five times; every track is smooth, closed, fully inside the viewport, narrower toward the middle.
- [ ] Both cars spawn at the start line and point along the track.
- [ ] Driving into lava flashes the car and respawns at the previous checkpoint after ~0.5 s.
- [ ] Passing checkpoints out of order does nothing.
- [ ] Completing 3 full laps ends the race with a winner banner.
- [ ] Press SPACE to get a fresh track.

## How it's built

Static HTML + ES-module JavaScript on Canvas 2D. No build step, no runtime dependencies. See `docs/superpowers/specs/2026-04-19-lava-race-design.md` for the design and `docs/superpowers/plans/2026-04-19-lava-race.md` for the implementation plan.
