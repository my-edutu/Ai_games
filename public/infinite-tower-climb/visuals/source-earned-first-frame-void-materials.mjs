// A source-earned Floor 9 must show a REAL successor chamber through the
// ORIGINAL opened bronze gateway, instead of painting every piece of the
// incoming Three.js room bronze until a later cold WebGL return.
// Own only the already-authored first-frame Void rear braces and far bearing.
// No added geometry, HUD, lighting, floor, collision, actor or source event.
export const FIRST_FRAME_VOID_BEARING_CHANNELS = Object.freeze([
  'stone','dark','metal','copper'
]);

export function isolateEarnedFirstFrameVoidMaterials(root, floorMaterials, own) {
  if (!root?.isGroup || typeof root.traverse !== 'function' ||
      !floorMaterials || typeof own !== 'function') return null;
  const channels = new Map();
  for (const name of FIRST_FRAME_VOID_BEARING_CHANNELS) {
    const material = floorMaterials[name];
    if (!material?.isMaterial || typeof material.clone !== 'function')
      return null;
    channels.set(material, name);
  }
  const isolated = new Map();
  let actualMeshes = 0;
  root.traverse(object => {
    if (object?.isMesh !== true || Array.isArray(object.material)) return;
    const original = object.material, name = channels.get(original);
    if (!name) return;
    let replacement = isolated.get(original);
    if (!replacement) {
      replacement = original.clone();
      replacement.name = 'SourceEarnedOriginalVoidBearing-' + name;
      // The floor's normal material/dispose owner, not a global cache:
      // restart, new run, graphics-tier changes all reclaim these clones.
      own(replacement);
      isolated.set(original, replacement);
    }
    object.material = replacement;
    actualMeshes++;
  });
  return {
    actualMeshes,
    sourceOwnedMaterials: isolated.size,
    geometryAdded: 0,
    sourceOnly: true,
    limitation: 'Original first-frame Void structural material identity; not native film or crossing proof'
  };
}
