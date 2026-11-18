'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync(require.resolve(
  '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');

// P0 source-pinned 1x candidate 9c88174: HUD Floor9 at 25.75s in both
// original viewports; sustained Void architecture appears 1.50s desktop and
// 1.75s portrait later. The late original Void crystal vault was gated behind
// successive CPU/GPU batches even though the authentic successor deck,
// original guardian gate and new-world bearing were already in the first F9
// scene. Moving its REAL seven authored visual meshes to the earned first
// submitted scene must never duplicate them or bake their animation.
test('only the authenticated F8 guardian exit stages the ORIGINAL Void vault on first F9 construction',()=>{
  const start=source.indexOf('function stageSourceEarnedVoidBearingFrame(');
  const end=source.indexOf('function buildTower(',start);
  assert.ok(start>0&&end>start);
  const stage=source.slice(start,end);
  assert.match(stage,/held\.guardianGateRetained!==true/);
  assert.match(stage,/snapshot\?\.floor!==9/);
  assert.match(stage,/snapshot\.theme!=='void'/);
  assert.match(stage,/held\.runToken!==snapshot\?\.runToken/);
  assert.match(stage,/buildVoid\(height,'first-return-vault',frame\)/);
  assert.match(stage,/landmarkBuilt:true,landmarkName:'OriginalVoidVaultHaloAndCrystals'/);
  assert.match(source,/const deferStructuralShell = deferDistant && earnedSourceUploadWitness && snapshot\.floor===9 && snapshot\.theme==='void'/);
  assert.match(source,/if\(deferStructuralShell\)stagedVoidArchitecture=\s*stageSourceEarnedVoidBearingFrame\(snapshot,height\)/);
  assert.doesNotMatch(source,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});

test('actual original animated vault is created once and later original shaft still builds its distinct rock details',()=>{
  const start=source.indexOf("function buildVoid(height,segment='complete',parent=floorGroup)");
  const end=source.indexOf('function buildVista(',start);
  assert.ok(start>0&&end>start);
  const build=source.slice(start,end);
  assert.match(build,/const firstVault=segment==='first-return-vault'/);
  assert.match(build,/const vaultedAlready=stagedVoidArchitecture\?\.landmarkBuilt===true/);
  assert.match(build,/if\(firstVault \|\| \(segment==='complete' && !vaultedAlready\)\)/);
  assert.match(build,/const vault=new THREE\.Group\(\)/);
  assert.match(build,/vault\.name='OriginalVoidVaultHaloAndCrystals'/);
  assert.match(build,/radial\(vault,\.03,18\.4,20\);parent\.add\(vault\)/);
  assert.match(build,/rotors\.push\(\{o:halo,speed:\.04\}\)/);
  assert.match(build,/for\(let i=0;i<5;i\+\+\)/);
  assert.match(build,/floaters\.push\(/);
  assert.match(build,/if\(firstVault\)return;\s*for\(const \[a,y\]of \[\[-\.73,4\],\[\.89,30\]\]\)/);
  assert.match(source,/buildVoid\(arrival\.height\)/,
    'the original two geological silhouettes still build through the returned-frame cold owner');
});

test('first-floor-nine rigid batching preserves the TRUE source-animated vault, not a frozen copy',()=>{
  const start=source.indexOf('function finishBatches()');
  const end=source.indexOf('function conformDanger(',start);
  assert.ok(start>0&&end>start);
  const stage=source.slice(start,end);
  assert.match(stage,/if\(stagedVoidArchitecture\?\.root\)/);
  assert.match(stage,/const animatedFirstReturn=new Set\(\[/);
  assert.match(stage,/\.\.\.rotors\.map\(rotor=>rotor\.o\)/);
  assert.match(stage,/\.\.\.floaters\.map\(floater=>floater\.o\)/);
  assert.match(stage,/batchRigid\(stagedVoidArchitecture\.root,animatedFirstReturn\)/);
  assert.match(stage,/boundaries\.add\(stagedVoidArchitecture\.root\)/);
  assert.match(stage,/batchRigid\(floorGroup,boundaries\)/);
  assert.match(source,/batchRigid\(biomeRoot,animatedStructuralRoots\)/,
    'deferred legitimate rotating geometry stays separate from rigid world steel');
});

test('the first-frame original Void landmark retains existing GPU-owner and restricted cold-tier policy',()=>{
  assert.match(source,/if\s*\(!deferStructuralShell\)\s*buildTower\(height,theme==='clockwork'\)/);
  assert.match(source,/if\(!deferDistant\)\{buildDistantWorld\(height\);buildVista\(height\);\}/);
  assert.match(source,/frame\.userData\.firstReturnedVoidMaterials=distinctSuccessor/);
  assert.match(source,/const distinctSuccessor=isolateEarnedFirstFrameVoidMaterials\(\s*frame,materials,replacement=>floorMaterials\.add\(replacement\)\)/);
  assert.match(source,/for\(const p of snapshot\.platforms\|\|\[\]\)/);
  assert.match(source,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard/);
  assert.match(source,/arrival\.state='awaiting-structural-release'/);
});
