// Start projection, service, then explicitly authorised public service tunnel.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = new Map();
let stopping = false;
let stopPromise;

function signalChild(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal); // detached npm process group, including its Node command
  } catch {
    try { child.kill(signal); } catch {}
  }
}

async function stop(code = 0) {
  if (stopPromise) return stopPromise;
  stopping = true;
  stopPromise = (async () => {
    const active = [...children.values()].filter(child => child.exitCode === null && child.signalCode === null);
    active.forEach(child => signalChild(child, 'SIGTERM'));
    await Promise.race([
      Promise.all(active.map(child => child.closed)),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
    active.filter(child => child.exitCode === null && child.signalCode === null)
      .forEach(child => signalChild(child, 'SIGKILL'));
    await Promise.all(active.map(child => child.closed));
    process.exitCode = code;
  })();
  return stopPromise;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log('\nStopping workshop processes…');
    void stop(signal === 'SIGINT' ? 130 : 143);
  });
}

function start(name, args) {
  const child = spawn(npm, args, {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
    detached: process.platform !== 'win32',
    shell: process.platform === 'win32',
  });
  child.closed = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  children.set(name, child);
  child.once('error', error => {
    console.error(name + ' could not start: ' + error.message);
    void stop(1);
  });
  child.once('exit', (code, signal) => {
    if (stopping) return;
    console.error(name + ' stopped unexpectedly (' + (signal || code) + '). Stopping the other workshop processes.');
    void stop(name === 'share' && code === 0 ? 0 : 1);
  });
  return child;
}

const healthy = async (url, predicate) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (!response.ok) return false;
    return await predicate(response);
  } catch { return false; }
};

console.log('Starting local slides/controller: npm run slides');
start('Slides', ['run', 'slides']);
console.log('Starting local service: npm run start');
start('Service', ['run', 'start']);
console.log('Waiting for slides on 8100 and the checked North Star Supply service on 8000…');

let ready = false;
for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
  const [slidesReady, serviceReady] = await Promise.all([
    healthy('http://127.0.0.1:8100/start', async response => (await response.text()).includes('Launch presentation')),
    healthy('http://127.0.0.1:8000/health', async response => {
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
  console.log('\nSlides:     http://127.0.0.1:8100/start');
  console.log('Service:    http://127.0.0.1:8000');
  console.log('Starting organiser-approved sharing: npm run share');
  console.log('Only the checked API service on port 8000 is shared. Keep this terminal open; Ctrl+C closes all three.');
  start('Share', ['run', 'share']);
  await children.get('Share').closed;
  if (!stopping) await stop(0);
  await stopPromise;
}
