'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),THREE=require('three');

test('desktop overview contains the complete actor at both wall workstations',()=>{
  const context=vm.createContext({window:{THREE},console});
  for(const file of ['room3d-polish.js','mechanisms3d.js','scenery3d.js','archivist3d.js','room3d.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../public/ai-escape-room',file),'utf8'),context);
  const Room=context.window.EscapeRoom3D,actor=context.window.EscapeArchivist.create();actor.setReducedMotion(true);
  const room=Object.create(Room.prototype);room.renderer={setSize(){}};room.camera=new THREE.PerspectiveCamera(46,1,.08,42);room.targetCamera=new THREE.Vector3();room.targetLook=new THREE.Vector3();room.mode='room';
  for(const aspect of [1.39,1.46,2.05]){
    room.canvas={getBoundingClientRect:()=>({width:aspect*700,height:700})};room.resize();
    room.camera.position.copy(room.targetCamera);room.camera.lookAt(room.targetLook);room.camera.updateMatrixWorld(true);
    for(const side of [-1,1]){
      actor.update(16,0,{runToken:'overview-framing',scene:'normal',avatar:{mode:'observing'},events:[],progress:{permille:0}},new THREE.Vector3(side*5.82,1.25,1.15));
      const box=new THREE.Box3().setFromObject(actor.group);
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const point=new THREE.Vector3(x,y,z).project(room.camera);
        assert.ok(Math.abs(point.x)<.98,`aspect ${aspect}, wall ${side}, horizontal ${point.x}`);
        assert.ok(Math.abs(point.y)<.98,`aspect ${aspect}, wall ${side}, vertical ${point.y}`);
        assert.ok(point.z>-1&&point.z<1);
      }
    }
  }
  actor.dispose();
});
