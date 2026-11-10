"use strict";
const connection = globalThis.OdysseySync?.connect('presenter');
const compactAppMode = new URLSearchParams(location.search).get('compact') === '1';
const openButton = document.getElementById('open-projection');
const previousButton = document.getElementById('presenter-previous');
const nextButton = document.getElementById('presenter-next');
const fullscreenButton = document.getElementById('presenter-fullscreen');
const slideCounter = document.getElementById('presenter-slide-count');
const timerPanel = document.getElementById('current-timer');
const timerValue = document.getElementById('current-timer-value');
const timerToggle = document.getElementById('timer-toggle');
const timerReset = document.getElementById('timer-reset');
let audiencePeer = null, lastState = null, lastSeen = 0, projectionWindow = null;
function connected() { return !!lastState && Date.now() - lastSeen <= 15000; }
function requestState() { connection?.send({ kind:'request-state', target:audiencePeer || undefined }); }
function sendCommand(command, value = {}) {
  if (!connection || !audiencePeer || !connected()) return;
  connection.send({ kind:'command', target:audiencePeer, command, ...value });
}
function adoptProjection() {
  if (projectionWindow && !projectionWindow.closed) return projectionWindow;
  try { if (window.opener && !window.opener.closed && window.opener.location.origin === location.origin && window.opener.location.pathname === '/') projectionWindow = window.opener; } catch {}
  return projectionWindow && !projectionWindow.closed ? projectionWindow : null;
}
function clearConnection() {
  audiencePeer = null; lastState = null; lastSeen = 0; projectionWindow = null; render();
}
function render() {
  const live = connected();
  openButton.textContent = live || (projectionWindow && !projectionWindow.closed) ? 'Close projection window' : 'Open projection window';
  previousButton.disabled = !live || !lastState.canPrevious;
  nextButton.disabled = !live || !lastState.canNext;
  fullscreenButton.disabled = !live;
  fullscreenButton.setAttribute('aria-pressed', String(live && !!lastState.fullscreen));
  const validPosition = live && Number.isInteger(lastState.position) && Number.isInteger(lastState.total) && lastState.position >= 1 && lastState.position <= lastState.total;
  const count = validPosition ? lastState.position + ' / ' + lastState.total : '— / —';
  if (slideCounter.textContent !== count) slideCounter.textContent = count;
  slideCounter.setAttribute('aria-label', validPosition ? 'Slide ' + lastState.position + ' of ' + lastState.total : 'No connected projection');
  const clock = live ? lastState.clocks.find(clock => clock.id === lastState.activeTimerId) : null;
  timerPanel.hidden = !clock;
  if (!clock) return;
  const seconds = clock.running ? Math.max(0, Math.ceil((clock.deadline - Date.now()) / 1000)) : clock.remaining;
  timerValue.textContent = String(Math.floor(seconds/60)).padStart(2,'0') + ':' + String(seconds%60).padStart(2,'0');
  timerPanel.setAttribute('aria-label', clock.label);
  timerToggle.textContent = clock.running && seconds > 0 ? '⏸' : '▶';
  timerToggle.title = clock.running && seconds > 0 ? 'Pause' : 'Start';
  timerToggle.setAttribute('aria-label', timerToggle.title + ' ' + clock.label);
}
connection?.listen(message => {
  if (message.role !== 'audience') return;
  if (message.kind === 'closed' && message.peer === audiencePeer) { clearConnection(); return; }
  if (message.kind === 'fullscreen-blocked' && message.peer === audiencePeer) {
    adoptProjection()?.focus(); fullscreenButton.title = 'Press F in the projection window to enter fullscreen'; return;
  }
  if (message.kind !== 'state' || !message.state || !Array.isArray(message.state.clocks)) return;
  if (audiencePeer && message.peer !== audiencePeer && Date.now() - lastSeen <= 15000) return;
  audiencePeer = message.peer; lastState = message.state; lastSeen = Date.now(); render();
});
openButton.addEventListener('click', async () => {
  if (compactAppMode) {
    const endpoint = connected() ? '/presenter/close-projection' : '/presenter/open-projection';
    try {
      const response = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      if (!response.ok) throw new Error('Window action unavailable');
      if (endpoint.endsWith('close-projection')) clearConnection(); else requestState();
    } catch { openButton.title = 'Brave window action unavailable; check the local server'; }
    return;
  }
  if (connected() || (projectionWindow && !projectionWindow.closed)) {
    const projection = adoptProjection();
    if (projection) { projection.close(); if (projection.closed) clearConnection(); else openButton.title = 'Close the projection window manually if the browser blocks closing'; }
    else sendCommand('close-projection');
    return;
  }
  const existing = adoptProjection();
  if (existing) { existing.focus(); requestState(); return; }
  audiencePeer = null; lastState = null;
  projectionWindow = window.open(new URL('/',location.href).href,'agent-odyssey-audience','popup,width=1280,height=800');
  openButton.title = projectionWindow ? '' : 'Allow popups to open the projection'; requestState();
});
previousButton.addEventListener('click', () => sendCommand('previous'));
nextButton.addEventListener('click', () => sendCommand('next'));
fullscreenButton.addEventListener('click', async () => {
  if (!connected()) return;
  try {
    const response = await fetch('/presenter/fullscreen', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
    if (!response.ok) throw new Error('Fullscreen unavailable');
    const state = await response.json(); lastState.fullscreen = state.fullscreen; fullscreenButton.title = 'Fullscreen on/off'; render();
  } catch { sendCommand('fullscreen'); }
});
timerToggle.addEventListener('click', () => { if (lastState?.activeTimerId) sendCommand('timer-toggle',{timerId:lastState.activeTimerId}); });
timerReset.addEventListener('click', () => { if (lastState?.activeTimerId) sendCommand('timer-reset',{timerId:lastState.activeTimerId}); });
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (['ArrowRight','PageDown'].includes(event.key)) { event.preventDefault(); sendCommand('next'); }
  if (['ArrowLeft','PageUp'].includes(event.key)) { event.preventDefault(); sendCommand('previous'); }
  if (event.key.toLowerCase() === 'f') sendCommand('fullscreen');
});
if (!connection) openButton.title = 'Use a current browser with BroadcastChannel support';
setInterval(requestState,2000);
setInterval(render,250);
render(); requestState();
