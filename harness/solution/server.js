import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';

export function startServer({ port = 8000 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid port.');
  return createApp().listen(port, '127.0.0.1');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8000);
  const server = startServer({ port });
  server.on('listening', () => {
    console.log('North Star Supply: http://127.0.0.1:' + server.address().port);
    console.log('Unauthenticated synthetic-data demo. Share only through an authorised, temporary tunnel.');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}
