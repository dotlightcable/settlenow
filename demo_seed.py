#!/usr/bin/env python3
"""SettleNow deterministic demo seed: 3 fake + 1 real-shaped invoice.

Deterministic: fixed random.seed(20261006). Idempotent: clears + reinserts.
Usage:  python3 demo_seed.py [--db demo.db]
Verifies: prints rows, asserts 1.5% fee math and $500 pilot cap.
"""
import argparse
import random
import sqlite3
from pathlib import Path

SEED = 20261006
FEE_BPS = 150
PILOT_CAP_MICRO = 500_000_000  # $500 in micro-USDC

ROOT = Path(__file__).resolve().parent


def fee_for(amount: int) -> int:
    return amount * FEE_BPS // 10_000


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(ROOT / "demo.db"))
    ap.add_argument("--schema", default=str(ROOT / "schema.sql"))
    args = ap.parse_args()

    random.seed(SEED)  # fixed seed -> deterministic demo

    fake_suppliers = [f"Supplier-{c}" for c in "ABC"]
    fake_amounts = [random.randint(50_000_000, 500_000_000) for _ in range(3)]
    # Real-shaped: plausible B2B invoice just under the pilot cap.
    real_shaped = {
        "invoice_id": "INV-2026-ACME-0481",
        "funder": "Funder-Pilot-Treasury",
        "supplier": "Acme-Logistics-Pty",
        "payer": "Globex-Retail-Ltd",
        "amount_micro": 485_250_000,  # $485.25
    }

    rows = []
    for i, amt in enumerate(fake_amounts, start=1):
        amt = min(amt, PILOT_CAP_MICRO)
        rows.append(
            (
                f"INV-2026-{i:04d}",
                "Funder-Pilot-Treasury",
                fake_suppliers[i - 1],
                f"Payer-{chr(88 + i)}",
                amt,
            )
        )
    rows.append(
        (
            real_shaped["invoice_id"],
            real_shaped["funder"],
            real_shaped["supplier"],
            real_shaped["payer"],
            real_shaped["amount_micro"],
        )
    )

    con = sqlite3.connect(args.db)
    with open(args.schema, encoding="utf-8") as f:
        con.executescript(f.read())
    con.execute("DELETE FROM invoices")

    statuses = ["FUNDED", "LOCKED", "RELEASED", "REPAID"]
    for idx, (inv, funder, supplier, payer, amount) in enumerate(rows):
        assert amount <= PILOT_CAP_MICRO, f"over pilot cap: {inv}"
        fee = fee_for(amount)
        net = amount - fee
        assert fee == amount * 150 // 10_000, "fee math drift"
        con.execute(
            """INSERT INTO invoices
               (invoice_id, funder, supplier, payer, amount_micro, fee_micro,
                net_micro, status, vault_pda, payer_confirmed)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                inv, funder, supplier, payer, amount, fee, net,
                statuses[idx % len(statuses)],
                f"VaultPDA-{inv}",
                1 if statuses[idx % len(statuses)] in ("RELEASED", "REPAID") else 0,
            ),
        )
    con.commit()

    print(f"seed={SEED} rows=4 db={args.db}")
    for r in con.execute(
        "SELECT invoice_id, amount_micro, fee_micro, net_micro, status "
        "FROM invoices ORDER BY id"
    ):
        print(r)
    tot = con.execute(
        "SELECT SUM(amount_micro), SUM(fee_micro) FROM invoices"
    ).fetchone()
    print(f"total_advanced={tot[0]} total_fees={tot[1]}")
    over = con.execute(
        "SELECT COUNT(*) FROM invoices WHERE amount_micro > 500000000"
    ).fetchone()[0]
    assert over == 0, "pilot cap violated"
    print("checks: fee=1.5% OK, pilot-cap<=$500 OK")
    con.close()


if __name__ == "__main__":
    main()
