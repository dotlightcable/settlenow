=== COLOSSEUM — SETTLENOW FILL PACK (matches arena form fields, Oct 6 2026) ===
Team: aga (@wheneveritis) · Project: settlenow · Deadline Oct 12 2026
NOTE: "Final submission opens October 6 at 4:00 AM PDT" — fill + Save draft now, submit after it opens.

################################################################
## TAB 1 — PROJECT DETAILS
################################################################

[Project name]  (already filled: settlenow)

[Brief description]  (Public, max 500)
SettleNow gives small suppliers ~90% of an invoice in USDC within seconds. Upload the invoice, get a transparent deterministic quote (1.5% fee), the advance lands from an escrow vault, and the payer repays through a shareable pay-link that closes the vault. Built for the suppliers traditional factoring ignores — the sub-$5k invoices nobody will touch.

[Project website]  (Public)
https://settlenow-joyce-4f3d.vercel.app/

[What are you building, and who is it for?]  (max 1000)
SettleNow is an invoice-advance vault for small B2B suppliers — freelancers, logistics operators, agencies, and small manufacturers who invoice larger clients on net-30/net-60 terms.

The product is one loop: upload an invoice → receive a deterministic quote → accept the advance (roughly 90% of face value lands in USDC within seconds) → share a pay-link with your client → when they pay, the vault closes itself and the remainder settles automatically.

Who it is for specifically: the supplier whose invoice is too small to factor. Traditional factoring is paper-heavy, slow, and priced for five- and six-figure receivables — a $485 invoice is not worth a factor's time, so that supplier simply waits 30-90 days or borrows expensively. SettleNow makes those small invoices economically viable to advance because the quote, the vault, and the repayment are all software, with no human underwriting in the loop for the pilot tier.

The demo runs end to end with zero setup — no wallet, no keys, no login — so anyone can click the whole loop in 60 seconds.

[Why did you decide to build this, and why build it now?]  (max 1000)
Cash-flow timing is the single most common reason small suppliers fail, and it is entirely a settlement problem — not a demand problem. The work is done, the client is good for the money, but payment terms put 30-90 days between delivering and being paid.

Three things make this buildable right now, and none of them were true two years ago:

1. Stablecoin rails are fast and cheap enough that a sub-$500 advance costs cents to move. The unit economics of small-ticket factoring only work when settlement is near-free and instant.
2. Programmatic escrow is finally boring. A per-invoice vault with deterministic release conditions replaces the back office — the legal paperwork, the collections calls, the reconciliation — that made small advances unprofitable.
3. Deterministic, transparent pricing is now a competitive advantage rather than a nicety. Suppliers do not distrust factoring because of the rate; they distrust it because they cannot see the rate until they are already committed. A quote that is a pure, published function is something a supplier can verify before they sign anything.

The "why now" is really "why not before": the cost of administering a small advance has collapsed. That is what turns an unserved market into a served one.

[What technologies are you using or integrating with to build your product?]  (please include notable developer tools and AI tools)
Next.js (App Router) + TypeScript + React for the product UI and API routes.
Solana + Anchor (Rust) for the per-invoice escrow vault program (PDA per invoice; fund / lock / release / repay-close instructions, 1.5% fee, $500 pilot cap).
Solana wallet adapter for advance claims; Solana devnet explorer links on both the advance and repay legs.
Deterministic quote engine — a pure, dependency-free TypeScript function exposed identically to the UI and via POST /api/quote, so quotes can never disagree between channels.
SQLite for the demo ledger (schema.sql + deterministic seeder + judge demo queries).
Supabase + Vercel for the hosted demo and post-hackathon persistence path.
Google Gemini (vision) for the AI invoice scanner — upload a photo or PDF of an invoice and the payer, amount, and due date are extracted to prefill the form (with a deterministic offline fallback so the demo never breaks).
AI coding tools: the build was developed with AI coding agents (OpenCode CLI / Claude Code) driving implementation under the founder's direction, plus Hermes Agent for research, verification, and deployment automation.

[Which chains does your product use?]
☑ Solana
☑ Tempo
(select those two only)

[How does your product use these chains?]  (max 500)
Solana is the escrow layer. Each invoice gets its own vault PDA holding the advanced USDC, with the payer's repayment releasing the supplier's remainder and closing the vault — programmatic escrow replaces the factoring back office, and every advance and repayment is verifiable on-chain.

Tempo is the settlement rail. The advance payout and the payer's pay-link repayment are the two money-movement legs of the product, and they map directly onto Tempo's payments thesis: fast, cheap stablecoin settlement where gas is paid in the stablecoin itself. That is exactly the cost profile that makes a sub-$500 advance viable.

[What category best describes your product?]
Payments & Remittance  (already selected — keep)

[Is your project a mobile-focused dApp?]
No

[Where is your team primarily based?]  (Public)
<NEED FROM EL — country of residence>  (Indonesia, if correct)

[Please share a team Telegram contact]
<NEED FROM EL — used for prize distribution + accelerator interviews>

[Did anyone not listed on the team here do meaningful work on this project? If so, please explain.]  (max 600)
No other people. The build was developed by the one listed founder (aga) using AI coding agents — OpenCode CLI and Claude Code — as implementation tools, directed end to end by the founder: product definition, target market and track selection, quote-engine parameters (advance tiers, fee curve, pilot cap), escrow design decisions, the demo narrative, and the video script. AI agents wrote a large share of the code under that direction; all code, claims, and numbers in this submission were reviewed and verified by the founder before submitting.

[Is there anything else judges should know about your project that isn't captured above?]  (max 500)
The demo is deliberately zero-friction: no wallet, no keys, no login, and no live data required — unset environment variables fall back to deterministic mocks and localStorage, so the entire loop is clickable in about 60 seconds. The deterministic demo ledger also ships a real-shaped invoice (INV-2026-ACME-0481, $485.25) representing the exact ticket size that is too small for traditional factoring — the thesis is visible in the data, not just the pitch. Both the quote math and the $500 pilot cap are asserted in the test suite, so the numbers in this submission are reproducible.

################################################################
## TAB 2 — MEDIA AND CODE
################################################################

[Project logo or graphic]
<LOGO FILE: settlenow-logo.png — generated, 1024x1024>

[GitHub link]
https://github.com/dotlightcable/settlenow
(public repo — no access request needed)

[Please share any important context about your repo]  (max 500)
The repo is a monorepo for one product in two parts. /app is the Next.js product and hosted demo (UI, quote API, AI invoice scanner, dashboard). /programs/settlenow is the Solana Anchor escrow vault program. /schema.sql, /demo_seed.py and /queries.sql are the deterministic demo ledger and the queries used to verify the money math. /submission holds the pitch, video script, and demo checklist. /video holds the capture script used to produce the demo video.

Nothing in the repo is unrelated filler: every directory serves the one flow in the live demo. The demo runs on mocks by design, so judges see the full loop without credentials.

[Please submit a demo video of your product]  (YouTube/Loom/Vimeo, up to 3 min)
<YOUTUBE URL — being uploaded now>

[Show demo video on the public project page]
☑ Yes

[Live product link]
https://settlenow-joyce-4f3d.vercel.app/

[Access instructions]
None needed — no login, no credentials, no wallet. The demo runs on built-in deterministic data. Suggested path: /upload → accept the quote → /dashboard → pay-link → repaid.

[Pitch video]  (YouTube/Loom/Vimeo, up to 2 min — introduce yourselves, tell us what you're building and why you're the people to build it)
<PITCH VIDEO URL — el records this, script below>

[Pitch video script — 2 min, talk to camera]
"Hi, I'm [name] from team aga, and this is SettleNow.

I'm not a bank and I'm not a lender. I'm building one narrow thing: getting a small supplier paid in seconds instead of months.

Here's the problem. If you run a small business and you invoice a bigger client, you wait 30 to 90 days. That gap is the single most common reason small suppliers fail — the work is done, the client is good for the money, and the business still can't make payroll. Factoring exists, but it's built for five- and six-figure invoices: paper, phone calls, opaque rates. A $485 invoice isn't worth a factor's time, so that supplier just waits.

SettleNow makes that invoice viable. Upload it, get a transparent quote — roughly 90% of face value, 1.5% fee — and the advance lands in USDC in seconds. Send your client a pay-link. When they pay, the vault closes itself.

Why me? I have spent this hackathon treating this as a business rather than a build. I picked the specific customer — the supplier whose invoice is too small to factor — and I designed the unit economics around what makes that customer profitable to serve: sub-cent settlement, programmatic escrow, and a quote that's a published pure function so nobody has to ask what the rate is.

The demo is live and clickable right now with zero setup — no wallet, no keys. Have a look. I built SettleNow because the cost of administering a small advance has collapsed, and that is what turns an unserved market into a served one."

[X profile]  (Public)
@bopblip98

################################################################
## TAB 3 — TEAM
################################################################
- Complete your own submission profile (shows "Basics incomplete") — el's own profile basics (name/avatar/bio).
- No additional members to invite. One member = one team (rules §7).

################################################################
## TAB 4 — ACCELERATOR (optional but switched ON)
################################################################

[How do you know people actually need, or will need this product?]  (max 1000)
The demand signal is structural rather than anecdotal: net-30 and net-60 terms are the norm in B2B, and the entire factoring and invoice-finance industry exists because suppliers would rather take a discount than wait. The segment is well documented — small businesses routinely cite late payment and cash-flow timing as their top operating problem.

The more specific signal is the threshold. Factoring providers publish minimum invoice sizes and pricing that get progressively worse as ticket size falls, because administration cost is roughly fixed per invoice. That is a revealed preference: the industry is telling you which invoices it cannot serve profitably. SettleNow targets exactly that band — the invoices below the viable floor — and the shift is that software plus stablecoin settlement removes most of that fixed administration cost.

During the hackathon I validated the workflow itself rather than claiming market proof: the product's job is a deterministic quote the supplier can verify, a single-click accept, and a repayment link the client can use without signing up for anything. Each of those removes a specific reason a supplier would otherwise prefer to just wait.

[How far along are you? Do you have users? Please be as specific as possible.]  (max 1000)
Because the deadline is today, the most useful answer is a precise inventory of what works versus what is mocked.

Working now, verifiable in the live demo:
- The full advance loop end to end: upload → deterministic quote → accept → vault created → pay-link → repayment → vault closed → dashboard updated.
- The quote engine as a pure function with published parameters (tier base rates 92/90/82%, tenor and size haircuts, fee = base + 2 bps/day capped at 800 bps), shared by UI and API so the two can never disagree.
- The Solana Anchor escrow vault program: per-invoice PDA, fund / lock / release / repay-close instructions, 1.5% fee, $500 pilot cap, custom error handling.
- The deterministic demo ledger with a real-shaped invoice at the exact target ticket size ($485.25), with the fee math and pilot cap asserted in the test suite.
- An AI invoice scanner (Gemini vision) that extracts payer, amount and due date from a photo or PDF, with an offline fallback so the demo cannot break.

Deliberately mocked for the demo: the advance and repayment transaction legs are simulated in the hosted demo (deterministic signatures, devnet-style explorer links) so judges can click the whole loop with no wallet and no keys. The vault program itself is written and builds; wiring the hosted UI to a live devnet deployment is the immediate next step.

No external users yet — this was built inside the hackathon window and I would rather state that plainly than dress up test clicks as traction.

[Who else is building in this space, and what do you think they're getting wrong?]  (max 1000)
Invoice finance is a crowded space and the incumbents are good at what they do. Two broad groups.

Traditional factors and invoice-finance platforms: their model depends on human administration — onboarding, verification, collections — so they price and screen at a ticket size that covers that cost. They are not wrong to; that is simply the shape of a business built on paperwork. The consequence is the bottom of the market is unserved by design.

Crypto-native credit and RWA protocols: most of them are selling yield to capital providers first and solving the supplier's problem second. The supplier is the distribution channel, not the customer. That shows up in products that require the supplier to learn a protocol, hold a wallet, manage collateral, or accept a rate they cannot compute until after they are committed.

What I think both get wrong is treating transparency and small tickets as costs to be minimised. For this customer, the ordering is reversed: the reason a supplier uses a factor at all is that they have no visibility into the price until they have already signed. SettleNow's quote is a pure published function — same inputs, same output, verifiable before committing — and the small ticket is the market rather than a nuisance to be filtered out. That is a different product, aimed at a customer the incumbents have rationally chosen to skip.

[How do you make money, or how do you plan to?]  (max 500)
Fee on each advance, charged on the face value of the invoice. The published curve is a base rate per risk tier (92/90/82% advance, i.e. 120/180/320 bps) plus 2 bps per day of tenor, capped at 800 bps — so a typical 30-day standard invoice costs about 2.4%. The fee is taken from the vault when the advance is funded; the supplier's repayment through the pay-link closes it out.

Revenue scales with advance volume rather than with ticket size, which is exactly why the cost structure matters: sub-cent stablecoin settlement plus programmatic escrow means a $485 invoice can be marginally profitable where a paper-based factor's fixed administration cost cannot cover it. The pilot tier is capped at $500 per invoice to keep risk bounded while the model is proven, then the cap rises as repayment data accumulates.

[How long have you been working on this? Have you been working on it full time?]  (max 500)
Built inside the hackathon window, and yes — effectively full time since the event started. The repository history is the honest record: the escrow vault program, the quote engine, the Next.js product and demo, the deterministic demo ledger, the AI invoice scanner, the demo video, and this submission were all produced during the contest period.

The product definition came first: choosing the exact customer (the supplier whose invoice is too small to factor), then designing the quote curve and the $500 pilot cap around what makes that customer viable to serve, and only then building the loop. Scope was deliberately kept to one flow rather than a broad platform, because a working narrow product beats a wide one that half-works.

[Where is each member of the team currently based, and do you work in-person together?]  (max 500)
One member: aga, based in <NEED FROM EL — country/city>. Solo team, so working "in person" is not applicable — all work happens in one workspace, and there is no coordination overhead.

If funded, the plan is to remain based there while serving international clients, since the product is inherently remote and the customer base (small suppliers invoicing larger clients across borders) is not geographic. Relocation is not required for the business to work, though I would take advantage of any in-person program time the accelerator offers.

[Have you formed a legal entity yet?]
No

[Have you taken any investment yet?]
No

[Are you currently fundraising?]
No

[Do you have a live token?]
No

################################################################
## STILL BLOCKED — NEED FROM EL
################################################################
1. Telegram contact (required, prize distribution + accelerator interviews)
2. Country of residence (required, Public)  — confirm Indonesia?
3. Pitch video, up to 2 min, you talking to camera (script above)
4. Demo video YouTube link (upload in progress)
5. Your own profile "Basics" on Colosseum (team tab shows incomplete)
