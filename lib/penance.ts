export const WIDTH = 128;
export const HEIGHT = 128;
export const COOLDOWN_MS = 180_000;
export const HISTORY_CAP = 80;
export const WAIT_TTL = 20_000;

export const PALETTE: string[] = [
  "#111111",
  "#F7F1E1",
  "#BE0039",
  "#E07A3D",
  "#E5D900",
  "#6AA329",
  "#2D9C9C",
  "#2450A4",
  "#811E9F",
  "#FF99AA",
  "#6B4423",
  "#C4A574",
  "#3D5C3A",
  "#6D001A",
  "#1A2744",
  "#888888",
];

export type Placement = { x: number; y: number; color: number; t: number };

export type PenanceState = {
  pixels: number[];
  history: Placement[];
  cooldowns: Record<string, number>;
};

export type PlaceOk = {
  ok: true;
  x: number;
  y: number;
  color: number;
  remaining: number;
};

export type PlaceWait = { ok: false; remaining: number };

type PenanceGlobal = typeof globalThis & {
  __penanceState?: PenanceState;
  __penanceQueue?: Promise<unknown>;
  __penanceWaiting?: Map<string, number>;
};

const BEIGE = 11;
const GREY = 15;
const BROWN = 10;
const WHITE = 1;
const MAROON = 13;
const NAVY = 14;
const YELLOW = 4;
const ORANGE = 3;

function setPx(p: number[], x: number, y: number, c: number): void {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  p[y * WIDTH + x] = c;
}

function ring(p: number[]): void {
  for (let i = 0; i < WIDTH; i++) {
    for (let k = 0; k < 2; k++) {
      setPx(p, i, k, GREY);
      setPx(p, i, HEIGHT - 1 - k, GREY);
      setPx(p, k, i, GREY);
      setPx(p, WIDTH - 1 - k, i, GREY);
    }
  }
}

function nave(p: number[]): void {
  for (let y = 28; y < 120; y++) {
    for (let x = 61; x <= 66; x++) setPx(p, x, y, WHITE);
    setPx(p, 60, y, GREY);
    setPx(p, 67, y, GREY);
  }
}

function transept(p: number[]): void {
  for (let y = 40; y <= 47; y++) {
    for (let x = 18; x <= 109; x++) {
      if (x < 60 || x > 67) setPx(p, x, y, WHITE);
    }
    setPx(p, 17, y, GREY);
    setPx(p, 110, y, GREY);
  }
}

function apse(p: number[]): void {
  for (let y = 8; y < 28; y++) {
    for (let x = 48; x <= 79; x++) {
      const dx = x - 63.5;
      const dy = y - 18;
      if (dx * dx + dy * dy * 1.4 < 280) setPx(p, x, y, GREY);
      if (dx * dx + dy * dy * 1.4 < 180) setPx(p, x, y, BEIGE);
    }
  }
  for (let y = 14; y <= 20; y++) {
    for (let x = 58; x <= 69; x++) setPx(p, x, y, MAROON);
  }
  setPx(p, 56, 16, YELLOW);
  setPx(p, 57, 16, ORANGE);
  setPx(p, 70, 16, YELLOW);
  setPx(p, 71, 16, ORANGE);
  for (let y = 15; y <= 19; y++) setPx(p, 63, y, YELLOW);
  for (let x = 61; x <= 66; x++) setPx(p, x, 16, YELLOW);
}

function pews(p: number[]): void {
  for (let y = 56; y <= 112; y += 4) {
    for (let x = 20; x <= 56; x++) setPx(p, x, y, BROWN);
    for (let x = 71; x <= 107; x++) setPx(p, x, y, BROWN);
  }
}

function columns(p: number[]): void {
  const spots = [
    [58, 39],
    [69, 39],
    [58, 48],
    [69, 48],
    [58, 80],
    [69, 80],
    [58, 112],
    [69, 112],
    [24, 39],
    [103, 39],
  ];
  for (const [x, y] of spots) {
    setPx(p, x, y, NAVY);
    setPx(p, x + 1, y, NAVY);
    setPx(p, x, y + 1, NAVY);
    setPx(p, x + 1, y + 1, NAVY);
  }
}

export function foundingFloor(): number[] {
  const p = new Array(WIDTH * HEIGHT).fill(BEIGE);
  ring(p);
  nave(p);
  transept(p);
  apse(p);
  pews(p);
  columns(p);
  return p;
}

export function emptyState(): PenanceState {
  return { pixels: foundingFloor(), history: [], cooldowns: {} };
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export function visitorKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "anon";
  const s = `pixel-penance:${ip}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function remainingMs(state: PenanceState, key: string): number {
  const last = state.cooldowns[key] ?? 0;
  return Math.max(0, last + COOLDOWN_MS - Date.now());
}

export function pruneCooldowns(state: PenanceState): void {
  const now = Date.now();
  for (const key of Object.keys(state.cooldowns)) {
    if (now - state.cooldowns[key] > COOLDOWN_MS) delete state.cooldowns[key];
  }
}

export function parsePlace(input: unknown): { x: number; y: number; color: number } | null {
  if (!input || typeof input !== "object") return null;
  const rec = input as Record<string, unknown>;
  const x = rec.x;
  const y = rec.y;
  const color = rec.color;
  if (typeof x !== "number" || typeof y !== "number" || typeof color !== "number") return null;
  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(color)) return null;
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return null;
  if (color < 0 || color >= PALETTE.length) return null;
  return { x, y, color };
}

export function applyPlace(
  state: PenanceState,
  key: string,
  body: { x: number; y: number; color: number },
): PlaceOk | PlaceWait {
  const wait = remainingMs(state, key);
  if (wait > 0) return { ok: false, remaining: wait };
  state.pixels[body.y * WIDTH + body.x] = body.color;
  state.cooldowns[key] = Date.now();
  state.history.push({ x: body.x, y: body.y, color: body.color, t: Date.now() });
  if (state.history.length > HISTORY_CAP) {
    state.history.splice(0, state.history.length - HISTORY_CAP);
  }
  pruneCooldowns(state);
  return { ok: true, remaining: COOLDOWN_MS, x: body.x, y: body.y, color: body.color };
}

function memoryState(): PenanceState {
  const g = globalThis as PenanceGlobal;
  if (!g.__penanceState) g.__penanceState = emptyState();
  return g.__penanceState;
}

export async function loadState(): Promise<PenanceState> {
  return memoryState();
}

export async function saveState(state: PenanceState): Promise<void> {
  (globalThis as PenanceGlobal).__penanceState = state;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const g = globalThis as PenanceGlobal;
  const next = (g.__penanceQueue ?? Promise.resolve()).then(fn, fn);
  g.__penanceQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function mutate<T>(fn: (state: PenanceState) => T): Promise<T> {
  return enqueue(async () => {
    const state = await loadState();
    const out = fn(state);
    await saveState(state);
    return out;
  });
}

export function pingWaiting(key: string): number {
  const g = globalThis as PenanceGlobal;
  if (!g.__penanceWaiting) g.__penanceWaiting = new Map();
  const now = Date.now();
  g.__penanceWaiting.set(key, now);
  for (const [k, t] of g.__penanceWaiting) {
    if (now - t > WAIT_TTL) g.__penanceWaiting.delete(k);
  }
  return g.__penanceWaiting.size;
}
