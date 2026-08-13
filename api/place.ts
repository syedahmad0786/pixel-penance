import { applyPlace, json, mutate, parsePlace, visitorKey } from "./_lib";

export async function POST(req: Request): Promise<Response> {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json({ error: "invalid" }, 400);
    }
    const body = parsePlace(raw);
    if (!body) return json({ error: "invalid" }, 400);
    const key = await visitorKey(req);
    const result = await mutate((state) => applyPlace(state, key, body));
    if (!result.ok) return json({ error: "cooldown", remaining: result.remaining }, 429);
    return json({
      ok: true,
      x: result.x,
      y: result.y,
      color: result.color,
      remaining: result.remaining,
    });
  } catch (err) {
    console.error("place POST", err);
    return json({ error: "unavailable" }, 503);
  }
}
