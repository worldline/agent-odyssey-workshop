"use strict";
const slides = [...document.querySelectorAll('.slide')];
const phases = slides.map(() => 0);
const states = slides.map((slide) => [...slide.querySelectorAll('.beat')].map(() => ({ revealed: false, selected: null, feedback: null, lessonStep: 0 })));
let current = 0;
const enteredSections = new Set([0]);
const positionKey = "agent-odyssey-slide-position:" + location.pathname;

function savePosition() {
  try {
    localStorage.setItem(positionKey, JSON.stringify({
      slideId: activeBeat().dataset.id,
      lessonStep: states[current][phases[current]].lessonStep,
      lessonLabel: activeBeat().querySelector('[data-lesson-step="' + states[current][phases[current]].lessonStep + '"]')?.dataset.stepLabel,
      visited: [...enteredSections].map(index => slides[index].querySelector('.beat').dataset.id),
      sectionPositions: slides.map((slide, index) => ({
        sectionId: slide.querySelector('.beat').dataset.id,
        slideId: slide.querySelectorAll('.beat')[phases[index]].dataset.id,
      })),
    }));
  } catch {} // Navigation still works when browser storage is unavailable.
}
function restorePosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(positionKey));
    if (!saved || typeof saved.slideId !== "string") return;
    const aliases = new Map([
      ["tokenization", { id: "llm-tokenization-embeddings", step: 0 }],
      ["embeddings", { id: "llm-tokenization-embeddings", step: 0 }],
      ["finite-context", { id: "llm-context", step: 0 }],
      ["right-technique", { id: "programme", step: 0 }],
      ["instructions-review", { id: "programme", step: 0 }],
      ["engineering-opportunities", { id: "programme", step: 0 }],
      ...["chain-example","tool-request","worked-loop","runner-code"].map(id => [id,{id:"tool-declaration",step:0}]),
      ["mcp-example",{id:"mcp-mechanism",step:0}],
      ["tp1-download",{id:"tp1-checks",step:0}],
      ...["tp1-implementation","scoped-tool"].map(id => [id,{id:"tp1-work",step:0}]),
      ...["tp1-correction","tp1-debrief"].map(id => [id,{id:"tp1-checks",step:0}]),
      ["worked-recommendation",{id:"orchestrator",step:0}],
      ["tp2-download",{id:"tp2-checks",step:0}],
      ...["delegation-code","amount-policy","tp2-implementation"].map(id => [id,{id:"tp2-work",step:0}]),
      ...["tp2-correction","tp2-trace"].map(id => [id,{id:"tp2-checks",step:0}]),
      ...["guardrails","visual-download","materials"].map(id => [id,{id:"recap",step:0}]),
      ...["demo-plan", "demo-build", "demo-verify"].map(id => [id, { id: "demo-launch", step: 0 }]),
      ...["build-versus-run", "runtime-topology", "share-backend"].map(id => [id, { id: "break", step: 0 }]),
    ]);
    const migrated = aliases.get(saved.slideId);
    let targetId = migrated?.id || saved.slideId;
    if (saved.slideId === "llm" && typeof saved.lessonLabel === "string") {
      targetId = new Map([["Training at scale", "llm-training-scale"], ["Open the hood", "llm"], ["Tokenization", "llm-tokenization-embeddings"], ["Embeddings", "llm-tokenization-embeddings"], ["Self-attention", "llm-self-attention"], ["Next-token prediction", "llm-output-prediction"]]).get(saved.lessonLabel) || targetId;
    }
    const lessonStep = migrated ? migrated.step : saved.lessonStep;
    const section = slides.findIndex(slide => [...slide.querySelectorAll('.beat')].some(beat => beat.dataset.id === targetId));
    if (section < 0) return; // The saved slide may have been removed from the deck.
    for (const position of Array.isArray(saved.sectionPositions) ? saved.sectionPositions : []) {
      if (!position || typeof position.sectionId !== "string" || typeof position.slideId !== "string") continue;
      const rememberedId = aliases.get(position.slideId)?.id || position.slideId;
      let index = slides.findIndex(slide => slide.querySelector(".beat").dataset.id === position.sectionId);
      let phase = index < 0 ? -1 : [...slides[index].querySelectorAll(".beat")].findIndex(beat => beat.dataset.id === rememberedId);
      if (phase < 0) {
        index = slides.findIndex(slide => [...slide.querySelectorAll(".beat")].some(beat => beat.dataset.id === rememberedId));
        if (index >= 0) phase = [...slides[index].querySelectorAll(".beat")].findIndex(beat => beat.dataset.id === rememberedId);
      }
      if (phase >= 0) {
        phases[index] = phase;
        if (["pilot-transition", "mission-start", "demo-resources", "engineering-opportunities"].includes(position.sectionId) && rememberedId === "break") enteredSections.add(index);
        // Recover progress when the old combined primer is split into sections.
        if (position.sectionId === "llm-route") slides.forEach((slide, sectionIndex) => {
          if (sectionIndex <= index && ["llm", "chat-harness-opening"].includes(slide.querySelector(".beat").dataset.id)) enteredSections.add(sectionIndex);
        });
      }
    }
    current = section;
    phases[current] = [...slides[current].querySelectorAll('.beat')].findIndex(beat => beat.dataset.id === targetId);
    const steps = [...activeBeat().querySelectorAll('[data-lesson-step]')];
    const labelledStep = steps.findIndex(step => step.dataset.stepLabel === saved.lessonLabel);
    const restoredStep = !migrated && labelledStep >= 0 ? labelledStep : lessonStep;
    if (Number.isInteger(restoredStep) && restoredStep >= 0 && restoredStep < steps.length) states[current][phases[current]].lessonStep = restoredStep;
    for (const id of Array.isArray(saved.visited) ? saved.visited : []) {
      const sectionId = id === 'chat-round-trips' ? 'chat-harness-opening' : ['engineering-opportunities', 'demo-resources', 'mission-start'].includes(id) ? 'pilot-transition' : id;
      const index = slides.findIndex(slide => slide.querySelector('.beat').dataset.id === sectionId);
      if (index >= 0) enteredSections.add(index);
    }
    enteredSections.add(current);
  } catch {} // Invalid or inaccessible storage falls back to the opening slide.
}
let flowRunId = 0;
document.body.classList.add("controls-hidden");
const timers = new Map([...document.querySelectorAll(".lab-timer")].map((element) => [element, { remaining: Number(element.dataset.minutes) * 60, running: false, deadline: 0 }]));

// Manual teaching budgets: state is shared by timer id, not by chapter index.
function createTeachingClock(minutes, label) {
  return { budget: minutes * 60, remaining: minutes * 60, label, running: false, deadline: 0 };
}
function tickTeachingClock(clock, now) {
  if (clock.running) clock.remaining = Math.max(0, Math.ceil((clock.deadline - now) / 1000));
  if (!clock.remaining) clock.running = false;
}
function toggleTeachingClock(clock, now = Date.now()) {
  tickTeachingClock(clock, now);
  if (!clock.remaining) return;
  clock.running = !clock.running;
  clock.deadline = now + clock.remaining * 1000;
}
function resetTeachingClock(clock) {
  clock.remaining = clock.budget; clock.running = false; clock.deadline = 0;
}
function formatTeachingTime(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}
const teachingClocks = new Map();
for (const section of slides) {
  const key = section.dataset.teachingClock, minutes = Number(section.dataset.clockMinutes);
  if (key && Number.isInteger(minutes) && minutes > 0 && !teachingClocks.has(key)) teachingClocks.set(key, createTeachingClock(minutes, section.dataset.clockLabel));
}
function currentTeachingClock() {
  return teachingClocks.get(slides[current].dataset.teachingClock) || null;
}
function updateTeachingClockDisplay() {
  const now = Date.now();
  for (const clock of teachingClocks.values()) tickTeachingClock(clock, now);
  // Teaching budgets live in the auto-hiding footer, never over the slide content.
  document.body.classList.remove('has-teaching-clock', 'teaching-clock-large');
  const widget = document.getElementById('teaching-clock'); if (widget) widget.hidden = true;
  return currentTeachingClock();
}

let controlsHideTimeout;
let keyboardFocusInControls = false;
const controlsFooter = document.querySelector('.deck-controls');
function scheduleControlsAutoHide() {
  clearTimeout(controlsHideTimeout);
  controlsHideTimeout = setTimeout(() => {
    if (keyboardFocusInControls && controlsFooter?.contains(document.activeElement)) return;
    document.body.classList.add('controls-hidden');
  }, 5000);
}
function revealControls(fromKeyboard = false) {
  if (fromKeyboard) keyboardFocusInControls = true;
  document.body.classList.remove('controls-hidden');
  scheduleControlsAutoHide();
}
function revealControlsFromPointer() {
  keyboardFocusInControls = false;
  revealControls(false);
}
document.addEventListener('pointermove', revealControlsFromPointer, { passive: true });
document.addEventListener('pointerdown', revealControlsFromPointer, { passive: true });
document.addEventListener('touchstart', revealControlsFromPointer, { passive: true });
document.addEventListener('keydown', event => revealControls(event.key === 'Tab'), true);
document.addEventListener('focusout', () => setTimeout(() => {
  if (!controlsFooter?.contains(document.activeElement)) {
    keyboardFocusInControls = false;
    scheduleControlsAutoHide();
  }
}, 0));

function stopFlows() {
  flowRunId += 1;
  for (const node of document.querySelectorAll("[data-flow-node]")) node.classList.remove("flow-active");
  for (const button of document.querySelectorAll(".flow-run")) button.disabled = false;
}
async function playFlow(button) {
  stopFlows();
  const id = flowRunId;
  const container = button.closest(".flow-player");
  const result = container.querySelector(".flow-result");
  result.hidden = true; button.disabled = true;
  for (const node of container.querySelectorAll("[data-flow-node]")) {
    if (id !== flowRunId) return;
    node.classList.add("flow-active");
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  if (id === flowRunId) { result.hidden = false; button.disabled = false; }
}
function sectionTimer() {
  const timer = slides[current].querySelector(".lab-timer");
  if (timer?.closest(".beat").dataset.id === "break" && activeBeat().dataset.id !== "break") return null;
  return timer;
}
function updateTimers() {
  for (const [element, state] of timers) {
    if (state.running) state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    if (!state.remaining) state.running = false;
    element.querySelector(".timer-value").textContent = Math.floor(state.remaining / 60) + ":" + String(state.remaining % 60).padStart(2, "0");
    element.querySelector(".timer-toggle").textContent = state.running ? "Pause" : "Start";
    for (const display of element.closest(".beat").querySelectorAll("[data-timer-display]")) display.textContent = element.querySelector(".timer-value").textContent.padStart(5, "0");
  }
  const teachingClock = updateTeachingClockDisplay();
  const element = sectionTimer();
  const bar = document.getElementById("persistent-timer");
  if (!bar) return;
  bar.hidden = !teachingClock && !element;
  if (teachingClock) {
    document.getElementById("timer-label").textContent = teachingClock.label;
    document.getElementById("timer-remaining").textContent = formatTeachingTime(teachingClock.remaining);
    document.getElementById("section-timer-toggle").textContent = teachingClock.running ? "Pause" : "Start";
    return;
  }
  if (!element) return;
  const state = timers.get(element);
  const id = element.closest(".beat").dataset.id;
  document.getElementById("timer-label").textContent = id === "break" ? "Orbital Pause" : id.startsWith("tp1") ? "Level 1 work" : "Level 2 work";
  document.getElementById("timer-remaining").textContent = element.querySelector(".timer-value").textContent;
  document.getElementById("section-timer-toggle").textContent = state.running ? "Pause" : "Start";
}

function fitReferenceAnimation(frame) {
  frame.style.removeProperty('transform'); // Use the real card viewport, never scale its text.
}
const referenceFrames = [...document.querySelectorAll('[data-animation-src]')];
for (const frame of referenceFrames) frame.addEventListener('load', () => {
  if (!frame.hasAttribute('src')) return;
  fitReferenceAnimation(frame);
  frame.style.visibility = 'visible';
});
if (typeof ResizeObserver !== 'undefined') {
  const animationResize = new ResizeObserver(entries => {
    for (const entry of entries) fitReferenceAnimation(entry.target.querySelector('iframe'));
  });
  for (const frame of referenceFrames) animationResize.observe(frame.parentElement);
}
window.addEventListener('resize', () => referenceFrames.forEach(fitReferenceAnimation));
// ML is rendered directly in the slide: no iframe canvas or background.
const nativeMLControllers = new WeakMap();
class NativeMLAnimation {
  constructor(root) {
    this.root = root;
    this.points = root.querySelector('.ml-data-points');
    this.boundary = root.querySelector('.ml-boundary');
    this.timers = new Set();
    this.running = false;
    for (const tick of root.querySelectorAll('.ml-tick-x')) tick.style.left = Number(tick.dataset.value) * 100 + '%';
    for (const tick of root.querySelectorAll('.ml-tick-y')) tick.style.bottom = Number(tick.dataset.value) * 100 + '%';
  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.cycle();
  }
  stop() {
    this.running = false;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
  }
  cycle() {
    this.points.replaceChildren();
    this.boundary.classList.remove('ml-visible');
    const training = [], unknown = [];
    const add = (kind, x) => {
      const point = document.createElement('span');
      point.className = 'ml-point ml-' + kind;
      point.style.left = x * 100 + '%';
      point.style.top = (12 + Math.random() * 76) + '%';
      this.points.append(point);
      return { point, x };
    };
    for (let i = 0; i < 12; i++) {
      training.push(add('class-a', .12 + Math.random() * .28));
      training.push(add('class-b', .6 + Math.random() * .28));
    }
    for (let i = 0; i < 6; i++) unknown.push(add('unknown', .16 + Math.random() * .68));
    training.forEach(({ point }, index) => this.later(() => point.classList.add('ml-visible'), 100 + index * 60));
    this.later(() => this.boundary.classList.add('ml-visible'), 2200);
    unknown.forEach(({ point }, index) => this.later(() => point.classList.add('ml-visible'), 3300 + index * 120));
    unknown.forEach(({ point, x }, index) => this.later(() => { point.classList.remove('ml-unknown'); point.classList.add(x < .5 ? 'ml-class-a' : 'ml-class-b'); }, 5200 + index * 150));
    this.later(() => this.cycle(), 8500);
  }
}
function syncNativeML(beat, active) {
  const root = beat.querySelector('[data-native-ml]');
  if (!root) return;
  let controller = nativeMLControllers.get(root);
  if (!controller) { controller = new NativeMLAnimation(root); nativeMLControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

const nativeNNControllers = new WeakMap();
class NativeNNAnimation {
  constructor(root) {
    this.root = root;
    this.svg = root.querySelector('.nn-wires');
    this.nodes = new Map([...root.querySelectorAll('[data-nn-node]')].map(node => [node.dataset.nnNode, node]));
    this.links = new Map();
    this.activeLinks = new Set();
    this.timers = new Set();
    this.running = false;
    if (typeof ResizeObserver !== 'undefined') {
      this.resize = new ResizeObserver(() => { if (this.running) this.drawWires(); });
      this.resize.observe(root);
    }
  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  drawWires() {
    const bounds = this.root.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    this.svg.replaceChildren(); this.links.clear();
    const connect = (from, to) => {
      const a = this.nodes.get(from).getBoundingClientRect(), b = this.nodes.get(to).getBoundingClientRect();
      const ax = a.left + a.width / 2 - bounds.left, ay = a.top + a.height / 2 - bounds.top;
      const bx = b.left + b.width / 2 - bounds.left, by = b.top + b.height / 2 - bounds.top;
      const length = Math.hypot(bx - ax, by - ay);
      if (!length) return;
      const dx = (bx - ax) / length, dy = (by - ay) / length;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      for (const [key, value] of Object.entries({ x1: ax + dx * (a.width / 2 + 3), y1: ay + dy * (a.width / 2 + 3), x2: bx - dx * (b.width / 2 + 3), y2: by - dy * (b.width / 2 + 3) })) line.setAttribute(key, value);
      const key = from + ':' + to;
      line.classList.add('nn-link');
      if (this.activeLinks.has(key)) line.classList.add('nn-active-link');
      this.links.set(key, line); this.svg.append(line);
    };
    for (let i = 0; i < 3; i++) for (let h = 0; h < 3; h++) connect('i' + i, 'h' + h);
    for (let h = 0; h < 3; h++) for (let o = 0; o < 2; o++) connect('h' + h, 'o' + o);
  }
  clearPath() {
    this.activeLinks.clear();
    for (const node of this.nodes.values()) node.classList.remove('nn-active');
    for (const line of this.links.values()) line.classList.remove('nn-active-link');
  }
  activateLink(from, to) {
    const key = from + ':' + to;
    this.activeLinks.add(key); this.links.get(key)?.classList.add('nn-active-link');
  }
  cycle() {
    this.clearPath();
    for (const [index, [input, hidden, output]] of [['i0','h1','o0'], ['i2','h0','o1'], ['i1','h2','o0']].entries()) {
      const time = 300 + index * 2800;
      this.later(() => { this.clearPath(); this.nodes.get(input).classList.add('nn-active'); }, time);
      this.later(() => this.activateLink(input, hidden), time + 450);
      this.later(() => this.nodes.get(hidden).classList.add('nn-active'), time + 900);
      this.later(() => this.activateLink(hidden, output), time + 1350);
      this.later(() => this.nodes.get(output).classList.add('nn-active'), time + 1800);
    }
    this.later(() => this.cycle(), 8900);
  }
  start() { if (this.running) return; this.running = true; this.drawWires(); this.cycle(); }
  stop() { this.running = false; for (const id of this.timers) clearTimeout(id); this.timers.clear(); this.clearPath(); }
}
function syncNativeNN(beat, active) {
  const root = beat.querySelector('[data-native-nn]');
  if (!root) return;
  let controller = nativeNNControllers.get(root);
  if (!controller) { controller = new NativeNNAnimation(root); nativeNNControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

const nativeDLControllers = new WeakMap();
class NativeDLAnimation {
  constructor(root) {
    this.layers = [...root.querySelectorAll('[data-dl-level]')].sort((a, b) => Number(a.dataset.dlLevel) - Number(b.dataset.dlLevel));
    this.timers = new Set();
    this.running = false;
  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  reset() { for (const layer of this.layers) layer.classList.remove('dl-current', 'dl-seen'); }
  cycle() {
    this.reset();
    this.layers.forEach((layer, index) => this.later(() => {
      if (index > 0) { this.layers[index - 1].classList.remove('dl-current'); this.layers[index - 1].classList.add('dl-seen'); }
      layer.classList.add('dl-current');
    }, 250 + index * 1050));
    this.later(() => this.cycle(), 7200);
  }
  start() { if (this.running) return; this.running = true; this.cycle(); }
  stop() { this.running = false; for (const id of this.timers) clearTimeout(id); this.timers.clear(); this.reset(); }
}
function syncNativeDL(beat, active) {
  const root = beat.querySelector('[data-native-dl]');
  if (!root) return;
  let controller = nativeDLControllers.get(root);
  if (!controller) { controller = new NativeDLAnimation(root); nativeDLControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

const nativeLanguageControllers = new WeakMap();
class NativeLanguageAnimation {
  constructor(root) { this.root = root; this.steps = [...root.querySelectorAll('[data-auto-step]')]; this.timers = new Set(); this.running = false; }
  later(action, delay) { const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay); this.timers.add(id); }
  show(index) { this.steps.forEach((step, i) => { step.hidden = i !== index; }); }
  cycle() { this.show(0); const duration = this.root.dataset.nativeLanguage === 'nlp' ? 2800 : 3200; this.steps.forEach((_, i) => { if (i) this.later(() => this.show(i), i * duration); }); this.later(() => this.cycle(), this.steps.length * duration + 1000); }
  start() { if (this.running) return; this.running = true; this.cycle(); }
  stop() { this.running = false; for (const id of this.timers) clearTimeout(id); this.timers.clear(); this.show(0); }
}
function syncNativeLanguage(beat, active) {
  for (const root of beat.querySelectorAll('[data-native-language]')) {
    let controller = nativeLanguageControllers.get(root);
    if (!controller) { controller = new NativeLanguageAnimation(root); nativeLanguageControllers.set(root, controller); }
    if (active && !root.closest('[hidden]')) controller.start(); else controller.stop();
  }
}


const llmReferenceViews = new WeakMap();
function syncLLMReference(beat, active) {
  const host = beat.querySelector('[data-llm-reference]');
  if (!host || typeof LLMReferenceView === 'undefined') return;
  let view = llmReferenceViews.get(host);
  if (!view && !active) return;
  if (!view) { view = new LLMReferenceView(host); llmReferenceViews.set(host, view); }
  view.setActive(active);
}
// One word-level conversation connects context, attention and output prediction.
const llmConversationExample = {
  vocabulary: ['mat', 'door', 'panel'],
  turns: [
    { speaker: 'User', text: 'The cat sits on the …', count: 5, focus: 4 },
    { speaker: 'Model reply', text: 'mat', count: 6, focus: -1 },
    { speaker: 'User', text: 'The robot opens the …', count: 10, focus: 9 },
    { speaker: 'Model reply', text: 'door', count: 11, focus: -1 },
  ],
  cases: [
    { name: 'A', tokens: ['The','cat','sits','on','the'], probabilities: [.70,.20,.10], selected: 0 },
    { name: 'B', tokens: ['The','cat','sits','on','the','mat','The','robot','opens','the'], probabilities: [.10,.70,.20], selected: 1 },
  ],
};
const nativeAttentionControllers = new WeakMap();
class NativeAttentionAnimation {
  constructor(root) {
    this.root=root; this.tokens=[...root.querySelectorAll('[data-attention-token]')];
    this.svg=root.querySelector('svg'); this.links=root.querySelector('.attention-native-links');
    this.output=root.querySelector('.attention-native-output'); this.label=root.querySelector('.attention-native-label');
    this.caption=root.querySelector('.attention-native-caption'); this.timers=new Set(); this.running=false; this.caseIndex=0;
    if(typeof ResizeObserver!=='undefined'){this.resize=new ResizeObserver(()=>{if(this.running)this.draw()});this.resize.observe(root)}
  }
  later(action,delay){const id=setTimeout(()=>{this.timers.delete(id);if(this.running)action()},delay);this.timers.add(id)}
  draw(){
    const example=llmConversationExample.cases[this.caseIndex];
    this.root.classList.toggle('context-expanded', example.tokens.length > 5);
    this.tokens.forEach((token,i)=>{token.hidden=i>=example.tokens.length;token.textContent=example.tokens[i]||'';token.classList.remove('attention-future');token.classList.toggle('attention-query',i===example.tokens.length-1)});
    const bounds=this.svg.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    const x=bounds.width/2;this.links.replaceChildren();
    for(let i=0;i<example.tokens.length;i++){
      const r=this.tokens[i].getBoundingClientRect(),fromX=r.left+r.width/2-bounds.left;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M '+fromX+' 0 Q '+fromX+' 22 '+x+' 38');path.classList.add('attention-link');this.links.append(path);
    }
    for(const[key,value]of Object.entries({x:x-120,y:38,width:240,height:36,rx:8}))this.output.setAttribute(key,value);
    this.label.setAttribute('x',x);this.label.setAttribute('y',64);this.label.textContent='h_last ('+example.name+')';
    this.caption.textContent=example.name==='A'?'First exchange: “the” uses the available sequence to produce h_last (A).':'More conversation: same “the” ID, different input sequence → h_last (B).';
  }
  cycle(){this.caseIndex=0;this.draw();this.later(()=>{this.caseIndex=1;this.draw()},5000);this.later(()=>this.cycle(),11000)}
  start(){if(this.running)return;this.running=true;this.cycle()}
  stop(){this.running=false;for(const id of this.timers)clearTimeout(id);this.timers.clear()}
}
function syncNativeAttention(beat,active){const root=beat.querySelector('[data-native-attention]');if(!root)return;let controller=nativeAttentionControllers.get(root);if(!controller){controller=new NativeAttentionAnimation(root);nativeAttentionControllers.set(root,controller)}if(active)controller.start();else controller.stop()}
const nativePredictionControllers=new WeakMap();
class NativePredictionAnimation{
  constructor(root){this.lines=[...root.querySelectorAll('[data-prediction-step]')];this.rows=[...root.querySelectorAll('.prediction-row')];this.label=root.querySelector('[data-prediction-label]');this.context=root.closest('.beat').querySelector('[data-prediction-context]');this.prefix=root.closest('.beat').querySelector('[data-prediction-prefix]');this.running=false;this.timers=new Set();this.caseIndex=-1}
  later(action,delay){const id=setTimeout(()=>{this.timers.delete(id);if(this.running)action()},delay);this.timers.add(id)}
  stage(index){
    const example=llmConversationExample.cases[this.caseIndex];
    this.lines.forEach((line,i)=>line.classList.toggle('prediction-active',i===index));
    this.label.textContent=(index===0?'Toy scores':index>=2?'Selected token':'Toy probabilities')+' · '+example.name;
    this.rows.forEach((row,i)=>{const p=example.probabilities[i];row.querySelector('dt').textContent=llmConversationExample.vocabulary[i];row.querySelector('dd').textContent=index===0?Math.log(p).toFixed(2).replace('-','−'):p.toFixed(2);row.style.setProperty('--probability',p*100+'%');row.classList.toggle('prediction-probability',index>=1);row.classList.toggle('prediction-selected',index>=2&&i===example.selected)});
    this.prefix.textContent=example.tokens.join(' ');this.context.textContent=index>=3?llmConversationExample.vocabulary[example.selected]:'…';this.context.classList.toggle('prediction-appended',index>=3);
  }
  cycle(){this.caseIndex=(this.caseIndex+1)%2;this.stage(0);this.later(()=>this.stage(1),1500);this.later(()=>this.stage(2),3000);this.later(()=>this.stage(3),4500);this.later(()=>this.cycle(),7500)}
  start(){if(this.running)return;this.running=true;this.caseIndex=-1;this.cycle()}
  stop(){this.running=false;for(const id of this.timers)clearTimeout(id);this.timers.clear()}
}
function syncNativePrediction(beat,active){const root=beat.querySelector('[data-native-prediction]');if(!root)return;let controller=nativePredictionControllers.get(root);if(!controller){controller=new NativePredictionAnimation(root);nativePredictionControllers.set(root,controller)}if(active)controller.start();else controller.stop()}
const nativeContextControllers=new WeakMap();
class NativeContextAnimation{
  constructor(root){this.speaker=root.querySelector('[data-context-speaker]');this.message=root.querySelector('[data-context-message]');this.tokens=[...root.querySelectorAll('[data-context-token]')];this.vectors=[...root.querySelectorAll('[data-context-vector]')];this.tokenCount=root.querySelector('[data-context-token-count]');this.vectorCount=root.querySelector('[data-context-vector-count]');this.embedding=root.querySelector('[data-context-embedding]');this.timers=new Set();this.running=false}
  later(action,delay){const id=setTimeout(()=>{this.timers.delete(id);if(this.running)action()},delay);this.timers.add(id)}
  stage(index){const turn=llmConversationExample.turns[index];this.speaker.textContent='Word-level example · '+turn.speaker;this.message.textContent=turn.text;this.tokenCount.textContent=turn.count;this.vectorCount.textContent=turn.count;for(const nodes of[this.tokens,this.vectors])nodes.forEach((node,i)=>{node.classList.toggle('context-added',i<turn.count);node.classList.toggle('context-current',i===turn.focus)});this.embedding.textContent=turn.focus>=0?'Same “the” ID → same initial embedding.':'New replies extend the sequence; weights stay fixed.'}
  cycle(){this.stage(0);for(let i=1;i<4;i++)this.later(()=>this.stage(i),i*2200);this.later(()=>this.cycle(),10000)}
  start(){if(this.running)return;this.running=true;this.cycle()}
  stop(){this.running=false;for(const id of this.timers)clearTimeout(id);this.timers.clear()}
}
function syncNativeContext(beat,active){const root=beat.querySelector('[data-native-context]');if(!root)return;let controller=nativeContextControllers.get(root);if(!controller){controller=new NativeContextAnimation(root);nativeContextControllers.set(root,controller)}if(active)controller.start();else controller.stop()}

const nativeChatControllers = new WeakMap();
class NativeChatAnimation {
  constructor(root) {
    this.userBubble = root.querySelector('[data-chat-user-bubble]');
    this.assistantBubble = root.querySelector('[data-chat-assistant-bubble]');
    this.userText = root.querySelector('[data-chat-user-text]');
    this.firstLine = root.querySelector('[data-chat-reply-first]');
    this.secondLine = root.querySelector('[data-chat-reply-second]');
    this.replyText = root.querySelector('[data-chat-reply-text]');
    this.prompt = root.querySelector('[data-chat-prompt-text]');
    this.send = root.querySelector('[data-chat-send]');
    this.running = false;
    this.timers = new Set();
    this.turns = [
      { prompt: 'Fix my bug.', reply: ['It claims to be', 'a feature.'] },
      { prompt: 'Write a test.', reply: ['The bug has left', 'the chat.'] },
    ];
  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  reset() {
    this.prompt.textContent = 'Describe your task…';
    this.prompt.classList.remove('chat-prompt-active');
    this.send.classList.remove('chat-send-active');
    this.replyText.classList.remove('chat-reply-typing');
    this.userBubble.classList.add('chat-message-hidden');
    this.assistantBubble.classList.add('chat-message-hidden');
  }
  compose(turn, delay) {
    this.later(() => {
      this.prompt.textContent = '';
      this.prompt.classList.add('chat-prompt-active');
      [...turn.prompt].forEach((_, index) => this.later(() => {
        this.prompt.textContent = turn.prompt.slice(0, index + 1);
      }, index * 55));
      this.later(() => this.submit(turn), turn.prompt.length * 55 + 300);
    }, delay);
  }
  submit(turn) {
    this.send.classList.add('chat-send-active');
    this.prompt.textContent = 'Describe your task…';
    this.prompt.classList.remove('chat-prompt-active');
    this.userText.textContent = turn.prompt;
    this.userBubble.classList.remove('chat-message-hidden');
    this.assistantBubble.classList.add('chat-message-hidden');
    this.later(() => this.send.classList.remove('chat-send-active'), 250);
    this.later(() => {
      this.firstLine.textContent = '•••'; this.secondLine.textContent = '';
      this.assistantBubble.classList.remove('chat-message-hidden');
      this.replyText.classList.add('chat-reply-typing');
    }, 200);
    this.later(() => {
      this.replyText.classList.remove('chat-reply-typing');
      this.firstLine.textContent = ''; this.secondLine.textContent = '';
      const text = turn.reply.join('\n');
      [...text].forEach((_, index) => this.later(() => {
        const lines = text.slice(0, index + 1).split('\n');
        this.firstLine.textContent = lines[0]; this.secondLine.textContent = lines[1] || '';
      }, index * 35));
    }, 900);
  }
  cycle() {
    this.reset(); this.compose(this.turns[0], 0); this.compose(this.turns[1], 5000);
    this.later(() => this.cycle(), 10500);
  }
  start() {
    if (this.running) return;
    this.running = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.userText.textContent = this.turns[0].prompt;
      [this.firstLine.textContent, this.secondLine.textContent] = this.turns[0].reply;
      this.userBubble.classList.remove('chat-message-hidden');
      this.assistantBubble.classList.remove('chat-message-hidden');
      return;
    }
    this.cycle();
  }
  stop() {
    this.running = false;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
  }
}
function syncNativeChat(beat, active) {
  const root = beat.querySelector('[data-native-chat]'); if (!root) return;
  let controller = nativeChatControllers.get(root);
  if (!controller) { controller = new NativeChatAnimation(root); nativeChatControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

const nativeIDEControllers = new WeakMap();
class NativeIDEAnimation {
  constructor(root) {
    this.typed = root.querySelector('[data-ide-typed]');
    this.suggestion = root.querySelector('[data-ide-suggestion]');
    this.hint = root.querySelector('[data-ide-tab-hint]');
    this.user = root.querySelector('[data-ide-chat-user]');
    this.reply = root.querySelector('[data-ide-chat-reply]');
    this.caption = root.querySelector('[data-ide-caption]');
    this.files = ['pricing', 'policy'].map(name => ({
      tab: root.querySelector('[data-ide-tab="' + name + '"]'),
      chip: root.querySelector('[data-ide-context="' + name + '"]'),
      sprite: root.querySelector('[data-ide-flying="' + name + '"]'),
    }));
    this.running = false; this.timers = new Set();
  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  reset() {
    this.typed.textContent = '';
    this.suggestion.classList.remove('ide-code-accepted');
    for (const node of [this.suggestion, this.hint, this.user, this.reply, ...this.files.map(file => file.chip)]) node.classList.add('ide-hidden');
    for (const file of this.files) { file.tab.classList.remove('ide-tab-selected'); file.sprite.classList.remove('ide-file-travelling'); }
    this.caption.textContent = 'Inline completion suggests code. Review before accepting.';
  }
  accept() {
    this.suggestion.classList.add('ide-code-accepted'); this.hint.classList.add('ide-hidden');
    this.caption.textContent = 'Tab accepts a suggestion—it does not verify the code.';
  }
  transfer(index) {
    const file = this.files[index], from = index === 0 ? [110, 58] : [320, 58], to = index === 0 ? [516, 88] : [660, 88];
    file.tab.classList.add('ide-tab-selected'); file.sprite.classList.add('ide-file-travelling');
    this.caption.textContent = 'Selected open files → chat context. Not the entire project.';
    for (let frame = 0; frame <= 24; frame++) this.later(() => {
      const t = frame / 24, eased = t * t * (3 - 2 * t);
      const x = from[0] + (to[0] - from[0]) * eased;
      const y = from[1] + (to[1] - from[1]) * eased + Math.sin(t * Math.PI) * 55;
      file.sprite.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    }, frame * 35);
    this.later(() => { file.sprite.classList.remove('ide-file-travelling'); file.chip.classList.remove('ide-hidden'); }, 860);
  }
  cycle() {
    this.reset();
    [...'  return'].forEach((_, index) => this.later(() => { this.typed.textContent = '  return'.slice(0, index + 1); }, index * 70));
    this.later(() => this.suggestion.classList.remove('ide-hidden'), 850);
    this.later(() => this.hint.classList.remove('ide-hidden'), 1400);
    this.later(() => this.accept(), 2300);
    this.later(() => this.transfer(0), 3200);
    this.later(() => this.transfer(1), 4300);
    this.later(() => this.user.classList.remove('ide-hidden'), 5600);
    this.later(() => this.reply.classList.remove('ide-hidden'), 6400);
    this.later(() => this.cycle(), 10000);
  }
  start() {
    if (this.running) return; this.running = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reset(); this.typed.textContent = '  return'; this.accept();
      for (const node of [this.suggestion, this.user, this.reply, ...this.files.map(file => file.chip)]) node.classList.remove('ide-hidden');
      for (const file of this.files) file.tab.classList.add('ide-tab-selected');
      this.caption.textContent = 'Selected open files → chat context. Review AI suggestions.';
      return;
    }
    this.cycle();
  }
  stop() { this.running = false; for (const id of this.timers) clearTimeout(id); this.timers.clear(); }
}
function syncNativeIDE(beat, active) {
  const root = beat.querySelector('[data-native-ide]'); if (!root) return;
  let controller = nativeIDEControllers.get(root);
  if (!controller) { controller = new NativeIDEAnimation(root); nativeIDEControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

const nativeHarnessControllers = new WeakMap();
class NativeHarnessAnimation {
  constructor(root) {
    this.nodes = [...root.querySelectorAll('[data-harness-node]')];
    this.links = [...root.querySelectorAll('[data-harness-link]')];
    this.caption = root.querySelector('[data-harness-caption]');
    this.decision = root.querySelector('[data-harness-decision]');
    this.tool = root.querySelector('[data-harness-tool]');
    this.lifecycle = root.querySelector('[data-harness-lifecycle]');
    this.instances = [...root.querySelectorAll('[data-harness-instance]')];
    this.liveInstances = new Set();
    this.running = false; this.timers = new Set();
    this.steps = [
      { nodes: ['instructions','config','factory'], links: ['config'], caption: 'Load project instructions and agent definitions before starting.' },
      { create: ['main'], nodes: ['factory','guards','main-agent','context'], links: ['create-main','instructions'], lifecycle: 'Create / start main agent', caption: 'The harness configures the main agent: model, context and scoped tools.' },
      { nodes: ['goal','model'], links: ['goal'], caption: 'The configured agent pursues the goal through its model/tool loop.' },
      { nodes: ['model','guards'], links: ['request'], caption: 'The harness checks permissions and limits before executing a tool.' },
      { nodes: ['guards','tools'], links: ['request'], tool: 'Read / edit files', caption: 'The runtime executes the permitted action—not the model itself.' },
      { nodes: ['tools','context'], links: ['result'], caption: 'Tool observations are appended to the agent context.' },
      { nodes: ['context','model'], links: ['next'], decision: 'Run tests next', caption: 'Updated context feeds another call to the same agent.' },
      { nodes: ['guards','tools','context'], links: ['request','result'], tool: 'Run tests', caption: 'A model call or a tool call does not create a new agent.' },
      { nodes: ['model','factory'], links: ['delegate'], decision: 'Need agent A', caption: 'If delegation is needed, the model requests it through the harness.' },
      { create: ['a'], nodes: ['factory','agent-a'], links: ['spawn-a'], lifecycle: 'Create / start Agent A', caption: 'The harness instantiates or starts Agent A from its definition.' },
      { nodes: ['agent-a','tools-a'], links: ['agent-a-tool','tool-a-result'], caption: 'Agent A runs its own model calls, context and tool feedback loop.' },
      { nodes: ['agent-a','model'], links: ['return-a'], caption: 'Agent A returns observations to the coordinating agent.' },
      { nodes: ['model','factory'], links: ['delegate'], decision: 'Need agent B', caption: 'The harness can start another agent or reuse a configured one.' },
      { create: ['b'], nodes: ['factory','agent-b'], links: ['spawn-b'], lifecycle: 'Create / reuse Agent B', caption: 'Agent B becomes available with its own context and scoped tools.' },
      { nodes: ['agent-b','tools-b'], links: ['agent-b-tool','tool-b-result'], caption: 'Agent B uses its own tools—not direct coordinator tool calls.' },
      { nodes: ['agent-b','model','context','more-agents'], links: ['return-b','next'], decision: 'Finish', caption: 'Create only what is needed, combine evidence and stop within limits.' },
    ];  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  stage(index) {
    const step = this.steps[index];
    for (const name of step.create || []) this.liveInstances.add(name);
    this.instances.forEach(instance => instance.classList.toggle('harness-instance-live', this.liveInstances.has(instance.dataset.harnessInstance)));
    this.lifecycle.textContent = step.lifecycle || 'Create · start · reuse';
    this.nodes.forEach(node => node.classList.toggle('harness-active', step.nodes.includes(node.dataset.harnessNode)));
    this.links.forEach(link => link.classList.toggle('harness-flow', step.links.includes(link.dataset.harnessLink)));
    this.caption.textContent = step.caption;
    this.decision.textContent = step.decision || 'Next action';
    this.tool.textContent = step.tool || 'Files / tests';
  }
  cycle() {
    this.liveInstances.clear();
    this.stage(0);
    for (let index = 1; index < this.steps.length; index++) this.later(() => this.stage(index), index * 1200);
    this.later(() => this.cycle(), this.steps.length * 1200 + 2400);
  }
  start() {
    if (this.running) return; this.running = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const name of ['main','a','b']) this.liveInstances.add(name);
      this.stage(0); this.caption.textContent = 'Definitions → configured agents → model/tool loops → evidence.';
      return;
    }
    this.cycle();
  }
  stop() { this.running = false; for (const id of this.timers) clearTimeout(id); this.timers.clear(); }
}
function syncNativeHarness(beat, active) {
  const root = beat.querySelector('[data-native-harness]'); if (!root) return;
  let controller = nativeHarnessControllers.get(root);
  if (!controller) { controller = new NativeHarnessAnimation(root); nativeHarnessControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

const nativeCLIControllers = new WeakMap();
class NativeCLIHarnessAnimation {
  constructor(root) {
    this.prompt = root.querySelector('[data-cli-prompt]');
    this.log = root.querySelector('[data-cli-log]');
    this.tokens = root.querySelector('[data-cli-tokens]');
    this.running = false; this.timers = new Set();
    this.request = 'Add Wallet pricing and run the tests.';
  }
  later(action, delay) {
    const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay);
    this.timers.add(id);
  }
  append(kind, message, type = 'tool', tokenTotal) {
    if (tokenTotal !== undefined) this.tokens.textContent = tokenTotal.toLocaleString('en-GB');
    const row = document.createElement('div'); row.className = 'cli-log-line cli-log-' + type;
    const label = document.createElement('span'); label.className = 'cli-log-kind'; label.textContent = kind + '  ';
    row.append(label, document.createTextNode(message)); this.log.append(row);
    this.log.scrollTop = this.log.scrollHeight;
  }
  cycle() {
    this.log.replaceChildren(); this.prompt.textContent = ''; this.tokens.textContent = '0';
    [...this.request].forEach((_, index) => this.later(() => { this.prompt.textContent = this.request.slice(0, index + 1); }, index * 40));
    this.later(() => this.append('Read', 'CLAUDE.md — project rules and checks', 'tool', 960), 1900);
    this.later(() => this.append('Read', 'pricing.js', 'tool', 2320), 2450);
    this.later(() => this.append('Read', 'policy.js', 'tool', 3820), 2950);
    this.later(() => this.append('Edit', 'pricing.js — add the Wallet fee rule', 'tool', 5510), 3500);
    this.later(() => this.append('+', 'Wallet: 1.2% + 10 cents', 'diff'), 4050);
    this.later(() => this.append('Permission', 'Run npm test? Awaiting human approval.', 'permission', 6510), 4700);
    this.later(() => this.append('Human', 'Allow once (simulated approval)', 'approval'), 5900);
    this.later(() => this.append('Bash', 'npm test'), 6500);
    this.later(() => this.append('✓', 'Wallet fee and policy checks pass (example)', 'result'), 7600);
    this.later(() => this.append('Done', 'File changed; tests passed. Review the diff.', 'result', 8420), 8700);
    this.later(() => this.cycle(), 12500);
  }
  start() {
    if (this.running) return; this.running = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.prompt.textContent = this.request; this.log.replaceChildren();
      this.append('Read', 'CLAUDE.md and project files');
      this.append('Edit', 'pricing.js — Wallet fee rule');
      this.append('Human', 'Allow npm test (simulated approval)', 'approval');
      this.append('Done', 'Example tests pass. Review the diff.', 'result', 8420);
      return;
    }
    this.cycle();
  }
  stop() { this.running = false; for (const id of this.timers) clearTimeout(id); this.timers.clear(); }
}
function syncNativeCLI(beat, active) {
  const root = beat.querySelector('[data-native-cli]'); if (!root) return;
  let controller = nativeCLIControllers.get(root);
  if (!controller) { controller = new NativeCLIHarnessAnimation(root); nativeCLIControllers.set(root, controller); }
  if (active) controller.start(); else controller.stop();
}

function crewApiLane(a, b, bounds, from, to, hub = 'colab', delegation = false) {
  const returning = from !== hub, lane = returning ? 1 : -1;
  const direction = b.left + b.width / 2 > a.left + a.width / 2 ? 1 : -1;
  const sx = (direction > 0 ? a.right + 10 : a.left - 10) - bounds.left;
  const tx = (direction > 0 ? b.left - 10 : b.right + 10) - bounds.left;
  const sy = a.top + a.height / 2 - bounds.top + lane * 26;
  const ty = b.top + b.height / 2 - bounds.top + lane * 26;
  return { d: 'M '+sx+' '+sy+' L '+tx+' '+ty, x: (sx+tx)/2, y: (sy+ty)/2+(returning?24:-10), returning,
    label: delegation ? (returning ? 'result' : 'task') : returning ? (from === 'llm' ? 'reply' : 'result') : (to === 'llm' ? 'messages' : 'tool call') };
}

function crewLocalRect(rect, bounds, sx, sy) {
  return {left:(rect.left-bounds.left)/sx,right:(rect.right-bounds.left)/sx,top:(rect.top-bounds.top)/sy,bottom:(rect.bottom-bounds.top)/sy,width:rect.width/sx,height:rect.height/sy};
}

const nativeCrewControllers = new WeakMap();
let crewMarkerId = 0;
class NativeCrewFlow {
  constructor(root) {
    this.root = root; this.area = root.querySelector('.crew-flow-nodes'); this.svg = root.querySelector('.crew-flow-wires');
    this.viewport = root.querySelector('.crew-flow-viewport');
    this.nodes = new Map([...root.querySelectorAll('[data-crew-node]')].map(node => [node.dataset.crewNode,node]));
    this.caption = root.querySelector('.crew-flow-caption'); this.steps = JSON.parse(root.dataset.crewSteps); this.edges = JSON.parse(root.dataset.crewEdges);
    this.marker = 'crew-flow-arrow-' + (++crewMarkerId); this.paths = []; this.stageIndex = 0; this.running = false; this.timers = new Set();
    if (typeof ResizeObserver !== 'undefined') { this.resize = new ResizeObserver(() => { if (this.running) this.draw(); }); this.resize.observe(this.viewport || this.area); }
  }
  later(action, delay) { const id = setTimeout(() => { this.timers.delete(id); if (this.running) action(); }, delay); this.timers.add(id); }
  draw() {
    if (this.viewport) {
      const scale = Math.min(1,this.viewport.clientWidth/1200,this.viewport.clientHeight/430);
      this.area.style.transform = 'translate(-50%,-50%) scale('+scale+')';
    }
    const physical = this.area.getBoundingClientRect(); if (!physical.width || !physical.height) return;
    const sx = this.viewport ? physical.width/this.area.offsetWidth : 1, sy = this.viewport ? physical.height/this.area.offsetHeight : 1;
    const bounds = this.viewport ? {left:0,top:0,width:this.area.offsetWidth,height:this.area.offsetHeight} : physical;
    const ns = 'http://www.w3.org/2000/svg'; this.svg.replaceChildren(); this.svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
    const defs = document.createElementNS(ns,'defs'), marker = document.createElementNS(ns,'marker'), tip = document.createElementNS(ns,'path');
    for (const [key,value] of Object.entries({id:this.marker,markerWidth:7,markerHeight:7,refX:6,refY:3.5,orient:'auto'})) marker.setAttribute(key,value);
    tip.setAttribute('d','M0 0 7 3.5 0 7Z'); tip.setAttribute('fill','#83f0f4'); marker.append(tip); defs.append(marker);
    if (this.root.dataset.crewLayout === 'api-lanes') {
      const returning = marker.cloneNode(true); returning.id = this.marker+'-return'; returning.firstChild.setAttribute('fill','var(--amber)'); defs.append(returning);
    }
    this.svg.append(defs);
    this.paths = [];
    for (const [from,to] of this.edges) {
      const first = this.nodes.get(from), second = this.nodes.get(to); if (!first || !second) continue;
      const rawA = first.getBoundingClientRect(), rawB = second.getBoundingClientRect();
      const a = this.viewport ? crewLocalRect(rawA,physical,sx,sy) : rawA, b = this.viewport ? crewLocalRect(rawB,physical,sx,sy) : rawB;
      const ac = [a.left+a.width/2-bounds.left,a.top+a.height/2-bounds.top], bc = [b.left+b.width/2-bounds.left,b.top+b.height/2-bounds.top];
      const horizontal = Math.abs(bc[0]-ac[0]) > Math.abs(bc[1]-ac[1]);
      const reciprocal = this.edges.some(edge => edge[0]===to && edge[1]===from), offset = reciprocal ? (from < to ? 5 : -5) : 0;
      const lane = this.root.dataset.crewLayout === 'api-lanes' ? crewApiLane(a,b,bounds,from,to,this.root.dataset.crewHub || 'colab',this.root.dataset.crewLabels === 'delegation') : null;
      let d;
      if (lane) { d = lane.d; } else if (horizontal) {
        const sign = Math.sign(bc[0]-ac[0]), sx = ac[0]+sign*a.width/2, tx = bc[0]-sign*b.width/2, mid = (sx+tx)/2;
        d = 'M '+sx+' '+(ac[1]+offset)+' C '+mid+' '+(ac[1]+offset)+' '+mid+' '+(bc[1]+offset)+' '+tx+' '+(bc[1]+offset);
      } else {
        const sign = Math.sign(bc[1]-ac[1]), sy = ac[1]+sign*a.height/2, ty = bc[1]-sign*b.height/2, mid = (sy+ty)/2;
        d = 'M '+(ac[0]+offset)+' '+sy+' C '+(ac[0]+offset)+' '+mid+' '+(bc[0]+offset)+' '+mid+' '+(bc[0]+offset)+' '+ty;
      }
      const path = document.createElementNS(ns,'path'); path.setAttribute('d',d); path.setAttribute('marker-end','url(#'+this.marker+(lane?.returning?'-return':'')+')'); path.classList.add('crew-flow-link');
      let label = null;
      if (lane) {
        path.classList.add('crew-api-lane',lane.returning?'crew-api-return':'crew-api-request');
        label = document.createElementNS(ns,'text'); label.setAttribute('x',lane.x); label.setAttribute('y',lane.y); label.setAttribute('text-anchor','middle'); label.classList.add('crew-api-arrow-label',lane.returning?'crew-api-return-label':'crew-api-request-label'); label.textContent = lane.label;
      }
      this.svg.append(path); if (label) this.svg.append(label); this.paths.push({from,to,path,label});
    }
    this.paint();
  }
  paint() {
    const step = this.steps[this.stageIndex]; if (!step) return;
    for (const [id,node] of this.nodes) node.classList.toggle('crew-node-active',step.active.includes(id));
    for (const edge of this.paths) {
      const active = step.edges ? step.edges.some(pair => pair[0]===edge.from && pair[1]===edge.to) : step.active.includes(edge.from)&&step.active.includes(edge.to);
      edge.path.classList.toggle('crew-flow-link-active',active); edge.label?.classList.toggle('crew-api-label-active',active);
    }
    this.caption.textContent = step.caption;
  }
  stage(index) { this.stageIndex=index; this.paint(); }
  cycle() { this.stage(0); for(let i=1;i<this.steps.length;i++)this.later(()=>this.stage(i),i*1800); this.later(()=>this.cycle(),this.steps.length*1800+1600); }
  start() { if(this.running)return;this.running=true;this.draw();if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.stage(0);return}this.cycle(); }
  stop() { this.running=false;for(const id of this.timers)clearTimeout(id);this.timers.clear(); }
}
function syncNativeCrewFlow(beat, active) {
  for (const root of beat.querySelectorAll('[data-native-crew-flow]')) {
    let controller = nativeCrewControllers.get(root);
    if (!controller) { controller = new NativeCrewFlow(root); nativeCrewControllers.set(root,controller); }
    if (active) controller.start(); else controller.stop();
  }
}

function syncReferenceAnimations(beat, active) {
  for (const frame of beat.querySelectorAll('[data-animation-src]')) {
    if (active) {
      fitReferenceAnimation(frame);
      if (!frame.hasAttribute('src')) frame.src = frame.dataset.animationSrc;
    } else if (frame.hasAttribute('src')) {
      frame.style.visibility = 'hidden';
      frame.removeAttribute('src');
    }
  }
}

function renderLesson(beat, state) {
  const lesson = beat.querySelector('[data-lesson]');
  if (!lesson) return;
  const steps = [...lesson.querySelectorAll('[data-lesson-step]')];
  state.lessonStep = Math.max(0, Math.min(state.lessonStep || 0, steps.length - 1));
  steps.forEach((step, index) => { step.hidden = index !== state.lessonStep; });
  const anatomyImage = beat.querySelector("[data-anatomy-image]");
  if (anatomyImage) anatomyImage.hidden = state.lessonStep !== Number(anatomyImage.dataset.anatomyStep || 0);
  for (const marker of lesson.querySelectorAll('[data-lesson-marker]')) {
    const index = Number(marker.dataset.lessonMarker);
    marker.classList.toggle('lesson-active', index === state.lessonStep);
    marker.classList.toggle('lesson-seen', index < state.lessonStep);
  }
  lesson.querySelector('.lesson-counter').textContent = (state.lessonStep + 1) + '/' + steps.length + ' · ' + steps[state.lessonStep].dataset.stepLabel;
}
function moveLesson(direction) {
  const lesson = activeBeat().querySelector('[data-lesson]');
  if (!lesson) return false;
  const state = states[current][phases[current]];
  const next = state.lessonStep + direction;
  if (next < 0 || next >= lesson.querySelectorAll('[data-lesson-step]').length) return false;
  state.lessonStep = next;
  render();
  return true;
}

let headerMenuTimeout;
function updateHeaderMenu() {
  clearTimeout(headerMenuTimeout);
  const visibleSteps = new Set([...enteredSections].filter(index => index <= current).sort((a, b) => b - a).slice(0, 2));
  const buttons = [...document.querySelectorAll('.mission-track [data-jump]')];
  buttons.forEach((button, index) => {
    button.classList.toggle('is-current', index === current);
    button.classList.toggle('is-complete', index < current);
    if (index === current) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  const reveal = () => {
    buttons.forEach((button, index) => {
      const entering = button.hidden && visibleSteps.has(index);
      button.hidden = !visibleSteps.has(index);
      button.classList.remove('step-leaving');
      if (entering) { button.classList.remove('step-entered'); void button.offsetWidth; button.classList.add('step-entered'); }
    });
    const earlier = document.getElementById('header-earlier');
    if (earlier) earlier.hidden = ![...enteredSections].some(index => index < Math.min(...visibleSteps));
    document.querySelector('.mission-track [aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const leaving = buttons.filter((button, index) => !button.hidden && !visibleSteps.has(index));
  if (leaving.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    leaving.forEach(button => { button.classList.remove('step-entered'); button.classList.add('step-leaving'); });
    headerMenuTimeout = setTimeout(reveal, 200);
  } else reveal();
}

function activeBeat() { return slides[current].querySelectorAll('.beat')[phases[current]]; }
function render() {
  enteredSections.add(current);
  stopFlows();
  slides.forEach((slide, index) => {
    slide.hidden = index !== current;
    slide.classList.toggle('active', index === current);
    [...slide.querySelectorAll('.beat')].forEach((beat, phase) => {
      beat.hidden = phase !== phases[index];
      const state = states[index][phase];
      const answer = beat.querySelector('.answer');
      if (answer) {
        if (!answer.dataset.title) {
          answer.dataset.title = answer.querySelector('h2').textContent;
          answer.dataset.text = answer.querySelector('p').textContent;
        }
        answer.hidden = !state.revealed && !state.feedback;
        answer.classList.toggle('wrong', !!state.feedback);
        answer.querySelector('h2').textContent = state.feedback ? 'Not quite — check the boundary.' : answer.dataset.title;
        answer.querySelector('p').textContent = state.feedback || answer.dataset.text;
      }
      for (const choice of beat.querySelectorAll('.choice')) {
        choice.classList.toggle('correct', state.revealed && choice.dataset.correct === 'true');
        choice.classList.toggle('wrong', state.selected === choice && choice.dataset.correct !== 'true');
      }
      renderLesson(beat, state);
      syncReferenceAnimations(beat, index === current && phase === phases[index]);
      syncNativeML(beat, index === current && phase === phases[index]);
      syncNativeNN(beat, index === current && phase === phases[index]);
      syncNativeDL(beat, index === current && phase === phases[index]);
      syncNativeLanguage(beat, index === current && phase === phases[index]);
      syncLLMReference(beat, index === current && phase === phases[index]);
      syncNativeAttention(beat, index === current && phase === phases[index]);
      syncNativePrediction(beat, index === current && phase === phases[index]);
      syncNativeContext(beat, index === current && phase === phases[index]);
      syncNativeChat(beat, index === current && phase === phases[index]);
      syncNativeIDE(beat, index === current && phase === phases[index]);
      syncNativeHarness(beat, index === current && phase === phases[index]);
      syncNativeCLI(beat, index === current && phase === phases[index]);
      syncNativeCrewFlow(beat, index === current && phase === phases[index]);
    });
  });
  updateHeaderMenu();
  const total = slides[current].querySelectorAll('.beat').length;
  document.getElementById('slide-title').textContent = slides[current].dataset.title;
  const overall = slides.slice(0, current).reduce((sum, slide) => sum + slide.querySelectorAll('.beat').length, 0) + phases[current] + 1;
  const allSlides = slides.reduce((sum, slide) => sum + slide.querySelectorAll('.beat').length, 0);
  document.getElementById('counter').textContent = overall + ' / ' + allSlides;
  document.getElementById('previous').disabled = current === 0 && phases[current] === 0;
  document.getElementById('next').disabled = current === slides.length - 1 && phases[current] === total - 1;
  updateTimers();
  savePosition();
}
function reveal() {
  const state = states[current][phases[current]];
  state.revealed = true; state.feedback = null; state.selected = null;
  render();
}
function advance() {
  if (moveLesson(1)) return;
  const beat = activeBeat();
  if (beat.querySelector('.answer') && !states[current][phases[current]].revealed) { reveal(); return; }
  if (phases[current] < slides[current].querySelectorAll('.beat').length - 1) phases[current] += 1;
  else if (current < slides.length - 1) { current += 1; phases[current] = 0; }
  render();
}
function previous() {
  if (moveLesson(-1)) return;
  if (phases[current] > 0) phases[current] -= 1;
  else if (current > 0) { current -= 1; phases[current] = slides[current].querySelectorAll('.beat').length - 1; }
  render();
}
async function fullscreen() {
  const active = document.fullscreenElement || document.webkitFullscreenElement;
  if (active) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (!exit) throw new Error('Fullscreen is not supported in this browser.');
    const result = exit.call(document); if (result?.then) await result;
    return;
  }
  const enter = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
  if (!enter) throw new Error('Fullscreen is not supported in this browser.');
  const result = enter.call(document.documentElement); if (result?.then) await result;
}
document.getElementById('next').addEventListener('click', advance);
document.getElementById('previous').addEventListener('click', previous);
document.getElementById('fullscreen').addEventListener('click', () => fullscreen().catch(() => {}));
document.getElementById('header-earlier')?.addEventListener('click', () => {
  const previousSection = [...enteredSections].filter(index => index < current).sort((a, b) => b - a)[0];
  if (previousSection === undefined) return;
  current = previousSection;
  render();
});
for (const button of document.querySelectorAll('[data-jump]')) button.addEventListener('click', () => { current = Number(button.dataset.jump); render(); });
for (const button of document.querySelectorAll('.reveal-button')) button.addEventListener('click', reveal);
for (const choice of document.querySelectorAll('.choice')) choice.addEventListener('click', () => {
  const state = states[current][phases[current]];
  state.selected = choice;
  state.revealed = choice.dataset.correct === 'true';
  state.feedback = state.revealed ? null : choice.dataset.feedback;
  render();
});
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.target.isContentEditable || (['Enter', ' '].includes(event.key) && event.target.closest('button, a'))) return;
  if (['ArrowRight', 'Enter', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); advance(); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); previous(); }
  if (event.key.toLowerCase() === 'f') fullscreen().catch(() => {});
  if (/^[0-9]$/.test(event.key)) {
    const index = event.key === "0" ? 9 : Number(event.key) - 1;
    if (index < slides.length) { current = index; render(); }
  }
});
for (const button of document.querySelectorAll(".flow-run")) button.addEventListener("click", () => playFlow(button));
for (const [element, state] of timers) {
  element.querySelector(".timer-toggle").addEventListener("click", () => {
    if (state.running) state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    state.running = !state.running;
    state.deadline = Date.now() + state.remaining * 1000;
    updateTimers();
  });
  element.querySelector(".timer-reset").addEventListener("click", () => { state.running = false; state.remaining = Number(element.dataset.minutes) * 60; updateTimers(); });
}
const persistentToggle = document.getElementById("section-timer-toggle");
if (persistentToggle) persistentToggle.addEventListener("click", () => {
  const teachingClock = currentTeachingClock();
  if (teachingClock) { toggleTeachingClock(teachingClock); updateTimers(); return; }
  const element = sectionTimer();
  if (element) element.querySelector(".timer-toggle").click();
});
const persistentReset = document.getElementById("section-timer-reset");
if (persistentReset) persistentReset.addEventListener("click", () => {
  const teachingClock = currentTeachingClock();
  if (teachingClock) { resetTeachingClock(teachingClock); updateTimers(); return; }
  const element = sectionTimer();
  if (element) element.querySelector(".timer-reset").click();
});
setInterval(updateTimers, 1000);
updateTimers();
const backendForms = [...document.querySelectorAll('[data-live-backend-form]')];
const backendInputs = backendForms.map(form => form.querySelector('[data-live-backend-input]')).filter(Boolean);
let savedBackendUrl = '';
try { savedBackendUrl = sessionStorage.getItem('workshop-public-backend-url') || ''; } catch {}
for (const input of backendInputs) input.value = savedBackendUrl;
for (const form of backendForms) {
  const input = form.querySelector('[data-live-backend-input]'), error = form.querySelector('[data-live-backend-error]');
  const update = (showError = false) => {
    const raw = input.value.trim(); let value = '';
    try {
      if (raw) {
        const url = new URL(raw);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) throw new Error();
        value = url.origin;
      }
      for (const other of backendInputs) if (other !== input) other.value = value;
      for (const other of backendForms) other.querySelector('[data-live-backend-error]').textContent = '';
      try { if (value) sessionStorage.setItem('workshop-public-backend-url',value); else sessionStorage.removeItem('workshop-public-backend-url'); } catch {}
    } catch {
      for (const other of backendInputs) if (other !== input) other.value = '';
      error.textContent = showError ? 'Use a public HTTPS base URL, without credentials, path or query.' : '';
      try { sessionStorage.removeItem('workshop-public-backend-url'); } catch {}
    }
  };
  input.addEventListener('input', () => update());
  input.addEventListener('blur', () => update(true));
  form.addEventListener('submit', event => { event.preventDefault(); update(true); });
}
fetch('/links.json').then((response) => response.json()).then((links) => {
  for (const slot of document.querySelectorAll('[data-resource]')) {
    const value = links[slot.dataset.resource];
    if (!value) continue;
    const url = new URL(value);
    if (url.protocol !== 'https:') continue;
    const anchor = document.createElement('a');
    anchor.href = url.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = url.host + url.pathname;
    slot.querySelector('.resource-link').replaceChildren(anchor);
    const label = slot.querySelector('.mock-label');
    if (label) label.remove();
  }
}).catch(() => {});
restorePosition();
render();
revealControls();
