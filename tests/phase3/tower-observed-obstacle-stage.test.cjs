'use strict';
// Actual Three.js world + source event audio safety. NOT independent quality votes.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root=path.resolve(__dirname,'../..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tower-obstacle-stage-'));
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
const threeUrl=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const coordUrl=pathToFileURL(path.join(root,'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
const surfaceUrl=pathToFileURL(path.join(root,'public/infinite-tower-climb/visuals/world-surface.mjs')).href;
const file=path.join(temp,'world.mjs');
fs.writeFileSync(file,fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8')
  .replace("'/tower/vendor/three.module.js'",JSON.stringify(threeUrl))
  .replace("'./coordinates.mjs'",JSON.stringify(coordUrl))
  .replace("'./world-surface.mjs'",JSON.stringify(surfaceUrl)));
const loaded=Promise.all([import(threeUrl),import(pathToFileURL(file).href)]);
function snapshot({tick=100,runToken='runA',floor=3,active=true,deckX=160000}={}){
  const base=floor*360000;
  return Object.freeze({
    lifecycle:'running',tick,runToken,floor,theme:'storm',
    chunkBaseY:base,chunkHeight:360000,worldWidth:480000,
    platforms:[{id:'moving',kind:'moving',x:deckX,y:base+120000,width:100000,height:10000}],
    hazards:[{id:'risk',kind:'lightning',x:230000,y:base+118000,
      width:32000,height:9000,active}],
    enemies:[],player:{x:245000,y:base+135000,health:5},
  });
}
test('active physical danger survives mute/reduced motion but not stale snapshots',async()=>{
  const [THREE,{createTowerWorld}]=await loaded,world=createTowerWorld();
  try{
    const off=snapshot({active:false}),frozen=JSON.stringify(off);
    world.update(off,.05,5,{quality:'low'});
    const fins=world.group.getObjectByName('SourceObservedHazardPressureComb');
    assert.ok(fins?.isMesh && !fins.isInstancedMesh);
    assert.equal(fins.userData.activePressureTeeth,0);
    assert.equal(fins.scale.y,.10);
    world.update(snapshot({tick:101}),.05,5.05,{quality:'low'});
    assert.equal(fins.userData.activePressureTeeth,8);
    assert.ok(fins.scale.y>.55);
    assert.equal(fins.castShadow,false);assert.equal(fins.receiveShadow,false);
    assert.equal(fins.userData.collider,undefined);
    assert.equal(world.diagnostics().activeHazardPressureFins,8);
    world.update(snapshot({tick:102}),.05,5.1,{quality:'low',reducedMotion:true});
    const height=fins.scale.y;
    world.update(snapshot({tick:103}),.05,5.15,{quality:'low',reducedMotion:true});
    assert.equal(fins.scale.y,height);
    world.update(snapshot({tick:104}),.05,5.2,{quality:'low',stale:true});
    assert.equal(fins.userData.activePressureTeeth,0);
    assert.equal(JSON.stringify(off),frozen);
  }finally{world.dispose();}
});
test('real moving deck drives visual machinery without replay/time invention',async()=>{
  const [, {createTowerWorld}]=await loaded,world=createTowerWorld();
  try{
    world.update(snapshot({tick:20}),.05,1,{quality:'low'});
    const crank=world.group.getObjectByName('SourceObservedMovingDeckCrank');
    const countergear=world.group.getObjectByName('SourceObservedMovingDeckCountergear');
    const piston=world.group.getObjectByName('SourceObservedMovingDeckLoadPiston');
    assert.ok(crank?.isGroup && countergear?.isGroup && piston?.isGroup);
    assert.equal(crank.rotation.z,0);
    assert.equal(countergear.rotation.z,0);
    const restingY=piston.position.y;
    world.update(snapshot({tick:21,deckX:162000}),.05,1.05,{quality:'low'});
    assert.ok(crank.rotation.z>0);
    assert.ok(countergear.rotation.z<0,'real gear transfer counter-rotates');
    assert.ok(piston.position.y<restingY,'observed movement compresses piston');
    const observed=[crank.rotation.z,countergear.rotation.z,piston.position.y,piston.rotation.z];
    world.update(snapshot({tick:21,deckX:162000}),4,90,{quality:'low'});
    assert.deepEqual([crank.rotation.z,countergear.rotation.z,piston.position.y,piston.rotation.z],observed);
    world.update(snapshot({tick:22,deckX:164000}),.05,1.1,{quality:'low',reducedMotion:true});
    world.update(snapshot({tick:23,deckX:166000}),.05,1.15,{quality:'low',stale:true});
    assert.deepEqual([crank.rotation.z,countergear.rotation.z,piston.position.y,piston.rotation.z],observed);
    assert.equal(world.diagnostics().observedMovingDeckDriveLastTick,21);
    world.update(snapshot({tick:3,deckX:100000}),.05,0,{quality:'low'});
    assert.equal(crank.rotation.z,0);
    assert.equal(countergear.rotation.z,0);
    assert.equal(piston.rotation.z,0);
    assert.equal(piston.position.y,restingY);
    assert.equal(world.diagnostics().observedMovingDeckCranks,1);
    assert.equal(world.diagnostics().observedMovingDeckDriveStages,1);
    assert.equal(world.diagnostics().observedMovingDeckDriveLastTick,-1);
  }finally{world.dispose();}
});
test('opt-in nearby hazard cue requires inactive-to-active same-run source evidence',async()=>{
  const {createTowerAudio}=await import(pathToFileURL(path.join(root,
    'public/infinite-tower-climb/visuals/audio.mjs')).href);
  const pitches=[];
  class Param{setValueAtTime(v){pitches.push(v);}setTargetAtTime(){}
    linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
  class Node{connect(){}disconnect(){}start(){}stop(){}}
  class AudioContext{
    constructor(){this.currentTime=0;this.state='running';this.destination=new Node();}
    createGain(){const n=new Node();n.gain=new Param();return n;}
    createDynamicsCompressor(){const n=new Node();n.threshold=new Param();n.ratio=new Param();return n;}
    createOscillator(){const n=new Node();n.frequency=new Param();return n;}
    resume(){return Promise.resolve();}close(){return Promise.resolve();}
  }
  const oldWindow=global.window;global.window={AudioContext};
  const audio=createTowerAudio();
  function frame({tick=100,active=false,near=true,runToken='runA',floor=3}={}){
    const base=floor*360000;
    return {snapshot:{tick,runToken,floor,theme:'storm',lifecycle:'running',
      player:{x:245000,y:base+135000,health:5,score:0,vx:0,vy:0,state:'standing'},
      platforms:[],enemies:[],projectiles:[],intent:{mode:'aligning'},
      hazards:[{id:'risk',x:near?230000:10000,y:base+118000,
        width:32000,height:9000,active}]},audio:{voices:[],musicState:'danger'}};
  }
  try{
    assert.equal(await audio.setEnabled(true),true);
    audio.accept(frame());assert.equal(pitches.length,0);
    audio.accept(frame({tick:101,active:true,near:false}));
    assert.equal(pitches.length,0);
    audio.accept(frame({tick:102,active:false}));
    audio.accept(frame({tick:103,active:true}));
    assert.ok(pitches.includes(470));
    const count=pitches.length;
    audio.accept(frame({tick:103,active:true}));
    assert.equal(pitches.length,count);
    audio.accept(frame({tick:104,active:false}));
    audio.accept(frame({tick:105,active:true,runToken:'runB'}));
    assert.equal(pitches.length,count);
    audio.setEnabled(false);
    audio.accept(frame({tick:106,active:false,runToken:'runB'}));
    audio.accept(frame({tick:107,active:true,runToken:'runB'}));
    assert.equal(pitches.length,count);
  }finally{
    audio.dispose();
    if(oldWindow===undefined)delete global.window;else global.window=oldWindow;
  }
});