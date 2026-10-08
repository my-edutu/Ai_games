'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {deckLayout}=require('../../games/marble-survival/public/complete-runtime/arena-geometry.js');

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
