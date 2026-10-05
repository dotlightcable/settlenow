# SettleNow — Colosseum Crypto World's Fair Submission

**Team exhibitor:** aga
**Product:** SettleNow
**Due:** Oct 12, 2026

## One-sentence pitch

SettleNow gives suppliers 90% of any invoice in USDC within seconds — upload the invoice, accept the quote, share a pay-link, and the vault closes itself when the payer repays.

## Problem

Small suppliers wait 30–90 days to get paid on B2B invoices. Factoring exists but is slow, paper-heavy, opaque (hidden fees, unclear advance rates), and out of reach for smaller invoices. A $485 invoice from a logistics supplier is simply not worth a factor's paperwork — so the supplier eats the cash-flow gap.

## Solution

SettleNow is an invoice-advance vault: deterministic quote engine + escrow vault + shareable payer pay-link.

1. **Upload** an invoice (amount, due date, risk tier).
2. **Quote** — pure function `quoteInvoice()`: ~90% advance (tier base 92/90/82%, tenor/size haircuts), fee = base bps + 2 bps/day capped at 800 bps. UI and API share the same function so they can never disagree.
3. **Advance** — ~90% USDC lands in the supplier's wallet (Anchor vault PDA per invoice on Solana; Tempo as primary settlement rail).
4. **Pay-link** — `/pay/[id]` public link for the payer; one click repays full face.
5. **Close** — vault closes, dashboard row flips to Repaid with both explorer links.

Demo runs fully on deterministic mocks — no keys, no wallet required — so judges see the whole loop in 60 seconds.

## Demo (60-second path)

1. `/upload` — keep defaults ($12,500, standard tier) → see the 90% quote → Accept advance → vault INV-2001+ created.
2. `/dashboard` — new vault appears with `advance tx` explorer link (`https://explorer.solana.com/tx/<sig>?cluster=devnet`).
3. `/pay/INV-2001` — click through from dashboard → Pay now (simulates payer repaying full face).
4. Dashboard row flips to Repaid, `repay tx` explorer link appears. Reset demo data restores seeds.

Seed data: INV-1001…1003 + real-shaped INV-2026-ACME-0481 ($485.25, 1.5% fee, under $500 pilot cap).

## Team

Solo builder: **el (aga)** — full-stack + Solana/Anchor. Built the Anchor escrow vault (`programs/settlenow/`), the Next.js demo (`app/`), and the deterministic quote engine + SQLite demo ledger, all verified with builds passing Oct 6.

## Track selection

| Track | Why SettleNow fits |
|---|---|
| **Tempo (primary)** | Settlement rail thesis: fast, cheap USDC advances and payer repayments; pay-link checkout maps directly to Tempo payments. |
| **Solana (secondary)** | Anchor escrow vault program (PDA per invoice, `fund_advance` / `repay_close`), wallet-adapter advance claims, devnet explorer links on both legs. |
| **General / Open track** | Real-world B2B pain (supplier cash flow) with a working end-to-end demo any judge can click through with zero setup. |

## Open-source & composability notes (for judges)

- **Open source:** entire repo is inspectable — Anchor program (`programs/settlenow/src/lib.rs`), quote engine (`app/lib/quote.ts`), mock/store (`app/lib/mock.ts`, `app/lib/store.ts`), quote API (`app/api/quote/route.ts`), demo ledger (`schema.sql`, `demo_seed.py`, `queries.sql`), tests (`tests/settlenow.ts`).
- **Composability:** `quoteInvoice()` is a pure, dependency-free function — any other protocol can import it for pricing. `GET/POST /api/quote` exposes the same engine as JSON. Vault PDAs are per-invoice so lending, credit-scoring, or insurance protocols can compose on top (read vault state, price risk, refinance advances).
- **Reproducibility:** deterministic seeds everywhere — `random.seed(20261006)`, hardcoded seed vaults and tx sigs, `quoteInvoice` accepts a pinned `now`. `npm run build` (Next.js) and `anchor build` / `cargo check` (program) both pass; `python3 demo_seed.py` asserts the 1.5% fee math and $500 pilot cap.
- **Post-hackathon path:** Supabase persistence, signed pay-link tokens (HMAC), payer-credit risk lookup, Vercel deploy — see ARCHITECTURE.md. No judge setup needed: unset env vars → mocks + localStorage.
