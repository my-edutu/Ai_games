import { applyStoneSurface } from './world-surface.mjs';

// P0: prepare bounded Void material GPU program variants while the SOURCE is
// still on the real Clockwork floor. This is an offscreen shader compilation,
// never an alternate game scene, screenshot, simulated Floor 9 or movement.
// Retain the compiled materials until the authentic first F9 submission so
// Three's program reference counts cannot delete the warmed programs early.
export function createTowerVoidProgramPrewarm(THREE, renderer, liveScene, camera) {
  let phase = 'idle', scratch = null, geometry = null, materials = [];
  let originalStoneLookup = null;
  let epoch = 0, releaseAfterCompile = false, startedAtSource = null;
  let firstError = null, completions = 0;
  let floorNineFirstTick = null, floorNineSubmittedFrames = 0;
  let deferredInvisibleReturns = 0, releaseReason = null;
  let queuedReleaseReason = null;

  function release(reason = 'disposed') {
    epoch += 1;
    scratch?.clear();
    geometry?.dispose();
    for (const material of materials) material.dispose();
    originalStoneLookup?.dispose();
    originalStoneLookup = null;
    scratch = null; geometry = null; materials = [];
    releaseAfterCompile = false;
    queuedReleaseReason = null;
    releaseReason = reason;
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
      // The real first Floor9 GPU frame uses the ORIGINAL shader-modified
      // triplanar weathered stone (world-surface.mjs), including its distinct
      // instanced rigid-deck program. Warming four generic StandardMaterial
      // boxes alone left the FIRST true stone/architecture programs compiling
      // synchronously on the same frame as the source-earned gateway crossing.
      // This tiny texture only satisfies a valid sampler during offscreen
      // compilation; the real world's independently loaded stone asset is
      // untouched and no future game scene or actor is rendered.
      originalStoneLookup = new THREE.DataTexture(
        new Uint8Array([151, 151, 151, 255]), 1, 1);
      originalStoneLookup.colorSpace = THREE.SRGBColorSpace;
      originalStoneLookup.needsUpdate = true;
      const weatheredStone = applyStoneSurface(
        new THREE.MeshStandardMaterial({
          color:0x514963,metalness:.04,roughness:.86
        }), {texture:originalStoneLookup,available:{value:0}},
        {sampling:view.quality==='low' ? 'economy':'triplanar'});
      materials = [stone, alloy, crystal, reveal, weatheredStone];
      for (const material of materials) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = false;
        scratch.add(mesh);
      }
      // Warm the TWO actually distinct source programs: ordinary alloy
      // instancing and the shader-modified weathered-stone instancing.
      // Geometry, draw and texture budgets are offscreen only. Programs stay
      // retained through the first source-certified visible F9 shaft return.
      for (const material of [alloy, weatheredStone]) {
        const instance = new THREE.InstancedMesh(geometry, material, 1);
        instance.castShadow = false;
        scratch.add(instance);
      }
      startedAtSource = {runToken:snapshot.runToken, floor:snapshot.floor, tick:snapshot.tick};
      phase = 'compiling';
      const currentEpoch = epoch;
      const work = renderer.compileAsync(scratch, camera, liveScene);
      Promise.resolve(work).then(() => {
        if (epoch !== currentEpoch || phase !== 'compiling') return;
        completions += 1;
        phase = 'ready';
        if (releaseAfterCompile) release(queuedReleaseReason ?? 'post-compile-release');
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

  // Called only AFTER a successful, original renderer.render return. World
  // samples the structural root BEFORE that draw: noteFrameSubmitted may
  // change source-gated opacity for the NEXT draw, never retroactively.
  // Do not dispose offscreen compiled programs after the first F9 ground
  // frame if the SAME original Void shaft is still actually GPU-invisible.
  function onSubmittedFrame(snapshot, structuralSubmission = null) {
    if (!snapshot || !startedAtSource) return;
    const retire = reason => {
      if (phase === 'compiling') {
        releaseAfterCompile = true;
        queuedReleaseReason = reason;
      } else if (phase === 'ready') release(reason);
    };
    if (snapshot.runToken !== startedAtSource.runToken ||
        snapshot.lifecycle !== 'running' ||
        snapshot.floor < 8 || snapshot.floor > 9) {
      retire('source-run-or-lifecycle-ended');
      return;
    }
    if (snapshot.floor !== 9) return;
    if (!Number.isSafeInteger(snapshot.tick)) {
      retire('invalid-source-tick');
      return;
    }
    if (floorNineFirstTick === null) floorNineFirstTick = snapshot.tick;
    floorNineSubmittedFrames = Math.min(25,floorNineSubmittedFrames+1);
    // The proof is copied from exactly the real source-owned World owner.
    // A stale/fabricated source receipt cannot extend another run's shader
    // program lifetime. Missing proof falls back to ordinary first-F9 release.
    const deferred = structuralSubmission?.sourceBound === true &&
      structuralSubmission.runToken === snapshot.runToken &&
      structuralSubmission.floor === 9 &&
      structuralSubmission.sourceTick === snapshot.tick &&
      typeof structuralSubmission.structuralVisibleOnSubmittedFrame === 'boolean';
    if (deferred && !structuralSubmission.structuralVisibleOnSubmittedFrame &&
        floorNineSubmittedFrames <= 24 &&
        snapshot.tick-floorNineFirstTick <= 70) {
      deferredInvisibleReturns += 1;
      return;
    }
    retire(deferred
      ?structuralSubmission.structuralVisibleOnSubmittedFrame
        ?'first-visible-original-void-shaft-submission'
        :'bounded-unrevealed-void-shaft'
      :'ordinary-first-successor-submission');
  }

  function diagnostics() {
    return {phase, variantCount:materials.length, completions,
      startedAtSource, error:firstError, releaseReason,
      originalWeatheredStoneVariants:materials.length===5?2:0,
      ownedPrewarmStoneTextures:originalStoneLookup?1:0,
      floorNineFirstTick,floorNineSubmittedFrames,deferredInvisibleReturns,
      evidence:'Programs retained until actual source-owned shaft submission or 24-F9-return/70-tick cap. No GPU timing, native film, or performance pass.'};
  }
  return {begin, onSubmittedFrame, diagnostics, dispose:release};
}
