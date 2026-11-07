'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const file=path.join(root,'public/ai-dungeon/cinematic-figure.js');
async function load(){
 return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file)).toString('base64'));
}
test('M1 actually equips all six animated characters with prominent role-unique silhouettes',async()=>{
 const {planCinematicFigure,CRITICAL_FIGURE_JOINTS}=await load();
 const seen=new Set(),forms=new Set(['shield','crest','quiver','vane','circlet','banner']);
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const figure=planCinematicFigure(kind);
  const identity=figure.pieces.filter(p=>p.id.startsWith('identity-'));
  assert.equal(identity.length,kind==='warden'?3:2,kind);
  assert.ok(figure.statureMeters>=1.82);
  for(const p of identity){
   assert.ok(CRITICAL_FIGURE_JOINTS.includes(p.anchor),p.id+' native skeletal anchor');
   assert.ok(forms.has(p.shape),p.id+' original geometric identity');
   assert.ok(['metal','trim','cloth','leather'].includes(p.finish));
   assert.ok([p.x,p.y,p.z,p.sx,p.sy,p.sz].every(Number.isFinite));
   assert.ok(p.sx>0&&p.sy>0&&p.sz>0&&p.sy<2,'bounded equipment');
   assert.ok(!seen.has(p.id),'identity not copied across classes');
   seen.add(p.id);
  }
  assert.ok(identity.every(p=>CRITICAL_FIGURE_JOINTS.includes(p.anchor)),kind+' identity follows native animated bones');
  if(kind!=='ranger')assert.ok(identity.some(p=>p.anchor!=='chest'),'role identity includes animated head, arm or pelvis');
  // The ranger's arrows belong to the back-mounted quiver and its fletching:
  // they must move together on the same real torso joint, not float apart.
  else assert.ok(identity.every(p=>p.anchor==='chest'),'ranger fletching stays in the quiver');
 }
 assert.equal(seen.size,13);
});
test('M1 live scene keeps native skinned texture and uses the same rig for shield and weapon',()=>{
 const code=fs.readFileSync(file,'utf8');
 assert.match(code,/joints\[p.anchor\]\.attach\(mesh\)/);
 assert.match(code,/joints\[p.anchor\]\.attach\(anchor\)/);
 assert.match(code,/hand\.attach\(grip\)/);
 assert.match(code,/identityEquipmentPieces:/);
 assert.match(code,/forms\.shield=new T\.ExtrudeGeometry/);
 assert.match(code,/forms\.quiver=createHull/);
 assert.match(code,/forms\.banner=new T\.ExtrudeGeometry/);
 assert.match(code,/if\(keep\)\{obj\.userData\.cinematicBodyUnderlay=true;\}/);
 assert.doesNotMatch(code,/obj\.material=mat\.nativeSuit|Math\.random|fetch\(/);
});
