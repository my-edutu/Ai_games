'use strict';

// The critic never submits screenshots to our server. The filenames and image data
// are not included in recorded verdicts; only the review outcome is retained.
(() => {
  const get = id => document.getElementById(id);
  const inputA = get('ab-candidate');
  const inputB = get('ab-reference');
  const start = get('ab-start');
  const voting = get('ab-voting');
  if (!inputA || !inputB || !start || !voting) return;
  const KEY = 'marble-gauntlet-ab-v1';
  const outcomes = ['candidate', 'reference'];
  let current = null;
  let verdicts = [];
  try {
    const previous = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(previous)) verdicts = previous.slice(-50);
  } catch { /* Private browsing can disable storage; export still works. */ }
  const setStatus = value => { get('ab-status').textContent = value; };
  const refresh = () => {
    start.disabled = !(inputA.files?.length && inputB.files?.length);
  };
  inputA.addEventListener('change', refresh);
  inputB.addEventListener('change', refresh);

  function fileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp)$/.test(file?.type || '')) {
        reject(new Error('Only PNG, JPEG and WebP screenshots are supported.'));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        reject(new Error('Please use screenshots smaller than 12 MB each.'));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), { once: true });
      reader.addEventListener('error', () => reject(new Error('Could not read local screenshot.')), { once: true });
      reader.readAsDataURL(file);
    });
  }

  start.addEventListener('click', async () => {
    if (start.disabled) return;
    start.disabled = true;
    try {
      const [candidate, reference] = await Promise.all([
        fileAsDataUrl(inputA.files[0]),
        fileAsDataUrl(inputB.files[0]),
      ]);
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      const aIsCandidate = random[0] % 2 === 0;
      current = { aIsCandidate, voted: false };
      get('ab-image-a').src = aIsCandidate ? candidate : reference;
      get('ab-image-b').src = aIsCandidate ? reference : candidate;
      get('ab-notes').value = '';
      get('ab-result').textContent = '';
      for (const button of document.querySelectorAll('[data-ab-vote]')) button.disabled = false;
      voting.hidden = false;
      setStatus('Blind comparison ready · choose your verdict');
    } catch (error) {
      setStatus(error.message || 'Could not load screenshots');
    } finally {
      refresh();
    }
  });

  for (const button of document.querySelectorAll('[data-ab-vote]')) {
    button.addEventListener('click', () => {
      if (!current || current.voted) return;
      const choice = button.dataset.abVote;
      if (!['A', 'B', 'tie'].includes(choice)) return;
      current.voted = true;
      const selected = choice === 'tie' ? 'tie' : (choice === 'A') === current.aIsCandidate ? 'candidate' : 'reference';
      const verdict = Object.freeze({
        date: new Date().toISOString(),
        vote: selected,
        biggestGap: get('ab-notes').value.slice(0, 1200),
        qualityBar: 'Marble It Up! Ultra / Marbles on Stream',
        method: 'two real user-provided images; randomized A/B, manual critic vote',
        independentlyVerified: false,
      });
      verdicts.push(verdict);
      verdicts = verdicts.slice(-50);
      try { localStorage.setItem(KEY, JSON.stringify(verdicts)); } catch { /* Export remains available. */ }
      for (const other of document.querySelectorAll('[data-ab-vote]')) other.disabled = true;
      get('ab-result').textContent = choice === 'tie'
        ? 'Tie recorded. No winner claimed.'
        : `Vote recorded. A was ${current.aIsCandidate ? 'our game' : 'the reference'}; B was ${current.aIsCandidate ? 'the reference' : 'our game'}. Preferred: ${selected}.`;
      setStatus('Verdict stored on this device · ' + verdicts.length + ' comparison(s)');
    });
  }

  get('ab-export').addEventListener('click', () => {
    const json = JSON.stringify({ schema: 1, reviews: verdicts }, null, 2);
    const objectUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'marble-gauntlet-blind-reviews.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  });
})();