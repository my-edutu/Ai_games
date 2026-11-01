'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor() {
    this.listeners = new Map(); this.attributes = new Map(); this.dataset = {}; this.style = {};
    this.textContent = ''; this.hidden = false; this.open = false; this.children = [];
    this.parentElement = { dataset: {} }; this.classList = { toggle() {} };
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatch(type, values = {}) { for (const listener of this.listeners.get(type) || []) listener({ type, ...values }); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); if (name === 'open') this.open = true; }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'open') this.open = false; }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  focus() { this.focused = true; }
}

function harness({ search = '', width = 1440 } = {}) {
  const elements = new Map(), calls = [], timers = new Map();
  let timerId = 0;
  const node = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const document = new Element(), root = node('shell');
  root.querySelector = selector => node(`test:${selector.match(/data-testid="([^"]+)"/)[1]}`);
  document.querySelector = () => root;
  document.getElementById = node;
  document.createElement = () => new Element();
  document.body = new Element(); document.documentElement = new Element();
  const context = vm.createContext({ document, location: { search }, innerWidth: width, URLSearchParams,
    matchMedia: () => ({ matches: false }), console,
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const source = fs.readFileSync(path.join(__dirname, '../../public/infinite-tower-climb/visuals/hud.mjs'), 'utf8').replace(/^export /gm, '');
  const createHUD = vm.runInContext(`(() => { ${source}\nreturn createHUD; })()`, context);
  const callbacks = Object.fromEntries(['Camera', 'Sound', 'Motion', 'Quality', 'Fullscreen'].map(name =>
    [`on${name}`, value => calls.push([name.toLowerCase(), value])]));
  const hud = createHUD(callbacks);
  return { hud, node, document, calls, timers,
    expireFeedback() {
      const pending = [...timers].filter(([, timer]) => timer.delay === 6000);
      assert.equal(pending.length, 1, 'one bounded feedback timer');
      const [id, timer] = pending[0]; timers.delete(id); timer.fn();
    },
  };
}

function frame(scene = 'normal', overrides = {}) {
  return { scene, audio: { captions: [] }, snapshot: {
    tick: 60, runToken: 'run-first', floor: 4, theme: 'foundry',
    player: { health: 3, maxHealth: 5, stamina: 84, maxStamina: 100, shieldCharges: 0, score: 320 },
    progress: { height: 160000, nextGuardianFloor: 8, floorProgressPermille: 420 },
    intent: { summary: 'Steering toward the next landing', mode: 'air-control', confidencePermille: 900 },
    upgradeOffers: [], buildTags: [], ...overrides,
  } };
}

const currentView = { renderProgress: { state: 'current', lastSubmitted: { tick: 60 } } };
const delayedView = { renderProgress: { state: 'stalled', lastSubmitted: { tick: 60 } }, recoveryKind: 'stalled' };

test('normal play has no duplicate live-status prose while accessible vitals keep exact values', t => {
  const { hud, node } = harness(); t.after(() => hud.dispose());
  hud.update(frame(), currentView);
  hud.status('LIVE EXPEDITION', 'online');
  assert.equal(node('provider-state').hidden, true);
  assert.equal(node('provider-state').textContent, '');
  assert.equal(node('phase-alert').hidden, true);
  assert.equal(node('test:health').textContent, '3/5');
  assert.equal(node('health-meter').getAttribute('aria-valuenow'), '3');
  assert.equal(node('health-meter').getAttribute('aria-valuemax'), '5');
  assert.equal(node('stamina-meter').getAttribute('aria-valuenow'), '84');
  assert.equal(node('floor-meter').getAttribute('aria-valuenow'), '42');
  assert.equal(node('shield-row').hidden, true);
  assert.equal(node('test:ai-intent').textContent, 'Steering toward the next landing');
});

test('a delayed existing view keeps its real upgrade and a short edge notice with deliberate full detail', t => {
  const { hud, node, calls } = harness(); t.after(() => hud.dispose());
  const recoveryMessage = 'The 3D view is delayed. The expedition continues; try Low graphics quality.';
  hud.update(frame('recovery', { upgradeOffers: [{ name: 'Shield capacitor', family: 'shield' }] }),
    { ...delayedView, sourceScene: 'upgrade', recoveryMessage });
  hud.status('3D view delayed · expedition continues', 'degraded');
  assert.equal(node('recovery-card').hidden, false);
  assert.equal(node('recovery-card').dataset.presentation, 'retained');
  assert.equal(node('recovery-message').textContent, '3D view delayed');
  assert.equal(node('recovery-hint').textContent, 'Run continues');
  assert.equal(node('recovery-detail').textContent, recoveryMessage);
  assert.equal(node('provider-state').hidden, true, 'one visible notice carries the failure');
  assert.equal(node('choice-card').hidden, false);
  assert.equal(node('choice-options').children[0].children[1].textContent, 'Shield capacitor');
  assert.equal(node('recovery-quality').hidden, false);
  node('recovery-quality').dispatch('click');
  assert.deepEqual(calls.at(-1), ['quality', 'low']);
  assert.equal(node('quality-toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(node('recovery-quality').hidden, true);
});

test('first-view failures remain explicit and never suggest that unavailable graphics are live', t => {
  const { hud, node } = harness(); t.after(() => hud.dispose());
  hud.update(frame('recovery'), { recoveryKind: 'unavailable', recoveryMessage: 'Enable WebGL and reload.' });
  assert.equal(node('recovery-card').dataset.presentation, 'initial');
  assert.equal(node('recovery-message').textContent, '3D graphics unavailable');
  assert.equal(node('recovery-hint').textContent, 'Enable WebGL, then reload');
  assert.equal(node('recovery-quality').hidden, true);
  hud.update(frame('recovery'), { recoveryKind: 'starting', renderProgress: { state: 'starting', lastSubmitted: null } });
  assert.equal(node('recovery-message').textContent, 'Preparing 3D view');
  assert.equal(node('recovery-card').dataset.presentation, 'initial');
});

test('connection loss preserves the previous view and real result without claiming fresh gameplay', t => {
  const { hud, node } = harness(); t.after(() => hud.dispose());
  hud.update(frame(), currentView);
  hud.update(frame('recovery', { result: { kind: 'game', reason: 'health-depleted' } }),
    { recoveryKind: 'connection', sourceScene: 'result', recoveryMessage: 'The connection was interrupted. Reconnecting automatically.' });
  assert.equal(node('recovery-card').dataset.presentation, 'retained');
  assert.equal(node('recovery-message').textContent, 'Reconnecting');
  assert.equal(node('recovery-hint').textContent, 'Retrying automatically');
  assert.equal(node('result-card').hidden, false);
  assert.equal(node('result-title').textContent, 'Ascent ended');
  assert.equal(node('result-kicker').textContent, 'Floor 4');
  assert.equal(node('result-height').textContent, '160m');
  assert.equal(node('result-reason').textContent, 'Health depleted');
  hud.update(frame('intermission', { result: { kind: 'game', reason: 'health-depleted' } }), currentView);
  assert.equal(node('recovery-card').hidden, true);
  assert.equal(node('restart-state').textContent, 'Next run starting');
});

test('viewer disclosure and control choices persist across a run boundary and listeners clean up', () => {
  const { hud, node, document, calls } = harness();
  node('run-details').setAttribute('open', '');
  node('camera-overview').dispatch('click');
  node('motion-toggle').dispatch('click');
  node('quality-toggle').dispatch('click');
  hud.update(frame(), currentView);
  hud.update(frame('normal', { runToken: 'run-second', tick: 0 }), currentView);
  assert.equal(node('run-details').open, true);
  assert.equal(node('camera-overview').getAttribute('aria-pressed'), 'true');
  assert.equal(node('motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(node('quality-toggle').getAttribute('aria-pressed'), 'true');
  document.dispatch('keydown', { key: 'Escape' });
  assert.equal(node('run-details').open, false);
  assert.equal(node('details-toggle').focused, true);
  const before = calls.length;
  hud.dispose(); node('camera-follow').dispatch('click'); node('recovery-quality').dispatch('click');
  assert.equal(calls.length, before);
  assert.equal([...document.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0), 0);
});

test('caption expiry and technical results remain truthful through concise presentation', t => {
  const { hud, node } = harness(); t.after(() => hud.dispose());
  const active = frame('guardian');
  active.audio.captions = [{ text: 'Guardian strike', expiresTick: 62 }];
  hud.update(active, currentView);
  assert.equal(node('phase-alert').hidden, false);
  assert.equal(node('phase-alert-text').textContent, 'Guardian');
  assert.equal(node('caption-text').textContent, 'Guardian strike');
  hud.update({ ...active, snapshot: { ...active.snapshot, tick: 63 } }, currentView);
  assert.equal(node('caption-text').textContent, '');
  hud.update(frame('result', { result: { kind: 'technical', reason: 'checkpoint-verification' } }), currentView);
  assert.equal(node('result-title').textContent, 'Run interrupted');
  assert.equal(node('restart-state').textContent, 'Awaiting recovery');
  assert.equal(node('result-reason').textContent, 'Checkpoint verification');
});

test('retained graphics failures keep the known danger phase while disconnected phases are marked last known', t => {
  const { hud, node } = harness(); t.after(() => hud.dispose());
  for (const sourceScene of ['guardian', 'danger']) {
    for (const recoveryKind of ['stalled', 'context']) {
      hud.update(frame('recovery'), { ...delayedView, sourceScene, recoveryKind });
      assert.equal(node('phase-alert').hidden, false);
      assert.equal(node('phase-alert-text').textContent, sourceScene === 'guardian' ? 'Guardian' : 'Danger');
      assert.equal(node('phase-alert').dataset.freshness, 'current');
      assert.equal(node('recovery-card').hidden, false);
    }
    hud.update(frame('recovery'), { ...delayedView, sourceScene, recoveryKind: 'connection' });
    assert.equal(node('phase-alert').hidden, false);
    assert.equal(node('phase-alert-text').textContent, `Last known: ${sourceScene === 'guardian' ? 'Guardian' : 'Danger'}`);
    assert.equal(node('phase-alert').dataset.freshness, 'last-known');
    assert.match(node('test:scene').textContent, /last known/);
  }
});

test('setting names remain stable while pressed states and action tooltips change', t => {
  const { hud, node, document } = harness(); t.after(() => hud.dispose());
  for (const [id, name, before, after] of [
    ['sound-toggle', 'Sound', 'Enable sound', 'Mute sound'],
    ['motion-toggle', 'Reduced motion', 'Reduce motion', 'Enable full motion'],
    ['quality-toggle', 'Low graphics quality', 'Use low graphics quality', 'Use high graphics quality'],
  ]) {
    const control = node(id);
    assert.equal(control.getAttribute('aria-label'), name);
    assert.equal(control.getAttribute('aria-pressed'), 'false');
    assert.equal(control.title, before);
    control.dispatch('click');
    assert.equal(control.getAttribute('aria-label'), name);
    assert.equal(control.getAttribute('aria-pressed'), 'true');
    assert.equal(control.title, after);
    assert.equal(control.dataset.tooltip, after);
  }
  assert.equal(node('fullscreen-toggle').getAttribute('aria-label'), 'Fullscreen');
  document.fullscreenElement = document.documentElement;
  document.dispatch('fullscreenchange');
  assert.equal(node('fullscreen-toggle').getAttribute('aria-label'), 'Fullscreen');
  assert.equal(node('fullscreen-toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(node('fullscreen-toggle').title, 'Exit fullscreen');
});

test('control feedback owns one replaceable dwell timer and survives transport and run updates', () => {
  const { hud, node, timers, expireFeedback } = harness();
  hud.feedback('Sound unavailable', 'The browser denied audio.');
  hud.update(frame(), currentView);
  hud.status('LIVE EXPEDITION', 'online');
  assert.equal(node('control-feedback').textContent, 'Sound unavailable');
  assert.equal(node('control-feedback').hidden, false);
  assert.equal(node('provider-state').parentElement.dataset.kind, 'online');
  hud.feedback('Fullscreen unavailable', 'The browser denied fullscreen.');
  hud.update(frame('normal', { runToken: 'next-run' }), currentView);
  hud.status('LIVE EXPEDITION', 'online');
  assert.equal(timers.size, 1);
  assert.equal(node('control-feedback').textContent, 'Fullscreen unavailable');
  expireFeedback();
  assert.equal(node('control-feedback').hidden, true);
  assert.equal(node('control-feedback-detail').textContent, 'The browser denied fullscreen.');
  hud.feedback('Sound unavailable');
  hud.dispose();
  assert.equal(timers.size, 0);
  assert.equal(node('control-feedback').hidden, true);
  hud.feedback('Late failure');
  assert.equal(node('control-feedback').hidden, true);
  assert.equal(timers.size, 0);
});


test('desktop framebuffer adaptation is disclosed only in the graphics detail, not the live HUD', t => {
  const { hud, node } = harness(); t.after(() => hud.dispose());
  hud.update(frame(), { ...currentView, resolution: { scale: .6, pixelRatio: .9, basePixelRatio: 1.5 } });
  assert.equal(node('quality-label').textContent, 'High · adaptive 60% render');
  assert.equal(node('provider-state').textContent, '');
  hud.update(frame(), { ...currentView, resolution: { scale: 1 } });
  assert.equal(node('quality-label').textContent, 'High');
  node('quality-toggle').dispatch('click');
  hud.update(frame(), { ...currentView, resolution: { scale: .8 } });
  assert.equal(node('quality-label').textContent, 'Low · adaptive 80% render');
});

test('spectator gameplay starts with one accessible menu instead of seven persistent controls', () => {
  const { hud, node, document, calls } = harness();
  const button = node('spectator-menu-toggle'), tray = node('spectator-control-tray');
  assert.equal(tray.hidden, true, 'the full controls tray is visually removed at startup');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.getAttribute('aria-controls'), 'spectator-control-tray');
  button.dispatch('click');
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(tray.hidden, false);
  node('camera-overview').dispatch('click');
  assert.deepEqual(calls.at(-1), ['camera', 'overview'], 'existing controls keep their semantics');
  document.dispatch('keydown', { key: 'Escape' });
  assert.equal(tray.hidden, true);
  assert.equal(button.focused, true, 'focus returns to visible menu trigger');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  const before=calls.length;
  hud.dispose(); button.dispatch('click'); node('camera-follow').dispatch('click');
  assert.equal(calls.length,before,'disposed controls cannot change the running view');
});

test('spectator drawer closes on outside tap without stealing focus on internal actions', t => {
  const { hud, node, document } = harness(); t.after(()=>hud.dispose());
  const trigger=node('spectator-menu-toggle'), nav=node('spectator-controls'), tray=node('spectator-control-tray');
  nav.contains=target=>target===trigger||target===nav||target===node('sound-toggle');
  trigger.dispatch('click');
  document.dispatch('pointerdown',{target:node('sound-toggle')});
  assert.equal(tray.hidden,false,'toggling one setting must not close the entire menu');
  document.dispatch('pointerdown',{target:node('tower-canvas')});
  assert.equal(tray.hidden,true,'tapping the game returns it to uncluttered view');
  assert.equal(trigger.focused,undefined,'a pointer dismissal should not hijack keyboard focus');
});
