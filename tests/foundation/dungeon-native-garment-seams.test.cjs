'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/cinematic-figure.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
test('ten genuine joint seams and four retired overstretched armor joins share the existing 14-slot renderer',async()=>{
 const {CINEMATIC_NATIVE_SEAMS:seams,CINEMATIC_ANATOMY_LINKS:legacy,CRITICAL_FIGURE_JOINTS}=await load();
 assert.equal(legacy.length,14);assert.equal(seams.length,14);
 assert.equal(seams.filter(p=>p.b===null).length,4);
 const joints=new Set(CRITICAL_FIGURE_JOINTS);
 const active=seams.filter(p=>p.b!==null);
 assert.equal(active.length,10);
 for(const p of active){assert.ok(joints.has(p.a));assert.ok(joints.has(p.b))}
 assert.equal(new Set(active.map(p=>p.a+'>'+p.b)).size,10);
});
test('original fitted cloth tolerates only anatomically plausible spans for all six character rigs',async()=>{
 const {planNativeGarmentSeam:plan}=await load();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const h=kind==='warden'?2.30:1.82;
  for(const profile of ['gambeson','collar','shoulder','sleeve','hip','legging']){
   const x=plan(.17*h/1.82,h,profile,kind);
   assert.equal(x.visible,true,kind+':'+profile);
   assert.ok(x.length<.24&&x.radiusX<=.20&&x.radiusZ<=.18);
   assert.equal(plan(.80*h/1.82,h,profile,kind).visible,false);
   assert.equal(plan(.02*h/1.82,h,profile,kind).visible,false);
  }
 }
 for(const bad of [NaN,Infinity,-Infinity,1,-1])assert.equal(plan(bad).visible,false);
 assert.equal(plan(.15,1.82,'retired').visible,false);
 assert.equal(plan(.15,1.82,'sleeve','unknown').visible,false);
 assert.equal(plan(.15,0,'sleeve').visible,false);
});
test('real native GLB bones, not detached armour pivots, own dynamic connected cloth on every rendered frame',()=>{
 const text=fs.readFileSync(source,'utf8');
 assert.match(text,/CINEMATIC_NATIVE_SEAMS\.forEach/);
 assert.match(text,/const a=joints\[from\],b=to\?joints\[to\]:null/);
 assert.doesNotMatch(text,/CINEMATIC_ANATOMY_LINKS\.forEach/);
 assert.match(text,/planNativeGarmentSeam\(length,recipe\.statureMeters,profile,recipe\.kind\)/);
 assert.match(text,/new T\.InstancedMesh\(bridgeGeometry,mat\.cloth,CINEMATIC_ANATOMY_LINKS\.length\)/);
 assert.match(text,/bridgeScale\.set\(plan\.radiusX,plan\.length,plan\.radiusZ\)/);
 assert.match(text,/if\(!a\?\.isBone\|\|!b\?\.isBone\)/);
 assert.doesNotMatch(text,/Math\.random|fetch\(|DungeonRuntime|https?:/);
});
