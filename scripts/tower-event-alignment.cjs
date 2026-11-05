'use strict';
// Passive, source-authentic event locator shared by frozen baseline and candidate.
// These are timeline search handles, NOT certified video frame times or wins.
function indexTowerCaptureEvents(sourceTicks, browserObservations, options = {}) {
  const ticks = Array.isArray(sourceTicks) ? sourceTicks : [];
  const observations = Array.isArray(browserObservations) ? browserObservations : [];
  const videoAnchor = observations.find(s => Number.isFinite(s?.atMs))?.atMs ?? null;
  const events = [], counts = Object.create(null), lastMotion = new Map();
  let previous = null, valid = 0, malformed = 0, missingTicks = 0, repeated = 0;
  let invalidOrder = 0, distinctRuns = 0;
  const CAP = 400, PER_KIND_CAP = 72;
  const validSample = s => s && Number.isFinite(s.atMs) &&
    Number.isSafeInteger(s.tick) && s.tick >= 0 &&
    Number.isSafeInteger(s.floor) && s.floor >= 0 &&
    typeof s.runToken === 'string' && s.runToken.length > 0 &&
    typeof s.lifecycle === 'string';
  const liveGuardian = s => (Array.isArray(s.guardians) ? s.guardians : [])
    .find(g => g && g.active === true && Number.isFinite(g.health) &&
      g.health > 0);
  const defeatedGuardian = s => (Array.isArray(s.guardians) ? s.guardians : [])
    .find(g => g && g.active === false && Number.isFinite(g.health) &&
      g.health <= 0 && typeof g.id === 'string' && g.id);
  let observedEpisode = 0;
  function record(kind, s, detail = {}) {
    if (events.length >= CAP || (counts[kind] || 0) >= PER_KIND_CAP) return;
    counts[kind] = (counts[kind] || 0) + 1;
    events.push({
      kind, atMs: s.atMs, observedRunToken: s.runToken,
      observedEpisode,
      floor: s.floor, sourceTick: s.tick,
      relativeToFirstBrowserObservationMs: videoAnchor === null
        ? null : Math.round(s.atMs - videoAnchor),
      ...detail,
    });
  }
  // Captures are a search index, not ground-truth video. A second run's
  // identical event names must never be silently aligned with the first.
  function supportedEarnedCap(s) {
    const p=s?.player,c=s?.cap;
    if(s?.lifecycle!=='running'||!p||!c||
      ![p.x,p.y,p.halfWidth,p.halfHeight,p.health,c.x,c.y,c.width,c.height]
        .every(Number.isFinite)||p.health<=0||p.halfWidth<=0||
      p.halfHeight<=0||c.width<=0||c.height<=0||
      c.id!=='f'+s.floor+':cap'||
      !Array.isArray(s.guardians)||!s.guardians.some(g=>g &&
        g.active===false&&g.health<=0&&typeof g.id==='string'&&g.id))return null;
    // Source snapshot does not expose groundedPlatformId. This is an
    // OBSERVED support-envelope check, not proof of authoritative collision.
    const feet=p.y-p.halfHeight,deckTop=c.y+c.height;
    if(Math.abs(feet-deckTop)>3000||
      p.x-p.halfWidth<c.x||p.x+p.halfWidth>c.x+c.width)return null;
    const plane=c.x+Math.floor(c.width*.76);
    return {plane,clearanceX:plane+p.halfWidth+4000,
      distanceToClearance:plane+p.halfWidth+4000-p.x};
  }
  for (const s of ticks) {
    if (!validSample(s)) { malformed++; continue; }
    if (previous && (s.atMs < previous.atMs ||
      (s.runToken === previous.runToken && s.tick < previous.tick))) {
      invalidOrder++; continue;
    }
    if (previous && s.runToken === previous.runToken &&
      s.tick === previous.tick) { repeated++; continue; }
    valid++;
    const sameRun = previous?.runToken === s.runToken;
    if (!previous || !sameRun) distinctRuns++;
    if (previous && !sameRun) {
      observedEpisode++;
      record('source-run-token-change', s, {
        previousFloor: previous.floor,
        interpretation: 'authentic source restart/rollover; visible result and restart NOT proven',
      });
      lastMotion.clear();
    } else if (previous && s.tick > previous.tick + 1) {
      missingTicks += s.tick - previous.tick - 1;
    }
    if (sameRun && s.floor !== previous.floor) {
      record('floor-transition', s, {
        fromFloor: previous.floor, toFloor: s.floor,
        interpretation: 'source floor changed; physically seen gateway crossing NOT proven',
      });
      const nearEarned=s.floor===9&&previous.floor===8
        ?supportedEarnedCap(previous):null;
      if(nearEarned&&nearEarned.distanceToClearance>=0&&
        nearEarned.distanceToClearance<=90000)
        record('guardian-earned-floor-nine-handoff', s, {
          fromFloor:8,toFloor:9,precedingEarnedCapTick:previous.tick,
          precedingObservedClearanceGap:nearEarned.distanceToClearance,
          interpretation:'same-run 8-to-9 authority transition preceded by defeated guardian and cap-supported player NEAR gate; no frame-visible or trailing-edge crossing proof',
        });
    }
    const arrival=s.floor===8?supportedEarnedCap(s):null;
    const wasNear=sameRun&&s.floor===previous?.floor
      ?supportedEarnedCap(previous):null;
    if(arrival&&arrival.distanceToClearance>=0&&
      arrival.distanceToClearance<=90000&&
      (!wasNear||wasNear.distanceToClearance>90000))
      record('source-supported-gate-approach', s, {
        exitPlaneX:arrival.plane,bodyClearanceX:arrival.clearanceX,
        observedClearanceGap:arrival.distanceToClearance,
        interpretation:'dead source guardian + real cap footprint + observed feet on deck near gate; NOT a sampled crossing, rendered doorway or video-verified win',
      });
    const oldGuardian = sameRun && s.floor === previous.floor
      ? liveGuardian(previous) : null;
    const guardian = liveGuardian(s);
    const corpse = defeatedGuardian(s);
    if (guardian && !oldGuardian)
      record('guardian-present', s, { health: guardian.health,
        interpretation: 'living source guardian; not proof of a raster-visible attack' });
    if (guardian && oldGuardian && guardian.health < oldGuardian.health)
      record('guardian-hp-decrease', s, {
        from: oldGuardian.health, to: guardian.health,
        interpretation: 'real observed HP change; source tick may skip a blow',
      });
    if (corpse && (!sameRun || s.floor !== previous.floor ||
      !defeatedGuardian(previous))) {
      record('guardian-source-defeated', s, { guardianId: corpse.id,
        interpretation: 'inactive zero-HP source body; not visual proof of fall or portal crossing' });
    }
    const oldCharges = new Set(sameRun && s.floor === previous.floor &&
      Array.isArray(previous.scheduledHazardCharges)
      ? previous.scheduledHazardCharges.map(h => h?.id).filter(Boolean) : []);
    for (const charge of Array.isArray(s.scheduledHazardCharges)
      ? s.scheduledHazardCharges : []) {
      if (typeof charge?.id === 'string' && charge.id && !oldCharges.has(charge.id))
        record('hazard-charge-begin', s, { hazardId: charge.id,
          interpretation: 'actual source charge, visibility in recorded film NOT proven' });
    }
    if (s.lifecycle !== previous?.lifecycle &&
      ['result', 'intermission'].includes(s.lifecycle) &&
      ['game', 'technical', 'operator'].includes(s.result?.kind)) {
      record('source-result-phase', s, { phase: s.lifecycle,
        resultKind: s.result.kind, reason: s.result.reason ?? null,
        interpretation: 'authentic source result; painted card NOT verified' });
    }
    if (sameRun && s.floor === previous.floor &&
      typeof s.routeTarget === 'string' && s.routeTarget &&
      s.routeTarget !== previous.routeTarget) {
      record('route-selection', s, { selectedPlatformId: s.routeTarget });
    }
    const oldDecks = new Map(sameRun && s.floor === previous.floor &&
      Array.isArray(previous.movingDecks)
      ? previous.movingDecks.filter(p => typeof p?.id === 'string')
        .map(p => [p.id, p]) : []);
    for (const deck of Array.isArray(s.movingDecks) ? s.movingDecks : []) {
      if (typeof deck?.id !== 'string' || !deck.id ||
        !Number.isFinite(deck.x) || !Number.isFinite(deck.y)) continue;
      const old = oldDecks.get(deck.id);
      if (old && (old.x !== deck.x || old.y !== deck.y)) {
        const key = s.runToken + ':' + s.floor + ':' + deck.id;
        const last = lastMotion.get(key);
        if (!last || s.atMs - last >= 1500) {
          lastMotion.set(key, s.atMs);
          record('observed-moving-deck-position-change', s, {
            platformId: deck.id, x: deck.x, y: deck.y,
            interpretation: 'two source-observed deck coordinates; physical touchdown NOT proven',
          });
        }
      }
    }
    previous = s;
  }
  // Renderer/contact telemetry has a different sampling rate and can be
  // stale. Keep it explicitly separate from genuine source transitions.
  const seenContacts = new Set();
  for (const s of observations) {
    const touch = s?.observedPhysicalTouchdown;
    if (!touch || touch.physicalDeckContact !== true ||
      typeof touch.platformId !== 'string' || !touch.platformId ||
      !validSample({ atMs:s.atMs, tick:s.tick, floor:s.floor,
        runToken:s.runToken, lifecycle:s.scene })) continue;
    const key = [s.runToken, s.floor, s.tick, touch.platformId].join(':');
    if (seenContacts.has(key)) continue;
    seenContacts.add(key);
    record('sampled-render-deck-contact', {
      atMs:s.atMs, runToken:s.runToken, floor:s.floor, tick:s.tick,
    }, { platformId:touch.platformId,
      interpretation:'source-adjacent renderer diagnostic; frame visibility and contact physics require independent film review' });
  }
  return {
    schemaVersion: 1, sourceSha: options.sourceSha || null,
    scenario: options.scenario || null, viewport: options.viewport || null,
    seed: options.seed || null, recordingQuality: options.quality || null,
    source: 'read-only 50ms browser witness of immutable public game state; identical baseline/candidate capture observer',
    fixedStepTraceCompleteness: 'NOT GUARANTEED: async browser samples may skip source ticks',
    videoClockCalibration: 'NOT EVALUATED: event offsets are relative to first browser observation, not certified WebM timecodes',
    baselineCandidateEventMatched: false, verdict: 'NOT EVALUATED',
    sourceTicksObserved: valid, malformedSamples: malformed,
    repeatedPublicTickSamples: repeated, outOfOrderSamples: invalidOrder,
    unobservedFixedStepTicks: missingTicks, observedRuns: distinctRuns,
    eventCounts: { ...counts }, events,
    biggestEvidenceLimitation: valid === 0 ? 'No authentic source samples available' :
      'Needs native continuous film inspection, real event pairing, and independent critics; absent event is not evidence it never happened',
  };
}
module.exports = { indexTowerCaptureEvents };
