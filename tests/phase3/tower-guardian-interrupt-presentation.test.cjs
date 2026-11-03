'use strict';
// Checks the actual shipped skinned 3D enemy and opt-in sound against fixed-step
// source fields. Passing does NOT imply a LOOKS/FEELS/PLAYS Gauntlet vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const threeUrl=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const source=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/characters.mjs'),'utf8');
const adapted=source.replace("'/tower/vendor/three.module.js'",JSON.stringify(threeUrl));
const modelPromise=import('data:text/javascript;base64,'+Buffer.from(adapted).toString('base64'));

test('real guardian bones and visor give a stable, comprehensible response to an interrupted attack',async t=>{
  const {createEnemy}=await modelPromise;
  const enemy=createEnemy('guardian');t.after(()=>enemy.dispose());
  const rootBone=enemy.group.getObjectByName('articulated-enemy');
  const maul=enemy.group.getObjectByName('1-shoulder');
  const knee=enemy.group.getObjectByName('1-knee');
  assert.ok(rootBone&&maul&&knee);
  const state={health:7,maxHealth:8,active:true,state:'standing',vx:0,vy:0,
    halfHeight:18000,telegraph:false,telegraphTicksRemaining:0,
    staggerTicksRemaining:0,canopyClearance:4.5};
  const before=JSON.stringify(state);
  enemy.animate(state,.05,0,{reducedMotion:true});
  const normal={height:rootBone.position.y,maul:maul.rotation.x,knee:knee.rotation.x};
  enemy.animate({...state,staggerTicksRemaining:9},.05,.05,{reducedMotion:true});
  const stagger={height:rootBone.position.y,maul:maul.rotation.x,knee:knee.rotation.x};
  assert.ok(stagger.height<normal.height-.07,'the guardian actually braces lower in 3D');
  assert.ok(stagger.maul>normal.maul+.13,'the original maul physically drops after a successful counter');
  assert.ok(stagger.knee>normal.knee+.30,'the articulated legs take the real interruption weight');
  enemy.animate({...state,staggerTicksRemaining:9},.05,10,{reducedMotion:true});
  assert.ok(Math.abs(rootBone.position.y-stagger.height)<1e-9,
    'reduced-motion retains a readable static interruption, no flicker');
  enemy.animate({...state,staggerTicksRemaining:0},.05,10.05,{reducedMotion:true});
  assert.equal(rootBone.position.y,normal.height,'source recovery restores the original supported stance');
  enemy.animate({...state,staggerTicksRemaining:9},.05,10.1,{reducedMotion:true,stale:true});
  assert.equal(rootBone.position.y,normal.height,'a stale snapshot cannot claim a live stun');
  assert.equal(JSON.stringify(state),before);
});

function fakeAudio(){
  const pitches=[];
  class Param{setValueAtTime(v){pitches.push(v)}setTargetAtTime(){}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
  class Node{connect(){}disconnect(){}start(){}stop(){}}
  class Context{
    constructor(){this.currentTime=0;this.state='running';this.destination=new Node()}
    createGain(){const n=new Node();n.gain=new Param();return n}
    createOscillator(){const n=new Node();n.frequency=new Param();return n}
    createDynamicsCompressor(){const n=new Node();n.threshold=new Param();n.ratio=new Param();return n}
    resume(){return Promise.resolve()}
    close(){return Promise.resolve()}
  }
  return{Context,pitches};
}
function audioFrame(tick,telegraph,stagger=0,runToken='source-run'){
  return{snapshot:{runToken,tick,floor:10,lifecycle:'running',theme:'foundry',
    player:{x:140000,y:900000,health:5,maxHealth:5,vx:0,vy:0,state:'standing',score:0},
    enemies:[{id:'f10:guardian',kind:'guardian',active:true,health:7,maxHealth:8,
      telegraph,telegraphTicksRemaining:telegraph?4:0,staggerTicksRemaining:stagger}],
    hazards:[],projectiles:[],intent:{mode:'bracing-telegraph'},
    progress:{floorsCleared:10}},audio:{voices:[],musicState:'guardian'}};
}
test('opt-in interruption sound requires witnessed adjacent guardian charge loss, not a repeated frame or fresh run',async()=>{
  const {createTowerAudio}=await import(pathToFileURL(path.join(root,'public/infinite-tower-climb/visuals/audio.mjs')).href);
  const {Context,pitches}=fakeAudio(),old=global.window;global.window={AudioContext:Context};
  const audio=createTowerAudio();
  try{
    await audio.setEnabled(true);
    audio.accept(audioFrame(20,true));
    const first=pitches.length;
    audio.accept(audioFrame(21,false,10));
    assert.ok(pitches.includes(510),'true source interruption gets its own restrained metal release');
    const n=pitches.length;assert.ok(n>first);
    audio.accept(audioFrame(21,false,10));
    assert.equal(pitches.length,n,'no repeated musical event for identical authority tick');
    audio.accept(audioFrame(22,false,9,'another-run'));
    assert.equal(pitches.length,n,'restart cannot fake a counter-shot');
    audio.setEnabled(false);
    audio.accept(audioFrame(23,true,0,'another-run'));
    audio.accept(audioFrame(24,false,10,'another-run'));
    assert.equal(pitches.length,n,'muted viewers are never forced to hear it');
  }finally{
    audio.dispose();if(old===undefined)delete global.window;else global.window=old;
  }
});
