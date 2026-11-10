# North Star Supply — reference correction

```bash
npm install
npm test
npm start
```

Node.js 22+. The UI/API bind to **http://127.0.0.1:8000**. From the repository root you can also run npm ci, then npm start --workspace=harness/solution.

For Colab, the service owner must provide a public HTTPS URL. If using an authenticated ngrok CLI, expose only this API/UI process on port 8000: `ngrok http http://127.0.0.1:8000`. Paste its direct HTTPS base URL into the notebook, not the notebook short link. Do not publish tunnel tokens or persist the event's temporary URL in the repository. Never tunnel the slide server.

Jupyter on the same machine can use the default localhost backend URL. Model calls are made by notebooks, never by this service. Fixtures are synthetic; this is not a real-payment or production-authentication design.

See FUNCTIONAL_SPEC.md, TECHNICAL_SPEC.md and PROMPTS.md. The source/tests are reference material; model-generated builds can differ and must be verified.
