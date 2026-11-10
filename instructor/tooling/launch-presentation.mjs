import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromeTargets, browserEndpoint, chromeCommand, atAppPath } from './projection-fullscreen.mjs';

function browserBinary() {
  const candidates = process.platform==='darwin' ? ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'] : process.platform==='win32' ? [path.join(process.env.PROGRAMFILES||'', 'BraveSoftware/Brave-Browser/Application/brave.exe'),path.join(process.env.LOCALAPPDATA||'', 'BraveSoftware/Brave-Browser/Application/brave.exe')] : ['/usr/bin/brave-browser','/usr/bin/brave','/snap/bin/brave'];
  const executable=candidates.find(existsSync);
  if(!executable)throw new Error('Brave Browser is not installed at a supported location');
  return executable;
}
async function profileDirectory() {
  let existing=false;
  try { await chromeTargets(); existing=true; } catch {}
  if(existing && process.platform==='darwin') {
    const pid=execFileSync('lsof',['-t','-nP','-iTCP:9234','-sTCP:LISTEN'],{encoding:'utf8'}).trim().split('\n')[0];
    const command=execFileSync('ps',['-p',pid,'-o','command='],{encoding:'utf8'});
    const profile=command.match(/--user-data-dir=([^\s]+)/)?.[1];
    if(profile && (/^\/(?:private\/)?tmp\/agent-odyssey-/.test(profile) || profile===path.join(os.tmpdir(),'agent-odyssey-instructor-brave-app')))return profile;
    throw new Error('Port 9234 belongs to another browser profile; close it before launching');
  }
  if(existing)throw new Error('Another browser debugging session is already using port 9234');
  const profile=path.join(os.tmpdir(),'agent-odyssey-instructor-brave-app'); mkdirSync(profile,{recursive:true}); return profile;
}
async function openBrowserApp(origin, pathname, size, position) {
  const profile=await profileDirectory();
  const processHandle=spawn(browserBinary(),['--remote-debugging-port=9234','--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--app='+new URL(pathname,origin).href,'--window-size='+size,'--window-position='+position],{detached:true,stdio:'ignore'});
  await new Promise((resolve,reject)=>{processHandle.once('spawn',resolve);processHandle.once('error',reject)}); processHandle.unref();
}
async function waitForTarget(origin, pathname, previousIds=new Set()) {
  const end=Date.now()+10000;
  while(Date.now()<end) {
    try { const target=(await chromeTargets()).find(target=>atAppPath(target,origin,pathname)&&!previousIds.has(target.id)); if(target)return target; } catch {}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw new Error('Brave window did not become available');
}
export async function openProjectionWindow(origin) {
  try { const existing=(await chromeTargets()).filter(target=>atAppPath(target,origin,'/')); if(existing.length===1)return {opened:true,reused:true}; if(existing.length>1)throw new Error('Close duplicate projection windows'); } catch(error) { if(error.message==='Close duplicate projection windows')throw error; }
  await openBrowserApp(origin,'/','1280,800','500,40'); await waitForTarget(origin,'/'); return {opened:true};
}
export async function launchPresentation(origin) {
  await openProjectionWindow(origin);
  const old=(await chromeTargets()).filter(target=>atAppPath(target,origin,'/presenter'));
  await openBrowserApp(origin,'/presenter?compact=1','430,340','40,40');
  const target=await waitForTarget(origin,'/presenter',new Set(old.map(target=>target.id)));
  const endpoint=await browserEndpoint();
  const window=await chromeCommand(endpoint,'Browser.getWindowForTarget',{targetId:target.id});
  await chromeCommand(endpoint,'Browser.setWindowBounds',{windowId:window.windowId,bounds:{windowState:'normal',width:430,height:340,left:40,top:40}});
  for(const previous of old)await chromeCommand(endpoint,'Target.closeTarget',{targetId:previous.id});
  return {opened:true};
}
