// Local Brave DevTools actions, restricted to this origin's single projection target.
export async function chromeTargets() {
  const response = await fetch('http://127.0.0.1:9234/json/list', { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('Browser DevTools unavailable');
  return response.json();
}
export async function chromeCommand(endpoint, method, params) {
  const url = new URL(endpoint);
  if (url.protocol !== 'ws:' || url.hostname !== '127.0.0.1' || url.port !== '9234') throw new Error('Unexpected debugger endpoint');
  const socket = new WebSocket(url);
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Debugger timeout')), 3000);
      socket.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, { once:true });
      socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Debugger connection failed')); }, { once:true });
    });
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Browser action timeout')), 4000);
      socket.addEventListener('message', event => {
        const message = JSON.parse(event.data); if (message.id !== 1) return;
        clearTimeout(timeout);
        if (message.error || message.result?.exceptionDetails) reject(new Error('Browser action blocked'));
        else resolve(message.result);
      });
      socket.send(JSON.stringify({id:1,method,params}));
    });
  } finally { socket.close(); }
}
export async function browserEndpoint() {
  const response = await fetch('http://127.0.0.1:9234/json/version', { signal:AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('Browser unavailable');
  return (await response.json()).webSocketDebuggerUrl;
}
export function atAppPath(target, origin, pathname) {
  try { const url=new URL(target.url); return target.type==='page' && url.origin===origin && url.pathname===pathname; } catch { return false; }
}
async function projectionTarget(origin) {
  const targets=(await chromeTargets()).filter(target=>atAppPath(target,origin,'/'));
  if(targets.length!==1)throw new Error('Exactly one projection window is required');
  return targets[0];
}
export async function toggleProjectionFullscreen(origin) {
  const target=await projectionTarget(origin);
  const result=await chromeCommand(target.webSocketDebuggerUrl,'Runtime.evaluate',{expression:'(async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); return !!document.fullscreenElement; })()',awaitPromise:true,returnByValue:true,userGesture:true});
  return {fullscreen:!!result.result.value};
}
export async function closeProjectionWindow(origin) {
  const target=await projectionTarget(origin);
  await chromeCommand(await browserEndpoint(),'Target.closeTarget',{targetId:target.id});
  return {closed:true};
}
