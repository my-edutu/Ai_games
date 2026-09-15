(function installMarbleAudioPolicy(globalObject) {
  'use strict';

  const MAX_VOICES = 8;
  const MIN_IMPULSE = 900;
  const CONTACT_KINDS = Object.freeze(['marble', 'bumper', 'sweeper', 'obstacle', 'world']);
  const COOLDOWN_MS = Object.freeze({
    marble: 45,
    bumper: 70,
    sweeper: 100,
    obstacle: 80,
    world: 90,
  });
  const PRIORITY = Object.freeze({
    sweeper: 5,
    bumper: 4,
    obstacle: 3,
    marble: 2,
    world: 1,
  });
  const BASE_FREQUENCY = Object.freeze({
    marble: 330,
    bumper: 235,
    sweeper: 150,
    obstacle: 195,
    world: 175,
  });

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function createState() {
    return { lastSeq: -1, lastByKind: Object.create(null) };
  }

  function normalizedContact(event) {
    if (!event || event.type !== 'physics-contact' || !Number.isInteger(event.seq)) return null;
    const data = event.data || {};
    const kind = CONTACT_KINDS.includes(data.kind) ? data.kind : null;
    const impulse = Number(data.impulse);
    if (!kind || !Number.isFinite(impulse) || impulse <= MIN_IMPULSE) return null;
    return {
      seq: event.seq,
      kind,
      impulse,
      marbleId: Number.isInteger(data.marbleId) ? data.marbleId : null,
    };
  }

  function cueFromContact(contact) {
    const energy = clamp((contact.impulse - MIN_IMPULSE) / 10_000, 0, 1);
    return Object.freeze({
      seq: contact.seq,
      kind: contact.kind,
      impulse: contact.impulse,
      marbleId: contact.marbleId,
      priority: PRIORITY[contact.kind],
      frequency: Math.round(BASE_FREQUENCY[contact.kind] * (0.94 + energy * 0.18)),
      gain: 0.009 + energy * 0.024,
      duration: 0.045 + energy * 0.07,
    });
  }

  function selectCues(events, state, nowMs) {
    if (!Array.isArray(events) || !state || !Number.isFinite(nowMs)) return [];
    const ordered = events
      .filter((event) => Number.isInteger(event?.seq) && event.seq > state.lastSeq)
      .slice()
      .sort((left, right) => left.seq - right.seq);
    const candidates = [];
    let maximumSeq = state.lastSeq;

    for (const event of ordered) {
      maximumSeq = Math.max(maximumSeq, event.seq);
      const contact = normalizedContact(event);
      if (!contact) continue;
      const lastAt = Number(state.lastByKind[contact.kind] ?? Number.NEGATIVE_INFINITY);
      if (nowMs - lastAt < COOLDOWN_MS[contact.kind]) continue;
      state.lastByKind[contact.kind] = nowMs;
      candidates.push(cueFromContact(contact));
    }

    state.lastSeq = maximumSeq;
    return candidates
      .sort((left, right) => right.priority - left.priority || right.impulse - left.impulse || left.seq - right.seq)
      .slice(0, MAX_VOICES);
  }

  globalObject.MarbleAudioPolicy = Object.freeze({
    MAX_VOICES,
    MIN_IMPULSE,
    CONTACT_KINDS,
    COOLDOWN_MS,
    createState,
    selectCues,
  });
})(globalThis);
