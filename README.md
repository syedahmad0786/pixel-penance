# Pixel Penance

Accession **FT–016**. A collaborative slow canvas: 128×128, sixteen inks, one pixel every three minutes per visitor. Parish-bulletin conscience copy. Church bulletin × r/place.

Live (when deployed): the Fun Toys webring  
Hub: https://fun-toys-alpha.vercel.app · prev https://mood-pointer.vercel.app · next https://cursorling.vercel.app

## Run locally

```bash
npm install
npm run dev
```

The founding nave renders without an API. Placements, cooldowns, history, and the waiting count need Vercel (`vercel dev` or a deploy). `npm run build` typechecks `src/` and emits `dist/`.

## Persistence

The canvas is 128×128 (`16384` palette indices — not a 64×64 / 4096 board). Storage, in order:

1. **Vercel Blob** if `BLOB_READ_WRITE_TOKEN` is set. JSON object stored as `penance.json` via `@vercel/blob` (`put` with `addRandomSuffix: false` and `allowOverwrite: true`). Optional dependency.
2. **Vercel KV** if `KV_REST_API_URL` / `KV_URL` / `UPSTASH_REDIS_REST_URL` exists. Key `penance`. Optional `@vercel/kv`.
3. **In-memory `globalThis`** on the serverless isolate, plus a seeded **founding floor**: a faint stone nave, transept, apse, pews, and candles in muted beige / grey / brown / maroon. The canvas is never a blank page.

Cooldown is 180000 ms, keyed by a SHA-256 of the first `x-forwarded-for` hop (raw IPs are not stored). Concurrent writes are queued per isolate; Blob/KV last-write-wins across instances.

## API

| Method | Path | Body / result |
|---|---|---|
| GET | `/api/canvas` | `{ width, height, palette, pixels, remaining }` |
| POST | `/api/place` | `{ x, y, color }` colour = palette index. 429 `{ error, remaining }` |
| GET | `/api/history` | last 80 `{ x, y, color, t }` |
| GET | `/api/waiting` | `{ waiting }` short-TTL souls currently hesitating (memory) |

`/history` rewrites to the SPA ledger.

## Copy

Disappointed usher, not a leaderboard. No user text. After a successful place:

> You placed #C4A574 at (61, 88) and walked away. The canvas remembers.

## Author

Ahmad Bukhari · MIT 2026
