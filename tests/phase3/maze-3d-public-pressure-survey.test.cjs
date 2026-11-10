'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const cue=import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const c=(cell,neighbors,extra={})=>({cell,neighbors,blocked:false,...extra});
const setup=()=>({width:7,height:7,currentCell:24,lifecycle:'running',result:null,
  intent:{mode:'inspecting-hazard'},doors:[],visibleCells:[23,24,25,32],
  cells:[c(24,[23,25]),c(23,[24]),c(25,[24,32]),c(32,[25],{trap:true})]});
test('visible autonomous pressure survey bends only through public reciprocal unlocked tiles',async()=>{
  const {publicPressureSurveySightline:focus}=await cue;
  const s=setup(),frozen=JSON.stringify(s);
  assert.deepEqual(focus(s,32),{links:2,midCell:25});
  assert.equal(JSON.stringify(s),frozen);
  assert.equal(focus({...s,visibleCells:[23,24,25]},32),null,'remembered jaws');
  assert.equal(focus({...s,visibleCells:[23,24,32]},32),null,'unknown corridor');
  assert.equal(focus({...s,doors:[{a:25,b:32,open:false}]},32),null,'closed jaw edge');
  assert.equal(focus({...s,doors:[{a:24,b:25,open:false}]},32),null,'closed middle edge');
  assert.equal(focus({...s,cells:s.cells.map(x=>x.cell===25?{...x,blocked:true}:x)},32),null);
  assert.equal(focus({...s,cells:s.cells.map(x=>x.cell===25?{...x,neighbors:[24]}:x)},32),null);
  assert.equal(focus({...s,intent:{mode:'exploring'}},32),null,'false AI action');
  assert.equal(focus({...s,lifecycle:'intermission'},32),null);
  assert.equal(focus({...s,result:{reason:'capture'}},32),null);
  assert.equal(focus({...s,currentCell:23},32),null);
  assert.equal(focus({...s,cells:s.cells.map(x=>x.cell===32?{...x,trap:false}:x)},32),null);
  assert.deepEqual(focus({...s,visibleCells:[24,25],
    cells:[c(24,[25]),c(25,[24],{trap:true})]},25),{links:1,midCell:null});
  const alt=setup();alt.cells=[c(24,[25,31]),c(25,[24,32]),
    c(31,[24,32]),c(32,[25,31],{trap:true})];
  alt.visibleCells=[24,25,31,32];alt.doors=[{a:24,b:25,open:false}];
  assert.deepEqual(focus(alt,32),{links:2,midCell:31},'other genuine open intermediate');
});
test('source uses one shared-geometry physical cone per legal leg, cleans up and exposes native proof',()=>{
  assert.match(source,/publicPressureSurveySightline\(s,pressureCue\.cell\)/);
  assert.match(source,/lanternSurveyTurn=new THREE\.Mesh\(lanternBeamGeometry,lanternBeamMaterial\)/);
  assert.match(source,/placePublicSurveyCone\(\s*lanternSurveyTurn,lanternSurveyCorner,lanternBeamEnd\)/);
  assert.match(source,/lanternSurveyTurn\.visible=false/);
  assert.match(source,/scene\.remove\(lanternBeam,lanternSurveyTurn\)/);
  assert.match(source,/witnessedPressureSurveyLight:/);
});
