'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function importModule(name){const source=fs.readFileSync(path.join(root,'public/ai-dungeon',name),'utf8');return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))}
const MAP=[
'###########',
'#.........#',
'#.###.###.#',
'#.#.....#.#',
'#.#.###.#.#',
'#.........#',
'#.#.###.#.#',
'#.#.....#.#',
'#.###.###.#',
'#.........#',
'###########'
];
test('M1 sculptural stone shows physically raised original gothic lancet ribs INSIDE closed wall tile and remains one draw',async()=>{
 const {planFracturedWallStone}=await importModule('fractured-wall-plan.js');
 const p=planFracturedWallStone(3);
 assert.ok(p.archRibs>=4,'four original inward-tapered carved facades');
 assert.ok(p.vertices.length>240,'new actual 3D relief, not just a material tint');
 assert.ok(p.indices.length>360,'original arches integrated into the one stone mesh');
 assert.equal(p.uvs.length,p.vertices.length/3*2);
 assert.ok(p.indices.every(i=>i>=0&&i<p.vertices.length/3));
 for(let i=0;i<p.vertices.length;i+=3){assert.ok(p.vertices.slice(i,i+3).every(v=>Number.isFinite(v)&&Math.abs(v)<=.5+1e-6));}
 assert.deepEqual(p,planFracturedWallStone(3),'scene art deterministic and safe for replay');
});
test('real grid-adjacent wall junctions form open shoulder-height ruins with sparse authentic tall spires',async()=>{
 const {planLegibleWallMass,planDungeonWallProfiles}=await importModule('wall-profile-plan.js');
 const actual=planLegibleWallMass(MAP,3),profile=planDungeonWallProfiles(MAP,3);
 assert.equal(actual.length,profile.length);
 const junction=profile.map((x,i)=>({p:x,h:actual[i]})).filter(v=>v.p.exposedFaces>=2);
 assert.ok(junction.length>5);
 assert.ok(junction.every(v=>v.h>=.72&&v.h<=1.06),'low fractured galleries visibly mark solid cells without stacking over real hero');
 const single=profile.map((x,i)=>({p:x,h:actual[i]})).filter(v=>v.p.exposedFaces===1);
 assert.ok(single.some(v=>v.h>1.65),'occasional tall piers and distant Gothic backdrop remain');
 assert.ok(actual.every(h=>Number.isFinite(h)&&h>=.65&&h<=2.1));
});
test('one actual game renderer uses both original 3D stone ribs and varied mass in a single GPU batch',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/instance\(fracturedWall,stone,walls/);
 assert.match(app,/planLegibleWallMass\(s.map,s.floor,vaultedSites\)/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'public/ai-dungeon/fractured-wall-plan.js'),'utf8'),/Math\.random|Date\.|fetch\(/);
});
