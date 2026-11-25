// Sizzle & Serve's rules and state, with no drawing and no browser in it: the
// chef, the stations, the orders, chopping, grilling, plating and serving.
// step() advances one fixed step and returns what happened as bit flags, so the
// caller can react (sounds, popups) without the world knowing about screens.
// Nothing here allocates after createWorld returns, except the small particle
// and popup lists, which are capped.

import {
  CHEF, CHOP_SECONDS, FIELD, GRILL_BURN_AFTER, GRILL_SECONDS, HEARTS,
  INGREDIENTS, LEVEL_SECONDS, MAX_ORDERS, ORDER_INTERVAL, ORDER_INTERVAL_MIN,
  ORDER_INTERVAL_SCALE, ORDER_TIME, RECIPES, SCORE_SERVE, SCORE_TIP_MAX,
  SCORE_WRONG, SHIFT_SECONDS, STATIONS,
} from './config.js';

export const EVENT_PICK = 1;
export const EVENT_CHOP = 2;
export const EVENT_CHOP_DONE = 4;
export const EVENT_GRILL_DONE = 8;
export const EVENT_PLATE = 16;
export const EVENT_SERVE = 32;
export const EVENT_ERROR = 64;
export const EVENT_EXPIRE = 128;
export const EVENT_BURN = 256;
export const EVENT_OVER = 512;
export const EVENT_SIZZLE = 1024;

const FLOOR = { minX: 46, maxX: FIELD.width - 46, minY: 284, maxY: FIELD.height - 34 };
const PARTICLE_MAX = 90;
const POPUP_MAX = 12;

function sameItem(a, b) {
  return a.kind === b.kind && a.state === b.state;
}

/** True when the plate's contents are exactly the recipe's items, in any order. */
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.items.length) return false;
  const rest = recipe.items.slice();
  for (const item of plate) {
    const index = rest.findIndex((want) => sameItem(item, want));
    if (index === -1) return false;
    rest.splice(index, 1);
  }
  return rest.length === 0;
}

/** The open order this plate would serve, or null. */
export function matchingOrder(plate, orders) {
  for (const order of orders) {
    if (plateMatches(plate, order.recipe)) return order;
  }
  return null;
}

function stationRects() {
  return Object.entries(STATIONS).map(([id, s]) => ({ id, ...s }));
}

export function createWorld(random) {
  const chef = {
    x: FIELD.width / 2, y: 620, face: 1, held: null,
    target: null, walking: false,
  };
  const board = { item: null, progress: 0, chopping: false };
  const grill = { item: null, progress: 0, burn: 0, cooked: false };
  const plate = { items: [] };
  const state = {
    chef, board, grill, plate,
    orders: [], nextOrderId: 1, orderTimer: 2,
    score: 0, dishes: 0, hearts: HEARTS, elapsed: 0, level: 1,
    combo: 0, comboTimer: 0, over: false, overReason: '',
    particles: [], popups: [],
  };

  function spawnParticle(x, y, vx, vy, life, color, size) {
    if (state.particles.length >= PARTICLE_MAX) state.particles.shift();
    state.particles.push({ x, y, vx, vy, life, maxLife: life, color, size });
  }

  function spawnPopup(x, y, text, color) {
    if (state.popups.length >= POPUP_MAX) state.popups.shift();
    state.popups.push({ x, y, text, color, life: 1.1 });
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 40 + random() * 90;
      spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 40, 0.5 + random() * 0.4, color, 3 + random() * 4);
    }
  }

  function pickRecipe() {
    // The Garden Stack only joins the menu from level 2, so the first orders stay simple.
    const pool = state.level >= 2 ? RECIPES : RECIPES.slice(0, 4);
    return pool[Math.floor(random() * pool.length)];
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    state.orders.push({ id: state.nextOrderId, recipe: pickRecipe(), timeLeft: ORDER_TIME });
    state.nextOrderId += 1;
  }

  function orderInterval() {
    return Math.max(ORDER_INTERVAL_MIN, ORDER_INTERVAL * Math.pow(ORDER_INTERVAL_SCALE, state.level - 1));
  }

  function reset() {
    chef.x = FIELD.width / 2;
    chef.y = 620;
    chef.face = 1;
    chef.held = null;
    chef.target = null;
    chef.walking = false;
    board.item = null;
    board.progress = 0;
    board.chopping = false;
    grill.item = null;
    grill.progress = 0;
    grill.burn = 0;
    grill.cooked = false;
    plate.items.length = 0;
    state.orders.length = 0;
    state.nextOrderId = 1;
    state.orderTimer = 6;
    state.score = 0;
    state.dishes = 0;
    state.hearts = HEARTS;
    state.elapsed = 0;
    state.level = 1;
    state.combo = 0;
    state.comboTimer = 0;
    state.over = false;
    state.overReason = '';
    state.particles.length = 0;
    state.popups.length = 0;
    spawnOrder();
    spawnOrder();
  }

  /** The station whose counter face is nearest the chef, when it is in reach. */
  function nearestStation() {
    let best = null;
    let bestDist = Infinity;
    for (const s of stationRects()) {
      const cx = Math.max(s.x - s.w / 2, Math.min(chef.x, s.x + s.w / 2));
      const cy = Math.max(s.y - s.h / 2, Math.min(chef.y, s.y + s.h / 2));
      const dx = chef.x - cx;
      const dy = chef.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    return bestDist <= CHEF.interactRange ? best : null;
  }

  function pushOutOfCounters() {
    for (const s of stationRects()) {
      const left = s.x - s.w / 2 - CHEF.radius;
      const right = s.x + s.w / 2 + CHEF.radius;
      const top = s.y - s.h / 2 - CHEF.radius;
      const bottom = s.y + s.h / 2 + CHEF.radius;
      if (chef.x > left && chef.x < right && chef.y > top && chef.y < bottom) {
        const pushLeft = chef.x - left;
        const pushRight = right - chef.x;
        const pushTop = chef.y - top;
        const pushBottom = bottom - chef.y;
        const min = Math.min(pushLeft, pushRight, pushTop, pushBottom);
        if (min === pushLeft) chef.x = left;
        else if (min === pushRight) chef.x = right;
        else if (min === pushTop) chef.y = top;
        else chef.y = bottom;
      }
    }
  }

  function moveChef(dt, mx, my) {
    let dx = mx;
    let dy = my;
    if (chef.target !== null) {
      const tx = chef.target.x - chef.x;
      const ty = chef.target.y - chef.y;
      const dist = Math.sqrt(tx * tx + ty * ty);
      if (dist < 8) {
        chef.target = null;
        chef.walking = false;
      } else {
        dx = tx / dist;
        dy = ty / dist;
        chef.walking = true;
      }
    } else {
      chef.walking = dx !== 0 || dy !== 0;
    }
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      chef.x += (dx / len) * CHEF.speed * dt;
      chef.y += (dy / len) * CHEF.speed * dt;
      if (dx !== 0) chef.face = dx > 0 ? 1 : -1;
    }
    chef.x = Math.max(FLOOR.minX, Math.min(FLOOR.maxX, chef.x));
    chef.y = Math.max(FLOOR.minY, Math.min(FLOOR.maxY, chef.y));
    pushOutOfCounters();
  }

  /** One press of the interact key at the nearest station in reach. */
  function interact() {
    const station = nearestStation();
    if (station === null) return 0;
    const held = chef.held;

    if (station.kind === 'crate') {
      if (held !== null) return EVENT_ERROR;
      chef.held = { kind: station.item, state: 'raw' };
      return EVENT_PICK;
    }

    if (station.kind === 'trash') {
      if (held === null) return EVENT_ERROR;
      if (held.kind === 'plate') {
        if (held.items.length === 0) return EVENT_ERROR;
        held.items.length = 0;
        burst(station.x, station.y, '#888888', 8);
        return EVENT_PLATE;
      }
      chef.held = null;
      burst(station.x, station.y, '#888888', 8);
      return EVENT_PLATE;
    }

    if (station.kind === 'board') {
      if (board.item === null) {
        if (held === null || held.kind === 'plate') return EVENT_ERROR;
        if (INGREDIENTS[held.kind].prep !== 'chop') return EVENT_ERROR;
        board.item = held;
        board.progress = 0;
        chef.held = null;
        return EVENT_PLATE;
      }
      if (board.item.state === 'chopped') {
        if (held !== null) return EVENT_ERROR;
        chef.held = board.item;
        board.item = null;
        board.progress = 0;
        return EVENT_PICK;
      }
      return 0; // Still chopping: hold the key instead of pressing it.
    }

    if (station.kind === 'grill') {
      if (grill.item === null) {
        if (held === null || held.kind === 'plate') return EVENT_ERROR;
        if (INGREDIENTS[held.kind].prep !== 'grill') return EVENT_ERROR;
        grill.item = held;
        grill.progress = 0;
        grill.burn = 0;
        grill.cooked = false;
        chef.held = null;
        return EVENT_PLATE | EVENT_SIZZLE;
      }
      if (grill.item.state === 'grilled' || grill.item.state === 'burnt') {
        if (held !== null) return EVENT_ERROR;
        chef.held = grill.item;
        grill.item = null;
        grill.progress = 0;
        grill.burn = 0;
        grill.cooked = false;
        return EVENT_PICK;
      }
      return 0; // Still grilling.
    }

    if (station.kind === 'plate') {
      if (held !== null && held.kind === 'plate') {
        // Put the plate back down on its counter.
        if (plate.items.length !== 0) return EVENT_ERROR;
        plate.items = held.items;
        chef.held = null;
        return EVENT_PLATE;
      }
      if (held === null) {
        if (plate.items.length === 0) return EVENT_ERROR;
        chef.held = { kind: 'plate', items: plate.items };
        plate.items = [];
        return EVENT_PICK;
      }
      if (plate.items.length >= 4) return EVENT_ERROR;
      plate.items.push(held);
      chef.held = null;
      burst(station.x, station.y, '#ffd166', 6);
      return EVENT_PLATE;
    }

    if (station.kind === 'window') {
      if (held === null || held.kind !== 'plate' || held.items.length === 0) return EVENT_ERROR;
      const order = matchingOrder(held.items, state.orders);
      if (order === null) return EVENT_ERROR;
      state.orders.splice(state.orders.indexOf(order), 1);
      const tip = Math.round(SCORE_TIP_MAX * (order.timeLeft / ORDER_TIME));
      let points = SCORE_SERVE + tip;
      if (state.comboTimer > 0) {
        state.combo += 1;
        points += 25 * state.combo;
      } else {
        state.combo = 0;
      }
      state.comboTimer = 12;
      state.score += points;
      state.dishes += 1;
      const wx = station.x;
      const wy = station.y;
      burst(wx, wy - 20, '#ffd166', 16);
      spawnPopup(wx, wy - 50, `+${points}`, '#3f9e4d');
      chef.held = null;
      return EVENT_SERVE;
    }
    return 0;
  }

  function step(dt, input) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    state.level = Math.min(9, 1 + Math.floor(state.elapsed / LEVEL_SECONDS));
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    moveChef(dt, input.mx, input.my);

    // Chopping advances while the key is held at the board.
    board.chopping = false;
    if (input.interactHeld && board.item !== null && board.item.state !== 'chopped') {
      const station = nearestStation();
      if (station !== null && station.kind === 'board') {
        board.chopping = true;
        board.progress += dt / CHOP_SECONDS;
        if (Math.random() < dt * 6) events |= EVENT_CHOP;
        if (board.progress >= 1) {
          board.item.state = 'chopped';
          board.progress = 1;
          events |= EVENT_CHOP_DONE;
        }
      }
    }
    if (input.interactPressed) events |= interact();

    // The grill cooks on its own once a patty is on it.
    if (grill.item !== null) {
      if (!grill.cooked) {
        grill.progress += dt / GRILL_SECONDS;
        if (random() < dt * 3) {
          spawnParticle(
            grill.x + (random() - 0.5) * 80, grill.y - 20,
            (random() - 0.5) * 12, -26 - random() * 20,
            0.7, '#dddddd', 4,
          );
        }
        if (grill.progress >= 1) {
          grill.item.state = 'grilled';
          grill.cooked = true;
          grill.progress = 1;
          events |= EVENT_GRILL_DONE;
        }
      } else if (grill.item.state === 'grilled') {
        grill.burn += dt;
        if (grill.burn >= GRILL_BURN_AFTER) {
          grill.item.state = 'burnt';
          events |= EVENT_BURN;
        }
      }
    }

    // Orders arrive and expire.
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      spawnOrder();
      state.orderTimer = orderInterval();
    }
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders.splice(i, 1);
        state.hearts -= 1;
        state.score = Math.max(0, state.score + SCORE_WRONG);
        events |= EVENT_EXPIRE;
        if (state.hearts <= 0) {
          state.over = true;
          state.overReason = 'Too many orders walked out — the dinner rush beat you.';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    if (state.elapsed >= SHIFT_SECONDS) {
      state.over = true;
      state.overReason = 'Shift over! The kitchen closes its doors.';
      events |= EVENT_OVER;
      return events;
    }

    // Particles and popups age.
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 12 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.popups.length - 1; i >= 0; i -= 1) {
      const p = state.popups[i];
      p.life -= dt;
      p.y -= 34 * dt;
      if (p.life <= 0) state.popups.splice(i, 1);
    }
    return events;
  }

  return { state, reset, step, nearestStation, matchingOrder: (plateItems) => matchingOrder(plateItems, state.orders) };
}
