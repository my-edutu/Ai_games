const POLL_DELAY = 10000;
const TIMEOUT = 6000;
const byId = id => document.getElementById(id);
let stopped = false, timer = 0, controller = null;
function date(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Date not recorded';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
}
function text(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = String(value ?? 'Not recorded');
  if (className) element.className = className;
  return element;
}
function safeUrl(value, localOnly = false) {
  try {
    const url = new URL(value, location.href);
    if (localOnly) return url.origin === location.origin && url.pathname.startsWith('/maze/') ? url.href : null;
    return url.protocol === 'https:' || (url.origin === location.origin && url.protocol === location.protocol) ? url.href : null;
  } catch { return null; }
}
function list(id, values, fallback) {
  const element = byId(id);
  element.replaceChildren(...(Array.isArray(values) && values.length ? values : [fallback]).slice(0, 30).map(value => text('li', typeof value === 'string' ? value : `${value.name || value.check || 'Check'} — ${value.status || 'not yet verified'}${value.detail ? ': ' + value.detail : ''}`)));
}
function render(data) {
  byId('benchmark-status').textContent = data.benchmark?.status || 'Not yet passed';
  byId('benchmark-copy').textContent = data.benchmark?.summary || 'No independent benchmark verdict has been recorded.';
  byId('updated-at').dateTime = data.updatedAt || '';
  byId('updated-at').textContent = date(data.updatedAt);
  const captures = (Array.isArray(data.captures) ? data.captures : []).slice(0, 12).map(capture => {
    const figure = text('figure', '', 'capture-card'), media = text('div', '', 'capture-image');
    const source = capture.src && safeUrl(capture.src, true);
    if (source) {
      const img = document.createElement('img');
      const versioned = new URL(source); if (capture.capturedAt) versioned.searchParams.set('captured', capture.capturedAt);
      img.src = versioned.href; img.alt = String(capture.alt || capture.title || 'Game capture'); img.loading = 'lazy';
      img.addEventListener('error', () => media.replaceChildren(text('span', '◇'), text('span', 'Capture unavailable')), { once: true });
      media.append(img);
    } else media.append(text('span', '◇'), text('span', 'Awaiting a real capture'));
    const caption = document.createElement('figcaption');
    caption.append(text('h3', capture.title), text('p', capture.note || 'Review pending.'), text('span', capture.capturedAt ? date(capture.capturedAt) : source ? 'Capture date not recorded' : 'Not yet captured', 'capture-meta'));
    figure.append(media, caption); return figure;
  });
  byId('captures').replaceChildren(...captures);
  list('changes', data.changes, 'No completed changes have been recorded.');
  list('gaps', data.nextGaps, 'The next gaps have not yet been reviewed.');
  list('verification', data.verification, 'Verification has not yet been recorded.');
  const reviews = (Array.isArray(data.reviews) && data.reviews.length ? data.reviews : [{ title: 'Independent review pending', status: 'Unreviewed', summary: 'A real comparison of the integrated game has not yet been recorded.' }]).slice(0, 12).map(review => {
    const record = text('article', '', 'review-record');
    record.append(text('p', review.verdict || review.status || 'Unreviewed', 'review-status'), text('h3', review.title || review.reviewer || 'Independent review'), text('p', review.summary || 'No verdict recorded.'));
    if (review.date) { const time = text('time', date(review.date)); time.dateTime = review.date; record.append(time); }
    return record;
  });
  byId('reviews').replaceChildren(...reviews);
  const references = (Array.isArray(data.references) ? data.references : []).slice(0, 12).map(reference => {
    const li = document.createElement('li'), url = safeUrl(reference.url);
    if (url) { const a = text('a', reference.title); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(text('span', '↗')); li.append(a); }
    else li.textContent = String(reference.title || 'Reference unavailable');
    return li;
  });
  byId('references').replaceChildren(...references);
}
async function refresh() {
  if (stopped) return;
  controller = new AbortController();
  const timeout = setTimeout(() => controller?.abort(), TIMEOUT);
  try {
    const response = await fetch('/maze/progress.json', { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('Evidence unavailable');
    const data = await response.json();
    if (stopped) return;
    render(data);
    byId('refresh-status').textContent = 'Latest evidence loaded · ' + new Intl.DateTimeFormat('en', { timeStyle: 'short', timeZone: 'UTC' }).format(new Date()) + ' UTC';
    document.querySelector('.refresh-bar').dataset.state = 'ready';
  } catch {
    if (!stopped) {
      byId('refresh-status').textContent = 'Evidence connection paused. Retrying shortly; previous record stays visible.';
      document.querySelector('.refresh-bar').dataset.state = 'error';
    }
  } finally {
    clearTimeout(timeout); controller = null;
    if (!stopped) timer = setTimeout(refresh, POLL_DELAY);
  }
}
window.addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); controller?.abort(); });
window.addEventListener('pageshow', event => { if (event.persisted) { stopped = false; refresh(); } });
refresh();
