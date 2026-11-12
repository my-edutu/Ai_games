'use strict';
// P0 original Floor8→9 visual seam: a new actual Floor9 supported path,
// never a carried obsolete Floor8 collider, future step, or review vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76),x=gate+13000;
const y=cap.y+cap.height+14000;
function frames(){
  const previous={runToken:'film-authenticated',floor:8,tick:450,lifecycle:'running',
    guardianExitX:gate,worldWidth:480000,chunkBaseY:2880000,platforms:[cap],
    enemies:[{kind:'guardian',floor:8,active:false,health:0}],
    player:{health:4,x,y,halfWidth:9000,halfHeight:14000,grounded:true,
      groundedPlatformId:'f8:cap'}};
  const next={runToken:'film-authenticated',floor:9,tick:451,lifecycle:'running',
    chunkBaseY:2880000,worldWidth:480000,
    platforms:[{id:'f9:ground',x:0,y:cap.y,width:480000,height:cap.height}],
    enemies:[],player:{...previous.player,groundedPlatformId:'f9:ground',health:5}};
  return [previous,next];
}
test('only exact witnessed grounded Floor8→9 source can place 12 successor ground treads',async()=>{
  const {observedFloorNineRunway}=await source;
  const [old,next]=frames(),before=JSON.stringify([old,next]);
  const path=observedFloorNineRunway(old,next);
  assert.deepEqual(path,{fromX:gate,toX:x+65000,top:cap.y+cap.height,
    floor:9,runToken:next.runToken,sourceTick:451});
  assert.equal(JSON.stringify([old,next]),before,'source is immutable');
  const invalid=[
    [{...old,floor:7},next],
    [old,{...next,floor:10}],
    [old,{...next,runToken:'another-run'}],
    [old,{...next,tick:450}],
    [old,{...next,chunkBaseY:null}],
    [old,{...next,worldWidth:0}],
    [old,{...next,player:{...next.player,x:x+19000}}], // Impossible >18k per fixed step; source must never teleport
    [old,{...next,player:{...next.player,grounded:false}}],
    [old,{...next,player:{...next.player,groundedPlatformId:'f9:p2'}}],
    [{...old,enemies:[]},next],
    [{...old,enemies:[{kind:'guardian',active:true,health:1}]},next],
    [old,{...next,platforms:[{...next.platforms[0],y:cap.y+1000}]}],
    [old,{...next,platforms:[{...next.platforms[0],x:x+10000}]}],
  ];
  for(const [a,b] of invalid) assert.equal(observedFloorNineRunway(a,b),null);
});
test('renderer consumes the source continuation without introducing a fake level, clock, or extra effects system',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const passage=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/guardian-passage.mjs'),'utf8');
  assert.match(scene,/passage\.trackSuccessor\(next, options\.stale\)/);
  assert.match(passage,/if\(carryRealThreshold\) placeSuccessorRunway\(previous,source,anchor\)/);
  assert.match(passage,/const route = observedFloorNineRunway\(previous, next\)/);
  assert.match(passage,/pointFor\(x,route\.top\+500,next\.chunkBaseY,next\.worldWidth,26\.35\)/);
  assert.doesNotMatch(passage,/next\.floor\s*=|source\.player\.x\s*=/);
});
