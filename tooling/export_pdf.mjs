// Render representative slide states, with no model/backend requests or presenter controls.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
const ROOT = path.resolve(import.meta.dirname,'..');
const HTML = fs.readFileSync(path.join(ROOT,'build/pages/index.html'));
const server = http.createServer((req,res)=>{ if(req.url==='/' || req.url==='/index.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end(HTML);}else{res.writeHead(404);res.end();} });
server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  await page.route('**/*',route=>{const url=route.request().url();return url.startsWith(origin+'/')||url.startsWith('data:')?route.continue():route.abort();});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin,{waitUntil:'load',timeout:60000});
  await page.emulateMedia({media:'screen'});
  await page.waitForFunction(()=>globalThis.AgentOdysseyExport?.ids?.length>0);
  const ids=await page.evaluate(()=>AgentOdysseyExport.ids);
  const output=await PDFDocument.create();
  for (const id of ids) {
    await page.evaluate(id=>AgentOdysseyExport.show(id),id);
    await page.waitForTimeout(1800);
    const data=await page.pdf({width:'1600px',height:'900px',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
    const source=await PDFDocument.load(data);
    if(source.getPageCount()!==1)throw new Error('Expected one PDF page for '+id);
    const [slide]=await output.copyPages(source,[0]);output.addPage(slide);
  }
  if(errors.length)throw new Error('Presentation rendering errors: '+[...new Set(errors)].join('; '));
  output.setTitle('Agent Odyssey — Worldline engineering workshop');output.setAuthor('Worldline');
  output.setSubject('Representative animation snapshots; use the web presentation for full animations.');
  fs.writeFileSync(path.join(ROOT,'build/pages/agent-odyssey.pdf'),await output.save());
  console.log('PDF exported: '+output.getPageCount()+' pages. No model/backend calls made.');
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
