import * as THREE from '/dungeon/vendor/three.module.js';
import {planConnectedDungeonJourney} from '/dungeon/connected-journey-plan.js';
import {planPartyWallReveal} from '/dungeon/party-visibility-plan.js';

/**
 * Original, structurally connected entry / ordinary chamber / Warden court.
 * Five capped GPU batches, a shared material-role family and dirty cutaways.
 * Threshold uprights are anchored to real blocked flank cells. The 2.25m+
 * arch spans are overhead only, so every actual fighting lane stays open.
 */
function geometry(build){
 const vertices=[],indices=[];
 const prism=(polygon,back,front)=>{
  const at=vertices.length/3,n=polygon.length;
  for(const z of [back,front])for(const [x,y] of polygon)vertices.push(x,y,z);
  for(let k=1;k<n-1;k++){
   indices.push(at,at+k+1,at+k,at+n,at+n+k,at+n+k+1);
  }
  for(let k=0;k<n;k++){
   const j=(k+1)%n;
   indices.push(at+k,at+j,at+n+j,at+k,at+n+j,at+n+k);
  }
 };
 const slab=(x,y,w,h,back,front)=>prism([
  [x-w/2,y-h/2],[x+w/2,y-h/2],
  [x+w/2,y+h/2],[x-w/2,y+h/2]],back,front);
 const beam=(ax,ay,bx,by,width,back,front)=>{
  const length=Math.hypot(bx-ax,by-ay)||1,px=(by-ay)/length*width/2,
   py=-(bx-ax)/length*width/2;
  prism([[ax+px,ay+py],[bx+px,by+py],
   [bx-px,by-py],[ax-px,ay-py]],back,front);
 };
 build({prism,slab,beam});
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}
const facadeStone=()=>geometry(({slab,beam,prism})=>{
 // Thick socket course and two genuinely load-bearing pier stacks.
 slab(0,.15,.92,.30,.16,.47);
 for(const side of [-1,1]){
  slab(side*.35,.36,.245,.52,.17,.46);
  prism([[side*.22,.56],[side*.47,.56],[side*.43,2.17],
   [side*.28,2.33]],.22,.45);
  slab(side*.35,.72,.25,.12,.16,.49);
  slab(side*.35,2.20,.31,.18,.19,.49);
  beam(side*.35,2.29,side*.21,2.74,.13,.19,.47);
  beam(side*.21,2.74,0,3.02,.115,.19,.47);
  // Narrow upper flying ribs remain rooted in the real wall mass.
  beam(side*.46,1.52,side*.46,2.47,.07,.27,.49);
  beam(side*.46,2.47,side*.28,2.82,.068,.25,.48);
 }
 prism([[-.12,2.87],[.12,2.87],[.10,3.05],[0,3.18],[-.10,3.05]],.18,.495);
});
const facadeShadow=()=>geometry(({prism})=>{
 // Blind, solid dark backing: this is a RECESS in impassable masonry,
 // not a false playable doorway or usable stairway.
 prism([[-.24,.42],[.24,.42],[.24,2.15],[.16,2.41],[0,2.72],
  [-.16,2.41],[-.24,2.15]],.09,.195);
});
const facadeIron=()=>geometry(({slab,beam,prism})=>{
 slab(0,.56,.39,.035,.458,.49);
 slab(0,2.24,.32,.045,.465,.50);
 for(const side of [-1,1]){
  beam(side*.21,2.40,0,2.82,.024,.462,.50);
  slab(side*.34,1.34,.024,.56,.466,.50);
 }
 prism([[0,1.42],[.10,1.65],[0,1.89],[-.10,1.65]],.472,.505);
});
const thresholdStone=()=>geometry(({slab,beam,prism})=>{
 for(const side of [-1,1]){
  // Only these piers touch the ground, at +/-0.98m in the TRUE # flank cells.
  slab(side*.98,.15,.28,.30,-.33,.33);
  prism([[side*.85,.30],[side*1.11,.30],[side*1.09,2.17],
   [side*.91,2.40]],-.27,.27);
  slab(side*.98,2.24,.29,.18,-.32,.32);
  // Two pointed arch halves complete a real open vaulted threshold.
  beam(side*.98,2.31,side*.65,2.75,.19,-.29,.29);
  beam(side*.65,2.75,side*.31,3.06,.17,-.30,.30);
  beam(side*.31,3.06,0,3.31,.14,-.31,.31);
  // Historic rear rib gives the crown physical stone thickness.
  beam(side*.91,2.35,side*.36,3.06,.065,-.35,-.30);
  beam(side*.36,3.06,0,3.31,.065,-.35,-.30);
 }
 prism([[-.13,3.14],[.13,3.14],[.13,3.31],[0,3.44],[-.13,3.31]],-.35,.35);
});
const thresholdIron=()=>geometry(({beam,slab})=>{
 for(const side of [-1,1]){
  beam(side*.79,2.68,side*.33,3.13,.038,.305,.327);
  beam(side*.33,3.13,0,3.35,.031,.305,.327);
  slab(side*.98,1.65,.052,.60,.281,.319);
 }
 slab(0,3.34,.15,.045,.33,.36);
});
const UP=new THREE.Vector3(0,1,0);
export function createConnectedDungeonJourney(world,map,floor,exit,units=[]){
 const plan=planConnectedDungeonJourney(map,floor,exit,units),geometries=[],
  materials=[],meshes=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),
  rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),tint=new THREE.Color();
 const ownGeometry=create=>(geometries.push(create()),geometries[geometries.length-1]);
 const ownMaterial=(role)=>{
  const r=plan.materials.find(m=>m.role===role)||
   {color:'#80776b',roughness:.9,metalness:.02};
  const material=new THREE.MeshStandardMaterial({color:r.color,roughness:r.roughness,
   metalness:r.metalness,side:THREE.DoubleSide,flatShading:true});
  materials.push(material);return material;
 };
 const stone=ownMaterial('bearing-stone-and-foundation'),
  shadow=ownMaterial('solid-blind-recess'),
  iron=ownMaterial('aged-iron-fittings');
 const shapes=[ownGeometry(facadeStone),ownGeometry(facadeShadow),
  ownGeometry(facadeIron),ownGeometry(thresholdStone),ownGeometry(thresholdIron)];
 const batches=[
  {name:'carved-court-and-chamber-bays',sites:plan.facades,geo:shapes[0],material:stone},
  {name:'solid-blind-masonry-recesses',sites:plan.facades,geo:shapes[1],material:shadow},
  {name:'forged-masonry-fittings',sites:plan.facades,geo:shapes[2],material:iron},
  {name:'complete-route-threshold-arches',sites:plan.thresholds,geo:shapes[3],material:stone},
  {name:'threshold-iron-ribs',sites:plan.thresholds,geo:shapes[4],material:iron}
 ];
 const facadeState=new Uint8Array(plan.facades.length).fill(255),
  thresholdState=new Uint8Array(plan.thresholds.length).fill(255);
 function transform(mesh,index,site,hidden){
  position.set(site.x,0,site.z);rotation.setFromAxisAngle(UP,site.yaw);
  const height=site.role==='warden'?1.09:site.role==='entry'?.93:1;
  scale.set(hidden?.00001:1,hidden?.00001:height,hidden?.00001:1);
  matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);
 }
 for(const batch of batches){
  if(!batch.sites.length)continue;
  const mesh=new THREE.InstancedMesh(batch.geo,batch.material,batch.sites.length);
  mesh.name='Connected journey / '+batch.name;
  mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.sites.forEach((site,i)=>{
   transform(mesh,i,site,false);
   const shade=site.role==='entry'?1.02:site.role==='warden'?.95:1;
   tint.setRGB(shade,shade,shade);mesh.setColorAt(i,tint);
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  world.add(mesh);meshes.push(mesh);batch.mesh=mesh;
 }
 const sizeOf=g=>(g.getAttribute('position')?.array.byteLength||0)+
  (g.getAttribute('normal')?.array.byteLength||0)+(g.index?.array.byteLength||0);
 const triangleCount=batches.reduce((n,b)=>n+(b.geo.index?.count||0)/3*b.sites.length,0);
 const allocatedBytes=geometries.reduce((sum,g)=>sum+sizeOf(g),0)+
  meshes.reduce((sum,m)=>sum+m.instanceMatrix.array.byteLength+
   (m.instanceColor?.array.byteLength||0),0);
 const metrics={source:plan.metrics.source,reachable:plan.metrics.reachable,
  routeCells:plan.metrics.routeCells||0,actualOrdinaryEnemy:plan.metrics.actualOrdinaryEnemy||false,
  chapters:plan.chapters.map(c=>({role:c.role,gridX:c.gridX,gridZ:c.gridZ,source:c.source})),
  thresholds:plan.thresholds.length,facades:plan.facades.length,
  drawCalls:meshes.length,triangles:triangleCount,allocatedBytes,
  geometryCount:geometries.length,materialCount:materials.length,
  textureCount:0,dynamicLights:0,collisionEffects:0,walkableGroundObstacles:0,
  occluderBounds:plan.occluderBounds.length,hiddenForSightlines:0,matrixWrites:0};
 const stageGroups=[{sites:plan.facades,states:facadeState,meshes:batches.slice(0,3)},
  {sites:plan.thresholds,states:thresholdState,meshes:batches.slice(3)}];
 function cutaway(eyes,camera,wallPad=2.1){
  const subjects=Array.isArray(eyes)?eyes:[eyes];let hidden=0,writes=0;
  for(const group of stageGroups){
   const touched=new Set();
   for(let i=0;i<group.sites.length;i++){
    const site=group.sites[i],
     reveal=planPartyWallReveal(site.x,site.z,subjects,camera,wallPad);
    const conceal=reveal==='sightline'||group===stageGroups[0]&&reveal==='nearby';
    if(conceal)hidden++;
    const band=Number(conceal);
    if(group.states[i]===band)continue;
    group.states[i]=band;writes++;
    for(const batch of group.meshes){
     if(!batch.mesh)continue;
     transform(batch.mesh,i,site,conceal);touched.add(batch.mesh);
    }
   }
   for(const mesh of touched)mesh.instanceMatrix.needsUpdate=true;
  }
  metrics.hiddenForSightlines=hidden;metrics.matrixWrites=writes;
 }
 return {plan,metrics,occluderBounds:plan.occluderBounds,cutaway,
  dispose(){
   for(const mesh of meshes){world.remove(mesh);mesh.dispose();}
   for(const g of geometries)g.dispose();
   for(const m of materials)m.dispose();
  }};
}
