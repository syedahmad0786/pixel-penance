import "./style.css";
import {
  COOLDOWN_MS,
  HEIGHT,
  NAMES,
  PALETTE,
  RGB,
  WIDTH,
  foundingFloor,
} from "./palette";

type Placement = { x: number; y: number; color: number; t: number };

type CanvasPayload = {
  width: number;
  height: number;
  palette: string[];
  pixels: number[];
  remaining?: number;
};

const UNTIL_KEY = "pixel-penance:until";
const MIN_Z = 2;
const MAX_Z = 12;

const art = $<HTMLCanvasElement>("#art");
const ctx = art.getContext("2d", { willReadFrequently: true })!;
const viewport = $<HTMLElement>("#viewport");
const sel = $<HTMLElement>("#sel");
const swatches = $<HTMLElement>("#swatches");
const chosen = $<HTMLElement>("#chosen");
const coord = $<HTMLElement>("#coord");
const placeBtn = $<HTMLButtonElement>("#place");
const exportBtn = $<HTMLButtonElement>("#export-png");
const nearer = $<HTMLButtonElement>("#nearer");
const farther = $<HTMLButtonElement>("#farther");
const zoomRead = $<HTMLElement>("#zoom-read");
const candle = $<HTMLElement>("#candle");
const flame = $<HTMLElement>("#flame");
const coolMsg = $<HTMLElement>("#cool-msg");
const guilt = $<HTMLElement>("#guilt");
const ticker = $<HTMLElement>("#ticker");
const waitingEl = $<HTMLElement>("#waiting");
const hintEl = $<HTMLElement>("#hint");
const nave = $<HTMLElement>("#nave");
const ledger = $<HTMLElement>("#ledger");
const ledgerBody = $<HTMLElement>("#ledger-body");
const ledgerEmpty = $<HTMLElement>("#ledger-empty");

ctx.imageSmoothingEnabled = false;

let pixels = foundingFloor();
let color = 0;
let scale = 4;
let selected: { x: number; y: number } | null = null;
let until = 0;
let canvasOnce = false;
let drag: { x: number; y: number; sl: number; st: number; moved: boolean } | null = null;

function $<T extends HTMLElement>(selStr: string): T {
  const el = document.querySelector(selStr);
  if (!el) throw new Error(`missing ${selStr}`);
  return el as T;
}

function hint(text: string): void {
  hintEl.textContent = text;
}

function paint(): void {
  const img = ctx.createImageData(WIDTH, HEIGHT);
  const d = img.data;
  for (let i = 0; i < pixels.length; i++) {
    const rgb = RGB[pixels[i] ?? 11] ?? RGB[11];
    const o = i * 4;
    d[o] = rgb[0];
    d[o + 1] = rgb[1];
    d[o + 2] = rgb[2];
    d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function applyZoom(): void {
  const px = `${WIDTH * scale}px`;
  art.style.width = px;
  art.style.height = px;
  zoomRead.textContent = `×${scale}`;
  updateSel();
}

function updateSel(): void {
  if (!selected) {
    sel.hidden = true;
    coord.textContent = "No square selected. Point, then be still.";
    return;
  }
  sel.hidden = false;
  sel.style.left = `${selected.x * scale}px`;
  sel.style.top = `${selected.y * scale}px`;
  sel.style.width = `${scale}px`;
  sel.style.height = `${scale}px`;
  coord.textContent = `Square (${selected.x}, ${selected.y}). One will do.`;
}

function setColor(i: number): void {
  color = i;
  chosen.textContent = `Ink: ${PALETTE[i]} · ${NAMES[i]}`;
  swatches.querySelectorAll(".swatch").forEach((el, n) => {
    el.classList.toggle("on", n === i);
  });
}

function renderPalette(): void {
  swatches.replaceChildren();
  PALETTE.forEach((hex, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.background = hex;
    b.title = `${NAMES[i]} ${hex}`;
    b.setAttribute("aria-label", `${NAMES[i]} ${hex}`);
    b.addEventListener("click", () => setColor(i));
    swatches.appendChild(b);
  });
  setColor(color);
}

function startCooldown(ms: number): void {
  until = Date.now() + Math.max(0, ms);
  try {
    localStorage.setItem(UNTIL_KEY, String(until));
  } catch {
    /* private mode */
  }
  tickCandle();
}

function setCandle(remaining: number): void {
  const burning = remaining > 0;
  candle.classList.toggle("ready", !burning);
  if (!burning) {
    flame.style.animation = "flicker 0.18s infinite alternate";
    flame.style.animationDelay = "0s";
    return;
  }
  const elapsed = Math.max(0, COOLDOWN_MS - remaining);
  flame.style.animation = `burn ${COOLDOWN_MS}ms linear forwards, flicker 0.18s infinite alternate`;
  flame.style.animationDelay = `-${elapsed}ms, 0ms`;
}

function tickCandle(): void {
  const left = Math.max(0, until - Date.now());
  setCandle(left);
  placeBtn.disabled = left > 0 || !selected;
  coolMsg.textContent = left
    ? `The candle is still burning. ${left} ms. Then you may trouble the floor again.`
    : "The candle has died. You may place one square. Only one.";
}

function zoomAt(cx: number, cy: number, next: number): void {
  const prev = scale;
  scale = Math.min(MAX_Z, Math.max(MIN_Z, next));
  if (scale === prev) return;
  const ratio = scale / prev;
  const r = viewport.getBoundingClientRect();
  const sx = viewport.scrollLeft + (cx - r.left);
  const sy = viewport.scrollTop + (cy - r.top);
  applyZoom();
  viewport.scrollLeft = sx * ratio - (cx - r.left);
  viewport.scrollTop = sy * ratio - (cy - r.top);
}

function pickSquare(e: PointerEvent): void {
  const r = art.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / (r.width / WIDTH));
  const y = Math.floor((e.clientY - r.top) / (r.height / HEIGHT));
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  selected = { x, y };
  updateSel();
  tickCandle();
  hint("One square. That one. Now choose a colour, if you must.");
}

function when(t: number): string {
  const d = Date.now() - t;
  if (d < 60_000) return "moments ago";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} min ago`;
  return "earlier";
}

function fillTicker(items: Placement[]): void {
  const line = items.length
    ? items.map((p) => `a soul left ${PALETTE[p.color] ?? "?"} at (${p.x}, ${p.y})`).join("  ·  ")
    : "The floor is quiet. The founding nave still shows.";
  ticker.textContent = `${line}   ·   ${line}   ·   `;
}

function fillLedger(items: Placement[]): void {
  ledgerBody.replaceChildren();
  if (!items.length) {
    ledgerEmpty.hidden = false;
    return;
  }
  ledgerEmpty.hidden = true;
  for (const p of items.slice().reverse()) {
    const tr = document.createElement("tr");
    const sq = document.createElement("td");
    sq.textContent = `(${p.x}, ${p.y})`;
    const ink = document.createElement("td");
    const chip = document.createElement("i");
    chip.className = "chip";
    chip.style.background = PALETTE[p.color] ?? "#888";
    ink.append(chip, document.createTextNode(PALETTE[p.color] ?? "?"));
    const tm = document.createElement("td");
    tm.textContent = when(p.t);
    tr.append(sq, ink, tm);
    ledgerBody.appendChild(tr);
  }
}

async function loadCanvas(): Promise<void> {
  try {
    const res = await fetch("/api/canvas", { cache: "no-store" });
    if (!res.ok) throw new Error("closed");
    const data = (await res.json()) as CanvasPayload;
    if (Array.isArray(data.pixels) && data.pixels.length === WIDTH * HEIGHT) {
      pixels = data.pixels;
      paint();
    }
    if (typeof data.remaining === "number") {
      const next = Date.now() + data.remaining;
      if (!canvasOnce || Math.abs(next - until) > 2000) startCooldown(data.remaining);
      canvasOnce = true;
    }
  } catch {
    hint("The vestry is offline. You are looking at the founding floor, which is not nothing.");
  }
}

async function loadHistory(): Promise<void> {
  try {
    const res = await fetch("/api/history", { cache: "no-store" });
    if (!res.ok) return;
    const items = (await res.json()) as Placement[];
    if (!Array.isArray(items)) return;
    fillTicker(items);
    fillLedger(items);
  } catch {
    /* the ticker can wait */
  }
}

async function loadWaiting(): Promise<void> {
  try {
    const res = await fetch("/api/waiting", { cache: "no-store" });
    const data = (await res.json()) as { waiting?: number };
    const n = Number(data.waiting) || 0;
    waitingEl.textContent =
      n <= 1
        ? "One soul currently hesitating — possibly you."
        : `${n} souls currently hesitating. None of them are in a hurry.`;
  } catch {
    waitingEl.textContent = "The usher cannot count the room just now.";
  }
}

async function place(): Promise<void> {
  if (!selected) {
    hint("Point to a square first. We are not mind-readers.");
    return;
  }
  const left = Math.max(0, until - Date.now());
  if (left > 0) {
    hint(`Sit. ${left} ms remain.`);
    return;
  }
  const res = await fetch("/api/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x: selected.x, y: selected.y, color }),
  });
  const data = (await res.json().catch(() => ({}))) as { remaining?: number };
  if (res.status === 429) {
    const ms = Number(data.remaining) || COOLDOWN_MS;
    startCooldown(ms);
    hint(`The usher caught your hand. ${ms} ms remain.`);
    return;
  }
  if (!res.ok) {
    hint("The doors are locked. Sit with the founding floor.");
    return;
  }
  pixels[selected.y * WIDTH + selected.x] = color;
  paint();
  startCooldown(COOLDOWN_MS);
  const hex = PALETTE[color];
  guilt.textContent = `You placed ${hex} at (${selected.x}, ${selected.y}) and walked away. The canvas remembers.`;
  hint("That will do. Do not make a habit of it.");
  void loadHistory();
}

function exportPng(): void {
  const out = document.createElement("canvas");
  out.width = 1024;
  out.height = 1024;
  const octx = out.getContext("2d");
  if (!octx) return;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(art, 0, 0, 1024, 1024);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pixel-penance.png";
    a.click();
    URL.revokeObjectURL(a.href);
    hint("A rubbing, 1024 across. Vanity, but the parish allows it.");
  });
}

function bindView(): void {
  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, scale + (e.deltaY > 0 ? -1 : 1));
    },
    { passive: false },
  );
  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = {
      x: e.clientX,
      y: e.clientY,
      sl: viewport.scrollLeft,
      st: viewport.scrollTop,
      moved: false,
    };
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) {
      viewport.scrollLeft = drag.sl - dx;
      viewport.scrollTop = drag.st - dy;
    }
  });
  viewport.addEventListener("pointerup", (e) => {
    const was = drag;
    drag = null;
    if (!was || was.moved) return;
    pickSquare(e);
  });
  nearer.addEventListener("click", () => zoomAt(innerWidth / 2, innerHeight / 2, scale + 1));
  farther.addEventListener("click", () => zoomAt(innerWidth / 2, innerHeight / 2, scale - 1));
  placeBtn.addEventListener("click", () => void place());
  exportBtn.addEventListener("click", exportPng);
}

function showRoute(): void {
  const path = location.pathname.replace(/\/$/, "");
  const isLedger = path.endsWith("/history");
  nave.hidden = isLedger;
  ledger.hidden = !isLedger;
}

async function boot(): Promise<void> {
  showRoute();
  renderPalette();
  applyZoom();
  paint();
  bindView();
  const stored = Number(localStorage.getItem(UNTIL_KEY) || 0);
  if (stored > Date.now()) startCooldown(stored - Date.now());
  await Promise.all([loadCanvas(), loadHistory(), loadWaiting()]);
  setInterval(() => void loadWaiting(), 15_000);
  setInterval(() => void loadHistory(), 15_000);
  setInterval(() => void loadCanvas(), 30_000);
  setInterval(tickCandle, 250);
  tickCandle();
}

void boot();
