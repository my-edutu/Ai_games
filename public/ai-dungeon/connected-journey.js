import * as THREE from '/dungeon/vendor/three.module.js';
import {planConnectedDungeonJourney} from '/dungeon/connected-journey-plan.js';
import {planPartyWallReveal} from '/dungeon/party-visibility-plan.js';

/**
 * Original, structurally connected entry / ordinary chamber / Warden court.
 * Eleven capped role-specific GPU batches, three shared material roles and dirty cutaways.
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
const facadeStone=(role)=>geometry(({slab,beam,prism})=>{
 // Three independently sculpted stone silhouettes, all within existing #
 // tiles. Load-bearing courses align across the entire expedition.
 const entry=role==='entry',court=role==='warden';
 const shoulder=entry?1.79:court?2.48:2.20;
 const peak=entry?2.74:court?3.48:3.17;
 slab(0,.15,.94,.30,.15,.47);
 for(const side of [-1,1]){
  const column=side*.36;
  slab(column,.40,entry?.30:court?.30:.25,.58,.16,.46);
  prism([[column-.105,.63],[column+.105,.63],
   [column+.08,shoulder-.10],[column-.075,shoulder]],.18,.455);
  slab(column,.75,.27,.12,.17,.495);
  slab(column,shoulder-.05,.32,.19,.17,.495);
  // Visible stone cheeks and rear flying rib preserve physical wall depth.
  beam(side*.465,1.26,side*.465,shoulder+.12,.068,.23,.48);
  if(entry){
   // Battered arrival gate: thick defensive lintels, worn squared crown,
   // asymmetric high rubble; no pretend staircase or navigable doorway.
   beam(column,shoulder,side*.20,2.26,.19,.16,.46);
   beam(side*.20,2.26,0,2.46,.17,.16,.47);
   slab(side*.31,2.34,.22,.17,.15,.47);
  }else if(court){
   // The Warden court's tall counterforts carry a double flying ogee:
   // a severe vertical, forked stone silhouette unlike the earlier nave.
   beam(column,shoulder,side*.26,3.12,.17,.17,.47);
   beam(side*.26,3.12,0,peak-.11,.155,.17,.47);
   beam(side*.46,shoulder-.15,side*.46,shoulder+.36,.098,.25,.49);
   beam(side*.46,shoulder+.36,side*.22,peak-.21,.11,.23,.49);
   slab(side*.44,2.06,.18,.085,.26,.49);
  }else{
   // The inhabited encounter nave rises higher than the entrance. Repeated
   // true pointed ribs, crown springers and corbels frame combat from outside.
   beam(column,shoulder,side*.205,2.81,.14,.16,.47);
   beam(side*.205,2.81,0,peak-.16,.135,.16,.47);
   beam(side*.465,shoulder-.12,side*.29,peak-.19,.07,.25,.485);
   slab(side*.38,1.59,.10,.23,.29,.49);
  }
 }
 if(entry){
  // The arrival lintel is battered, not a bright shrine or fantasy doorway.
  slab(0,2.41,.63,.14,.14,.475);
  prism([[-.15,2.42],[.14,2.42],[.12,2.60],[0,2.71],[-.12,2.59]],.16,.49);
 }else if(court){
  // Forged chapter keystone with genuinely thick cross-sectional voussoirs.
  prism([[-.16,3.25],[.16,3.25],[.14,3.50],[0,3.63],[-.14,3.50]],.18,.49);
  slab(0,2.78,.14,.11,.20,.48);
 }else{
  prism([[-.14,2.98],[.14,2.98],[.12,3.16],[0,3.27],[-.12,3.16]],.18,.49);
 }
});
const facadeShadow=(role)=>geometry(({prism,beam})=>{
 // Real non-traversable shallow darkness backed by existing solid map stone.
 const height=role==='entry'?1.79:role==='warden'?2.60:2.27;
 prism([[-.24,.45],[.24,.45],[.24,height],[.15,height+.26],
  [0,height+.47],[-.15,height+.26],[-.24,height]],.07,.19);
 if(role==='warden')for(const side of [-1,1])
  beam(side*.18,1.14,side*.18,height+.05,.045,.19,.23);
});
const facadeIron=(role)=>geometry(({slab,beam,prism})=>{
 slab(0,.56,.42,.039,.457,.49);
 for(const side of [-1,1]){
  slab(side*.35,1.24,.028,.47,.464,.495);
  if(role==='entry'){
   slab(side*.28,1.86,.025,.40,.467,.495);
   beam(side*.26,2.22,0,2.46,.026,.46,.495);
  }else if(role==='warden'){
   // Iron lance barbs and vertical court heraldry, not bright effects.
   beam(side*.29,2.48,0,3.25,.037,.46,.494);
   beam(side*.15,2.42,side*.37,2.02,.031,.464,.496);
   slab(side*.35,1.70,.042,.44,.459,.49);
  }else{
   beam(side*.26,2.48,0,3.06,.026,.464,.494);
   slab(side*.32,1.73,.030,.50,.458,.492);
  }
 }
 if(role==='warden'){
  prism([[0,1.25],[.14,1.62],[0,2.07],[-.14,1.62]],.462,.495);
  slab(0,2.27,.28,.046,.462,.49);
 }else if(role==='entry'){
  prism([[-.15,1.47],[.15,1.47],[0,1.86]],.46,.494);
 }else{
  prism([[0,1.42],[.12,1.67],[0,1.93],[-.12,1.67]],.462,.493);
 }
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
 // Three independent architectural profiles, three material roles, two
 // overhead threshold profiles: no more than ELEVEN instanced draws/floor.
 const batches=[],profiles={};
 for(const role of ['entry','ordinary','warden']){
  const indices=plan.facades.flatMap((site,i)=>site.role===role?[i]:[]);
  if(!indices.length)continue;
  const sites=indices.map(i=>plan.facades[i]);
  const shapes=[ownGeometry(()=>facadeStone(role)),
   ownGeometry(()=>facadeShadow(role)),ownGeometry(()=>facadeIron(role))];
  const materialsByPart=[stone,shadow,iron];
  const names=['bearing-piers-and-crown','solid-blind-stone-recess',
   'original-ironwork-and-heraldry'];
  profiles[role]=shapes.reduce((n,g)=>n+(g.index?.count||0)/3,0);
  for(let part=0;part<3;part++)batches.push({
   family:'facade',indices,sites,name:role+'-'+names[part],
   geo:shapes[part],material:materialsByPart[part]
  });
 }
 if(plan.thresholds.length){
  const indices=plan.thresholds.map((_,i)=>i);
  const archStone=ownGeometry(thresholdStone),archIron=ownGeometry(thresholdIron);
  batches.push({family:'threshold',indices,sites:plan.thresholds,
   name:'load-bearing-complete-vaulted-threshold',geo:archStone,material:stone});
  batches.push({family:'threshold',indices,sites:plan.thresholds,
   name:'aged-iron-vault-ribs',geo:archIron,material:iron});
 }
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
  routeCells:plan.metrics.routeCells||0,
  actualOrdinaryEnemy:plan.metrics.actualOrdinaryEnemy||false,
  chapters:plan.chapters.map(c=>({role:c.role,gridX:c.gridX,gridZ:c.gridZ,source:c.source})),
  thresholds:plan.thresholds.length,facades:plan.facades.length,
  drawCalls:meshes.length,triangles:triangleCount,allocatedBytes,
  memoryAccounting:'static vertex, index, normal and instancing arrays; excludes WebGL driver overhead',
  distinctProfiles:Object.freeze({...profiles}),
  geometryCount:geometries.length,materialCount:materials.length,
  textureCount:0,dynamicLights:0,collisionEffects:0,walkableGroundObstacles:0,
  occluderBounds:plan.occluderBounds.length,hiddenForSightlines:0,matrixWrites:0};
 function cutaway(eyes,camera,wallPad=2.1){
  const subjects=Array.isArray(eyes)?eyes:[eyes];
  const changed={facade:new Uint8Array(plan.facades.length),
   threshold:new Uint8Array(plan.thresholds.length)};
  let hidden=0,writes=0;
  for(const [family,sites,states] of [
   ['facade',plan.facades,facadeState],
   ['threshold',plan.thresholds,thresholdState]
  ]){
   for(let i=0;i<sites.length;i++){
    const site=sites[i],
     reveal=planPartyWallReveal(site.x,site.z,subjects,camera,wallPad);
    const conceal=reveal==='sightline'||family==='facade'&&reveal==='nearby';
    if(conceal)hidden++;
    const band=Number(conceal);
    if(states[i]===band)continue;
    states[i]=band;changed[family][i]=1;writes++;
   }
  }
  // The three sculpted chapter profiles use different instance index lists.
  // Translate the SAME site-band changes to each draw, never address an
  // entry mesh with an unrelated global Warden-face index.
  for(const batch of batches){
   if(!batch.mesh)continue;let dirty=false;
   for(let local=0;local<batch.indices.length;local++){
    const global= batch.indices[local];
    if(changed[batch.family][global]!==1)continue;
    transform(batch.mesh,local,batch.sites[local],
     Boolean(batch.family==='facade'?facadeState[global]:thresholdState[global]));
    dirty=true;
   }
   if(dirty)batch.mesh.instanceMatrix.needsUpdate=true;
  }
  metrics.hiddenForSightlines=hidden;metrics.matrixWrites=writes;
 }
 const occluderVolumes=Object.freeze(plan.occluderBounds.map(b=>Object.freeze([
  b.minX,b.minY,b.minZ,b.maxX,b.maxY,b.maxZ])));
 return {plan,metrics,occluderBounds:plan.occluderBounds,occluderVolumes,cutaway,
  dispose(){
   for(const mesh of meshes){world.remove(mesh);mesh.dispose();}
   for(const g of geometries)g.dispose();
   for(const m of materials)m.dispose();
  }};
}
