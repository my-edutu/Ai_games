'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('let compactOccupiedRoomStats=');
const end=source.indexOf('function compactHouse(',start);
function makeShell(){
 assert.ok(start>0&&end>start,'source contains the retained growing-home room');
 const data=[],quads=[];
 const api=new Function('data','quad','materialScope','MATERIAL','rgb','city',
  source.slice(start,end)+'return {renderCompactOccupiedRoomShell,getCompactOccupiedRoomAudit};')(
  data,(...args)=>{quads.push(args);for(let i=0;i<60;i++)data.push(0);},
  (_,f)=>f(),{PLASTER:1,STONE:2},v=>v,new Array(12).fill(null));
 return {data,quads,...api};
}
test('W433 grown homes use a hollow real room rather than duplicate opaque plaster and false doors',()=>{
 assert.match(source,/renderCompactOccupiedRoomShell\(x,y,z,w,d,jettySill-\.18,plaster\)/);
 assert.match(source,/renderCompactOccupiedRoomShell\(x,y,z,w,d,h-\.18,plaster\)/);
 assert.doesNotMatch(source,/box\(x,y\+\.18,z,w,jettySill-\.18,d,plaster\)/);
 assert.doesNotMatch(source,/box\(x,y\+\.20,face,\.51,1\.11,\.12,timber\)/);
 assert.match(source,/getInhabitedSkylineAudit,getOriginalOccupiedRoomAudit,getGranarySupplyAudit,getCompactOccupiedRoomAudit/);
});
test('W433 bounded two-sided original occupied rooms have genuine clear opposite entrances',()=>{
 const s=makeShell(),x=4,y=2,z=-3,w=2.5,d=2.2;
 const room=s.renderCompactOccupiedRoomShell(x,y,z,w,d,1.97,0xb9aa91);
 assert.equal(room.triangles,46);
 assert.equal(room.doorWidth,.76);
 assert.ok(Math.abs(room.doorHeight-1.72)<1e-9,'adult-clear grown-home doorway');
 assert.equal(room.passageFaces,2);
 assert.equal(s.quads.length,23);
 // No *full-height* original front/rear panel spans the centered doorway.
 for(const front of [z-d/2,z+d/2]){
  const low=y+.18,doorTop=low+1.72;
  const portalFace=s.quads.filter(q=>q.slice(0,4).every(p=>
   Math.abs(p[2]-front)<1e-9)&&
   Math.min(...q.slice(0,4).map(p=>p[1]))<doorTop-.01);
  assert.ok(portalFace.length>=4,'original outward and inward wall cheeks');
  assert.ok(portalFace.every(q=>{
   const xs=q.slice(0,4).map(p=>p[0]);
   return Math.max(...xs)<=x-.38+1e-9||
    Math.min(...xs)>=x+.38-1e-9;
  }),'the real passage is not filled by an opaque wall');
 }
 assert.equal(s.getCompactOccupiedRoomAudit().openPassages,2);
 assert.equal(s.getCompactOccupiedRoomAudit().newGpuBuffers,0);
 assert.equal(s.getCompactOccupiedRoomAudit().modifiedEconomy,false);
 assert.throws(()=>s.renderCompactOccupiedRoomShell(1,2,3,1,1,1,0),/dimensions invalid/);
});
test('W433 keep render code parseable and original authoritative economy untouched',()=>{
 for(const section of source.match(/<script>([\s\S]*?)<\/script>/g)||[])
  new Function(section.replace(/^<script>|<\/script>$/g,''));
 for(const fn of ['advanceRealGrainJourney','exportSnapshot','restoreSnapshot',
  'renderVerifiedHomeMeal','renderCottageHomecomingDoors'])
  assert.ok(source.includes('function '+fn+'('),fn);
});

// W435: this source-level red gate is paired with the actual retained shell.
// Both versions of the town must let adult citizens approach a genuinely open
// doorway; raising a false door texture alone does not meet this requirement.
test('W435 founding and grown tall cottages retain adult-clear real entrances and roof supports',()=>{
 const match=source.match(/const jettyRoom=h>2\.5,jettySill=([0-9.]+);/);
 assert.ok(match,'actual growing-house storey datum exists');
 const sill=Number(match[1]);
 assert.ok(sill>=2.15,'tall grown lower room remains human height');
 const grown=makeShell().renderCompactOccupiedRoomShell(4,2,-3,2.5,2.2,sill-.18,0xb9aa91);
 assert.ok(grown.doorHeight>=1.7&&grown.doorWidth>=.76);
 assert.match(source,/doorHeight=1\.72\*scale/,'founding doorway uses adult clearance');
 assert.match(source,/renderOriginalOccupiedRoomShell\(x,y,z,w,d,2\.0\*scale,scale,plasterTone\)/);
 const doors=source.slice(source.indexOf('function renderCottageHomecomingDoors('),source.indexOf('// W101: original working citizens'));
 assert.match(doors,/h=1\.72,w=\.70/,'actual swinging oak leaf occupies human-scale entry');
 assert.match(source,/const jettyRoom=h>2\.5,jettySill=2\.18/);
});

test('W436 growing settlement loft replaces the solid second-storey box with pierced real geometry',()=>{
 assert.match(source,/function renderCompactOccupiedUpperLoft\(/);
 assert.match(source,/renderCompactOccupiedUpperLoft\(x,y,z,w\+\.28,d\+\.36,jettySill,h-jettySill,plaster\)/);
 assert.doesNotMatch(source,/box\(x,y\+jettySill,z,w\+\.28,h-jettySill,d\+\.36,plaster\)/);
 assert.match(source,/getCompactOccupiedRoomAudit,getCompactUpperLoftAudit/);
 const a=source.indexOf('let compactUpperLoftStats='),
  b=source.indexOf('function compactHouse(',a);
 assert.ok(a>0&&b>a);
 const data=[],faces=[];
 const loft=new Function('data','quad','materialScope','MATERIAL','rgb',
  source.slice(a,b)+'return {renderCompactOccupiedUpperLoft,getCompactUpperLoftAudit};')(
   data,(...args)=>{faces.push(args);for(let i=0;i<60;i++)data.push(0)},
   (_,f)=>f(),{PLASTER:1,WOOD:2,WINDOW_GLOW:3},v=>v);
 const result=loft.renderCompactOccupiedUpperLoft(3,1,-2,3.0,2.5,2.18,1.2,0xeeeeee);
 assert.equal(result.triangles,54);
 assert.equal(result.windowApertures,2);
 assert.equal(result.changesWorldAuthority,false);
 assert.equal(result.extraGpuBuffers,0);
 assert.equal(loft.getCompactUpperLoftAudit().triangles,54);
 assert.equal(loft.getCompactUpperLoftAudit().instances,1);
 assert.equal(faces.length,27);
 assert.throws(()=>loft.renderCompactOccupiedUpperLoft(0,0,0,2,2,2,.3,0),/dimensions invalid/);
});
