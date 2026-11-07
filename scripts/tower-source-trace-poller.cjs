'use strict';
// Independent 5-second source polling while a real-time Chromium recording
// and expensive WebGL screenshots continue. The original host keeps only its
// most recent 2200 fixed steps (110s); waiting 68s before the first read can
// silently discard the opening of a 180s guardian encounter on a slow worker.
// Reads the original source endpoint; never advances, pauses or edits gameplay.
const {createTowerFixedStepTraceCollector} = require('./tower-fixed-step-trace.cjs');

function createTowerSourceTracePoller(fetchPage, options = {}) {
  if (typeof fetchPage !== 'function') throw new TypeError('fetchPage');
  const cadenceMs = options.cadenceMs ?? 5000;
  if (!Number.isSafeInteger(cadenceMs) || cadenceMs < 250 || cadenceMs > 20000)
    throw new RangeError('cadenceMs');
  const collector = options.collector ?? createTowerFixedStepTraceCollector();
  const schedule = options.schedule ?? setInterval;
  const unschedule = options.unschedule ?? clearInterval;
  let timer = null, inFlight = null, started = false, finished = false;
  let attempts = 0, acceptedPages = 0, failures = 0, unsupported = false;
  let lastMethod = null, lastError = null;
  async function poll() {
    if (finished || unsupported) return;
    // Do not stack overlapping requests when a CI software renderer stalls.
    if (inFlight) return inFlight;
    attempts++;
    const task = (async () => {
      try {
        const page = await fetchPage();
        if (page?.unsupported === true) {
          unsupported = true;
          if (timer !== null) { unschedule(timer); timer = null; }
          return;
        }
        if (!Array.isArray(page?.ticks)) { failures++; return; }
        collector.add(page.ticks);
        acceptedPages++;
        if (typeof page.method === 'string') lastMethod = page.method;
      } catch (error) {
        failures++;
        lastError = error instanceof Error ? error.message : String(error);
      }
    })();
    inFlight = task;
    try { await task; } finally { if (inFlight === task) inFlight = null; }
  }
  async function start() {
    if (started) throw new Error('source trace poller already started');
    started = true;
    // Crucial: collect the actual initial source window, not only after the
    // 68-second minimum video duration or first time-intensive screenshot.
    await poll();
    if (!unsupported) timer = schedule(() => { void poll(); }, cadenceMs);
  }
  async function finish() {
    if (!started) throw new Error('source trace poller not started');
    if (finished) return {method:lastMethod, ...status()};
    if (timer !== null) { unschedule(timer); timer = null; }
    if (inFlight) await inFlight;
    // Final read before closing the original browser context.
    if (!unsupported) await poll();
    finished = true;
    return {method:lastMethod, ...status()};
  }
  function status() {
    return {
      available: acceptedPages > 0,
      unsupported, attempts, acceptedPages, failures, lastError,
      sourceCollector: collector.status(),
      actualVideoQuality: 'NOT EVALUATED',
    };
  }
  return {start,finish,poll,snapshot:()=>collector.snapshot(),status};
}
module.exports = {createTowerSourceTracePoller};
