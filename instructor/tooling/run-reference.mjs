import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { startServer } from '../harness/solution/server.js';

export async function main(argv = process.argv.slice(2), { start = startServer, log = console.log, error = console.error } = {}) {
  const { values } = parseArgs({ args: argv, options: { port: { type: 'string', default: '8000' } } });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) { error('Invalid port.'); return 2; }
  const server = start({ port });
  if (server && typeof server.once === 'function') {
    server.once('listening', () => log('Reference app: http://127.0.0.1:' + port));
    server.once('error', (cause) => { error('Server startup failed: ' + cause.code); process.exitCode = 1; });
  } else log('Reference app: http://127.0.0.1:' + port);
  log('Synthetic-data demo, no service authentication. Public sharing requires separate approval.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
