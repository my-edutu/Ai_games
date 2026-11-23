// The overview retains full-board context while the main camera follows the character.
export function createOverview(stage, onOverview) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'board-overview'; button.id = 'board-overview';
  button.setAttribute('aria-label', 'Return to the whole garden view');
  const label = document.createElement('span'); label.textContent = 'THE WHOLE GARDEN';
  const canvas = document.createElement('canvas'); canvas.width = 224; canvas.height = 128;
  canvas.setAttribute('aria-hidden', 'true');
  // BEGIN R47 HIDDEN BEFORE PUBLIC FRAME
  // The miniature is only shown after a public frame is available in follow/detail.
  button.hidden = true;
  // END R47 HIDDEN BEFORE PUBLIC FRAME
  button.append(label, canvas); stage.append(button);
  button.addEventListener('click', onOverview);
  const context = canvas.getContext('2d');
  // BEGIN R47 PUBLIC REVISION CACHE
  // Stable visual fields, not just the movement revision, determine a repaint:
  // an active trap or expiring food can change on a non-movement tick.
  // Deliberately exclude hazard phase and tick: the 2D key only draws active.
  function boardSignature(snapshot) {
    return [snapshot.runToken, snapshot.revision, snapshot.width, snapshot.height,
      snapshot.food?.cell ?? '-', snapshot.snake.map(segment => segment.cell).join(','),
      snapshot.obstacles.join(','),
      snapshot.hazards.map(hazard => `${hazard.cell}:${Number(hazard.active)}`).join(','),
      snapshot.portals.map(portal => `${portal.entry}:${portal.exit}`).join(',')].join('|');
  }
  let lastVisualSignature;
  // END R47 PUBLIC REVISION CACHE
  function update(snapshot, visible) {
    // BEGIN R47 UPDATE ON PUBLIC REVISION
    const wasHidden = button.hidden;
    if (button.hidden !== !visible) button.hidden = !visible;
    if (!visible || !snapshot || !context) return;
    const signature = boardSignature(snapshot);
    if (!wasHidden && lastVisualSignature === signature) return;
    lastVisualSignature = signature;
    // END R47 UPDATE ON PUBLIC REVISION
    const size = Math.min(216 / snapshot.width, 120 / snapshot.height);
    const left = (224 - snapshot.width * size) / 2, top = (128 - snapshot.height * size) / 2;
    const point = cell => [left + (cell % snapshot.width + 0.5) * size, top + (Math.floor(cell / snapshot.width) + 0.5) * size];
    context.clearRect(0, 0, 224, 128);
    context.fillStyle = '#40584a'; context.fillRect(left, top, snapshot.width * size, snapshot.height * size);
    context.strokeStyle = '#a9ba88'; context.lineWidth = 0.7; context.strokeRect(left, top, snapshot.width * size, snapshot.height * size);
    for (const cell of snapshot.obstacles) { const [x, y] = point(cell); context.fillStyle = '#a19e88'; context.fillRect(x-size*.4,y-size*.4,size*.8,size*.8); }
    for (const hazard of snapshot.hazards) { const [x, y] = point(hazard.cell); context.fillStyle = hazard.active ? '#f29174' : '#d2ba7e'; context.beginPath(); context.moveTo(x,y-2.5);context.lineTo(x+2.5,y+2);context.lineTo(x-2.5,y+2);context.fill(); }
    snapshot.portals.forEach((portal, index) => {
      context.strokeStyle = index % 2 ? '#e2b6eb' : '#93cbea';
      for (const cell of [portal.entry, portal.exit]) { const [x,y] = point(cell);context.beginPath();context.arc(x,y,2.5,0,Math.PI*2);context.stroke(); }
    });
    for (let index = snapshot.snake.length-1; index >= 0; index--) {
      const [x, y] = point(snapshot.snake[index].cell);
      context.fillStyle = index ? '#a5d989' : '#ffe4a1';
      context.beginPath(); context.arc(x,y,index ? Math.max(1.7,size*.29) : Math.max(2.5,size*.42),0,Math.PI*2); context.fill();
    }
    if (snapshot.food) { const [x,y] = point(snapshot.food.cell);context.fillStyle='#ffad73';context.beginPath();context.arc(x,y,3,0,Math.PI*2);context.fill(); }
  }
  return { update, dispose: () => button.remove() };
}
