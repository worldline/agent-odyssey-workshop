// Publish a presentation-only, self-contained artifact. Never copy the repository to Pages.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'presentation/source');
const ASSETS = path.join(ROOT, 'presentation/assets');
const OUT = path.join(ROOT, 'build/pages');
fs.mkdirSync(OUT, { recursive: true });
const cache = new Map();
function asset(url) {
  if (cache.has(url)) return cache.get(url);
  const name = path.basename(url.split(/[?#]/)[0]);
  const filename = path.join(ASSETS, name);
  if (!fs.existsSync(filename)) throw new Error('Missing presentation asset: ' + name);
  const ext = path.extname(name), mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : null;
  if (!mime) throw new Error('Unsupported embedded asset: ' + name);
  let data = fs.readFileSync(filename);
  if (ext === '.svg') data = Buffer.from(embed(data.toString('utf8')));
  const value = 'data:' + mime + ';base64,' + data.toString('base64');
  cache.set(url, value); return value;
}
function embed(text) {
  return text.replace(/(src|href)=(['"])(\/assets\/[^'"]+|\/qr-mock\.svg)\2/g, (_, key, quote, url) => key + '=' + quote + asset(url) + quote)
    .replace(/url\((['"]?)(\/assets\/[^)'"\s]+)\1\)/g, (_, quote, url) => 'url("' + asset(url) + '")');
}
const css = ['slides.css','full-deck.css','teaching.css'].map(name => embed(fs.readFileSync(path.join(SOURCE,name),'utf8'))).join('\n');
let reference = fs.readFileSync(path.join(SOURCE,'llm-reference-source.js'),'utf8');
const referenceCSS = embed(fs.readFileSync(path.join(SOURCE,'animations/llm-original.css'),'utf8'));
reference = reference.replace("const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/animations/llm-original.css';", 'const sheet=document.createElement("style");sheet.textContent='+JSON.stringify(referenceCSS)+';');
reference = reference.replace("sheet.addEventListener('load',()=>{this.ready=true;this.animation.stop();this.setActive(this.active)});", 'this.ready=true;this.animation.stop();this.setActive(this.active);');
let runtime = fs.readFileSync(path.join(SOURCE,'slides.js'),'utf8');
if (runtime.includes('OdysseySync') || runtime.includes('presenterConnection') || /window\.open\([^\n]*presenter/.test(runtime)) {
  throw new Error('The single-window presentation must not depend on a second controller window.');
}
const fetchStart = runtime.indexOf("fetch('/links.json')");
const fetchEnd = runtime.indexOf('restorePosition();',fetchStart);
if (fetchStart < 0 || fetchEnd < 0) throw new Error('Public runtime boundary not found');
runtime = runtime.slice(0,fetchStart) + runtime.slice(fetchEnd);
const hook = `
globalThis.AgentOdysseyExport = {
  ids: slides.flatMap(section => [...section.querySelectorAll('.beat')].map(beat => beat.dataset.id)),
  show(id) {
    for (let index=0; index<slides.length; index++) {
      const beats=[...slides[index].querySelectorAll('.beat')];
      const phase=beats.findIndex(beat=>beat.dataset.id===id);
      if(phase<0)continue;
      current=index;phases[index]=phase;render();return;
    }
    throw new Error('Unknown presentation slide');
  }
};
`;
runtime = runtime.replace('restorePosition();\nrender();',hook+'restorePosition();\nrender();');
const inline = text => text.replaceAll('</script','<\\/script');
let html = fs.readFileSync(path.join(SOURCE,'index.html'),'utf8');
html = html.replace(/<link rel="stylesheet"[^>]+>/g,'').replace(/<script src="[^"]+" defer><\/script>/g,'');
html = embed(html).replace('</head>','<style>'+css+'</style></head>');
html = html.replace('</body>','<script>'+inline(reference)+'</script><script>'+inline(runtime)+'</script></body>');
if (/src="\/assets\//.test(html) || html.includes("sheet.href='/animations/")) throw new Error('Presentation asset embedding incomplete');
fs.writeFileSync(path.join(OUT,'index.html'),html);
const ids = [...html.matchAll(/class="beat teaching" data-id="([^"]+)"/g)].map(m=>m[1]);
fs.mkdirSync(path.join(ROOT,'build'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'build/slide-ids.json'),JSON.stringify(ids));
console.log('Presentation-only HTML: '+ids.length+' slides, '+cache.size+' embedded assets. No service/frontend/notebook directories copied to Pages.');
