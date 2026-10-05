-- SettleNow invoices table (Postgres / SQLite compatible for demo)
-- USDC amounts stored as integer micro-USDC (6 decimals): $1 = 1_000_000
-- Status flow: FUNDED -> LOCKED -> RELEASED | REPAID

CREATE TABLE IF NOT EXISTS invoices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      TEXT NOT NULL UNIQUE,          -- e.g. 'INV-2026-001'
    funder          TEXT NOT NULL,                 -- advance provider wallet
    supplier        TEXT NOT NULL,                 -- SME receiving advance
    payer           TEXT NOT NULL,                 -- end customer confirming / repaying
    amount_micro    INTEGER NOT NULL CHECK (amount_micro > 0),
    fee_micro       INTEGER NOT NULL CHECK (fee_micro >= 0),
    net_micro       INTEGER NOT NULL CHECK (net_micro >= 0),
    status          TEXT NOT NULL DEFAULT 'FUNDED'
                    CHECK (status IN ('FUNDED','LOCKED','RELEASED','REPAID')),
    vault_pda       TEXT,                          -- Solana vault PDA (base58)
    fund_tx         TEXT,                          -- devnet tx sig (mock in demo)
    release_tx      TEXT,
    payer_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (payer_confirmed IN (0,1)),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payer ON invoices(payer);
