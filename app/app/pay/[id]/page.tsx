"use client";

import { useEffect, useState } from "react";
import { Vault, explorerTxUrl } from "@/lib/mock";
import { getVault, markRepaid } from "@/lib/store";

export default function PayPage({ params }: { params: { id: string } }) {
  const [vault, setVault] = useState<Vault | null | undefined>(undefined);

  useEffect(() => {
    setVault(getVault(params.id) ?? null);
  }, [params.id]);

  if (vault === undefined) return <p className="mut">Loading pay-link…</p>;
  if (vault === null) {
    return (
      <div>
        <h1>Pay-link not found</h1>
        <p className="mut">No vault for id “{params.id}”. Check the <a href="/dashboard">dashboard</a> for live links.</p>
      </div>
    );
  }

  const paid = vault.status === "Repaid" || vault.status === "Closed" || vault.repayTx !== null;

  return (
    <div>
      <h1>Pay {vault.id}</h1>
      <p className="mut">{vault.payer} · invoice due {vault.dueDate}</p>

      <div className="card">
        <div className="kv"><span>Supplier</span><b>{vault.supplier}</b></div>
        <div className="kv"><span>Face amount due</span><b>${vault.amount.toLocaleString()}</b></div>
        <div className="kv"><span>Already advanced</span><b>${vault.advanceAmount.toLocaleString()} ({(vault.advanceRate * 100).toFixed(1)}%)</b></div>
        <div className="kv"><span>Status</span><b>{paid ? "Repaid — vault closed" : vault.status}</b></div>
      </div>

      {!paid ? (
        <div className="card mt">
          <h3>Payer checkout (mock)</h3>
          <p className="mut">Demo simulates a USDC transfer on Solana devnet. No wallet required.</p>
          <button
            className="btn"
            onClick={() => {
              const v = markRepaid(vault.id);
              if (v) setVault({ ...v });
            }}
          >
            Pay ${vault.amount.toLocaleString()} now
          </button>
        </div>
      ) : (
        <div className="card mt">
          <h3>Repaid ✓</h3>
          <p className="mut">Full face value received. Vault is closed.</p>
          {vault.repayTx && (
            <p className="mono">repay tx: <a href={explorerTxUrl(vault.repayTx)} target="_blank" rel="noreferrer">{vault.repayTx}</a></p>
          )}
        </div>
      )}

      <div className="card mt">
        <h3>Explorer links</h3>
        <p className="mono">advance tx: <a href={explorerTxUrl(vault.advanceTx)} target="_blank" rel="noreferrer">{vault.advanceTx}</a></p>
        {vault.repayTx && (
          <p className="mono">repay tx: <a href={explorerTxUrl(vault.repayTx)} target="_blank" rel="noreferrer">{vault.repayTx}</a></p>
        )}
      </div>
    </div>
  );
}
