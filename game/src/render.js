// Everything the player sees, drawn with the canvas 2D API: the kitchen, the
// order board, the food, the chef and every screen. All art is drawn from code,
// so the game needs no image files. One logical 1280x720 field, scaled to fit.

import { FIELD, FONT, INGREDIENTS, PALETTE, STATIONS } from './config.js';
import { plateMatches } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient, drawn at (x, y) with the given radius, in its current state. */
export function drawIngredient(ctx, kind, state, x, y, r) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'tomato') {
    if (state === 'chopped') {
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillStyle = i === 0 ? ing.color : ing.light;
        ctx.beginPath();
        ctx.arc(i * r * 0.7, 0, r * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ing.dark;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = '#ffd9d4';
      ctx.beginPath();
      ctx.arc(0, -r * 0.2, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = ing.dark;
      ctx.beginPath();
      ctx.arc(0, r * 0.08, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ing.light;
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7d33';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.7);
      ctx.lineTo(-r * 0.4, -r * 1.05);
      ctx.lineTo(0, -r * 0.85);
      ctx.lineTo(r * 0.4, -r * 1.05);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    if (state === 'chopped') {
      ctx.strokeStyle = ing.color;
      ctx.lineWidth = r * 0.42;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.7 - r * 0.3, -r * 0.4);
        ctx.lineTo(i * r * 0.7 + r * 0.3, r * 0.4);
        ctx.stroke();
      }
      ctx.strokeStyle = ing.light;
      ctx.lineWidth = r * 0.18;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.7 - r * 0.2, -r * 0.3);
        ctx.lineTo(i * r * 0.7 + r * 0.2, r * 0.3);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = ing.dark;
      ctx.beginPath();
      ctx.arc(0, r * 0.06, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ing.color;
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = ing.light;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(r * 0.2, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.6);
    ctx.lineTo(r * 0.9, r * 0.6);
    ctx.lineTo(r * 0.15, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-r * 0.25, r * 0.25, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.05, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'patty') {
    const burnt = state === 'burnt';
    ctx.fillStyle = burnt ? '#221610' : ing.dark;
    rr(ctx, -r, -r * 0.62, r * 2, r * 1.24, r * 0.5);
    ctx.fill();
    ctx.fillStyle = burnt ? '#3a241a' : ing.color;
    rr(ctx, -r * 0.92, -r * 0.55, r * 1.84, r * 1.05, r * 0.45);
    ctx.fill();
    if (!burnt) {
      ctx.strokeStyle = state === 'grilled' ? '#5f3a1e' : ing.light;
      ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.5 - r * 0.25, -r * 0.4);
        ctx.lineTo(i * r * 0.5 + r * 0.25, r * 0.4);
        ctx.stroke();
      }
    }
  } else if (kind === 'bun') {
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.light;
    ctx.beginPath();
    ctx.arc(0, r * 0.08, r * 0.92, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.4, -0.45], [0, -0.6], [0.4, -0.45], [-0.2, -0.25], [0.25, -0.25]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

function drawCrate(ctx, s, label) {
  const { x, y, w, h } = s;
  ctx.fillStyle = PALETTE.counterEdge;
  rr(ctx, x - w / 2, y - h / 2, w, h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, x - w / 2 + 4, y - h / 2 + 4, w - 8, h - 8, 8);
  ctx.fill();
  drawIngredient(ctx, s.item, 'raw', x, y - 6, 20);
  text(ctx, label, x, y + h / 2 - 10, 13, PALETTE.text, 'center');
}

function drawStationLabel(ctx, s, label) {
  text(ctx, label, s.x, s.y - s.h / 2 - 12, 13, PALETTE.textLight, 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(FIELD.width * scale * dpr);
    canvas.height = Math.round(FIELD.height * scale * dpr);
    canvas.style.width = `${Math.round(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.round(FIELD.height * scale)}px`;
    ctx.setTransform((canvas.width / FIELD.width), 0, 0, (canvas.height / FIELD.height), 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function drawFloor() {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, 180);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 172, FIELD.width, 8);
    // Wall tiles.
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 0; x < FIELD.width; x += 80) ctx.fillRect(x, 0, 2, 180);
    for (let y = 0; y < 180; y += 40) ctx.fillRect(0, y, FIELD.width, 2);
    // Wall decor, in the order band beside the tickets: a menu board and a clock.
    ctx.fillStyle = '#2e1f14';
    rr(ctx, 856, 72, 180, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9b8';
    text(ctx, '★ TODAY\'S MENU ★', 946, 95, 16, '#ffe9b8', 'center');
    ctx.fillStyle = '#fdfdf6';
    ctx.beginPath();
    ctx.arc(1180, 94, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e1f14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1180, 94, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1180, 94);
    ctx.lineTo(1180, 78);
    ctx.moveTo(1180, 94);
    ctx.lineTo(1192, 100);
    ctx.stroke();
    // Floor tiles.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 180, FIELD.width, FIELD.height - 180);
    ctx.fillStyle = PALETTE.floorDark;
    for (let ty = 180; ty < FIELD.height; ty += 64) {
      for (let tx = ((ty / 64) % 2) * 32; tx < FIELD.width; tx += 64) {
        ctx.fillRect(tx, ty, 62, 62);
      }
    }
    // Floor rug in front of the pass.
    ctx.fillStyle = '#a34d3f';
    rr(ctx, 880, 600, 320, 84, 12);
    ctx.fill();
    ctx.strokeStyle = '#e8b07e';
    ctx.lineWidth = 3;
    rr(ctx, 892, 610, 296, 64, 8);
    ctx.stroke();
  }

  function drawCounters(state) {
    const s = STATIONS;
    // Top counter run.
    ctx.fillStyle = PALETTE.counterEdge;
    rr(ctx, 40, 180, 1200, 78, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, 44, 184, 1192, 66, 8);
    ctx.fill();

    drawCrate(ctx, s.crateTomato, 'Tomato');
    drawCrate(ctx, s.crateLettuce, 'Lettuce');
    drawCrate(ctx, s.crateCheese, 'Cheese');
    drawCrate(ctx, s.cratePatty, 'Patty');
    drawCrate(ctx, s.crateBun, 'Bun');

    // Chopping board.
    ctx.fillStyle = '#8a5a2e';
    rr(ctx, s.board.x - 62, s.board.y - 26, 124, 52, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.board;
    rr(ctx, s.board.x - 56, s.board.y - 30, 112, 46, 6);
    ctx.fill();
    drawStationLabel(ctx, s.board, 'CHOP  (hold SPACE)');
    if (state.board.item !== null) {
      drawIngredient(ctx, state.board.item.kind, state.board.item.state, s.board.x - 18, s.board.y - 4, 17);
      drawProgressRing(ctx, s.board.x - 18, s.board.y - 4, 26, state.board.progress, '#3f9e4d');
      if (state.board.chopping) {
        // The knife, mid-chop.
        ctx.strokeStyle = '#cfd6de';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(s.board.x + 22, s.board.y - 26);
        ctx.lineTo(s.board.x + 40, s.board.y - 2);
        ctx.stroke();
      }
    } else {
      // Idle knife on the board.
      ctx.strokeStyle = '#cfd6de';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(s.board.x + 10, s.board.y - 18);
      ctx.lineTo(s.board.x + 38, s.board.y + 8);
      ctx.stroke();
      ctx.fillStyle = '#5a4632';
      ctx.fillRect(s.board.x + 34, s.board.y + 4, 14, 6);
    }

    // Grill.
    const hot = state.grill.item !== null;
    ctx.fillStyle = PALETTE.grill;
    rr(ctx, s.grill.x - 68, s.grill.y - 26, 136, 52, 8);
    ctx.fill();
    ctx.fillStyle = hot ? PALETTE.grillHot : '#22262e';
    rr(ctx, s.grill.x - 60, s.grill.y - 20, 120, 40, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(s.grill.x + i * 24, s.grill.y - 18);
      ctx.lineTo(s.grill.x + i * 24, s.grill.y + 18);
      ctx.stroke();
    }
    drawStationLabel(ctx, s.grill, 'GRILL');
    if (state.grill.item !== null) {
      drawIngredient(ctx, 'patty', state.grill.item.state, s.grill.x, s.grill.y, 19);
      const frac = state.grill.cooked ? 1 : state.grill.progress;
      drawProgressRing(ctx, s.grill.x, s.grill.y, 28, frac, state.grill.item.state === 'burnt' ? '#d64541' : '#ff7a3c');
      if (state.grill.cooked && state.grill.item.state === 'grilled') text(ctx, 'READY!', s.grill.x, s.grill.y + s.grill.h / 2 + 16, 14, '#ffe9b8', 'center');
      if (state.grill.item.state === 'burnt') text(ctx, 'BURNT!', s.grill.x, s.grill.y + s.grill.h / 2 + 16, 14, '#ff9a8a', 'center');
    }

    // Trash.
    ctx.fillStyle = '#4a4f58';
    rr(ctx, s.trash.x - 34, s.trash.y - 30, 68, 60, 8);
    ctx.fill();
    ctx.fillStyle = '#33373f';
    rr(ctx, s.trash.x - 34, s.trash.y - 30, 68, 12, 6);
    ctx.fill();
    text(ctx, '🗑', s.trash.x, s.trash.y + 2, 26, '#fff', 'center');
    drawStationLabel(ctx, s.trash, 'TRASH');

    // Plating counter.
    const ready = state.plate.items.length > 0 && state.orders.some((o) => plateMatches(state.plate.items, o.recipe));
    ctx.fillStyle = ready ? '#3f9e4d' : PALETTE.counterEdge;
    rr(ctx, s.plate.x - s.plate.w / 2, s.plate.y - s.plate.h / 2, s.plate.w, s.plate.h, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, s.plate.x - s.plate.w / 2 + 5, s.plate.y - s.plate.h / 2 + 5, s.plate.w - 10, s.plate.h - 10, 9);
    ctx.fill();
    drawStationLabel(ctx, s.plate, 'PLATING');
    drawPlate(ctx, state.plate.items, s.plate.x, s.plate.y + 6, 46);
    if (state.plate.items.length === 0) text(ctx, 'plate dishes here', s.plate.x, s.plate.y + 6, 13, PALETTE.muted, 'center');
    if (ready) text(ctx, '✓ READY — pick it up!', s.plate.x, s.plate.y + s.plate.h / 2 + 16, 14, '#2e7d32', 'center');

    // Serving window.
    const heldPlate = state.chef.held !== null && state.chef.held.kind === 'plate';
    const canServe = heldPlate && state.orders.some((o) => plateMatches(state.chef.held.items, o.recipe));
    ctx.fillStyle = canServe ? '#3f9e4d' : PALETTE.window;
    rr(ctx, s.window.x - s.window.w / 2, s.window.y - s.window.h / 2, s.window.w, s.window.h, 12);
    ctx.fill();
    ctx.fillStyle = '#dcebfb';
    rr(ctx, s.window.x - s.window.w / 2 + 8, s.window.y - s.window.h / 2 + 8, s.window.w - 16, s.window.h - 30, 8);
    ctx.fill();
    text(ctx, '— SERVE —', s.window.x, s.window.y - s.window.h / 2 + 20, 15, '#2f6db3', 'center');
    text(ctx, canServe ? '✓ THIS ONE!' : 'bring a finished plate', s.window.x, s.window.y + s.window.h / 2 - 16, 13, canServe ? '#eaffea' : PALETTE.textLight, 'center');
    // Service bell.
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.arc(s.window.x + s.window.w / 2 - 22, s.window.y - s.window.h / 2 + 20, 9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(s.window.x + s.window.w / 2 - 31, s.window.y - s.window.h / 2 + 20, 18, 3);
  }

  /** A white plate with the given items arranged on it. */
  function drawPlate(ctx, items, x, y, w) {
    ctx.fillStyle = '#d8d8d0';
    ellipse(ctx, x, y + 4, w / 2, w / 5.2);
    ctx.fill();
    ctx.fillStyle = PALETTE.plate;
    ellipse(ctx, x, y, w / 2, w / 5.2);
    ctx.fill();
    ctx.strokeStyle = '#c9c9bd';
    ctx.lineWidth = 2;
    ellipse(ctx, x, y, w / 2 - 6, w / 5.2 - 4);
    ctx.stroke();
    const n = items.length;
    items.forEach((item, i) => {
      const ix = x + (n === 1 ? 0 : (i - (n - 1) / 2) * (w / (n + 1.2)));
      drawIngredient(ctx, item.kind, item.state, ix, y - 4, 13);
    });
  }

  function drawChef(state) {
    const chef = state.chef;
    const { x, y } = chef;
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipse(ctx, x, y + 24, 26, 9);
    ctx.fill();
    // Body.
    ctx.fillStyle = PALETTE.chefShirt;
    ctx.beginPath();
    ctx.arc(x, y + 4, 24, 0, Math.PI * 2);
    ctx.fill();
    // Apron.
    ctx.fillStyle = PALETTE.chefApron;
    rr(ctx, x - 13, y - 2, 26, 24, 8);
    ctx.fill();
    ctx.strokeStyle = '#c9c9bd';
    ctx.lineWidth = 1.5;
    rr(ctx, x - 13, y - 2, 26, 24, 8);
    ctx.stroke();
    // Head.
    ctx.fillStyle = PALETTE.chefSkin;
    ctx.beginPath();
    ctx.arc(x, y - 22, 15, 0, Math.PI * 2);
    ctx.fill();
    // Eyes look where the chef faces.
    ctx.fillStyle = '#2e1f14';
    ctx.beginPath();
    ctx.arc(x - 5 + chef.face * 2, y - 24, 2, 0, Math.PI * 2);
    ctx.arc(x + 5 + chef.face * 2, y - 24, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e1f14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + chef.face * 2, y - 16, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Toque.
    ctx.fillStyle = PALETTE.chefHat;
    rr(ctx, x - 15, y - 48, 30, 16, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 9, y - 48, 7, Math.PI, 0);
    ctx.arc(x, y - 51, 8, Math.PI, 0);
    ctx.arc(x + 9, y - 48, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d8d8d0';
    ctx.fillRect(x - 15, y - 34, 30, 4);
    // Held item, carried overhead.
    if (chef.held !== null) {
      const hx = x;
      const hy = y - 66;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(hx, hy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a86a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, 24, 0, Math.PI * 2);
      ctx.stroke();
      if (chef.held.kind === 'plate') drawPlate(ctx, chef.held.items, hx, hy + 2, 34);
      else drawIngredient(ctx, chef.held.kind, chef.held.state, hx, hy, 15);
    }
    // Walk target marker.
    if (chef.target !== null) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(chef.target.x, chef.target.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(chef.target.x - 12, chef.target.y);
      ctx.lineTo(chef.target.x + 12, chef.target.y);
      ctx.moveTo(chef.target.x, chef.target.y - 12);
      ctx.lineTo(chef.target.x, chef.target.y + 12);
      ctx.stroke();
    }
  }

  function drawOrders(state, now) {
    const x0 = 16;
    const w = 196;
    const gap = 8;
    text(ctx, 'ORDER BOARD', x0 + 4, 78, 15, PALETTE.textLight, 'left');
    if (state.orders.length === 0) {
      text(ctx, 'No orders yet — the lunch crowd is coming…', x0 + 130, 118, 15, PALETTE.textLight, 'left');
    }
    state.orders.forEach((order, i) => {
      const x = x0 + i * (w + gap);
      const y = 92;
      const h = 62;
      const urgent = order.timeLeft < 15;
      ctx.fillStyle = urgent && Math.floor(now * 4) % 2 === 0 ? '#ffe1de' : PALETTE.ticket;
      rr(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ticketEdge;
      ctx.lineWidth = 2;
      rr(ctx, x, y, w, h, 10);
      ctx.stroke();
      text(ctx, `#${order.id} ${order.recipe.name}`, x + 10, y + 14, 14, PALETTE.text, 'left');
      text(ctx, `$${order.recipe.price}`, x + w - 10, y + 14, 14, '#8a6a1d', 'right');
      order.recipe.items.forEach((item, j) => {
        drawIngredient(ctx, item.kind, item.state, x + 22 + j * 34, y + 36, 12);
      });
      const frac = Math.max(0, order.timeLeft / 60);
      ctx.fillStyle = '#e8dcc4';
      rr(ctx, x + 10, y + h - 12, w - 20, 6, 3);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#3f9e4d' : frac > 0.25 ? '#e8a13c' : '#d64541';
      rr(ctx, x + 10, y + h - 12, (w - 20) * frac, 6, 3);
      ctx.fill();
      text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 10, y + h - 16, 11, urgent ? '#d64541' : PALETTE.muted, 'right');
    });
  }

  function drawHud(state) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, FIELD.width, 56);
    text(ctx, '🍳 SIZZLE & SERVE', 16, 29, 22, PALETTE.hudText, 'left');
    const remain = Math.max(0, 150 - state.elapsed);
    const mm = Math.floor(remain / 60);
    const ss = Math.floor(remain % 60).toString().padStart(2, '0');
    text(ctx, `⏱ ${mm}:${ss}`, 560, 29, 22, remain < 30 ? '#ff9a8a' : PALETTE.hudText, 'center');
    // Shift progress bar.
    ctx.fillStyle = '#5a4632';
    rr(ctx, 640, 20, 220, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#f2c230';
    rr(ctx, 640, 20, 220 * (state.elapsed / 150), 16, 8);
    ctx.fill();
    text(ctx, `Lv ${state.level}`, 880, 29, 18, PALETTE.hudText, 'left');
    text(ctx, `⭐ ${state.score}`, 980, 29, 22, PALETTE.hudText, 'left');
    text(ctx, `🍽 ${state.dishes}`, 1095, 29, 16, PALETTE.hudText, 'left');
    // Hearts.
    for (let i = 0; i < 3; i += 1) {
      text(ctx, i < state.hearts ? '❤' : '♡', 1175 + i * 28, 29, 20, i < state.hearts ? '#ff6b81' : '#7a5a3a', 'left');
    }
    // Combo.
    if (state.combo > 0 && state.comboTimer > 0) {
      text(ctx, `🔥 COMBO x${state.combo + 1}`, 1000, 52, 14, '#ffb347', 'left');
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const p of state.popups) {
      ctx.globalAlpha = Math.min(1, p.life);
      text(ctx, p.text, p.x, p.y, 22, p.color, 'center');
    }
    ctx.globalAlpha = 1;
  }

  function drawHint(state, hint) {
    if (hint === null) return;
    ctx.fillStyle = 'rgba(46,31,20,0.85)';
    rr(ctx, FIELD.width / 2 - 260, FIELD.height - 46, 520, 32, 16);
    ctx.fill();
    text(ctx, hint, FIELD.width / 2, FIELD.height - 29, 15, '#ffe9b8', 'center');
  }

  function drawKitchen(state, now, hint) {
    drawFloor();
    drawCounters(state);
    drawChef(state);
    drawOrders(state, now);
    drawHud(state);
    drawParticles(state);
    drawHint(state, hint);
  }

  function overlay(alpha) {
    ctx.fillStyle = `rgba(20,12,6,${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(255,246,223,0.97)';
    rr(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = '#d9b36c';
    ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    drawKitchen(state, 0, null);
    overlay(0.45);
    panel(FIELD.width / 2 - 330, 120, 660, 300);
    text(ctx, '🍳 SIZZLE & SERVE', FIELD.width / 2, 175, 44, PALETTE.text, 'center');
    text(ctx, 'Run the busiest little kitchen in town.', FIELD.width / 2, 222, 19, PALETTE.muted, 'center');
    const lines = [
      'WASD / ←→↑↓ — move the chef      SPACE / E — use a station',
      'Click a spot to walk there · Click a station to use it',
      'Grab ingredients → chop on the board, grill the patty,',
      'stack the plate, and serve it at the window before',
      'the order timer runs out. 3 expired orders end the shift!',
    ];
    lines.forEach((line, i) => text(ctx, line, FIELD.width / 2, 262 + i * 26, 16, PALETTE.text, 'center'));
    text(ctx, 'Press SPACE or click to start  ·  P pause  ·  M mute', FIELD.width / 2, 392, 16, '#8a6a1d', 'center');
    if (best > 0) text(ctx, `Best shift so far: ⭐ ${best}`, FIELD.width / 2, 440, 18, '#3f7d33', 'center');
  }

  function drawPaused(state) {
    drawKitchen(state, 0, null);
    overlay(0.5);
    panel(FIELD.width / 2 - 220, FIELD.height / 2 - 90, 440, 180);
    text(ctx, 'PAUSED', FIELD.width / 2, FIELD.height / 2 - 40, 40, PALETTE.text, 'center');
    text(ctx, 'Press P or ESC to keep cooking', FIELD.width / 2, FIELD.height / 2 + 12, 17, PALETTE.muted, 'center');
    text(ctx, 'M — mute · R — restart the shift', FIELD.width / 2, FIELD.height / 2 + 44, 15, PALETTE.muted, 'center');
  }

  function drawOver(state, best, isBest) {
    drawKitchen(state, 0, null);
    overlay(0.5);
    panel(FIELD.width / 2 - 330, 130, 660, 330);
    text(ctx, 'SHIFT OVER', FIELD.width / 2, 185, 40, PALETTE.text, 'center');
    text(ctx, state.overReason, FIELD.width / 2, 228, 16, PALETTE.muted, 'center');
    text(ctx, `⭐ Score  ${state.score}`, FIELD.width / 2, 282, 28, PALETTE.text, 'center');
    text(ctx, `🍽 Dishes served  ${state.dishes}      ❤ Hearts left  ${state.hearts}`, FIELD.width / 2, 322, 18, PALETTE.text, 'center');
    const stars = state.dishes >= 12 ? '★★★' : state.dishes >= 8 ? '★★☆' : state.dishes >= 4 ? '★☆☆' : '☆☆☆';
    text(ctx, stars, FIELD.width / 2, 362, 34, '#e8a13c', 'center');
    if (isBest) text(ctx, '🏆 New best shift!', FIELD.width / 2, 398, 18, '#3f7d33', 'center');
    else text(ctx, `Best shift: ⭐ ${best}`, FIELD.width / 2, 398, 18, PALETTE.muted, 'center');
    text(ctx, 'Press SPACE or R to cook another shift', FIELD.width / 2, 434, 16, '#8a6a1d', 'center');
  }

  function draw(state, screen, extras) {
    if (screen === SCREEN_TITLE) drawTitle(state, extras.best);
    else if (screen === SCREEN_PAUSED) drawPaused(state);
    else if (screen === SCREEN_OVER) drawOver(state, extras.best, extras.isBest);
    else drawKitchen(state, extras.now, extras.hint);
  }

  return { draw, resize };
}
