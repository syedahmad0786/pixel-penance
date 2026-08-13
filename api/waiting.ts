import { json, pingWaiting, visitorKey } from "./_lib";

export async function GET(req: Request): Promise<Response> {
  try {
    const key = await visitorKey(req);
    return json({ waiting: pingWaiting(key) });
  } catch (err) {
    console.error("waiting GET", err);
    return json({ waiting: 1 });
  }
}
