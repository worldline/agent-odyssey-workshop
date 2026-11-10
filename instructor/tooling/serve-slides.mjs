import http from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const pages = new Map([['/', 'slides/index.html'], ['/slides.css', 'slides/slides.css'], ['/full-deck.css', 'slides/full-deck.css'], ['/teaching.css', 'slides/teaching.css'], ['/slides.js', 'slides/slides.js'], ['/llm-reference-source.js', 'slides/llm-reference-source.js'], ['/animations/llm-original.css', 'slides/animations/llm-original.css'], ['/links.json', 'slides/links.json'], ['/qr-mock.svg', 'slides/qr-mock.svg'], ['/deck-manifest.json', 'slides/deck-manifest.json']]);
const assets = new Map([['emblem.svg', 'demo/starter/assets/emblem.svg'], ['shuttle.svg', 'demo/starter/assets/shuttle.svg'], ['viewport.svg', 'demo/starter/assets/viewport.svg'], ['chip.svg', 'slides/assets/chip.svg'], ['shop-dashboard.png', 'slides/assets/shop-dashboard.png'], ['worldline-shop-cutaway.svg', 'slides/assets/worldline-shop-cutaway.svg'], ['ai-checkout-co-builder.svg', 'slides/assets/ai-checkout-co-builder.svg'], ['mission-welcome.png', 'slides/assets/mission-welcome.png'], ['mission-ai-checkout.png', 'slides/assets/mission-ai-checkout.png'], ['mission-payment-missing.png', 'slides/assets/mission-payment-missing.png'], ['llm-mechanic.png', 'slides/assets/llm-mechanic.png'], ['robots-at-work.png', 'slides/assets/robots-at-work.png'], ['cockpit-chat.png', 'slides/assets/cockpit-chat.png'], ['cockpit-ide.png', 'slides/assets/cockpit-ide.png'], ['cockpit-harness.png', 'slides/assets/cockpit-harness.png'], ['agent-cutaway.png', 'slides/assets/agent-cutaway.png'], ['pilot-harness-transition.png', 'slides/assets/pilot-harness-transition.png'], ['robot-invite.png', 'slides/assets/robot-invite.png'], ['thank-you-argonauts.png', 'slides/assets/thank-you-argonauts.png'], ['crew-connect.png', 'slides/assets/crew-connect.png'], ['crew-pricing.png', 'slides/assets/crew-pricing.png'], ['agent-pictogram.png', 'slides/assets/agent-pictogram.png'], ['qr-prerequisites.png', 'slides/assets/qr-prerequisites.png'], ['qr-demo-kit.png', 'slides/assets/qr-demo-kit.png'], ['qr-service-solution.png', 'slides/assets/qr-service-solution.png'], ['qr-tp1-template.png', 'slides/assets/qr-tp1-template.png'], ['qr-tp1-correction.png', 'slides/assets/qr-tp1-correction.png'], ['qr-tp2-template.png', 'slides/assets/qr-tp2-template.png'], ['qr-tp2-correction.png', 'slides/assets/qr-tp2-correction.png'], ['qr-materials.png', 'slides/assets/qr-materials.png']]);
const animationPages = new Map(['ml', 'nn', 'dl', 'nlp', 'llm'].map(name => ['/animations/' + name + '.html', 'slides/animations/' + name + '.html']));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/start' && req.method === 'GET') { res.writeHead(302, { Location: '/' }); res.end(); return; }
  let relative = pages.get(url.pathname) || animationPages.get(url.pathname);
  if (url.pathname.startsWith('/assets/') && assets.has(url.pathname.slice(8))) relative = assets.get(url.pathname.slice(8));
  if (!relative || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  const file = path.join(ROOT, relative);
  if (!existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  let csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'";
  if (animationPages.has(url.pathname)) {
    const source = readFileSync(file, 'utf8');
    const hashes = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => "'sha256-" + createHash('sha256').update(match[1]).digest('base64') + "'");
    csp = "default-src 'none'; script-src " + hashes.join(' ') + "; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox allow-scripts";
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': csp });
  if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);
});
const port = Number(process.env.SLIDES_PORT || 8100);
server.listen(port, '127.0.0.1', () => console.log('Open presentation: http://127.0.0.1:' + server.address().port + '/'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
