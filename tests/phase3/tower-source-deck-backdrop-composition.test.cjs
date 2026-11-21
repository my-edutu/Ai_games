'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=import(pathToFileURL(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/source-deck-backdrop-composition.mjs')).href);
const roof=3224000;
const s={floor:9,theme:'void',lifecycle:'running',runToken:'real',tick:490,
  worldWidth:480000,chunkBaseY:2880000,
  player:{x:320000,health:5},
  platforms:[{id:'f9:ground',y:3212000,height:12000,width:480000},
    {id:'f9:p2',x:310000,width:90000,y:3275000,height:12000},
    {id:'f9:p3',x:130000,width:70000,y:3310000,height:12000}]};
const h={runToken:'real',floor:9,sourceTick:475,guardianGateRetained:true,
  oldCapId:'f8:cap',oldRoofY:roof,originalGatewayOpacity:.8};
test('the source-authentic F9 deck silhouette has bounded actual 3D samples',async()=>{
  const {genuineRaisedDeckCorners,projectedRaisedDeckDominance}=await load;
  const decks=genuineRaisedDeckCorners(s,h,2.2,10000);
  assert.deepEqual(decks.map(d=>d.id),['f9:p2','f9:p3']);
  assert.equal(decks[0].points.length,12);
  const close=projectedRaisedDeckDominance(decks,p=>({x:p.x/28,y:p.y/43,z:.3}));
  const distant=projectedRaisedDeckDominance(decks,p=>({x:p.x/150,y:p.y/180,z:.3}));
  assert.ok(close.coverage>distant.coverage);
  assert.ok(close.coverage<=1);
  assert.equal(projectedRaisedDeckDominance(decks,()=>({x:0,y:0,z:2})).coverage,0);
});
test('unearned, mismatched or retired old gateway cannot trigger a backdrop camera orbit',async()=>{
  const {genuineRaisedDeckCorners}=await load;
  for(const [snapshot,held] of [[{...s,floor:10},h],[{...s,runToken:'other'},h],
    [s,{...h,guardianGateRetained:false}],[s,{...h,originalGatewayOpacity:0}],
    [s,{...h,oldRoofY:roof+1}],[{...s,player:{...s.player,health:0}},h],
    [{...s,platforms:s.platforms.slice(1)},h]]){
    assert.equal(genuineRaisedDeckCorners(snapshot,held,2.2,10000),null);
  }
});
