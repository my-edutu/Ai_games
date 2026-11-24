'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=()=>import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/map-view.mjs')).href);

test('Pass304 real sideways Pip–Thornback public encounter earns a front-facing full-body performance, not tiny opposite-edge actors',async()=>{
  const {publicPortraitGuardianOrbitAngle:orbit,publicPortraitGuardianHalfHeight:frame}=await source();
  const aspect=390/844,hero={x:2.4,z:0},guardian={x:-2.4,z:0};
  const focus={x:0,z:0},baseView={x:15,z:18};
  const angle=orbit(aspect,.82,hero,guardian,false);
  assert.ok(angle<-.74&&angle>=-.78000001,
    'public horizontal two-tile duel turns toward the already disclosed actor axis');
  const heading=Math.atan2(18,15)+angle;
  const rotated={x:Math.cos(heading)*Math.hypot(15,18),
    z:Math.sin(heading)*Math.hypot(15,18)};
  const lateral=(p,view)=>((p.x-focus.x)*view.z-(p.z-focus.z)*view.x)
    /Math.hypot(view.x,view.z);
  assert.ok(Math.abs(lateral(hero,rotated)-lateral(guardian,rotated))
    <Math.abs(lateral(hero,baseView)-lateral(guardian,baseView))*.35,
    'genuine optical reorientation makes both physical actors share the mobile stage');
  const baseHeight=10;
  const easing=frame(aspect,baseHeight,.82,hero,guardian,focus,focus,rotated,baseView);
  const settled=frame(aspect,baseHeight,.82,hero,guardian,focus,focus,rotated,rotated);
  assert.ok(settled<easing-.7 && settled<baseHeight-2,
    'after an actual settled orbit, both connected actors are visibly larger in the live scene');
  for(const [cameraHeight,views] of [[easing,[baseView,rotated]],[settled,[rotated]]]){
    for(const v of views)for(const [actor,reserve] of [[hero,1.10],[guardian,1.80]]){
      const ndc=(Math.abs(lateral(actor,v))+reserve)/(cameraHeight*aspect);
      assert.ok(ndc<=.94000001,
        'full Pip shell, claws and sails must fit the ORIGINAL strict ±.95 browser threshold');
    }
  }
});

test('Pass304 performance orbit cannot reveal a private guardian or override reduced-motion and camera mode gates',async()=>{
  const {publicPortraitGuardianOrbitAngle:orbit}=await source();
  const hero={x:2.4,z:0},guardian={x:-2.4,z:0};
  const before=JSON.stringify({hero,guardian});
  const live=orbit(390/844,.82,hero,guardian);
  const previousBound=orbit(390/844,.56,hero,guardian,false);
  assert.ok(Math.abs(previousBound)<=.55+1e-12,
    'original low-attention camera max 0.55rad is NOT relaxed');
  const increasing=orbit(390/844,.77,hero,guardian,false);
  assert.ok(Math.abs(increasing)>.55 && Math.abs(increasing)<.78,
    'only genuinely strong observed attention earns continuous extra actor-axis view');
  assert.equal(orbit(390/844,.82,hero,guardian),live,'same public snapshot is deterministic');
  for(const aspect of [320/740,390/844]){
    assert.equal(orbit(aspect,.82,hero,guardian,true),0,
      'reduced-motion keeps the original steady physical view');
    assert.equal(orbit(aspect,0,hero,guardian,false),0,
      'undisclosed attention never creates a camera move');
    assert.equal(orbit(aspect,.30,hero,guardian,false),0,
      'the default look stays until actual witnessed attention is material');
  }
  for(const aspect of [844/390,1280/900,.2,NaN])
    assert.equal(orbit(aspect,.82,hero,guardian),0,
      'wide, invalid and undersized views retain prior camera choreography');
  assert.equal(orbit(390/844,.82,hero,{x:NaN,z:0}),0,
    'invalid or absent public guardian cannot stage a private view');
  assert.equal(JSON.stringify({hero,guardian}),before,
    'this camera-only actor reading never changes autonomous game truth');
});
