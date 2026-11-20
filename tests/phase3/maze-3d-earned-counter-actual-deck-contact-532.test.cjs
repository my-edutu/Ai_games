'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('Pass532: real earned contact and landing lower all four articulated claw tips to the physical deck, then restore them',async()=>{
  const {Vector3}=await import(three);
  const {createWarden,rigPrimitiveResourceStats}=await load();
  const before=rigPrimitiveResourceStats();
  for(const balanced of [true,false]){
    const model=createWarden({balanced});
    try{
      const hips=[-1,1].flatMap(side=>[1,2].map(i=>({side,
        hip:model.group.getObjectByName('leg '+side+' '+i)})));
      assert.ok(hips.every(({hip})=>hip?.getObjectByName('claw knee')));
      // Move the actual public actor onto a raised visible tile: contact
      // must use its existing root deck, never an assumed world zero.
      model.group.position.y=2.75;
      const root=model.group.position.clone();
      const pose=(phase,extra={})=>{
        model.update({heading:0,attentionHeading:0,attentionStrength:1,
          encounterBeat:.85,lanternParried:true,counterPhase:phase,
          time:3,delta:0,moving:false,danger:0,reducedMotion:false,...extra});
        return hips.map(({side,hip})=>{
          const toe=hip.getObjectByName('claw knee').localToWorld(new Vector3(side*.16,-.70,.15));
          return {toeY:toe.y,hipY:hip.position.y};
        });
      };
      for(const phase of [.20,.83]){
        const feet=pose(phase);
        for(const foot of feet){
          assert.ok(Math.abs(foot.toeY-(root.y+.055))<.13,
            'both connected middle/rear toe pairs must touch the actual elevated deck during load/landing');
        }
      }
      // A REAL airborne rebound retains articulation rather than pinning all
      // six legs to a fake floor every frame.
      assert.ok(pose(.53).some(foot=>foot.toeY>root.y+.30));
      assert.deepEqual(model.group.position.toArray(),root.toArray(),
        'guardian navigation/collision root remains authoritative');
      const clockless=pose(null);
      for(const flags of [{reducedMotion:true},{lanternParried:false},
        {attentionStrength:0},{result:'escape'},{result:'capture'}]){
        pose(.20,flags);
        const neutral=pose(null,flags);
        assert.ok(neutral.every(({hipY})=>Math.abs(hipY+.09)<1e-12),
          'unearned and reduced-motion clocks cannot retain planted sockets');
      }
      assert.deepEqual(pose(1),clockless,'expired hit clears all physical toe corrections');
      model.reset();
      assert.ok(hips.every(({hip})=>Math.abs(hip.position.y+.09)<1e-12));
    }finally{model.dispose();}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),before,
    'real toe planting reuses all existing geometry and materials');
});
