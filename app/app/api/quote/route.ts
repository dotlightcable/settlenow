import { NextResponse } from "next/server";
import { quoteInvoice, RiskTier } from "@/lib/quote";

export async function GET() {
  const example = quoteInvoice({ amount: 12500, dueDate: "2026-11-05", riskTier: "standard" });
  return NextResponse.json({
    usage: "POST /api/quote with { amount, dueDate (yyyy-mm-dd), riskTier (low|standard|high) }",
    example,
  });
}

export async function POST(req: Request) {
  let body: { amount?: number; dueDate?: string; riskTier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }
  if (typeof body.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
    return NextResponse.json({ error: "dueDate must be yyyy-mm-dd" }, { status: 400 });
  }
  const tier: RiskTier =
    body.riskTier === "low" || body.riskTier === "high" ? body.riskTier : "standard";
  return NextResponse.json(quoteInvoice({ amount: body.amount, dueDate: body.dueDate, riskTier: tier }));
}
