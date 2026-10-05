"use client";

import { useMemo, useState } from "react";
import { quoteInvoice, RiskTier } from "@/lib/quote";
import { addVault, nextUserId } from "@/lib/store";
import { Vault, fakeSig } from "@/lib/mock";

function defaultDue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function UploadPage() {
  const [supplier, setSupplier] = useState("Acme Foods Co.");
  const [payer, setPayer] = useState("FreshMart Grocers");
  const [payerEmail, setPayerEmail] = useState("ap@freshmart.example");
  const [amount, setAmount] = useState("12500");
  const [dueDate, setDueDate] = useState(defaultDue());
  const [riskTier, setRiskTier] = useState<RiskTier>("standard");
  const [fileName, setFileName] = useState("invoice-INV-2026-041.pdf");
  const [created, setCreated] = useState<Vault | null>(null);

  const quote = useMemo(() => {
    const n = Number(amount);
    if (!n || n <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
    return quoteInvoice({ amount: n, dueDate, riskTier });
  }, [amount, dueDate, riskTier]);

  function accept() {
    if (!quote) return;
    const id = nextUserId();
    const v: Vault = {
      id,
      supplier,
      payer,
      payerEmail,
      amount: quote.amount,
      dueDate: quote.dueDate,
      riskTier: quote.riskTier,
      advanceRate: quote.advanceRate,
      advanceAmount: quote.advanceAmount,
      feeAmount: quote.feeAmount,
      status: "Awaiting payer",
      advanceTx: fakeSig(`advance-${id}`),
      repayTx: null,
      payLink: `/pay/${id}`,
    };
    addVault(v);
    setCreated(v);
  }

  return (
    <div>
      <h1>Upload invoice</h1>
      <p className="mut">Enter invoice details — the quote engine prices the advance instantly. No wallet or keys needed for the demo.</p>

      <div className="form">
        <div className="two">
          <label>Supplier<input value={supplier} onChange={(e) => setSupplier(e.target.value)} /></label>
          <label>Invoice file (mock)<input value={fileName} onChange={(e) => setFileName(e.target.value)} /></label>
        </div>
        <div className="two">
          <label>Payer<input value={payer} onChange={(e) => setPayer(e.target.value)} /></label>
          <label>Payer email<input value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} /></label>
        </div>
        <div className="two">
          <label>Face amount (USD)<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label>Due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        </div>
        <label>Risk tier
          <select value={riskTier} onChange={(e) => setRiskTier(e.target.value as RiskTier)}>
            <option value="low">low — repeat payer, strong history</option>
            <option value="standard">standard — ordinary trade invoice</option>
            <option value="high">high — new payer / thin history</option>
          </select>
        </label>
      </div>

      {quote && (
        <div className="card quote">
          <h3>Quote — {(quote.advanceRate * 100).toFixed(1)}% advance</h3>
          <div className="kv"><span>Face value</span><b>${quote.amount.toLocaleString()}</b></div>
          <div className="kv"><span>Advance to supplier</span><b>${quote.advanceAmount.toLocaleString()}</b></div>
          <div className="kv"><span>Protocol fee ({quote.feeBps} bps)</span><b>${quote.feeAmount.toLocaleString()}</b></div>
          <div className="kv"><span>Payer repays</span><b>${quote.repayAmount.toLocaleString()} by {quote.dueDate}</b></div>
          <ul className="small">{quote.breakdown.map((b) => <li key={b}>{b}</li>)}</ul>
          <div className="btnrow">
            <button className="btn" onClick={accept}>Accept advance</button>
            <span className="mut" style={{ alignSelf: "center", fontSize: 13 }}>Demo: funds a mock vault, no on-chain tx.</span>
          </div>
        </div>
      )}

      {created && (
        <div className="card mt">
          <h3>Advance funded — {created.id}</h3>
          <p>${created.advanceAmount.toLocaleString()} to {created.supplier}. Share the pay-link with the payer:</p>
          <p className="mono">{typeof window !== "undefined" ? window.location.origin : ""}{created.payLink}</p>
          <div className="btnrow">
            <a className="btn" href={created.payLink}>Open pay-link</a>
            <a className="btn ghost" href="/dashboard">Go to dashboard</a>
          </div>
        </div>
      )}
    </div>
  );
}
