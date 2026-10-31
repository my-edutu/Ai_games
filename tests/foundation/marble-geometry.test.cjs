'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {deckLayout,solidLineSegments}=require('../../games/marble-survival/public/complete-runtime/arena-geometry.js');

const arena=(hazards=[])=>({width:20000,height:14000,hazards});
const pit=(x,y,width,height)=>({kind:'pit',x,y,width,height,id:'pit'});
const covers=(t,x,y)=>x>=t.x&&x<t.x+t.width&&y>=t.y&&y<t.y+t.height;
const area=r=>r.width*r.height;
function verifyNoTileOverlaps(layout) {
  for(let i=0;i<layout.tiles.length;i++)for(let j=i+1;j<layout.tiles.length;j++){
    const a=layout.tiles[i],b=layout.tiles[j];
    const overlapX=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x);
    const overlapY=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
    assert.ok(overlapX<=0||overlapY<=0,`overlapping deck tiles ${i} ${j}`);
  }
}

test('no hazards yields one continuous deck and no fake holes',()=>{
  const layout=deckLayout(arena());
  assert.equal(layout.tiles.length,1);
  assert.equal(layout.openingArea,0);
  assert.equal(layout.solidArea,layout.worldArea);
});

test('single actual pit punches a physical opening into the 3D track',()=>{
  const hazard=pit(2000,4000,3600,1800);
  const layout=deckLayout(arena([hazard]));
  assert.equal(layout.openingArea,area(hazard));
  assert.equal(layout.solidArea+layout.openingArea,layout.worldArea);
  assert.ok(layout.tiles.length>1);
  assert.ok(!layout.tiles.some(t=>covers(t,3000,4400)));
  assert.ok(layout.tiles.some(t=>covers(t,3000,2000)));
  verifyNoTileOverlaps(layout);
});

test('multiple overlapping holes subtract their union exactly, not double-counted area',()=>{
  const hazards=[pit(2000,4000,3600,1800),pit(4000,5000,3600,1800)];
  const layout=deckLayout(arena(hazards));
  const overlap=(5600-4000)*(5800-5000);
  assert.equal(layout.openingArea,area(hazards[0])+area(hazards[1])-overlap);
  assert.equal(layout.solidArea+layout.openingArea,layout.worldArea);
  assert.ok(!layout.tiles.some(t=>covers(t,4800,5100)));
  verifyNoTileOverlaps(layout);
});

test('non-pit kill zones never create fake physical holes',()=>{
  const layout=deckLayout(arena([{kind:'kill-zone',x:2000,y:4000,width:3000,height:700}]));
  assert.equal(layout.openings.length,0);
  assert.equal(layout.tiles.length,1);
});

test('partial out-of-bounds pits are clipped and invalid geometry ignored',()=>{
  const layout=deckLayout(arena([
    pit(-1000,13000,3000,3000),
    pit(22000,1200,300,400),
    pit(0,0,-4,600),
    {kind:'pit',x:NaN,y:100,width:400,height:200},
  ]));
  assert.equal(layout.openingArea,2000*1000);
  assert.equal(layout.solidArea+layout.openingArea,layout.worldArea);
  verifyNoTileOverlaps(layout);
});

test('presentation planner does not mutate authoritative arena or hazards',()=>{
  const state=arena([pit(1000,1000,1000,1000)]);
  const original=JSON.stringify(state);
  const layout=deckLayout(state);
  assert.equal(JSON.stringify(state),original);
  assert.equal(Object.isFrozen(layout.tiles),false);
});

test('world dimensions must fail closed on invalid data',()=>{
  assert.throws(()=>deckLayout({width:0,height:100,hazards:[]}),RangeError);
  assert.throws(()=>deckLayout({width:Infinity,height:100,hazards:[]}),RangeError);
});

test('neon edge lights break around actual pit openings without building false bridges',()=>{
  const state=arena([pit(500,4000,900,2200)]);
  const strips=solidLineSegments(state,800,0,14000);
  assert.deepEqual(strips,[{start:0,end:4000},{start:6200,end:14000}]);
  assert.deepEqual(solidLineSegments(state,5000,0,14000),[{start:0,end:14000}]);
});

test('overlapping holes merge cleanly without zero-size or overlapping LED fragments',()=>{
  const state=arena([pit(500,3000,900,2400),pit(700,4500,1000,2500)]);
  assert.deepEqual(solidLineSegments(state,800,0,10000),[
    {start:0,end:3000},
    {start:7000,end:10000},
  ]);
  assert.deepEqual(solidLineSegments(state,800,3500,6500),[]);
  assert.deepEqual(solidLineSegments(state,800,15000,16000),[]);
});

test('LED segment planning tolerates reversed ranges and rejects malformed positions',()=>{
  const state=arena([pit(500,4000,900,2200)]);
  assert.deepEqual(solidLineSegments(state,800,14000,0),solidLineSegments(state,800,0,14000));
  assert.deepEqual(solidLineSegments(state,Number.NaN,0,14000),[]);
  assert.deepEqual(solidLineSegments(state,-1,0,14000),[]);
  assert.deepEqual(solidLineSegments(state,800,Infinity,14000),[]);
  assert.deepEqual(solidLineSegments(state,800,10,10),[]);
});

test('G47 elevated ramps cause real recessed industrial service-bay tiles without opening fake pits',()=>{
  const state=arena([]);
  state.ramps=[{id:'raised',x:7000,y:5000,width:3000,height:1500,axis:'y',
    startElevation:0,endElevation:1200}];
  const before=JSON.stringify(state);
  const layout=deckLayout(state);
  assert.equal(layout.openings.length,0);
  assert.equal(layout.openingArea,0,'a ramp is a physically supported lower deck, not a falling hole');
  assert.equal(layout.solidArea,layout.worldArea);
  assert.equal(layout.rampRegions.length,1);
  assert.ok(layout.tiles.some(tile=>tile.underRamp&&covers(tile,7600,5700)));
  assert.ok(layout.tiles.some(tile=>!tile.underRamp&&covers(tile,4000,5700)));
  assert.equal(JSON.stringify(state),before,'presentation may not mutate solver ramp configs');
  verifyNoTileOverlaps(layout);
});
test('G47 true pits always cut through elevated ramp rectangles without unsupported overlapping floor tiles',()=>{
  const state=arena([pit(7400,5700,1800,850)]);
  state.ramps=[{id:'raised',x:7000,y:5000,width:3000,height:1500,
    startElevation:300,endElevation:1300}];
  const layout=deckLayout(state);
  assert.ok(!layout.tiles.some(tile=>covers(tile,8000,6000)));
  assert.ok(layout.tiles.some(tile=>tile.underRamp&&covers(tile,7300,5200)));
  assert.equal(layout.openingArea,1800*850,'pit area remains exact despite ramp overlap');
  assert.equal(layout.solidArea+layout.openingArea,layout.worldArea);
  verifyNoTileOverlaps(layout);
});
