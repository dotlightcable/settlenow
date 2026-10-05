"use client";

import { useEffect, useState } from "react";
import { Vault, explorerTxUrl } from "@/lib/mock";
import { loadAllVaults, resetDemo } from "@/lib/store";

function pill(status: Vault["status"]): string {
  if (status === "Repaid" || status === "Closed") return "pill paid";
  if (status === "Awaiting payer") return "pill wait";
  return "pill adv";
}

export default function Dashboard() {
  const [vaults, setVaults] = useState<Vault[]>([]);

  useEffect(() => {
    setVaults(loadAllVaults());
  }, []);

  const advanced = vaults.reduce((s, v) => s + v.advanceAmount, 0);
  const repaid = vaults.filter((v) => v.repayTx).length;

  return (
    <div>
      <h1>Status dashboard</h1>
      <p className="mut">Every vault with its advance tx, repay tx, and payer pay-link. Seed data is deterministic; your uploads persist in this browser.</p>

      <div className="grid">
        <div className="card"><h3>Total advanced</h3><p style={{ fontSize: 22, color: "#fff" }}>${advanced.toLocaleString()}</p></div>
        <div className="card"><h3>Open vaults</h3><p style={{ fontSize: 22, color: "#fff" }}>{vaults.length - repaid}</p></div>
        <div className="card"><h3>Repaid / closed</h3><p style={{ fontSize: 22, color: "#fff" }}>{repaid}</p></div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr><th>Invoice</th><th>Payer</th><th>Face</th><th>Advance</th><th>Status</th><th>Links</th></tr>
          </thead>
          <tbody>
            {vaults.map((v) => (
              <tr key={v.id}>
                <td><b>{v.id}</b><br /><span className="mut">{v.dueDate} · {v.riskTier}</span></td>
                <td>{v.payer}</td>
                <td>${v.amount.toLocaleString()}</td>
                <td>${v.advanceAmount.toLocaleString()} ({(v.advanceRate * 100).toFixed(0)}%)</td>
                <td><span className={pill(v.status)}>{v.status}</span></td>
                <td>
                  <a href={v.payLink}>pay-link</a>
                  {" · "}
                  <a href={explorerTxUrl(v.advanceTx)} target="_blank" rel="noreferrer">advance tx</a>
                  {v.repayTx && (
                    <span>{" · "}<a href={explorerTxUrl(v.repayTx)} target="_blank" rel="noreferrer">repay tx</a></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="btnrow">
        <a className="btn" href="/upload">New invoice</a>
        <button
          className="btn ghost"
          onClick={() => {
            resetDemo();
            setVaults(loadAllVaults());
          }}
        >
          Reset demo data
        </button>
      </div>
    </div>
  );
}
