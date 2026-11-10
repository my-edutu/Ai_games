// Source-authentic, immutable authoring ownership for merged rigid tower geometry.
// Geometry is rebuilt once per floor; do not allocate provenance in the render loop.
// Raycaster.faceIndex on a non-indexed rigid batch is a zero-based triangle ordinal.
// This metadata is evidence only, not a visibility, gameplay or quality decision.
export function originalMeshPath(mesh, stopNode) {
  if (!mesh) return [];
  const path = [];
  let node = mesh;
  for (let depth = 0; node && depth < 9; depth++, node = node.parent) {
    const name = typeof node.name === 'string' && node.name.trim()
      ? node.name.trim() : node === mesh ? node.type || 'Mesh' : null;
    if (name) path.push(name.slice(0, 90));
    if (node === stopNode) break;
  }
  return path;
}

export function sourceTriangleOwner(geometry, faceIndex) {
  if (!Number.isSafeInteger(faceIndex) || faceIndex < 0) return null;
  const ranges = geometry?.userData?.originalTriangleOwners;
  if (!Array.isArray(ranges) || !ranges.length) return null;
  let left = 0, right = ranges.length - 1;
  while (left <= right) {
    const mid = (left + right) >>> 1;
    const entry = ranges[mid];
    if (faceIndex < entry.startFace) right = mid - 1;
    else if (faceIndex >= entry.endFace) left = mid + 1;
    else return {
      authoringPath: entry.authoringPath,
      authoringGeometry: entry.authoringGeometry,
      authoringInstance: entry.authoringInstance,
      partFaceIndex: faceIndex - entry.startFace,
      triangleCount: entry.endFace - entry.startFace,
    };
  }
  return null;
}
