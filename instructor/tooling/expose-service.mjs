import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { readSecret } from './secrets.mjs';

export async function verifyBackend(base) {
  const healthResponse = await fetch(base + '/health', { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!healthResponse.ok) throw new Error('Backend health check failed.');
  const health = await healthResponse.json();
  if (health.status !== 'ok' || health.service !== 'north-star-supply' || health.demo !== true) {
    throw new Error('Refusing to expose a service not identified as this synthetic-data demo.');
  }
  const policyResponse = await fetch(base + '/merchant-policy', { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!policyResponse.ok || (await policyResponse.json()).merchant_id !== 'north-star-supply') throw new Error('Demo API check failed.');
}

export function waitForStop() {
  return new Promise((resolve) => {
    const keepAlive = setInterval(() => {}, 60000);
    function stop() {
      clearInterval(keepAlive);
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
      resolve();
    }
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
}

export async function main(argv = process.argv.slice(2), { env = process.env, ask = readSecret, verify = verifyBackend, loadSDK = () => import('@ngrok/ngrok'), wait = waitForStop, log = console.log, error = console.error } = {}) {
  const { values } = parseArgs({ args: argv, options: { port: { type: 'string', default: '8000' }, domain: { type: 'string' }, 'check-only': { type: 'boolean' }, 'prompt-authtoken': { type: 'boolean' }, 'allow-public-exposure': { type: 'boolean' } } });
  const port = Number(values.port);
  const domain = values.domain || env.NGROK_DOMAIN;
  if (!Number.isInteger(port) || port < 1 || port > 65535 || (domain && (domain.includes('://') || domain.includes('/')))) { error('Invalid port/domain.'); return 2; }
  if (!values['check-only'] && !values['allow-public-exposure']) { error('No tunnel opened. Use --check-only or explicitly approve public exposure.'); return 2; }
  let ngrokToken = env.NGROK_AUTHTOKEN || '';
  if (!values['check-only'] && !ngrokToken && values['prompt-authtoken']) {
    try { ngrokToken = await ask('NGROK_AUTHTOKEN (organiser-only, from the ngrok dashboard): '); }
    catch { error('Cancelled; no tunnel opened.'); return 2; }
  }
  if (!values['check-only'] && !ngrokToken) { error('The organiser ngrok authtoken is missing.'); return 2; }
  let sdk, listener;
  try {
    const base = 'http://127.0.0.1:' + port;
    await verify(base);
    log('Local synthetic-data demo verified: ' + base);
    if (values['check-only']) { log('Check only: no public tunnel opened.'); return 0; }
    const module = await loadSDK();
    sdk = module.default || module;
    const options = { addr: '127.0.0.1:' + port, authtoken: ngrokToken };
    if (domain) options.domain = domain;
    listener = await sdk.forward(options);
    log('Public demo API URL (no service token required): ' + listener.url());
    log('Keep this terminal running; stop with Ctrl+C after the workshop.');
    await wait();
    return 0;
  } catch (cause) {
    let message = String(cause.message || cause);
    if (ngrokToken) message = message.replaceAll(ngrokToken, '[redacted]');
    error('Service/tunnel error: ' + message);
    return 1;
  } finally {
    if (listener && sdk) {
      try { await sdk.disconnect(listener.url()); }
      catch { error('Tunnel cleanup failed; verify closure in ngrok.'); }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
