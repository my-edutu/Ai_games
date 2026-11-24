'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const linkedScene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const modulePromise=import('data:text/javascript;base64,'+
  Buffer.from(source.replace("'./vendor/three.module.js'",JSON.stringify(three)))
    .toString('base64'));
const publicCues=import('../../public/ai-maze-escape/public-lantern-encounter.mjs');

test('Pass430 one earned tracked public counter drives physical Pip windup, lantern thrust and recovery with no resources',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await modulePromise;
  for(const balanced of [true,false]){
    const pip=createExplorer({balanced});
    const body=pip.group.getObjectByName('breathing torso');
    const helmet=pip.group.getObjectByName('curious head');
    const lantern=pip.group.getObjectByName('lantern cage');
    const rightArm=pip.group.getObjectByName('shoulder 1');
    const leftArm=pip.group.getObjectByName('shoulder -1');
    assert.ok(body&&helmet&&lantern&&rightArm&&leftArm);
    const resources=rigPrimitiveResourceStats();
    const base={time:1,delta:0,moving:false,heading:0,
      attentionHeading:1,attentionStrength:.86,guardianEncounterBeat:undefined,
      lanternParried:true,danger:1,reducedMotion:false};
    const pose=(phase,other={})=>{
      pip.update({...base,earnedCounterPhase:phase,...other});
      return {height:body.position.y,pitch:body.rotation.x,
        leftX:leftArm.rotation.x,leftZ:leftArm.rotation.z,
        rightX:rightArm.rotation.x,rightZ:rightArm.rotation.z,
        head:helmet.rotation.x,lamp:lantern.scale.x,
        routeYaw:pip.group.rotation.y};
    };
    try{
      const idle=pose(null);
      const windup=pose(.20);
      const thrust=pose(.58);
      const recover=pose(1);
      assert.ok(windup.height<idle.height-.06,'connected torso loads against actual earned parry');
      assert.ok(windup.leftX<idle.leftX-.5,'free glove plants a readable opposite-hand guard');
      assert.ok(windup.leftZ<idle.leftZ-.45,'guard arm opens rather than overlapping lantern');
      assert.ok(thrust.height>idle.height+.10,'explorer rises in genuine counter-release');
      assert.ok(thrust.rightX<idle.rightX-.8,'connected lantern shoulder drives forward');
      assert.ok(thrust.rightZ>idle.rightZ+.5,'physical lantern becomes visible outside body');
      assert.ok(thrust.lamp>idle.lamp+.20,'same attached emissive lantern participates');
      assert.equal(thrust.routeYaw,idle.routeYaw,'AI heading and authoritative root never move');
      assert.deepEqual(recover,idle,'end of true event returns to exact stable public defense');
      assert.deepEqual(pose(.58,{lanternParried:false}),
        pose(null,{lanternParried:false}),'unearned counter cannot animate hero');
      assert.deepEqual(pose(.58,{reducedMotion:true}),
        pose(null,{reducedMotion:true}),'reduced motion has a stable real-event pose');
      assert.deepEqual(pose(.58,{result:'capture'}),
        pose(null,{result:'capture'}),'terminal result cancels the gesture');
      assert.deepEqual(pose(.58,{attentionHeading:undefined,attentionStrength:0}),
        pose(null,{attentionHeading:undefined,attentionStrength:0}),
        'hidden or withdrawn public actor cannot produce a stale thrust');
      assert.deepEqual(rigPrimitiveResourceStats(),resources,
        'all new acting reuses original GPU geometry and materials');
    }finally{pip.dispose()}
  }
});

test('Pass430 actual public source is the exclusive common clock for Pip and Thornback',async()=>{
  const {publicEarnedGuardianActing:acting}=await publicCues;
  const visible={lifecycle:'running',result:null,visibleCells:[74],
    threats:[{cell:74,lanternParried:true}]};
  const actor={cell:74,x:0,z:3,counterPhase:.58};
  const cue=acting(visible,actor,null);
  assert.equal(cue.counterPhase,.58);
  assert.equal(acting({...visible,visibleCells:[]},actor,null),null);
  assert.equal(acting({...visible,threats:[]},actor,null),null);
  assert.equal(acting(visible,{...actor,counterPhase:undefined},null).counterPhase,undefined,
    'first-seen already-parried warden cannot synthesize a recoil beat');
  const competing={cell:70,strength:1,lanternParried:false};
  assert.equal(acting(visible,actor,competing),competing,
    'a different real guardian outranks previously earned recoil');
  assert.ok(linkedScene.includes('previousWardenSnapshot?.runToken === snapshot.runToken'),
    'prior run cannot confer a new parry clock');
  assert.ok(linkedScene.includes('previouslyTracked && entry.lanternParried!==true'),
    'first-seen parried guardian cannot start a new physical response');
  assert.ok(linkedScene.includes('earnedCounterPhase:closestThreat?.counterPhase'),
    'Pip receives only the same public counter clock');
  assert.ok(linkedScene.includes('counterPhase:entry.counterSince!==null'),
    'source assignment must require tracked counter-start time');
});
