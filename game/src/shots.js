// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot, so the frame is what a short game really looks like and the
// same seed always gives the same frame.
//
// The autopilot works a real order: it fetches what the oldest order still
// needs, chops or grills it, plates it and serves it at the window, then starts
// the next dish. It never cheats: it moves the chef and presses interact
// through the same step() the player uses.

import { CHEF, INGREDIENTS, STEP } from './config.js';
import { EVENT_OVER, plateMatches } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;

/**
 * Where the chef stands to use a station: just below the top-row counters,
 * just above the plating counter and the serving window (their faces point up
 * the kitchen, and the floor below them is walled off by the counters
 * themselves, so standing below one is unreachable from above).
 */
function standAt(station) {
  const below = station.y < 360;
  return {
    x: station.x,
    y: below
      ? station.y + station.h / 2 + CHEF.radius + 8
      : station.y - station.h / 2 - CHEF.radius - 8,
  };
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * What the oldest order still misses, as "kind:state" keys, after counting
 * everything already secured: the plate, the board (a raw item there counts as
 * the chopped one it is becoming), the grill (a patty there counts as grilled),
 * and optionally the chef's hands. `countHeld` leaves the held item out, so the
 * caller can ask whether the held item itself is still needed.
 */
function missingFor(state, countHeld) {
  const order = state.orders[0];
  if (!order) return [];
  const secured = [];
  for (const item of state.plate.items) secured.push(`${item.kind}:${item.state}`);
  if (state.board.item !== null) secured.push(`${state.board.item.kind}:chopped`);
  if (state.grill.item !== null) {
    secured.push(state.grill.item.state === 'burnt' ? 'patty:burnt' : 'patty:grilled');
  }
  const held = state.chef.held;
  if (countHeld && held !== null && held.kind !== 'plate') secured.push(`${held.kind}:${held.state}`);
  const rest = order.recipe.items.map((want) => `${want.kind}:${want.state}`);
  for (const key of secured) {
    const index = rest.indexOf(key);
    if (index !== -1) rest.splice(index, 1);
  }
  return rest;
}

/**
 * Pick the autopilot's next job from the world: a small plan of
 * { station, mode } steps. Modes: 'use' (press interact once there), 'place'
 * (put the held item down), 'chop' (hold the key there), 'wait' (stay put).
 * It always works the oldest order and never fetches a second copy of
 * something already on the board, the grill or the plate.
 */
function plan(world) {
  const { state } = world;
  const chef = state.chef;
  const held = chef.held;

  // 1. A finished plate in hand goes straight to the window; a plate that
  // matches nothing gets dumped; an empty plate goes back on its counter.
  if (held !== null && held.kind === 'plate') {
    if (held.items.length === 0) return { station: 'plate', mode: 'use' };
    if (state.orders.some((o) => plateMatches(held.items, o.recipe))) {
      return { station: 'window', mode: 'use' };
    }
    return { station: 'trash', mode: 'use' };
  }

  // 2. A burnt or unneeded item in hand goes to the trash. "Needed" means the
  // state the item is heading for: a raw patty counts as the grilled patty the
  // oldest order wants, a raw tomato as the chopped one.
  if (held !== null && held.kind !== 'plate') {
    if (held.state === 'burnt') return { station: 'trash', mode: 'use' };
    const destState = held.state === 'raw'
      ? (INGREDIENTS[held.kind].prep === 'chop' ? 'chopped'
        : INGREDIENTS[held.kind].prep === 'grill' ? 'grilled' : 'raw')
      : held.state;
    const stillMissing = missingFor(state, false);
    if (!stillMissing.includes(`${held.kind}:${destState}`)) {
      return { station: 'trash', mode: 'use' };
    }
    // 3. A needed item goes to its next step.
    if (held.state === 'raw' && held.kind === 'patty') return { station: 'grill', mode: 'place' };
    if (held.state === 'raw' && INGREDIENTS[held.kind].prep === 'chop') {
      return { station: 'board', mode: 'place' };
    }
    return { station: 'plate', mode: 'place' };
  }

  // 4. Hands empty: collect what is ready before it burns or waits.
  if (state.grill.item !== null && state.grill.item.state !== 'raw') {
    return { station: 'grill', mode: 'use' };
  }
  if (state.board.item !== null && state.board.item.state === 'chopped') {
    return { station: 'board', mode: 'use' };
  }
  // 5. A plate on the counter that already matches an order: pick it up.
  if (state.plate.items.length > 0
    && state.orders.some((o) => plateMatches(state.plate.items, o.recipe))) {
    return { station: 'plate', mode: 'use' };
  }
  // 6. Something raw on the board still needs chopping: hold the key there.
  if (state.board.item !== null && state.board.item.state === 'raw') {
    return { station: 'board', mode: 'chop' };
  }

  // 7. Fetch what the oldest order still needs.
  const missing = missingFor(state, true);
  if (missing.length > 0) {
    const kind = missing[0].split(':')[0];
    const crate = {
      tomato: 'crateTomato', lettuce: 'crateLettuce', cheese: 'crateCheese',
      patty: 'cratePatty', bun: 'crateBun',
    }[kind];
    return { station: crate, mode: 'use' };
  }

  // 8. Nothing missing: wait by the grill while a patty cooks, else by the pass.
  if (state.grill.item !== null) return { station: 'grill', mode: 'wait' };
  return { station: 'window', mode: 'wait' };
}

function autopilot(world, stations) {
  const { state } = world;
  const chef = state.chef;
  const job = plan(world);
  const station = stations[job.station];
  const spot = standAt(station);
  const d = dist(chef.x, chef.y, spot.x, spot.y);

  // Chopping needs the key held, not pressed: hold it while standing at the board.
  if (state.board.item !== null && state.board.item.state !== 'chopped'
    && job.station === 'board' && d < CHEF.interactRange) {
    return { mx: 0, my: 0, interactPressed: false, interactHeld: true };
  }
  if (d > 26) {
    const mx = (spot.x - chef.x) / d;
    const my = (spot.y - chef.y) / d;
    return { mx, my, interactPressed: false, interactHeld: false };
  }
  if (job.mode === 'wait') return { mx: 0, my: 0, interactPressed: false, interactHeld: false };
  return { mx: 0, my: 0, interactPressed: true, interactHeld: false };
}

/** Play the autopilot forward for `seconds` of game time, or until the shift ends. */
export function playForward(world, stations, seconds) {
  for (let index = 0; index < seconds / STEP; index += 1) {
    const input = autopilot(world, stations);
    if (world.step(STEP, input) & EVENT_OVER) break;
  }
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world, stations) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { mx: 0, my: 0, interactPressed: false, interactHeld: false });
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  playForward(world, stations, limit);
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
