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
 assert.match(source,/getOriginalOccupiedRoomAudit,getCompactOccupiedRoomAudit/);
});
test('W433 bounded two-sided original occupied rooms have genuine clear opposite entrances',()=>{
 const s=makeShell(),x=4,y=2,z=-3,w=2.5,d=2.2;
 const room=s.renderCompactOccupiedRoomShell(x,y,z,w,d,1.97,0xb9aa91);
 assert.equal(room.triangles,46);
 assert.equal(room.doorWidth,.76);
 assert.equal(room.doorHeight,1.26);
 assert.equal(room.passageFaces,2);
 assert.equal(s.quads.length,23);
 // No *full-height* original front/rear panel spans the centered doorway.
 for(const front of [z-d/2,z+d/2]){
  const low=y+.18,doorTop=low+1.26;
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
