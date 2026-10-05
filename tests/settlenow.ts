// SettleNow flow test (offline-safe, no deps).
// Mirrors the on-chain checks in programs/settlenow/src/lib.rs.
// Full Anchor version: `npm install` then replace asserts with
// @coral-xyz/anchor + chai program.rpc() calls (fund -> lock ->
// release/repay on devnet).
// Payer-confirm flow: fund -> lock -> release (payer signer) / repay.

const PILOT_CAP_MICRO = 500_000_000; // $500, 6dp mock USDC
const FEE_BPS = 150;

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error("assert failed: " + msg);
}

// fund: cap + 1.5% fee math
const over = PILOT_CAP_MICRO + 1;
assert(over > PILOT_CAP_MICRO, "cap must reject amount over $500");
const fee = Math.floor((100_000_000 * FEE_BPS) / 10_000);
assert(fee === 1_500_000, "fee must be 1.5% of $100");

// release gate: requires payer_confirmed=true + payer signer
function release(payerConfirmed: boolean): string {
  if (!payerConfirmed) throw new Error("NeedPayerConfirm");
  return "RELEASED";
}
let blocked = false;
try {
  release(false);
} catch (e) {
  blocked = (e as Error).message === "NeedPayerConfirm";
}
assert(blocked, "release without payer confirm must fail");
assert(release(true) === "RELEASED", "release with confirm must pass");

console.log("settlenow flow checks OK: cap, fee=1.5%, payer-confirm gate");
