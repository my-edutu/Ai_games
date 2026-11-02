const strategies = Object.freeze({
  'seek-food': 'Finding the next fruit',
  'preserve-space': 'Keeping a safe way through',
  'follow-tail': 'Following a clear path',
  'escape-hazard': 'Moving away from danger',
  'fallback-survival': 'Looking for a safer route',
  'replan': 'Choosing a new direction',
  'cycle-fill': 'Filling the garden carefully',
  'long-horizon': 'Planning room to grow',
});
export function spectatorCopy(snapshot) {
  const area = Math.max(1, snapshot.width * snapshot.height);
  const occupied = Math.min(100, Math.max(0, Math.round(snapshot.occupancy / area * 100)));
  return {
    occupancy: `${occupied}% of the garden occupied`,
    intent: strategies[snapshot.ai?.mode] || 'Finding a safe path',
  };
}
