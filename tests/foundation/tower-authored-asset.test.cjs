'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const THREE=require('three');
const base=path.resolve(__dirname,'../../public/infinite-tower-climb');
const asset=JSON.parse(fs.readFileSync(path.join(base,'assets/expedition-climber.gltf'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(base,'assets/manifest.json'),'utf8'));
test('first-party GLTF exists with six real animation tracks and independent elbow/knee hierarchy',()=>{
 assert.equal(manifest.characterModel,'expedition-climber.gltf');
 assert.ok(manifest.licenseNotices[0].includes('original'));
 const names=asset.animations.map(x=>x.name);
 assert.deepEqual(names,['Idle','Running','Jump','Fall','Climb','Punch']);
 assert.ok(asset.nodes.length>=35,'full articulated hierarchy');
 const labels=asset.nodes.map(x=>x.name);
 for(const suffix of ['Left','Right'])for(const bodyPart of ['Elbow','Knee'])
   assert.ok(labels.includes(suffix+' '+bodyPart),'missing '+suffix+' '+bodyPart);
 assert.ok(asset.meshes.length>=20);
 assert.ok(asset.materials.length>=7);
});
test('embedded GLTF buffer and mesh accessor sizes are valid, finite and bounded',()=>{
 const uri=asset.buffers[0].uri;
 assert.ok(uri.startsWith('data:application/octet-stream;base64,'));
 const binary=Buffer.from(uri.slice(uri.indexOf(',')+1),'base64');
 assert.equal(binary.length,asset.buffers[0].byteLength);
 assert.ok(binary.length<250000);
 for(const view of asset.bufferViews){
   assert.ok(view.byteOffset+view.byteLength<=binary.length);
   assert.equal(view.byteOffset%4,0);
 }
 for(const accessor of asset.accessors){
   const view=asset.bufferViews[accessor.bufferView];
   assert.ok(view);
   const width=accessor.type==='VEC4'?4:accessor.type==='VEC3'?3:1;
   const size=accessor.componentType===5126?4:2;
   assert.ok(accessor.count*width*size<=view.byteLength);
 }
 for(const animation of asset.animations){
   assert.ok(animation.channels.length>=8);
   for(const channel of animation.channels){
     const sampler=animation.samplers[channel.sampler];
     assert.equal(asset.accessors[sampler.input].count,asset.accessors[sampler.output].count);
     assert.ok(asset.nodes[channel.target.node]);
   }
 }
});
test('original glTF has outward-facing indexed triangles rather than inside-out geometry',()=>{
 const uri=asset.buffers[0].uri,binary=Buffer.from(uri.slice(uri.indexOf(',')+1),'base64');
 const data=new DataView(binary.buffer,binary.byteOffset,binary.byteLength);
 let outward=0,inward=0;
 for(const mesh of asset.meshes){
   const prim=mesh.primitives[0],p=asset.bufferViews[asset.accessors[prim.attributes.POSITION].bufferView],
     n=asset.bufferViews[asset.accessors[prim.attributes.NORMAL].bufferView],
     ids=asset.bufferViews[asset.accessors[prim.indices].bufferView],
     count=asset.accessors[prim.indices].count;
   for(let k=0;k<count;k+=3){
     const idx=[0,1,2].map(j=>data.getUint16(ids.byteOffset+(k+j)*2,true));
     const verts=idx.map(id=>[0,1,2].map(d=>data.getFloat32(p.byteOffset+(id*3+d)*4,true)));
     const normal=[0,1,2].map(d=>data.getFloat32(n.byteOffset+(idx[0]*3+d)*4,true));
     const a=verts[1].map((value,d)=>value-verts[0][d]),b=verts[2].map((value,d)=>value-verts[0][d]);
     const cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
     const direction=cross.reduce((sum,v,d)=>sum+v*normal[d],0);
     if(direction>1e-7)outward++;else if(direction< -1e-7)inward++;
   }
 }
 assert.equal(inward,0,'climber mesh winding is inverted: external faces may disappear');
 assert.ok(outward>=2000,'model should have substantive outward geometry');
});
test('cinematic sky changes light shafts, background hues and star density across biomes',()=>{
 const src=fs.readFileSync(path.join(base,'sky3d.js'),'utf8').replace('export function','function');
 const make=new Function(src+';return createTowerSky;')();
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 const sky=make(THREE,scene);
 assert.equal(sky.sky.material.uniforms.top.value.getHex(),0x34445c);
 const colors=[];
 for(const theme of ['foundry','ruins','clockwork','storm','void']){
   sky.setTheme(theme);colors.push(sky.sky.material.uniforms.top.value.getHex());
 }
 assert.equal(new Set(colors).size,5);
 assert.equal(sky.sky.material.uniforms.stars.value,1);
 assert.ok(sky.shafts.children.length>=10);
 camera.position.set(10,20,30);sky.update(5,camera,{climberY:20});
 assert.ok(sky.sky.position.distanceTo(camera.position)<.001);
});
test('streamed mesh teardown disposes only unique geometry',()=>{
 const src=fs.readFileSync(path.join(base,'entities3d.js'),'utf8').replace('export function','function');
 const create=new Function(src+';return createTowerEntities;')()(THREE);
 const enemy=create.enemy({kind:'guardian',telegraph:true},0,0,1,2);
 let uniqueDisposals=0;
 enemy.traverse(o=>{
   if(o.isMesh&&o.geometry.type==='TorusGeometry'){
     const prev=o.geometry.dispose.bind(o.geometry);
     o.geometry.dispose=()=>{uniqueDisposals++;prev()};
   }
 });
 const count=create.release(enemy);
 assert.ok(count>=1);
 assert.ok(uniqueDisposals>=1);
});
