-- SettleNow demo queries (what judges watch)
-- Amounts in micro-USDC; divide by 1e6 for dollars.

-- 1. All invoices, newest first
SELECT invoice_id, amount_micro/1000000.0 AS amount_usdc,
       fee_micro/1000000.0 AS fee_usdc, status, payer_confirmed
FROM invoices ORDER BY id DESC;

-- 2. Total advanced + total fees (pilot dashboard headline)
SELECT COUNT(*) AS n,
       SUM(amount_micro)/1000000.0 AS total_advanced_usdc,
       SUM(fee_micro)/1000000.0 AS total_fees_usdc
FROM invoices WHERE status IN ('LOCKED','RELEASED','REPAID');

-- 3. Pipeline by status
SELECT status, COUNT(*) AS n, SUM(amount_micro)/1000000.0 AS usdc
FROM invoices GROUP BY status ORDER BY n DESC;

-- 4. Pilot cap guard: any invoice over $500 advance?
SELECT invoice_id, amount_micro/1000000.0 AS usdc
FROM invoices WHERE amount_micro > 500000000;

-- 5. Payer-confirm funnel (releases blocked until payer_confirmed = 1)
SELECT invoice_id, status, payer_confirmed
FROM invoices WHERE status IN ('FUNDED','LOCKED') ORDER BY id;

-- 6. Supplier payouts (net = amount - 1.5% fee)
SELECT invoice_id, supplier,
       (amount_micro - fee_micro)/1000000.0 AS payout_usdc, status
FROM invoices WHERE status = 'RELEASED';

-- 7. Repayment tracking
SELECT invoice_id, payer, amount_micro/1000000.0 AS repaid_usdc, release_tx
FROM invoices WHERE status = 'REPAID';
