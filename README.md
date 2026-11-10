# Agent Odyssey — Worldline engineering workshop

<p align="center">
  <img src="assets/agent-odyssey-banner.jpg" alt="Agent Odyssey — the Worldline engineering crew prepares for its next AI mission" width="960">
</p>

Build a payment service with an agentic coding harness, then consume it through a Pricing Agent and a DeepAgent with Pricing/Policy subagents. **All payments, fees and merchant data are fictional.**

## Resources

See [RESOURCES.md](RESOURCES.md) for slides, initial kit, correction and all notebooks.

- [Web presentation](https://worldline.github.io/agent-odyssey-workshop/)
- [PDF](https://worldline.github.io/agent-odyssey-workshop/agent-odyssey.pdf)
- [Harness initial kit](harness/starter/) and [service correction](harness/solution/)
- [Notebook index](notebooks/README.md): four Google-hosted Colab links and four local Jupyter files.
- [Facilitator bundle](instructor/): local slides with integrated controls, service launcher and ngrok instructions; excluded from Pages.

## Start

Watching the harness demonstration does not require Copilot. Following it requires an active licence, current Copilot CLI and Node.js 22+ to run the generated service.

For workshop Colab labs, use a personal Gmail. A dedicated Mistral API key will be supplied privately during the workshop: no personal Mistral account, billing activation or purchase is required for participants. Store the key in **Colab Secrets → MISTRAL_API_KEY**, never in code or the service. For independent reuse outside the workshop, supply your own API access; hosted model usage is not guaranteed free. Backend checks and model checks are separate. Gemini is optional coding help, not the lab model.

For Jupyter, choose a Python 3.11+ kernel; the setup cells use %pip and an environment variable/masked prompt instead of google.colab imports. Start the backend using [its README](harness/solution/README.md). Jupyter on the service machine can use localhost; Colab requires the direct public HTTPS backend URL supplied by the service owner.

## Scope of hosting

GitHub Pages contains **only the self-contained presentation and PDF**. The facilitator bundle is source-only and is not part of the Pages artifact. No service, frontend, notebooks or repository asset directories are deployed there. Presentation images are embedded in its HTML. Other resources remain in GitHub; Colab notebooks are maintained in Google and accessed through the Drive links in the notebook index, not repository .ipynb copies. Navigation and timing controls are an auto-hiding footer in the same public presentation window. There is no separate presenter console or Chrome control bridge.

## Rebuild

Node.js 22+, Python 3.11+. Run npm ci, then npm run notebooks:check for the four local Jupyter notebooks. For presentation/PDF: npx playwright install chromium, then npm run build:pages. The browser is used only to render the PDF. GitHub Actions rebuilds/deploys the same presentation-only artifact on main.

The PDF captures representative animation states; use the web presentation for the complete animated mechanisms. Google Colab is the primary editing location for its four notebooks. Exercise-content changes must be mirrored into the four repository Jupyter notebooks while preserving their local setup. Outputs are cleared before publication. No Colab copies or generator are kept here; Google authentication is not added to CI.

Validation distinguishes syntax/import/offline model-simulation checks from actual Colab/Mistral execution. The latter is a manual presenter/participant check and can consume credits; CI performs no paid inference.

MIT applies to workshop code; see [NOTICE.md](NOTICE.md) for material/brand attribution and scope.
