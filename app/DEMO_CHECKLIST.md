# SettleNow — Demo Checklist (thin slice, Oct 12)

1. Open `/upload` → **Scan invoice**: pick an image/PDF, see preview, click scan → fields prefill (mock notice if no key). ~30s.
2. Confirm prefilled payer / email / amount / due date → quote updates instantly via `lib/quote.ts`.
3. Accept advance → mock vault funded (`INV-2001+`), copy pay-link.
4. Open pay-link `/pay/[id]` → mock repay → status flips to Repaid.
5. Dashboard → totals, both explorer links resolve as link shapes.

Fallbacks (no key / offline): scan returns deterministic mock, quote engine is pure local — demo never blocks.
