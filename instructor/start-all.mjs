// Start slides, the synthetic service, and only then the approved service tunnel.
// Spawn the Node entry points directly as ordinary children so signals propagate
// through the `npm run all` terminal session and are handled by each service.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const slidesPort = Number(process.env.SLIDES_PORT || 8100);
const servicePort = Number(process.env.PORT || 8000);
const children = new Map();
let stopping = false;
let stopPromise;

async function assertPortFree(port) {
  const server = createServer();
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      throw new Error('Port ' + port + ' is already in use. Stop the previous workshop process yourself, verify the process, then retry. Nothing was terminated.');
    }
    throw error;
  } finally {
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
}

function sendSignal(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try { child.kill(signal); } catch {}
}

async function stop(code = 0) {
  if (stopPromise) return stopPromise;
  stopping = true;
  stopPromise = (async () => {
    const active = [...children.values()].filter(child => child.exitCode === null && child.signalCode === null);
    active.forEach(child => sendSignal(child, 'SIGTERM'));
    await Promise.race([
      Promise.all(active.map(child => child.closed)),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);
    active.filter(child => child.exitCode === null && child.signalCode === null)
      .forEach(child => sendSignal(child, 'SIGKILL'));
    await Promise.all(active.map(child => child.closed));
    process.exitCode = code;
  })();
  return stopPromise;
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    console.log('\nStopping workshop services…');
    void stop(signal === 'SIGINT' ? 130 : signal === 'SIGHUP' ? 129 : 143);
  });
}

function start(name, args, nodeOptions = []) {
  const child = spawn(process.execPath, [...nodeOptions, ...args], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
  });
  child.closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  children.set(name, child);
  child.once('error', error => {
    console.error(name + ' could not start: ' + error.message);
    void stop(1);
  });
  child.once('exit', (code, signal) => {
    if (stopping) return;
    console.error(name + ' exited (' + (signal || code) + '). Stopping the remaining workshop services.');
    void stop(code === 0 ? 0 : 1);
  });
  return child;
}

const healthy = async (url, predicate) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok && await predicate(response);
  } catch { return false; }
};

try {
  await assertPortFree(slidesPort);
  await assertPortFree(servicePort);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('Starting slides on port ' + slidesPort + '.');
  start('Slides', ['tooling/serve-slides.mjs'], []);
  console.log('Starting the synthetic API on port ' + servicePort + '.');
  start('Service', ['tooling/run-reference.mjs', '--port', String(servicePort)]);
  console.log('Waiting for both local health checks before opening the API tunnel…');

  let ready = false;
  for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
    const [slidesReady, serviceReady] = await Promise.all([
      healthy('http://127.0.0.1:' + slidesPort + '/', async response => (await response.text()).includes('Agent Odyssey with Engineering Excellence')),
      healthy('http://127.0.0.1:' + servicePort + '/health', async response => {
        const body = await response.json();
        return body.status === 'ok' && body.service === 'north-star-supply' && body.demo === true;
      }),
    ]);
    if (slidesReady && serviceReady) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (stopping) {
    await stopPromise;
  } else if (!ready) {
    console.error('Timed out waiting for the exact local slides and synthetic service. No tunnel was started.');
    await stop(1);
  } else {
    console.log('\nSlides:     http://127.0.0.1:' + slidesPort + '/');
    console.log('Service:    http://127.0.0.1:' + servicePort);
    console.log('Starting the organiser-approved ngrok service tunnel.');
    console.log('Only the checked API service is shared. Keep this terminal open; press Ctrl+C once to stop everything.');
    start('Share', ['tooling/expose-service.mjs', '--allow-public-exposure', '--prompt-authtoken'], ['--env-file=.env']);
    await children.get('Share').closed;
    if (!stopping) await stop(0);
    await stopPromise;
  }
}
