// Policy resolution is deterministic and separate from price calculation.
export function validateQuote(quote, policy, methodIds) {
  const resolved = policyForAmount(policy, methodIds, quote.amount_cents);
  const enabled = policy.allowed_payment_methods.includes(quote.payment_method);
  const cap = resolved.effective_fee_caps[quote.payment_method];
  const withinLimit = quote.fee_cents <= cap;
  const failures = [];
  if (!enabled) failures.push({ code: "PAYMENT_METHOD_DISABLED", message: "This payment method is disabled by the merchant." });
  if (!withinLimit) failures.push({ code: "FEE_CAP_EXCEEDED", message: "The quoted fee exceeds the applicable merchant limit." });
  return { status: enabled && withinLimit ? "passed" : "failed", payment_method_enabled: enabled, fee_within_limit: withinLimit, effective_fee_cap_cents: cap, failures };
}
export function policyForAmount(policy, methodIds, amountCents) {
  if (amountCents === undefined) return policy;
  if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 100_000_000) throw new RangeError('Invalid amount_cents.');
  const limits = Object.fromEntries(methodIds.map((id) => {
    const bps = policy.percentage_fee_caps?.[id];
    const cap = bps === undefined ? policy.max_fee_cents : Number(BigInt(amountCents) * BigInt(bps) / 10000n);
    return [id, cap];
  }));
  return { ...policy, amount_cents: amountCents, effective_fee_caps: limits };
}
