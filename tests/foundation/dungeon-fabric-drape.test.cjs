'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/fabric-drape-plan.js');
const roles=['vanguard','ranger','mystic','revenant','cultist','warden'];
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

test('all six real GLB archetypes receive bounded, individually shaped, original woven fabric panels',async()=>{
 const {planDrapePanels}=await load();
 const signatures=new Set();
 for(const kind of roles){
  const panels=planDrapePanels(kind);
  assert.ok(panels.length>=2&&panels.length<=3,kind+' panel count');
  assert.ok(Object.isFrozen(panels),kind+' reusable immutable plan');
  assert.equal(new Set(panels.map(x=>x.id)).size,panels.length);
  assert.deepEqual(panels.map(p=>p.side).sort(),[-1,1],kind+' bilateral drape');
  signatures.add(panels.map(p=>[p.width,p.length,p.flare,p.color].join(':')).join('|'));
  for(const p of panels){
   assert.ok(Object.isFrozen(p),p.id+' immutable recipe');
   assert.match(p.color,/^#[0-9a-f]{6}$/i);
   assert.ok(p.shoulderY>=1.28&&p.shoulderY<=1.82);
   assert.ok(p.length>=.54&&p.length<=1.35);
   assert.ok(p.width>=.23&&p.width<=.64);
   assert.ok(p.flare>=.06&&p.flare<=.55);
   assert.ok(p.side===-1||p.side===1);
  }
 }
 assert.equal(signatures.size,roles.length,'real characters must not merely wear identical capes in different colors');
 for(const invalid of ['unknown','__proto__',null,undefined,{},''])assert.deepEqual(planDrapePanels(invalid),[]);
});

test('fabric secondary motion is finite, authored per action, safe for huge frame gaps, and neutral for reduced motion',async()=>{
 const {planDrapeSwing}=await load();
 for(const action of ['idle','move','attack','cast','hurt','guard','other'])
  for(const age of [-50,0,.1,.2,.32,.45,1,5,Infinity,NaN]){
   const p=planDrapeSwing(action,age,false);
   assert.ok(Number.isFinite(p.pitch)&&Number.isFinite(p.roll));
   assert.ok(Math.abs(p.pitch)<=.18&&Math.abs(p.roll)<=.10,action+' bounded fabric');
   assert.deepEqual(planDrapeSwing(action,age,true),{pitch:0,roll:0});
  }
 assert.ok(Math.abs(planDrapeSwing('move',.25).pitch-planDrapeSwing('idle',.25).pitch)>.04,'travel moves hem distinctly');
 assert.ok(planDrapeSwing('attack',.20).pitch>.08,'attack generates a single legible after-swing');
 assert.deepEqual(planDrapeSwing('attack',.8),{pitch:0,roll:0},'one-shot cloth settles without drift');
 assert.deepEqual(planDrapeSwing('cast',.8),{pitch:0,roll:0},'spell cloth also settles');
 assert.deepEqual(planDrapeSwing('move',.25),planDrapeSwing('move',.25));
 const code=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(code,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|localStorage|requestAnimationFrame/);
});

test('real WebGL rig owns the GPU resources, updates only presentation and exposes audited counts',()=>{
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const config=fs.readFileSync(path.join(root,'tests/browser/dungeon.playwright.config.cjs'),'utf8');
 assert.ok(src.includes("from '/dungeon/fabric-drape-plan.js'"));
 assert.match(src,/function addFabricDrape\(actor\)/);
 assert.match(src,/actor\.draperyPanels=/);
 assert.match(src,/addFabricDrape\(actor\)/);
 assert.match(src,/planDrapeSwing\(/);
 assert.match(src,/draperyActors:/);
 assert.match(src,/draperyPanels:/);
 assert.match(src,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 assert.ok(server.includes("['/dungeon/fabric-drape-plan.js','fabric-drape-plan.js']"));
 assert.ok(config.includes("'dungeon-fabric-drape.spec.cjs'"));
});
