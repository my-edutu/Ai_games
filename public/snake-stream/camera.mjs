const normalize = v => {
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
};
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

// Fit the world in perspective instead of moving a landscape composition far
// away on phones. Portrait looks across the short side of the same real board.
export function cameraComposition({ width, height, aspect, mode = 'overview', head = { x: 0, z: 0 }, direction = { x: 0, z: 1 } }) {
  const portrait = aspect < 1;
  let outward = normalize(portrait ? { x: 0.52, y: 0.85, z: 0.02 } : { x: 0.12, y: 0.77, z: 0.67 });
  const target = mode === 'overview' ? { x: 0, y: 0.4, z: 0 } : { x: head.x, y: 0.4, z: head.z };
  let distance;
  if (mode === 'detail') {
    outward = normalize({ x: direction.x * 0.82 - direction.z * 0.34, y: 0.45, z: direction.z * 0.82 + direction.x * 0.34 });
    distance = portrait ? 5.2 : 4.4;
  } else if (mode === 'follow') {
    distance = portrait ? 14 : 16;
  } else {
    const right = normalize({ x: outward.z, y: 0, z: -outward.x });
    const up = { x: outward.y * right.z, y: outward.z * right.x - outward.x * right.z, z: -outward.y * right.x };
    const tan = Math.tan(Math.PI / 10);
    distance = 1;
    const bounds = [];
    for (const x of [-width / 2 - 1.7, width / 2 + 1.7]) {
      for (const z of [-height / 2 - 2.1, height / 2 + 2.1]) {
        for (const y of [-2.2, 0.7]) bounds.push({ x, y: y - target.y, z });
      }
    }
    // The authored trees and arch stand behind the board, not at its front corners.
    for (const x of [-width * 0.46, width * 0.46]) bounds.push({ x, y: 5.5 - target.y, z: -height / 2 - 2.1 });
    for (const point of bounds) distance = Math.max(distance, dot(point, outward) + Math.max(Math.abs(dot(point, right)) / (tan * aspect), Math.abs(dot(point, up)) / tan));
    distance *= 1.04;
  }
  return { target, offset: { x: outward.x * distance, y: outward.y * distance, z: outward.z * distance } };
}
