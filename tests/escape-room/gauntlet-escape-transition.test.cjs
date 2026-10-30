'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('three');
const {DEFAULT_ESCAPE_ROOM_CONFIG,parseEscapeRoomConfig,EscapeRuntime,buildEscapeRenderSnapshot}=require('../../dist/games/ai-escape-room/src/index.js');

function rendererClass(){
  const context=vm.createContext({window:{THREE},console});
  const root=path.resolve(__dirname,'../../public/ai-escape-room');
  for(const file of ['room3d-polish.js','mechanisms3d.js','scenery3d.js','archivist3d.js','room3d.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return context.window.EscapeRoom3D;
}
function exitAngle(Room,state){
  // Exercise the actual mesh builder/animator without constructing a GPU context.
  const room=Object.create(Room.prototype);room.state=state;room.geo=new Map();room.objectWorld=new Map();room.mode='room';room.reducedMotion=true;
  room.materials=Object.fromEntries(['dark','metal','brass'].map(name=>[name,new THREE.MeshStandardMaterial()]));
  room.dynamicRoot=new THREE.Group();
  const exit=room.makeExit(state.objects.find(object=>object.kind==='exit'));room.dynamicRoot.add(exit);
  room.animateMechanisms(16,0);
  const angle=exit.userData.exitHinge.rotation.y;
  room.dynamicRoot.traverse(node=>{if(node.geometry)node.geometry.dispose();});for(const value of room.geo.values())value.dispose();for(const value of Object.values(room.materials))value.dispose();
  return angle;
}

test('the physical exit stays open through the actual successful intermission and is closed before the exit action',()=>{
  const config=parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG,theme:'cipher-vault',difficulty:8,puzzleDepth:8,objectCount:36,decoyCount:5,hazardCount:2,maxTicks:2400,noProgressTicks:360,intermissionTicks:24});
  const runtime=EscapeRuntime.create({config,seed:'gauntlet-vault-reference-v1',runId:'gauntlet-terminal-transition',policy:'autonomous'});
  let ready,result;
  while(runtime.state.lifecycle==='running'){
    const step=runtime.step(),frame=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events);
    if(frame.progress.permille===1000&&frame.scene!=='result')ready=frame;
    if(frame.scene==='result')result=frame;
  }
  assert.equal(runtime.state.result.reason,'escape');assert.ok(ready);assert.ok(result);
  const step=runtime.step(),intermission=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events);
  assert.equal(intermission.scene,'intermission');assert.equal(runtime.state.result.reason,'escape');
  const Room=rendererClass();
  assert.ok(Math.abs(exitAngle(Room,ready))<.001,'all puzzles solved is not yet a confirmed escape');
  assert.ok(Math.abs(exitAngle(Room,result))>1,'confirmed escape must open the physical exit');
  assert.ok(Math.abs(exitAngle(Room,intermission))>1,'the confirmed escaped chamber must remain open while waiting for the next room');
});
