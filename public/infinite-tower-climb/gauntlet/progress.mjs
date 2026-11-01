let revision = '';
let selectedCapture = '';
function showCapture(entry, buttons) {
  selectedCapture = entry.src;
  const picture = document.getElementById('capture');
  picture.src = entry.src;
  picture.alt = entry.description || entry.label || 'Actual Infinite Tower Climb browser capture';
  document.getElementById('capture-label').textContent = entry.description || entry.label;
  document.getElementById('capture-link').href = entry.src;
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.src === entry.src));
}
async function refresh() {
  try {
    const response = await fetch('/tower/gauntlet/progress.json', { cache: 'no-store' });
    if (!response.ok) return;
    const record = await response.json();
    if (record.updated === revision) return;
    revision = record.updated;
    document.getElementById('updated').textContent = `Last updated ${record.updated} · this page refreshes automatically`;
    document.getElementById('verdict').textContent = record.verdict;
    document.getElementById('next-gap').textContent = record.nextGap;
    const captures = record.captures?.length ? record.captures : [{ src: record.capture, label: 'Latest capture', description: record.captureLabel }];
    let selector = document.getElementById('capture-options');
    if (!selector) {
      selector = document.createElement('div'); selector.id = 'capture-options'; selector.className = 'capture-options';
      selector.setAttribute('role', 'group'); selector.setAttribute('aria-label', 'Choose a real game capture');
      document.getElementById('capture-link').before(selector);
    }
    const buttons = captures.map(entry => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = entry.label; button.dataset.src = entry.src;
      button.addEventListener('click', () => showCapture(entry, buttons)); return button;
    });
    selector.replaceChildren(...buttons); selector.hidden = captures.length < 2;
    showCapture(captures.find(entry => entry.src === selectedCapture) || captures[0], buttons);
    const entries = record.iterations.map(entry => {
      const article = document.createElement('article'); article.className = 'iteration';
      const number = document.createElement('span'); number.className = 'iteration-number'; number.textContent = entry.number;
      const copy = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = entry.title;
      const finding = document.createElement('p'); finding.textContent = entry.finding;
      const checks = document.createElement('p'); checks.className = 'checks'; checks.textContent = entry.checks;
      copy.append(title, finding, checks);
      const meta = document.createElement('div'); meta.className = 'iteration-meta';
      const date = document.createElement('small'); date.textContent = entry.date; meta.append(date);
      if (entry.capture) { const link = document.createElement('a'); link.href = entry.capture; link.textContent = 'View evidence ↗'; meta.append(link); }
      article.append(number, copy, meta); return article;
    });
    document.getElementById('iteration-log').replaceChildren(...entries.reverse());
  } catch { document.getElementById('updated').textContent = 'Connection interrupted. Retrying the progress feed.'; }
}
refresh();
const timer = setInterval(refresh, 5000);
addEventListener('pagehide', () => clearInterval(timer), { once: true });
