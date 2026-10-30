const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};
let lastVersion = '';
let loading = false;
async function refresh() {
  if (loading) return;
  loading = true;
  try {
    const response = await fetch('/floors/progress.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Progress unavailable');
    const data = await response.json();
    if (data.updated === lastVersion) return;
    lastVersion = data.updated;
    document.querySelector('#verdict').textContent = data.verdict;
    document.querySelector('#updated').textContent = `Updated ${data.updated}`;
    document.querySelector('#pieces').replaceChildren(...data.pieces.map(piece => {
      const card = node('article', 'piece');
      card.append(node('span', `status ${piece.state === 'Verified' ? 'verified' : ''}`, piece.state), node('h3', '', piece.name), node('p', '', piece.evidence));
      return card;
    }));
    document.querySelector('#iterations').replaceChildren(...data.iterations.slice().reverse().map(iteration => {
      const card = node('article', 'iteration');
      if (iteration.image) { const image = node('img'); image.src = iteration.image; image.alt = iteration.title; image.loading = 'lazy'; card.append(image); }
      const body = node('div', 'iteration-body');
      body.append(node('div', 'meta', iteration.label), node('h3', '', iteration.title), node('p', '', iteration.summary));
      if (iteration.verdict) body.append(node('div', 'review', iteration.verdict));
      card.append(body); return card;
    }));
    document.querySelector('#references').replaceChildren(...data.references.map(reference => {
      const anchor = node('a', 'reference');
      anchor.href = reference.url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      anchor.append(node('strong', '', `${reference.name} ↗`), node('small', '', reference.role)); return anchor;
    }));
    document.querySelector('#gaps').replaceChildren(...data.gaps.map(gap => node('li', '', gap)));
  } catch {
    document.querySelector('#verdict').textContent = 'Live update unavailable — keeping the last verified record';
  } finally { loading = false; }
}
refresh();
setInterval(refresh, 5000);
