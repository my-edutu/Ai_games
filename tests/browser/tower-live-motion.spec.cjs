'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { test, expect } = require('@playwright/test');
const { assessTowerMotion } = require('../../scripts/tower-motion-evidence.cjs');
const { summarizeTowerCrossfire } = require('../../scripts/tower-crossfire-evidence.cjs');
const { indexTowerCaptureEvents } = require('../../scripts/tower-event-alignment.cjs');
const { FROZEN, sourceStoryCoverage } = require('../../scripts/tower-event-pairing.cjs');
const { MIN_CAPTURE_MS, captureWindowDecision, nextCaptureObservation } =
  require('../../scripts/tower-capture-window.cjs');
const { createTowerSourceTracePoller } =
  require('../../scripts/tower-source-trace-poller.cjs');
const { calibrateOriginalVideo } = require('../../scripts/tower-video-timebase.cjs');
const { beginTowerNativeCompositorAnchors } =
  require('../../scripts/tower-native-compositor-anchors.cjs');
const { createTowerPublicStateWitness } =
  require('../../scripts/tower-public-state-witness.cjs');
const { startFreshOriginalCaptureHost } =
  require('../../scripts/tower-capture-host-lifecycle.cjs');

// No intercepted snapshots, replay scrubbing, virtual time, time acceleration or
// post-processed poses: this visits the live, seeded 20 Hz expedition host.
// VIDEO TRUTH: the viewport must be configured at CONTEXT CREATION, not changed
// after Playwright allocated its default 800x450 recorder. Prior portrait WebM
// had the real 390x844 game squeezed into a tiny upper-left inset surrounded
// by grey. Native layout video is mandatory for meaningful blind full-motion
// mobile criticism; it is still NOT a supported-device FPS measurement.
const viewports = [
  { name: 'desktop', width: 960, height: 600 },
  { name: 'portrait', width: 390, height: 844 },
];
for (const viewport of viewports) {
  test('normal-speed Tower motion ' + viewport.name, async ({ browser }, testInfo) => {
  test.setTimeout(420000);
  // Playwright forbids a describe-scoped video override because it changes
  // worker isolation. Create a dedicated context per viewport instead, with
  // recorder dimensions declared BEFORE the first page exists. This same
  // source-independent test runs against the frozen baseline and candidate.
  const nativeVideoDir = testInfo.outputPath('native-video');
  fs.mkdirSync(nativeVideoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: nativeVideoDir, size: { width: viewport.width, height: viewport.height } },
  });
  const page = await context.newPage();
  const scenario = process.env.TOWER_MOTION_SCENARIO || 'ascent';
  const dir = path.resolve('artifacts', 'tower-motion', scenario, viewport.name);
  fs.mkdirSync(dir, { recursive: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  expect(page.viewportSize()).toEqual({ width: viewport.width, height: viewport.height });
  // Only the neutral, pinned original-video capture opts in. The frozen
  // baseline ignores this inert flag. It never alters gameplay or render art.
  if (scenario === 'danger' && viewport.width === 390)
    await page.addInitScript(() => { window.__TOWER_MESH_OWNER_AUDIT__ = true; });
  // The Playwright video context and page already exist. Only NOW launch a
  // fresh, unmodified 20Hz source host. Its first source tick is independently
  // witnessed before the first DOM navigation; the original first-RENDERED
  // tick and strict cross-version <=60-tick evidence veto remain unchanged.
  // The process is owned by this individual viewport's film, not another test.
  let lateHost = null, initialHostSource = null;
  try {
    if (process.env.TOWER_CAPTURE_LATE_HOST_START === '1') {
      lateHost = await startFreshOriginalCaptureHost();
      const response = await page.request.get('/tower/state?w='+viewport.width+
        '&h='+viewport.height+'&reducedMotion=0&cleanFeed=0&muted=1',
        { timeout: 5000 });
      if (!response.ok()) throw new Error('Original host failed first source probe: '+response.status());
      initialHostSource = (await response.json()).snapshot;
      if (!Number.isSafeInteger(initialHostSource?.tick) || initialHostSource.tick < 0 ||
          initialHostSource.floor !== Number(process.env.TOWER_LAUNCH_FLOOR||'0'))
        throw new Error('Original fresh host source started on the wrong floor/episode');
    }
    await page.goto('/tower?quality=low&reducedMotion=0&muted=1', { waitUntil: 'domcontentloaded' });
  if (scenario === 'danger' && viewport.width === 390)
    expect(await page.evaluate(() => window.__TOWER_MESH_OWNER_AUDIT__ === true),
      'the genuine portrait mesh-owner witness must be armed before filming').toBe(true);
  // A genuine cold-load browser may first paint the living Floor-8 guardian
  // BEFORE WebGL reports eight completed frames and an environment map.
  // Start passive original CDP sampling at DOM-ready, not after renderer
  // warm-up: late unique compositor anchors previously excluded real
  // baseline desktop HP and floor-8-to-9 events from the WebM clock window.
  // The untouched 20Hz source, Playwright native recorder, FPS, gameplay
  // and frame-matching acceptance thresholds remain exactly unchanged.
  const earlyCompositorCaptureAtMs=Date.now();
  // Real full-viewport screenshots cost 2–5s in software WebGL, so their
  // start/end intervals cannot safely anchor a native WebM frame to wall time.
  // Collect bounded Chrome-composited frame witnesses with browser-issued
  // timestamps instead; match their ORIGINAL pixels to the unedited WebM.
  const compositorAnchors=await beginTowerNativeCompositorAnchors({page,dir,viewport});
  await page.waitForFunction(() => {
    const d = window.__TOWER_RENDER_DIAGNOSTICS__?.();
    return d?.frames >= 8 && d.renderProgress?.state === 'current' && d.lighting?.environmentState !== 'pending';
  }, null, { timeout: 90000 });
  const rendererReadyAtMs=Date.now();

  const observations = [];
  async function sample(index) {
    const observation = await page.evaluate(() => {
      const d = window.__TOWER_RENDER_DIAGNOSTICS__();
      const s = window.__TOWER_PUBLIC_STATE__;
      // The frozen gameplay source exposes the real result for only one 50ms
      // tick, but its genuine intermission still renders the source result card.
      // A missed 50ms sample is not missing actual outcome footage. Witness
      // the real visible DOM using layout, style and topmost hit-testing; the
      // separate unedited WebM remains mandatory for human video inspection.
      const resultCard = document.getElementById('result-card');
      const rect = resultCard?.getBoundingClientRect();
      const style = resultCard ? getComputedStyle(resultCard) : null;
      const middleX = rect ? rect.left + rect.width / 2 : -1;
      const middleY = rect ? rect.top + rect.height / 2 : -1;
      const topmost = rect && middleX >= 0 && middleY >= 0
        ? document.elementFromPoint(middleX, middleY) : null;
      // The ORIGINAL source has .event-stack { pointer-events: none } and
      // a non-interactive, visually painted result-card child. Its computed
      // pointer-events inherit "none", so elementFromPoint() SKIPS the card
      // even while the authentic result is visibly rendered. The old strict
      // hit test gave a false zero for ALL genuine baseline intermissions.
      // For pointer-pass-through overlays verify the real cascade, geometry,
      // visibility and viewport instead; NEVER modify baseline CSS/DOM or
      // make the card interactive solely to manufacture capture evidence.
      const ancestorsVisiblyPainted = (() => {
        for (let element = resultCard; element; element = element.parentElement) {
          const computed = getComputedStyle(element);
          if (element.hidden || computed.display === 'none' ||
            computed.visibility !== 'visible' ||
            Number(computed.opacity) <= 0) return false;
        }
        return !!resultCard;
      })();
      const pointerPassThrough = style?.pointerEvents === 'none';
      const hitTestPass = !!topmost &&
        (topmost === resultCard || resultCard.contains(topmost));
      const resultCardVisible = !!rect && ancestorsVisiblyPainted &&
        rect.width > 80 && rect.height > 45 &&
        rect.left >= 0 && rect.top >= 0 &&
        rect.right <= innerWidth && rect.bottom <= innerHeight &&
        (pointerPassThrough || hitTestPass);
      return { atMs: Date.now(), tick: s?.tick, runToken: s?.runToken, checksum: s?.publicChecksum,
        floor: s?.floor, scene: s?.lifecycle, state: s?.player?.state, dangerPermille: s?.dangerPermille,
        sourceResult: s?.result || null, sourceFloorsCleared: s?.progress?.floorsCleared ?? null,
        observedResultCard: {
          visible: resultCardVisible, runToken: s?.runToken ?? null,
          title: document.getElementById('result-title')?.textContent?.trim() || '',
          height: document.getElementById('result-height')?.textContent?.trim() || '',
          pointerPassThrough, hitTestPass, ancestorsVisiblyPainted,
          note: 'Source-matched painted DOM/card geometry. Native non-interactive result overlay legitimately fails hit-testing; unedited video and full-viewport result stills MUST be visually watched.',
        },
        observedFinale: d?.finale || null, observedTerminalCamera: d?.terminalCamera || null,
        guardianActive: (s?.enemies || []).some(e => e.active && e.kind === 'guardian'),
        guardianHealth: (s?.enemies || []).filter(e => e.kind === 'guardian').map(e => ({ active: e.active, health: e.health, maxHealth: e.maxHealth })),
        observedGate: d.world?.guardianGates || [],
        // Real AI platform intent rendered as depth-tested 3D stones; source
        // snapshot remains the only authority for route/collision decisions.
        observedRouteIntent: d.routeIntent || null,
        observedGuardianCircuit: d.guardianCircuit || null,
        observedAtmosphere: d.atmosphere || null,
        // Source-pinned warning phase: only live fixed-step scheduled hazards
        // can own the camera-visible 3D charging jaws (not fake collisions).
        sourceChargingHazards: (s?.hazards || []).filter(h => !h.active &&
          Number.isSafeInteger(h.chargeTicksRemaining) && h.chargeTicksRemaining >= 1 &&
          h.chargeTicksRemaining <= 12).map(h => ({ id: h.id, kind: h.kind,
            chargeTicksRemaining: h.chargeTicksRemaining })),
        observedHazardPressure: d.hazardPressure || null,
        // In the real generated source, moving platforms occur at floor
        // 1, 4, 7, 10... (p3). The matched supplementary floor-7 video
        // makes the actual autonomous ride and cosmetic carriage inspectable.
        // This is observational metadata, NOT a substitute for live WebM.
        sourceMovingDecks: (s?.platforms || []).filter(p => p.kind === 'moving')
          .map(p => ({ id:p.id, x:p.x, y:p.y, width:p.width, height:p.height })),
        observedMovingSuspension: d.movingDeckSuspension || null,
        // Real source transition plus currently occupied deck material.
        // A brief impact may fall between samples; the FULL video remains
        // necessary and this field is not a LOOKS/FEELS/PLAYS verdict.
        observedPhysicalTouchdown: d.observedTouchdown || null,
        observedMovingCarriage: d?.world ? {
          cranks: d.world.observedMovingDeckCranks ?? null,
          driveStages: d.world.observedMovingDeckDriveStages ?? null,
          lastDriveTick: d.world.observedMovingDeckDriveLastTick ?? null,
          positions: (d.world.platformTransforms || [])
            .filter(p => (s?.platforms || []).some(source =>
              source.kind === 'moving' && source.id === p.id))
            .map(p => ({ id:p.id, x:p.x, y:p.y })),
        } : null,
        // Exact presented-camera world projection at the time of a genuine
        // source HP observation. Unlike a source-only geometry fixture, this
        // records whether the guardian and gate are actually inside the
        // continuous desktop/portrait video camera crop.
        // Candidate-only passive 3D diagnostic: which original decorative mesh
        // actually projected across the current living actor's phone frame.
        // Baseline may lack this field; never compare absent data as a win.
        observedDecorativeOcclusion: Array.isArray(d.world?.decorativeOcclusionEvidence)
          ? d.world.decorativeOcclusionEvidence : [],
        observedCameraRayMeshOwners: Array.isArray(d.cameraRayMeshOwners)
          ? d.cameraRayMeshOwners : [],
        observedCameraRayMeshOwnerAudit: d.cameraRayMeshOwnerAudit || null,
        observedCamera: d.encounterCamera || null,
        observedActor: d.actorCamera || null,
        observedEarnedGatewayFrame: d.earnedGatewayCamera || null,
        // Captured alongside genuine source tick/HP and camera crop; telemetry
        // is not a substitute for watching the unmodified full-motion video.
        observedMotionEcho: d.observedMotionEcho || null,
        observedStageLight: d.observedStageLight || null,
        observedPassage: d.passage?.active ? { runToken: d.passage.runToken, floor: d.passage.floor,
          sourceTick: d.passage.sourceTick, ageSeconds: d.passage.ageSeconds,
           anchorPosition: d.passage.anchorPosition,
           focusPosition: d.passage.focusPosition } : null,
        telegraphedEnemies: (s?.enemies || []).filter(e => e.active && e.telegraph).length,
        attacking: !!s?.player?.attacking, enemyKinds: (s?.enemies || []).filter(e => e.active).map(e => e.kind),
        frames: d.frames, frameMs: d.frameMs, renderResolution: d.resolution || null,
        contextLost: d.contextLost,
        renderErrors: d.renderErrors, renderState: d.renderProgress?.state,
        climberPosition: d.climberPosition, cameraPosition: d.cameraPosition,
        calls: d.calls, triangles: d.triangles, geometries: d.geometries, textures: d.textures,
        canvasHash: null };
    });
    // No synchronous Playwright screenshots while the original WebM is live.
    // Actual 2026-11-09 candidate danger film showed the source's floor-nine
    // transition ~2 seconds before its first visible HUD change. The old
    // canvas/full screenshots cost multiple seconds apiece on software WebGL
    // and can starve browser polling while the independent host keeps ticking.
    // Keep observational DOM/source samples; passive CDP compositor frames
    // above are independently matched against unedited native WebM afterward.
    // This removes a real capture contaminant, not evidence of a game fix.
    observations.push(observation);
  }
  // Neutral, passive evidence observer. The original game and source server
  // remain byte-identical to their frozen SHA. Sample the genuinely displayed
  // result DOM and current public state between expensive 1s screenshots.
  // This does NOT prove that a WebM frame visibly contains the result.
  if (scenario === 'outcome') await page.evaluate(() => {
    const witnessed = [];
    window.__TOWER_CAPTURE_RESULT_WITNESSES__ = witnessed;
    window.__TOWER_CAPTURE_RESULT_WITNESS_TIMER__ = setInterval(() => {
      const s = window.__TOWER_PUBLIC_STATE__;
      if (!s || !['result', 'intermission'].includes(s.lifecycle) ||
          !s.result || typeof s.runToken !== 'string') return;
      const card = document.getElementById('result-card');
      const rect = card?.getBoundingClientRect();
      if (!rect || rect.width <= 80 || rect.height <= 45 ||
          rect.left < 0 || rect.top < 0 ||
          rect.right > innerWidth || rect.bottom > innerHeight) return;
      let painted = true;
      for (let el = card; el; el = el.parentElement) {
        const css = getComputedStyle(el);
        if (el.hidden || css.display === 'none' ||
            css.visibility !== 'visible' || Number(css.opacity) <= 0) {
          painted = false; break;
        }
      }
      if (!painted) return;
      const css = getComputedStyle(card);
      const center = document.elementFromPoint(
        rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (css.pointerEvents !== 'none' &&
          center !== card && !card.contains(center)) return;
      const title = document.getElementById('result-title')?.textContent?.trim() || '';
      const height = document.getElementById('result-height')?.textContent?.trim() || '';
      if (!title || !height) return;
      witnessed.push({ atMs: Date.now(), runToken: s.runToken, scene: s.lifecycle,
        sourceResult: { kind: s.result.kind, reason: s.result.reason },
        observedResultCard: { visible: true, runToken: s.runToken, title, height,
          pointerPassThrough: css.pointerEvents === 'none' } });
      if (witnessed.length > 120) witnessed.shift();
    }, 200);
  });
  // Observe genuine short crossfire at 50ms read-only cadence WHILE
  // continuous native WebM records. No simulated event, clock override,
  // source fixture, or rendered pose is injected into the real game.
  if (scenario === 'danger') await page.evaluate(() => {
    const witnessed = [];
    const aftermath = [];
    window.__TOWER_CAPTURE_CROSSFIRE_WITNESSES__ = witnessed;
    window.__TOWER_CAPTURE_GUARDIAN_RELEASE_WITNESSES__ = aftermath;
    let lastKey = '', lastReleaseKey = '', previousSource = null;
    window.__TOWER_CAPTURE_CROSSFIRE_TIMER__ = setInterval(() => {
      const s = window.__TOWER_PUBLIC_STATE__;
      const d = window.__TOWER_RENDER_DIAGNOSTICS__?.();
      const p = s?.player;
      if (s?.lifecycle !== 'running' || s.stale || !p || p.health <= 0 ||
          !Number.isSafeInteger(s.tick) || !Number.isSafeInteger(s.floor) ||
          typeof s.runToken !== 'string' || !s.runToken ||
          ![p.x,p.y,p.halfWidth,p.halfHeight].every(Number.isFinite) ||
          p.halfWidth <= 0 || p.halfHeight <= 0) return;
      // The prior danger observer returned as soon as the guardian DIED,
      // precisely when its physical collapse and the real unlocked gate
      // should be witnessed. Preserve those unaltered 50ms source events
      // separately from the active-guardian crossfire telemetry.
      const prior=previousSource;
      previousSource={runToken:s.runToken,floor:s.floor,tick:s.tick};
      const passage=d?.passage;
      const defeated=(s.enemies||[]).find(g => g?.kind==='guardian' &&
        g.active===false && Number.isFinite(g.health) && g.health<=0 &&
        typeof g.id==='string' && !!g.id && [g.x,g.y].every(Number.isFinite));
      const advance=prior?.runToken===s.runToken && s.floor===prior.floor+1 &&
        s.tick>prior.tick;
      const releaseKey=s.runToken+':'+s.floor+':'+s.tick+':'+
        (defeated?.id || (advance ? 'floor-advance' : 'none'));
      if((defeated||advance) && releaseKey!==lastReleaseKey){
        lastReleaseKey=releaseKey;
        aftermath.push({
          kind: defeated ? 'source-defeated-guardian' : 'real-floor-advance',
          atMs:Date.now(),runToken:s.runToken,floor:s.floor,tick:s.tick,
          sourceGuardianId:defeated?.id||null,
          sourceGuardianHP:defeated?.health??null,
          sourceBody:defeated ? {x:defeated.x,y:defeated.y} : null,
          previousFloor:advance ? prior.floor : null,
          observed3dPassage:passage?.active ? {
            stage:passage.stage,runToken:passage.runToken,
            floor:passage.floor,sourceTick:passage.sourceTick,
            guardianDefeatPieces:passage.guardianDefeatPieces,
            sourceBodyPosition:passage.guardianDefeatSourcePosition,
            guardianDefeatShockwave:passage.guardianDefeatShockwave??null,
            guardianPowerReelProgress:passage.guardianPowerReelProgress??null,
            powerSegmentCount:passage.guardianPowerSegments??0,
            sourceTickMatches:passage.sourceTick===s.tick
          } : null,
          note:'Unaltered 50ms source event and sampled render diagnostics, NOT proof that a WebM frame visually shows it'
        });
        if(aftermath.length>256)aftermath.shift();
      }
      const guardian = (s.enemies || []).find(g =>
        g?.kind === 'guardian' && g.active === true &&
        Number.isFinite(g.health) && g.health > 0 &&
        [g.x,g.y,g.halfHeight].every(Number.isFinite) &&
        g.halfHeight > 0 && Math.abs(g.x-p.x) <= 135000 &&
        Math.abs(g.y-p.y) <= 65000);
      if (!guardian) return;
      // The old capture only witnessed charge while guardian.telegraph=true.
      // A REAL fired bolt survives AFTER telegraph ends, exactly when the
      // moving crusher + counterplay can happen. Observe it independently,
      // without claiming the nearby guardian fired it (no shooter ID in
      // the immutable public enemy projectile).
      const liveBolt = (s.projectiles || []).find(shot =>
        shot?.owner === 'enemy' && typeof shot.id === 'string' && !!shot.id &&
        [shot.x,shot.y,shot.vx,shot.vy].every(Number.isFinite) &&
        shot.vx !== 0 &&
        Math.abs(shot.y-p.y) <= p.halfHeight+3500 &&
        (p.x-shot.x)*Math.sign(shot.vx) > 0 &&
        (p.x-shot.x)*Math.sign(shot.vx) <= 80000 &&
        Math.abs(shot.y-guardian.y) <= guardian.halfHeight+3500 &&
        (shot.x-guardian.x)*shot.vx >= 0 &&
        Math.abs(shot.x-guardian.x) <= 135000 &&
        Math.abs(p.x-guardian.x) <= 90000 &&
        Math.abs(p.y-guardian.y) <= p.halfHeight+guardian.halfHeight+3500);
      if (guardian.telegraph !== true && !liveBolt) return;
      const near = (s.hazards || []).filter(h =>
        h && [h.x,h.y,h.width,h.height].every(Number.isFinite) &&
        h.width > 0 && h.height > 0 &&
        Math.abs(p.x-h.x-h.width/2) <= p.halfWidth+h.width/2+9000 &&
        Math.abs(p.y-h.y-h.height/2) <= p.halfHeight+h.height/2+12000 &&
        (h.active === true ||
         (Number.isSafeInteger(h.chargeTicksRemaining) &&
          h.chargeTicksRemaining >= 1 && h.chargeTicksRemaining <= 12) ||
         (d?.hazardPressure?.crossfireReleases ?? 0) > 0));
      if (!near.length && !liveBolt) return;
      const key=s.runToken+':'+s.floor+':'+s.tick;
      if(key===lastKey) return;
      lastKey=key;
      witnessed.push({atMs:Date.now(),tick:s.tick,floor:s.floor,
        runToken:s.runToken,guardianId:guardian.id||null,
        sourceGuardianTelegraph:guardian.telegraph === true,
        intentMode:s.intent?.mode||null,
        sourceLiveEnemyBolt:liveBolt ? {
          id:liveBolt.id,x:liveBolt.x,y:liveBolt.y,vx:liveBolt.vx,vy:liveBolt.vy,
          coincidentNotAttributed:true
        } : null,
        // Renderer state may lag 50ms source sampling: only matching ticks
        // can certify 3D submitted stage provenance, never video legibility.
        renderedLiveHostile:d?.guardianShotStage ? {
          sourceTick:d.guardianShotStage.liveHostileSourceTick??null,
          projectileId:d.guardianShotStage.liveHostileBoltId??null,
          coincidentGuardianId:d.guardianShotStage.liveHostileGuardianId??null,
          instancedMarkers:d.guardianShotStage.liveHostileMarkerCount??0
        } : null,
        observedCamera:d?.encounterCamera || null,
        sourceHazards:near.map(h=>({id:h.id,active:h.active === true,
          chargeTicksRemaining:Number.isSafeInteger(h.chargeTicksRemaining)?
            h.chargeTicksRemaining:null})),
        renderedPressure:d?.hazardPressure ? {
          sourceTick:d.hazardPressure.sourceTick??null,
          crossfirePrewarnings:d.hazardPressure.crossfirePrewarnings??0,
          crossfireWarnings:d.hazardPressure.crossfireWarnings??0,
          crossfireReleases:d.hazardPressure.crossfireReleases??0,
          activeHazards:d.hazardPressure.activeHazards??0,
          instances:d.hazardPressure.instances??0} : null});
      if(witnessed.length>256) witnessed.shift();
    },50);
  });
  // Read-only event locator for ALL eight source-pinned recordings, including
  // the immutable baseline host (which has no /tower/capture-trace endpoint).
  // Never alter frozen source, its 20Hz clock, AI decisions or video pixels.
  await page.evaluate(() => {
    const samples = [];
    window.__TOWER_CAPTURE_PUBLIC_TICKS__ = samples;
    window.__TOWER_CAPTURE_PUBLIC_TICK_DROPS__ = 0;
    let lastKey = '';
    window.__TOWER_CAPTURE_PUBLIC_TICK_TIMER__ = setInterval(() => {
      const s = window.__TOWER_PUBLIC_STATE__;
      if (!s || typeof s.runToken !== 'string' || !s.runToken ||
        !Number.isSafeInteger(s.tick) || !Number.isSafeInteger(s.floor) ||
        typeof s.lifecycle !== 'string') return;
      const key = s.runToken + ':' + s.tick + ':' + s.lifecycle;
      if (key === lastKey) return;
      lastKey = key;
      samples.push({
        atMs: Date.now(), tick:s.tick, floor:s.floor,
        runToken:s.runToken, lifecycle:s.lifecycle,
        checksum:typeof s.publicChecksum==='string'?s.publicChecksum:null,
        // Read-only, source-issued geometry. DO NOT infer grounded state or
        // a visible threshold crossing from a single sampled position.
        player:s.player && [s.player.x,s.player.y,s.player.halfWidth,
          s.player.halfHeight,s.player.health].every(Number.isFinite)
          ?{x:s.player.x,y:s.player.y,halfWidth:s.player.halfWidth,
            halfHeight:s.player.halfHeight,health:s.player.health}:null,
        cap:(s.platforms||[]).filter(platform=>
          platform?.id==='f'+s.floor+':cap' &&
          [platform.x,platform.y,platform.width,platform.height]
            .every(Number.isFinite)).slice(0,1)
          .map(platform=>({id:platform.id,x:platform.x,y:platform.y,
            width:platform.width,height:platform.height}))[0]||null,
        result:s.result ? {kind:s.result.kind,reason:s.result.reason}:null,
        routeTarget:typeof s.intent?.targetPlatformId==='string'
          ? s.intent.targetPlatformId:null,
        guardians:(s.enemies||[]).filter(g=>g?.kind==='guardian' &&
          Number.isFinite(g.health)).map(g=>({
          id:typeof g.id==='string'?g.id:null,active:g.active===true,
          health:g.health,maxHealth:Number.isFinite(g.maxHealth)?g.maxHealth:null,
        })),
        scheduledHazardCharges:(s.hazards||[]).filter(h=>
          !h.active && typeof h.id==='string' && h.id &&
          Number.isSafeInteger(h.chargeTicksRemaining) &&
          h.chargeTicksRemaining>=1 && h.chargeTicksRemaining<=12)
          .slice(0,8).map(h=>({id:h.id,kind:h.kind,
            chargeTicksRemaining:h.chargeTicksRemaining})),
        movingDecks:(s.platforms||[]).filter(p=>p?.kind==='moving' &&
          typeof p.id==='string' && Number.isFinite(p.x) &&
          Number.isFinite(p.y)).slice(0,8)
          .map(p=>({id:p.id,x:p.x,y:p.y})),
      });
      if (samples.length > 4400) {
        samples.shift();
        window.__TOWER_CAPTURE_PUBLIC_TICK_DROPS__++;
      }
    }, 50);
  });
  // Keep ONE uninterrupted original-source native WebM. The former
  // 68 x wait(1s) + software-GL diagnostics produced historical 132.8s
  // footage despite a nominal 68s capture. Absolute real-wall deadlines
  // prevent cumulative screenshot overhead; source physics is never changed.
  // Continue beyond 68s only when the matching authentic episode is absent.
  // Even complete source markers do NOT verify film visibility or quality.
  const cadenceMs = ['outcome', 'danger', 'moving'].includes(scenario) ? 1000 : 2000;
  const sourceSha = process.env.TOWER_CAPTURE_SOURCE_SHA ||
    process.env.GITHUB_SHA || null;
  const sourceLabel = sourceSha === FROZEN ? 'baseline' : 'candidate';
  const recordingStartedAt = Date.now();
  let lastSampleIndex = 0, nextSourceProbeMs = MIN_CAPTURE_MS;
  let sourceSequenceObserved = false, liveStoryCoverage = null;
  // Start before the first screenshot/68s minimum. The actual original host
  // discards ticks older than 2200; a slow Chromium frame must not prevent
  // independent polling of the still-running, unmodified 20Hz authority.
  // Frozen baseline has no endpoint: detect 404 once and preserve its original
  // passive public-state evidence instead of injecting a candidate host.
  const sourceTraceObserver=createTowerSourceTracePoller(async()=>{
    const response=await page.request.get('/tower/capture-trace',
      {timeout:5000}).catch(()=>null);
    if(response?.status()===404)return {unsupported:true};
    return response?.ok()?response.json():null;
  },{cadenceMs:5000});
  await sourceTraceObserver.start();
  // Original frozen host lacks the optional fixed-step trace endpoint. Poll
  // its UNMODIFIED public HTTP state independently of Chromium's potentially
  // stalled renderer. Apply the SAME passive observer to candidate footage.
  // A result tick is admitted only if the original host actually returned it.
  const publicSourceWitness=createTowerPublicStateWitness(async()=>{
    const response=await page.request.get(
      '/tower/state?w='+viewport.width+'&h='+viewport.height+
      '&reducedMotion=0&cleanFeed=0&muted=1',{timeout:2500});
    if(!response.ok())throw new Error('original-public-state-'+response.status());
    return (await response.json()).snapshot;
  },{cadenceMs:25});
  await publicSourceWitness.start();
  const observedSourceTicks=(browserTicks)=>{
    const independent=publicSourceWitness.snapshot();
    return independent.length>1?independent:browserTicks;
  };
  // Source collector begins before the first browser diagnostic observation.
  // No screenshots are performed inside the recorded source window.
  await sample(0);
  while (true) {
    const decision = captureWindowDecision(scenario,
      Date.now() - recordingStartedAt, sourceSequenceObserved);
    if (!decision.continueRecording) break;
    const scheduled = nextCaptureObservation(recordingStartedAt,
      Date.now(), cadenceMs, lastSampleIndex);
    const remainingMs = Math.max(0, decision.maximumMs -
      (Date.now() - recordingStartedAt));
    if (scheduled.delayMs > 0 && remainingMs > 0)
      await page.waitForTimeout(Math.min(scheduled.delayMs, remainingMs));
    if (Date.now() - recordingStartedAt >= decision.maximumMs) continue;
    lastSampleIndex = scheduled.index;
    await sample(lastSampleIndex);
    const observedMs = Date.now() - recordingStartedAt;
    if (observedMs < MIN_CAPTURE_MS || observedMs < nextSourceProbeMs) continue;
    const passive = await page.evaluate(() =>
      [...(window.__TOWER_CAPTURE_PUBLIC_TICKS__ || [])]);
    const provisional = indexTowerCaptureEvents(observedSourceTicks(passive), [], {
      publicWitnessMode:publicSourceWitness.snapshot().length>1,
      sourceSha, scenario, viewport, seed:process.env.TOWER_SEED ||
        'tower-stream-reference', quality:'low',
      authoritativeTrace:sourceTraceObserver.snapshot(),
    });
    liveStoryCoverage = sourceStoryCoverage(
      {index:provisional}, scenario, sourceLabel);
    sourceSequenceObserved = liveStoryCoverage.sameEpisodeSourceSequenceObserved;
    nextSourceProbeMs = Date.now() - recordingStartedAt + 5000;
  }
  // A real terminal observation is mandatory. The 68s native recording
  // could finish after the last 60s telemetry sample, giving a false 59.99s
  // integrity failure despite 70s of unedited real footage. Sample actual
  // current browser state once more before closing the capture window;
  // never infer wall time from the video file or synthesize a source tick.
  await sample(lastSampleIndex + 1);
  // Read the genuine current browser's accepted-source and completed
  // WebGL submission phase edges BEFORE stopping the original native film.
  // Frozen baseline has no such module; keep missing evidence NOT EVALUATED.
  // These are passive application timestamps, NOT pixels or GPU completion.
  const sourceToPresentationTrace = await page.evaluate(() => {
    const evidence = window.__TOWER_RENDER_DIAGNOSTICS__?.().renderProgress;
    return {
      status: Array.isArray(evidence?.sourceTransitions) ?
        'BROWSER_AND_RENDERER_RETURN_ONLY' : 'NOT EVALUATED',
      observed: Array.isArray(evidence?.sourceTransitions) ?
        evidence.sourceTransitions : [],
      interpretation: 'Browser-accepted authentic source phase and returned Three.js render call. Never equate renderer return with original WebM frame, gateway contact or GPU presentation.',
    };
  });
  const passiveSourceTicks = await page.evaluate(() => {
    clearInterval(window.__TOWER_CAPTURE_PUBLIC_TICK_TIMER__);
    return {ticks:[...(window.__TOWER_CAPTURE_PUBLIC_TICKS__||[])],
      dropped:window.__TOWER_CAPTURE_PUBLIC_TICK_DROPS__||0};
  });
  const publicWitnessReport=await publicSourceWitness.finish();
  const originalHostPublicTicks=publicSourceWitness.snapshot();
  fs.writeFileSync(path.join(dir,'original-host-public-source-witness.json'),
    JSON.stringify({sourceSha,scenario,viewport,method:'read-only-original-HTTP-state',
      publicWitnessReport,sourceTicks:originalHostPublicTicks,
      fidelity:'Original immutable host snapshots; NO simulation acceleration or manufactured lifecycle events; native WebM pixel verification still required',
      verdict:'NOT EVALUATED'},null,2));
  const outcomeWitness = scenario === 'outcome' ?
    await page.evaluate(() => {
      clearInterval(window.__TOWER_CAPTURE_RESULT_WITNESS_TIMER__);
      return [...(window.__TOWER_CAPTURE_RESULT_WITNESSES__ || [])];
    }) : [];
  const crossfireWitnesses = scenario === 'danger' ? await page.evaluate(() => {
    clearInterval(window.__TOWER_CAPTURE_CROSSFIRE_TIMER__);
    return [...(window.__TOWER_CAPTURE_CROSSFIRE_WITNESSES__ || [])];
  }) : [];
  const crossfireSummary = summarizeTowerCrossfire(crossfireWitnesses);
  const guardianReleaseWitnesses = scenario === 'danger' ?
    await page.evaluate(() => [...(window.__TOWER_CAPTURE_GUARDIAN_RELEASE_WITNESSES__ || [])]) : [];
  if(scenario === 'danger') fs.writeFileSync(
    path.join(dir,'guardian-release-source-witness.json'),
    JSON.stringify({
      sourceSha:process.env.TOWER_CAPTURE_SOURCE_SHA||process.env.GITHUB_SHA||null,
      guardianReleaseWitnesses,
      witnessedSourceDefeatTicks:guardianReleaseWitnesses.filter(w=>
        w.kind==='source-defeated-guardian').length,
      observedSampledPassageTicks:guardianReleaseWitnesses.filter(w=>
        w.observed3dPassage?.sourceTickMatches===true).length,
      witnessedPhysicalFloorAdvance:guardianReleaseWitnesses.some(w=>
        w.kind==='real-floor-advance'),
      verdict:'NOT EVALUATED',
      caveat:'Evidence is read-only original-game source+renderer telemetry. Short authentic events can be missed. Independently inspect original uninterrupted WebM and event-align before/after scenes; no fabricated quality win or source mutation.'
    },null,2));
  if(scenario === 'danger') fs.writeFileSync(
    path.join(dir,'crossfire-source-witness.json'),
    JSON.stringify({ sourceSha:process.env.TOWER_CAPTURE_SOURCE_SHA||
      process.env.GITHUB_SHA||null, crossfireSummary,crossfireWitnesses,
      note:'Read-only source+render telemetry. Not visual quality evidence or a substitute for native WebM.'},null,2));
  // Passive forensic camera index paired by observed source tick and wall time.
  // No watermark, fake actor, HUD, source mutation or altered video frames.
  // Browser samples are NOT calibrated to native WebM presentation timestamps.
  const obstructionSamples=observations.filter(s=>Array.isArray(s.observedDecorativeOcclusion)&&
    s.observedDecorativeOcclusion.length).map(s=>({
      atMs:s.atMs, sourceTick:s.tick, runToken:s.runToken, floor:s.floor,
      decorativeObjects:s.observedDecorativeOcclusion,
    }));
  // A full Three scene ray witness is required when all registered decorative
  // objects report zero projected coverage but original video still has a
  // giant near-side wheel. Report actual ray mesh/material/triangle ownership
  // without claiming that intersection alone proves raster visibility.
  // A rolling scene audit is read by the app and the capture harness.
  // Deduplicate by the ORIGINAL source witness, never by the later read.
  const meshOwnerByTick = new Map();
  for(const observation of observations)for(const witness of observation.observedCameraRayMeshOwners||[]){
    if(!witness || !Number.isSafeInteger(witness.tick) ||
       typeof witness.runToken !== 'string' ||
       !Number.isSafeInteger(witness.floor))continue;
    const key = witness.runToken + ':' + witness.floor + ':' + witness.tick;
    if(!meshOwnerByTick.has(key))meshOwnerByTick.set(key,{
      readAtMs:observation.atMs,sourceTick:witness.tick,
      sourceFloor:witness.floor,...witness,
    });
  }
  const meshOwnerSamples=[...meshOwnerByTick.values()];
  const foregroundCandidates=obstructionSamples.flatMap(s=>s.decorativeObjects
    .filter(o=>o.inFrontOfActor&&o.screenCoverage>=.12)
    .map(o=>({atMs:s.atMs,sourceTick:s.sourceTick,runToken:s.runToken,
      floor:s.floor,name:o.name,kind:o.kind,coverage:o.screenCoverage,
      rayContactCount:o.rayContactCount,intendedAlpha:o.intendedAlpha,
      renderedAlpha:o.renderedAlpha,nearPlaneCrossing:o.nearPlaneCrossing})))
    .sort((a,b)=>b.coverage-a.coverage).slice(0,64);
  fs.writeFileSync(path.join(dir,'camera-occlusion-forensics.json'),
    JSON.stringify({sourceSha:process.env.TOWER_CAPTURE_SOURCE_SHA||process.env.GITHUB_SHA||null,
      scenario,viewport:viewport.name,captureObserver:'read-only-current-scene-camera',
      originalGameplayVideoUnmodified:true,videoClockCalibration:'NOT EVALUATED',
      originalSourceFrameObservations:obstructionSamples.length,
      sourceTickLinkedSamples:obstructionSamples,
      cameraRayMeshOwnerSamples:meshOwnerSamples,
      meshOwnerAuditStatus:observations.filter(s=>s.observedCameraRayMeshOwnerAudit)
        .map(s=>({atMs:s.atMs,...s.observedCameraRayMeshOwnerAudit})),
      cameraRayOwnershipLimitations:'Only opt-in candidate portrait danger; actual camera triangle hits with stable material, face and source tick, NOT native WebM raster pixel proof',
      largestProjectedForegroundCandidates:foregroundCandidates,
      verdict:'NOT EVALUATED',
      caveat:'Source/render camera footprint evidence only. A broad AABB is conservative; field names do not prove actual pixels, WebM timecode alignment or a quality preference.'},null,2));
  // Source-independent, nonblocking original compositor evidence. Validate
  // the actual archived JPEG bytes before using a frame as a scoped integrity
  // witness. A distinct hash alone never proves visual gameplay quality.
  const compositorFrameEvidence = compositorAnchors.anchors.flatMap(anchor => {
    if(anchor.witness !== 'unaltered-Chromium-compositor-CDP-frame' ||
       anchor.startAtMs !== anchor.endAtMs ||
       !/^compositor-frame-\d{2}\.jpg$/.test(anchor.file)) return [];
    const file = path.join(dir, anchor.file);
    let bytes;
    try { bytes = fs.readFileSync(file); } catch { return []; }
    if(bytes.length < 128 || bytes.length > 2_000_000 ||
       bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
       bytes[bytes.length-2] !== 0xff || bytes[bytes.length-1] !== 0xd9)
      return [];
    return [{...anchor,sha256:createHash('sha256').update(bytes).digest('hex')}];
  });
  const assessment = assessTowerMotion(observations, {
    minDurationMs: 60000, requireOutcomeRestart: scenario === 'outcome',
    outcomeWitness, compositorFrameEvidence,
  });
  // The shared CI host can now witness every REAL fixed simulation tick,
  // including the frozen baseline's 50ms result. This trace is comparison
  // context and source provenance, NOT proof the image was actually rendered
  // or captured in the unedited normal-speed WebM.
  const trace=await sourceTraceObserver.finish();
  const sourceTicks=sourceTraceObserver.snapshot();
  const traceIntegrity=trace.sourceCollector;
  const hostTraceAvailable=trace.available;
  if(hostTraceAvailable)fs.writeFileSync(path.join(dir,'source-trace.json'),
    JSON.stringify({method:trace?.method||'original-host-fixed-step-public',
      ticks:sourceTicks,collection:traceIntegrity},null,2));
  // Same passive public-state method for BOTH builds: the frozen source host
  // cannot supply the newer candidate-only /tower/capture-trace endpoint.
  // Source event offsets are search handles, NOT calibrated WebM timecodes.
  const eventIndex = indexTowerCaptureEvents(observedSourceTicks(passiveSourceTicks.ticks),
    observations, {
      publicWitnessMode:originalHostPublicTicks.length>1,
      sourceSha:process.env.TOWER_CAPTURE_SOURCE_SHA||process.env.GITHUB_SHA||null,
      scenario, viewport, seed:process.env.TOWER_SEED||'tower-stream-reference',
      quality:'low', authoritativeTrace:sourceTicks,
    });
  eventIndex.passiveSampleDrops = passiveSourceTicks.dropped;
  eventIndex.hostFixedStepTraceAvailable = hostTraceAvailable;
  eventIndex.hostFixedStepTraceIntegrity = traceIntegrity;
  const sourceStory = sourceStoryCoverage(
    {index:eventIndex}, scenario, sourceLabel);
  fs.writeFileSync(path.join(dir,'event-index.json'),
    JSON.stringify(eventIndex,null,2));

  const sourceMovingSamples = observations.filter(o => o.sourceMovingDecks?.length);
  const observedMovingPositions = sourceMovingSamples.flatMap(o =>
    o.sourceMovingDecks.map(platform =>
      String(o.runToken) + ':' + platform.id + ':' + platform.x + ':' + platform.y));
  // Candidate host supplies genuine per-fixed-step coordinates for the
  // moving scenario; the frozen baseline MUST keep its original host and
  // therefore only has equivalent passive public-state observations.
  // Do not use this asymmetric diagnostic as an A/B preference vote.
  const fixedStepMovingTicks = sourceTicks.filter(t => Array.isArray(t.movingDecks) &&
    t.movingDecks.some(deck => typeof deck.id === 'string' &&
      Number.isSafeInteger(deck.x) && Number.isSafeInteger(deck.y)));
  const fixedStepMovingPositions = new Set(fixedStepMovingTicks.flatMap(t =>
    t.movingDecks.map(deck => t.runToken + ':' + deck.id + ':' + deck.x + ':' + deck.y)));
  const sourceMovingSummary = {
    hostFixedStepMovingTraceAvailable: hostTraceAvailable && fixedStepMovingTicks.length > 1,
    hostFixedStepMovingTicks: fixedStepMovingTicks.length,
    hostFixedStepDistinctMovingPositions: fixedStepMovingPositions.size,
    hostTraceParityCaveat: 'Candidate-only optional host diagnostics; baseline original host is unchanged. Both versions keep identical passive public-state observation for event pairing. Neither source positions nor sample counts establish filmed contact or movement feel.',
    sourceFramesWithMovingDeck: sourceMovingSamples.length,
    sourceWitnessedPhysicalContactSamples: observations.filter(o =>
      o.observedPhysicalTouchdown?.physicalDeckContact === true).length,
    sourceWitnessedImpactDeckIds: [...new Set(observations
      .map(o => o.observedPhysicalTouchdown?.platformId).filter(Boolean))],
    sourceWitnessedImpactFragments: observations
      .find(o => o.observedPhysicalTouchdown?.physicalDeckContact)?.observedPhysicalTouchdown?.fragmentInstances || 0,
    real3dSuspensionVisibleSamples: observations.filter(o => o.observedMovingSuspension?.visible).length,
    genuineSourceHazardChargeTicks: sourceTicks.filter(t => t.scheduledHazardCharges?.length > 0).length,
    sourceChargingHazardIds: [...new Set(sourceTicks.flatMap(t =>
      (t.scheduledHazardCharges || []).map(h => h.id)))],
    visible3dHazardPressureSamples: observations.filter(o =>
      o.observedHazardPressure?.extraDraws === 1 &&
      o.observedHazardPressure?.chargingHazards > 0).length,
    hazardPressureInspectionNote: 'Source 50ms charging windows may be missed by 1–2s browser diagnostics. A nonzero source charge/3D instance count is provenance only; inspect the untouched WebM for readable timing and zero gameplay occlusion. No real-device GPU frame-time proof.',
    real3dSuspensionContactSamples: observations.filter(o =>
      Number.isSafeInteger(o.observedMovingSuspension?.authenticContactTick) &&
      o.observedMovingSuspension.authenticContactTick >= 0).length,
    real3dSuspensionPieces: observations.find(o => o.observedMovingSuspension?.visible)?.observedMovingSuspension?.pieces || 0,
    distinctSourcePositions: new Set(observedMovingPositions).size,
    physicallyDrivenSceneSamples: observations.filter(o =>
      (o.observedMovingCarriage?.driveStages ?? 0) > 0 &&
      Number.isSafeInteger(o.observedMovingCarriage?.lastDriveTick) &&
      o.observedMovingCarriage.lastDriveTick >= 0).length,
    note: 'Read-only source/scene samples only. A zero captured chassis or landing-fragment sample is NOT proof that no real touchdown occurred: the authentic 12-tick spring and <650ms physical debris can fall between samples. Evaluate untouched source-pinned WebM at normal speed for real impact, readable motion and deck occlusion; these diagnostics give no supported-device FPS or blind critic score.',
  };
  const sourcePhaseSummary = {
    available: hostTraceAvailable, method: trace?.method || null,
    collection:traceIntegrity,
    polling:{attempts:trace.attempts,acceptedPages:trace.acceptedPages,
      failures:trace.failures,endpointUnavailable:trace.unsupported,
      lastError:trace.lastError},
    resultTicks: sourceTicks.filter(t => t.lifecycle === 'result').length,
    intermissionTicks: sourceTicks.filter(t => t.lifecycle === 'intermission').length,
    sourceRunTransitions: sourceTicks.reduce((count, item, index) =>
      count + (index && sourceTicks[index - 1].runToken !== item.runToken ? 1 : 0), 0),
    sampledVisualResult: observations.some(item => item.scene === 'result'),
    sampledVisualIntermission: observations.some(item => item.scene === 'intermission'),
    genuineDomResultSamples: observations.filter(item =>
      item.observedResultCard?.visible && item.sourceResult &&
      item.observedResultCard.runToken === item.runToken).length,
    nonInteractiveVisibleCards: observations.filter(item =>
      item.observedResultCard?.visible && item.observedResultCard?.pointerPassThrough).length,
    realFullViewportResultStillCount: 0,
    passiveOriginalCompositorFrameCount: compositorFrameEvidence.length,
    independentOriginalHostPublicWitness:publicWitnessReport,
    note: 'Original source result-card is non-interactive; inherited pointer-events:none makes elementFromPoint skip it. Passive real DOM/card witnesses and original CDP compositor JPEGs are archived without blocking WebGL screenshot stalls. Neither proves the result appears in the unmodified WebM; review the entire original film before outcome acceptance.',
  };
  fs.writeFileSync(path.join(dir, 'motion.json'), JSON.stringify({
    method: 'Real unmodified 20Hz host with native original WebM and passive Chrome compositor witnesses; zero blocking WebGL screenshots during filming; not intended-device evidence',
    sourceSha: process.env.TOWER_CAPTURE_SOURCE_SHA || process.env.GITHUB_SHA || null,
    seed: process.env.TOWER_SEED || 'tower-stream-reference',
    scenario, launchFloor: process.env.TOWER_LAUNCH_FLOOR || '0',
    viewport, graphicsTier: 'low', reducedMotion: false, soundEnabled: false,
    videoGeometry: { width: viewport.width, height: viewport.height,
      fixture: 'playwright-context-created-with-native-viewport-and-recording-size' },
    actualWallSeconds: assessment.wallMs / 1000, minimumRequiredSeconds: 60,
    sourceStory,
    captureWindow: {
      ...captureWindowDecision(scenario,
        Date.now() - recordingStartedAt, sourceStory.sameEpisodeSourceSequenceObserved),
      sourceType: sourceLabel,
      windowMethod: 'absolute real-wall deadlines; zero blocking screenshots inside live film; native original WebM and passive compositor witness',
      provisionalStoryAtLastProbe: liveStoryCoverage,
      caveat: 'Real source milestones are NOT timecode-calibrated WebM pixels, playability or independent verdicts.',
    },
    outcomeCapture: scenario === 'outcome' ? {
      maxTicks: 900, noProgressTicks: 850, intermissionTicks: 100,
      note: 'Identical public scenario settings applied through neutral capture server; source game host not modified.',
    } : null,
    sampledActorOffscreen: observations.filter(item => item.observedActor?.inPicture === false).length,
    sampledActorUnsafe: observations.filter(item => item.observedActor?.inSafeFrame === false).length,
    sourceHostStartup: lateHost ? {
      mode: 'fresh-original-source-host-after-native-video-page-allocation',
      firstOriginalHostSourceTick: initialHostSource.tick,
      firstOriginalHostSourceFloor: initialHostSource.floor,
      firstRenderedBrowserSourceTick: observations[0]?.tick??null,
      sourceTicksElapsedBeforeRender: Number.isSafeInteger(observations[0]?.tick)
        ? observations[0].tick-initialHostSource.tick : null,
      sourceHostReadyAtMs: lateHost.readyAtMs,
      sourceHostLaunchedAtMs: lateHost.launchedAtMs,
      sourceHostStartupMs: lateHost.readyAtMs-lateHost.launchedAtMs,
      note:'Real original source: timestamps expose browser/renderer cold-load drift; this does NOT waive the first rendered tick alignment gate or prove a presented film frame.'
    } : {mode:'legacy-playwright-webserver',note:'No initial cold source witness'},
    // First *rendered* source observation, not a WebM frame-zero timestamp.
    // A late floor-10 portrait host must be rejected even when it records 60s.
    // Run tokens cannot be compared across different immutable source SHAs.
    startScene: { floor:observations[0]?.floor??null,
      tick:observations[0]?.tick??null,
      runToken:observations[0]?.runToken??null,
      lifecycle:observations[0]?.scene??null,
      atMs:observations[0]?.atMs??null,
      timing: 'first browser-observed live source frame, NOT calibrated native WebM zero' },
    capturedAt: new Date().toISOString(), observations, assessment,
    sourceToPresentationTrace,
    sourcePhaseSummary, sourceMovingSummary, outcomeWitness,
    eventIndexSummary: {sourceTicksObserved:eventIndex.sourceTicksObserved,
      sourceUnobservedTicks:eventIndex.unobservedFixedStepTicks,
      eventCounts:eventIndex.eventCounts, eventMatched:false,
      eventIndexFile:'event-index.json'},
    crossfireSummary, crossfireWitnesses, guardianReleaseWitnesses, errors,
    independentReview: false,
    gates: { captureIntegrity: assessment.scopedPass ? 'PASS' : 'FAIL',
      completeMotion: 'OPEN: manually review unedited normal-speed video for climbing, guardian danger, true result and restart',
      sustainedDeviceFps: 'OPEN: no real device or presented-frame measurement',
      jusantAstroComparison: 'OPEN: requires fresh independent side-by-side evaluation' },
  }, null, 2));
  const video = page.video();
  await compositorAnchors.stop();
  await page.close();
  await context.close();
  const originalWebMPath = path.join(dir, 'live.webm');
  if (video) await video.saveAs(originalWebMPath);
  // Record native bytes after Playwright flushes them. This links a real
  // screenshot-to-PTS fit to THIS film; it is not proof an event was visible.
  const originalWebMBytes = fs.existsSync(originalWebMPath)
    ? fs.readFileSync(originalWebMPath) : null;
  const originalWebMSha256 = originalWebMBytes
    ? createHash('sha256').update(originalWebMBytes).digest('hex') : null;
  const originalWebMByteCount = originalWebMBytes?.length ?? null;
  // Native PTS is NOT Date.now() - recordingStartedAt: Chromium's recorder
  // starts before the first source observation. Passive CDP timestamps avoid
  // introducing the very software-WebGL screenshot stalls being measured.
  // A separate optional offline tool pixel-matches genuine viewport stills
  // against original WebM frames and rejects missing/ambiguous clock anchors.
  // No extra overlay, video edit, altered source, fake event or accelerated tick.
  const anchors = compositorAnchors.anchors.map(anchor =>
    ({...anchor,file:path.join(dir,anchor.file)}));
  const nativeVideoTimebase = calibrateOriginalVideo({
    video:originalWebMPath, anchors,
    sourceTicks:passiveSourceTicks.ticks,
    // Use the EXACT read-only event-index records also used by the source
    // pairing audit. Never infer guardian or gateway timestamps from a
    // separately invented interpretation of sparse 50ms source samples.
    sourceEvents:eventIndex.events,
  });
  fs.writeFileSync(path.join(dir, 'native-video-clock.json'),
    JSON.stringify({sourceSha,scenario,viewport,seed:process.env.TOWER_SEED ||
      'tower-stream-reference',graphicsTier:'low',
      originalWebMSha256,originalWebMBytes:originalWebMByteCount,
      prewarmOriginalCompositorEvidence:{
        observerStartedBeforeRendererReady:earlyCompositorCaptureAtMs<=rendererReadyAtMs,
        firstCompositorStartAtMs:earlyCompositorCaptureAtMs,
        rendererReadyAtMs,
        realWarmupSpanMs:rendererReadyAtMs-earlyCompositorCaptureAtMs,
        nativeFrameWitnessesBeforeRendererReady:compositorAnchors.anchors.filter(
          anchor=>anchor.startAtMs<rendererReadyAtMs).length,
        sourceClockRetimed:false,videoModified:false,
        status:'PREWARM ORIGINAL CHROMIUM FRAMES — NOT GAMEPLAY ACCEPTANCE'
      },
      passiveCompositorAnchors:{started:compositorAnchors.started,
        recorded:compositorAnchors.anchors.length,
        errors:compositorAnchors.errors.slice(0,8),
        timing:'Original Chrome compositor timestamps; matching against original WebM required',
        qualityVerdict:'NOT EVALUATED'},
      ...nativeVideoTimebase},null,2));
  // Keep the unedited film AND sidecars even when the initial scene is wrong.
  // CI vetoes an unrepresentative episode instead of certifying a complete
  // guardian run merely because the observer eventually found event names.
  const expectedFloor=Number(process.env.TOWER_LAUNCH_FLOOR||'0');
  expect(observations[0]?.floor,
    'first filmed source observation must still be on the requested launch floor')
    .toBe(expectedFloor);
  expect(Number.isSafeInteger(observations[0]?.tick) &&
    observations[0].tick>=0 && observations[0].tick<=250,
    'source host has already advanced beyond 12.5s before browser observation')
    .toBe(true);
  expect(errors, 'real browser and WebGL errors must remain visible').toEqual([]);
  expect(assessment.blockers, 'capture integrity: ' + JSON.stringify(assessment)).toEqual([]);
  expect(assessment.scopedPass).toBe(true);
  expect(sourceStory.sameEpisodeSourceSequenceObserved,
    'wrong or missing authentic source episode; original WebM and source index retained for P0 diagnosis, NOT a quality pass')
    .toBe(true);
  } finally {
    // Never leave a detached independent 20Hz authority running into the
    // next viewport or another source version, even after a browser error.
    if (lateHost) await lateHost.stop();
  }
  });
}
