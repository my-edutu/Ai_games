'use strict';
const { stripR49Contact } = require('./snake-r49-contact-archive.cjs');
// Byte-exact old renderer restore: preserve genuine historical WebGL controls.
const createBlock="  // BEGIN R46 SINGLE-PASS CACHE QUAD\n  // Original cache color/depth and z shader; no new GPU resource.\n  const liveCacheQuad = new THREE.Mesh(cacheGeometry, cacheMaterial);\n  liveCacheQuad.frustumCulled = false;\n  liveCacheQuad.renderOrder = -10000;\n  liveCacheQuad.layers.set(DYNAMIC_LAYER);\n  liveCacheQuad.visible = false;\n  scene.add(liveCacheQuad);\n  // END R46 SINGLE-PASS CACHE QUAD\n";
const oldCompositor="      renderer.setRenderTarget(null);\n      renderer.autoClear = true;\n      renderer.render(cacheScene, cacheCamera);\n      // A Color background forces a clear even when autoClear is false.\n      scene.background = null;\n      renderer.autoClear = false;\n      camera.layers.set(DYNAMIC_LAYER);\n      renderer.render(scene, camera);\n      cacheActive = true;\n";
const newCompositor="      // BEGIN R46 ONE-PASS CACHE COMPOSITION\n      // One live scene pass: original cached color and depth first, then live\n      // serpent, water and critical portal/hazard geometry with proper z-tests.\n      renderer.setRenderTarget(null);\n      renderer.autoClear = true;\n      camera.layers.set(DYNAMIC_LAYER);\n      liveCacheQuad.visible = true;\n      renderer.render(scene, camera);\n      cacheActive = true;\n      // END R46 ONE-PASS CACHE COMPOSITION\n";
const restoreBlock="      // BEGIN R46 CACHE QUAD RESTORE\n      liveCacheQuad.visible = false;\n      // END R46 CACHE QUAD RESTORE\n";
const releaseBlock="    // BEGIN R46 CACHE QUAD RELEASE\n    scene.remove(liveCacheQuad);\n    // END R46 CACHE QUAD RELEASE\n";
function once(s,a,b,label){if(s.split(a).length!==2)throw Error('R46 archive source mismatch: '+label);return s.replace(a,b);}
function restorePreR46(s){s=stripR49Contact(s);return once(once(once(once(s,newCompositor,oldCompositor,'compositor'),createBlock,'','quad'),restoreBlock,'','finally'),releaseBlock,'','dispose');}
module.exports={restorePreR46};
