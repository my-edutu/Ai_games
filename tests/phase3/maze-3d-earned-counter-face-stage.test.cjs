'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const camera=()=>({x:15,y:31,z:18});
const projected=(o,h,g)=>Math.abs((h.x-g.x)*o.z-(h.z-g.z)*o.x)/Math.hypot(o.x,o.z);
test('Pass518 actual public two-cell Pip/Thornback portrait earns consequential physical face-quarter',async()=>{
 const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
 const hero={x:-14.4,z:-9.6},guardian={x:-9.6,z:-9.6};
 for(const aspect of [320/740,390/844]){
   const o=camera(),before=projected(o,hero,guardian),r=Math.hypot(o.x,o.z);
   assert.equal(stage(o,aspect,hero,guardian,true,false),true);
   assert.ok(projected(o,hero,guardian)<before*.70,
     'must substantially compress the two genuine opposing full-body projections');
   const dx=hero.x-guardian.x,dz=hero.z-guardian.z;
   assert.ok((dx*o.x+dz*o.z)/(r*Math.hypot(dx,dz))>.84,
     'must face Thornback from a real 30-degree quarter, not a rear view');
   assert.ok(Math.abs(Math.hypot(o.x,o.z)-r)<1e-10);
   assert.equal(o.y,31,'do not pass through physical ground to fake visibility');
   const again=camera();stage(again,aspect,hero,guardian,true,false);
   assert.deepEqual(o,again);
 }
});
test('Pass518 no invented parry shot for unearned, reduced, landscape, desktop or invalid witnesses',async()=>{
 const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
 const hero={x:-14.4,z:-9.6},g={x:-9.6,z:-9.6};
 for(const [aspect,h,guardian,earned,reduced] of [
 [390/844,hero,g,false,false],[390/844,hero,g,true,true],
 [844/390,hero,g,true,false],[1280/900,hero,g,true,false],
 [320/740,{x:-9.25,z:-9.6},g,true,false],
 [390/844,{x:NaN,z:-9.6},g,true,false],[390/844,hero,null,true,false]
 ]){const o=camera();assert.equal(stage(o,aspect,h,guardian,earned,reduced),false);assert.deepEqual(o,camera());}
});

test('Pass521 real lantern impact reveals the complete source-earned face during the HUD hit, not half a second later',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const before=rigPrimitiveResourceStats();
  for(const balanced of [false,true]){
    const w=createWarden({balanced});
    try {
      const head=w.group.getObjectByName('warden mask');
      const fronds=w.group.getObjectByName('unfurled sea-glass wing fronds -1');
      const cheek=w.group.getObjectByName('articulated guardian facial shell -1');
      assert.ok(head&&fronds&&cheek);
      const originalShapes=new Set();
      w.group.traverse(n=>{if(n.geometry)originalShapes.add(n.geometry)});
      const base={...baseline,delta:0,viewerPosition:{x:10,z:10}};
      const pose=(phase,extra={})=>{
        w.update({...base,counterPhase:phase,...extra});
        return {scale:head.scale.x,y:head.position.y,z:head.position.z,
          pitch:head.rotation.x,yaw:head.rotation.y,
          cheek:Math.abs(cheek.rotation.y),frond:fronds.rotation.x};
      };
      const resting=pose(null),first=pose(.09),release=pose(.60);
      assert.ok(first.scale>1.26 && first.scale<=1.30,
        'actual counter-hit caption must coincide with a physically legible full mask');
      assert.ok(first.y>resting.y+.30 && first.z>resting.z+.30,
        'at the true hit the connected eye and jaw must already clear the existing shell');
      assert.ok(first.pitch<resting.pitch-.28,
        'face must look up on the actual impact, not after the player has moved');
      assert.ok(first.cheek>resting.cheek+.55 && first.frond< -1.12,
        'the original connected cheek/sea-glass armor must reveal real eyes immediately');
      assert.ok(first.yaw>resting.yaw+.12,
        'newly hit guardian must react toward the real scene camera on the impact');
      assert.ok(Math.abs(first.scale-release.scale)<.01,
        'early hit reaction must carry through the later genuine body recoil');
      const ended=pose(1);
      assert.deepEqual(ended,resting,'expired actual counter cannot keep a false facial performance');
      for(const override of [
        {lanternParried:false},{attentionStrength:0},
        {reducedMotion:true},{result:'escape'},{result:'capture'}
      ])assert.equal(pose(.09,override).scale,1,
        'unearned, unseen, reduced or ended encounters cannot enlarge the model');
      for(let run=0;run<6;run++){
        pose(.09);w.reset();
        assert.equal(head.scale.x,1,'fresh run must reset the exact actor face');
      }
      const finalShapes=new Set();
      w.group.traverse(n=>{if(n.geometry)finalShapes.add(n.geometry)});
      assert.deepEqual(finalShapes,originalShapes,'early 3D acting reuses original geometry');
    }finally{w.dispose()}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),before,
    'no leaked primitive buffers across the two rig qualities');
});
