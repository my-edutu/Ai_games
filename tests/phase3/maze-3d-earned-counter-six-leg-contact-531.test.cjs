'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const productionSource=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=()=>import('data:text/javascript;base64,'+
  Buffer.from(productionSource.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('Pass531: true lantern parry plants six limbs, carries them through one recoil and lands without moving patrol root',async()=>{
  const {createWarden,rigPrimitiveResourceStats}=await production();
  const before=rigPrimitiveResourceStats();
  for(const balanced of [true,false]){
    const w=createWarden({balanced});
    try{
      const body=w.group.getObjectByName('armored body');
      const pairs=[-1,1].flatMap(side=>[1,2].map(index=>{
        const hip=w.group.getObjectByName('leg '+side+' '+index);
        assert.ok(hip?.parent===body,'middle/rear articulated hip must stay connected');
        const knee=hip.getObjectByName('claw knee');
        assert.ok(knee?.parent===hip,'knee must remain physical child of hip');
        return {side,index,hip,knee};
      }));
      const rootPosition=w.group.position.clone();
      const pose=(phase,extra={})=>{
        w.update({heading:0,attentionHeading:0,attentionStrength:1,
          encounterBeat:.85,lanternParried:true,counterPhase:phase,
          time:3,delta:0,moving:false,danger:0,reducedMotion:false,...extra});
        return {height:body.position.y,
          legs:pairs.map(p=>({splay:Math.abs(p.hip.rotation.z),
            hip:p.hip.rotation.x,knee:p.knee.rotation.x}))};
      };
      const contact=pose(.20),airborne=pose(.53),landed=pose(.83);
      assert.ok(contact.height>.70&&contact.height<.98,
        'true first lantern impact must visibly plant the modeled body rather than hover');
      assert.ok(airborne.height>contact.height+.70,
        'connected guardian must execute a genuine rebound before landing');
      assert.ok(landed.height>.70&&landed.height<1.02
        &&airborne.height>landed.height+.70,
        'physical guardian must land after rebound, not float through retreat');
      for(let i=0;i<pairs.length;i++){
        assert.ok(contact.legs[i].splay>.20&&contact.legs[i].knee>.12,
          'middle and hind limbs must bear real impact load');
        assert.ok(landed.legs[i].splay>.30&&landed.legs[i].knee>.15,
          'both rear body pairs must replant on landing');
        assert.ok(airborne.legs[i].hip>contact.legs[i].hip+.40,
          'each articulated middle/rear limb must tuck during the actual launch');
      }
      assert.deepEqual(w.group.position.toArray(),rootPosition.toArray(),
        'authentic navigation/root is never modified by animation');
      const noClock=pose(null),spent=pose(1);
      assert.deepEqual(spent,noClock,'expired clock cannot leave a ghost grounded pose');
      for(const flags of [{reducedMotion:true},{lanternParried:false},
        {attentionStrength:0},{result:'escape'},{result:'capture'}]){
        assert.deepEqual(pose(.20,flags),pose(null,flags),
          'unearned, unknown, terminal, reduced-motion source cannot stage a parry');
      }
      w.reset();
      for(const p of pairs){
        assert.equal(p.hip.rotation.z,0,'reset clears every planted support');
        assert.equal(p.knee.rotation.x,0,'reset clears every source-clock knee action');
      }
    }finally{w.dispose();}
  }
  assert.deepEqual(rigPrimitiveResourceStats(),before,
    'all shared geometry ownership must survive both rigs and repeated updates');
});
