import * as THREE from '/dungeon/vendor/three.module.js';

/**
 * Four distinct original stone architectures composed along the real legal
 * expedition path. All are inside blocked source cells, remain read-only and
 * share the camera's authoritative wall cutaways. At most twelve instanced
 * GPU draws per floor (three materials for each of four original silhouettes).
 */
const THEMES=Object.freeze([
 {stone:'#91806e',shadow:'#171411',metal:'#b5a280'},
 {stone:'#8a6668',shadow:'#24151a',metal:'#c2a07e'},
 {stone:'#71849b',shadow:'#111a26',metal:'#9fb4c6'},
 {stone:'#837198',shadow:'#1d1527',metal:'#bda3cc'}
]);
const UP=new THREE.Vector3(0,1,0),MAX_BAYS=72;
function geometry(builder){
 const vertices=[],indices=[];
 const solid=(points,back,front)=>{
  const start=vertices.length/3,n=points.length;
  for(const z of [back,front])for(const [x,y] of points)vertices.push(x,y,z);
  for(let i=1;i<n-1;i++){
   indices.push(start,start+i+1,start+i);
   indices.push(start+n,start+n+i,start+n+i+1);
  }
  for(let i=0;i<n;i++){
   const j=(i+1)%n;
   indices.push(start+i,start+j,start+n+j,start+i,start+n+j,start+n+i);
  }
 };
 const slab=(x,y,w,h,b,f)=>solid([[x-w/2,y-h/2],[x+w/2,y-h/2],
  [x+w/2,y+h/2],[x-w/2,y+h/2]],b,f);
 const beam=(ax,ay,bx,by,w,b,f)=>{
  const length=Math.hypot(bx-ax,by-ay)||1,px=(by-ay)/length*w/2,py=-(bx-ax)/length*w/2;
  solid([[ax+px,ay+py],[bx+px,by+py],[bx-px,by-py],[ax-px,ay-py]],b,f);
 };
 builder({solid,slab,beam});
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}
function stonework(style){
 return geometry(({solid,slab,beam})=>{
  const height=[2.62,2.82,2.35,2.72][style];
  const shoulder=[2.14,2.38,1.96,2.31][style];
  const half=[.36,.38,.39,.35][style];
  slab(0,.80,.94,.15,.32,.49);
  for(const side of [-1,1]){
   const x=side*half;
   solid([[x-.12,.81],[x+.12,.81],[x+.08,shoulder-.12],[x-.08,shoulder]],.35,.485);
   slab(x,1.52,.042,.68,.488,.508);
   slab(x,.99,.28,.14,.34,.496);
   slab(x,shoulder-.07,.30,.13,.33,.50);
   beam(side*.48,.84,side*.48,shoulder-.12,.095,.37,.503);
   beam(side*.48,shoulder-.12,side*.30,shoulder+.17,.070,.36,.502);
   // Four *physical*, differentiated profiles, not palette-only variants.
   if(style===2&&side===1){
    // A ruin: fractured masonry retreats from the apex, missing upper ribs.
    solid([[x-.14,shoulder-.02],[x+.13,shoulder-.14],[x+.085,shoulder+.13],[x-.08,shoulder+.06]],.36,.52);
    beam(side*.36,shoulder+.03,side*.21,shoulder+.17,.11,.38,.51);
   }else if(style===1){
    // High basilica nave: layered flying ribs, an upper pointed tracery.
    beam(side*.40,shoulder-.03,side*.205,height-.15,.132,.34,.50);
    beam(side*.205,height-.15,0,height,.107,.36,.50);
    beam(side*.38,shoulder+.13,side*.20,height+.01,.052,.455,.53);
    beam(side*.20,height+.01,0,height+.17,.043,.462,.536);
   }else if(style===3){
    // Reliquary: steep, ribbed ogive with clustered side capitals.
    beam(side*.40,shoulder-.01,side*.18,height-.18,.135,.34,.51);
    beam(side*.18,height-.18,0,height,.103,.36,.51);
    slab(side*.39,1.80,.065,.38,.49,.532);
    slab(side*.40,2.05,.23,.09,.42,.516);
   }else{
    // Low cloister arches repeat as a grounded court rhythm.
    beam(side*.39,shoulder-.06,side*.215,height-.19,.147,.33,.49);
    beam(side*.215,height-.19,0,height,.120,.34,.505);
    beam(side*.39,shoulder+.10,side*.21,height-.08,.062,.46,.524);
   }
  }
  if(style===2){
   // A broken bridge and offset chisel-shorn keystone give the ruin a gap.
   beam(-.23,height-.12,-.065,height+.03,.135,.38,.513);
   solid([[-.07,height-.09],[.045,height-.10],[.12,height+.03],[-.095,height+.12]],.38,.533);
  }else{
   slab(0,height-.03,.15,.14,.35,.506);
   solid([[-.105,height-.13],[.105,height-.13],[.145,height+.02],[0,height+.14],[-.145,height+.02]],.365,.534);
  }
 });
}
function shadowRecess(style){
 return geometry(({solid,beam})=>{
  const peak=[2.46,2.69,2.24,2.59][style],shoulder=peak-.46;
  // Solid dark back plane makes every broken facade visibly impassable,
  // without faking a playable door through the original collision wall.
  solid([[-.305,1.07],[.305,1.07],[.305,shoulder],[.17,peak-.15],
   [0,peak],[-.17,peak-.15],[-.305,shoulder]],.28,.345);
  if(style===1||style===3){
   for(const side of [-1,1])beam(side*.29,1.11,side*.29,shoulder,.025,.353,.367);
  }
 });
}
function metalwork(style){
 return geometry(({solid,slab,beam})=>{
  if(style===0){
   solid([[0,2.33],[.082,2.45],[0,2.57],[-.082,2.45]],.490,.529);
   for(const side of [-1,1])slab(side*.34,1.44,.025,.37,.495,.53);
  }else if(style===1){
   // Basilican bossed heraldry: tall central sunburst and two ironwork rails.
   solid([[0,2.34],[.15,2.49],[.06,2.63],[-.06,2.63],[-.15,2.49]],.488,.534);
   for(const side of [-1,1]){
    beam(side*.13,2.49,side*.28,2.23,.035,.486,.535);
    slab(side*.38,1.47,.035,.62,.504,.54);
   }
  }else if(style===2){
   // Shattered reliquary seal: broken, non-symmetric iron fragments.
   solid([[-.09,2.10],[0,2.36],[.06,2.22],[.12,2.26],[.09,2.02]],.488,.538);
   beam(-.26,1.37,-.12,1.60,.037,.494,.534);
  }else{
   // Circular sanctum oculus made from actual eight hard-edged segments.
   for(let k=0;k<8;k++){
    const a=k*Math.PI/4,b=(k+1)*Math.PI/4;
    beam(Math.cos(a)*.16,2.42+Math.sin(a)*.16,
     Math.cos(b)*.16,2.42+Math.sin(b)*.16,.038,.495,.538);
   }
   for(const side of [-1,1])slab(side*.35,1.40,.036,.48,.502,.539);
  }
 });
}
export function createVaultedWallGallery(world,sites,wallIndices,floor){
 const count=Math.min(MAX_BAYS,Array.isArray(sites)?sites.length:0),theme=THEMES[((floor-1)%4+4)%4];
 const materials=[
  new THREE.MeshStandardMaterial({color:theme.stone,roughness:.92,metalness:.07,side:THREE.DoubleSide,flatShading:true}),
  new THREE.MeshStandardMaterial({color:theme.shadow,roughness:1,metalness:0,side:THREE.DoubleSide}),
  new THREE.MeshStandardMaterial({color:theme.metal,roughness:.51,metalness:.40,side:THREE.DoubleSide,flatShading:true})
 ];
 const groups=[],geometries=[],allMeshes=[];
 for(let style=0;style<4;style++){
  const indices=Array.from({length:count},(_,i)=>i).filter(i=>(sites[i]?.style&3)===style);
  if(!indices.length)continue;
  const shapes=[stonework(style),shadowRecess(style),metalwork(style)];geometries.push(...shapes);
  const meshes=shapes.map((g,i)=>{
   const mesh=new THREE.InstancedMesh(g,materials[i],indices.length);
   mesh.name=['Gothic nave stone arches','Blocked recess shadow','Gothic carved iron relief'][i]+' — profile '+style;
   mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;
   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);world.add(mesh);allMeshes.push(mesh);return mesh;
  });
  const previous=new Uint8Array(indices.length);previous.fill(255);
  groups.push({style,indices,meshes,previous});
 }
 const vector=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
 let hidden=0,uploads=0;
 const cutaway=(bands)=>{
  let changed=0,concealed=0;
  for(const group of groups){
   let dirty=0;
   for(let local=0;local<group.indices.length;local++){
    const i=group.indices[local],wallIndex=wallIndices[i];
    const band=wallIndex>=0&&wallIndex<bands?.length?bands[wallIndex]:0;
    if(band!==0)concealed++;
    if(band===group.previous[local])continue;
    group.previous[local]=band;changed++;dirty++;
    const site=sites[i],chapter=Number.isInteger(site.chapter)?site.chapter:0;
    vector.set(site.x,0,site.z);quaternion.setFromAxisAngle(UP,site.yaw);
    // Vary actual proportions along the journey; the side chapel ruins
    // remain lower than the central nave and the final reliquary.
    const sx=[.94,1,.91,.98][group.style],sy=[.92,1.02,.87,1.01][group.style];
    const stageHeight=chapter===0?.94:chapter===3?1.06:1;
    scale.set(band===0?sx:.00001,band===0?sy*stageHeight:.00001,band===0?.94:.00001);
    matrix.compose(vector,quaternion,scale);
    for(const mesh of group.meshes)mesh.setMatrixAt(local,matrix);
   }
   if(dirty)for(const mesh of group.meshes)mesh.instanceMatrix.needsUpdate=true;
  }
  hidden=concealed;uploads=changed;
 };
 cutaway(null);
 return {
  cutaway,
  metrics:()=>({bays:count,stoneBatches:allMeshes.length,architecturalProfiles:groups.length,
   profileCounts:groups.map(g=>({style:g.style,bays:g.indices.length})),
   hiddenForSightlines:hidden,matrixWrites:uploads,
   architecture:'route-led cloister, high basilica, broken chapel, circular reliquary',
   visualOnly:true,collisionEffects:0}),
  dispose(){
   for(const mesh of allMeshes){world.remove(mesh);mesh.dispose()}
   for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
  }
 };
}
