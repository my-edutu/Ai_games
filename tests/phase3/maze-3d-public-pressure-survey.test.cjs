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


test('the 390px genuine two-edge AI inspection earns a bounded shared 3D shot, never an invented public hazard',async()=>{
 const {publicPressureSurveySightline:survey,publicPressureInspectionTakesFocus:stage}=await cue;
 const s=setup(), sight=survey(s,32);
 const trap={cell:32,distance:2.4*Math.SQRT2,weight:.57};
 const before=JSON.stringify(s);
 const check=(snap=s,seen=sight,obj=trap,aspect=390/844,mode='follow',guardian=false,opening=false,pickup=false,reduced=false)=>
  stage(snap,32,seen,obj,2.4,aspect,mode,guardian,opening,pickup,reduced);
 assert.equal(check(),true,'native tick5 public reciprocal pressure jaw');
 assert.equal(check(s,sight,trap,320/740),false,'the earlier 320px no-crop contract is preserved');
 assert.equal(check(s,sight,trap,844/390),false);
 assert.equal(check(s,sight,trap,390/844,'overview'),false);
 assert.equal(check(s,sight,trap,390/844,'detail'),false);
 assert.equal(check(s,sight,trap,390/844,'follow',true),false,'guardian priority');
 assert.equal(check(s,sight,trap,390/844,'follow',false,true),false,'real gate priority');
 assert.equal(check(s,sight,trap,390/844,'follow',false,false,true),false,'key pickup priority');
 assert.equal(check(s,sight,trap,390/844,'follow',false,false,false,true),false,'reduce motion');
 assert.equal(check({...s,intent:{mode:'exploring'}}),false,'not an authentic inspection');
 assert.equal(check({...s,result:{reason:'capture'}}),false);
 assert.equal(check({...s,visibleCells:[23,24,25]}),false,'remembered trap');
 assert.equal(check({...s,visibleCells:[23,24,32]}),false,'missing corridor');
 assert.equal(check({...s,doors:[{a:25,b:32,open:false}]}),false,'sealed corridor');
 assert.equal(check({...s,cells:s.cells.map(x=>x.cell===25?{...x,neighbors:[24]}:x)}),false,'one-way link');
 assert.equal(check(s,{links:2,midCell:23}),false,'forged public survey flag');
 assert.equal(check(s,{links:1,midCell:null}),false,'forged direct passage');
 assert.equal(check(s,sight,{...trap,cell:31}),false,'wrong jaw');
 assert.equal(check(s,sight,{...trap,weight:0}),false);
 assert.equal(check(s,sight,{...trap,distance:Infinity}),false);
 assert.match(source,/publicPressureInspectionTakesFocus\(s,pressureCue\?\.cell,/,
  'the native camera must consume the actual witnessed inspection');
 assert.equal(JSON.stringify(s),before,'never mutate the public snapshot');
});
