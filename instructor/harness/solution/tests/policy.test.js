import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paymentMethod, calculateQuote } from '../pricing.js';
import { policyForAmount } from '../policy.js';
const catalogue = JSON.parse(readFileSync(new URL('../data/payment-methods.json', import.meta.url)));
const policy = JSON.parse(readFileSync(new URL('../data/merchant-policy.json', import.meta.url)));
const methods = catalogue.methods.map(paymentMethod);
const ids = methods.map((method) => method.id);

test('100 EUR keeps Wallet as the only eligible method', () => {
  const limits = policyForAmount(policy, ids, 10000).effective_fee_caps;
  const eligible = methods.filter((method) => policy.allowed_payment_methods.includes(method.id) && calculateQuote(10000, method).fee_cents <= limits[method.id]);
  assert.deepEqual(eligible.map((method) => method.id), ['wallet']);
});
test('Visa accepts large amounts under its proportional cap', () => {
  const visa = methods.find((method) => method.id === 'visa');
  const mastercard = methods.find((method) => method.id === 'mastercard');
  for (const [amount, expected] of [[100000, 980], [500000, 4580], [100000000, 900080]]) {
    const limits = policyForAmount(policy, ids, amount).effective_fee_caps;
    assert.equal(calculateQuote(amount, visa).fee_cents, expected);
    assert.ok(expected <= limits.visa);
    assert.ok(calculateQuote(amount, mastercard).fee_cents > limits.mastercard);
  }
});
test('percentage caps round down and invalid amounts fail', () => {
  assert.equal(policyForAmount(policy, ids, 13333).effective_fee_caps.visa, 199);
  for (const amount of [0, -1, 1.5, true, 100000001]) assert.throws(() => policyForAmount(policy, ids, amount));
});
