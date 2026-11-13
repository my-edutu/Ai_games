// P0: prepare bounded Void material GPU program variants while the SOURCE is
// still on the real Clockwork floor. This is an offscreen shader compilation,
// never an alternate game scene, screenshot, simulated Floor 9 or movement.
// Retain the compiled materials until the authentic first F9 submission so
// Three's program reference counts cannot delete the warmed programs early.
export function createTowerVoidProgramPrewarm(THREE, renderer, liveScene, camera) {
  let phase = 'idle', scratch = null, geometry = null, materials = [];
  let epoch = 0, releaseAfterCompile = false, startedAtSource = null;
  let firstError = null, completions = 0;

  function release() {
    epoch += 1;
    scratch?.clear();
    geometry?.dispose();
    for (const material of materials) material.dispose();
    scratch = null; geometry = null; materials = [];
    releaseAfterCompile = false;
    phase = 'released';
  }

  function begin(snapshot, view = {}) {
    if (phase !== 'idle' || snapshot?.floor !== 8 ||
        snapshot.theme !== 'clockwork' || snapshot.lifecycle !== 'running' ||
        !(snapshot.player?.health > 0) || typeof snapshot.runToken !== 'string' ||
        !snapshot.runToken || view.stale || view.camera !== 'follow' ||
        typeof renderer?.compileAsync !== 'function') return false;
    try {
      scratch = new THREE.Scene();
      scratch.fog = liveScene.fog?.clone?.() || null;
      geometry = new THREE.BoxGeometry(1, 1, 1);
      const stone = new THREE.MeshStandardMaterial({color:0x514963,metalness:.04,roughness:.86});
      const alloy = new THREE.MeshStandardMaterial({color:0x6a577e,metalness:.48,roughness:.39});
      const crystal = new THREE.MeshStandardMaterial({color:0xb5a0ec,metalness:.45,
        roughness:.23,emissive:0x7758ae,emissiveIntensity:.35});
      const reveal = new THREE.MeshStandardMaterial({color:0x726982,metalness:.35,
        roughness:.62,transparent:true,depthWrite:false,opacity:.6});
      materials = [stone, alloy, crystal, reveal];
      for (const material of materials) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = false;
        scratch.add(mesh);
      }
      // The original world uses rigid indexed batches AND instanced decks.
      const instance = new THREE.InstancedMesh(geometry, alloy, 1);
      instance.castShadow = false;
      scratch.add(instance);
      startedAtSource = {runToken:snapshot.runToken, floor:snapshot.floor, tick:snapshot.tick};
      phase = 'compiling';
      const currentEpoch = epoch;
      const work = renderer.compileAsync(scratch, camera, liveScene);
      Promise.resolve(work).then(() => {
        if (epoch !== currentEpoch || phase !== 'compiling') return;
        completions += 1;
        phase = 'ready';
        if (releaseAfterCompile) release();
      }).catch(error => {
        if (epoch !== currentEpoch) return;
        firstError = error instanceof Error ? error.message : String(error);
        release();
        phase = 'failed-open';
      });
      return true;
    } catch (error) {
      firstError = error instanceof Error ? error.message : String(error);
      release(); phase = 'failed-open';
      return false;
    }
  }

  function onSubmittedFrame(snapshot) {
    if (!snapshot || snapshot.lifecycle !== 'running' || !startedAtSource) return;
    // A new authoritative run cannot keep another expedition's pending
    // program owner alive. Shader variants are context-wide, but the held
    // reference belongs to one source-observed preparation episode.
    if (snapshot.runToken !== startedAtSource.runToken) {
      if (phase === 'compiling') releaseAfterCompile = true;
      else if (phase === 'ready') release();
      return;
    }
    if (snapshot.floor !== 9) return;
    if (phase === 'compiling') releaseAfterCompile = true;
    else if (phase === 'ready') release();
  }

  function diagnostics() {
    return {phase, variantCount:materials.length, completions,
      startedAtSource, error:firstError,
      evidence:'Offscreen program preparation only; no native frame-time or experience pass'};
  }
  return {begin, onSubmittedFrame, diagnostics, dispose:release};
}
