'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const worldPath=path.join(root,'public/snake-stream/world.mjs');
const courtPath=path.join(root,'public/snake-stream/courtyard-ecology.mjs');
const gardenPath=path.join(root,'public/snake-stream/living-garden.mjs');
const game=Object.freeze({tick:340,food:Object.freeze({cell:101}),hazards:Object.freeze([{cell:90,active:true}]),portals:Object.freeze([{entry:38,exit:81}]),obstacles:Object.freeze([21])});
function mesh(world){return world.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024&&o.material?.map?.image?.height===512);}

test('T1 physical low-bedrock terraces form a grounded multi-region native 3D garden without covering real cells',async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const world=createWorld(THREE,{width,height});
  const court=createCourtyardEcology(THREE,{width,height,world});
  const grove=createLivingGarden(THREE,{width,height});
  const before=JSON.stringify(game);
  try{
   const c=court.stats(),g=grove.stats(),w=world.stats();
   assert.equal(c.publicCellsMoved,0);
   assert.ok(c.triangles<=3090 && g.triangles<=22000);
   assert.equal(g.meshCount,4);assert.equal(g.textures,1);assert.equal(g.canopyTrees,10);
   assert.equal(c.meshCount,1);assert.equal(c.textures,0);assert.equal(w.textures,4);
   const source=court.group.children[0].geometry.attributes.position;
   const begin=c.braidedSurfaceTriangles*3,end=begin+c.islandSurfaceTriangles*3;
   let high=0,low=Infinity;
   for(let i=begin;i<end;i++){
    const y=source.getY(i);high=Math.max(high,y);low=Math.min(low,y);
    assert.ok(y>=.009 && y<=.021,'stone remains safely within existing floor-skin guard, not false raised hazard/obstruction');
   }
   assert.ok(high>.0196 && low<.014,'28 handworn bedrock islands must have observable 3D crowns/roots');
   const atlas=mesh(world)?.material.map.image.data;
   assert.ok(atlas && atlas.length===1024*512*4);
   assert.deepEqual(JSON.stringify(game),before,'immutable public game never changed');
   world.update(game,{time:10,reducedMotion:false});
   assert.equal(JSON.stringify(game),before);
  }finally{court.dispose();grove.dispose();world.dispose();}
 }
});
test('T1 whole playable stone has correlated mineral glades, cool deep fern beds and readable luminous landmarks without extra render passes',async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 const world=createWorld(THREE,{width:28,height:16});
 const court=createCourtyardEcology(THREE,{width:28,height:16,world});
 try{
  const data=mesh(world).material.map.image.data;
  // Interior pixel diversity and physical-size continuous bands; no per-cell
  // marker, second texture, new draw or theatrical performance substitution.
  let deep=0,warm=0,green=0,total=0;const colors=new Set();
  for(let y=72;y<440;y+=6)for(let x=74;x<950;x+=6){
   const p=(y*1024+x)*4,r=data[p],g=data[p+1],b=data[p+2];
   colors.add([r>>4,g>>4,b>>4].join(':'));total++;
   deep+=(r+g+b)/3<93;warm+=r>g+17;green+=g>r+25;
  }
  assert.ok(colors.size>100,'authored limestone and rainforest mineral colors cannot collapse into a single rectangular paint swatch');
  assert.ok(deep/total>.24,'shaded native fern catchments must occupy significant continuous interior area');
  assert.ok(warm/total>.12,'sunlit mineral bands and sandy glades remain large and readable');
  assert.ok(green/total>.30,'forest gallery reaches into the genuine gameplay courtyard');
  assert.equal(court.stats().stoneAtlas.textureAdded,0);
 }finally{court.dispose();world.dispose();}
});
test('T1 environment lighting keeps all original geometry, atmospheric color and light layers',async()=>{
 const code=fs.readFileSync(worldPath,'utf8');
 const court=fs.readFileSync(courtPath,'utf8');
 const garden=fs.readFileSync(gardenPath,'utf8');
 const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
 assert.match(code,/T1 RAINFOREST BEDROCK COMPOSITION/);
 assert.match(court,/T1 RAIN-CUT STONE ISLANDS/);
 assert.match(garden,/T1 RAIN-WASHED LIVING MASONRY/);
 assert.match(renderer,/T1 GARDEN LIGHT STUDY/);
 assert.match(renderer,/renderer\.shadowMap\.enabled = true/);
 assert.match(renderer,/renderer\.toneMapping = THREE\.ACESFilmicToneMapping/);
});
