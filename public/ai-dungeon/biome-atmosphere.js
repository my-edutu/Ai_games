import * as THREE from '/dungeon/vendor/three.module.js';

/**
 * Broadcast-grade procedural set dressing that is never authoritative.
 * Every biome has unique art direction, props, emissive color, and motion.
 * Generation is stable for a given floor; matrices are instanced for bounded performance.
 */
const BIOMES=[
 {name:'SUNKEN CRYPT',glow:'#42f8ce',secondary:'#6dafff',plant:'#45bc9b',bright:'#d5fff7',shadow:'#0a3850'},
 {name:'EMBER CATHEDRAL',glow:'#ff914e',secondary:'#ffdc75',plant:'#bf5345',bright:'#fff1ca',shadow:'#50223a'},
 {name:'OBSIDIAN VAULT',glow:'#77c9ff',secondary:'#96fff4',plant:'#527add',bright:'#d8f8ff',shadow:'#172c70'},
 {name:'HOLLOW SANCTUM',glow:'#b989ff',secondary:'#ff81d4',plant:'#7856ce',bright:'#ffe6ff',shadow:'#33205b'}
];
const hash=(x,z,f)=>{let n=Math.imul(x+219,0x45d9f3b)^Math.imul(z+407,0x27d4eb2d)^Math.imul(f+97,0x165667b1);n=Math.imul(n^(n>>>16),0x7feb352d);return(n^(n>>>15))>>>0};
const pick=(x,z,f)=>hash(x,z,f)/4294967296;
function makeInstanced(root,geometry,material,positions,cast=false){
 if(!positions.length)return;
 const mesh=new THREE.InstancedMesh(geometry,material,positions.length);
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),euler=new THREE.Euler();
 for(let i=0;i<positions.length;i++){const [x,y,z,sx,sy,sz,angle=0]=positions[i];position.set(x,y,z);scale.set(sx,sy,sz);euler.set(0,angle,0);rotation.setFromEuler(euler);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);}
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=cast;mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);return mesh;
}
function gradientTexture(biome,floor){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');
 const grad=ctx.createRadialGradient(64,64,6,64,64,80);grad.addColorStop(0,biome.bright);grad.addColorStop(.12,biome.glow);grad.addColorStop(.5,biome.secondary);grad.addColorStop(1,biome.shadow);
 ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
 for(let i=0;i<270;i++){const x=pick(i,7,floor)*128,y=pick(i,13,floor)*128;ctx.fillStyle=i%4?'#ffffff0d':'#00000020';ctx.fillRect(x,y,1.5,1.5);}
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
export function createBiomeAtmosphere(root,map,floor,exit){
 const f=(floor-1)%BIOMES.length,biome=BIOMES[f],size=map.length,offset=(size-1)/2,objects=new THREE.Group();root.add(objects);
 const material=[],geometries=[],textures=[],floaters=[],lights=[],animation=[];
 const register=(mat)=>{material.push(mat);return mat},geometry=(geo)=>{geometries.push(geo);return geo};
 const emissive=register(new THREE.MeshStandardMaterial({color:biome.glow,emissive:biome.glow,emissiveIntensity:2.6,metalness:.38,roughness:.25}));
 const pale=register(new THREE.MeshStandardMaterial({color:biome.bright,emissive:biome.secondary,emissiveIntensity:.7,metalness:.28,roughness:.42}));
 const dark=register(new THREE.MeshStandardMaterial({color:biome.shadow,metalness:.68,roughness:.41}));
 const plant=register(new THREE.MeshStandardMaterial({color:biome.plant,roughness:.9,side:THREE.DoubleSide}));
 const glimmer=register(new THREE.MeshBasicMaterial({color:biome.bright,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 const glowTexture=gradientTexture(biome,floor);textures.push(glowTexture);glimmer.map=glowTexture;glimmer.needsUpdate=true;
 const pools=[],innerPools=[],spires=[],spikeCaps=[],growth=[],mushroomHeads=[],plinths=[],runes=[],ceilingDrops=[];
 const stoneGeo=geometry(new THREE.BoxGeometry(1,1,1)),spearGeo=geometry(new THREE.ConeGeometry(.5,1,7));
 const crystalGeo=geometry(new THREE.OctahedronGeometry(.5,0)),poolGeo=geometry(new THREE.CylinderGeometry(.5,.5,.04,24));
 const ringGeo=geometry(new THREE.TorusGeometry(.45,.05,8,36));
 const walk=(x,z)=>x>0&&z>0&&x<size-1&&z<size-1&&map[z][x]==='.';
 const safe=(x,z)=>walk(x,z)&&Math.abs(x-1)+Math.abs(z-1)>4&&Math.abs(x-exit.x)+Math.abs(z-exit.z)>2;
 for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++){
  const h=hash(x,z,floor),wx=x-offset,wz=z-offset;
  if(safe(x,z)){
   if(h%19===0) {pools.push([wx,-.012,wz,.82,1,.82]);innerPools.push([wx,.02,wz,.47,1,.47]);}
   if(h%13===0){growth.push([wx+.22,.18,wz-.16,.13,.44,.13,(h%4)*Math.PI/2]);mushroomHeads.push([wx+.22,.40,wz-.16,.17,.16,.17]);}
   if(h%29===0)runes.push([wx,-.001,wz,.66,1,.66]);
   if(h%47===0&&spires.length<17){spires.push([wx+.13,.52,wz+.22,.38,.96,.38,(h%6)*.34]);spikeCaps.push([wx+.13,1.11,wz+.22,.42,.42,.42,(h%6)*.34]);}
  }else if(map[z][x]==='#'&&(walk(x-1,z)||walk(x+1,z)||walk(x,z-1)||walk(x,z+1))){
   if(h%26===0)ceilingDrops.push([wx,1.87,wz,.15,.82,.15]);
  }
 }
 // Each biome uses the same walkability geometry, but a distinct density, scale and silhouette.
 if(f===0){ // Sunken crypt: teal water, sea plants and pearl bioluminescence.
  makeInstanced(objects,poolGeo,dark,pools);
  makeInstanced(objects,poolGeo,emissive,innerPools);
  makeInstanced(objects,spearGeo,plant,growth);
  makeInstanced(objects,crystalGeo,pale,mushroomHeads);
  makeInstanced(objects,spearGeo,dark,ceilingDrops);
 }else if(f===1){ // Ember cathedral: glowing volcanic inlays, basalt teeth, fiery column crowns.
  makeInstanced(objects,poolGeo,dark,pools);
  makeInstanced(objects,poolGeo,emissive,innerPools);
  makeInstanced(objects,spearGeo,dark,spires);
  makeInstanced(objects,crystalGeo,emissive,spikeCaps);
  makeInstanced(objects,spearGeo,dark,ceilingDrops);
 }else if(f===2){ // Obsidian vault: clusters of sapphire prisms and cold crystals.
  makeInstanced(objects,crystalGeo,dark,spires);
  makeInstanced(objects,crystalGeo,emissive,spikeCaps);
  makeInstanced(objects,crystalGeo,pale,mushroomHeads);
  makeInstanced(objects,poolGeo,emissive,innerPools);
 }else{ // Hollow sanctum: violet planar runes and hovering shard constellations.
  makeInstanced(objects,crystalGeo,emissive,spires);
  makeInstanced(objects,crystalGeo,pale,spikeCaps);
  makeInstanced(objects,poolGeo,dark,pools);
  makeInstanced(objects,poolGeo,emissive,innerPools);
 }
 // A surrounding cavern skyline is part of the 3D set, not an invisible map border.
 // Tall silhouettes, distinctive glowing crowns and varied depths give every tracking shot a horizon.
 const distantColumns=[],distantCrowns=[],distantRock=[];
 for(let i=0;i<34;i++){
  // The scenic perimeter MUST remain outside all gameplay camera offsets;
  // older radius-12 skyline columns occluded most real Chromium screenshots.
  const angle=i*Math.PI*2/34,range=32+pick(i,52,floor)*10,x=Math.cos(angle)*range,z=Math.sin(angle)*range;
  const h=3.5+pick(i,53,floor)*8.4,w=.72+pick(i,54,floor)*1.55;
  distantColumns.push([x,h/2-.2,z,w,h,w,(i%6)*Math.PI/6]);
  distantCrowns.push([x,h-.1,z,w*1.2,.18,w*1.2]);
  if(i%4===0)distantRock.push([x+1.7,.6,z-1.4,1.6,1.1,1.8]);
 }
 const horizonGeo=geometry(new THREE.CylinderGeometry(.68,1,1,7));
 makeInstanced(objects,horizonGeo,dark,distantColumns);
 makeInstanced(objects,stoneGeo,pale,distantCrowns);
 makeInstanced(objects,crystalGeo,dark,distantRock);
 // Local shafts of coloured magical light, kept rare to avoid hiding the party.
 const shafts=[];
 const shaftMaterial=register(new THREE.MeshBasicMaterial({color:biome.glow,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
 const shaftGeo=geometry(new THREE.CylinderGeometry(.16,.96,1,18,1,true));
 const spotlightLocations=[];
 for(let z=2;z<size-2;z++)for(let x=2;x<size-2;x++){
  if(safe(x,z)&&walk(x-1,z)&&walk(x+1,z)&&walk(x,z-1)&&walk(x,z+1))spotlightLocations.push([x,z,hash(x,z,floor)]);
 }
 spotlightLocations.sort((a,b)=>a[2]-b[2]);
 for(const [x,z,h] of spotlightLocations.slice(0,4)){
  const ray=new THREE.Mesh(shaftGeo,shaftMaterial);ray.position.set(x-offset,1.85,z-offset);ray.scale.set(1,3.85,1);
  ray.rotation.z=((h%9)-4)*.025;objects.add(ray);shafts.push(ray);
 }
 
 // A few monumental handcrafted-feeling landmarks on walkable larger chambers.
 const candidates=[];
 for(let z=3;z<size-3;z++)for(let x=3;x<size-3;x++){
  if(!safe(x,z)||!(walk(x-1,z)&&walk(x+1,z)&&walk(x,z-1)&&walk(x,z+1)))continue;
  candidates.push({x,z,score:hash(x,z,floor)});
 }
 if(!candidates.length){for(let z=2;z<size-2;z++)for(let x=2;x<size-2;x++)if(safe(x,z)){candidates.push({x,z,score:hash(x,z,floor)})}}
 candidates.sort((a,b)=>a.score-b.score);
 for(const tile of candidates.slice(0,4)){
  const wx=tile.x-offset,wz=tile.z-offset,g=new THREE.Group();g.position.set(wx,0,wz);
  const bottom=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.39,.52,.24,10)),dark);bottom.position.y=.10;g.add(bottom);
  const shaft=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.13,.26,1.45,10)),pale);shaft.position.y=.90;g.add(shaft);
  const crown=new THREE.Mesh(geometry(new THREE.IcosahedronGeometry(.28,1)),emissive);crown.position.y=1.86;g.add(crown);
  const halo=new THREE.Mesh(ringGeo,glimmer);halo.position.y=1.85;halo.rotation.x=Math.PI/2;g.add(halo);
  for(let k=0;k<4;k++){const angle=k*Math.PI/2,shard=new THREE.Mesh(crystalGeo,pale);shard.position.set(Math.cos(angle)*.49,1.46,Math.sin(angle)*.49);shard.scale.set(.2,.44,.2);g.add(shard)}
  objects.add(g);floaters.push({g,halo,phase:tile.score%1024});
 }
 // Five animated pools at most; every other source of intensity is stable.
 const selected=pools.slice(0,5);
 selected.forEach(([x,,z],i)=>{
  const light=new THREE.PointLight(biome.glow,1.8,4.2,2);light.position.set(x,1.15,z);objects.add(light);lights.push(light);
 });
 const moteGeo=geometry(new THREE.IcosahedronGeometry(.03,0)),moteMat=register(new THREE.MeshBasicMaterial({color:biome.bright,transparent:true,opacity:.6,depthWrite:false}));
 const count=48,particle=new THREE.InstancedMesh(moteGeo,moteMat,count);
 const offsets=[],matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1);
 for(let i=0;i<count;i++){const u=Math.floor(pick(i,1,floor)*(size-2))+1,v=Math.floor(pick(i,2,floor)*(size-2))+1;
  const x=u-offset+pick(i,3,floor)-.5,z=v-offset+pick(i,4,floor)-.5;
  offsets.push([x,1+pick(i,5,floor)*2.3,z,pick(i,6,floor)*6.28]);
  p.set(x,offsets[i][1],z);matrix.compose(p,q,scale);particle.setMatrixAt(i,matrix);
 }
 particle.instanceMatrix.needsUpdate=true;particle.frustumCulled=false;objects.add(particle);
 const update=(time)=>{
  for(let i=0;i<count;i++){
   const [x,y,z,phase]=offsets[i];p.set(x+Math.sin(time*.33+phase)*.12,y+Math.sin(time*.58+phase)*.19,z+Math.cos(time*.42+phase)*.14);
   matrix.compose(p,q,scale);particle.setMatrixAt(i,matrix);
  }
  particle.instanceMatrix.needsUpdate=true;
  for(const w of floaters){w.halo.rotation.z=time*.25;w.g.children[2].position.y=1.86+Math.sin(time*.9+w.phase)*.07}
  for(let i=0;i<lights.length;i++)lights[i].intensity=1.7+Math.sin(time*2+i)*.35;
  shaftMaterial.opacity=.05+Math.sin(time*.55)*.012;
 };
 const metrics={biome:biome.name,landmarks:floaters.length,glowSources:lights.length,particles:count,liquidOrRifts:pools.length,crystalClusters:spires.length,backgroundStructures:distantColumns.length,lightShafts:shafts.length};
 return{update,metrics,dispose(){
  objects.parent?.remove(objects);
  for(const m of material)m.dispose();for(const t of textures)t.dispose();for(const g of geometries)g.dispose();
 }};
}
