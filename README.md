# makefun-cookgame

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/OrivexLabs/makefun-cookgame/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/OrivexLabs/makefun-cookgame/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve** — a tiny kitchen-rush cooking game. You are the chef of the busiest little kitchen in town: orders land on the board with a ticking timer, and you run the route — grab ingredients from the crates, chop them on the board, grill the patty, stack the plate, and serve it at the window before the order walks out. Three expired orders end the shift; fast serves build a combo tip. Five original recipes, rising order pressure across a 150-second shift, and a best-shift score kept between visits.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Play with keyboard or mouse: WASD / arrow keys to move, SPACE / E to use a station (hold SPACE to chop), click a spot to walk there, click a station to walk over and use it. P pauses, M mutes, R restarts the shift.

## Layout

- `main.ts` — the make.fun hand-in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `game/` — the game itself, plain static files, no network requests: `index.html` plus `src/` (`config.js` tuning and recipes, `world.js` rules, `render.js` all the art, `input.js`, `audio.js` synthesised sounds, `shots.js` screenshot scenes, `main.js` loop).
- `screenshots/` — three real renders of the game in a browser (title, mid-shift, shift over).
- `shots.json` — the `?shot=` scenes behind the screenshots.

---

<sub>Entered on [make.fun](https://make.fun/?ref=silver-beacon-98-6815&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
