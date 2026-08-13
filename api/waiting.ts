export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ waiting: 1 }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}
