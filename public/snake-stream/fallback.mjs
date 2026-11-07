import { buildMotion } from './motion.mjs';

// Explicit safety view for browsers without WebGL; the same live snapshot remains authoritative.
export function createFallbackRenderer(canvas) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('A drawing context is unavailable');
  canvas.dataset.renderer = 'canvas-fallback';
  let frameCount = 0;
  function draw(frame, previous, fraction, timestamp, settings) {
    const snapshot = frame?.snapshot;
    if (!snapshot) return;
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.fillStyle = '#172d27';
    context.fillRect(0, 0, width, height);
    const size = Math.min((width - 28) / snapshot.width, (height - 28) / snapshot.height);
    const left = (width - size * snapshot.width) / 2;
    const top = (height - size * snapshot.height) / 2;
    const xy = cell => [left + (cell % snapshot.width + 0.5) * size, top + (Math.floor(cell / snapshot.width) + 0.5) * size];
    context.fillStyle = '#557257';
    context.fillRect(left, top, size * snapshot.width, size * snapshot.height);
    context.strokeStyle = '#ffffff0c';
    context.lineWidth = 1;
    for (let x = 0; x <= snapshot.width; x++) { context.beginPath(); context.moveTo(left + x * size, top); context.lineTo(left + x * size, top + size * snapshot.height); context.stroke(); }
    for (let z = 0; z <= snapshot.height; z++) { context.beginPath(); context.moveTo(left, top + z * size); context.lineTo(left + snapshot.width * size, top + z * size); context.stroke(); }
    for (const cell of snapshot.obstacles) { const [x, y] = xy(cell); context.fillStyle = '#c6bb92'; context.fillRect(x - size * 0.4, y - size * 0.4, size * 0.8, size * 0.8); }
    for (const hazard of snapshot.hazards) {
      const [x, y] = xy(hazard.cell);
      context.fillStyle = hazard.active ? '#ea7b52' : '#e2c880';
      context.beginPath(); context.moveTo(x, y - size * 0.4); context.lineTo(x + size * 0.4, y + size * 0.35); context.lineTo(x - size * 0.4, y + size * 0.35); context.closePath(); context.fill();
    }
    snapshot.portals.forEach((portal, index) => {
      for (const cell of [portal.entry, portal.exit]) { const [x, y] = xy(cell); context.strokeStyle = index % 2 ? '#e3b4e8' : '#78e3d2'; context.lineWidth = 3; context.beginPath(); context.arc(x, y, size * 0.38, 0, Math.PI * 2); context.stroke(); }
    });
    if (snapshot.food) { const [x, y] = xy(snapshot.food.cell); context.fillStyle = '#ffb77c'; context.beginPath(); context.arc(x, y, size * 0.3, 0, Math.PI * 2); context.fill(); }
    const motion = buildMotion(snapshot, previous?.snapshot, settings.reducedMotion ? 1 : fraction);
    context.strokeStyle = '#cce57e'; context.lineWidth = size * 0.63; context.lineCap = 'round'; context.lineJoin = 'round';
    for (const path of motion.paths) {
      if (path.length === 1) {
        const point = path[0];
        context.fillStyle = context.strokeStyle;
        context.beginPath();
        context.arc(left + (point.x + snapshot.width / 2) * size, top + (point.z + snapshot.height / 2) * size, size * 0.315, 0, Math.PI * 2);
        context.fill();
        continue;
      }
      context.beginPath();
      path.forEach((point, index) => {
        const x = left + (point.x + snapshot.width / 2) * size;
        const y = top + (point.z + snapshot.height / 2) * size;
        if (!index) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.stroke();
    }
    const head = motion.paths[0]?.[0];
    if (head) {
      const x = left + (head.x + snapshot.width / 2) * size, y = top + (head.z + snapshot.height / 2) * size;
      context.fillStyle = '#f1eeac'; context.beginPath(); context.ellipse(x, y, size * 0.41, size * 0.37, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#173124';
      for (const side of [-1, 1]) { context.beginPath(); context.arc(x + motion.direction.x * size * 0.16 - motion.direction.z * side * size * 0.18, y + motion.direction.z * size * 0.16 + motion.direction.x * side * size * 0.18, size * 0.055, 0, Math.PI * 2); context.fill(); }
    }
    context.fillStyle = '#f3eace'; context.font = '12px system-ui'; context.fillText('2D safety view · autonomous play continues', 14, height - 12);
    frameCount++;
  }
  return { draw, dispose() {}, stats: () => ({ renderer: 'canvas-fallback', frameCount, geometries: 0, textures: 0 }) };
}
