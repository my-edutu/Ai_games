const limit = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
const human = value => limit(value).replace(/[-_]+/g, ' ');
const sentence = value => { const words = human(value); return words.charAt(0).toUpperCase() + words.slice(1); };
const phases = { normal: 'Ascending', danger: 'Danger', guardian: 'Guardian', upgrade: 'Choosing upgrade', result: 'Ascent ended', intermission: 'Next run', recovery: 'Recovering' };
const recoveryCopy = {
  unavailable: ['3D graphics unavailable', 'Enable WebGL, then reload'],
  context: ['Restoring 3D view', 'Run continues'],
  authority: ['Restoring game state', 'Verifying state'],
  stalled: ['3D view delayed', 'Run continues'],
  starting: ['Preparing 3D view', 'Run continues'],
  connection: ['Reconnecting', 'Retrying automatically'],
};

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
  let offersKey = '', buildKey = '', currentRun = '';
  let disposed = false, hasSubmittedView = false, activeRecovery = null, feedbackTimer = null;
  const text = (node, value) => { const next = limit(value); if (node && node.textContent !== next) node.textContent = next; };
  const set = (id, value) => text(byTest(id), value);
  const bind = (node, event, fn) => { node.addEventListener(event, fn); listeners.push(() => node.removeEventListener(event, fn)); };
  const pressed = (id, value) => byId(id).setAttribute('aria-pressed', String(value));
  const label = (id, name, nextAction) => {
    const node = byId(id);
    node.setAttribute('aria-label', name);
    node.title = nextAction;
    node.dataset.tooltip = nextAction;
  };
  function controls() {
    pressed('camera-follow', camera === 'follow');
    pressed('camera-overview', camera === 'overview');
    pressed('sound-toggle', sound);
    label('sound-toggle', 'Sound', sound ? 'Mute sound' : 'Enable sound');
    pressed('motion-toggle', reduced);
    label('motion-toggle', 'Reduced motion', reduced ? 'Enable full motion' : 'Reduce motion');
    pressed('quality-toggle', quality === 'low');
    label('quality-toggle', 'Low graphics quality', quality === 'low' ? 'Use high graphics quality' : 'Use low graphics quality');
    text(byId('quality-label'), quality === 'low' ? 'Low' : 'High');
    byId('recovery-quality').hidden = activeRecovery !== 'stalled' || quality === 'low';
    const fullscreen = !!document.fullscreenElement;
    pressed('fullscreen-toggle', fullscreen);
    label('fullscreen-toggle', 'Fullscreen', fullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
    document.body.dataset.reducedMotion = String(reduced);
  }
  function chooseQuality(value) { quality = value; controls(); onQuality?.(value); }
  for (const mode of ['follow', 'overview']) bind(byId(`camera-${mode}`), 'click', () => { camera = mode; controls(); onCamera?.(mode); });
  bind(byId('sound-toggle'), 'click', () => { sound = !sound; controls(); onSound?.(sound); });
  bind(byId('motion-toggle'), 'click', () => { reduced = !reduced; controls(); onMotion?.(reduced); });
  bind(byId('quality-toggle'), 'click', () => chooseQuality(quality === 'high' ? 'low' : 'high'));
  bind(byId('recovery-quality'), 'click', () => { if (quality !== 'low') chooseQuality('low'); });
  bind(byId('fullscreen-toggle'), 'click', () => { onFullscreen?.(); });
  bind(document, 'fullscreenchange', controls);
  const menuButton = byId('spectator-menu-toggle');
  const menuTray = byId('spectator-control-tray');
  const nav = byId('spectator-controls');
  function showMenu(open, restoreFocus = false) {
    if (!menuButton || !menuTray) return;
    menuTray.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-controls', 'spectator-control-tray');
    menuButton.setAttribute('aria-label', open ? 'Hide spectator controls' : 'Show spectator controls');
    if (nav) nav.dataset.open = String(open);
    if (!open) byId('run-details')?.removeAttribute('open');
    if (restoreFocus) menuButton.focus();
  }
  if (menuButton) bind(menuButton, 'click', () => showMenu(menuTray.hidden));
  bind(document, 'pointerdown', event => {
    if (nav && typeof nav.contains === 'function' && !nav.contains(event.target)) showMenu(false);
  });
  bind(document, 'keydown', event => {
    if (event.key !== 'Escape') return;
    if (byId('run-details').open) {
      byId('run-details').removeAttribute('open');
      byId('details-toggle').focus();
    } else if (menuTray && !menuTray.hidden) showMenu(false, true);
  });
  showMenu(false);
  document.body.classList.toggle('clean-feed', enabled('cleanFeed'));
  document.body.dataset.highContrast = String(enabled('highContrast'));
  controls();
  clearFeedback();

  function clearFeedback() {
    clearTimeout(feedbackTimer); feedbackTimer = null;
    const node = byId('control-feedback');
    if (node) { node.hidden = true; text(node, ''); }
  }

  // A failed viewer action is independent from connection health. Keep one
  // replaceable message for six seconds and one explicitly historical detail.
  function feedback(message, detail = message) {
    if (disposed) return;
    clearFeedback();
    const node = byId('control-feedback');
    if (!node || !message) return;
    text(node, limit(message, 80)); node.hidden = false;
    text(byId('control-feedback-detail'), detail);
    byId('control-feedback-group').hidden = false;
    feedbackTimer = setTimeout(() => {
      feedbackTimer = null;
      if (!disposed) { node.hidden = true; text(node, ''); }
    }, 6000);
  }

  function status(message = '', kind = 'online') {
    if (disposed) return;
    const node = byId('provider-state');
    node.parentElement.dataset.kind = limit(kind, 24);
    // Recovery has its own explicit notice; ordinary play needs no second live label.
    text(node, kind === 'online' ? '' : limit(message, 88));
    node.hidden = kind === 'online' || !!activeRecovery || !message;
    text(byId('connection-detail'), kind === 'online' ? 'Live' : kind === 'degraded' ? 'Degraded' : sentence(kind));
    if (!activeRecovery) {
      byId('recovery-detail').hidden = kind === 'online' || !message;
      text(byId('recovery-detail'), kind === 'online' ? '' : message);
    }
  }

  function update(frame, diagnostics = {}) {
    if (disposed || !frame) return;
    // Only the details drawer changes; never add performance prose to the
    // quiet spectator HUD or mislabel a reduced framebuffer as native pixels.
    const scale = diagnostics.resolution?.scale;
    const tier = quality === 'low' ? 'Low' : 'High';
    text(byId('quality-label'), Number.isFinite(scale) && scale < .995
      ? `${tier} · adaptive ${Math.round(scale * 100)}% render` : tier);
    if (!diagnostics.soundPending && typeof diagnostics.soundEnabled === 'boolean' && sound !== diagnostics.soundEnabled) {
      sound = diagnostics.soundEnabled;
      controls();
    }
    const snapshot = frame.snapshot;
    const scene = frame.scene ?? 'normal';
    // The client may replace the visual phase with recovery. The original public
    // phase still owns real upgrade/result cards; presentation cannot invent it.
    const sourceScene = diagnostics.sourceScene ?? scene;
    const progressState = diagnostics.renderProgress?.state;
    hasSubmittedView ||= !!diagnostics.renderProgress?.lastSubmitted || progressState === 'current' || diagnostics.frames > 0;
    activeRecovery = recoveryCopy[diagnostics.recoveryKind] ? diagnostics.recoveryKind
      : diagnostics.contextLost ? 'context'
      : progressState === 'stalled' ? 'stalled'
      : ['waiting', 'starting'].includes(progressState) ? 'starting'
      : scene === 'recovery' ? 'authority' : null;
    const recovery = byId('recovery-card');
    recovery.hidden = !activeRecovery;
    recovery.dataset.presentation = hasSubmittedView || ['upgrade', 'result', 'intermission'].includes(sourceScene) ? 'retained' : 'initial';
    byId('provider-state').parentElement.dataset.presentation = activeRecovery ? recovery.dataset.presentation : 'phase';
    byId('recovery-quality').hidden = activeRecovery !== 'stalled' || quality === 'low';
    byId('recovery-detail').hidden = !activeRecovery;
    if (activeRecovery) {
      const [message, hint] = recoveryCopy[activeRecovery];
      text(byId('recovery-message'), message);
      text(byId('recovery-hint'), hint);
      text(byId('recovery-detail'), diagnostics.recoveryMessage || `${message}. ${hint}.`);
      byId('provider-state').hidden = true;
    } else text(byId('recovery-detail'), '');
    const lastKnown = activeRecovery === 'connection';
    const phase = phases[sourceScene] ?? sentence(sourceScene);
    set('scene', lastKnown ? `${phase} · last known` : phase);
    const danger = sourceScene === 'danger' || sourceScene === 'guardian';
    document.body.classList.toggle('danger', danger);
    byId('phase-alert').hidden = !danger;
    byId('phase-alert').dataset.freshness = lastKnown ? 'last-known' : 'current';
    text(byId('phase-alert-text'), `${lastKnown ? 'Last known: ' : ''}${sourceScene === 'guardian' ? 'Guardian' : 'Danger'}`);
    if (sourceScene !== 'upgrade') byId('choice-card').hidden = true;
    if (!['result', 'intermission'].includes(sourceScene)) byId('result-card').hidden = true;
    if (!snapshot) return;
    if (snapshot.runToken !== currentRun) {
      currentRun = snapshot.runToken;
      offersKey = '';
      buildKey = '';
      text(byId('caption-text'), '');
    }
    const p = snapshot.player ?? {};
    const progress = snapshot.progress ?? {};
    const metres = Number.isFinite(progress.height) ? `${Math.floor(progress.height / 1000).toLocaleString()}m` : '—';
    set('floor', snapshot.floor);
    set('height', metres);
    set('peak-height', metres);
    set('guardian', progress.nextGuardianFloor);
    set('tick', snapshot.tick);
    set('run-token', limit(snapshot.runToken, 8));
    set('health', Number.isFinite(p.health) && Number.isFinite(p.maxHealth) ? `${p.health}/${p.maxHealth}` : '—');
    set('stamina', Number.isFinite(p.stamina) ? p.stamina : '—');
    set('shields', p.shieldCharges);
    byId('shield-row').hidden = !(p.shieldCharges > 0);
    set('score', Number.isFinite(p.score) ? p.score.toLocaleString() : '—');
    set('ai-intent', limit(snapshot.intent?.summary || 'Assessing the route', 112));
    text(byId('intent-mode'), sentence(snapshot.intent?.mode));
    text(byId('theme-name'), sentence(snapshot.theme));
    text(byId('confidence'), `${Math.round((snapshot.intent?.confidencePermille ?? 0) / 10)}% route confidence`);
    const ratio = (value, max) => Math.max(0, Math.min(100, max > 0 ? value * 100 / max : 0));
    const meter = (id, value, max) => {
      const known = Number.isFinite(value) && Number.isFinite(max) && max > 0;
      const node = byId(id);
      node.setAttribute('aria-valuemax', String(known ? max : 1));
      node.setAttribute('aria-valuenow', String(known ? Math.max(0, Math.min(max, value)) : 0));
      node.setAttribute('aria-valuetext', known ? `${value} of ${max}` : 'Unavailable');
    };
    byId('health-bar').style.width = `${ratio(p.health, p.maxHealth)}%`;
    byId('stamina-bar').style.width = `${ratio(p.stamina, p.maxStamina)}%`;
    meter('health-meter', p.health, p.maxHealth);
    meter('stamina-meter', p.stamina, p.maxStamina);
    const floorProgress = Math.max(0, Math.min(100, Math.round((progress.floorProgressPermille ?? 0) / 10)));
    set('progress', `${floorProgress}%`);
    byId('floor-progress').style.width = `${floorProgress}%`;
    meter('floor-meter', floorProgress, 100);
    const captions = activeRecovery === 'connection' ? [] : (frame.audio?.captions ?? []).filter(item => (!Number.isFinite(item.expiresTick) || item.expiresTick >= snapshot.tick) && item.text);
    text(byId('caption-text'), captions[0]?.text ?? '');
    const tags = snapshot.buildTags ?? [];
    const nextBuild = JSON.stringify(tags);
    if (nextBuild !== buildKey) {
      buildKey = nextBuild;
      byId('build-tags').replaceChildren(...tags.slice(0, 6).map(tag => { const node = document.createElement('em'); node.textContent = human(tag); return node; }));
    }
    const offers = snapshot.upgradeOffers ?? [];
    byId('choice-card').hidden = sourceScene !== 'upgrade' || !offers.length;
    const nextOffers = JSON.stringify(offers);
    if (nextOffers !== offersKey) {
      offersKey = nextOffers;
      byId('choice-options').replaceChildren(...offers.slice(0, 3).map((offer, index) => {
        const row = document.createElement('li'); row.className = 'upgrade-offer';
        const number = document.createElement('span'); number.textContent = `0${index + 1}`; number.setAttribute('aria-hidden', 'true');
        const name = document.createElement('strong'); name.textContent = limit(offer.name, 70);
        row.append(number, name); return row;
      }));
    }
    const isResult = ['result', 'intermission'].includes(sourceScene) && !!snapshot.result;
    byId('result-card').hidden = !isResult;
    if (isResult) {
      const technical = snapshot.result.kind === 'technical';
      text(byId('result-kicker'), `Floor ${snapshot.floor}`);
      text(byId('result-title'), technical ? 'Run interrupted' : 'Ascent ended');
      text(byId('result-height'), metres);
      text(byId('result-reason'), sentence(snapshot.result.reason));
      text(byId('restart-state'), sourceScene === 'intermission' ? 'Next run starting' : technical ? 'Awaiting recovery' : 'Next run soon');
    }
  }
  function dispose() { disposed = true; clearFeedback(); for (const remove of listeners) remove(); }
  return { update, status, feedback, dispose };
}
