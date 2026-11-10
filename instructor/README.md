# Agent Odyssey — local instructor bundle

This facilitator-oriented source folder is part of the repository but is excluded from the GitHub Pages artifact. It contains the current slide/controller snapshot, initial Harness kit, finished service and an organiser-only ngrok launcher. The real `instructor/.env` credential file is intentionally not in the repository; `.gitignore` excludes it. Only the empty `.env.example` template is included. No API key, participant data or browser login is included.

## Setup once

Node.js 22+ and Brave Browser are required for the native app-mode controller.

```bash
cd instructor
npm ci
```

## Launch all three services with one command

```bash
cd instructor
npm run all
```

The supervisor runs the equivalent of `npm run slides` and `npm run start`, then runs `npm run share`. Ensure local ports **8100 and 8000 are free** first; it refuses to proceed if either child server fails, even if a similar pre-existing server happens to answer on that port. Stop only workshop processes you recognize; do not kill unknown processes. It waits until the local presentation route and the exact synthetic North Star Supply API are healthy **before** it starts ngrok. If either server fails to start or is the wrong service, it stops and opens no tunnel. The ngrok launcher still asks for your token privately when `.env` is empty.

Keep this terminal open while presenting. Press **Ctrl+C once** to close the tunnel and stop the slides and API processes. Only port 8000 is exposed; slide/controller and browser-debugging ports remain local. The combined script is the recommended path and starts all three; use the separate commands below only when you need to diagnose or restart one service.

## 1. Start slides and controller

```bash
npm run slides
```

Open **http://127.0.0.1:8100/start** and click **Launch presentation**. This opens/reuses the projection and opens a compact Brave controller without tabs/address bar. The controller shows previous/next/fullscreen, current slide/total and current timer. Timer starts/resets are manual.

The dedicated Brave profile uses local debugger port **9234**, leaving Brave/Mistral's 9222 alone. This is a separate instructor profile: do not close your normal Brave/Mistral session. If you previously launched the instructor in Chrome on 9233, close only those old projection/controller windows; the new Brave pair uses 9234 and does not reuse them. No presenter or slide server is publicly exposed.

Fallback: `/` is the projection; `/presenter` is the web controller. Left/right navigate, F toggles projection fullscreen. Refreshing only the controller preserves the projection timer; refreshing the projection resets timer states.

If 8100 is already occupied by the old workshop slides server, stop that server with Ctrl+C first. Do not stop the API on 8000 by mistake. Alternatively, run `SLIDES_PORT=8101 npm run slides` and use the URL printed by the server.

## 2. Start the completed service — second terminal

```bash
cd instructor
npm start
```

The reference UI/API is **http://127.0.0.1:8000**. `npm test` runs the existing service checks. If the exact reference service is already running on 8000, you may reuse it and verify with `npm run check:service`; do not launch a duplicate process.

For a different port: `npm start -- --port 8001`.

## 3. Expose only the service with ngrok — third terminal

```bash
cd instructor
npm run share
```

Before the workshop, fill **`instructor/.env`** with your organiser-only ngrok token:

```dotenv
NGROK_AUTHTOKEN=paste-your-private-ngrok-token-here
```

The `.env` file is excluded by `instructor/.gitignore`; never share it, add it to email, or commit it. An empty value falls back to masked terminal input. The launcher verifies `/health` and merchant policy before exposing the process on 8000. It prints the public HTTPS service URL. Keep this terminal running; Ctrl+C disconnects the tunnel.

For a different service port: `npm run share -- --port 8001`.

Paste the direct HTTPS base URL into the preparation slide's backend field and into each notebook. The model API key is separate and never sent to this service. Never tunnel port 8100/8101 or debugger port 9234. Do not commit credentials or type them into this README.

No tunnel is opened by creating this folder or running `npm run slides`. `npm run all` deliberately opens the verified API tunnel after both local servers pass their health checks; running `npm run share` separately also explicitly opens public exposure.

## Included folders

- `slides/`: presentation snapshot, controller/start pages, scripts, styles and assets.
- `harness/starter/`: short brief, OpenAPI YAML, fixtures, initial visuals and plan/execution prompts. Copy into a fresh project directory for the live Harness build.
- `harness/solution/`: completed Node/Express + vanilla frontend, specs/design, prompts and tests.
- `tooling/`: fixed local presentation/window actions and guarded service/ngrok launchers.

The bundle is a snapshot: canonical slide edits happen in the parent workshop's `slides/` and need recopying into this folder. Public resources/notebooks remain at https://github.com/worldline/agent-odyssey-workshop .

The service is synthetic and stateless, with no real payments or backend LLM calls. The ngrok URL is temporary. Models/API credits and participant keys are not bundled.
