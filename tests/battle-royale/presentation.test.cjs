const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let THREE;
test.before(async () => {THREE = await import('three');});

const source = fs.readFileSync(path.join(__dirname, '../../public/ai-battle-royale/app.js'), 'utf8').replace(/^import .*;\n/gm, '');

function view(tick = 100, overrides = {}) {
  return {schemaVersion: 1, matchId: 1, tick, time: tick / 20, phase: 'running', countdown: 0,
    remaining: 2, winner: null, zone: {x: 0, z: 0, radius: 60, stage: 0, secondsToShrink: 20},
    map: {size: 120, buildings: [], covers: []}, loot: [{id: 'ammo', x: 1, z: 1, kind: 'ammo', active: true}],
    agents: ['a', 'b'].map((id, index) => ({id, name: id, archetype: 'scout', color: '#ff8855', x: index * 5,
      z: 0, yaw: 0, hp: 100, shield: 50, kills: 0, alive: true, weapon: 'rifle', ammo: 12,
      intent: 'Recovering supplies', action: 'running', fireTick: -100, hitTick: -100, targetId: null})),
    events: [], ...overrides};
}

// Execute the actual browser module with real Three scene objects and controlled browser I/O.
// Rendering is the sole GPU stub; late fetches deliberately ignore abort to exercise lifecycle fences.
function browser(search = '?inspect=1', components = {}) {
  const timers = new Map(), rafs = new Map(), requests = [], elements = new Map(), renderers = [], errors = [];
  const calls = {builds: 0, worldDisposals: 0, actorDisposals: 0, audioResets: 0, audioDisposals: 0, audioEvents: [], reloads: 0};
  let now = 0, serial = 0, renderError = null;
  class Element {
    constructor(tagName = 'DIV') {
      this.tagName = tagName; this.hidden = false; this.textContent = ''; this.children = []; this.dataset = {}; this.listeners = new Map();
      this.style = {setProperty() {}}; this.attributes = {}; this.classes = new Set();
      this.classList = {add: value => this.classes.add(value), remove: value => this.classes.delete(value),
        toggle: (value, force) => {const enabled = force === undefined ? !this.classes.has(value) : force; enabled ? this.classes.add(value) : this.classes.delete(value); return enabled;}};
    }
    addEventListener(name, callback, options = {}) {if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push({callback, options});}
    removeEventListener(name, callback) {this.listeners.set(name, (this.listeners.get(name) || []).filter(entry => entry.callback !== callback));}
    emit(name, event = {}) {for (const entry of [...(this.listeners.get(name) || [])]) {if (entry.options.signal?.aborted) continue; entry.callback({preventDefault() {}, target: this, ...event}); if (entry.options.once) this.removeEventListener(name, entry.callback);}}
    setAttribute(name, value) {this.attributes[name] = value;}
    append(...children) {this.children.push(...children);}
    replaceChildren(...children) {this.children = children;}
    querySelector() {return this.children[0] || (this.children[0] = new Element('SPAN'));}
    focus() {}
    getContext() {return new Proxy({}, {get(target, key) {return target[key] ?? (() => {});}, set(target, key, value) {target[key] = value; return true;}});}
    setPointerCapture() {}
  }
  const element = id => {if (!elements.has(id)) elements.set(id, new Element(id === 'arena' || id === 'minimap' ? 'CANVAS' : 'DIV')); return elements.get(id);};
  element('minimap').width = 256;
  const window = new Element('WINDOW'), cameras = ['director', 'follow', 'tactical'].map(mode => {const button = new Element('BUTTON'); button.dataset.camera = mode; return button;});
  class Renderer {
    constructor(options) {this.options = options; this.shadowMap = {}; this.info = {render: {calls: 1, triangles: 20000}, memory: {geometries: 1, textures: 1}}; this.disposed = false; this.renders = 0; renderers.push(this);}
    getContext() {return {getExtension: () => null};}
    setPixelRatio(ratio) {this.pixelRatio = ratio;}
    setSize() {}
    render() {this.renders++; if (renderError) throw renderError;}
    dispose() {this.disposed = true;}
  }
  const context = vm.createContext({THREE: {...THREE, WebGLRenderer: Renderer}, window,
    document: {getElementById: element, createElement: name => new Element(name.toUpperCase()), createTextNode: text => ({textContent: text}),
      querySelectorAll: () => cameras, querySelector: selector => element(selector)},
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, location: {search, reload() {calls.reloads++;}},
    matchMedia: () => ({matches: false}), URLSearchParams, AbortController, DOMException,
    performance: {now: () => now}, console: {error: (...args) => errors.push(args), warn() {}, log() {}},
    addEventListener: (...args) => window.addEventListener(...args), removeEventListener: (...args) => window.removeEventListener(...args),
    setTimeout: (callback, delay) => {const id = ++serial; timers.set(id, {callback, delay}); return id;}, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: callback => {const id = ++serial; rafs.set(id, callback); return id;}, cancelAnimationFrame: id => rafs.delete(id),
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({url, signal: options.signal, resolve, reject, settled: false})),
    createAudio: () => ({async toggle() {return false;}, reset() {calls.audioResets++;}, dispose() {calls.audioDisposals++;}, accept(events) {calls.audioEvents.push(events.map(event => event.id));}}),
    createBattlefield: components.createBattlefield || (() => {calls.builds++; const group = new THREE.Group(); return {group, update() {}, dispose() {calls.worldDisposals++; group.removeFromParent();}};}),
    createCombatant: components.createCombatant || (() => {const group = new THREE.Group(); return {group, update() {}, dispose() {calls.actorDisposals++; group.removeFromParent();}};}),
  });
  vm.runInContext(source + `\n;globalThis.testView = {
    get state() { return {snapshot, previous, effectCursor, lastSwitch, lastAnnouncedStage, disposed, inspectionFrozen,
      renderState: typeof renderState === 'undefined' ? undefined : renderState, effects: effects.length}; },
    poll, frame
  };`, context, {filename: 'ai-battle-royale/app.js'});
  const settle = () => new Promise(resolve => setImmediate(resolve));
  return {calls, errors, timers, rafs, requests, renderers, element, window, context,
    get state() {return context.testView.state;}, get inspection() {return window.royaleInspection;},
    setRenderError(error) {renderError = error;},
    frame() {const entry = rafs.entries().next().value; assert.ok(entry, 'a frame is scheduled'); rafs.delete(entry[0]); now += 16; entry[1](now);},
    timer(delay) {const entry = [...timers].find(([, value]) => value.delay === delay); assert.ok(entry, `a ${delay}ms timer is scheduled`); timers.delete(entry[0]); now += delay; entry[1].callback();},
    async respond(next, request = requests.find(entry => !entry.settled)) {assert.ok(request, 'a request is pending'); request.settled = true; request.resolve({ok: true, json: async () => next}); await settle();},
    async next(next) {this.timer(100); await this.respond(next);}, settle,
  };
}

test('phone director keeps its selected contender inside the narrow viewport during a nearby fight', async () => {
  const b=browser();b.context.innerWidth=390;b.context.innerHeight=844;b.window.emit('resize');
  const state=view();state.agents[0].targetId='b';state.agents[1].x=20;
  await b.respond(state);b.frame();b.inspection.camera.updateMatrixWorld(true);
  const foot=new THREE.Vector3(0,0,0).project(b.inspection.camera);
  assert.ok(Math.abs(foot.x)<.8,`selected contender must stay clear of the screen edges, projected x=${foot.x}`);
  assert.ok(foot.y>-.4,'selected feet must remain above the bottom HUD');
});

test('frame exceptions persist through successful polls and stop after bounded recovery attempts', async () => {
  const b = browser(); await b.respond(view()); b.frame();
  b.setRenderError(new Error('injected GPU failure'));
  assert.doesNotThrow(() => b.frame(), 'the frame boundary contains rendering exceptions');
  await b.next(view(101, {phase: 'intermission', winner: 'a'}));
  assert.equal(b.element('connection').hidden, false, 'healthy HTTP cannot hide failed rendering');
  assert.equal(b.element('result').hidden, true, 'a technical failure cannot publish a result overlay');
  for (const delay of [250, 500, 1000]) {b.timer(delay); b.frame();}
  assert.equal(b.state.renderState, 'failed');
  assert.match(b.element('connection').textContent, /refresh/i);
  assert.equal(b.rafs.size, 0);
  assert.equal([...b.timers.values()].filter(timer => [250, 500, 1000].includes(timer.delay)).length, 0);
  assert.equal(b.calls.reloads, 0, 'there is no automatic reload loop');
});

test('context loss remains visible while polling and restoration resumes without a reload', async () => {
  const b = browser(); await b.respond(view()); b.frame();
  b.element('arena').emit('webglcontextlost');
  await b.next(view(101, {phase: 'intermission', winner: 'a'}));
  assert.equal(b.element('connection').hidden, false);
  assert.equal(b.element('result').hidden, true);
  b.element('arena').emit('webglcontextrestored');
  b.frame();
  assert.equal(b.state.renderState, 'healthy');
  assert.equal(b.element('connection').hidden, true);
  assert.equal(b.element('result').hidden, false);
  assert.equal(b.calls.reloads, 0);
});

test('render recovery before the first network response keeps waiting for and rendering the match', async () => {
  const b = browser();
  b.setRenderError(new Error('transient startup render failure')); b.frame();
  b.setRenderError(null); b.timer(250); b.frame();
  await b.respond(view()); b.frame();
  assert.equal(b.state.renderState, 'healthy');
  assert.equal(b.calls.builds, 1);
  assert.equal(b.element('connection').hidden, true);
  assert.equal(b.rafs.size, 1);
});

test('a context that never restores enters a persistent terminal slate after its deadline', async () => {
  const b = browser(); await b.respond(view()); b.frame();
  b.element('arena').emit('webglcontextlost'); b.timer(12000);
  await b.next(view(101, {phase: 'intermission', winner: 'a'}));
  b.element('arena').emit('webglcontextrestored');
  assert.equal(b.state.renderState, 'failed');
  assert.equal(b.element('connection').hidden, false);
  assert.equal(b.element('result').hidden, true);
  assert.equal(b.rafs.size, 0); assert.equal(b.calls.reloads, 0);
});

test('pagehide aborts and fences an in-flight fetch even when the fetch completes late', async () => {
  const b = browser(), pending = b.requests[0];
  b.window.emit('pagehide', {persisted: false});
  assert.equal(pending.signal.aborted, true);
  await b.respond(view(), pending);
  assert.equal(b.state.snapshot, undefined);
  assert.equal(b.calls.builds, 0);
  assert.equal(b.timers.size, 0);
  assert.equal(b.rafs.size, 0);
  assert.equal(b.renderers[0].disposed, true);
});

test('teardown also fences a delayed response body after the HTTP request has completed', async () => {
  const b = browser(), pending = b.requests[0]; let resolveBody;
  pending.settled = true; pending.resolve({ok: true, json: () => new Promise(resolve => {resolveBody = resolve;})});
  await b.settle(); assert.equal(typeof resolveBody, 'function');
  b.window.emit('pagehide', {persisted: false}); resolveBody(view()); await b.settle();
  assert.equal(pending.signal.aborted, true);
  assert.equal(b.state.snapshot, undefined); assert.equal(b.calls.builds, 0);
  assert.equal(b.timers.size, 0); assert.equal(b.rafs.size, 0);
});

test('final teardown disposes labels, pickups, effects, scene geometry, audio and application listeners', async () => {
  const b = browser(); await b.respond(view(100, {events: [{id: 1, kind: 'shot', actor: 'a', target: 'b'}]})); b.frame();
  const resources = new Map(), scene = b.inspection.scene;
  scene.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const resource of [object.geometry, ...materials, ...materials.map(material => material?.map)].filter(Boolean)) {
      if (resources.has(resource)) continue;
      resources.set(resource, 0); resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
    }
  });
  assert.ok(resources.size > 15, 'the scene includes actual Three-owned resources');
  b.window.emit('pagehide', {persisted: false});
  for (const [resource, count] of resources) assert.ok(count >= 1, `released ${resource.type || resource.constructor.name}`);
  assert.equal(scene.children.length, 0);
  assert.equal(b.calls.audioDisposals, 1); assert.equal(b.calls.worldDisposals, 1); assert.equal(b.calls.actorDisposals, 2);
  for (const target of [b.window, b.element('arena'), b.element('sound')]) {
    assert.equal([...target.listeners.values()].flat().filter(entry => !entry.options.signal?.aborted).length, 0);
  }
});

test('BFCache page restoration rebuilds a fresh view and rejects the old lifecycle response', async () => {
  const b = browser(); await b.respond(view()); b.frame();
  b.timer(100); const stale = b.requests.at(-1);
  b.window.emit('pagehide', {persisted: true});
  assert.equal(stale.signal.aborted, true);
  assert.equal(b.calls.worldDisposals, 1);
  assert.equal(b.calls.actorDisposals, 2);
  assert.equal(b.renderers[0].disposed, true);
  b.window.emit('pageshow', {persisted: true});
  await b.respond(view(5), b.requests.at(-1)); b.frame();
  await b.respond(view(900, {matchId: 9}), stale);
  assert.equal(b.state.snapshot.tick, 5);
  assert.equal(b.state.snapshot.matchId, 1);
  assert.equal(b.state.renderState, 'healthy');
  assert.equal(b.calls.builds, 2);
  assert.equal(b.rafs.size, 1);
  assert.equal([...b.timers.values()].filter(timer => timer.delay === 100).length, 1);
});

test('same-match host restart clears interpolation, effect/audio cursors and director timing', async () => {
  const event = id => ({id, kind: 'shot', actor: 'a', target: 'b', x: 0, z: 0, text: ''});
  const b = browser(); await b.respond(view(900, {events: [event(70)]})); b.frame();
  await b.next(view(10, {events: [event(1)]}));
  assert.equal(b.calls.builds, 2, 'tick rollback rebuilds actor animation state');
  assert.equal(b.state.previous, b.state.snapshot, 'old positions cannot interpolate across host restart');
  assert.equal(b.state.effectCursor, 1);
  assert.equal(b.state.effects, 1, 'only the restarted event remains');
  assert.equal(b.state.lastSwitch, 0, 'the director is no longer waiting for pre-restart time');
  assert.equal(b.calls.audioResets, 2);
  assert.deepEqual(b.calls.audioEvents.at(-1), [1]);
});

test('inspect capture freezes after a real snapshot frame and renderOnce does not restart loops', async () => {
  const b = browser('?inspect=1&capture=1&quality=low');
  b.frame(); assert.equal(b.state.inspectionFrozen, false, 'empty startup frame is not capture evidence');
  await b.respond(view()); b.frame();
  assert.equal(b.inspection.metrics.frozen, true);
  assert.equal(b.inspection.metrics.renderedMatch, 1);
  assert.equal(b.rafs.size, 0); assert.equal(b.timers.size, 0);
  const frames = b.inspection.metrics.frames, snapshot = b.state.snapshot;
  b.inspection.setCamera('tactical'); b.inspection.renderOnce();
  assert.equal(b.inspection.metrics.frames, frames + 1);
  assert.equal(b.state.snapshot, snapshot);
  assert.equal(b.rafs.size, 0); assert.equal(b.timers.size, 0);
  assert.equal(b.renderers[0].options.antialias, false);
  assert.equal(b.renderers[0].pixelRatio, .75);
  assert.equal(typeof b.inspection.metrics.frameMs, 'number');
  assert.equal(typeof b.inspection.metrics.buildMs, 'number');
});

function materialFixture() {
  const worlds = [];
  const components = {createBattlefield() {
    const group = new THREE.Group(), texture = new THREE.Texture(), geometry = new THREE.BoxGeometry();
    const standard = new THREE.MeshStandardMaterial({color: '#aeccaa', map: texture, emissive: '#112233', emissiveIntensity: .3,
      roughness: .7, metalness: .4, vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: .8, depthWrite: false});
    const basic = new THREE.MeshBasicMaterial({color: '#ffeecc'}), originalArray = [standard, basic];
    const single = new THREE.Mesh(geometry, standard), multiple = new THREE.Mesh(geometry, originalArray);
    group.add(single, multiple);
    const record = {group, texture, geometry, standard, basic, single, multiple, originalArray, disposed: new Map()};
    for (const resource of [texture, geometry, standard, basic]) {
      record.disposed.set(resource, 0); resource.addEventListener('dispose', () => record.disposed.set(resource, record.disposed.get(resource) + 1));
    }
    worlds.push(record);
    return {group, update() {standard.color.setHex(0x559977); standard.emissive.setHex(0x224466); standard.emissiveIntensity += .2; standard.opacity -= .1;},
      dispose() {for (const resource of record.disposed.keys()) resource.dispose(); group.removeFromParent(); group.clear();}};
  }};
  return {worlds, components};
}

test('low quality shares cheaper lit materials without losing animation, texture ownership or the original high tier', async () => {
  const fixture = materialFixture(), b = browser('?inspect=1', fixture.components);
  await b.respond(view()); const original = fixture.worlds[0];
  assert.equal(original.single.material, original.standard, 'high quality initially uses the original PBR material');
  b.element('low-quality').checked = true; b.element('low-quality').emit('change');
  const low = original.single.material;
  assert.equal(low.isMeshLambertMaterial, true);
  assert.equal(original.multiple.material[0], low, 'one fallback is shared by every use of an original material');
  assert.equal(original.multiple.material[1], original.basic, 'unlit accents retain their existing appearance');
  assert.equal(original.single.geometry, original.geometry, 'quality never removes geometry');
  assert.equal(low.map, original.texture); assert.equal(low.color, original.standard.color); assert.equal(low.emissive, original.standard.emissive);
  for (const property of ['vertexColors', 'side', 'transparent', 'opacity', 'depthWrite']) assert.equal(low[property], original.standard[property]);
  b.frame();
  assert.equal(low.emissiveIntensity, original.standard.emissiveIntensity, 'private owner animation reaches the lit fallback');
  assert.equal(low.opacity, original.standard.opacity);
  assert.equal(low.color.getHex(), 0x559977); assert.equal(low.emissive.getHex(), 0x224466);
  let fallbackDisposals = 0; low.addEventListener('dispose', () => fallbackDisposals++);
  b.element('low-quality').checked = false; b.element('low-quality').emit('change');
  assert.equal(original.single.material, original.standard);
  assert.equal(original.multiple.material, original.originalArray, 'the exact original material array is restored');
  assert.equal(fallbackDisposals, 1);
  assert.ok([...original.disposed.values()].every(count => count === 0), 'switching quality never disposes owner resources');
  b.element('low-quality').checked = true; b.element('low-quality').emit('change');
  assert.notEqual(original.single.material, low, 'disposed fallbacks cannot be reused');
  b.window.emit('pagehide', {persisted: false});
});

test('low-tier material replacements release once through match reset, context recovery and BFCache', async () => {
  const fixture = materialFixture(), b = browser('?inspect=1&quality=low', fixture.components);
  await b.respond(view()); b.frame();
  const retire = async action => {
    const original = fixture.worlds.at(-1), low = original.single.material;
    assert.equal(low.isMeshLambertMaterial, true);
    let fallbackDisposals = 0; low.addEventListener('dispose', () => fallbackDisposals++);
    await action();
    assert.equal(fallbackDisposals, 1, 'a retired fallback is released once');
    assert.equal(original.single.material, original.standard, 'owner materials are restored before disposal');
    assert.equal(original.multiple.material, original.originalArray);
    assert.ok([...original.disposed.values()].every(count => count === 1), 'original materials, geometry and shared texture each retain one owner');
  };
  await retire(() => b.next(view(1, {matchId: 2}))); b.frame();
  await retire(() => {b.element('arena').emit('webglcontextlost'); b.element('arena').emit('webglcontextrestored');}); b.frame();
  await retire(() => b.window.emit('pagehide', {persisted: true}));
  b.window.emit('pageshow', {persisted: true}); await b.respond(view(1, {matchId: 3})); b.frame();
  assert.equal(fixture.worlds.at(-1).single.material.isMeshLambertMaterial, true);
  await retire(() => b.window.emit('pagehide', {persisted: false}));
  assert.equal(b.errors.length, 1, 'only the deliberately injected context-loss report is emitted');
});

test('supplies navigation cannot trigger a healing or reload pose from descriptive intent', () => {
  const characterSource = fs.readFileSync(path.join(__dirname, '../../public/ai-battle-royale/characters.js'), 'utf8').replace('export function createCombatant', 'function createCombatant');
  const context = vm.createContext({THREE}); vm.runInContext(characterSource + '\n;globalThis.make = createCombatant;', context);
  const agent = view().agents[0], actor = context.make(THREE, agent), weapon = actor.group.getObjectByName('weapon');
  actor.update({...agent, action: 'running', intent: ''}, .016, 1);
  const runningPose = weapon.quaternion.clone();
  actor.update({...agent, action: 'running', intent: 'Recovering supplies'}, .016, 1);
  assert.ok(weapon.quaternion.angleTo(runningPose) < 1e-6, 'supply navigation retains the neutral running pose');
  actor.update({...agent, action: 'healing', intent: 'Applying field medkit'}, .016, 1);
  assert.ok(weapon.quaternion.angleTo(runningPose) > .1, 'an authoritative healing action has a distinct pose');
  actor.update({...agent, action: 'reloading', intent: ''}, .016, 1);
  assert.ok(weapon.quaternion.angleTo(runningPose) > .1, 'an authoritative reload action has a distinct pose');
  actor.update({...agent, action: 'running', intent: 'Moving toward reload supplies'}, .016, 1);
  assert.ok(weapon.quaternion.angleTo(runningPose) < 1e-6, 'descriptive reload intent cannot start a reload pose');
  actor.dispose();
});
