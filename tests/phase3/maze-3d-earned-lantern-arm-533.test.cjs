'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const characters=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+
  Buffer.from(characters.replace("'./vendor/three.module.js'",JSON.stringify(three))).toString('base64'));

test('earned open-corridor lantern counter redirects Pip actual right shoulder and lamp; unknown/expired/reduced never do',async()=>{
  const {createExplorer,rigPrimitiveResourceStats}=await production;
  const pip=createExplorer({balanced:true});
  const shoulder=pip.group.getObjectByName('shoulder 1');
  const lamp=pip.group.getObjectByName('lantern cage');
  assert.ok(shoulder&&lamp,'must use physically connected original lantern-arm rig');
  const before=rigPrimitiveResourceStats().unique;
  const rootPosition=pip.group.position.clone();
  const base={heading:0,attentionHeading:0,attentionStrength:1,
    lanternParried:true,earnedCounterPhase:.42,guardianEncounterBeat:.85,
    time:3,delta:0,moving:false,danger:0,reducedMotion:false};
  const pose=changes=>{
    pip.update({...base,...changes});
    lamp.updateWorldMatrix(true,false);
    return {x:shoulder.rotation.x,y:shoulder.rotation.y,z:shoulder.rotation.z,
      lamp:lamp.getWorldPosition(shoulder.position.clone())};
  };
  try{
    const ordinary=pose({});
    const publicCorridor=pose({counterLanternTarget:{x:3,y:1.3,z:4}});
    assert.ok(publicCorridor.y>ordinary.y+.12,
      'one honestly witnessed rightward open corridor must steer the real lantern shoulder');
    assert.ok(Math.abs(publicCorridor.x-ordinary.x)>.15,
      'the actual arm must reach toward the public target, not merely turn its wrist');
    assert.ok(publicCorridor.lamp.distanceTo(ordinary.lamp)>.10,
      'the permanently modeled physical lamp must actually move with the earned pose');
    assert.deepEqual(pip.group.position.toArray(),rootPosition.toArray(),
      'presentation cannot move authoritative explorer root/collision');
    const cleared=pose({});
    assert.equal(cleared.x,ordinary.x);
    assert.equal(cleared.y,ordinary.y);
    assert.equal(cleared.z,ordinary.z);
    const unearned=pose({earnedCounterPhase:undefined,counterLanternTarget:{x:3,y:1.3,z:4}});
    const unearnedBaseline=pose({earnedCounterPhase:undefined});
    assert.equal(unearned.x,unearnedBaseline.x);
    assert.equal(unearned.y,unearnedBaseline.y);
    const reduced=pose({reducedMotion:true,counterLanternTarget:{x:3,y:1.3,z:4}});
    const reducedBaseline=pose({reducedMotion:true});
    assert.equal(reduced.x,reducedBaseline.x);
    assert.equal(reduced.y,reducedBaseline.y);
    const terminal=pose({result:'capture',counterLanternTarget:{x:3,y:1.3,z:4}});
    const terminalBaseline=pose({result:'capture'});
    assert.equal(terminal.x,terminalBaseline.x);
    assert.equal(terminal.y,terminalBaseline.y);
    const invalid=pose({counterLanternTarget:{x:NaN,y:1.3,z:4}});
    assert.equal(invalid.x,ordinary.x);
    assert.equal(invalid.y,ordinary.y);
    assert.equal(rigPrimitiveResourceStats().unique,before,
      'the counter cannot allocate new GPU geometry');
  }finally{pip.dispose();}
});
