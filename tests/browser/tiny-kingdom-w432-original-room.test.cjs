'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('let originalOccupiedRoomStats='),end=source.indexOf('function house(',start);
test('W432 real original room shells are present only in detailed existing homes',()=>{
 assert.ok(start>0&&end>start);
 assert.match(source,/renderOriginalOccupiedRoomShell\(x,y,z,w,d,1\.36\*scale,scale,plasterTone\)/);
 assert.match(source,/renderOriginalOccupiedRoomShell\(x,y,z,w,d,h-\.19\*scale,scale,plasterTone\)/);
 assert.doesNotMatch(source,/box\(x,y,z-d\/2-\.045\*scale,\.66\*scale,1\.25\*scale,\.085,rgb\(0x76523c\)\)/);
 assert.match(source,/getInhabitedSkylineAudit,getOriginalOccupiedRoomAudit,getGranarySupplyAudit/);
 assert.match(source,/function renderCottageHomecomingDoors\(\)/);
 assert.match(source,/function verifiedHouseholdMealEvidence\(person\)/);
});
function makeRoom(){
 const calls=[],data=[];
 const box=(...args)=>{calls.push(args);for(let i=0;i<360;i++)data.push(0);};
 const api=new Function('data','box','materialScope','MATERIAL','rgb',
  source.slice(start,end)+'return {renderOriginalOccupiedRoomShell,getOriginalOccupiedRoomAudit};'
 )(data,box,(_,f)=>f(),{PLASTER:1,STONE:2,WOOD:3},v=>v);
 return {calls,data,...api};
}
test('W432 daylight occupied doorway has real empty center and furnished room inside same footprint',()=>{
 const scene=makeRoom();
 const r=scene.renderOriginalOccupiedRoomShell(7,0,-4,2.7,2.5,1.36,1,0xc9b79c);
 assert.equal(r.triangles,132);
 assert.equal(scene.calls.length,11);
 assert.equal(r.doorWidth,.76);
 assert.equal(r.doorHeight,1.27);
 const openingFront=-4-2.5/2+.135/2;
 const tallFront=scene.calls.filter(c=>Math.abs(c[2]-openingFront)<1e-8&&c[4]>1.0);
 assert.equal(tallFront.length,2,'two original front wall leaves with no opaque full-height center');
 assert.ok(tallFront.every(c=>Math.abs(c[0]-7)>r.doorWidth/2));
 const lintel=scene.calls.find(c=>Math.abs(c[0]-7)<1e-9&&
  Math.abs(c[2]-openingFront)<1e-8&&Math.abs(c[3]-r.doorWidth)<1e-8);
 assert.ok(lintel&&lintel[1]>=.19+r.doorHeight-.001);
 assert.ok(scene.calls.every(c=>c.slice(0,6).every(Number.isFinite)));
 assert.ok(scene.calls.every(c=>c[3]>0&&c[4]>0&&c[5]>0));
 assert.ok(scene.calls.every(c=>Math.abs(c[0]-7)<=2.7/2+.1&&
  Math.abs(c[2]+4)<=2.5/2+.1),'all rendered fixtures remain in original occupied house');
 assert.equal(scene.getOriginalOccupiedRoomAudit().extraBuildings,0);
 assert.equal(scene.getOriginalOccupiedRoomAudit().authorityModified,false);
});
test('W432 tall detailed cottage keeps its original upper-storey joinery and bounded triangles',()=>{
 const s=makeRoom();
 const r=s.renderOriginalOccupiedRoomShell(-2,1,5,3.0,2.6,3.54,1,0xcabb97);
 assert.equal(r.triangles,132);
 assert.equal(s.getOriginalOccupiedRoomAudit().maxTrianglesPerHome,150);
 assert.throws(()=>s.renderOriginalOccupiedRoomShell(0,0,0,.6,1,.8,1,0),/dimensions invalid/);
 assert.throws(()=>s.renderOriginalOccupiedRoomShell(0,0,0,2.7,2.5,1.27,1,0),/doorway cannot fit/);
});
test('W432 all inline game JavaScript parses; original autonomy and snapshots stay',()=>{
 for(const section of source.match(/<script>([\s\S]*?)<\/script>/g)||[])
  new Function(section.replace(/^<script>|<\/script>$/g,''));
 assert.match(source,/function advanceRealGrainJourney\(\)/);
 assert.match(source,/function exportSnapshot\(\)/);
 assert.match(source,/function marketSupplyView\(\)/);
 assert.match(source,/function recallCivicCore\(key\)/);
});
