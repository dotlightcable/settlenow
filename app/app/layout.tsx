import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SettleNow — Invoice advances on Solana",
  description: "Upload an invoice, get a 90% advance quote, share a payer pay-link, close the vault on repayment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a className="brand" href="/">SettleNow</a>
          <nav>
            <a href="/upload">Upload</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/api/quote">API</a>
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer className="foot">
          <span>SettleNow demo · Solana devnet · deterministic mocks, no keys required</span>
        </footer>
      </body>
    </html>
  );
}
