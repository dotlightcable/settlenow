import { NextResponse } from "next/server";

// POST /api/scan — multipart form-data with a `file` field (image or PDF).
// Extracts { payer, payer_email, face_amount, due_date } via Gemini vision.
// Deterministic mock fallback when GEMINI_API_KEY is missing or the call
// fails — never crashes, never blocks the demo.

export const runtime = "nodejs";

interface ScanResult {
  payer: string;
  payer_email: string;
  face_amount: number;
  due_date: string; // yyyy-mm-dd
  mock: boolean;
}

function mockResult(): ScanResult {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return {
    payer: "FreshMart Grocers",
    payer_email: "ap@freshmart.example",
    face_amount: 12500,
    due_date: d.toISOString().slice(0, 10),
    mock: true,
  };
}

function sanitize(raw: unknown): ScanResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const face = Number(r.face_amount);
  const due =
    typeof r.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.due_date)
      ? r.due_date
      : null;
  if (!due || !face || face <= 0) return null;
  return {
    payer: typeof r.payer === "string" && r.payer ? r.payer : "Unknown payer",
    payer_email:
      typeof r.payer_email === "string" && r.payer_email.includes("@")
        ? r.payer_email
        : "",
    face_amount: Math.round(face * 100) / 100,
    due_date: due,
    mock: false,
  };
}

async function geminiScan(buf: Buffer, mime: string, key: string): Promise<ScanResult | null> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const prompt =
    "Read this invoice image/PDF and extract: payer (buyer company name), payer_email (billing email or empty string), face_amount (total USD as number), due_date (yyyy-mm-dd; if only an issue date is shown, add 30 days). Reply with ONLY a JSON object, no markdown, no explanation. Example: {\"payer\":\"Acme\",\"payer_email\":\"ap@acme.com\",\"face_amount\":12500,\"due_date\":\"2026-11-05\"}";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime, data: buf.toString("base64") } },
          ],
        },
      ],
      generationConfig: { temperature: 0, response_mime_type: "application/json" },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return sanitize(JSON.parse(cleaned));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ ...mockResult(), note: "no file parsed" });
  }
  if (!file) return NextResponse.json({ ...mockResult(), note: "no file uploaded" });

  const mime = file.type || "image/png";
  if (!/^(image\/|application\/pdf)/.test(mime)) {
    return NextResponse.json({ ...mockResult(), note: `unsupported type ${mime}` });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) return NextResponse.json({ ...mockResult(), note: "GEMINI_API_KEY not set" });

  try {
    const live = await geminiScan(buf, mime, key);
    if (live) return NextResponse.json(live);
  } catch {
    // fall through to mock
  }
  return NextResponse.json({ ...mockResult(), note: "gemini unavailable, mock fallback" });
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/scan with multipart form-data { file } -> { payer, payer_email, face_amount, due_date, mock }",
    example: mockResult(),
  });
}
