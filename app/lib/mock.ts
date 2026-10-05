// Deterministic mock data — fixed seeds so the demo works with no keys.
// Fake tx signatures are syntactically valid base58-ish strings, NOT real txs.

export type VaultStatus = "Advanced" | "Awaiting payer" | "Repaid" | "Closed";

export interface Vault {
  id: string; // e.g. INV-1001
  supplier: string;
  payer: string;
  payerEmail: string;
  amount: number; // face value USD
  dueDate: string; // ISO yyyy-mm-dd
  riskTier: "low" | "standard" | "high";
  advanceRate: number;
  advanceAmount: number;
  feeAmount: number;
  status: VaultStatus;
  advanceTx: string; // fake signature
  repayTx: string | null; // fake signature once repaid
  payLink: string; // relative URL
}

export const SOLANA_CLUSTER = "devnet";

export function explorerTxUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${SOLANA_CLUSTER}`;
}

// Deterministic pseudo-signature from a seed string (not a real tx).
export function fakeSig(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "";
  let s = seed;
  while (out.length < 87) {
    let h = h1 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 16777619);
      h2 = Math.imul(h2 ^ s.charCodeAt(i), 31);
    }
    h >>>= 0;
    let x = (h ^ h2) >>> 0;
    if (x === 0) x = 7;
    while (x > 0 && out.length < 87) {
      out += alphabet[x % alphabet.length];
      x = Math.floor(x / alphabet.length);
    }
    s = s + out.slice(-4);
  }
  return out.slice(0, 87);
}

function v(
  id: string,
  supplier: string,
  payer: string,
  payerEmail: string,
  amount: number,
  dueDate: string,
  riskTier: Vault["riskTier"],
  advanceRate: number,
  advanceAmount: number,
  feeAmount: number,
  status: VaultStatus,
  repaid: boolean
): Vault {
  return {
    id,
    supplier,
    payer,
    payerEmail,
    amount,
    dueDate,
    riskTier,
    advanceRate,
    advanceAmount,
    feeAmount,
    status,
    advanceTx: fakeSig(`advance-${id}`),
    repayTx: repaid ? fakeSig(`repay-${id}`) : null,
    payLink: `/pay/${id}`,
  };
}

export const MOCK_VAULTS: Vault[] = [
  v("INV-1001", "Acme Foods Co.", "FreshMart Grocers", "ap@freshmart.example", 12500, "2026-11-05", "standard", 0.9, 11250, 281.25, "Awaiting payer", false),
  v("INV-1002", "Bluefin Textiles", "Nordwind Retail", "finance@nordwind.example", 48200, "2026-12-19", "low", 0.91, 43862, 723.0, "Advanced", false),
  v("INV-1003", "Copperline Parts", "Helios Manufacturing", "treasury@helios.example", 8300, "2026-10-28", "high", 0.82, 6806, 307.1, "Repaid", true),
];

export function findMockVault(id: string): Vault | undefined {
  return MOCK_VAULTS.find((x) => x.id.toLowerCase() === id.toLowerCase());
}
