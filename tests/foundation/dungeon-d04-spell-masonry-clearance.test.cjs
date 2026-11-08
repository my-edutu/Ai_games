'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const load=()=>import(pathToFileURL(path.join(root,'occluded-projectile-path.js')).href);
const map=Array.from({length:9},()=>'.'.repeat(9));
const wall=map.map((row,z)=>z===5?row.slice(0,4)+'#'+row.slice(5):row);
const start=Object.freeze({x:-3,y:1.2,z:.44});
const end=Object.freeze({x:3,y:1.2,z:.44});

test('D04 larger actual spell mesh clips against stone where narrow arrow can safely pass',async()=>{
 const {planMapFlightClearance,D04_PROJECTILE_HALF_WIDTH_METERS,D04_SPELL_HALF_WIDTH_METERS}=await load();
 assert.ok(D04_SPELL_HALF_WIDTH_METERS>.09*.78*.84,
  'spell envelope must cover max rendered icosahedron radius');
 assert.ok(D04_SPELL_HALF_WIDTH_METERS>D04_PROJECTILE_HALF_WIDTH_METERS);
 const arrow=planMapFlightClearance(start,end,wall,'projectile');
 const spell=planMapFlightClearance(start,end,wall,'spell');
 assert.equal(arrow?.clipped,false,'arrow can safely graze within its narrower envelope');
 assert.equal(spell?.clipped,true,'same line with larger actual spell geometry must truncate');
 assert.ok(spell.travelMeters>1.9&&spell.travelMeters<2.2);
});
test('D04 spell bounds fail closed near the source; clear paths stay unchanged',async()=>{
 const {planMapFlightClearance}=await load();
 assert.equal(planMapFlightClearance({...start,x:-.6},end,wall,'spell'),null,
  'never spawn a bolt already overlapping masonry');
 assert.deepEqual(planMapFlightClearance(start,end,map,'spell'),
  {fraction:1,travelMeters:6,clipped:false});
 assert.equal(planMapFlightClearance(start,end,map,'unknown-effect'),null,
  'unknown wider mesh must not silently default to narrow arrow width');
});
test('D04 spell/arrow clearance does not mutate source map or endpoints',async()=>{
 const {planMapFlightClearance}=await load();
 const saved=wall.slice();
 const a=planMapFlightClearance(start,end,wall,'spell');
 const b=planMapFlightClearance(start,end,wall,'spell');
 assert.deepEqual(a,b);assert.ok(Object.isFrozen(a));
 assert.deepEqual(wall,saved);assert.deepEqual(start,{x:-3,y:1.2,z:.44});
 assert.deepEqual(end,{x:3,y:1.2,z:.44});
});
test('D04 stage requests correct public-map clearance envelope for each actual mesh',()=>{
 const source=fs.readFileSync(path.join(root,'physical-feedback-visuals.js'),'utf8');
 assert.match(source,/planMapFlightClearance\(start,terminal,map,type\)/);
});
