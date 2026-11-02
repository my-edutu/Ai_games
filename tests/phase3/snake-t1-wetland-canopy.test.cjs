'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const THREE=undefined;
const root=path.resolve(__dirname,'../..');
const blob=source=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
const worldSource=fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8');
const gardenSource=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
const start='      // BEGIN T1 WETLAND MASONRY PATINA\n';
const end='      // END T1 WETLAND MASONRY PATINA\n';
const gardenStart='  // BEGIN T1 LIVING WATER GARDEN\n';
const gardenEnd='  // END T1 LIVING WATER GARDEN\n';
function stripped(source,a,b) {
 const i=source.indexOf(a),j=source.indexOf(b);
 assert.ok(i>=0 && j>i && source.indexOf(a,i+1)===-1 && source.indexOf(b,j+1)===-1,'exactly one reversible authored landmark block');
 return source.slice(0,i)+source.slice(j+b.length);
}
test('T1 bounded live water-garden is RED on byte-exact previous head and GREEN after integration',async()=>{
 assert.equal(blob(stripped(worldSource,start,end)),'0f69c6ae6324d7fcfa6e0c1e9659fc4be37cc66d');
 const gardenBeforeAmphitheatre=stripped(stripped(gardenSource,
  '  // BEGIN T1 ESCARPMENT AMPHITHEATRE\n','  // END T1 ESCARPMENT AMPHITHEATRE\n'),
  '      // BEGIN T1 AMPHITHEATRE STATS\n','      // END T1 AMPHITHEATRE STATS\n');
 assert.equal(blob(stripped(stripped(gardenBeforeAmphitheatre,gardenStart,gardenEnd),
  '      // BEGIN T1 WATER GARDEN STATS\n', '      // END T1 WATER GARDEN STATS\n')),
  'bdfe91e5305bbe87f3d23d858e03e90b87c47159');
 const previousWorld=stripped(worldSource,start,end);
 const previousGarden=stripped(stripped(gardenBeforeAmphitheatre,gardenStart,gardenEnd),
  '      // BEGIN T1 WATER GARDEN STATS\n','      // END T1 WATER GARDEN STATS\n');
 const createPrevious=(await import('data:text/javascript;base64,'+Buffer.from(previousGarden).toString('base64'))).createLivingGarden;
 const three=await import('three');
 const oldWorld=(await import('data:text/javascript;base64,'+Buffer.from(previousWorld).toString('base64'))).createWorld;
 const newWorld=(await import('../../public/snake-stream/world.mjs')).createWorld;
 const beforeWorld=oldWorld(three,{width:28,height:16});
 const afterWorld=newWorld(three,{width:28,height:16});
 try{
  assert.deepEqual(beforeWorld.stats(),afterWorld.stats(),'original board mesh/texture, hazard and portal budgets remain unchanged');
  assert.deepEqual(beforeWorld.cameraOccluders,afterWorld.cameraOccluders);
  const field=g=>g.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024
   &&o.material.map.image.height===512);
  const original=field(beforeWorld),improved=field(afterWorld);
  assert.ok(original&&improved,'patina is baked on the real physical stone atlas');
  const a=original.material.map.image.data,b=improved.material.map.image.data;
  let meaningful=0,base=0,oldMean=0,newMean=0;
  for(let y=0;y<512;y+=3)for(let x=0;x<1024;x+=3){
   const gx=(x+.5)/1024*28,gz=(y+.5)/512*16;
   if(Math.min(gx,28-gx,gz,16-gz)<2.4)continue;
   const i=(y*1024+x)*4;
   for(let k=0;k<3;k++)assert.ok(b[i+k]<=a[i+k], 'no gameplay cue is brightened or occluded by fake overlay');
   oldMean+=(a[i]+a[i+1]+a[i+2])/3;newMean+=(b[i]+b[i+1]+b[i+2])/3;
   if(a[i]-b[i]>12)meaningful++;base++;
  }
  assert.ok(meaningful/base>.30,'large interior bedrock ecology must actually change');
  assert.ok((oldMean-newMean)/base>8,'full-floor color responds beyond a tiny edge tint');
  for(const name of ['position','normal','uv']){
   assert.deepEqual(original.geometry.getAttribute(name).array,improved.geometry.getAttribute(name).array,
    'physical gameplay surface stays byte-identical: '+name);
  }
  const publicFrame=Object.freeze({food:Object.freeze({cell:18}),hazards:Object.freeze([{cell:7,active:true}]),
   portals:Object.freeze([{entry:10,exit:21}]),obstacles:Object.freeze([])});
  const immutable=JSON.stringify(publicFrame);
  beforeWorld.update(publicFrame,{time:1,reducedMotion:false});
  afterWorld.update(publicFrame,{time:1,reducedMotion:false});
  assert.equal(JSON.stringify(publicFrame),immutable,'no authoritative snapshot mutation');
 }finally{beforeWorld.dispose();afterWorld.dispose();}
 const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const game=createLivingGarden(three,{width,height});
  const repeat=createLivingGarden(three,{width,height});
  const old=createPrevious(three,{width,height});
  try{
   const s=game.stats(),r=repeat.stats();
   assert.deepEqual(s,r,'public board dimension alone determines entire authored garden');
   assert.equal(s.meshCount,4,'water lilies and spring plants remain in original four render batches');
   assert.equal(s.textures,1,'no extra loaded, licensed or runtime-generated texture resources');
   assert.equal(s.waterGardenBeds,24,'coherent four-shore riparian sequence with identifiable clustering');
   assert.ok(s.waterGardenPads>=170,'broad true 3D floating leaf silhouettes, not a pixel recolor');
   assert.ok(s.waterGardenBlooms>=45,'actual petal anatomy occupies original foliage batch');
   assert.ok(s.waterGardenRushes>=48,'bank-to-water transition contains varied rooted emergent stems');
   assert.ok(s.triangles>=old.stats().triangles+2600&&s.triangles<22000,
    'large authored landscape gain against the exact source, not a texture-only change');
   const all=game.group.children;
   for(let meshIndex=0;meshIndex<all.length;meshIndex++){
    const mesh=all[meshIndex],b=repeat.group.children[meshIndex];
    assert.deepEqual(mesh.geometry.attributes.position.array,b.geometry.attributes.position.array);
    assert.deepEqual(mesh.geometry.attributes.color.array,b.geometry.attributes.color.array);
    assert.equal(mesh.castShadow,false,'no added expensive shadow map rebuilds');
    const p=mesh.geometry.getAttribute('position');
    for(let i=0;i<p.count;i++){
     const [x,y,z]=[p.getX(i),p.getY(i),p.getZ(i)];
     assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
     assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,
      'no false water lily overlaps authoritative grid');
     assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,
      'all original close-camera/fog budget bounds remain intact');
    }
   }
  }finally{game.dispose();repeat.dispose();old.dispose();}
  assert.equal(game.stats().disposed,true);
 }
});
