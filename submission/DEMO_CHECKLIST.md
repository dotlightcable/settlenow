# SettleNow — Live Demo Checklist

**Pre-req:** `cd ~/settlenow/app && npm install && npm run dev` → http://localhost:3000
(No env vars needed — empty/missing vars → deterministic mocks + localStorage.)

## Click path (60 seconds)

- [ ] **1. Upload** — go to `/upload`. Keep defaults: **$12,500, standard tier**, due date prefilled.
  Expect: live quote shows **90% advance = $11,250**, fee bps + fee amount + repay amount with breakdown.
- [ ] **2. Quote** — (optional judge detour) `POST /api/quote` with `{ "amount": 12500, "dueDate": "<ISO>", "riskTier": "standard" }` returns the same numbers as the UI.
- [ ] **3. Accept** — click **Accept advance**. Expect: vault **INV-2001+** created, redirect to dashboard.
- [ ] **4. Dashboard** — go to `/dashboard`. Expect: new row, status **Advanced**, `advance tx` link shaped like:
  `https://explorer.solana.com/tx/<sig>?cluster=devnet`
  Seeds INV-1001…1003 also visible; totals row updates.
- [ ] **5. Pay-link** — click the pay-link in the new row → `/pay/INV-2001`. Expect: face due, advance already paid out, payer view.
- [ ] **6. Pay** — click **Pay now**. Expect: status flips to **Repaid**, `repay tx` explorer link appears:
  `https://explorer.solana.com/tx/<sig>?cluster=devnet`
- [ ] **7. Reset** — click **Reset demo data**. Expect: seeds restored, INV-2001+ cleared.

## Explorer links

- Format: `https://explorer.solana.com/tx/<signature>?cluster=devnet` (both advance + repay legs).
- Demo sigs are `fakeSig(seed)`-derived: stable, syntactically valid base58-ish — link *shape* is real, txs are mock (no devnet tx exists). Say this out loud if a judge clicks one.

## Fallback: if wallet / network fails

The demo **does not need a wallet or network** — that IS the fallback:

1. Confirm `.env` Solana/Supabase vars are **unset** → app uses mocks + localStorage automatically.
2. If `npm run dev` fails: serve the last production build (`npm run build` passed Oct 6) or narrate over the recorded video.
3. If browser localStorage is dirty: click **Reset demo data**, hard-refresh.
4. If `/api/quote` errors: quote is computed client-side too (`lib/quote.ts`) — upload page still prices correctly offline.
5. Nuclear option: show `demo.db` via `python3 ~/settlenow/demo_seed.py` — prints INV-2026-ACME-0481 ($485.25, 1.5% fee) and asserts the $500 pilot cap. Proves the ledger math with zero frontend.

## Before judges / recording

- [ ] `npm run build` passes (last verified Oct 6).
- [ ] One full dry run of steps 1–7, then Reset.
- [ ] Browser zoom 125%, clear clutter, pre-open `/upload` tab.
