'use strict';
const node = (tag, text, className) => { const e = document.createElement(tag); if (text) e.textContent = text; if (className) e.className = className; return e; };
let last = '';
async function refresh() {
  try {
    const response = await fetch('/escape-room/progress/data', { cache: 'no-store' });
    if (!response.ok) throw new Error('Evidence unavailable');
    const text = await response.text(); if (text === last) return; const data = JSON.parse(text); last = text;
    document.getElementById('verdict').textContent = data.verdict;
    document.getElementById('gap').textContent = data.currentGap;
    document.getElementById('updated').textContent = `Updated ${new Date(data.updated).toLocaleString()}`;
    const rounds = document.getElementById('rounds'); rounds.replaceChildren();
    for (const round of [...data.rounds].reverse()) {
      const article = node('article', '', 'round'); const header = node('header'); header.append(node('span', round.label), node('span', round.verdict, 'verdict')); article.append(header, node('h3', round.title), node('p', round.summary));
      const gallery = node('div', '', 'gallery');
      const captions = { room: 'Room view', furniture: 'Furniture construction', mechanism: 'Mechanism inspection', character: 'The Archivist', result: 'Confirmed escape', mobile: 'Portrait on a phone' };
      for (const file of round.views || ['room', 'mechanism']) {
        if (!Object.hasOwn(captions, file)) continue;
        const caption = `${captions[file]} · actual renderer capture`;
        const figure = node('figure'); figure.dataset.view = file; const link = node('a'); link.href = `/escape-room/progress/captures/${round.id}/${file}.png`; link.target = '_blank'; link.rel = 'noreferrer';
        const image = node('img'); image.src = link.href; image.alt = `${round.title}: ${caption}`; image.loading = 'lazy'; link.append(image); figure.append(link, node('figcaption', caption)); gallery.append(figure);
      }
      article.append(gallery); if (round.gap) article.append(node('p', `Largest remaining gap: ${round.gap}`)); rounds.append(article);
    }
    document.getElementById('checks').replaceChildren(...data.checks.map(check => node('li', check)));
  } catch (error) { if (!last) document.getElementById('verdict').textContent = 'Evidence temporarily unavailable'; }
}
refresh(); setInterval(refresh, 10000);
