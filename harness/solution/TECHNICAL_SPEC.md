# Technical specification

Node.js 22+, Express 5.3.0, vanilla HTML/CSS/JS Fetch, JSON fixtures. One loopback-bound process serves frontend and API; no database or model client.

- GET /health: synthetic service status.
- GET /payment-methods: currency and method catalogue.
- POST /quotes: amount_cents and payment_method; fee components plus validation.
- GET /merchant-policy: static rules; amount_cents query resolves effective caps.
- GET /openapi.json: explicit service contract.

Amounts are integers from 1 to 100,000,000 cents. Unknown methods return 404; invalid input 422. JSON limit 8 KB. No card alias. Errors avoid secret/internal detail. Validation includes status, enabled flag, fee_within_limit, effective cap and failure codes PAYMENT_METHOD_DISABLED/FEE_CAP_EXCEEDED.

Use npm test for unit/API/frontend-source checks. GitHub Pages is not a backend host: this service and its frontend are never copied to the Pages artifact.
