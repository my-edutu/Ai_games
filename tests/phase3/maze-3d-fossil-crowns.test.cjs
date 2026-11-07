'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const url=n=>pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/'+n)).href;
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(src
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(url('gate-moment.mjs')))
  .replace("'./map-view.mjs'",JSON.stringify(url('map-view.mjs')))).toString('base64'));
const safe={cell:41,blocked:false,neighbors:[]};
const state=cells=>({runToken:'crown-1',width:7,height:9,currentCell:41,cells,
  visibleCells:cells.map(c=>c.cell),discoveredCells:cells.map(c=>c.cell),
  doors:[],keys:[],inventory:[],threats:[],exitCell:null});

test('public fossil crowns have sculpted second joints responding only to Pip, with privacy, reset and reduced motion',async()=>{
  const {createMazeWorld}=await modulePromise;
  const {Vector3}=await import(three);
  const world=createMazeWorld({balanced:true}), budget=world.stats();
  const published=state([safe]),unchanged=JSON.stringify(published);
  world.update(published);
  assert.equal(world.stats().tideFossilAlcoves,1);
  assert.equal(world.stats().responsiveFossilSails,2);
  const crowns=[];
  world.group.traverse(o=>{if(o.isGroup && o.name.startsWith('Disclosed fossil listening crown '))crowns.push(o)});
  assert.equal(crowns.length,2);
  for(const crown of crowns){
    assert.equal(crown.children.length,3,'each crown has exactly three physical articulated petals');
    const petals=crown.children;
    assert.ok(petals.every(p=>p.isGroup && p.name.startsWith('Disclosed fossil listening petal ')
      && p.children.length===1 && p.children[0].isMesh
      && p.children[0].geometry.type==='IcosahedronGeometry'
      && p.children[0].material && p.children[0].scale.y>=.40),
      'sculpted solid ceramic petals use installed Three geometry, not sprites or overlays');
    assert.ok(crown.parent.isGroup && crown.position.y>.75);
    const pose=o=>Math.max(Math.abs(o.rotation.x),Math.abs(o.rotation.z));
    world.animate(2,{reducedMotion:false,explorerPosition:new Vector3(200,0,200)});
    const distant=pose(crown),rootDistant=pose(crown.parent),farFan=pose(petals[0]);
    world.animate(2,{reducedMotion:false,explorerPosition:crown.parent.position.clone()});
    assert.ok(pose(crown)>distant+.50,'sculpted second hinge opens near the real public explorer');
    assert.ok(pose(crown.parent)>rootDistant+.20,'root hinge also opens physically');
    assert.ok(pose(petals[0])>farFan+.40,
      'third physical hinge spreads a real outer petal only when Pip approaches');
    assert.equal(pose(petals[1]),0,'centre ceramic petal remains a physical stabilizer');
    assert.ok(Math.abs(pose(petals[0])-pose(petals[2]))<1e-8,
      'two sculpted side petals spread symmetrically with existing pooled assets');
    world.animate(2,{reducedMotion:true,explorerPosition:crown.parent.position.clone()});
    assert.ok(Math.abs(pose(crown)-.10)<1e-8);
    assert.ok(Math.abs(pose(petals[0])-.11)<1e-8,
      'reduced motion also settles the new physical fan hinges');
  }
  assert.equal(JSON.stringify(published),unchanged);
  assert.equal(world.stats().geometryCount,budget.geometryCount);
  assert.equal(world.stats().materialCount,budget.materialCount);
  assert.equal(world.stats().textureCount,budget.textureCount);
  world.update(state([{...safe,trap:true}]));
  assert.equal(world.stats().responsiveFossilSails,0);
  world.update({...state([safe]),runToken:'crown-2'});
  assert.equal(world.stats().responsiveFossilSails,2);
  world.update({...state([]),runToken:'crown-3'});
  assert.equal(world.stats().responsiveFossilSails,0);
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
  assert.equal(world.stats().textureCount,0);
});
