import { createCampaign, stepCampaign, getRenderSnapshot, serializeCampaign, restoreCampaign, recoverToCheckpoint, TICK_RATE } from '/floors/runtime/games/ai-vs-1000-floors/src/index.js';

let state = null;
let paused = false;
let speed = 1;
let review = false;
let initialized = false;
let lastSavedTick = -1;
let transitionFloor = 0;
let initializationToken = 0;

const send = (type, values = {}) => postMessage({ type, ...values });
const snapshot = () => { if (state) send('snapshot', { snapshot: getRenderSnapshot(state), review }); };
const save = () => {
  if (!state || review || !initialized) return;
  send('save', { serialized: serializeCampaign(state) });
  lastSavedTick = state.tick;
};
const safeSeed = value => typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : 'thousand-dawn-2026';

async function initialize(message, restart = false) {
  const token = ++initializationToken;
  initialized = false;
  paused = false;
  speed = 1;
  review = Number.isInteger(message.reviewFloor) && message.reviewFloor >= 1 && message.reviewFloor <= 1000;
  try {
    state = !restart && typeof message.saved === 'string' && !review ? restoreCampaign(message.saved) : createCampaign(safeSeed(message.seed));
  } catch {
    state = null;
    send('save-rejected', { message: 'This saved expedition could not be verified. Your previous save has been kept. Start a fresh expedition to continue.' });
    return;
  }
  // Review captures still use the real campaign policy. They never create earned progress or overwrite a save.
  if (review && message.reviewFloor > 1) {
    const limit = 1500000;
    while (state.floor < message.reviewFloor && state.status !== 'complete' && state.tick < limit) {
      for (let i = 0; i < 500 && state.floor < message.reviewFloor; i++) stepCampaign(state);
      await new Promise(resolve => setTimeout(resolve, 0));
      if (token !== initializationToken) return;
    }
    if (state.floor !== message.reviewFloor) { send('error', { message: 'The requested review floor could not be reached.' }); return; }
  }
  if (token !== initializationToken) return;
  initialized = true;
  lastSavedTick = state.tick;
  transitionFloor = state.floor;
  send('initialized', { snapshot: getRenderSnapshot(state), paused, speed, review });
  save();
}

self.addEventListener('message', event => {
  const message = event.data;
  if (!message || typeof message.type !== 'string') return;
  if (message.type === 'init') { if (!initialized) initialize(message); return; }
  if (message.type === 'restart') { initialize(message, true); return; }
  if (!initialized || !state) return;
  if (message.type === 'pause' && typeof message.paused === 'boolean') {
    paused = message.paused; send('transport', { paused, speed }); save(); snapshot();
  } else if (message.type === 'speed' && [1, 2, 4].includes(message.speed)) {
    speed = message.speed; send('transport', { paused, speed });
  } else if (message.type === 'checkpoint-recover') {
    recoverToCheckpoint(state); paused = false; send('transport', { paused, speed }); snapshot(); save();
  } else if (message.type === 'save') save();
});

setInterval(() => {
  if (!initialized || !state || paused || state.status === 'complete') return;
  try {
    stepCampaign(state, speed);
    snapshot();
    if (state.tick - lastSavedTick >= TICK_RATE * 2 || state.floor !== transitionFloor || state.status === 'complete') {
      save(); transitionFloor = state.floor;
    }
  } catch {
    paused = true;
    send('transport', { paused, speed });
    send('error', { message: 'The expedition paused because it could not continue safely. Restore your checkpoint or start a new expedition.' });
  }
}, 1000 / TICK_RATE);
