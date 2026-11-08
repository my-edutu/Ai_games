'use strict';
// Observation-only: source frames, browser callback wall time and recorded
// video frames are three different populations. Never merge their FPS figures.
const finite = n => typeof n === 'number' && Number.isFinite(n);
const positive = n => finite(n) && n >= 0;
function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a,b) => a-b);
  return Number(sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))].toFixed(3));
}
function intervalSummary(samples) {
  const clean = samples.filter(positive);
  return { count: clean.length, p50Ms: percentile(clean,.5),
    p95Ms: percentile(clean,.95), p99Ms: percentile(clean,.99),
    worstMs: clean.length ? Math.max(...clean) : null };
}
function summarizeTrial(raw) {
  if (!raw || !Array.isArray(raw.frames) || !Array.isArray(raw.callbacks) ||
      !Array.isArray(raw.snapshots)) throw TypeError('Capture ledger requires frame, callback and snapshot arrays');
  const frames = raw.frames.filter(x => positive(x.atMs) && Number.isSafeInteger(x.frame) && x.frame >= 0);
  const unique = [];
  for (const f of frames) {
    if (unique.length && f.frame <= unique[unique.length-1].frame) continue;
    unique.push(f);
  }
  const gaps = unique.slice(1).map((f,i)=>f.atMs-unique[i].atMs).filter(x => positive(x));
  const first = unique[0], last = unique.at(-1);
  // A render submission id may jump: count observed frame events and gaps,
  // not assumed missing frames or artificially interpolated video frames.
  const durationMs = first && last ? last.atMs-first.atMs : 0;
  const callbackMs = raw.callbacks.map(x=>x.durationMs).filter(positive);
  const syncRenderMs = unique.map(x=>x.directRenderMs).filter(x=>finite(x) && x>0);
  const runs = new Set();
  let tickIncreases = 0, restarts = 0;
  let previous = null;
  for (const s of raw.snapshots) {
    if (!Number.isSafeInteger(s.run) || !Number.isSafeInteger(s.tick)) continue;
    runs.add(s.run);
    if (previous) {
      if (s.run > previous.run) restarts += 1;
      else if (s.run === previous.run && s.tick > previous.tick) tickIncreases += s.tick-previous.tick;
    }
    previous = s;
  }
  const lastResource = unique.at(-1) || {};
  return {
    schemaVersion:1, mode:raw.mode || 'unknown',
    source: { observedRenderEvents:unique.length, firstRenderFrame:first?.frame??null,
      lastRenderFrame:last?.frame??null, elapsedMs:Number(durationMs.toFixed(1)),
      observedRenderEventsPerSecond:durationMs>0 ? Number(((unique.length-1)*1000/durationMs).toFixed(3)):null,
      deliveryIntervals:intervalSummary(gaps), callbackWall:intervalSummary(callbackMs),
      synchronousDirectRender:intervalSummary(syncRenderMs),
      drawCalls:lastResource.drawCalls??null, triangles:lastResource.triangles??null,
      softwareWebGL:lastResource.softwareWebGL??null,
      renderPixels:lastResource.renderPixels??null,
      renderSurfaceSetSizeCalls:lastResource.renderSurfaceSetSizeCalls??null,
      renderSurfaceDprChanges:lastResource.renderSurfaceDprChanges??null,
      recordedRequestFrames:raw.recordedRequestFrames??0,
      frameRecordsDropped:raw.frameRecordsDropped??0 },
    authority:{ observedSnapshots:raw.snapshots.length, tickIncreases, restarts, runs:[...runs] },
    capture: raw.capture ?? {status:'NOT_STARTED'},
    warnings: [
      'Render IDs count actual JavaScript submission completions, not GPU-completed frames.',
      'A WebM container or Playwright video nominal FPS cannot establish live source FPS.',
      'Synchronous renderer.render wall time is not a GPU timer query.',
      ...(raw.frameRecordsDropped>0?['Bounded frame ledger dropped observations; frame rate is a lower bound.']:[])
    ]
  };
}
function compareTrials(a,b){
  const sourceA = a?.source?.observedRenderEventsPerSecond;
  const sourceB = b?.source?.observedRenderEventsPerSecond;
  const ratio = positive(sourceA)&&sourceA>0&&positive(sourceB) ? Number((sourceB/sourceA).toFixed(3)) : null;
  const diagnostic = !positive(sourceA) || !positive(sourceB) ? 'INSUFFICIENT_SOURCE_FRAMES'
    : ratio<.8?'RECORDING_REDUCED_SOURCE_DELIVERY'
    : ratio>1.25?'SOURCE_DELIVERY_HIGHER_DURING_RECORDING'
    :'NO_LARGE_SOURCE_DELIVERY_CHANGE_OBSERVED';
  return {unrecordedSourceEventsPerSecond:sourceA??null,
    recordingSourceEventsPerSecond:sourceB??null,
    recordingToUnrecordedSourceRatio:ratio,
    diagnostic,
    caveat:'Paired-seed runs can be affected by system scheduling. This is not a hardware GPU benchmark, visual-quality score, or encoder frame count.'};
}
/** Chrome Performance domain cumulative per-page counters. Durations are CPU
 * task/script/layout wall accounting, never GPU query or encoder CPU time. */
function summarizeBrowserCounters(before,after){
  const map = records => new Map((Array.isArray(records)?records:[])
    .filter(item=>typeof item.name==='string'&&finite(item.value))
    .map(item=>[item.name,item.value]));
  const a=map(before),b=map(after);
  const ms=name => a.has(name)&&b.has(name) ?
    Number((Math.max(0,b.get(name)-a.get(name))*1000).toFixed(3)):null;
  const count=name => a.has(name)&&b.has(name) ? Math.max(0,b.get(name)-a.get(name)):null;
  return {taskDurationMs:ms('TaskDuration'),scriptDurationMs:ms('ScriptDuration'),
    layoutDurationMs:ms('LayoutDuration'),layoutCountDelta:count('LayoutCount'),
    styleRecalcCountDelta:count('RecalcStyleCount'),
    jsHeapBytesStart:a.get('JSHeapUsedSize')??null,jsHeapBytesEnd:b.get('JSHeapUsedSize')??null,
    domNodesStart:a.get('Nodes')??null,domNodesEnd:b.get('Nodes')??null,
    caveat:'Chrome Performance CPU task/script/layout counters, not GPU elapsed, browser-compositor timing, or measured media encoder CPU.'};
}
module.exports={percentile,intervalSummary,summarizeTrial,compareTrials,summarizeBrowserCounters};
