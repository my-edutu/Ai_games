// A presentation-only map. The fixed-step simulation remains authoritative.
export const SCALE = 10000;
export const RADIUS = 24;
export const ARC = 2.2;
export function angleFor(x, width = 480000) {
  return (x / width - 0.5) * ARC;
}
export function pointFor(x, y, baseY = 0, width = 480000, radius = 25) {
  const angle = angleFor(x, width);
  return { x: Math.sin(angle) * radius, y: (y - baseY) / SCALE, z: Math.cos(angle) * radius, angle };
}
