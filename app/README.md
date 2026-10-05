# SettleNow

Invoice advances on Solana: upload an invoice → get a ~90% quote → advance lands → payer pays via a shareable pay-link → vault closes.

Built for the Colosseum World's Fair (due Oct 12, 2026). Next.js + Solana wallet adapter + Supabase + Vercel. **Demo runs fully on deterministic mocks — no keys, no wallet required.**

## Quickstart

```bash
cd ~/settlenow/app
cp .env.example .env.local   # optional; mocks used when empty
npm install
npm run dev                  # http://localhost:3000
npm run build                # production verification
```

## Demo script (60 seconds)

1. **Upload** (`/upload`): keep defaults (US$12,500, standard tier) → see the 90% quote → *Accept advance*.
2. **Dashboard** (`/dashboard`): new vault appears with `advance tx` explorer link.
3. **Pay-link** (`/pay/INV-2001`): click through from the dashboard → *Pay now* simulates the payer repaying full face.
4. **Closed**: dashboard row flips to *Repaid*, `repay tx` explorer link appears. `Reset demo data` restores seeds.

## Quote engine

`lib/quote.ts` — pure function `quoteInvoice({ amount, dueDate, riskTier })`:

| Tier | Base advance | Base fee |
|---|---|---|
| low | 92% | 120 bps |
| standard | 90% | 180 bps |
| high | 82% | 320 bps |

- Tenor haircut: −2pp per 30 days beyond the first 30, capped at −8pp.
- Size haircut: −1pp over US$20k, −3pp over US$50k. Advance clamped to [50%, 92%].
- Fee: base + 2 bps × days-to-due, capped at 800 bps.

JSON API: `GET /api/quote` (example) and `POST /api/quote` with `{ amount, dueDate, riskTier }`.

## Project layout

```
app/                  # Next.js App Router (this dir is the Next.js root)
  app/page.tsx        # landing + flow
  app/upload/page.tsx # upload form + live quote + accept
  app/pay/[id]/page.tsx  # payer pay-link + mock checkout
  app/dashboard/page.tsx # vault table + explorer links
  app/api/quote/route.ts # quote JSON API
  lib/quote.ts        # deterministic pricing engine
  lib/mock.ts         # seed vaults INV-1001..1003 + fake tx sigs
  lib/store.ts        # localStorage demo store (INV-2001+)
```

## Env vars

See `.env.example`. All optional for the demo: unset Solana/Supabase vars → deterministic mocks + localStorage. Set `NEXT_PUBLIC_SOLANA_RPC_URL` / Supabase keys to wire the real backends (server vault program + Supabase persistence are the post-hackathon path — see ARCHITECTURE.md).

## Verify

```bash
npm run build     # or: npx tsc --noEmit
```
