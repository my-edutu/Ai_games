// Only adjacent, same-run/floor fixed-step HP crossings can earn optional
// critical-health or relief audio. No inferred pickup, result or restart.
export function observedSurvivalChange(previous, next) {
  if (!previous || !next || previous.lifecycle !== 'running' ||
    next.lifecycle !== 'running' || !next.runToken ||
    previous.runToken !== next.runToken ||
    !Number.isSafeInteger(previous.floor) || previous.floor !== next.floor ||
    !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(next.tick) ||
    next.tick <= previous.tick || next.tick - previous.tick > 8) return null;
  const p = previous.player, n = next.player;
  if (!p || !n || ![p.health, p.maxHealth, n.health, n.maxHealth].every(Number.isFinite) ||
    p.maxHealth <= 0 || n.maxHealth !== p.maxHealth || p.health <= 0 ||
    n.health <= 0 || n.health > n.maxHealth) return null;
  const critical = .35 * n.maxHealth;
  if (p.health > critical && n.health <= critical) return 'critical';
  if (p.health <= critical && n.health > critical) return 'recovered';
  return null;
}

// A bounded synthesized soundscape. No audio is started until a viewer enables it.
export function createTowerAudio() {
  let context = null, master = null, bed = null, wind = null, windFilter = null, windGain = null;
  let enabled = false, token = '', last = null, lastFloor = null, lastIntent = '', lastTargetPlatformId = null, lastLifecycle = 'running', stride = 0, noiseIndex = 0;
  let disposed = false, lastAmbient = 0, enableRequest = 0, enablePending = false;
  const voices = new Set(), heard = new Set(), pads = [];
  let guardianWindups = new Map(), guardianStates = new Map(), hazardStates = new Map();
  let lastSurvivalSnapshot = null;
  // One opt-in arrival tone for crossing the actual cap-approach threshold.
  // This is a genuine same-run fixed-step crossing, not a route prediction.
  let crownDistance = null, crownTick = -1, crownHeard = '';

  async function setEnabled(value) {
    const operation = ++enableRequest;
    if (disposed) return false;
    enablePending = false;
    if (!value) { enabled = false; if (master) master.gain.setTargetAtTime(0, context.currentTime, .08); return false; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!context) {
      context = new Audio();
      const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -12;
      compressor.ratio.value = 5; compressor.connect(context.destination);
      master = context.createGain(); master.gain.value = 0; master.connect(compressor);
      bed = context.createGain(); bed.gain.value = .025; bed.connect(master);
      for (const frequency of [55, 82.41, 110]) {
        const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        oscillator.connect(bed); oscillator.start(); voices.add(oscillator); pads.push(oscillator);
      }
      // Original opt-in wind bed, generated once per audio context: a filtered
      // seamless looping sample instead of a continuous stream of new voices.
      // The same buffer supplies bounded gravel/cloth transients on real steps.
      // The ambient texture is optional; restricted and test AudioContexts may
      // support tonal audio and resume/mute but not sampled buffers/filters.
      if(typeof context.createBuffer==='function'&&typeof context.createBufferSource==='function'
        &&typeof context.createBiquadFilter==='function'&&Number.isFinite(context.sampleRate)&&context.sampleRate>0){
      const buffer = context.createBuffer(1, Math.max(256, Math.round(context.sampleRate)), context.sampleRate);
      const samples = buffer.getChannelData(0);
      let noiseSeed = 0x12345;
      for (let i = 0; i < samples.length; i++) {
        noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
        samples[i] = (noiseSeed / 0x80000000 - 1) * .65;
      }
      wind = context.createBufferSource(); wind.buffer = buffer; wind.loop = true;
      windFilter = context.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 260;
      windGain = context.createGain(); windGain.gain.value = .008;
      wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(master);
      wind.start(); voices.add(wind);
      }
    }
    enablePending = true;
    let active = false;
    try { await context.resume(); active = context.state === 'running'; } catch {}
    // A late resume or rejection cannot override a newer mute/enable or disposal.
    if (disposed || operation !== enableRequest) return enabled;
    enablePending = false;
    enabled = active;
    master.gain.setTargetAtTime(enabled ? .55 : 0, context.currentTime, .12);
    return enabled;
  }
  function tone(frequency, end, duration, type = 'sine', volume = .11) {
    if (!enabled || disposed || voices.size >= 12) return;
    const now = context.currentTime, osc = context.createOscillator(), gain = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(master); voices.add(osc);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(now); osc.stop(now + duration + .02);
  }
  // On-demand sample transients use the owned wind buffer, a fixed voice cap,
  // and the same opt-in master/mute lifecycle as the pitched contact cues.
  function texture(cutoff = 320, duration = .12, volume = .05) {
    if (!enabled || disposed || !wind?.buffer || voices.size >= 12) return;
    const now = context.currentTime, source = context.createBufferSource();
    const filter = context.createBiquadFilter(), gain = context.createGain();
    filter.type = 'lowpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    source.buffer = wind.buffer;
    source.connect(filter); filter.connect(gain); gain.connect(master);
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(now, (noiseIndex++ * .067) % Math.max(.1, wind.buffer.duration - duration));
    source.stop(now + duration + .01);
  }
  const cue = name => {
    if (name === 'impact' || name === 'fall-end') { texture(200, .22, .13); tone(130, 38, .32, 'triangle', .2); }
    else if (name === 'melee-hit') { texture(950, .11, .095); tone(220, 55, .17, 'triangle', .16); tone(780, 310, .085, 'square', .035); }
    else if (name === 'shield-block') { tone(690, 235, .25, 'sine', .105); tone(1040, 620, .14, 'triangle', .045); }
    else if (name === 'pickup') { tone(590, 880, .12, 'sine', .065); }
    else if (name === 'warning') { texture(1250, .13, .06); tone(320, 170, .19, 'triangle', .08); }
    else if (name === 'floor-rise' || name === 'upgrade') { tone(330, 660, .3, 'sine', .13); tone(495, 990, .48, 'sine', .07); }
    else if (name === 'enemy-break') { texture(360, .23, .09); tone(190, 48, .19, 'triangle', .13); }
    else if (name === 'projectile-fire') { texture(1800, .09, .10); tone(390, 125, .16, 'sawtooth', .07); }
    else tone(210, 280, .1, 'sine', .06);
  };
  function accept(frame) {
    if (!frame?.snapshot || disposed) return;
    const snapshot = frame.snapshot;
    if (snapshot.runToken !== token) {
      const verifiedRestart = !!token && ['result', 'intermission'].includes(lastLifecycle);
      heard.clear(); last = null; lastFloor = null; lastIntent = ''; lastTargetPlatformId = null; lastLifecycle = 'running'; stride = 0; crownDistance = null; crownTick = -1; crownHeard = ''; guardianWindups.clear(); guardianStates.clear(); hazardStates.clear(); lastSurvivalSnapshot = null; token = snapshot.runToken;
      if (verifiedRestart) tone(205, 365, .21, 'sine', .052);
    }
    for (const voice of frame.audio?.voices || []) if (!heard.has(voice.id)) {
      heard.add(voice.id); cue(voice.cue);
      if (heard.size > 128) heard.delete(heard.values().next().value);
    }
    // One understated, gesture-gated tonal closure on authentic result or
    // intermission. A skipped one-tick result still yields a single bookend;
    // authoritative cue events and mute remain otherwise unchanged.
    const lifecycle = snapshot.lifecycle || 'running';
    if (enabled && lastLifecycle === 'running' && snapshot.result
      && ['result', 'intermission'].includes(lifecycle)) {
      // A real failure settles downward; technical/operator interruptions use
      // subdued non-victory tones. These are optional, sourced, and bounded.
      if (snapshot.result.kind === 'game') {
        texture(180, .25, .08);
        tone(174, 62, .48, 'triangle', .078);
      } else if (snapshot.result.kind === 'technical') {
        tone(350, 215, .42, 'sine', .053);
      } else {
        tone(300, 176, .34, 'sine', .047);
      }
      if (bed) bed.gain.setTargetAtTime(.010, context.currentTime, .25);
      if (windGain) windGain.gain.setTargetAtTime(.006, context.currentTime, .28);
    }
    lastLifecycle = lifecycle;
    const actor = snapshot.player;
    // The real AI rescue detour, opening skinned armor and health transfer
    // now have one opt-in acoustic pressure/release arc; no fake heal sounds.
    const survivalChange = observedSurvivalChange(lastSurvivalSnapshot, snapshot);
    if (survivalChange === 'critical') {
      texture(150, .19, .048);
      tone(145, 97, .31, 'triangle', .06);
    } else if (survivalChange === 'recovered') {
      tone(260, 380, .22, 'sine', .045);
      tone(390, 510, .29, 'sine', .03);
    }
    lastSurvivalSnapshot = snapshot;
    const sameFloor = last && lastFloor === snapshot.floor;
    // A genuine guardian floor can advance on the SAME fixed tick as the
    // decisive hit. There may never be a visible inactive-guardian snapshot.
    // Observe the authoritative floor advance before clearing old actors:
    // only a next-floor transition in this run from a PRESENT, live guardian
    // can announce the gate release; not a restart or guessed death.
    const witnessedGuardianPass = !sameFloor && !!last &&
      Number.isFinite(lastFloor) && snapshot.floor === lastFloor + 1 &&
      snapshot.lifecycle === 'running' &&
      [...guardianStates.values()].some(value => value.active === true);
    if (!sameFloor) { guardianWindups.clear(); guardianStates.clear(); hazardStates.clear(); }
    // Follow the actual guardian's fixed-step telegraph as the visible maul
    // winds up and its source-projected warning lane narrows. At most one
    // low-level preparation and one final cue per real windup; missing optional
    // tick data never invents an impending attack. Audio remains opt-in.
    const liveWindups = new Map();
    if (snapshot.lifecycle === 'running') for (const enemy of snapshot.enemies || []) {
      if (enemy.kind !== 'guardian' || !enemy.active || !enemy.telegraph ||
        !Number.isFinite(enemy.telegraphTicksRemaining)) continue;
      const remaining = Math.max(1, Math.min(8, enemy.telegraphTicksRemaining));
      const previousCharge = guardianWindups.get(enemy.id);
      if (sameFloor && previousCharge === undefined) tone(132, 185, .23, 'triangle', .038);
      else if (sameFloor && previousCharge > 2 && remaining <= 2) {
        tone(170, 310, .16, 'triangle', .047);
        texture(470, .11, .027);
      }
      liveWindups.set(enemy.id, remaining);
    }
    guardianWindups = liveWindups;
    // The bronze seal's physical opening responds to *observed guardian HP*.
    // This cross-modal counterpart plays a restrained material impact only on
    // a genuine same-floor health decrease, while the sourced gate transition
    // earns the more substantial release chord. No prediction or duplicate
    // event from a repeated packet or unrelated floor / expired run.
    const observedGuardians = new Map();
    let witnessedSameFloorDefeat = false;
    for(const enemy of snapshot.enemies || [])if(enemy.kind==='guardian'){
      const earlier = sameFloor ? guardianStates.get(enemy.id) : undefined;
      if(snapshot.lifecycle==='running' && earlier?.active && Number.isFinite(enemy.health)
        && enemy.health < earlier.health) {
        texture(610,.14,.042);
        tone(150,85,.17,'triangle',.042);
        // The three REAL source HP pressure stages now have a restrained
        // opt-in acoustic answer to their physical clutch release. Never
        // announce a stage at first sight, on repair, or on duplicate data.
        if (Number.isFinite(enemy.maxHealth) && enemy.maxHealth > 0 &&
          earlier.maxHealth === enemy.maxHealth) {
          // A distinct opt-in phase transition accompanies actual guardian
          // HP crossing. A held frame, first snapshot, rewind or mere audio
          // enable never creates a fake second-wind cue.
          if(enemy.telegraphTotalTicks===6&&earlier.health*2>enemy.maxHealth &&
             enemy.health*2<=enemy.maxHealth &&
             Number.isSafeInteger(earlier.tick)&&snapshot.tick>earlier.tick &&
             snapshot.tick-earlier.tick<=8)
            tone(175,300,.36,'triangle',.051);
          const beforeStage = Math.floor(3 * (1 - earlier.health / enemy.maxHealth));
          const afterStage = Math.floor(3 * (1 - enemy.health / enemy.maxHealth));
          if (afterStage > beforeStage) {
            texture(390,.19,.048);
            tone(245 + 70 * Math.min(3, afterStage),
              110 + 42 * Math.min(3, afterStage),.28,'triangle',.056);
          }
        }
      }
      // Only an adjacent true charge -> fixed-step stagger transition earns
      // the optional maul-failure sound. A held frame, new run, mute or mere
      // HP loss cannot invent an interrupted guardian attack.
      if(enabled && sameFloor && earlier?.active && earlier.telegraph &&
        !enemy.telegraph && (earlier.stagger??0)===0 &&
        Number.isFinite(enemy.staggerTicksRemaining) &&
        enemy.staggerTicksRemaining>0 &&
        Number.isSafeInteger(earlier.tick) && snapshot.tick>earlier.tick &&
        snapshot.tick-earlier.tick<=8){
        texture(840,.15,.065);
        tone(510,115,.23,'triangle',.072);
      }
      // The physical shield locks only after a REAL source melee/projectile
      // health change. Do not signal a first frame, held packet or restart.
      if(snapshot.lifecycle==='running'&&sameFloor&&earlier?.active&&
         (earlier.guard??0)===0&&Number.isFinite(enemy.guardTicksRemaining)&&
         enemy.guardTicksRemaining>0&&Number.isSafeInteger(earlier.tick)&&
         snapshot.tick>earlier.tick&&snapshot.tick-earlier.tick<=8){
        texture(320,.12,.029);
        tone(145,96,.17,'triangle',.032);
      }
      if(snapshot.lifecycle==='running' && earlier?.active && !enemy.active)
        witnessedSameFloorDefeat = true;
      observedGuardians.set(enemy.id,{active:!!enemy.active,health:enemy.health,maxHealth:enemy.maxHealth,telegraph:enemy.telegraph===true,stagger:Number.isFinite(enemy.staggerTicksRemaining)?enemy.staggerTicksRemaining:0,guard:Number.isFinite(enemy.guardTicksRemaining)?enemy.guardTicksRemaining:0,tick:snapshot.tick});
    }
    if(witnessedGuardianPass){
      // The mechanical release is audible only for a genuine next-floor
      // guardian transition and remains subordinate to muted playback.
      texture(190,.26,.07);
      tone(104,42,.28,'triangle',.055);
    }
    if(witnessedSameFloorDefeat || witnessedGuardianPass){
      texture(550,.20,.065);
      tone(220,330,.22,'triangle',.064);
      tone(330,440,.31,'sine',.053);
      tone(440,660,.44,'sine',.045);
    }
    guardianStates=observedGuardians;
    // A warning requires a witnessed inactive->active hazard transition on
    // this same floor and a nearby living climber. Never infer threat from a
    // first observation, floor switch, stale route or future hazard schedule.
    const observedHazards=new Map();
    let nearbyHazardRaised=false;
    if(snapshot.lifecycle==='running')for(const hazard of snapshot.hazards||[]){
      if(typeof hazard.id!=='string'||!hazard.id)continue;
      const active=hazard.active===true;
      const wasActive=sameFloor?hazardStates.get(hazard.id):undefined;
      if(active && wasActive===false && !nearbyHazardRaised
        && [hazard.x,hazard.y,hazard.width,actor.x,actor.y].every(Number.isFinite)
        && Math.abs(hazard.x+hazard.width*.5-actor.x)
          <=Math.max(48000,hazard.width*1.8)
        && Math.abs(hazard.y-actor.y)<=80000
        && actor.health>0)nearbyHazardRaised=true;
      observedHazards.set(hazard.id,active);
    }
    hazardStates=observedHazards;
    if(nearbyHazardRaised){
      texture(720,.13,.045);
      tone(470,190,.18,'triangle',.058);
    }
    // Cap proximity is a real ascent milestone, unlike a planned landing.
    // A single restrained material tone joins the 3D crown to the climbing
    // soundscape. Do not replay after a retreat, restart, missing source tick,
    // loss, stale feed or unobserved first frame. Muted viewers hear nothing.
    const cap = snapshot.platforms?.find(platform =>
      platform.id === 'f' + snapshot.floor + ':cap' &&
      [platform.y, platform.height].every(Number.isFinite) &&
      platform.height > 0);
    const distanceToCap = cap && Number.isFinite(actor.y) ?
      cap.y + cap.height - actor.y : null;
    if (!sameFloor) { crownDistance = null; crownTick = -1; crownHeard = ''; }
    const capKey = snapshot.runToken + ':' + snapshot.floor;
    if (snapshot.lifecycle === 'running' && actor.health > 0 &&
      crownDistance !== null && distanceToCap !== null &&
      crownDistance > 90000 && distanceToCap <= 90000 &&
      distanceToCap >= -90000 && snapshot.tick > crownTick &&
      snapshot.tick - crownTick <= 8 && crownHeard !== capKey &&
      !snapshot.enemies?.some(enemy => enemy.active && enemy.telegraph)) {
      tone(210, 340, .25, 'triangle', .039);
      crownHeard = capKey;
    }
    crownDistance = distanceToCap;
    crownTick = snapshot.tick;
    const intent = snapshot.intent?.mode || '';
    // Restrained opt-in cue on real defensive transition, deduped by intent.
    // The matching model pose remains visible when muted.
    if(sameFloor && intent!==lastIntent && intent==='bracing-telegraph')
      tone(235,360,.22,'triangle',.039);
    // One opt-in material cue for an actually observed low-health shield
    // counter-spacing decision; first packets and held intent never replay it.
    if(sameFloor && intent!==lastIntent && intent==='bracing-guardian-shield')
      tone(174,128,.19,'triangle',.034);
    if(sameFloor && intent!==lastIntent && ['evading-projectile','evading-hazard','evading-telegraph'].includes(intent))
      tone(440,280,.12,'triangle',.038);
    // One restrained opt-in tone identifies a genuine mid-floor REPLAN
    // between different selected destinations. Not a claimed safe route or
    // landing: the authoritative simulation retains sole control. The first
    // observation after floor change, an old packet, combat or a vanished
    // target must never fabricate a selection sound.
    const routeMode = ['aligning', 'settling-launch', 'jumping', 'air-control', 'settling-landing'].includes(
      intent.replace(/^oracle-/, ''));
    const observedTarget = routeMode && typeof snapshot.intent?.targetPlatformId === 'string'
      ? snapshot.intent.targetPlatformId : null;
    const presentTarget = observedTarget && snapshot.platforms?.some(
      platform => platform.id === observedTarget) ? observedTarget : null;
    if (sameFloor && snapshot.lifecycle === 'running' && presentTarget &&
      lastTargetPlatformId && lastTargetPlatformId !== presentTarget &&
      !actor.attacking && !(snapshot.enemies || []).some(enemy => enemy.active && enemy.telegraph))
      tone(420, 575, .13, 'sine', .029);
    lastTargetPlatformId = presentTarget;
    lastIntent=intent;
    if (last && actor.state === 'airborne' && last.state === 'standing') {
      tone(180, 410, .13, 'sine', .055);
      texture(680, .08, .034);
    }
    if (sameFloor && actor.state === 'standing' && last.state === 'airborne') {
      // Source-observed touchdown, not a clock-driven footstep. A steep genuine
      // descent sounds denser than a soft hop and coincides with the real
      // deck-contact sculpture in the 3D view. No browser choice drives physics.
      const descent = Number.isFinite(last.vy) ? Math.max(0, -last.vy) : 0;
      const weight = Math.min(1, descent / 14000);
      texture(snapshot.theme === 'ruins' ? 370 : 260, .17 + weight * .06, .058 + weight * .055);
      tone(94 - weight * 24, 48, .1 + weight * .055, 'triangle', .052 + weight * .036);
      if (weight > .75) tone(66, 48, .19, 'sine', .034 * weight);
      // Mechanical touchdown is audible only at the TRUE moving deck top,
      // after an airborne-to-standing transition in this same live run.
      // It enriches the existing source-driven gear/piston contact without
      // another HUD message, fake collision or predictive landing cue.
      const movingDeckContact=snapshot.lifecycle==='running' && actor.health>0 &&
        Number.isFinite(actor.x) && Number.isFinite(actor.y) &&
        Number.isFinite(actor.halfWidth) && actor.halfWidth>0 &&
        Number.isFinite(actor.halfHeight) && actor.halfHeight>0 &&
        (snapshot.platforms||[]).some(platform=>platform.kind==='moving' &&
          [platform.x,platform.y,platform.width,platform.height].every(Number.isFinite) &&
          platform.width>0 && platform.height>0 &&
          Math.abs((actor.y-actor.halfHeight)-(platform.y+platform.height))<=2500 &&
          actor.x+actor.halfWidth>=platform.x &&
          actor.x-actor.halfWidth<=platform.x+platform.width);
      if(movingDeckContact){
        texture(490,.11,.025);
        tone(176,89,.16,'triangle',.035);
      }
      stride = 0;
    }
    // Stride is advanced only by actual same-floor authoritative displacement,
    // never wall-clock animation or the teleport to a new floor/checkpoint.
    // Skipped network frames cannot synthesize an uncontrolled footstep storm.
    if (sameFloor && actor.state === 'standing' && last.state === 'standing') {
      const distance = Math.abs(actor.x - last.x);
      if (distance > 800 && distance < 40000) {
        stride += Math.min(distance, 14000);
        if (stride >= 21000) {
          stride %= 21000;
          texture(snapshot.theme === 'ruins' ? 480 : 240, .095, .04);
          tone(75, 48, .075, 'triangle', .025);
        }
      }
    } else if (actor.state !== 'standing') stride = 0;
    if (last && actor.score > last.score) tone(700, 1150, .12, 'sine', .075);
    last = actor;
    lastFloor = snapshot.floor;
    if (enabled && context.currentTime - lastAmbient > 2) {
      lastAmbient = context.currentTime;
      const mood = frame.audio?.musicState || 'ascent';
      const intensity = mood === 'guardian' ? .052 : mood === 'danger' ? .042 : mood === 'result' ? .012 : .025;
      const healthRatio = Number.isFinite(actor?.maxHealth) && actor.maxHealth > 0 &&
        Number.isFinite(actor.health) ? Math.max(0, Math.min(1, actor.health / actor.maxHealth)) : 1;
      const pressure = Math.max(0, Math.min(1, (.55 - healthRatio) / .35));
      bed.gain.setTargetAtTime(intensity * (1 - .25 * pressure), context.currentTime, .65);
      if(windGain)windGain.gain.setTargetAtTime(
        (mood === 'guardian' ? .022 : mood === 'danger' ? .016 : .008) +
        pressure * .006, context.currentTime, .75);
      const pitches = { foundry: 55, ruins: 65.41, storm: 61.74, clockwork: 82.41, void: 49 };
      const root = pitches[snapshot.theme] || 55;
      for (let index = 0; index < pads.length; index++) {
        pads[index].frequency.setTargetAtTime(root * [1, 1.5, 2][index], context.currentTime, .8);
      }
      const filters = { foundry: 200, ruins: 400, storm: 1050, clockwork: 300, void: 140 };
      if(windFilter)windFilter.frequency.setTargetAtTime(filters[snapshot.theme] || 260, context.currentTime, 1);
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; enabled = false; enablePending = false; enableRequest++;
    for (const voice of voices) { try { voice.stop(); voice.disconnect(); } catch {} }
    voices.clear(); heard.clear(); guardianWindups.clear(); guardianStates.clear(); hazardStates.clear(); lastSurvivalSnapshot = null; pads.length = 0; last = null; lastFloor = null; lastIntent = ''; lastTargetPlatformId = null; lastLifecycle = 'running'; stride = 0; crownDistance = null; crownTick = -1; crownHeard = '';
    if (context) context.close().catch(() => {});
  }
  return { setEnabled, accept, dispose, diagnostics: () => ({ soundEnabled: enabled, soundPending: enablePending, voices: voices.size, context: context?.state || 'not-started' }) };
}
