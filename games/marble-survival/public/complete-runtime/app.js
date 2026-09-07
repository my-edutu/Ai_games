'use strict';

const shell = document.querySelector('.broadcast-shell');
const canvas = document.querySelector('#arena-canvas');
const context = canvas.getContext('2d', { alpha: false });
const connection = document.querySelector('#connection');
const roundName = document.querySelector('#round-name');
const roundIndex = document.querySelector('#round-index');
const progressFill = document.querySelector('#progress-fill');
const tickValue = document.querySelector('#tick-value');
const survivorValue = document.querySelector('#survivor-value');
const cameraValue = document.querySelector('#camera-value');
const feedValue = document.querySelector('#feed-value');
const leaderboard = document.querySelector('#leaderboard');
const eventList = document.querySelector('#event-list');
const championCard = document.querySelector('#champion-card');
const championName = document.querySelector('#champion-name');
const checksum = document.querySelector('#checksum');
const voteStatus = document.querySelector('#vote-status');
const soundToggle = document.querySelector('#sound-toggle');
const voteButtons = [...document.querySelectorAll('[data-family][data-option]')];

const parameters = new URLSearchParams(location.search);
const cleanFeed = parameters.get('clean') === '1' || parameters.get('feed') === 'clean';
shell.dataset.clean = String(cleanFeed);
feedValue.textContent = cleanFeed ? 'Clean' : 'Live';

const viewerId = sessionStorage.getItem('game7-viewer-id') || (globalThis.crypto?.randomUUID?.() || `viewer-${Date.now()}`);
sessionStorage.setItem('game7-viewer-id', viewerId);

let snapshot = null;
let previousSnapshot = null;
let latestAcceptedTick = -1;
let soundEnabled = false;
let audioContext = null;
let seenEvents = new Set();
let voteLockedUntil = 0;
let lastFrame = performance.now();

function resizeCanvas() {
  const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.round(bounds.width * ratio));
  const height = Math.max(240, Math.round(bounds.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function arenaTransform(arena) {
  const padding = 24;
  const scale = Math.min((canvas.width - padding * 2) / arena.width, (canvas.height - padding * 2) / arena.height);
  return {
    scale,
    left: (canvas.width - arena.width * scale) / 2,
    top: (canvas.height - arena.height * scale) / 2,
  };
}

function point(x, y, transform) {
  return { x: transform.left + x * transform.scale, y: transform.top + y * transform.scale };
}

function drawBackground(arena, transform) {
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#101a3b');
  gradient.addColorStop(.48, '#081126');
  gradient.addColorStop(1, '#10132e');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(transform.left, transform.top);
  context.scale(transform.scale, transform.scale);
  context.strokeStyle = 'rgba(145, 164, 255, .12)';
  context.lineWidth = 1 / transform.scale;
  for (let x = 0; x <= arena.width; x += 60) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, arena.height);
    context.stroke();
  }
  for (let y = 0; y <= arena.height; y += 60) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(arena.width, y);
    context.stroke();
  }
  context.fillStyle = 'rgba(112, 241, 210, .15)';
  context.fillRect(0, arena.finishY - 7, arena.width, 14);
  context.strokeStyle = 'rgba(112, 241, 210, .82)';
  context.setLineDash([20, 12]);
  context.lineWidth = 3 / transform.scale;
  context.beginPath();
  context.moveTo(0, arena.finishY);
  context.lineTo(arena.width, arena.finishY);
  context.stroke();
  context.restore();
}

function featureStyle(type) {
  if (type === 'hazard' || type === 'sweeper') return ['#ff6b86', 'rgba(255, 107, 134, .22)'];
  if (type === 'boost') return ['#70f1d2', 'rgba(112, 241, 210, .2)'];
  if (type === 'gate' || type === 'lane-divider') return ['#9a8cff', 'rgba(154, 140, 255, .2)'];
  return ['#ffd166', 'rgba(255, 209, 102, .2)'];
}

function drawFeatures(arena, transform) {
  for (const feature of arena.features) {
    const position = point(feature.x, feature.y, transform);
    const radius = feature.radius * transform.scale;
    const [stroke, fill] = featureStyle(feature.type);
    context.save();
    context.translate(position.x, position.y);
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = Math.max(2, 3 * transform.scale);
    if (feature.type === 'gate' || feature.type === 'lane-divider') {
      context.fillRect(-radius * 1.5, -radius * .25, radius * 3, radius * .5);
      context.strokeRect(-radius * 1.5, -radius * .25, radius * 3, radius * .5);
    } else if (feature.type === 'sweeper') {
      context.rotate((snapshot?.tick || 0) * .025);
      context.fillRect(-radius * 2.4, -radius * .18, radius * 4.8, radius * .36);
      context.strokeRect(-radius * 2.4, -radius * .18, radius * 4.8, radius * .36);
    } else {
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(0, 0, radius * .46, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }
}

function drawPattern(pattern, radius) {
  context.strokeStyle = 'rgba(4, 9, 22, .72)';
  context.fillStyle = 'rgba(4, 9, 22, .68)';
  context.lineWidth = Math.max(1.5, radius * .1);
  if (pattern === 'rings') {
    for (const factor of [.35, .65]) {
      context.beginPath();
      context.arc(0, 0, radius * factor, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (pattern === 'stripes') {
    for (let x = -radius; x <= radius; x += radius * .42) {
      context.beginPath();
      context.moveTo(x - radius, radius);
      context.lineTo(x + radius, -radius);
      context.stroke();
    }
  } else if (pattern === 'dots') {
    for (const [x, y] of [[-.38, -.25], [.35, -.33], [0, .25], [-.45, .45], [.48, .35]]) {
      context.beginPath();
      context.arc(x * radius, y * radius, radius * .09, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    context.beginPath();
    context.moveTo(-radius * .65, -radius * .15);
    context.lineTo(0, radius * .45);
    context.lineTo(radius * .65, -radius * .15);
    context.stroke();
    context.beginPath();
    context.moveTo(-radius * .65, -radius * .5);
    context.lineTo(0, radius * .1);
    context.lineTo(radius * .65, -radius * .5);
    context.stroke();
  }
}

function interpolatedMarbles(now) {
  if (!snapshot) return [];
  if (!previousSnapshot || previousSnapshot.round.id !== snapshot.round.id) return snapshot.marbles;
  const elapsed = Math.min(1, Math.max(0, (now - lastFrame) / 600));
  const previousById = new Map(previousSnapshot.marbles.map((marble) => [marble.id, marble]));
  return snapshot.marbles.map((marble) => {
    const old = previousById.get(marble.id) || marble;
    return { ...marble, x: old.x + (marble.x - old.x) * elapsed, y: old.y + (marble.y - old.y) * elapsed };
  });
}

function drawMarbles(arena, transform, now) {
  const marbles = interpolatedMarbles(now);
  const baseRadius = Math.max(7, Math.min(16, 17 - marbles.length * .15)) * Math.max(.75, transform.scale);
  for (const marble of marbles) {
    const position = point(marble.x, marble.y, transform);
    const radius = baseRadius + (marble.qualified ? 1.5 : 0);
    context.save();
    context.translate(position.x, position.y);
    context.shadowColor = marble.colour;
    context.shadowBlur = marble.qualified ? radius * 1.3 : radius * .55;
    context.fillStyle = marble.colour;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.save();
    context.beginPath();
    context.arc(0, 0, radius - 1, 0, Math.PI * 2);
    context.clip();
    drawPattern(marble.pattern, radius);
    context.restore();
    context.strokeStyle = marble.qualified ? '#ffffff' : 'rgba(255,255,255,.5)';
    context.lineWidth = marble.qualified ? 2.2 : 1;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
}

function draw(now) {
  resizeCanvas();
  if (!snapshot) {
    context.fillStyle = '#080d20';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#a7b0cf';
    context.font = `${Math.max(16, canvas.width / 45)}px system-ui`;
    context.textAlign = 'center';
    context.fillText('Waiting for deterministic authority…', canvas.width / 2, canvas.height / 2);
  } else {
    const transform = arenaTransform(snapshot.arena);
    drawBackground(snapshot.arena, transform);
    drawFeatures(snapshot.arena, transform);
    drawMarbles(snapshot.arena, transform, now);
  }
  requestAnimationFrame(draw);
}

function renderHud(next) {
  roundName.textContent = next.round.name;
  roundIndex.textContent = `${next.round.index} / ${next.round.total}`;
  progressFill.style.width = `${Math.min(100, (next.tick / 180) * 100)}%`;
  tickValue.textContent = String(next.tick);
  survivorValue.textContent = String(next.marbles.length);
  cameraValue.textContent = next.camera.phase.replaceAll('-', ' ');
  checksum.textContent = `Checksum ${next.checksum.slice(0, 12)}`;
  const marbleById = new Map(next.marbles.map((marble) => [marble.id, marble]));
  leaderboard.replaceChildren(...next.leaderboard.map((entry) => {
    const item = document.createElement('li');
    const marble = marbleById.get(entry.id);
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = `#${entry.rank}`;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = marble?.displayName || entry.id;
    const score = document.createElement('span');
    score.className = 'score';
    score.textContent = entry.score.toLocaleString();
    item.append(rank, name, score);
    return item;
  }));
  championCard.hidden = !next.champion;
  championName.textContent = next.champion?.displayName || '';
}

function markConnection(ok, label) {
  connection.textContent = label;
  connection.classList.toggle('connected', ok);
}

async function refreshSnapshot() {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const next = await response.json();
    if (!Number.isFinite(next.tick) || !Array.isArray(next.marbles) || !next.arena) throw new Error('invalid snapshot');
    if (snapshot && next.round.id === snapshot.round.id && next.tick < latestAcceptedTick - 15) return;
    previousSnapshot = snapshot;
    snapshot = next;
    latestAcceptedTick = next.round.id === previousSnapshot?.round.id ? Math.max(latestAcceptedTick, next.tick) : next.tick;
    lastFrame = performance.now();
    renderHud(next);
    markConnection(true, 'Authority live');
  } catch {
    markConnection(false, 'Reconnecting');
  }
}

function eventLabel(event) {
  const labels = {
    'round-start': 'A new elimination round has started.',
    'near-miss': 'The pack survived a near miss.',
    qualification: 'The qualification line has closed.',
    influence: `Audience effect accepted: ${event.option || event.family || 'vote'}.`,
    champion: 'A new champion has been crowned.',
  };
  return labels[event.type] || 'Tournament state updated.';
}

function playCue(type) {
  if (!soundEnabled || !audioContext) return;
  const frequencies = { 'round-start': 330, 'near-miss': 220, qualification: 440, influence: 520, champion: 660 };
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type === 'champion' ? 'triangle' : 'sine';
  oscillator.frequency.value = frequencies[type] || 280;
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.08, audioContext.currentTime + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .22);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .24);
}

async function refreshEvents() {
  try {
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    const events = Array.isArray(payload.events) ? payload.events.slice(-6) : [];
    eventList.replaceChildren(...events.slice().reverse().map((event) => {
      const item = document.createElement('li');
      item.textContent = eventLabel(event);
      return item;
    }));
    for (const event of events) {
      if (!seenEvents.has(event.id)) {
        seenEvents.add(event.id);
        playCue(event.type);
      }
    }
    if (seenEvents.size > 96) seenEvents = new Set(events.map((event) => event.id));
  } catch {
    // The visual snapshot remains authoritative if the optional event feed is delayed.
  }
}

async function submitVote(button) {
  const now = Date.now();
  if (now < voteLockedUntil) return;
  voteButtons.forEach((entry) => { entry.disabled = true; });
  voteStatus.textContent = 'Submitting bounded vote…';
  try {
    const response = await fetch('/api/influence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: globalThis.crypto?.randomUUID?.() || `${viewerId}-${now}`,
        userId: viewerId,
        family: button.dataset.family,
        option: button.dataset.option,
        at: now,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.accepted) throw new Error(result.reason || 'vote rejected');
    voteLockedUntil = now + 15_000;
    voteStatus.textContent = `${button.textContent} accepted. Cooldown active.`;
  } catch (error) {
    voteStatus.textContent = `Vote not accepted: ${error.message}.`;
    voteLockedUntil = now + 2_000;
  }
}

function updateVoteLock() {
  const remaining = voteLockedUntil - Date.now();
  const locked = remaining > 0;
  voteButtons.forEach((button) => { button.disabled = locked; });
  if (locked && !voteStatus.textContent.includes('Submitting')) {
    voteStatus.textContent = `Next vote in ${Math.ceil(remaining / 1000)}s.`;
  } else if (!locked) {
    voteStatus.textContent = 'One bounded vote per cooldown';
  }
}

soundToggle.addEventListener('click', async () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  if (soundEnabled) {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    playCue('round-start');
  }
});

voteButtons.forEach((button) => button.addEventListener('click', () => submitVote(button)));
window.addEventListener('resize', resizeCanvas, { passive: true });

refreshSnapshot();
refreshEvents();
setInterval(refreshSnapshot, 500);
setInterval(refreshEvents, 1500);
setInterval(updateVoteLock, 250);
requestAnimationFrame(draw);
