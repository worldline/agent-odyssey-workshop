// Pure deterministic pricing, independent of Express and any LLM.
export function paymentMethod(value) {
  const { id, name, rate_basis_points, fixed_fee_cents } = value;
  if (typeof id !== 'string' || !id || typeof name !== 'string' || !name) {
    throw new TypeError('Payment methods need an id and a name.');
  }
  if (![rate_basis_points, fixed_fee_cents].every((n) => Number.isSafeInteger(n) && n >= 0)) {
    throw new TypeError('Rates and fixed fees must be non-negative safe integers.');
  }
  return Object.freeze({ id, name, rate_basis_points, fixed_fee_cents });
}

export function calculateQuote(amountCents, method) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 100_000_000) {
    throw new RangeError('amount_cents must be an integer from 1 to 100000000.');
  }
  // Half-up rounding in integer arithmetic; 140 basis points means 1.4%.
  const proportional = Number((BigInt(amountCents) * BigInt(method.rate_basis_points) + 5000n) / 10000n);
  const fee = proportional + method.fixed_fee_cents;
  if (!Number.isSafeInteger(fee)) throw new RangeError('Fee is outside the supported range.');
  return {
    amount_cents: amountCents,
    currency: 'EUR',
    payment_method: method.id,
    fee_cents: fee,
    calculation: {
      rate_basis_points: method.rate_basis_points,
      fixed_fee_cents: method.fixed_fee_cents,
      proportional_fee_cents: proportional,
    },
  };
}
