import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../app.js';

async function service(t) {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = (route, options = {}) => fetch(base + route, options);
  const quote = (payload, headers = {}) => request('/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) });
  return { request, quote };
}

test('health, methods and policy', async (t) => {
  const { request } = await service(t);
  assert.equal((await (await request('/health')).json()).status, 'ok');
  const catalogue = await (await request('/payment-methods')).json();
  assert.deepEqual(catalogue.methods.map((m) => m.id), ['visa', 'mastercard', 'wallet', 'bank_transfer']);
  assert.deepEqual(catalogue.methods.find((m) => m.id === 'visa').brands, ['Visa']);
  const policy = await (await request('/merchant-policy')).json();
  assert.equal(policy.max_fee_cents, 150);
  assert.deepEqual(policy.allowed_payment_methods, ['visa', 'mastercard', 'wallet']);
});
test('all four quotes remain available, including the disallowed method', async (t) => {
  const { quote } = await service(t);
  for (const [method, expected] of Object.entries({ visa: 170, mastercard: 160, wallet: 130, bank_transfer: 50 })) {
    const response = await quote({ amount_cents: 10000, payment_method: method });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).fee_cents, expected);
  }
});
test('API returns explicit policy pass/fail and reasons', async (t) => {
  const { quote } = await service(t);
  const bank = await (await quote({ amount_cents: 10000, payment_method: 'bank_transfer' })).json();
  assert.equal(bank.validation.status, 'failed');
  assert.equal(bank.validation.payment_method_enabled, false);
  assert.equal(bank.validation.fee_within_limit, true);
  assert.equal(bank.validation.failures[0].code, 'PAYMENT_METHOD_DISABLED');
  const mastercard = await (await quote({ amount_cents: 10000, payment_method: 'mastercard' })).json();
  assert.equal(mastercard.validation.failures[0].code, 'FEE_CAP_EXCEEDED');
  const visa = await (await quote({ amount_cents: 100000, payment_method: 'visa' })).json();
  assert.equal(visa.validation.status, 'passed');
  assert.equal(visa.validation.effective_fee_cap_cents, 1500);
  const wallet = await (await quote({ amount_cents: 10000, payment_method: 'wallet' })).json();
  assert.equal(wallet.validation.status, 'passed');
});
test('invalid amounts, missing fields and unknown ids', async (t) => {
  const { quote } = await service(t);
  for (const amount of [0, -1, 1.5, '10000', true, 100000001]) assert.equal((await quote({ amount_cents: amount, payment_method: 'mastercard' })).status, 422);
  assert.equal((await quote({})).status, 422);
  assert.equal((await quote({ amount_cents: 10000, payment_method: 'missing' })).status, 404);
});
test('malformed and oversized JSON fail safely', async (t) => {
  const { request } = await service(t);
  assert.equal((await request('/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await request('/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oversized: 'x'.repeat(10000) }) })).status, 413);
});
test('frontend, assets and explicit OpenAPI contract', async (t) => {
  const { request } = await service(t);
  const page = await request('/');
  const markup = await page.text();
  assert.match(markup, /North Star Supply/);
  assert.ok(markup.indexOf('id="methods-title"') < markup.indexOf('id="quote-title"'));
  assert.ok(!markup.includes('Sticker sheet'));
  assert.ok(!markup.includes('connection-settings'));
  assert.ok(!markup.includes('access-token'));
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  for (const asset of ['app.js', 'styles.css', 'emblem.svg', 'shuttle.svg', 'viewport.svg']) assert.equal((await request('/assets/' + asset)).status, 200);
  const contract = await (await request('/openapi.json')).json();
  assert.equal(contract.paths['/quotes'].post.requestBody.required, true);
});
test('demo API and contract require no credentials', async (t) => {
  const { request, quote } = await service(t);
  const health = await (await request('/health')).json();
  assert.equal(health.demo, true);
  for (const path of ['/payment-methods', '/merchant-policy']) assert.equal((await request(path)).status, 200);
  assert.equal((await quote({ amount_cents: 10000, payment_method: 'mastercard' })).status, 200);
  const contract = await (await request('/openapi.json')).json();
  assert.ok(!contract.components.securitySchemes);
  for (const item of Object.values(contract.paths)) for (const operation of Object.values(item)) assert.ok(!operation.security);
});
test('amount-aware policy query and removed card alias', async (t) => {
  const { request, quote } = await service(t);
  const policy = await (await request('/merchant-policy?amount_cents=100000')).json();
  assert.equal(policy.effective_fee_caps.visa, 1500);
  assert.equal(policy.effective_fee_caps.mastercard, 150);
  assert.equal((await request('/merchant-policy?amount_cents=abc')).status, 422);
  assert.equal((await quote({ amount_cents: 10000, payment_method: 'card' })).status, 404);
});
test('18 concurrent LOCAL quote requests succeed', async (t) => {
  const { quote } = await service(t);
  const fees = await Promise.all(Array.from({ length: 18 }, async () => (await (await quote({ amount_cents: 10000, payment_method: 'mastercard' })).json()).fee_cents));
  assert.deepEqual(fees, Array(18).fill(160));
});
