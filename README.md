# Agent Odyssey — Worldline engineering workshop

Build a payment service with an agentic coding harness, then consume it through a Pricing Agent and a DeepAgent with Pricing/Policy subagents. **All payments, fees and merchant data are fictional.**

## Resources

See [RESOURCES.md](RESOURCES.md) for slides, initial kit, correction and all notebooks.

- [Web presentation](https://worldline.github.io/agent-odyssey-workshop/)
- [PDF](https://worldline.github.io/agent-odyssey-workshop/agent-odyssey.pdf)
- [Harness initial kit](harness/starter/) and [service correction](harness/solution/)
- [Notebook index](notebooks/README.md): four Colab notebooks and four local Jupyter variants.

## Start

Watching the harness demonstration does not require Copilot. Following it requires an active licence, current Copilot CLI and Node.js 22+ to run the generated service.

For workshop Colab labs, use a personal Gmail. A dedicated Mistral API key will be supplied privately during the workshop: no personal Mistral account, billing activation or purchase is required for participants. Store the key in **Colab Secrets → MISTRAL_API_KEY**, never in code or the service. For independent reuse outside the workshop, supply your own API access; hosted model usage is not guaranteed free. Backend checks and model checks are separate. Gemini is optional coding help, not the lab model.

For Jupyter, choose a Python 3.11+ kernel; the setup cells use %pip and an environment variable/masked prompt instead of google.colab imports. Start the backend using [its README](harness/solution/README.md). Jupyter on the service machine can use localhost; Colab requires the direct public HTTPS backend URL supplied by the service owner.

## Scope of hosting

GitHub Pages contains **only the self-contained presentation and PDF**. No service, frontend, notebooks or repository asset directories are deployed there. Presentation images are embedded in its HTML. Other resources remain in GitHub; Colab opens notebook files from this repository. There is no presenter console or Chrome control bridge in the public presentation.

## Rebuild

Node.js 22+, Python 3.11+. Run npm ci, npm run notebooks:build, npm run notebooks:check. For presentation/PDF: npx playwright install chromium, then npm run build:pages. The browser is used only to render the PDF. GitHub Actions rebuilds/deploys the same presentation-only artifact on main.

The PDF captures representative animation states; use the web presentation for the complete animated mechanisms. The Colab/Jupyter variants share exercise code and differ only in environment setup. Notebook outputs are cleared before publication.

Validation distinguishes syntax/import/offline model-simulation checks from actual Colab/Mistral execution. The latter is a manual presenter/participant check and can consume credits; CI performs no paid inference.

MIT applies to workshop code; see [NOTICE.md](NOTICE.md) for material/brand attribution and scope.
