import { HISTORY_CAP, json, loadState } from "../lib/penance";

export async function GET(): Promise<Response> {
  try {
    const state = await loadState();
    return json(state.history.slice(-HISTORY_CAP));
  } catch (err) {
    console.error("history GET", err);
    return json([]);
  }
}
