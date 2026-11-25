// Keyboard and pointer input. Held keys give a movement direction; one-shot
// presses (interact, pause, mute, restart) are queued as bit flags and taken once
// by the loop, so a press between two frames is never lost and never counted
// twice. A pointer click sets a walk target; clicking a station walks the chef
// to its face and queues an interact for when it arrives.

import { CHEF, STATIONS } from './config.js';

export const ACTION_INTERACT = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const INTERACT = new Set(['Space', 'KeyE']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let interactHeld = false;
  let actions = 0;
  /** A walk target in logical coordinates, or null. Set by a pointer click. */
  let target = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (INTERACT.has(event.code)) {
      interactHeld = true;
      if (!event.repeat) actions |= ACTION_INTERACT;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (INTERACT.has(event.code)) interactHeld = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
    interactHeld = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    // A click on a station walks the chef to its face and queues one interact
    // for arrival; a click anywhere else just walks there.
    let station = null;
    for (const s of Object.values(STATIONS)) {
      if (x >= s.x - s.w / 2 - 10 && x <= s.x + s.w / 2 + 10
        && y >= s.y - s.h / 2 - 10 && y <= s.y + s.h / 2 + 10) {
        station = s;
        break;
      }
    }
    if (station !== null) {
      // Stand below a top-row counter, above the plating counter and the
      // serving window: the floor below those two is cut off by the counters.
      const below = station.y < 360;
      target = {
        x: station.x,
        y: below
          ? station.y + station.h / 2 + CHEF.radius + 8
          : station.y - station.h / 2 - CHEF.radius - 8,
        useStation: true,
      };
    } else {
      target = { x, y, useStation: false };
    }
  });

  return {
    /** Movement direction, each component -1, 0 or 1. */
    direction() {
      return { mx: (right ? 1 : 0) - (left ? 1 : 0), my: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    get interactHeld() {
      return interactHeld;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The walk target set by the last pointer click, or null. `useStation` is
     * true when the click landed on a station: use it once the chef arrives. */
    takeTarget() {
      const taken = target;
      target = null;
      return taken;
    },
  };
}
