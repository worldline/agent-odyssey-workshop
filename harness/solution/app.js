import express from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { paymentMethod, calculateQuote } from './pricing.js';
import { policyForAmount, validateQuote } from './policy.js';

const ROOT = import.meta.dirname;
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

export function createApp({ dataDir = path.join(ROOT, 'data') } = {}) {
  const catalogue = JSON.parse(readFileSync(path.join(dataDir, 'payment-methods.json'), 'utf8'));
  const policy = JSON.parse(readFileSync(path.join(dataDir, 'merchant-policy.json'), 'utf8'));
  if (catalogue.currency !== 'EUR' || policy.currency !== 'EUR') throw new Error('EUR only.');
  const methods = catalogue.methods.map(paymentMethod);
  const index = new Map(methods.map((method) => [method.id, method]));
  if (index.size !== methods.length) throw new Error('Method ids must be unique.');
  if (!policy.allowed_payment_methods.every((id) => index.has(id))) throw new Error('Unknown method in policy.');
  if (!Number.isSafeInteger(policy.max_fee_cents) || policy.max_fee_cents < 0) throw new Error('Invalid fee cap.');
  for (const [id, bps] of Object.entries(policy.percentage_fee_caps || {})) {
    if (!index.has(id) || !Number.isSafeInteger(bps) || bps < 0 || bps > 10000) throw new Error('Invalid percentage fee cap.');
  }
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store' });
    next();
  });
  app.use(express.json({ limit: '8kb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'north-star-supply', demo: true, version: '1.0.0' }));
  app.get('/payment-methods', (_req, res) => res.json(catalogue));
  app.get('/merchant-policy', (req, res) => {
    const raw = req.query.amount_cents;
    if (raw === undefined) return res.json(policy);
    const amount = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000_000) return res.status(422).json({ detail: 'Invalid amount_cents.' });
    return res.json(policyForAmount(policy, methods.map((method) => method.id), amount));
  });
  app.post('/quotes', (req, res) => {
    const input = req.body;
    if (!input || !Number.isSafeInteger(input.amount_cents) || input.amount_cents < 1 || input.amount_cents > 100_000_000 || typeof input.payment_method !== 'string' || input.payment_method.length < 1 || input.payment_method.length > 64) {
      return res.status(422).json({ detail: 'Use integer amount_cents from 1 to 100000000 and a non-empty payment_method id.' });
    }
    const method = index.get(input.payment_method);
    if (!method) return res.status(404).json({ detail: 'Unknown payment method.' });
    const quote = calculateQuote(input.amount_cents, method);
    return res.json({ ...quote, validation: validateQuote(quote, policy, methods.map((item) => item.id)) });
  });
  app.get('/openapi.json', (_req, res) => res.sendFile(path.join(ROOT, 'openapi.json'), { cacheControl: false }));
  app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'frontend', 'index.html'), { cacheControl: false }));
  app.use('/assets', express.static(path.join(ROOT, 'frontend'), { cacheControl: false, etag: false, lastModified: false }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ detail: 'Request body too large.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ detail: 'Invalid JSON.' });
    return res.status(500).json({ detail: 'Service error.' });
  });
  return app;
}
