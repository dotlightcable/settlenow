export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>
          Invoices settle now.
          <br />
          Payers settle later.
        </h1>
        <p>
          SettleNow advances ~90% of an invoice to the supplier on Solana, then collects the
          full face value from the payer via a shareable pay-link. When the payer repays, the
          vault closes automatically.
        </p>
        <div className="btnrow">
          <a className="btn" href="/upload">Upload an invoice</a>
          <a className="btn ghost" href="/dashboard">View dashboard</a>
        </div>
      </section>

      <div className="grid">
        <div className="card"><h3>1 · Upload</h3><p>Supplier uploads invoice: amount, due date, payer, risk tier.</p></div>
        <div className="card"><h3>2 · 90% quote</h3><p>Deterministic engine prices advance % + fee from amount, tenor, tier.</p></div>
        <div className="card"><h3>3 · Advance lands</h3><p>Vault funds the supplier (devnet mock tx with explorer link).</p></div>
        <div className="card"><h3>4 · Pay-link</h3><p>Payer opens /pay/[id] and repays full face. Vault closes.</p></div>
      </div>

      <div className="card">
        <h3>Try the demo (no wallet, no keys)</h3>
        <p>
          Upload page → accept the quote → open the Dashboard → click a pay-link → simulate
          the payer repayment. Try the JSON API too: <a href="/api/quote">GET /api/quote</a>.
        </p>
      </div>
    </div>
  );
}
