# SettleNow — Architecture

## Flow

```
Supplier          SettleNow (Next.js)            Solana (devnet)           Payer
   |  upload invoice  |                                |                     |
   |----------------->| POST /api/quote                |                     |
   |                  | (amount, due-date, risk-tier   |                     |
   |                  |  -> advance %, fee)            |                     |
   |  quote + accept  |                                |                     |
   |<-----------------|                                |                     |
   |                  | fund vault (advance ~90%)      |                     |
   |                  |------------------------------->| advance tx          |
   |  advance lands   |                                |                     |
   |<-----------------|                                |                     |
   |                  | pay-link /pay/[id]             |                     |
   |                  |--------------------------------------------------->|
   |                  |                                |  repay full face  |
   |                  |<---------------------------------------------------|
   |                  | close vault                    |                     |
   |                  |------------------------------->| repay tx / close  |
```

## Components

- **Upload page** (`app/upload/page.tsx`): collects invoice fields; computes the quote client-side via `lib/quote.ts` (same function the API route uses, so UI and API can never disagree).
- **Quote engine** (`lib/quote.ts`): pure, deterministic, dependency-free. Inputs: face amount, ISO due date, risk tier. Outputs: advance rate/amount, fee bps/amount, repay amount, human-readable breakdown. Tier tables + tenor/size haircuts are constants at the top — tune without touching call sites.
- **Vault store** (`lib/store.ts` + `lib/mock.ts`): demo persistence. Three deterministic seed vaults (INV-1001…1003); user-created vaults (INV-2001+) persist in `localStorage`. `fakeSig(seed)` derives stable, syntactically-valid base58-ish signatures so every explorer link works as a link shape without a real tx.
- **Pay-link page** (`app/pay/[id]/page.tsx`): public route for the payer. Shows face due, advance already paid out, mock checkout button → `markRepaid()` → status flips, repay tx appears.
- **Dashboard** (`app/dashboard/page.tsx`): all vaults (user + seeds) with totals, status pills, pay-links, and devnet explorer links for both legs.
- **Scan API** (`app/api/scan/route.ts`): `POST` multipart `{ file }` (image/PDF ≤10MB) → Gemini vision (`inline_data`, `GEMINI_MODEL` default `gemini-2.0-flash`) extracts `{ payer, payer_email, face_amount, due_date }`. No key or any failure → deterministic mock (same defaults as the upload form, `mock: true`). Never 500s on missing key; never blocks the demo. Upload page "Scan invoice" button previews the file, prefills the form, user confirms → existing quote flow unchanged.
- **Quote API** (`app/api/quote/route.ts`): `GET` returns usage + example; `POST` validates `{ amount, dueDate, riskTier }` and returns the same `QuoteResult` the UI renders.

## Data model (demo)

```ts
Vault { id, supplier, payer, payerEmail, amount, dueDate, riskTier,
        advanceRate, advanceAmount, feeAmount, status, advanceTx, repayTx, payLink }
Status: Advanced | Awaiting payer | Repaid | Closed
```

## Production path (post-hackathon)

1. **On-chain vault** (Anchor program): PDA per invoice holding USDC; `fund_advance`, `repay_close` instructions; `NEXT_PUBLIC_VAULT_PROGRAM_ID` already reserved in `.env.example`.
2. **Persistence**: replace `lib/store.ts` localStorage with Supabase tables (`invoices`, `vaults`, `repayments`); service-role key stays server-side in API routes.
3. **Auth/wallet**: Solana wallet adapter for supplier advance claims; signed pay-link tokens (HMAC of invoice id + payer email) so `/pay/[id]` isn't enumerable.
4. **Risk**: replace tier select with payer-credit lookup + historical repayment scoring; keep `quoteInvoice()` as the pricing fallback.
5. **Deploy**: Vercel; `NEXT_PUBLIC_APP_URL` drives absolute pay-link generation.

## Why mocks are deterministic

- `quoteInvoice` takes an optional `now` (defaults to `new Date()`); tests/scripts can pin it.
- Seed vaults, signatures, and pay-links are hardcoded constants — identical on every machine with zero env.
