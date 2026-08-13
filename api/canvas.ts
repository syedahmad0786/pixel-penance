import { HEIGHT, PALETTE, WIDTH, json, loadState, remainingMs, visitorKey } from "./_lib";

export async function GET(req: Request): Promise<Response> {
  const state = await loadState();
  const key = await visitorKey(req);
  return json({
    width: WIDTH,
    height: HEIGHT,
    palette: PALETTE,
    pixels: state.pixels,
    remaining: remainingMs(state, key),
  });
}
