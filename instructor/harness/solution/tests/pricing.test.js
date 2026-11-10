import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { paymentMethod, calculateQuote } from '../pricing.js';
const catalogue = JSON.parse(readFileSync(new URL('../data/payment-methods.json', import.meta.url)));
const methods = new Map(catalogue.methods.map((value) => [value.id, paymentMethod(value)]));

test('known 100 EUR fees and independent policy', () => {
  for (const [id, fee] of Object.entries({ visa: 170, mastercard: 160, wallet: 130, bank_transfer: 50 })) assert.equal(calculateQuote(10000, methods.get(id)).fee_cents, fee);
});
test('half-cent rounds up', () => assert.equal(calculateQuote(125, methods.get('wallet')).fee_cents, 12));
test('invalid amounts are rejected', () => {
  for (const value of [0, -1, 1.5, '100', true, null, 100000001]) assert.throws(() => calculateQuote(value, methods.get('mastercard')));
});
test('invalid method configuration is rejected', () => {
  for (const rate of [-1, true, 1.5]) assert.throws(() => paymentMethod({ id: 'bad', name: 'Bad', rate_basis_points: rate, fixed_fee_cents: 0 }));
});
test('starter data matches reference and Wallet alone is eligible', () => {
  for (const file of ['payment-methods.json', 'merchant-policy.json']) {
    const reference = JSON.parse(readFileSync(new URL('../data/' + file, import.meta.url)));
    const starter = JSON.parse(readFileSync(new URL('../../starter/data/' + file, import.meta.url)));
    assert.deepEqual(reference, starter);
  }
  const policy = JSON.parse(readFileSync(new URL('../data/merchant-policy.json', import.meta.url)));
  assert.deepEqual([...methods.values()].filter((method) => policy.allowed_payment_methods.includes(method.id) && calculateQuote(10000, method).fee_cents <= policy.max_fee_cents).map((method) => method.id), ['wallet']);
});
