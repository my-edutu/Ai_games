'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clientRoot = path.join(__dirname, '../../public/infinite-tower-climb');
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

// Execute the shipped modules; only browser-owned DOM, WebGL, audio and I/O
// boundaries are controlled. No alternate copy of the client logic runs here.
function moduleFunction(context, file, name) {
  const source = fs.readFileSync(path.join(clientRoot, file), 'utf8').replace(/^export /gm, '');
  return vm.runInContext(`(() => { ${source}\nreturn ${name}; })()`, context, { filename: file });
}

function audioEnvironment() {
  const contexts = [];
  const param = () => ({ value: 0, target: 0,
    setTargetAtTime(value) { this.target = value; },
    setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
  });
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.gains = []; this.resumes = []; contexts.push(this); }
    createDynamicsCompressor() { return { threshold: param(), ratio: param(), connect() {} }; }
    createGain() { const gain = { gain: param(), connect() {}, disconnect() {} }; this.gains.push(gain); return gain; }
    createOscillator() { return { frequency: param(), connect() {}, disconnect() {}, start() {}, stop() {} }; }
    resume() {
      const operation = deferred(); this.resumes.push(operation);
      return operation.promise.then(() => { if (this.state !== 'closed') this.state = 'running'; });
    }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  return { AudioContext, contexts };
}

function audioHarness() {
  const environment = audioEnvironment();
  const context = vm.createContext({ window: { AudioContext: environment.AudioContext } });
  return { ...environment, audio: moduleFunction(context, 'visuals/audio.mjs', 'createTowerAudio')() };
}

class Element {
  constructor() {
    this.listeners = new Map(); this.attributes = new Map(); this.dataset = {}; this.style = {};
    this.textContent = ''; this.hidden = false; this.parentElement = { dataset: {} };
    this.classList = { toggle() {} };
  }
  addEventListener(type, listener, options = {}) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Map());
    this.listeners.get(type).set(listener, options);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatch(type, values = {}) {
    for (const [listener, options] of [...(this.listeners.get(type) || [])]) {
      if (options.once) this.removeEventListener(type, listener);
      listener({ type, ...values });
    }
  }
  listenerCount(type) { return type ? this.listeners.get(type)?.size || 0 : [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children = [...(this.children || []), ...children]; }
}

function publicFrame(tick, scene = 'normal') {
  return {
    scene, audio: { voices: [], captions: [] },
    snapshot: { tick, revision: tick, runToken: 'client-test-run', floor: 1, theme: 'foundry',
      player: { state: 'standing', health: 5, maxHealth: 5, stamina: 100, maxStamina: 100, shieldCharges: 0, score: 0 },
      progress: { height: tick * 1000, nextGuardianFloor: 5, floorProgressPermille: 200 },
      intent: { summary: 'Climbing toward the next ledge', mode: 'climb', confidencePermille: 900 },
      buildTags: [], upgradeOffers: [],
    },
  };
}

function appHarness({ width = 1440, search = '', renderProgress = { state: 'current' } } = {}) {
  const elements = new Map(), timers = new Map(), requests = [], views = [], hudUpdates = [];
  const node = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const document = new Element(), lifecycle = new Element(), environment = audioEnvironment();
  const root = node('shell');
  root.querySelector = selector => node(`test:${selector.match(/data-testid="([^"]+)"/)[1]}`);
  document.querySelector = () => root;
  document.getElementById = node;
  document.createElement = () => new Element();
  document.body = new Element(); document.documentElement = new Element();
  document.fullscreenElement = null;
  let timerId = 0;
  const globals = { document, location: { search }, innerWidth: width, innerHeight: 844, URLSearchParams, AbortController,
    matchMedia: () => ({ matches: false }), console,
    AudioContext: environment.AudioContext,
    addEventListener: lifecycle.addEventListener.bind(lifecycle),
    removeEventListener: lifecycle.removeEventListener.bind(lifecycle),
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) {
      const operation = deferred(), request = { ...operation, url, ...options };
      options.signal.addEventListener('abort', () => operation.reject(new Error('aborted')), { once: true });
      requests.push(request); return operation.promise;
    },
    createTowerScene(canvas, settings) {
      const view = { options: { ...settings }, disposed: false, accepted: [], renderProgress,
        accept(data) { assert.equal(this.disposed, false); this.accepted.push(data); },
        setCamera(value) { this.options.camera = value; }, setMotion(value) { this.options.reducedMotion = value; },
        setQuality(value) { this.options.quality = value; }, setStale(value) { this.stale = value; },
        dispose() { this.disposed = true; },
        diagnostics() { return { renderer: 'controlled-webgl-boundary', contextLost: false, quality: this.options.quality, renderProgress: this.renderProgress }; },
      };
      views.push(view); return view;
    },
  };
  globals.window = globals;
  const context = vm.createContext(globals);
  globals.createTowerAudio = moduleFunction(context, 'visuals/audio.mjs', 'createTowerAudio');
  const makeHUD = moduleFunction(context, 'visuals/hud.mjs', 'createHUD');
  globals.createHUD = options => {
    const hud = makeHUD(options);
    return { ...hud, update(frame, diagnostics) {
      hudUpdates.push({ frame, diagnostics });
      return hud.update(frame, diagnostics);
    } };
  };
  const source = fs.readFileSync(path.join(clientRoot, 'app.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInContext(source, context, { filename: 'app.js' });
  return { node, document, lifecycle, timers, requests, views, hudUpdates, contexts: environment.contexts,
    diagnostics: () => globals.__TOWER_RENDER_DIAGNOSTICS__(),
    state: () => globals.__TOWER_PUBLIC_STATE__,
    async respond(request, data) { request.resolve({ ok: true, status: 200, json: async () => data }); await flush(); },
    fireTimer(delay) {
      const matching = [...timers].filter(([, timer]) => timer.delay === delay);
      assert.equal(matching.length, 1, `one ${delay}ms timer must be scheduled`);
      const [id, timer] = matching[0]; timers.delete(id); timer.fn();
    },
    hide(persisted) { lifecycle.dispatch('pagehide', { persisted }); },
    show(persisted) { lifecycle.dispatch('pageshow', { persisted }); },
    close() { lifecycle.dispatch('pagehide', { persisted: false }); },
  };
}

test('a later mute wins over an earlier deferred audio resume', async t => {
  const { audio, contexts } = audioHarness(); t.after(() => audio.dispose());
  const enabling = audio.setEnabled(true), context = contexts[0];
  await audio.setEnabled(false);
  context.resumes[0].resolve(); await enabling;
  assert.equal(audio.diagnostics().soundEnabled, false);
  assert.equal(context.gains[0].gain.target, 0, 'master gain must remain muted');
});

test('an older resume failure cannot mute a newer successful enable', async t => {
  const { audio, contexts } = audioHarness(); t.after(() => audio.dispose());
  const older = audio.setEnabled(true), context = contexts[0];
  await audio.setEnabled(false);
  const latest = audio.setEnabled(true);
  context.resumes[1].resolve(); assert.equal(await latest, true);
  context.resumes[0].reject(new Error('old resume failed')); await older;
  assert.equal(audio.diagnostics().soundEnabled, true);
  assert.equal(context.gains[0].gain.target, .55);
});

test('disposing during a pending audio resume cannot reopen sound', async () => {
  const { audio, contexts } = audioHarness();
  const enabling = audio.setEnabled(true), context = contexts[0];
  audio.dispose(); context.resumes[0].resolve(); await enabling;
  assert.equal(audio.diagnostics().soundEnabled, false);
  assert.equal(audio.diagnostics().voices, 0);
  assert.equal(context.state, 'closed');
  assert.equal(context.gains[0].gain.target, 0);
});

test('cached-page restoration preserves controls and resumes one polling loop', async t => {
  const app = appHarness(); t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(10));
  app.node('camera-overview').dispatch('click');
  for (let cycle = 0; cycle < 3; cycle++) {
    app.hide(true);
    assert.equal(app.views[0].disposed, false, 'a cached document must retain its renderer');
    assert.equal(app.timers.size, 0, 'cached pages do not retain poll timers');
    app.show(true); app.show(true);
    assert.equal(app.requests.length, cycle + 2, 'duplicate pageshow events must not start duplicate polls');
    await app.respond(app.requests.at(-1), publicFrame(20 + cycle));
    assert.equal(app.state().tick, 20 + cycle);
    assert.equal(app.timers.size, 1);
    assert.equal(app.node('camera-follow').listenerCount('click'), 1);
    assert.equal(app.document.listenerCount('fullscreenchange'), 1);
    assert.equal(app.lifecycle.listenerCount('pagehide'), 1);
    assert.equal(app.lifecycle.listenerCount('pageshow'), 1);
  }
  assert.equal(app.views.length, 1);
  assert.equal(app.views[0].options.camera, 'overview');
  app.node('camera-follow').dispatch('click');
  assert.equal(app.views[0].options.camera, 'follow');
  app.fireTimer(100);
  assert.equal(app.diagnostics().requestsInFlight, 1);
});

test('restoring before an aborted poll settles does not cancel or duplicate the new poll', async t => {
  const app = appHarness(); t.after(() => app.close());
  const before = app.requests[0];
  app.hide(true);
  assert.equal(before.signal.aborted, true);
  assert.equal(app.timers.size, 0);
  app.show(true);
  assert.equal(app.requests.length, 2);
  await flush(); // The old request rejection is delivered after the new request starts.
  assert.equal(app.diagnostics().requestsInFlight, 1);
  assert.equal(app.timers.size, 1);
  await app.respond(app.requests[1], publicFrame(30));
  assert.equal(app.state().tick, 30);
  assert.equal(app.timers.size, 1);
});

test('a late response body from a cached-page suspension cannot overwrite restored state', async t => {
  const app = appHarness(); t.after(() => app.close());
  const body = deferred();
  app.requests[0].resolve({ ok: true, status: 200, json: () => body.promise }); await flush();
  app.hide(true); app.show(true);
  assert.equal(app.requests.length, 2);
  await app.respond(app.requests[1], publicFrame(50));
  body.resolve(publicFrame(40)); await flush();
  assert.equal(app.state().tick, 50);
  assert.equal(app.views[0].accepted.length, 1);
  assert.equal(app.timers.size, 1);
  app.fireTimer(100);
  assert.equal(app.requests.length, 3);
});

test('final page destruction releases listeners, polling and presentation resources', async () => {
  const app = appHarness();
  app.close(); app.close(); app.show(true); await flush();
  assert.equal(app.requests[0].signal.aborted, true);
  assert.equal(app.views[0].disposed, true);
  assert.equal(app.timers.size, 0);
  assert.equal(app.document.listenerCount(), 0);
  assert.equal(app.node('camera-follow').listenerCount(), 0);
  assert.equal(app.lifecycle.listenerCount(), 0);
  assert.equal(app.requests.length, 1);
});

test('initial quality and its first toggle agree between the phone or desktop scene and HUD', () => {
  for (const [width, search, expected] of [
    [390, '', 'low'], [699, '', 'low'], [700, '', 'high'], [1440, '', 'high'],
    [390, '?quality=high', 'high'], [1440, '?quality=low', 'low'], [390, '?quality=invalid', 'low'],
  ]) {
    const app = appHarness({ width, search });
    try {
      assert.equal(app.views[0].options.quality, expected, `${width}px ${search || 'default'}`);
      assert.equal(app.node('quality-label').textContent.toLowerCase(), expected);
      assert.equal(app.node('quality-toggle').getAttribute('aria-pressed'), String(expected === 'low'));
      app.node('quality-toggle').dispatch('click');
      const toggled = expected === 'low' ? 'high' : 'low';
      assert.equal(app.views[0].options.quality, toggled);
      assert.equal(app.node('quality-label').textContent.toLowerCase(), toggled);
    } finally { app.close(); }
  }
});

test('successful HTTP delivery of a recovery frame stays visibly degraded until the expedition recovers', async t => {
  const app = appHarness(); t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(60, 'recovery'));
  assert.equal(app.node('recovery-card').hidden, false);
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'degraded');
  assert.notEqual(app.node('provider-state').textContent, 'LIVE EXPEDITION');
  app.fireTimer(100);
  await app.respond(app.requests[1], publicFrame(61));
  assert.equal(app.node('recovery-card').hidden, true);
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'online');
});

test('new snapshots cannot advertise a stalled renderer as live', async t => {
  const app = appHarness({ renderProgress: { state: 'stalled', visibleIdleMs: 5000, lastSubmitted: { tick: 1 } } });
  t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(60));
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'degraded');
  assert.equal(app.node('recovery-card').hidden, false);
  assert.match(app.node('recovery-message').textContent, /3D view.*delayed/i);
  app.fireTimer(100);
  await app.respond(app.requests[1], publicFrame(61));
  assert.equal(app.state().tick, 61, 'graphics delay must not stop state polling');
  assert.notEqual(app.node('provider-state').textContent, 'LIVE EXPEDITION');
  app.views[0].renderProgress = { state: 'current', visibleIdleMs: 0, lastSubmitted: { tick: 61 } };
  app.fireTimer(100);
  await app.respond(app.requests[2], publicFrame(62));
  assert.equal(app.node('recovery-card').hidden, true);
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'online');
});

test('graphics startup stays pending until a render submission succeeds', async t => {
  const app = appHarness({ renderProgress: { state: 'starting', visibleIdleMs: 0, lastSubmitted: null } });
  t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(60));
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'degraded');
  assert.equal(app.node('recovery-card').hidden, false);
  assert.match(app.node('recovery-message').textContent, /preparing.*3D view/i);
});

test('graphics recovery retains the authoritative upgrade phase and a typed cause', async t => {
  const app = appHarness({ renderProgress: { state: 'stalled', visibleIdleMs: 5000, lastSubmitted: { tick: 1 } } });
  t.after(() => app.close());
  const frame = publicFrame(60, 'upgrade');
  frame.snapshot.upgradeOffers = [{ name: 'Shield capacitor', family: 'shield' }];
  await app.respond(app.requests[0], frame);
  const { diagnostics } = app.hudUpdates.at(-1);
  assert.equal(diagnostics.recoveryKind, 'stalled');
  assert.equal(diagnostics.sourceScene, 'upgrade');
  assert.equal(app.node('choice-card').hidden, false, 'graphics recovery must not erase a real upgrade');
  assert.equal(app.node('recovery-card').dataset.presentation, 'retained');
});

test('a lost connection retains submitted-view context without claiming the run is live', async t => {
  const renderProgress = { state: 'current', visibleIdleMs: 0, lastSubmitted: { tick: 60 } };
  const app = appHarness({ renderProgress });
  t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(60));
  app.fireTimer(100);
  app.requests[1].reject(new Error('network interrupted'));
  await flush();
  const { diagnostics } = app.hudUpdates.at(-1);
  assert.equal(diagnostics.recoveryKind, 'connection');
  assert.equal(diagnostics.sourceScene, 'normal');
  assert.equal(diagnostics.renderProgress.lastSubmitted.tick, 60);
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'degraded');
  assert.equal(app.node('recovery-card').dataset.presentation, 'retained');
  assert.equal(app.node('recovery-message').textContent, 'Reconnecting');
  assert.equal(app.node('recovery-hint').textContent, 'Retrying automatically');
});

test('a delayed 3D view keeps the authoritative result and intermission visible', async t => {
  const app = appHarness({ renderProgress: { state: 'stalled', visibleIdleMs: 5000, lastSubmitted: { tick: 1 } } });
  t.after(() => app.close());
  for (const [index, scene] of ['result', 'intermission'].entries()) {
    if (index) app.fireTimer(100);
    const frame = publicFrame(60 + index, scene);
    frame.snapshot.result = { reason: 'health-depleted', kind: 'game' };
    await app.respond(app.requests[index], frame);
    assert.equal(app.node('provider-state').parentElement.dataset.kind, 'degraded');
    assert.equal(app.node('result-card').hidden, false);
    assert.equal(app.node('recovery-card').hidden, false);
    assert.equal(app.node('recovery-card').dataset.presentation, 'retained');
    assert.equal(app.node('recovery-message').textContent, '3D view delayed');
  }
});

test('a superseded sound-enable completion does not show a failure after a deliberate mute', async t => {
  const app = appHarness(); t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(70));
  app.node('sound-toggle').dispatch('click');
  app.node('sound-toggle').dispatch('click');
  app.contexts[0].resumes[0].resolve(); await flush();
  assert.equal(app.diagnostics().soundEnabled, false);
  assert.equal(app.node('provider-state').parentElement.dataset.kind, 'online');
  assert.equal(app.node('sound-toggle').getAttribute('aria-pressed'), 'false');
});

test('polling preserves a pending sound choice so the next click can mute it', async t => {
  const app = appHarness(); t.after(() => app.close());
  await app.respond(app.requests[0], publicFrame(80));
  app.node('sound-toggle').dispatch('click');
  app.fireTimer(100);
  await app.respond(app.requests[1], publicFrame(81));
  assert.equal(app.node('sound-toggle').getAttribute('aria-pressed'), 'true', 'polling must not erase the pending enable choice');
  assert.equal(app.diagnostics().soundPending, true);
  app.node('sound-toggle').dispatch('click');
  app.contexts[0].resumes[0].resolve(); await flush();
  assert.equal(app.diagnostics().soundEnabled, false);
  assert.equal(app.diagnostics().soundPending, false);
  assert.equal(app.node('sound-toggle').getAttribute('aria-pressed'), 'false');
  assert.equal(app.contexts[0].gains[0].gain.target, 0);
});

for (const [kind, message, detail] of [
  ['sound', 'Sound unavailable', 'Sound could not start in this browser'],
  ['fullscreen', 'Fullscreen unavailable', 'Fullscreen is unavailable in this view'],
]) {
  test(`${kind} failure survives healthy polls for a bounded dwell without degrading the connection`, async t => {
    const app = appHarness(); t.after(() => app.close());
    await app.respond(app.requests[0], publicFrame(90));
    if (kind === 'sound') {
      app.node('sound-toggle').dispatch('click');
      app.contexts[0].resumes[0].reject(new Error('browser denied audio'));
    } else {
      app.document.documentElement.requestFullscreen = async () => { throw new Error('browser denied fullscreen'); };
      app.node('fullscreen-toggle').dispatch('click');
    }
    await flush();
    assert.equal(app.node('control-feedback').textContent, message);
    assert.equal(app.node('control-feedback').hidden, false);
    assert.equal(app.node('provider-state').parentElement.dataset.kind, 'online');
    for (let tick = 91; tick <= 93; tick++) {
      app.fireTimer(100);
      await app.respond(app.requests.at(-1), publicFrame(tick));
      assert.equal(app.node('control-feedback').textContent, message);
      assert.equal(app.node('control-feedback').hidden, false);
      assert.equal(app.node('provider-state').parentElement.dataset.kind, 'online');
    }
    app.fireTimer(6000);
    assert.equal(app.node('control-feedback').hidden, true);
    assert.equal(app.node('control-feedback').textContent, '');
    assert.equal(app.node('control-feedback-detail').textContent, detail);
  });
}

test('page destruction clears pending control feedback as well as network timers', async () => {
  const app = appHarness();
  await app.respond(app.requests[0], publicFrame(90));
  app.document.documentElement.requestFullscreen = async () => { throw new Error('browser denied fullscreen'); };
  app.node('fullscreen-toggle').dispatch('click');
  await flush();
  assert.equal([...app.timers.values()].filter(timer => timer.delay === 6000).length, 1);
  app.close();
  assert.equal(app.timers.size, 0);
  assert.equal(app.node('control-feedback').hidden, true);
});
