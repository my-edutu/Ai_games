import * as THREE from '/dungeon/vendor/three.module.js';
import {planAlternateDungeonGallery} from '/dungeon/alternate-gallery-plan.js';
import {planPartyWallReveal} from '/dungeon/party-visibility-plan.js';

/**
 * Original physical service cloister along an EXISTING alternate legal loop.
 * No new route/collision/AI, fake stair, hazard removal, light, shader or VFX.
 * The massive jambs belong to genuine # wall cells; only paper-thin wear
 * inlays inhabit real, currently unoccupied and untrapped . walkable cells.
 * Three shared, capped instanced material/geometry batches at most.
 */
function solidGeometry(build,asFloor=false){
 const vertices=[],indices=[];
 function prism(points,back,front){
  const start=vertices.length/3,count=points.length;
  for(const depth of [back,front])
   for(const [x,y] of points)vertices.push(x,y,depth);
  for(let i=1;i<count-1;i++){
   indices.push(start,start+i+1,start+i,start+count,start+count+i,start+count+i+1);
  }
  for(let i=0;i<count;i++){
   const j=(i+1)%count;
   indices.push(start+i,start+j,start+count+j,start+i,start+count+j,start+count+i);
  }
 }
 function slab(x,y,w,h,b,f){prism([
  [x-w/2,y-h/2],[x+w/2,y-h/2],
  [x+w/2,y+h/2],[x-w/2,y+h/2]],b,f);}
 function rib(a,b,w,back,front){
  const [ax,ay]=a,[bx,by]=b,length=Math.hypot(bx-ax,by-ay)||1,
   px=(by-ay)*w/(length*2),py=-(bx-ax)*w/(length*2);
  prism([[ax+px,ay+py],[bx+px,by+py],
   [bx-px,by-py],[ax-px,ay-py]],back,front);
 }
 build({slab,prism,rib});
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setIndex(indices);
 if(asFloor)g.rotateX(-Math.PI/2);
 g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}
const bearingStone=()=>solidGeometry(({slab,prism,rib})=>{
 // Shallow foundations and battered shafts sit ON solid wall stone, not lanes.
 slab(0,.14,.88,.28,.14,.46);
 for(const side of [-1,1]){
  prism([[side*.23,.28],[side*.47,.28],
   [side*.42,2.12],[side*.29,2.28]],.19,.47);
  slab(side*.35,.76,.31,.14,.14,.48);
  slab(side*.36,2.17,.33,.19,.18,.49);
  // Secondary cloister identity: lower retreating groin rib + chisel buttress.
  rib([side*.35,2.22],[side*.21,2.68],.12,.19,.48);
  rib([side*.21,2.68],[0,2.94],.105,.17,.49);
  rib([side*.46,1.40],[side*.46,2.28],.06,.27,.495);
  rib([side*.46,2.28],[side*.29,2.83],.063,.28,.49);
  slab(side*.44,.38,.07,.36,.49,.54);
 }
 prism([[-.13,2.80],[.13,2.80],[.15,2.96],[0,3.10],
  [-.15,2.96]],.18,.50);
 // Existing stone continues behind the solid, NON-PASSABLE arch recess.
 slab(0,.48,.51,.12,.43,.49);
});
const lockedNiche=()=>solidGeometry(({slab,prism,rib})=>{
 // A shallow sealed niche with unmistakably CLOSED backstone.
 prism([[-.255,.64],[.255,.64],[.255,2.08],[.17,2.39],
  [0,2.64],[-.17,2.39],[-.255,2.08]],.06,.20);
 slab(0,1.23,.41,.035,.49,.523);
 slab(0,1.68,.42,.036,.49,.522);
 for(const side of [-1,1]){
  slab(side*.205,1.49,.024,1.23,.49,.521);
  rib([side*.205,2.15],[0,2.58],.037,.49,.525);
 }
 // Repeated iron strikes are a sealed memorial, not a usable door handle.
 prism([[0,1.72],[.125,1.92],[0,2.12],[-.125,1.92]],.496,.526);
});
const servicePaver=()=>solidGeometry(({prism})=>{
 // Irregular original solid stone, physically <.02m above the TRUE floor.
 prism([[-.44,-.34],[-.34,-.46],[.31,-.45],[.46,-.31],
  [.44,.33],[.32,.45],[-.40,.42],[-.47,.26]],-.006,.006);
},true);
const UP=new THREE.Vector3(0,1,0);
export function createAlternateDungeonGallery(world,map,floor,exit,primary,units=[],traps=[]){
 const plan=planAlternateDungeonGallery(map,floor,exit,primary,units,traps);
 const metrics={status:plan.status,connected:plan.status==='ready',
  source:plan.metrics.source,branchIndex:plan.metrics.branchIndex??-1,
  rejoinIndex:plan.metrics.rejoinIndex??-1,
  branchOnlyCells:plan.metrics.branchOnlyCells,activeHazardCells:plan.metrics.activeHazardCells,
  hazardFree:plan.status==='ready'?plan.metrics.hazardFree:null,
  facades:plan.facades.length,pavingInlays:plan.inlays.length,
  collisionEffects:0,navigationEdits:0,combatEdits:0,
  drawCalls:0,triangles:0,allocatedBytes:0,geometryCount:0,
  materialCount:0,textureCount:0,dynamicLights:0,
  occluderBounds:plan.occluderBounds.length,hiddenForSightlines:0,matrixWrites:0};
 if(plan.status!=='ready')return {plan,metrics,
  occluderVolumes:[],cutaway(){},dispose(){}};
 const geometries=[],materials=[],meshes=[];
 const ownGeo=g=>(geometries.push(g),g),ownMat=m=>(materials.push(m),m);
 const material=role=>{
  const d=plan.materials.find(m=>m.role===role);
  return ownMat(new THREE.MeshStandardMaterial({color:d.color,roughness:d.roughness,
   metalness:d.metalness,flatShading:true,side:THREE.DoubleSide}));
 };
 const stoneMat=material('bearing-service-stone'),sealMat=material('blind-iron-seal'),
  pavingMat=material('worn-service-paving');
 const stone=ownGeo(bearingStone()),iron=ownGeo(lockedNiche()),paver=ownGeo(servicePaver());
 const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),
  scale=new THREE.Vector3(),matrix=new THREE.Matrix4(),tint=new THREE.Color();
 const batches=[
  {geo:stone,mat:stoneMat,sites:plan.facades,name:'real-cell service buttress'},
  {geo:iron,mat:sealMat,sites:plan.facades,name:'sealed blind ossuary niche'},
  {geo:paver,mat:pavingMat,sites:plan.inlays,name:'verified alternative-floor stone'}
 ];
 function place(mesh,i,site,hide){
  const floorPiece=site.collisionHeight===0;
  position.set(site.x,floorPiece?site.drawHeight:0,site.z);
  rotation.setFromAxisAngle(UP,site.yaw);
  scale.set(hide?.00001:floorPiece?site.width:1,
   hide?.00001:1,hide?.00001:floorPiece?site.depth:1);
  matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);
 }
 for(const batch of batches){
  if(!batch.sites.length)continue;
  const mesh=new THREE.InstancedMesh(batch.geo,batch.mat,batch.sites.length);
  mesh.name='Alternate cloister / '+batch.name;
  mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  batch.sites.forEach((site,i)=>{
   place(mesh,i,site,false);
   const shade=.88+((i*7+floor*13)%19)*.010;
   tint.setRGB(shade,shade*.975,shade*.945);mesh.setColorAt(i,tint);
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  world.add(mesh);batch.mesh=mesh;meshes.push(mesh);
 }
 const bytes=g=>(g.getAttribute('position')?.array.byteLength||0)+
  (g.getAttribute('normal')?.array.byteLength||0)+(g.index?.array.byteLength||0);
 metrics.drawCalls=meshes.length;
 metrics.triangles=batches.reduce((n,b)=>n+(b.geo.index?.count||0)/3*b.sites.length,0);
 metrics.allocatedBytes=geometries.reduce((n,g)=>n+bytes(g),0)+meshes.reduce((n,m)=>
  n+m.instanceMatrix.array.byteLength+(m.instanceColor?.array.byteLength||0),0);
 metrics.geometryCount=geometries.length;metrics.materialCount=materials.length;
 metrics.materialRoles=plan.materials.map(m=>m.role);
 metrics.memoryAccounting='typed-array geometry + instance bytes; no GPU driver overhead';
 const occluderVolumes=Object.freeze(plan.occluderBounds.map(b=>Object.freeze([
  b.minX,b.minY,b.minZ,b.maxX,b.maxY,b.maxZ
 ])));
 const bands=new Uint8Array(plan.facades.length).fill(255);
 function cutaway(eyes,camera,wallPad=2.1){
  const subjects=Array.isArray(eyes)?eyes:[eyes];
  let hidden=0,writes=0;const changed=[];
  for(let i=0;i<plan.facades.length;i++){
   const f=plan.facades[i],visibility=planPartyWallReveal(f.x,f.z,subjects,camera,wallPad);
   const band=Number(visibility==='sightline'||visibility==='nearby');
   if(band)hidden++;
   if(bands[i]===band)continue;
   bands[i]=band;changed.push(i);writes++;
  }
  if(changed.length){
   for(const batch of batches.slice(0,2)){
    if(!batch.mesh)continue;
    for(const i of changed)place(batch.mesh,i,plan.facades[i],Boolean(bands[i]));
    batch.mesh.instanceMatrix.needsUpdate=true;
   }
  }
  metrics.hiddenForSightlines=hidden;metrics.matrixWrites=writes;
 }
 return {plan,metrics,occluderVolumes,cutaway,dispose(){
  for(const mesh of meshes){world.remove(mesh);mesh.dispose();}
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
 }};
}
