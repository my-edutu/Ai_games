const $ = id => document.getElementById(id);
function text(tag, value, className) { const element = document.createElement(tag); element.textContent = value; if (className) element.className = className; return element; }
let last = '';
async function refresh() {
  try {
    const response = await fetch('/progress/status.json', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (JSON.stringify(data) === last) return;
    last = JSON.stringify(data);
    $('status-title').textContent = data.status;
    $('status-detail').textContent = data.detail;
    $('updated').textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}`;
    if (data.latestImage) $('latest-image').src = data.latestImage;
    $('latest-caption').textContent = data.latestCaption || 'Capture pending';
    $('reviews').replaceChildren(...data.reviews.map(review => {
      const article = document.createElement('article'); article.className = 'review';
      article.append(text('h3', review.area), text('span', review.verdict, 'verdict'), text('p', review.gap)); return article;
    }));
    $('rounds').replaceChildren(...data.rounds.map(round => {
      const item = document.createElement('li'); item.append(text('h3', round.title), text('p', round.summary));
      for (const capture of round.captures || []) { const link = text('a', capture.label); link.href = capture.path; link.target = '_blank'; link.rel = 'noopener'; item.append(link); } return item;
    }));
    $('checks').replaceChildren(...data.checks.map(check => text('li', check)));
  } catch { $('status-detail').textContent = 'The last recorded progress remains available. Reconnecting for updates.'; }
}
refresh();
setInterval(refresh, 10000);
