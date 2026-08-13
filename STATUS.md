# pixel-penance — STATUS

## 2026-08-13 — API 500 fix

- `/api/canvas|history|waiting|place` returned FUNCTION_INVOCATION_FAILED (optional `@vercel/blob` + invalid `get()`). Blob is now a real dependency; load uses `list`+fetch; handlers catch and fall back to the founding floor.
- Next: redeploy and re-hit the APIs.

## 2026-08-13 — live

- Live: https://pixel-penance.vercel.app
- Repo: https://github.com/syedahmad0786/pixel-penance


## 2026-08-13

- Built Pixel Penance (FT–016): Vite 6 + vanilla TS parish bulletin, 128×128 / 16-colour slow canvas, candle cooldown, PNG rubbing, ledger ticker, webring. API under `api/` with Blob → KV → memory + seeded founding nave.
- Left off: files complete in `Fun Projects\pixel-penance`. No git init, no commit, no deploy.
- Next: `npm install` / `npm run dev` to preview the bulletin; deploy only when asked.
