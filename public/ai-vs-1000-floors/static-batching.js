import * as THREE from 'three';

const identity = new THREE.Matrix4();

function attributeKey(geometry) {
  return Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
    .map(([name, a]) => `${name}:${a.itemSize}:${a.normalized}:${a.array?.constructor.name}`).join('|');
}

/** Bake local transforms without losing UVs, normals, mirrored winding or indices. */
export function mergeGeometryEntries(entries) {
  const pieces = entries.map(({geometry, matrix = identity}) => {
    const copy = geometry.clone().applyMatrix4(matrix);
    return {geometry:copy, mirrored:matrix.determinant() < 0};
  });
  const first = pieces[0]?.geometry;
  if (!first) return new THREE.BufferGeometry();
  const key = attributeKey(first);
  if (pieces.some(p => attributeKey(p.geometry) !== key)) {
    pieces.forEach(p => p.geometry.dispose());
    throw new Error('Cannot batch incompatible geometry attributes.');
  }
  const vertexCount = pieces.reduce((n, p) => n + p.geometry.attributes.position.count, 0);
  const indexCount = pieces.reduce((n, p) => n + (p.geometry.index?.count ?? p.geometry.attributes.position.count), 0);
  const result = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(first.attributes)) {
    const data = new attribute.array.constructor(vertexCount * attribute.itemSize);
    let offset = 0;
    for (const p of pieces) {
      data.set(p.geometry.attributes[name].array, offset);
      offset += p.geometry.attributes[name].array.length;
    }
    result.setAttribute(name, new THREE.BufferAttribute(data, attribute.itemSize, attribute.normalized));
  }
  const indices = new (vertexCount > 65535 ? Uint32Array : Uint16Array)(indexCount);
  let vertexOffset = 0, indexOffset = 0;
  for (const {geometry, mirrored} of pieces) {
    const count = geometry.index?.count ?? geometry.attributes.position.count;
    for (let i = 0; i < count; i += 3) {
      const a = geometry.index ? geometry.index.getX(i) : i;
      const b = geometry.index ? geometry.index.getX(i + 1) : i + 1;
      const c = geometry.index ? geometry.index.getX(i + 2) : i + 2;
      indices[indexOffset++] = a + vertexOffset;
      indices[indexOffset++] = (mirrored ? c : b) + vertexOffset;
      indices[indexOffset++] = (mirrored ? b : c) + vertexOffset;
    }
    vertexOffset += geometry.attributes.position.count;
    geometry.dispose();
  }
  result.setIndex(new THREE.BufferAttribute(indices, 1));
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

/** Only opt-in static roots are batched; dynamic subtrees keep object identity. */
export function batchStaticMeshes(root) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map(), retired = new Set();
  let sourceMeshes = 0, dynamicMeshes = 0;
  function visit(object, dynamic = false, hidden = false) {
    const moving = dynamic || (object !== root && object.userData.dynamic === true);
    const invisible = hidden || !object.visible;
    if (object.isMesh) {
      const geometry = object.geometry, material = object.material;
      const attrs = Object.values(geometry.attributes);
      const eligible = !moving && !invisible && !object.isSkinnedMesh && !object.isInstancedMesh
        && !Array.isArray(material) && !material.transparent && material.visible
        && object.children.length === 0 && !object.userData.noBatch
        && object.onBeforeRender === THREE.Object3D.prototype.onBeforeRender
        && object.onAfterRender === THREE.Object3D.prototype.onAfterRender
        && geometry.attributes.position && !Object.keys(geometry.morphAttributes).length
        && attrs.every(a => !a.isInterleavedBufferAttribute)
        && geometry.drawRange.start === 0 && geometry.drawRange.count === Infinity;
      if (eligible) {
        const key = [material.uuid, object.castShadow, object.receiveShadow, object.renderOrder,
          object.layers.mask, attributeKey(geometry)].join(';');
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(object);
        sourceMeshes++;
      } else dynamicMeshes++;
    }
    for (const child of object.children) visit(child, moving, invisible);
  }
  visit(root);
  let batches = 0, removedMeshes = 0;
  for (const objects of buckets.values()) {
    if (objects.length < 2) continue;
    const sample = objects[0];
    const geometry = mergeGeometryEntries(objects.map(object => ({
      geometry:object.geometry, matrix:new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld)
    })));
    const batch = new THREE.Mesh(geometry, sample.material);
    batch.name = `static:${sample.material.name || sample.material.uuid.slice(0, 8)}`;
    batch.castShadow = sample.castShadow;
    batch.receiveShadow = sample.receiveShadow;
    batch.renderOrder = sample.renderOrder;
    batch.layers.mask = sample.layers.mask;
    root.add(batch);
    for (const object of objects) {
      retired.add(object.geometry);
      object.removeFromParent();
      removedMeshes++;
    }
    batches++;
  }
  // A source geometry may also be shared by an unbatched animated object.
  root.traverse(object => {if (object.geometry) retired.delete(object.geometry);});
  retired.forEach(geometry => geometry.dispose());
  const stats = {sourceMeshes, batches, removedMeshes, retainedMeshes:sourceMeshes - removedMeshes + dynamicMeshes + batches};
  root.userData.batching = stats;
  return stats;
}
