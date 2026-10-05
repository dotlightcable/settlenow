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
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  function pickScan(f: File | null) {
    setScanFile(f);
    setScanNote(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    if (f) setFileName(f.name);
  }

  async function scanInvoice() {
    if (!scanFile || scanning) return;
    setScanning(true);
    setScanNote(null);
    try {
      const form = new FormData();
      form.append("file", scanFile);
      const res = await fetch("/api/scan", { method: "POST", body: form });
      const j = await res.json();
      if (typeof j.payer === "string" && j.payer) setPayer(j.payer);
      if (typeof j.payer_email === "string") setPayerEmail(j.payer_email);
      if (typeof j.face_amount === "number" && j.face_amount > 0)
        setAmount(String(j.face_amount));
      if (typeof j.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j.due_date))
        setDueDate(j.due_date);
      setScanNote(
        j.mock
          ? "Scan unavailable (demo mock) — fields prefilled, please confirm."
          : "Fields extracted from invoice — please confirm."
      );
    } catch {
      setScanNote("Scan failed — fill the form manually.");
    } finally {
      setScanning(false);
    }
  }

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

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Scan invoice (AI)</h3>
        <p className="mut small">Pick an invoice image or PDF — AI extracts payer, amount, due date and prefills the form. Confirm before accepting the quote.</p>
        <div className="btnrow">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => pickScan(e.target.files?.[0] ?? null)}
          />
          <button className="btn" onClick={scanInvoice} disabled={!scanFile || scanning}>
            {scanning ? "Scanning…" : "Scan invoice"}
          </button>
        </div>
        {previewUrl && scanFile?.type.startsWith("image/") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="invoice preview" style={{ maxWidth: "100%", maxHeight: 240, marginTop: 8 }} />
        )}
        {previewUrl && scanFile?.type === "application/pdf" && (
          <p className="mono small" style={{ marginTop: 8 }}>{scanFile.name} (PDF preview n/a — will be scanned on submit)</p>
        )}
        {scanNote && <p className="mut small">{scanNote}</p>}
      </div>

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
