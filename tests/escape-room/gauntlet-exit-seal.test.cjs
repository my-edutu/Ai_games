'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),THREE=require('three');
const {EscapeRuntime,DEFAULT_ESCAPE_ROOM_CONFIG,buildEscapeRenderSnapshot}=require('../../dist/games/ai-escape-room/src/index.js');

test('the closed physical vault seals the passage aperture and an open door clears its center',()=>{
  const context=vm.createContext({window:{THREE},console}),root=path.resolve(__dirname,'../../public/ai-escape-room');
  for(const file of ['room3d-polish.js','mechanisms3d.js','scenery3d.js','room3d.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const runtime=EscapeRuntime.create({config:DEFAULT_ESCAPE_ROOM_CONFIG,seed:'physical-exit-seal',runId:'exit-seal',policy:'autonomous'});
  const room=Object.create(context.window.EscapeRoom3D.prototype);
  room.state=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),runtime.drainEvents());room.geo=new Map();
  room.materials=Object.fromEntries(['dark','metal','brass'].map(name=>[name,new THREE.MeshStandardMaterial()]));
  const exit=room.makeExit(room.state.objects.find(object=>object.kind==='exit'));
  exit.position.set(0,2.05,-6.25);exit.updateMatrixWorld(true);
  const blocked=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,0),new THREE.Vector3(0,0,-1)).intersectObject(exit,true).length>0;
  for(const x of [-1.08,-1.01,0,1.01,1.08])for(const y of [.25,1.8,3.25])assert.ok(blocked(x,y),`closed passage must be sealed at x=${x}, y=${y}`);
  exit.userData.exitHinge.rotation.y=-1.25;exit.updateMatrixWorld(true);
  assert.equal(blocked(0,1.8),false,'the fixed door frame must leave a real open passage after escape');
  exit.traverse(node=>{if(node.userData.sceneryBatch)node.geometry.dispose()});
  for(const geometry of room.geo.values())geometry.dispose();for(const material of Object.values(room.materials))material.dispose();
});
