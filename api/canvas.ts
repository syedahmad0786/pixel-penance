import {
  HEIGHT,
  PALETTE,
  WIDTH,
  emptyState,
  json,
  loadState,
  remainingMs,
  visitorKey,
} from "../lib/penance";

export async function GET(req: Request): Promise<Response> {
  try {
    const state = await loadState();
    const key = visitorKey(req);
    return json({
      width: WIDTH,
      height: HEIGHT,
      palette: PALETTE,
      pixels: state.pixels,
      remaining: remainingMs(state, key),
    });
  } catch (err) {
    console.error("canvas GET", err);
    return json({
      width: WIDTH,
      height: HEIGHT,
      palette: PALETTE,
      pixels: emptyState().pixels,
      remaining: 0,
    });
  }
}
