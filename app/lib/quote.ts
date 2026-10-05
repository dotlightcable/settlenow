// Deterministic quote engine: (amount, due-date, risk-tier) -> advance %, fee.
// Pure function — same inputs + same `now` always give the same quote.
// Demo works without keys; no network calls.

export type RiskTier = "low" | "standard" | "high";

export interface QuoteInput {
  amount: number; // face value, USD
  dueDate: string; // ISO date yyyy-mm-dd
  riskTier: RiskTier;
}

export interface QuoteResult {
  amount: number;
  riskTier: RiskTier;
  dueDate: string;
  daysToDue: number;
  advanceRate: number; // 0..1, e.g. 0.9 = 90%
  advanceAmount: number; // USD supplier receives
  feeBps: number; // total fee in basis points
  feeAmount: number; // USD protocol fee
  repayAmount: number; // USD payer owes (full face)
  breakdown: string[];
}

const BASE_RATE: Record<RiskTier, number> = {
  low: 0.92,
  standard: 0.9,
  high: 0.82,
};

const BASE_FEE_BPS: Record<RiskTier, number> = {
  low: 120,
  standard: 180,
  high: 320,
};

export function daysUntilDue(dueDate: string, now: Date = new Date()): number {
  const due = new Date(dueDate + "T23:59:59Z");
  if (isNaN(due.getTime())) return 30;
  const ms = due.getTime() - now.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function quoteInvoice(input: QuoteInput, now: Date = new Date()): QuoteResult {
  const amount = Math.max(0, Number(input.amount) || 0);
  const riskTier: RiskTier =
    input.riskTier === "low" || input.riskTier === "high" ? input.riskTier : "standard";
  const daysToDue = daysUntilDue(input.dueDate, now);

  // Tenor haircut: 2pp per 30 days beyond the first 30, capped at 8pp.
  const tenorHaircut = daysToDue > 30 ? Math.min(0.08, ((daysToDue - 30) / 30) * 0.02) : 0;
  // Size haircut: large faces carry more concentration risk.
  const sizeHaircut = amount > 50000 ? 0.03 : amount > 20000 ? 0.01 : 0;

  const rawRate = (BASE_RATE[riskTier] ?? 0.9) - tenorHaircut - sizeHaircut;
  const advanceRate = Math.min(0.92, Math.max(0.5, Math.round(rawRate * 1000) / 1000));

  // Fee: base by tier + 2 bps per day of tenor, capped at 800 bps (8%).
  const feeBps = Math.min(800, (BASE_FEE_BPS[riskTier] ?? 180) + daysToDue * 2);
  const feeAmount = round2((amount * feeBps) / 10_000);
  const advanceAmount = round2(amount * advanceRate);

  return {
    amount: round2(amount),
    riskTier,
    dueDate: input.dueDate,
    daysToDue,
    advanceRate,
    advanceAmount,
    feeBps,
    feeAmount,
    repayAmount: round2(amount),
    breakdown: [
      `Base advance for tier "${riskTier}": ${Math.round((BASE_RATE[riskTier] ?? 0.9) * 100)}%`,
      `Tenor haircut (${daysToDue}d to due): -${(tenorHaircut * 100).toFixed(1)}pp`,
      `Size haircut ($${amount.toLocaleString()}): -${(sizeHaircut * 100).toFixed(1)}pp`,
      `Fee: ${BASE_FEE_BPS[riskTier] ?? 180}bps base + ${daysToDue * 2}bps tenor = ${feeBps}bps`,
    ],
  };
}
