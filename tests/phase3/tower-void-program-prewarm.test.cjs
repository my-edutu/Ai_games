'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const file=pathToFileURL(path.join(__dirname,'../../public/infinite-tower-climb/visuals/void-program-prewarm.mjs')).href;
const load=()=>import(file);
function fakeThree(){
 const disposed=[];
 class Scene {constructor(){this.children=[];}add(o){this.children.push(o);}clear(){this.children=[];}}
 class BoxGeometry {dispose(){disposed.push('geometry');}}
 class MeshStandardMaterial {constructor(o){this.settings=o;}dispose(){disposed.push('material');}}
 class Mesh {constructor(g,m){this.geometry=g;this.material=m;}}
 class InstancedMesh extends Mesh {}
 return {Three:{Scene,BoxGeometry,MeshStandardMaterial,Mesh,InstancedMesh},disposed};
}
const src={floor:8,theme:'clockwork',lifecycle:'running',runToken:'exp-a',tick:30,player:{health:30}};
const opts={camera:'follow',stale:false,quality:'low'};
test('prewarms only a legitimate real Clockwork frame with one offscreen compile',async()=>{
 const {createTowerVoidProgramPrewarm}=await load();const {Three,disposed}=fakeThree();
 let releaseWork;let calls=0,observed;
 const renderer={compileAsync(stage,camera,live){calls++;observed={stage,camera,live};return new Promise(r=>{releaseWork=r;});}};
 const live={fog:{clone(){return {cloned:true};}}},camera={};
 const warm=createTowerVoidProgramPrewarm(Three,renderer,live,camera);
 assert.equal(warm.begin({...src,floor:7},opts),false);
 assert.equal(warm.begin(src,{...opts,stale:true}),false);
 assert.equal(warm.begin(src,opts),true);
 assert.equal(warm.begin(src,opts),false);
 assert.equal(calls,1);assert.equal(observed.live,live);assert.equal(observed.camera,camera);
 assert.equal(observed.stage.children.length,5);
 assert.equal(warm.diagnostics().phase,'compiling');
 warm.onSubmittedFrame({...src,floor:8});
 releaseWork();await new Promise(r=>setImmediate(r));
 assert.equal(warm.diagnostics().phase,'ready');
 assert.equal(disposed.length,0,'program references must persist before first real F9 submission');
 warm.onSubmittedFrame({...src,floor:9,tick:452});
 assert.equal(warm.diagnostics().phase,'released');
 assert.equal(disposed.length,5);
});
test('async GPU compile failure never fails authoritative gameplay',async()=>{
 const {createTowerVoidProgramPrewarm}=await load();
 const f=fakeThree();let rejectWork;
 const warm=createTowerVoidProgramPrewarm(f.Three,{compileAsync:()=>new Promise((_,reject)=>rejectWork=reject)}, {}, {});
 assert.equal(warm.begin(src,opts),true);
 warm.onSubmittedFrame({...src,floor:9});rejectWork(new Error('webgl compile failed'));
 await new Promise(r=>setImmediate(r));
 assert.equal(warm.diagnostics().phase,'failed-open');assert.equal(f.disposed.length,5);
});
test('source restart retires old asynchronous shader program owner',async()=>{
 const {createTowerVoidProgramPrewarm}=await load();const f=fakeThree();let finish;
 const warm=createTowerVoidProgramPrewarm(f.Three,{compileAsync:()=>new Promise(r=>finish=r)}, {}, {});
 assert.equal(warm.begin(src,opts),true);
 warm.onSubmittedFrame({...src,runToken:'exp-b',tick:1,floor:8});
 finish();await new Promise(r=>setImmediate(r));
 assert.equal(warm.diagnostics().phase,'released');assert.equal(f.disposed.length,5);
});
test('real scene wires graphics-loss cleanup and reports passive warmup status',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 assert.match(text,/createTowerVoidProgramPrewarm/);
 assert.match(text,/voidProgramPrewarm\.begin\(snapshot, options\)/);
 assert.match(text,/voidProgramPrewarm\.onSubmittedFrame\(snapshot\)/);
 assert.match(text,/voidProgramPrewarm\.dispose\(\)/);
 assert.match(text,/voidProgramPrewarm:\s*voidProgramPrewarm\.diagnostics\(\)/);
});
