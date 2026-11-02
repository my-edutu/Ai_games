'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function planner(){
 const src=fs.readFileSync(path.join(root,'public/ai-dungeon/warden-chapter-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
test('sealed, rupture, eclipse and defeat physically transform one fixed court',async()=>{
 const {planWardenCourtChapter:f}=await planner();
 const a=f({guardianWard:true}),b=f({guardianWard:false}),c=f({phase:'RUPTURE',hp:120,maxHp:260}),d=f({phase:'ECLIPSE',hp:50,maxHp:260}),e=f({phase:'VANQUISHED',hp:0,maxHp:260});
 assert.equal(a.openness,0);assert.ok(b.openness>a.openness&&c.openness>b.openness&&d.openness>c.openness&&e.openness>=d.openness);
 assert.deepEqual(a,f({guardianWard:true}));
});
test('floor stones physically separate but remain under combatants; no fake collision',async()=>{
 const {planWardenCourtStone,planWardenRift,WARDEN_COURT_STONES,WARDEN_RIFT_SEGMENTS}=await planner();
 assert.equal(WARDEN_COURT_STONES,28);assert.equal(WARDEN_RIFT_SEGMENTS,18);
 for(let i=0;i<WARDEN_COURT_STONES;i++){
  const before=planWardenCourtStone(i,0),after=planWardenCourtStone(i,1);
  assert.ok(Object.values(after).every(Number.isFinite));
  assert.ok(after.y<.15&&Math.hypot(after.x-before.x,after.z-before.z)<.14);
 }
 for(let i=0;i<WARDEN_RIFT_SEGMENTS;i++){
  const p=planWardenRift(i,1);
  assert.ok(Object.values(p).every(Number.isFinite)&&Math.hypot(p.x,p.z)<2.5);
 }
});
test('original boss regalia follows actual phase and warning, never an unbounded silhouette',async()=>{
 const {planWardenRegaliaMotion:f}=await planner();
 assert.ok(f('left-pauldron','ECLIPSE',1).roll<0);
 assert.ok(f('ember-heart','ECLIPSE',1).scale<=1.30);
 assert.equal(f('ember-heart','SENTINEL',0,true).scale,1);
 assert.ok(f('crown-finial','ECLIPSE',0).y<0);
});
test('real Warden rig, world and restricted static route load the same physical chapter',()=>{
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 assert.match(read('public/ai-dungeon/warden-ritual.js'),/faultVoidMesh\.setMatrixAt/);
 assert.match(read('public/ai-dungeon/model-assets.js'),/planWardenRegaliaMotion/);
 assert.match(read('public/ai-dungeon/app.js'),/a\.wardenPhase=u\.kind==='warden'\?s\.bossPhase:null/);
 assert.ok(read('scripts/serve-dungeon-stream.cjs').includes("['/dungeon/warden-chapter-plan.js','warden-chapter-plan.js']"));
 assert.doesNotMatch(read('public/ai-dungeon/warden-chapter-plan.js'),/Math\.random|Date\.|fetch\(|DungeonRuntime|localStorage/);
});
