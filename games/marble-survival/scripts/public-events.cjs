'use strict';

// Deliberate field allowlist: diagnostic detail, provider data, and private IDs
// must never be copied wholesale into public events or replay buffers.
const FIELDS = Object.freeze({
  initialized: ['rosterSize', 'arena'],
  'round-started': ['roundIndex', 'quota', 'arena'],
  'round-live': ['roundIndex'],
  'checkpoint-reached': ['marbleId', 'checkpointIndex'],
  'physics-contact': ['kind', 'marbleId', 'otherMarbleId', 'impulse'],
  'marble-qualified': ['marbleId', 'finishRank'],
  'marble-eliminated': ['marbleId', 'cause'],
  'shield-recovery': ['marbleId'],
  'elimination-boundary-review': ['qualifierIds'],
  'round-resolved': ['roundIndex', 'qualifierIds', 'resolution'],
  'tournament-champion': ['championId', 'tournamentTicks', 'recordCategory'],
  'intermission-started': ['championId'],
  'tournament-restarted': ['runIndex', 'rosterSize'],
  'integrity-quarantined': [],
  'influence-scheduled': ['family', 'option', 'applyTick'],
  'influence-applied': ['family', 'option', 'effectUntilTick'],
  'influence-expired': ['family'],
});
const TOKENS = new Set(['seeding-sprint', 'gate-gauntlet', 'hazard-circuit', 'final-four', 'championship',
  'world', 'obstacle', 'bumper', 'sweeper', 'marble', 'pit', 'kill-zone', 'quota', 'timeout', 'last-standing',
  'standard', 'assisted', 'wind-vote', 'north', 'south', 'east', 'west', 'calm']);

function toPublicEvent(event) {
  if (!Object.hasOwn(FIELDS, event.type)) return null;
  const data = {};
  for (const field of FIELDS[event.type]) {
    const value = event.data?.[field];
    if (Number.isSafeInteger(value) && value >= 0) data[field] = value;
    else if (typeof value === 'string' && TOKENS.has(value)) data[field] = value;
    else if (field === 'qualifierIds' && Array.isArray(value)) data[field] = Object.freeze(value.filter(id => Number.isInteger(id) && id >= 0 && id < 64).slice(0, 64));
  }
  return Object.freeze({ id: String(event.seq), seq: event.seq, tick: event.tick, type: event.type, data: Object.freeze(data) });
}

module.exports = { toPublicEvent };
