'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const begin=source.indexOf('function planOriginalOpenThreshold(');
const end=source.indexOf('function compactBurgageFrontage(',begin);
function getPlanner(){
 assert.ok(begin>0&&end>begin,'actual house threshold planner exists');
 return new Function(source.slice(begin,end)+'return planOriginalOpenThreshold;')();
}
test('W434 real founded AND growing homes have a physical unroofed doorway sightline',()=>{
 const plan=getPlanner();
 for(const width of [2.4,2.82,3.24,3.66]){
  const p=plan(width);
  assert.ok(p.clearWidth>=.96,'clear space across genuine .76m passage');
  assert.ok(p.clearWidth>p.doorWidth,'roof never cuts through the actual room');
  assert.ok(p.sideBayWidth>=.35,'each rain shelter is a real roof bay');
  assert.equal(p.untouchedHomeFootprint,true);
 }
 assert.throws(()=>plan(1.0),/dimensions invalid/);
 assert.throws(()=>plan(2.4,4.0),/dimensions invalid/);
});
test('W434 flanking canopy geometry replaces the obstructing spanning roofs in BOTH original render paths',()=>{
 const street=source.slice(source.indexOf('function medievalStreetMorphology('),source.indexOf('function cottageDetails('));
 const compact=source.slice(source.indexOf('function compactBurgageFrontage('),source.indexOf('function renderLivedBurgageSideMateriality('));
 assert.match(street,/W434 actual original threshold: no spanning central canopy/);
 assert.match(compact,/W434 physically clear compact portal/);
 assert.match(street,/const opening=planOriginalOpenThreshold\(w\)/);
 assert.match(compact,/const opening=planOriginalOpenThreshold\(w\)/);
 assert.doesNotMatch(street,/quad\(\[x-w\*\.36,e\+\.37,face\+\.05\]/);
 assert.doesNotMatch(compact,/quad\(\[x-\.83,low,outer\]/);
 for(const v of [street,compact]){
  assert.match(v,/const near=x\+side\*opening\.halfClear,far=x\+side\*opening\.halfOuter/);
  assert.match(v,/for\(const side of \[-1,1\]\)/);
 }
 assert.match(source,/renderCompactOccupiedRoomShell\(x,y,z,w,d,jettySill-\.18,plaster\)/);
 assert.match(source,/renderOriginalOccupiedRoomShell\(x,y,z,w,d,2\.0\*scale,scale,plasterTone\)/);
});
test('W434 original renderer and economic authority still parse and exist',()=>{
 for(const m of source.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);
 for(const name of ['advanceRealGrainJourney','exportSnapshot','restoreSnapshot',
  'renderVerifiedHomeMeal','renderCottageHomecomingDoors'])
  assert.ok(source.includes('function '+name+'('),name);
});
