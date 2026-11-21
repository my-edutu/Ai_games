'use strict';
// Byte-exact historical control for the real df113 serpent (Git blob c8af8e31).
// Later independent T2 pigment changes must not silently invalidate the
// original bend-allocation experiment or short-circuit real WebGL capture.
// Reconstruct only recognized source regions; preserve a cryptographic parent.
const crypto = require('node:crypto');
const blob = content => crypto.createHash('sha1')
  .update('blob ' + Buffer.byteLength(content) + '\0').update(content).digest('hex');
const previousBlob = 'c8af8e31e827cb50addabb2782f7f1f4e36faa12';
const oldPigment = "// BEGIN T2 BOTANICAL DORSAL PIGMENT\n        // The old entire transverse saddles made the animal resemble a\n        // yellow-striped toy at game distance. Retain the exact existing\n        // original scale relief and two sunlight anchors, but reveal deep\n        // jade between small asymmetrical leaf-shaped dorsal islands.\n        // All pigment is authored once in the same four pre-owned textures.\n        const spineMask = 1 - smooth(.095, .235, Math.abs(around - .25));\n        const leafWarp = .009 * Math.sin(around * 6.283 * 7 + along * 6.283 * 2)\n          + .006 * Math.sin(around * 6.283 * 11 - along * 6.283 * 5);\n        const leafHalfWidth = .045 + .043 * spineMask;\n        const leafCore = 1 - smooth(leafHalfWidth * .62, leafHalfWidth,\n          bandDistance + leafWarp);\n        const preservedGold = isHead\n          ? spineMask * (.25 + .75 * (1 - smooth(.045, .29, Math.abs(along - .76))))\n          : spineMask * leafCore;\n        const darkLeafScale = (1 - underside) * (1 - preservedGold)\n          * (.5 + .5 * Math.sin(along * 6.283 * 13 + around * 6.283 * 9))\n          * (.5 + .5 * Math.cos(around * 6.283 * 17 - along * 6.283 * 3));\n        const jadeR = (50 + mottling * 12 - edge * 16) * backLight;\n        const jadeG = (139 + mottling * 16 - edge * 23) * backLight;\n        const jadeB = (75 + mottling * 10 - edge * 13) * backLight;\n        const leafShadow = darkLeafScale * 12;\n        r = r * preservedGold + (jadeR - leafShadow) * (1 - preservedGold);\n        g = g * preservedGold + (jadeG - leafShadow * .72) * (1 - preservedGold);\n        b = b * preservedGold + (jadeB - leafShadow * .56) * (1 - preservedGold);\n        // END T2 BOTANICAL DORSAL PIGMENT\n";
function restoreBendParent(source) {
  const begin = '// BEGIN T2 CURVATURE-ALLOCATED BODY RINGS\n';
  const end = '// END T2 CURVATURE-ALLOCATED BODY RINGS\n';
  const i=source.indexOf(begin), j=source.indexOf(end);
  if(i<0||j<i||source.indexOf(begin,i+1)>=0||source.indexOf(end,j+1)>=0)
    throw new Error('T2 exact-source curvature bracket missing or ambiguous');
  let old=source.slice(0,i)+source.slice(j+end.length);
  // The live portal-fragment pose adapter changed only the presentation
  // heading of isolated body rings. Reverse those exact bytes before the
  // immutable df113 bend baseline check; NEVER substitute a new baseline SHA.
  const earlierPortalDirection = '        const dx = options.direction?.x || 0, dz = options.direction?.z || 1;\n';
  const independentPortalDirection =
    '        const ownDirection = options.fragmentDirections?.[p] || options.direction;\n'+
    '        // Per-fragment heading is drawn only from an adjacent public body\n'+
    '        // tangent. A single portal segment never borrows the head\'s direction\n'+
    '        // when its own earlier, authoritative orientation is available.\n'+
    '        const dx = Number.isFinite(ownDirection?.x) ? ownDirection.x : 0;\n'+
    '        const dz = Number.isFinite(ownDirection?.z) ? ownDirection.z : 1;\n';
  if (old.includes(independentPortalDirection)) {
    if (old.split(independentPortalDirection).length !== 2)
      throw new Error('T2 portal-fragment source reversal ambiguous');
    old = old.replace(independentPortalDirection, earlierPortalDirection);
  } else if (old.split(earlierPortalDirection).length !== 2) {
    throw new Error('T2 portal-fragment source reversal drift');
  }
  const removed='      // Curvature budgets are fragment-local. Portal breaks cannot be used\n'+
    '      // as invented neighbors to round across a discontinuity.\n'+
    '      const overviewRings = lowDetail ? distributeSerpentBendRings(path) : null;\n';
  const updated='        const subdivisions = lowDetail ? overviewRings[s]\n'+
    '          : clamp(Math.ceil(segmentLength * 7), 2, 14);';
  const previous='        const subdivisions = clamp(Math.ceil(segmentLength * (lowDetail ? 3 : 7)), 2, 14);';
  if(old.split(removed).length!==2 || old.split(updated).length!==2)
    throw new Error('T2 exact-source curvature reversal drift');
  old=old.replace(removed,'').replace(updated,previous);
  // These later T2 head adaptations are NOT present in the immutable
  // df113 bend-density parent. Reverse exact fragments, never weaken SHA.
  const scaled = "  // T2 whole-game hero silhouette: the previously beautiful detailed skull\n"+
    "  // became a pinhead at authentic 28×16 / 40×24 overview scale. Enlarge the\n"+
    "  // EXISTING one-piece skull, jaw, brows, eyes and tongue together, keeping\n"+
    "  // every existing material, draw/triangle count, public route, gap and cue.\n"+
    "  // At 1.28 the rear skull half-width (0.215) becomes 0.275, blending into\n"+
    "  // the unchanged ~0.319 3D neck radius rather than a detached cartoon mask.\n"+
    "  head.scale.setScalar(1.28);\n";
  if (old.split(scaled).length !== 2)
    throw new Error('T2 exact-source head-scale reversal drift');
  old = old.replace(scaled, '');
  const lifted = "    // Keep the enlarged complete head grounded against the exact unchanged\n"+
    "    // body surface. Without the compensating lift the scaled lower-jaw,\n"+
    "    // eyes and chin penetrate the board even with reduced motion enabled.\n"+
    "    // This is presentation-only: no public route, scoring or physics changes.\n"+
    "    const headGroundingLift = (head.scale.y - 1) * 0.38;\n"+
    "    head.position.set(first.x, fullBodyHeight + 0.065 + headGroundingLift +\n"+
    "      (reduced ? 0 : eaten * 0.065 + Math.sin(time * 3.1) * 0.015), first.z);";
  const oldPosition = "    head.position.set(first.x, fullBodyHeight + 0.065 + (reduced ? 0 : eaten * 0.065 + Math.sin(time * 3.1) * 0.015), first.z);";
  if (old.split(lifted).length !== 2)
    throw new Error('T2 exact-source head grounding reversal drift');
  old = old.replace(lifted, oldPosition);
  // Restore the exact immutably pinned df113 ancestor after the additive T4
  // *shader* optimization. No source-hash allowance or expected digest changes:
  // the historical baseline must still match its original Git blob bytewise.
  const newShaderStart = '/**\n * Bound the detailed serpent\'s scale-relief fragment work';
  const newShaderEnd = 'export function createSerpent(THREE) {';
  const shaderStart = old.indexOf(newShaderStart), shaderEnd = old.indexOf(newShaderEnd);
  if (shaderStart < 0 || shaderEnd <= shaderStart ||
      old.indexOf(newShaderStart, shaderStart + 1) >= 0)
    throw new Error('T4 exact-source relief-shader bracket missing or ambiguous');
  old = old.slice(0, shaderStart) + old.slice(shaderEnd);
  const addedRelief = `  // Detailed camera shots retain the existing full PBR shader, bump scale,
  // roughness and all four original atlas textures. Only the redundant relief
  // sampling inside its fragment shader changes. Overview remains untouched.
  for (const detailed of [bodyMaterial, skullMaterial, jade, cream])
    installSingleSampleScaleRelief(detailed, THREE);
`;
  if (old.split(addedRelief).length !== 2)
    throw new Error('T4 exact-source relief-material installation drift');
  old = old.replace(addedRelief, '');
  const p='// BEGIN T2 BOTANICAL DORSAL PIGMENT\n',q='// END T2 BOTANICAL DORSAL PIGMENT\n';
  const s=old.indexOf(p),e=old.indexOf(q);
  if(s<0||e<s||old.indexOf(p,s+1)>=0||old.indexOf(q,e+1)>=0)
    throw new Error('T2 exact-source pigment bracket missing or ambiguous');
  old=old.slice(0,s)+oldPigment+old.slice(e+q.length);
  // Reverse the exact later T4 progressive GPU-buffer allocation before
  // comparing against the immutable df113 T2 control. The old Git blob digest
  // remains unchanged; require BOTH intermediate hashes and original digest.
  const sealed=(chunk,sha)=>crypto.createHash('sha256').update(chunk).digest('hex')===sha;
  const gpuHead='  // Complete GPU buffers previously reserved all 8192 possible rings at first\n';
  const gpuTail='  // BEGIN R36 INDEX STATE\n';
  const h=old.indexOf(gpuHead),t=old.indexOf(gpuTail,h+gpuHead.length);
  if(h<0||t<=h||old.indexOf(gpuHead,h+1)>=0||
    !sealed(old.slice(h,t),'715189f9282d9de943e192a30739f805dfeb93314f8d4bc279c638173ff523a6'))
    throw new Error('T4 native GPU initial buffer source drift');
  const oldGpu=`  let activeRadial = RADIAL, activeRing = RING, lowDetail = false;
  const positions = new Float32Array(MAX_RINGS * RING * 3);
  const normals = new Float32Array(MAX_RINGS * RING * 3);
  const uvs = new Float32Array(MAX_RINGS * RING * 2);
  const indices = new Uint32Array(MAX_RINGS * RADIAL * 6);
  const bodyGeometry = ownGeometry(new THREE.BufferGeometry());
  const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const normalAttribute = new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage);
  const uvAttribute = new THREE.BufferAttribute(uvs, 2).setUsage(THREE.DynamicDrawUsage);
  const indexAttribute = new THREE.BufferAttribute(indices, 1).setUsage(THREE.DynamicDrawUsage);
`;
  old=old.slice(0,h)+oldGpu+old.slice(t);
  const grow='  function reserveBodyRings(needed) {\n',write='  function writeRing(';
  const g=old.indexOf(grow),w=old.indexOf(write,g+grow.length);
  if(g<0||w<=g||old.indexOf(grow,g+1)>=0||
    !sealed(old.slice(g,w),'1cfacacd2cdb22399527e0668c23967647f7b0c5401eb054207cc4b8a0e7a37e'))
    throw new Error('T4 native GPU growth source drift');
  old=old.slice(0,g)+old.slice(w);
  const afterGrow='    reserveBodyRings(ringCount + 1);\n';
  const counter='      // CPU backing / first GPU allocation bytes, NOT measured displayed FPS.\n      bodyCapacityRings: ringCapacity, bodyReallocations,\n';
  if(old.split(afterGrow).length!==2||old.split(counter).length!==2)
    throw new Error('T4 native GPU call/counter source drift');
  old=old.replace(afterGrow,'').replace(counter,'');
  if(blob(old)!==previousBlob)throw new Error('Original exact Git source hash mismatch');
  return old;
}
module.exports={restoreBendParent,previousBlob,blob};
