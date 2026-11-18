// P0: keep original THREE.InstancedMesh casings on the first genuine
// source-earned Floor8 -> Floor9 WebGL scene. Flattening these source objects
// copies and transforms every vertex for EVERY instance synchronously before
// the first walkable successor frame can submit. No new geometry, scene,
// camera, artificial player, simulation event, draw or predicted future floor.
// This is a conservative CPU/attribute-payload choice, NOT an observed GPU win.
const MAX_ADDITIONAL_DRAWS = 8;
const MIN_AVOIDED_PACKED_BYTES = 16 * 1024;

const invalid = Object.freeze({
  preserve: false, estimatedAvoidedPackedBytes: 0,
  packedBatchBytes: 0, existingSourceAndMatricesBytes: 0
});
const natural = n => Number.isSafeInteger(n) && n >= 0;

export function chooseSourceEarnedFirstReturnInstancing(options = null) {
  const o=options;
  if (!o || o.quality !== 'low' || o.sourceEarned !== true ||
      o.instanceColor === true || o.isAnimated === true ||
      !natural(o.usedDraws) || o.usedDraws >= MAX_ADDITIONAL_DRAWS ||
      !natural(o.count) || o.count < 4 || o.count > 100 ||
      !natural(o.sourceVertices) || o.sourceVertices < 3 ||
      !natural(o.sourceIndexCount) || o.sourceIndexCount < 3 ||
      o.sourceIndexCount % 3 !== 0 ||
      !natural(o.positionBytes) || !o.positionBytes ||
      !natural(o.normalBytes) || !o.normalBytes ||
      !natural(o.uvBytes) || !o.uvBytes ||
      !natural(o.indexBytes)) return invalid;
  // Identical attribute content / same material / identical instanced
  // transforms. Compute the cost of the actual existing batchRigid expansion
  // versus keeping the source mesh's vertex/index attributes + instanceMatrix.
  // The batcher uses indexed output only when its TOTAL payload is smaller.
  const expanded=o.sourceIndexCount*o.count;
  const unique=o.sourceVertices*o.count;
  const packed=Math.min(expanded*32,
    unique*32+expanded*(unique<=65535?2:4));
  const instanced=o.positionBytes+o.normalBytes+o.uvBytes+
    o.indexBytes+o.count*16*4;
  if (!Number.isSafeInteger(packed) || !Number.isSafeInteger(instanced) ||
      packed-instanced < MIN_AVOIDED_PACKED_BYTES) return invalid;
  return {
    preserve:true,
    estimatedAvoidedPackedBytes:packed-instanced,
    packedBatchBytes:packed,
    existingSourceAndMatricesBytes:instanced,
    // More draws than a fully merged material batch. Explicit upper bound
    // ensures we do not trade CPU build time for unbounded GPU render calls.
    extraDrawBudget:MAX_ADDITIONAL_DRAWS
  };
}
