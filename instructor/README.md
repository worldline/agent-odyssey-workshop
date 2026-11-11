# Agent Odyssey — facilitator bundle

This facilitator-oriented source folder is part of the repository but is excluded from GitHub Pages. It contains the slides with their integrated auto-hiding footer, starter Harness kit, finished service and an organiser-only ngrok launcher. The real `instructor/.env` is local and Git-ignored; only the empty `.env.example` is included. No API key, participant list or browser login is included.

## Setup once

Node.js 22+ and a modern browser are needed. The slides work in one window, including Safari: no Chrome/Brave app mode, separate controller, debugger port or launch button is required.

```bash
cd instructor
npm ci
```

## Recommended: start all three with one command

Ensure ports **8100 and 8000 are free** first. Stop only workshop servers you recognize; do not terminate unknown processes.

```bash
cd instructor
npm run all
```

The supervisor starts the slides server and synthetic API using their Node entrypoints, waits for both to pass health checks, then starts the ngrok launcher with the `.env` file loaded. If either local port is occupied or either server is wrong/unhealthy, it stops and opens no tunnel. It terminates the complete child process groups on Ctrl+C or hang-up and sends a force-kill only if they have not stopped within five seconds.

Open the printed slide URL, normally **http://127.0.0.1:8100/**, in one browser window. The `/start` legacy address redirects there. Navigation and the current section timer appear in an auto-hiding footer: move the pointer, touch, or press a key to reveal it; it hides after five idle seconds. Keyboard: arrows/Enter/Space navigate, number keys select chapters, F requests fullscreen. The timer starts/resets manually.

Keep the launcher terminal open during the workshop. Press **Ctrl+C once** to stop the tunnel and both local servers. Only the checked synthetic API on port 8000 is exposed; **never tunnel the slide server**.

### Prepare the ngrok token in advance

Fill `instructor/.env` locally:

```dotenv
NGROK_AUTHTOKEN=your-private-ngrok-token
```

`.env` is excluded by `instructor/.gitignore`; do not share or commit it. `.env.example` is an empty template. If `NGROK_AUTHTOKEN` is blank, the launcher asks for it using masked terminal input. The ngrok script verifies `/health` and merchant policy before opening the tunnel. It prints the direct temporary HTTPS API base URL. Enter that URL into the preparation slide and notebooks. The Mistral/Colab key is independent and is never sent to the service.

The combined launcher is the only command that starts all three. The individual commands below are for diagnosis/restarting components; starting one never starts the others.

## Individual commands

### Slides, single browser window

```bash
cd instructor
npm run slides
```

Open the URL printed by the server. `http://127.0.0.1:8100/start` redirects to the projection. To use another slide port: `SLIDES_PORT=8101 npm run slides`. Timer state resets if you reload the slide page.

### Completed service, in a second terminal

```bash
cd instructor
npm start
```

Frontend and API: **http://127.0.0.1:8000**. `npm test` runs the service tests. If the exact reference service is already running, reuse it and verify with `npm run check:service`; do not launch a duplicate server.

### Open only the service tunnel, in a third terminal

```bash
cd instructor
npm run share
```

This explicitly exposes the verified synthetic API on port 8000 until Ctrl+C. For a different backend port: `npm run share -- --port 8001`. It does not share any slide page.

## Included folders

- `slides/`: current presentation, assets, animation and integrated footer controls.
- `harness/starter/`: functional brief, OpenAPI YAML, fixtures, initial visuals and ordered build prompts.
- `harness/solution/`: complete Node/Express service/frontend, specifications, visual reference and tests.
- `tooling/`: local slide server, readiness/tunnel launcher and private ngrok-token input.
- `MOCK-PAYMENT-API.md`: copy/paste offline backend mock for Colab when ngrok is unavailable.

This is a snapshot. Canonical slide changes happen in the parent workshop's `slides/`; synchronize those files into this bundle before repackaging. Participant notebooks and Colab copies remain indexed at https://github.com/worldline/agent-odyssey-workshop/tree/main/notebooks/README.md .

The backend is stateless, fictional and uses synthetic data. It does not perform real payments or make model calls. The ngrok URL is temporary; Mistral API access, model allowance and participant keys are not bundled.
