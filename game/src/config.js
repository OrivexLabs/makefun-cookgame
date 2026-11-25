// Sizzle & Serve: every tuning number, colour and recipe in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts this long; the end screen shows when it runs out. */
export const SHIFT_SECONDS = 150;

export const CHEF = {
  radius: 26,
  speed: 300,
  interactRange: 78,
};

export const HEARTS = 3;

/** Seconds an order waits before it expires and costs a heart. */
export const ORDER_TIME = 60;
/** Seconds between new orders at level 1; each level multiplies it by this. */
export const ORDER_INTERVAL = 15;
export const ORDER_INTERVAL_SCALE = 0.86;
export const ORDER_INTERVAL_MIN = 7;
export const MAX_ORDERS = 4;
/** A level lasts this long; each level spawns orders faster and pays a little more. */
export const LEVEL_SECONDS = 45;

export const CHOP_SECONDS = 1.2;
export const GRILL_SECONDS = 4;
export const GRILL_BURN_AFTER = 6;

export const SCORE_SERVE = 100;
export const SCORE_TIP_MAX = 50;
export const SCORE_WRONG = -25;

export const PALETTE = {
  wall: '#7a4a2b',
  wallTop: '#8d5a35',
  floor: '#c98f5f',
  floorDark: '#bd8252',
  counter: '#e8b07e',
  counterTop: '#f6d3a0',
  counterEdge: '#a06a35',
  board: '#d9a066',
  grill: '#3a3f4a',
  grillHot: '#ff7a3c',
  plate: '#fdfdf6',
  text: '#2e1f14',
  textLight: '#fff8ec',
  muted: '#8a6a4d',
  ticket: '#fff6df',
  ticketEdge: '#d9b36c',
  hud: '#3d2b1a',
  hudText: '#ffe9b8',
  good: '#3f9e4d',
  warn: '#e8a13c',
  bad: '#d64541',
  chefHat: '#fdfdf6',
  chefShirt: '#4a90d9',
  chefApron: '#f2f2f2',
  chefSkin: '#f2c09a',
  window: '#2f6db3',
};

/** Ingredient kinds. `prep` says what a raw item needs before it can be plated. */
export const INGREDIENTS = {
  tomato: { name: 'Tomato', prep: 'chop', color: '#e2483d', dark: '#b32d24', light: '#ff7a6e' },
  lettuce: { name: 'Lettuce', prep: 'chop', color: '#69b455', dark: '#3f7d33', light: '#a5dd8f' },
  cheese: { name: 'Cheese', prep: 'none', color: '#f2c230', dark: '#c99a17', light: '#ffe082' },
  patty: { name: 'Patty', prep: 'grill', color: '#8a5a33', dark: '#5f3a1e', light: '#b07a4a' },
  bun: { name: 'Bun', prep: 'none', color: '#e8a85c', dark: '#b57a35', light: '#ffd9a0' },
};

/**
 * Recipes: a dish is a set of prepared ingredients. `items` lists the ingredient
 * kind and the state it must be in on the plate; a plate matches an order when its
 * contents are exactly that set, in any order.
 */
export const RECIPES = [
  { id: 'salad', name: 'Garden Salad', price: 8, items: [
    { kind: 'lettuce', state: 'chopped' },
    { kind: 'tomato', state: 'chopped' },
  ] },
  { id: 'burger', name: 'Classic Burger', price: 12, items: [
    { kind: 'bun', state: 'raw' },
    { kind: 'patty', state: 'grilled' },
    { kind: 'lettuce', state: 'chopped' },
  ] },
  { id: 'cheeseburger', name: 'Cheese Burger', price: 14, items: [
    { kind: 'bun', state: 'raw' },
    { kind: 'patty', state: 'grilled' },
    { kind: 'cheese', state: 'raw' },
  ] },
  { id: 'melt', name: 'Veggie Melt', price: 11, items: [
    { kind: 'bun', state: 'raw' },
    { kind: 'tomato', state: 'chopped' },
    { kind: 'cheese', state: 'raw' },
  ] },
  { id: 'stack', name: 'Garden Stack', price: 15, items: [
    { kind: 'bun', state: 'raw' },
    { kind: 'lettuce', state: 'chopped' },
    { kind: 'tomato', state: 'chopped' },
    { kind: 'cheese', state: 'raw' },
  ] },
];

/**
 * Kitchen stations, in logical coordinates. `x, y` is the centre of the counter
 * face the chef stands at; `w, h` is the counter block. The chef walks the floor
 * below y = 250 and interacts from in front of a station.
 */
export const STATIONS = {
  crateTomato: { kind: 'crate', item: 'tomato', x: 110, y: 219, w: 110, h: 76 },
  crateLettuce: { kind: 'crate', item: 'lettuce', x: 235, y: 219, w: 110, h: 76 },
  crateCheese: { kind: 'crate', item: 'cheese', x: 360, y: 219, w: 110, h: 76 },
  cratePatty: { kind: 'crate', item: 'patty', x: 485, y: 219, w: 110, h: 76 },
  crateBun: { kind: 'crate', item: 'bun', x: 610, y: 219, w: 110, h: 76 },
  board: { kind: 'board', x: 800, y: 219, w: 150, h: 76 },
  grill: { kind: 'grill', x: 1000, y: 219, w: 150, h: 76 },
  trash: { kind: 'trash', x: 1195, y: 219, w: 90, h: 76 },
  plate: { kind: 'plate', x: 250, y: 470, w: 220, h: 90 },
  window: { kind: 'window', x: 1010, y: 470, w: 260, h: 90 },
};

/** Where the best shift score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
