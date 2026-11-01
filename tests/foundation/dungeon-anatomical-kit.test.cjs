'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/anatomical-kit-plan.js');
const kinds=['vanguard','ranger','mystic','revenant','cultist','warden'];
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'))}
test('six actual rig types get distinct original, layered anatomical gear instead of simple recolours',async()=>{
 const {planAnatomicalKit}=await load();const signatures=new Set();
 for(const kind of kinds){
  const recipe=planAnatomicalKit(kind);
  assert.ok(recipe.length>=10&&recipe.length<=18,kind+' bounded sculpted gear');
  assert.equal(new Set(recipe.map(p=>p.id)).size,recipe.length);
  assert.ok(recipe.some(p=>p.shape==='cuirass'||p.shape==='rib'),kind+' sculpted anatomy');
  assert.ok(recipe.some(p=>p.shape==='vambrace'||p.shape==='greave'),kind+' defined articulated limbs');
  assert.ok(recipe.some(p=>p.shape==='mask'||p.shape==='collar'),kind+' original readable head/neck treatment');
  signatures.add(recipe.map(x=>x.id).join('|'));
  for(const part of recipe){
   assert.ok(['cuirass','pauldron','vambrace','greave','fauld','mask','collar','rib','tabard'].includes(part.shape));
   assert.ok(['steel','bronze','bone','leather','textile'].includes(part.finish));
   assert.ok([part.x,part.y,part.z,part.sx,part.sy,part.sz,part.rz].every(Number.isFinite));
   assert.ok(Math.abs(part.x)<=.85&&part.y>=.20&&part.y<=2.20&&Math.abs(part.z)<=.65);
   assert.ok(part.sx>.015&&part.sx<=1.1&&part.sy>.015&&part.sy<=1.25&&part.sz>.015&&part.sz<=.65);
   assert.ok(Math.abs(part.rz)<=.85);
   assert.ok(Object.isFrozen(part));
  }
  assert.ok(Object.isFrozen(recipe));
  assert.equal(planAnatomicalKit(kind),recipe);
 }
 assert.equal(signatures.size,kinds.length);
 assert.deepEqual(planAnatomicalKit('none'),[]);
 assert.deepEqual(planAnatomicalKit(null),[]);
});
test('anatomy recipes cannot affect combat or require externally licensed art',()=>{
 const sourceText=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(sourceText,/Math\.random|Date\.|fetch\(|performance\.|DungeonRuntime|localStorage|\.glb|https?:/);
});
test('real asset rig mounts and disposes anatomy, with truthful diagnostics and public route',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(renderer,/import \{planAnatomicalKit\} from '\/dungeon\/anatomical-kit-plan\.js'/);
 assert.match(renderer,/function addAnatomicalKit\(actor\)/);
 assert.match(renderer,/addAnatomicalKit\(actor\)/);
 assert.match(renderer,/anatomicalDetailParts:/);
 assert.match(renderer,/actor\.anatomicalParts=plan\.length/);
 assert.match(renderer,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 assert.ok(host.includes("['/dungeon/anatomical-kit-plan.js','anatomical-kit-plan.js']"));
});