/** 16 colours, r/place-ish, parish-muted. Beige is the guilt example: #C4A574 */
export const PALETTE = [
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
] as const;

export const NAMES = [
  "black",
  "white",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
  "beige",
  "forest",
  "maroon",
  "navy",
  "grey",
] as const;

export const WIDTH = 128;
export const HEIGHT = 128;
export const COOLDOWN_MS = 180_000;

function hexRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

export const RGB = PALETTE.map(hexRgb);

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

/** Seeded nave so the canvas is never a blank sin of white. Keep in sync with api/_lib.ts */
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
