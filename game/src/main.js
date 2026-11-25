// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order of dishes. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, SHIFT_SECONDS, STATIONS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  createWorld, EVENT_BURN, EVENT_CHOP, EVENT_CHOP_DONE, EVENT_ERROR,
  EVENT_EXPIRE, EVENT_GRILL_DONE, EVENT_OVER, EVENT_PICK, EVENT_PLATE,
  EVENT_SERVE, EVENT_SIZZLE,
} from './world.js';
import {
  ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const audio = createAudio();

let screen = SCREEN_TITLE;
let best = 0;
let isBest = false;
try {
  best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
} catch {
  best = 0;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function hintFor() {
  const { state } = world;
  const chef = state.chef;
  if (chef.held !== null && chef.held.kind === 'plate' && chef.held.items.length > 0) {
    if (state.orders.some((o) => world.matchingOrder(chef.held.items) === o)) {
      return 'That plate is ready — serve it at the window! (SPACE at the blue pass)';
    }
    return 'This plate matches no order — dump it in the trash and start over.';
  }
  if (state.board.item !== null && state.board.item.state !== 'chopped') {
    return 'Hold SPACE at the chopping board to chop.';
  }
  if (state.grill.item !== null && !state.grill.cooked) {
    return 'The patty is on the grill — grab something else while it cooks!';
  }
  if (state.grill.item !== null && state.grill.item.state === 'grilled') {
    return 'The patty is grilled — pick it up before it burns!';
  }
  if (chef.held === null) return 'Grab an ingredient from a crate (SPACE), then chop, grill and plate it.';
  return 'Take it to the board, the grill or the plating counter.';
}

function playEvents(events) {
  if (events & EVENT_PICK) audio.pick();
  if (events & EVENT_CHOP) audio.chop();
  if (events & EVENT_CHOP_DONE) audio.chopDone();
  if (events & EVENT_GRILL_DONE) audio.grillDone();
  if (events & EVENT_SIZZLE) audio.sizzle();
  if (events & EVENT_PLATE) audio.plate();
  if (events & EVENT_SERVE) audio.serve();
  if (events & EVENT_ERROR) audio.error();
  if (events & EVENT_EXPIRE) audio.expire();
  if (events & EVENT_BURN) audio.error();
}

function endShift() {
  isBest = world.state.score > best;
  if (isBest) {
    best = world.state.score;
    try {
      window.localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // Best score is a nicety; a browser that refuses storage still plays.
    }
    audio.win();
  }
  screen = SCREEN_OVER;
  setStatus(`Shift over. Score ${world.state.score}, ${world.state.dishes} dishes served. Best ${best}. Press Space to play again.`);
}

function startShift() {
  world.reset();
  screen = SCREEN_PLAY;
  setStatus('Shift started. Serve the orders before their timers run out!');
}

let last = performance.now();
let accumulator = 0;
/** A station click waiting for the chef to arrive before it uses the station. */
let clickUsePending = false;

function frame(now) {
  const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  const actions = input.takeActions();

  if (actions & ACTION_MUTE) {
    const muted = audio.toggleMute();
    setStatus(muted ? 'Sound muted.' : 'Sound on.');
  }

  if (screen === SCREEN_TITLE) {
    if ((actions & ACTION_INTERACT) || input.takeTarget() !== null) startShift();
  } else if (screen === SCREEN_PLAY) {
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      setStatus('Paused. Press P to keep cooking.');
    } else {
      if (actions & ACTION_RESTART) {
        startShift();
      } else {
        const target = input.takeTarget();
        if (target !== null) {
          world.state.chef.target = target;
          clickUsePending = target.useStation;
        }
        const dir = input.direction();
        // A held key steers directly and cancels a mouse walk target.
        if (dir.mx !== 0 || dir.my !== 0) {
          world.state.chef.target = null;
          clickUsePending = false;
        }
        accumulator += elapsed;
        let firstStep = true;
        while (accumulator >= STEP) {
          accumulator -= STEP;
          // One interact press per frame: the key press, or a station click
          // firing once the chef has arrived at the station.
          let interactPressed = firstStep && (actions & ACTION_INTERACT) !== 0;
          if (firstStep && clickUsePending && world.state.chef.target === null) {
            interactPressed = true;
            clickUsePending = false;
          }
          firstStep = false;
          const events = world.step(STEP, {
            mx: dir.mx, my: dir.my, interactPressed, interactHeld: input.interactHeld,
          });
          playEvents(events);
          if (events & EVENT_OVER) {
            endShift();
            break;
          }
        }
      }
    }
  } else if (screen === SCREEN_PAUSED) {
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PLAY;
      setStatus('Back to the kitchen.');
    } else if (actions & ACTION_RESTART) {
      startShift();
    }
  } else if (screen === SCREEN_OVER) {
    if ((actions & ACTION_INTERACT) || (actions & ACTION_RESTART) || input.takeTarget() !== null) startShift();
  }

  const nowSeconds = world.state.elapsed;
  renderer.draw(world.state, screen, {
    best, isBest, now: nowSeconds, hint: screen === SCREEN_PLAY ? hintFor() : null,
  });
  requestAnimationFrame(frame);
}

if (shot !== null) {
  // Screenshot mode: stage the scene, paint it twice, then signal readiness.
  const staged = stageShot(shot, world, STATIONS);
  screen = staged.screen;
  if (screen === SCREEN_OVER) {
    isBest = world.state.score > best;
    if (isBest) best = world.state.score;
  }
  renderer.draw(world.state, screen, {
    best: staged.best, isBest, now: world.state.elapsed, hint: null,
  });
  renderer.draw(world.state, screen, {
    best: staged.best, isBest, now: world.state.elapsed, hint: null,
  });
  window.__shotReady = true;
  setStatus(`Screenshot scene: ${shot}. Score ${world.state.score}, ${world.state.dishes} dishes.`);
} else {
  world.reset();
  setStatus('Sizzle & Serve. Press Space or click to start your shift.');
  requestAnimationFrame(frame);
}
