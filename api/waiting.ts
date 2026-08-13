import { json, pingWaiting, visitorKey } from "./_lib";

export async function GET(req: Request): Promise<Response> {
  const key = await visitorKey(req);
  return json({ waiting: pingWaiting(key) });
}
