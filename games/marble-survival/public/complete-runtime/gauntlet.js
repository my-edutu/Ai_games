'use strict';
(() => {
  const get = (id) => document.getElementById(id);
  const set = (id, value) => { const node = get(id); if (node) node.textContent = String(value); };
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('marble-gauntlet-v1') : null;
  if (channel) channel.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.renderer !== 'webgl2' || !Number.isFinite(data.fps)) return;
    if (Date.now() - data.measuredAt > 5000) return;
    set('metric-fps', data.fps);
    set('metric-draws', data.drawCalls + ' draw calls · ' + data.triangles + ' triangles');
  });
  function item(parent, title, note, status) {
    const article = document.createElement('article'); article.className = 'goal';
    const copy = document.createElement('div'); const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = note; copy.append(strong, small);
    const badge = document.createElement('span'); badge.className = 'badge'; badge.dataset.status = status; badge.textContent = status.replaceAll('-', ' ');
    article.append(copy, badge); parent.append(article);
  }
  async function updatePlan() {
    try {
      const res = await fetch('/gauntlet-progress.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Log HTTP ' + res.status);
      const plan = await res.json();
      if (plan.schema !== 1 || !Array.isArray(plan.goals)) throw new Error('Invalid progress log');
      set('iteration', plan.iteration); set('critic-target', plan.criticTarget);
      set('comparison-status', plan.comparisonStatus);
      const goals = get('goals-list'); goals.replaceChildren();
      for (const goal of plan.goals) item(goals, goal.name, goal.detail, goal.status);
      const history = get('iteration-history'); history.replaceChildren();
      for (const record of plan.history || []) {
        const li = document.createElement('li');
        const h = document.createElement('strong'); h.textContent = record.title;
        const p = document.createElement('div'); p.textContent = record.note;
        const proof = document.createElement('small'); proof.textContent = record.proof;
        li.append(h, p, proof); history.append(li);
      }
    } catch (error) { set('iteration', 'Progress log unavailable'); }
  }
  async function updateLive() {
    try {
      const response = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!response.ok) throw new Error('Server response ' + response.status);
      const snapshot = await response.json();
      if (!snapshot || !snapshot.round || !snapshot.arena) throw new Error('Authority unavailable');
      set('metric-tick', snapshot.tick ?? '—');
      set('metric-round', snapshot.round.number ?? '—');
      set('metric-arena', snapshot.arena.archetype || snapshot.arena.id || 'Arena');
      set('metric-survivors', snapshot.round.remaining ?? '—');
      set('sync-status', '· Authority connected');
    } catch { set('sync-status', '· Open locally with the running Marble server'); }
  }
  updatePlan(); updateLive(); setInterval(updateLive, 2000); setInterval(updatePlan, 15000);
})();