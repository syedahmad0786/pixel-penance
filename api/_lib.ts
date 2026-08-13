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

function hex16(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function visitorKey(req: Request): Promise<string> {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "anon";
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`pixel-penance:${ip}`),
  );
  return hex16(buf);
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

function parseState(raw: unknown): PenanceState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<PenanceState>;
  if (!Array.isArray(o.pixels) || o.pixels.length !== WIDTH * HEIGHT) return null;
  const pixels = o.pixels.map((n) =>
    Number.isInteger(n) && n >= 0 && n < PALETTE.length ? n : BEIGE,
  );
  const history = Array.isArray(o.history) ? o.history.slice(-HISTORY_CAP) : [];
  const cooldowns =
    o.cooldowns && typeof o.cooldowns === "object" && !Array.isArray(o.cooldowns)
      ? o.cooldowns
      : {};
  return { pixels, history, cooldowns };
}

function env(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[name];
}

function hasKvEnv(): boolean {
  return Boolean(env("KV_REST_API_URL") || env("KV_URL") || env("UPSTASH_REDIS_REST_URL"));
}

async function readBlob(): Promise<PenanceState | null> {
  const { get } = await import("@vercel/blob");
  const result = await get("penance.json", { access: "public", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  const parsed = parseState(JSON.parse(text) as unknown);
  if (!parsed) throw new Error("penance.json is not a 128×128 canvas");
  return parsed;
}

async function writeBlob(state: PenanceState): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put("penance.json", JSON.stringify(state), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: env("BLOB_READ_WRITE_TOKEN"),
  });
}

async function readKv(): Promise<PenanceState | null> {
  const { kv } = await import("@vercel/kv");
  return parseState(await kv.get("penance"));
}

async function writeKv(state: PenanceState): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set("penance", state);
}

function memoryState(): PenanceState {
  const g = globalThis as PenanceGlobal;
  if (!g.__penanceState) g.__penanceState = emptyState();
  return g.__penanceState;
}

export async function loadState(): Promise<PenanceState> {
  if (env("BLOB_READ_WRITE_TOKEN")) {
    try {
      const loaded = await readBlob();
      if (loaded) return loaded;
      const seeded = emptyState();
      await writeBlob(seeded);
      return seeded;
    } catch (err) {
      console.error("penance blob load failed", err);
    }
  }
  if (hasKvEnv()) {
    try {
      const loaded = await readKv();
      if (loaded) return loaded;
      const seeded = emptyState();
      await writeKv(seeded);
      return seeded;
    } catch (err) {
      console.error("penance kv load failed", err);
    }
  }
  return memoryState();
}

export async function saveState(state: PenanceState): Promise<void> {
  (globalThis as PenanceGlobal).__penanceState = state;
  if (env("BLOB_READ_WRITE_TOKEN")) {
    try {
      await writeBlob(state);
      return;
    } catch (err) {
      console.error("penance blob save failed", err);
    }
  }
  if (hasKvEnv()) {
    try {
      await writeKv(state);
      return;
    } catch (err) {
      console.error("penance kv save failed", err);
    }
  }
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
