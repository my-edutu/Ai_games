'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const BASE=path.join(ROOT,'public/infinite-tower-climb/visuals');
const planPromise=import(pathToFileURL(path.join(BASE,'void-open-deck-truss.mjs')).href);
const world=fs.readFileSync(path.join(BASE,'world.mjs'),'utf8');

test('real Floor9 raised platforms have connected underdeck supports and an open body-height view',async()=>{
  const {planVoidOpenDeckTruss}=await planPromise;
  for(const platform of [
    {id:'f9:p1',x:190000,width:62000,y:290000,height:12000},
    {id:'f9:p2',x:240000,width:88000,y:380000,height:12000},
    {id:'f9:p3',x:320000,width:100000,y:460000,height:12000},
  ]){
    const p=planVoidOpenDeckTruss(platform,480000);
    assert.ok(p,'genuine source deck must have an open steel truss');
    assert.equal(p.sourcePlatformId,platform.id);
    assert.equal(p.topFootprintUnchanged,true);
    assert.equal(p.nonColliding,true);
    assert.ok(p.radialOpenSpan>=3.5,'the opaque central undercroft must become genuine open air');
    assert.ok(p.innerRail[1]<p.outerRail[0]);
    assert.ok(p.anchors.length>=3 && p.anchors.length<=5);
    assert.ok(p.anchors.every(a=>Math.abs(a)<=p.angle*.43));
    for(let i=1;i<p.anchors.length;i++)assert.ok(p.anchors[i]>p.anchors[i-1]);
  }
});

test('original cap/ground, other floors and invalid platform geometry cannot borrow F9 truss plan',async()=>{
  const {planVoidOpenDeckTruss}=await planPromise;
  const good={id:'f9:p2',x:260000,width:90000,y:400000,height:8000};
  for(const bad of [
    {...good,id:'f9:ground'}, {...good,id:'f8:p2'},
    {...good,id:'f10:p2'}, {...good,id:'f9:boss'},
    {...good,x:-1}, {...good,x:470000}, {...good,width:0},
    {...good,y:Infinity},{...good,height:.7},
  ]) assert.equal(planVoidOpenDeckTruss(bad,480000),null);
  assert.equal(planVoidOpenDeckTruss(good,480000,0),null);
  assert.equal(planVoidOpenDeckTruss(good,480000,Infinity),null);
});

test('actual 3D platform meshes retain full playable top, source-owned camera ray materials and open bracing',()=>{
  assert.match(world,/planVoidOpenDeckTruss\(p,width,ARC\)/);
  assert.match(world,/const openVoidUndercroft=/);
  assert.match(world,/const outerUnder=mesh\(root,sector\(/);
  assert.match(world,/const innerUnder=mesh\(root,sector\(/);
  assert.match(world,/openVoidUndercroft\.anchors/);
  assert.match(world,/VoidOpenRaisedDeckTransverseTie/);
  assert.match(world,/VoidOpenRaisedDeckDiagonalLoadBrace/);
  assert.match(world,/sector\(22\.4,27\.18,angle,\.16\)/,
    'the original source walkable platform top must be unchanged');
  assert.match(world,/sourceOwnedUndercroft\.push\(/,
    'existing physically inspectable undercroft camera rays must survive');
});
