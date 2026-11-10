# Harness prompt sequence

These are reproducible workshop prompts, not a claim that one deterministic live transcript produced every file. Review each plan; generated code and provider output can differ. Never supply credentials, confidential code or participant data.

## 1 — Establish context

> Read FUNCTIONAL_SPEC.md, TECHNICAL_SPEC.md, openapi.yml, data/ and design-reference.png. We are building North Star Supply, the fictional onboard shop of Odyssey. Create project instructions describing scope, inputs, safety boundaries and acceptance checks. Do not implement yet. No real payments, database, authentication, backend LLM, extra logistics or external publishing.

## 2 — Functional specification in plan mode

> In plan mode, turn the short brief and API contract into a concise functional specification. The shop needs a method catalogue, a EUR fee quote simulator and merchant eligibility rules. Use integer cents/basis points and the supplied fixtures. Pricing and acceptance are separate; HTTP 200 can carry validation failed. Bank transfer remains quotable but disabled. Visa has an amount-dependent cap. Do not invent rates or scope. Save FUNCTIONAL_SPEC.md and wait for approval.

## 3 — Technical specification in plan mode

> Propose a minimal Node.js 22+/Express implementation with a plain HTML/CSS/JavaScript frontend served by the same process. Keep all calculations and policy verdicts in the API. Follow openapi.yml exactly, with safe input errors, integer rounding, synthetic data and loopback binding on 8000. Explain files, endpoints, data flow and acceptance tests in TECHNICAL_SPEC.md. No database, React/Vue scaffold, authentication or backend model calls. Do not code before approval.

## 4 — Design/mockup in plan mode

> Use design-reference.png and the supplied SVGs as the visual direction: premium navy/teal space workshop, cream and amber accents, rounded panels and subtle motion. Plan one desktop dashboard showing payment methods, a quote/API simulator and merchant policy. Show Visa/Mastercard as distinct methods, Wallet and disabled-but-testable Bank transfer. The frontend displays the API's actual quote and validation; any HTTP view uses already-returned payloads rather than extra requests. Describe the layout/wireframe; do not invent navigation, inventory or extra business features. Wait for approval.

## 5 — Execute the approved plan

> Implement the approved functional, technical and design plan in this project directory. Generate the backend, frontend and tests without changing the API contract or fixtures. Run npm test, fix failures and start the application on 127.0.0.1:8000. No secrets, paid/model calls, real payments, tunnel or public deployment. Report what actually passed and what remains unverified.

## 6 — Verify evidence

> Verify the reference €100 fees: Visa 170, Mastercard 160, Wallet 130 and Bank transfer 50 cents. Verify that Wallet alone is eligible, while Bank transfer is cheap but disabled and Visa/Mastercard exceed their caps. Verify amount-resolved Visa eligibility at €1,000. Demonstrate invalid input/unknown-method handling. Inspect actual tests/API responses rather than claiming success. Explain why HTTP 200 is not payment approval.

The presentation and its QR resources are separate from the generated service. Model keys belong to notebooks, never this backend/frontend. Any later public API exposure is a separate service-owner decision.
