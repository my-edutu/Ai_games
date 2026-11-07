'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 source-before is the immutable exact original e121 whole world',()=>{
 const source=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-pre-basin-e121-world.mjs'),'utf8');
 assert.equal(gitBlob(source),'1f8466cbb2763eb6eae4037facfeaa6e8f68f7cf');
});

test('T1 three physically planted garden basins read as coherent living material across the TRUE complete playable board',async()=>{
 const THREE=await import('three');
 const before=(await import('../fixtures/snake-t1-pre-basin-e121-world.mjs')).createWorld;
 const after=(await import('../../public/snake-stream/world.mjs')).createWorld;
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const old=before(THREE,{width,height}),now=after(THREE,{width,height}),garden=createCourtyardEcology(THREE,{width,height,world:now});
  try{
   const tile=world=>world.group.children.find(m=>m.name==='Ruins / c3c4ad');
   const a=tile(old),b=tile(now);assert.ok(a&&b);
   assert.deepEqual(a.geometry.getAttribute('position').array,b.geometry.getAttribute('position').array,'all authentic playing cells, original stone heights, UVs and hazards untouched');
   assert.equal(a.geometry.getAttribute('color').count,b.geometry.getAttribute('color').count);
   assert.deepEqual(old.stats(),now.stats(),'no new render passes, textures, draw meshes or geometry');
   assert.equal(garden.stats().publicCellsMoved,0);assert.equal(garden.stats().textures,0);
   const pos=b.geometry.getAttribute('position'),beforeColor=a.geometry.getAttribute('color'),color=b.geometry.getAttribute('color');
   const bays=[0,0,0];let grove=0,bright=0,different=0;
   for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),r=color.getX(i),g=color.getY(i),blue=color.getZ(i);
    const oldR=beforeColor.getX(i),oldG=beforeColor.getY(i),oldB=beforeColor.getZ(i);
    if(Math.abs(r-oldR)+Math.abs(g-oldG)+Math.abs(blue-oldB)>.18)different++;
    if(g-r>.09 && g-blue>.06){grove++;const section=Math.max(0,Math.min(2,Math.floor((z/height+.5)*3)));bays[section]++;}
    if(Math.abs(x)<1.25&&Math.abs(z)<1.25&&r>.78&&g>.84)bright++;
   }
   assert.ok(grove>pos.count*.19,'foreground/midground planted forest must cover significant whole-frame visible court, not only perimeter');
   assert.ok(different>pos.count*.28,'must create truly broad material landscape, not one isolated tint');
   assert.ok(bays.every(x=>x>0),'garden basins span all three latitudinal stage sections');
   assert.ok(bright>30,'sunlit ancient centre stays a comprehensible real-game landmark');
   assert.ok(garden.stats().stoneAtlas.regraded,'same original forest atlas still owns the 3D course pigment');
  }finally{garden.dispose();old.dispose();now.dispose();}
 }
});

test('T1 original fern blades become broader leafy 3D foliage without entering real gameplay cell centres or adding triangles',async()=>{
 const THREE=await import('three'),{createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const ecology=createCourtyardEcology(THREE,{width,height});
  try{
   const s=ecology.stats(),p=ecology.group.children[0].geometry.getAttribute('position').array;
   const offset=(s.braidedSurfaceTriangles+s.islandSurfaceTriangles+s.reclaimedMosaicTriangles)*9;
   let area=0;
   for(let i=offset;i<p.length;i+=9){
    const x1=p[i],z1=p[i+2],x2=p[i+3],z2=p[i+5],x3=p[i+6],z3=p[i+8];
    area+=.5*Math.abs((x2-x1)*(z3-z1)-(z2-z1)*(x3-x1));
   }
   assert.ok(area/s.interstitialFernTriangles>.006,'grow a meaningful visible 3D leafy blade canopy, not imperceptible tuft wedges: '+area);
   assert.ok(s.fernCanopyHeight<=.185,'not allowed to hide genuine fruits, hazard/portal cues or serpent belly');
   assert.ok(s.triangles<3100);assert.equal(s.publicCellsMoved,0);assert.equal(s.meshCount,1);assert.equal(s.textures,0);
  }finally{ecology.dispose();}
 }
});
