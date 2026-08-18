'use strict';

(() => {
  const params = new URLSearchParams(window.location.search);
  const cleanFeed = params.get('clean') === '1';
  const reducedMotion = params.get('reduced') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const highContrast = params.get('contrast') === '1' || window.matchMedia('(prefers-contrast: more)').matches;
  document.body.classList.toggle('clean-feed', cleanFeed);
  document.body.classList.toggle('reduced-motion', reducedMotion);
  document.body.classList.toggle('high-contrast', highContrast);

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const canvas = $('arena');
  const context = canvas.getContext('2d', { alpha: false });
  const connection = $('connection');
  const audioToggle = $('audio-toggle');
  let audioContext = null;
  let audioEnabled = false;
  let latestRevision = null;
  let seenEventSequences = new Set();
  let stopped = false;

  const roleColor = { vanguard: '#ff8c68', ranger: '#72d8ff', scavenger: '#f1cf65', tactician: '#a995ff' };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(320, Math.round(rect.width * ratio));
    const height = Math.max(180, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function cellPoint(cell, arena, bounds) {
    const column = cell % arena.width;
    const row = Math.floor(cell / arena.width);
    return {
      x: bounds.x + (column + 0.5) * bounds.cell,
      y: bounds.y + (row + 0.5) * bounds.cell,
    };
  }

  function drawShape(agent, point, size) {
    const color = roleColor[agent.archetype] || '#ffffff';
    context.save();
    context.translate(point.x, point.y);
    context.fillStyle = agent.alive ? color : '#34434c';
    context.strokeStyle = agent.alive ? '#f5fbff' : '#5d6c74';
    context.lineWidth = Math.max(1.2, size * 0.12);
    context.beginPath();
    if (agent.shape === 'triangle') {
      context.moveTo(0, -size);
      context.lineTo(size * 0.9, size * 0.85);
      context.lineTo(-size * 0.9, size * 0.85);
      context.closePath();
    } else if (agent.shape === 'diamond') {
      context.moveTo(0, -size);
      context.lineTo(size, 0);
      context.lineTo(0, size);
      context.lineTo(-size, 0);
      context.closePath();
    } else if (agent.shape === 'square') {
      context.rect(-size * 0.82, -size * 0.82, size * 1.64, size * 1.64);
    } else {
      for (let index = 0; index < 6; index += 1) {
        const angle = Math.PI / 3 * index;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    }
    context.fill();
    context.stroke();
    if (agent.alive) {
      context.fillStyle = 'rgba(0,0,0,.55)';
      context.fillRect(-size, size + 3, size * 2, Math.max(2, size * 0.18));
      context.fillStyle = agent.health / Math.max(1, agent.maxHealth) < 0.3 ? '#ff6d73' : '#62f2ad';
      context.fillRect(-size, size + 3, size * 2 * (agent.health / Math.max(1, agent.maxHealth)), Math.max(2, size * 0.18));
    }
    context.restore();
  }

  function draw(snapshot) {
    resizeCanvas();
    const width = canvas.width;
    const height = canvas.height;
    const gradient = context.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.65);
    gradient.addColorStop(0, snapshot.theme === 'arctic' ? '#17344a' : snapshot.theme === 'neon' ? '#172745' : '#2a1d1b');
    gradient.addColorStop(1, '#04090e');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    const padding = Math.max(20, Math.min(width, height) * 0.055);
    const cell = Math.min((width - padding * 2) / snapshot.arena.width, (height - padding * 2) / snapshot.arena.height);
    const bounds = { cell, x: (width - snapshot.arena.width * cell) / 2, y: (height - snapshot.arena.height * cell) / 2 };
    context.strokeStyle = 'rgba(126,190,215,.08)';
    context.lineWidth = 1;
    for (let x = 0; x <= snapshot.arena.width; x += 2) {
      context.beginPath();
      context.moveTo(bounds.x + x * cell, bounds.y);
      context.lineTo(bounds.x + x * cell, bounds.y + snapshot.arena.height * cell);
      context.stroke();
    }
    for (let y = 0; y <= snapshot.arena.height; y += 2) {
      context.beginPath();
      context.moveTo(bounds.x, bounds.y + y * cell);
      context.lineTo(bounds.x + snapshot.arena.width * cell, bounds.y + y * cell);
      context.stroke();
    }
    context.fillStyle = 'rgba(7, 12, 17, .88)';
    for (const obstacle of snapshot.arena.obstacles) {
      const point = cellPoint(obstacle, snapshot.arena, bounds);
      context.fillRect(point.x - cell * 0.46, point.y - cell * 0.46, cell * 0.92, cell * 0.92);
    }
    context.strokeStyle = 'rgba(127, 226, 255, .42)';
    context.lineWidth = Math.max(1, cell * 0.12);
    for (const cover of snapshot.arena.cover) {
      const point = cellPoint(cover, snapshot.arena, bounds);
      context.strokeRect(point.x - cell * 0.34, point.y - cell * 0.34, cell * 0.68, cell * 0.68);
    }
    const center = cellPoint(snapshot.zone.centerCell, snapshot.arena, bounds);
    const radius = snapshot.zone.radius * cell;
    context.save();
    context.translate(center.x, center.y);
    context.rotate(Math.PI / 4);
    context.strokeStyle = snapshot.zone.ticksUntilShrink < 12 ? '#ff6d73' : '#59d8ff';
    context.lineWidth = Math.max(2, cell * 0.16);
    context.shadowColor = context.strokeStyle;
    context.shadowBlur = reducedMotion ? 0 : 16;
    context.strokeRect(-radius, -radius, radius * 2, radius * 2);
    context.restore();
    for (const loot of snapshot.arena.loot) {
      const point = cellPoint(loot.cell, snapshot.arena, bounds);
      context.fillStyle = loot.kind === 'medkit' ? '#62f2ad' : loot.kind === 'shield' ? '#59d8ff' : loot.kind === 'weapon' ? '#ffc866' : '#dce9ef';
      context.beginPath();
      context.arc(point.x, point.y, Math.max(2, cell * 0.17), 0, Math.PI * 2);
      context.fill();
    }
    const agents = [...snapshot.combatants].sort((first, second) => Number(first.alive) - Number(second.alive));
    for (const agent of agents) drawShape(agent, cellPoint(agent.cell, snapshot.arena, bounds), Math.max(3.5, cell * 0.31));
  }

  function percentage(value, maximum) {
    return `${Math.max(0, Math.min(100, maximum > 0 ? value / maximum * 100 : 0))}%`;
  }

  function renderHud(snapshot) {
    $('survivors').textContent = String(snapshot.survivors);
    $('survivor-total').textContent = `of ${snapshot.totalCombatants}`;
    $('zone-phase').textContent = `P${snapshot.zone.phase + 1}`;
    $('zone-timer').textContent = snapshot.zone.ticksUntilShrink > 0 ? `${snapshot.zone.ticksUntilShrink} ticks` : 'contracting';
    $('match-tick').textContent = `T${snapshot.tick}`;
    $('caption').textContent = snapshot.caption;
    const banner = $('scene-banner');
    if (snapshot.scene === 'result' || snapshot.scene === 'intermission') {
      banner.hidden = false;
      banner.textContent = snapshot.result?.winnerName ? `${snapshot.result.winnerName} wins` : snapshot.scene;
    } else {
      banner.hidden = true;
    }
    const focus = snapshot.focus;
    if (focus) {
      $('focus-name').textContent = focus.name;
      $('focus-archetype').textContent = focus.archetype;
      $('focus-intent').textContent = `${focus.intent.replaceAll('-', ' ')} — ${focus.goal}`;
      $('focus-shape').dataset.shape = focus.shape;
      $('focus-health').style.width = percentage(focus.health, focus.maxHealth);
      $('focus-shield').style.width = percentage(focus.shield, focus.maxShield);
      $('focus-health-text').textContent = `${focus.health}/${focus.maxHealth}`;
      $('focus-shield-text').textContent = `${focus.shield}/${focus.maxShield}`;
      $('focus-weapon').textContent = focus.weapon;
      $('focus-elims').textContent = String(focus.eliminations);
      $('focus-confidence').textContent = `${Math.round(focus.confidencePermille / 10)}%`;
    }
    const ranking = $('leaderboard');
    ranking.replaceChildren(...snapshot.leaderboard.map((agent, index) => {
      const item = document.createElement('li');
      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = String(index + 1).padStart(2, '0');
      const name = document.createElement('span');
      name.textContent = agent.name;
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = `${agent.eliminations}E · ${agent.health}HP`;
      item.append(rank, name, meta);
      return item;
    }));
    const feed = $('kill-feed');
    if (snapshot.killFeed.length === 0) {
      const item = document.createElement('li');
      item.className = 'empty';
      item.textContent = 'No eliminations yet.';
      feed.replaceChildren(item);
    } else {
      feed.replaceChildren(...snapshot.killFeed.map((event) => {
        const item = document.createElement('li');
        item.textContent = event.caption;
        return item;
      }));
    }
    const votePanel = $('vote-panel');
    votePanel.hidden = !snapshot.vote;
    if (snapshot.vote) {
      $('vote-timer').textContent = `${snapshot.vote.ticksRemaining} ticks`;
      $('vote-status').textContent = `${snapshot.vote.ballotCount} verified ballots · ${snapshot.vote.status}`;
      $('vote-options').replaceChildren(...snapshot.vote.options.map((option) => {
        const label = document.createElement('span');
        label.textContent = option.replaceAll('-', ' ');
        return label;
      }));
    }
  }

  function playEvents(snapshot) {
    const newEvents = snapshot.recentEvents.filter((event) => !seenEventSequences.has(event.sequence));
    for (const event of snapshot.recentEvents) seenEventSequences.add(event.sequence);
    if (seenEventSequences.size > 128) {
      seenEventSequences = new Set([...seenEventSequences].sort((a, b) => b - a).slice(0, 128));
    }
    if (!audioEnabled || !audioContext || newEvents.length === 0) return;
    const selected = [...newEvents].sort((first, second) => second.importance - first.importance || second.sequence - first.sequence).slice(0, 2);
    selected.forEach((event, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = event.importance >= 5 ? 'triangle' : event.importance >= 3 ? 'square' : 'sine';
      oscillator.frequency.value = event.type === 'elimination' ? 220 : event.type === 'match-result' ? 660 : event.type.startsWith('zone') ? 165 : 360;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + index * 0.04);
      gain.gain.exponentialRampToValueAtTime(event.importance >= 5 ? 0.12 : 0.05, audioContext.currentTime + 0.02 + index * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18 + index * 0.04);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * 0.04);
      oscillator.stop(audioContext.currentTime + 0.2 + index * 0.04);
    });
  }

  async function poll() {
    if (stopped) return;
    try {
      const query = new URLSearchParams({
        clean: cleanFeed ? '1' : '0',
        reduced: reducedMotion ? '1' : '0',
        contrast: highContrast ? '1' : '0',
        muted: audioEnabled ? '0' : '1',
      });
      const response = await fetch(`/battle/state?${query}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`state request ${response.status}`);
      const snapshot = await response.json();
      if (snapshot.revision !== latestRevision) {
        draw(snapshot);
        renderHud(snapshot);
        playEvents(snapshot);
        latestRevision = snapshot.revision;
      }
      connection.textContent = 'Live';
      connection.dataset.state = 'live';
      app.dataset.ready = 'true';
      app.setAttribute('aria-busy', 'false');
    } catch (error) {
      connection.textContent = 'Safe scene';
      connection.dataset.state = 'degraded';
      $('caption').textContent = 'Presentation reconnecting. Authoritative simulation remains isolated.';
    } finally {
      window.setTimeout(poll, 250);
    }
  }

  audioToggle.addEventListener('click', async () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();
    audioEnabled = !audioEnabled;
    audioToggle.setAttribute('aria-pressed', String(audioEnabled));
    audioToggle.textContent = audioEnabled ? 'Mute sound' : 'Enable sound';
  });
  window.addEventListener('resize', () => { latestRevision = null; });
  window.addEventListener('pagehide', () => { stopped = true; });
  poll();
})();
