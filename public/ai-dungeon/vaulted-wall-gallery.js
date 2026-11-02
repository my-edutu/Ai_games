import * as THREE from '/dungeon/vendor/three.module.js';

/**
 * Original Gothic vaulted wall breaks. Every occupied grid cell remains an
 * opaque, impassable authority wall; only its 3D presentation is lowered to a
 * weathered stone plinth, with an open sculpted arcade above it. Three shared
 * GPU batches render an entire floor, never one Mesh per masonry element.
 */
const THEMES=Object.freeze([
 {stone:'#917b60',shadow:'#1c1815',metal:'#b79865'},
 {stone:'#936b69',shadow:'#26161c',metal:'#bd8d66'},
 {stone:'#71849b',shadow:'#151e2b',metal:'#91b6c6'},
 {stone:'#8a779e',shadow:'#22182e',metal:'#ba9aca'}
]);
const faces=[],UP=new THREE.Vector3(0,1,0);
function geometry(builder){
 const vertices=[],indices=[];
 const solid=(points,back,front)=>{
  const start=vertices.length/3,n=points.length;
  for(const z of [back,front])for(const [x,y] of points)vertices.push(x,y,z);
  for(let i=1;i<n-1;i++){indices.push(start,start+i+1,start+i);indices.push(start+n,start+n+i,start+n+i+1)}
  for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(start+i,start+j,start+n+j,start+i,start+n+j,start+n+i)}
 };
 const slab=(x,y,w,h,b,f)=>solid([[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]],b,f);
 const beam=(ax,ay,bx,by,w,b,f)=>{
  const length=Math.hypot(bx-ax,by-ay)||1,px=(by-ay)/length*w/2,py=-(bx-ax)/length*w/2;
  solid([[ax+px,ay+py],[bx+px,by+py],[bx-px,by-py],[ax-px,ay-py]],b,f);
 };
 builder({solid,slab,beam});
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setIndex(indices);g.computeVertexNormals();
 g.computeBoundingSphere();
 return g;
}
function stonework(){
 return geometry(({solid,slab,beam})=>{
  for(const side of [-1,1]){
   const x=side*.374;
   // Broken stout pier, fluted shaft, square capital and projecting corbel.
   solid([[x-.11,.79],[x+.11,.79],[x+.088,2.05],[x-.073,2.11]],.35,.493);
   slab(x,1.57,.048,.83,.488,.501);
   slab(x,2.07,.30,.155,.33,.494);
   slab(x,1.03,.27,.135,.32,.49);
   slab(x,2.29,.30,.13,.35,.485);
   // Two true three-dimensional diagonals form a pointed arched silhouette.
   beam(side*.39,2.16,side*.205,2.49,.147,.33,.49);
   beam(side*.205,2.49,0,2.62,.125,.34,.49);
   beam(side*.39,2.34,side*.23,2.53,.055,.45,.509);
  }
  slab(0,.83,.90,.11,.32,.48);
  slab(0,2.63,.19,.13,.34,.503);
 });
}
function shadowRecess(){
 return geometry(({solid})=>{
  solid([[-.286,1.15],[.286,1.15],[.286,2.00],[.178,2.33],[0,2.49],[-.178,2.33],[-.286,2]],.327,.357);
 });
}
function heraldry(){
 return geometry(({solid,slab,beam})=>{
  // Fine hammered metal relief and angled runes remain below the arch apex.
  solid([[0,2.32],[.095,2.48],[0,2.58],[-.095,2.48]],.484,.516);
  slab(0,1.30,.13,.27,.487,.519);
  for(const side of [-1,1]){
   slab(side*.373,1.43,.022,.45,.492,.519);
   beam(side*.125,1.38,side*.230,1.51,.032,.493,.519);
  }
 });
}
export function createVaultedWallGallery(world,sites,wallIndices,floor){
 const count=Math.min(32,Array.isArray(sites)?sites.length:0);
 const theme=THEMES[((floor-1)%4+4)%4];
 const geometries=[stonework(),shadowRecess(),heraldry()];
 const materials=[
  new THREE.MeshStandardMaterial({color:theme.stone,roughness:.91,metalness:.08,side:THREE.DoubleSide,flatShading:true}),
  new THREE.MeshStandardMaterial({color:theme.shadow,roughness:1,metalness:0,side:THREE.DoubleSide}),
  new THREE.MeshStandardMaterial({color:theme.metal,roughness:.49,metalness:.48,side:THREE.DoubleSide,flatShading:true})
 ];
 const meshes=geometries.map((g,i)=>{
  const mesh=new THREE.InstancedMesh(g,materials[i],count);
  mesh.name=['Sculpted vaulted stone bays','Recessed vaulted shadows','Relief and carved lintel'][i];
  mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  world.add(mesh);return mesh;
 });
 const previous=new Uint8Array(count);previous.fill(255);
 const vector=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
 let hidden=0,uploads=0;
 const cutaway=(bands)=>{
  let changed=0,concealed=0;
  for(let i=0;i<count;i++){
   const wallIndex=wallIndices[i],band=wallIndex>=0&&wallIndex<bands?.length?bands[wallIndex]:0;
   if(band!==0)concealed++;
   if(band===previous[i])continue;
   previous[i]=band;changed++;
   const site=sites[i];
   vector.set(site.x,0,site.z);
   quaternion.setFromAxisAngle(UP,site.yaw);
   scale.setScalar(band===0?1:.00001);
   matrix.compose(vector,quaternion,scale);
   for(const mesh of meshes)mesh.setMatrixAt(i,matrix);
  }
  if(changed)for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;
  hidden=concealed;uploads=changed;
 };
 cutaway(null);
 return{
  cutaway,
  metrics:()=>({bays:count,stoneBatches:meshes.length,hiddenForSightlines:hidden,matrixWrites:uploads,
   architecture:'original pointed vaults, fluted piers and reliefs',visualOnly:true,collisionEffects:0}),
  dispose(){
   for(const mesh of meshes){world.remove(mesh);mesh.dispose()}
   for(const g of geometries)g.dispose();
   for(const m of materials)m.dispose();
  }
 };
}