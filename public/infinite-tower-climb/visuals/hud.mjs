const limit = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
const human = value => limit(value).replace(/[-_]+/g, ' ');
const phases = { normal: 'ASCENDING', danger: 'DANGER AHEAD', guardian: 'GUARDIAN FLOOR', upgrade: 'FIELD UPGRADE', result: 'ASCENT ENDED', intermission: 'NEXT EXPEDITION', recovery: 'RESTORING VIEW' };

/** Presentation-only DOM overlay. All gameplay values come from the public frame. */
export function createHUD({ initialQuality, onCamera, onSound, onMotion, onQuality, onFullscreen } = {}) {
  const root = document.querySelector('[data-testid="shell"]');
  const byId = id => document.getElementById(id);
  const byTest = id => root.querySelector(`[data-testid="${id}"]`);
  const listeners = [];
  const query = new URLSearchParams(location.search);
  const enabled = name => ['1', 'true'].includes(query.get(name));
  const disabled = name => ['0', 'false'].includes(query.get(name));
  let camera = query.get('camera') === 'overview' ? 'overview' : 'follow';
  // An unmuted query alone cannot unlock browser audio; wait for a gesture.
  let sound = false;
  let reduced = enabled('reducedMotion') || (!disabled('reducedMotion') && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const validQuality = value => value === 'low' || value === 'high';
  let quality = validQuality(initialQuality) ? initialQuality
    : validQuality(query.get('quality')) ? query.get('quality')
    : innerWidth < 700 ? 'low' : 'high';
  let offersKey = '';
  let buildKey = '';
  let currentRun = '';
  let disposed = false;
  const text = (node, value) => { const next = limit(value); if (node && node.textContent !== next) node.textContent = next; };
  const set = (id, value) => text(byTest(id), value);
  const bind = (node, event, fn) => { node.addEventListener(event, fn); listeners.push(() => node.removeEventListener(event, fn)); };
  const pressed = (id, value) => byId(id).setAttribute('aria-pressed', String(value));
  const label = (id, value) => { byId(id).setAttribute('aria-label', value); byId(id).title = value; };
  function controls() {
    pressed('camera-follow', camera === 'follow');
    pressed('camera-overview', camera === 'overview');
    pressed('sound-toggle', sound);
    label('sound-toggle', sound ? 'Mute sound' : 'Enable sound');
    pressed('motion-toggle', reduced);
    label('motion-toggle', reduced ? 'Enable full motion' : 'Reduce motion');
    pressed('quality-toggle', quality === 'low');
    label('quality-toggle', quality === 'low' ? 'Use high graphics quality' : 'Use low graphics quality');
    text(byId('quality-label'), quality === 'low' ? 'Low' : 'High');
    const fullscreen = !!document.fullscreenElement;
    pressed('fullscreen-toggle', fullscreen);
    label('fullscreen-toggle', fullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
    document.body.dataset.reducedMotion = String(reduced);
  }
  for (const mode of ['follow', 'overview']) bind(byId(`camera-${mode}`), 'click', () => { camera = mode; controls(); onCamera?.(mode); });
  bind(byId('sound-toggle'), 'click', () => { sound = !sound; controls(); onSound?.(sound); });
  bind(byId('motion-toggle'), 'click', () => { reduced = !reduced; controls(); onMotion?.(reduced); });
  bind(byId('quality-toggle'), 'click', () => { quality = quality === 'high' ? 'low' : 'high'; controls(); onQuality?.(quality); });
  bind(byId('fullscreen-toggle'), 'click', () => { onFullscreen?.(); });
  bind(document, 'fullscreenchange', controls);
  document.body.classList.toggle('clean-feed', enabled('cleanFeed'));
  document.body.dataset.highContrast = String(enabled('highContrast'));
  controls();

  function status(message = '', kind = 'online') {
    if (disposed) return;
    const node = byId('provider-state');
    node.parentElement.dataset.kind = limit(kind, 24);
    text(node, message);
  }

  function update(frame, diagnostics = {}) {
    if (disposed || !frame) return;
    if (!diagnostics.soundPending && typeof diagnostics.soundEnabled === 'boolean' && sound !== diagnostics.soundEnabled) {
      sound = diagnostics.soundEnabled;
      controls();
    }
    const snapshot = frame.snapshot;
    const scene = frame.scene ?? 'normal';
    set('scene', phases[scene] ?? human(scene).toUpperCase());
    document.body.classList.toggle('danger', scene === 'danger' || scene === 'guardian');
    byId('recovery-card').hidden = scene !== 'recovery';
    if (scene !== 'upgrade') byId('choice-card').hidden = true;
    if (!['result', 'intermission'].includes(scene)) byId('result-card').hidden = true;
    if (scene === 'recovery') text(byId('recovery-message'), diagnostics.recoveryMessage || 'Waiting for verified game state.');
    if (!snapshot) return;
    if (snapshot.runToken !== currentRun) {
      currentRun = snapshot.runToken;
      offersKey = '';
      buildKey = '';
      byId('run-details')?.removeAttribute('open');
      text(byId('caption-text'), '');
    }
    const p = snapshot.player ?? {};
    const progress = snapshot.progress ?? {};
    const metres = Number.isFinite(progress.height) ? `${Math.floor(progress.height / 1000).toLocaleString()}m` : '—';
    set('floor', snapshot.floor);
    set('height', metres);
    set('guardian', progress.nextGuardianFloor);
    set('tick', snapshot.tick);
    set('run-token', limit(snapshot.runToken, 8));
    set('health', `${p.health}/${p.maxHealth}`);
    set('stamina', p.stamina);
    set('shields', p.shieldCharges);
    set('score', Number.isFinite(p.score) ? p.score.toLocaleString() : '—');
    set('ai-intent', limit(snapshot.intent?.summary || 'Assessing the route', 112));
    text(byId('intent-mode'), `${human(snapshot.theme)} sector · ${human(snapshot.intent?.mode)}`);
    text(byId('theme-name'), `${human(snapshot.theme)} sector`);
    text(byId('confidence'), `${Math.round((snapshot.intent?.confidencePermille ?? 0) / 10)}% route confidence`);
    const ratio = (value, max) => Math.max(0, Math.min(100, max > 0 ? value * 100 / max : 0));
    byId('health-bar').style.width = `${ratio(p.health, p.maxHealth)}%`;
    byId('stamina-bar').style.width = `${ratio(p.stamina, p.maxStamina)}%`;
    const floorProgress = Math.max(0, Math.min(100, Math.round((progress.floorProgressPermille ?? 0) / 10)));
    set('progress', `${floorProgress}%`);
    byId('floor-progress').style.width = `${floorProgress}%`;
    const captions = (frame.audio?.captions ?? []).filter(item => (!Number.isFinite(item.expiresTick) || item.expiresTick >= snapshot.tick) && item.text);
    text(byId('caption-text'), captions[0]?.text ?? '');
    const tags = snapshot.buildTags ?? [];
    const nextBuild = JSON.stringify(tags);
    if (nextBuild !== buildKey) {
      buildKey = nextBuild;
      byId('build-tags').replaceChildren(...tags.slice(0, 6).map(tag => { const node = document.createElement('em'); node.textContent = human(tag); return node; }));
    }
    const offers = snapshot.upgradeOffers ?? [];
    byId('choice-card').hidden = scene !== 'upgrade' || !offers.length;
    const nextOffers = JSON.stringify(offers);
    if (nextOffers !== offersKey) {
      offersKey = nextOffers;
      byId('choice-options').replaceChildren(...offers.slice(0, 3).map((offer, index) => {
        const row = document.createElement('div'); row.className = 'upgrade-offer';
        const number = document.createElement('span'); number.textContent = `0${index + 1}`;
        const content = document.createElement('div');
        const name = document.createElement('strong'); name.textContent = limit(offer.name, 70);
        const family = document.createElement('small'); family.textContent = human(offer.family);
        content.append(name, family); row.append(number, content); return row;
      }));
    }
    const isResult = ['result', 'intermission'].includes(scene) && !!snapshot.result;
    byId('result-card').hidden = !isResult;
    if (isResult) {
      const technical = snapshot.result.kind === 'technical';
      text(byId('result-kicker'), technical ? 'EXPEDITION INTERRUPTED' : 'EXPEDITION COMPLETE');
      text(byId('result-title'), technical ? 'Run paused for verification' : 'Every ascent leaves a mark.');
      text(byId('result-height'), metres);
      text(byId('result-reason'), `Floor ${snapshot.floor} · ${human(snapshot.result.reason)}`);
      text(byId('restart-state'), scene === 'intermission' ? 'Preparing the next expedition' : 'Awaiting the next expedition');
    }
  }
  function dispose() { disposed = true; for (const remove of listeners) remove(); }
  return { update, status, dispose };
}
