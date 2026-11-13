# Repository agent guidance

## Scope and safety

- This is a fictional training workshop. No code simulates real payment processing. Never describe HTTP 200 as a payment approval; service validation is a separate result.
- Never add Mistral, ngrok, GitHub or other credentials; Colab owner details; participant emails/rosters; local machine paths; or browser/admin state to this repository or Pages.
- `instructor/.env` is facilitator-local and Git-ignored. It contains an organiser-only ngrok credential when configured. Do not add it to commits, public assets, archives or Pages. Only `.env.example` belongs in Git.
- Public code/repo updates and Pages deployments need explicit user authorization. Do not initiate paid inference, purchase credits, change billing, or expose the API without the workshop owner's authorization.

## Sources of truth

- Public participant assets and service: `harness/starter/` and `harness/solution/`.
- **Colab notebooks live in the workshop owner's Google Drive and are maintained in the Google UI, not in this repository.** Do not regenerate/upload Colab `.ipynb` files here. Participant links are listed in `notebooks/README.md` with `?#copy=true`.
- Keep exactly four repository Jupyter notebooks in `notebooks/jupyter/`. For each exercise-content change made in Google Colab, mirror the corresponding template/correction content into Jupyter in the same task. Preserve environment-specific setup: Colab `!pip` + `google.colab.userdata`; Jupyter `%pip` + environment variable/masked prompt, without Colab imports.
- Pin `requests==2.32.4` in all maintained Jupyter copies and `notebooks/requirements-tp1.txt`; Google Colab's base package requires that exact version. Check `tooling/check_notebooks.py` prevents regressions.
- TP2 target: DeepAgents 0.7.34, a `create_deep_agent` orchestrator, two isolated Pricing/Policy subagents using the built-in `task` delegation tool, and no auto-added general-purpose subagent. Keep API evidence and tool responsibilities explicit. The offline fake model is not live-provider validation.
- Workshop resource redirects and QR mappings are in `slides/QR-RESOURCES.md`, `slides/resources.json` and `slides/qr-links-verified.json`. Confirm Drive permissions with an intended learner account; an active redirect is not proof of access.

## Presentation and deployment

- The source for presentation pages is `presentation/source/`; rebuild logic is `tooling/build_presentation.mjs` and `tooling/export_pdf.mjs`.
- Pages must deploy **only** `build/pages/index.html` and `build/pages/agent-odyssey.pdf`. Never include the service, frontend, instructor bundle, notebook directories or separate asset folders in the Pages artifact. The presentation builder embeds its assets and removes presenter/browser-control bridges.
- Controls are an auto-hiding footer within one browser window. A click toggles visibility; arrow-key navigation must not reveal it; keep the five-second idle hide and Tab accessibility. Safari fullscreen fallback should remain. No separate presenter/Chrome window.
- The instructor-only `npm run all` starts slides/service, verifies both local processes and then tunnels only service port 8000. Maintain process-group cleanup, port preflight and loopback-only slide serving. Do not expose the slide server or browser debugger.
- Run `npm run notebooks:check` and relevant service tests for repository changes. A PDF build uses Playwright on CI; don't run ad hoc browser/Playwright checks unless the user asks. CI performs no paid model calls.
