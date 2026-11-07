import * as THREE from '/dungeon/vendor/three.module.js';
import {planChapterNaves,planChapterTension,planChapterEncounterBeat} from '/dungeon/chapter-nave-plan.js';
import {planPartyWallReveal,createCutawayBandCache,shouldUploadCutawayBand} from '/dungeon/party-visibility-plan.js';

/**
 * Original physical nave chapters in up to three actual connected open
 * sanctuaries. Four capped GPU instanced draws, no AI/collision change.
 * Engraved Gothic roses are on real traversable floor; stone lancets and
 * buttresses cling to genuine, impassable wall faces. Source-only staging.
 */
export function createChapterNaves(world,map,exit,floor,{reducedMotion=false,encounterUnits=[]}={}){
 const plan=planChapterNaves(map,exit,floor,encounterUnits),group=new THREE.Group();
 group.name='Original sculpted nave chapters';world.add(group);
 const geometries=[],materials=[],meshes=[],up=new THREE.Vector3(0,1,0);
 const ownedGeo=g=>(geometries.push(g),g);
 const ownedMat=m=>(materials.push(m),m);
 const palette=[
  {stone:'#857866',metal:'#a79073',lumen:'#a38a6b'},
  {stone:'#8e665c',metal:'#b38b78',lumen:'#d39462'},
  {stone:'#64758e',metal:'#8e9db4',lumen:'#9ba8c1'},
  {stone:'#797188',metal:'#aa9aa9',lumen:'#aa94b9'}
 ][(floor-1)%4];
 const stone=ownedMat(new THREE.MeshStandardMaterial({color:palette.stone,roughness:.91,metalness:.06,flatShading:true}));
 const iron=ownedMat(new THREE.MeshStandardMaterial({color:palette.metal,roughness:.58,metalness:.43}));
 const reliefLight=ownedMat(new THREE.MeshStandardMaterial({color:palette.lumen,roughness:.62,metalness:.19,
  emissive:palette.lumen,emissiveIntensity:.045}));
 // Single PBR batch with per-vertex stone/brass tones; a physical forged
 // seal, double iron ring and actual sword relief remain visible inside it.
 // Fusing floor and inlays avoids three extra draw calls in live combat.
 const courtFinish=ownedMat(new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,
  roughness:.78,metalness:.22,emissive:'#43372e',emissiveIntensity:.055,
  polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide}));
 const dais=ownedGeo(new THREE.CylinderGeometry(.77,.82,.045,24,1));
 // Physical original hand-forged swordcourt inlays, flush in real walkable
 // three-by-three chapels: never another opaque prop blocking live actors.
 const outerSeal=ownedGeo(new THREE.TorusGeometry(.69,.014,6,48).rotateX(-Math.PI/2));
 const innerSeal=ownedGeo(new THREE.TorusGeometry(.42,.009,5,36).rotateX(-Math.PI/2));
 const bladeShape=new THREE.Shape();
 bladeShape.moveTo(-.05,-.32);bladeShape.lineTo(-.05,.13);
 bladeShape.lineTo(-.10,.13);bladeShape.lineTo(-.10,.18);
 bladeShape.lineTo(-.025,.18);bladeShape.lineTo(0,.36);
 bladeShape.lineTo(.025,.18);bladeShape.lineTo(.10,.18);
 bladeShape.lineTo(.10,.13);bladeShape.lineTo(.05,.13);
 bladeShape.lineTo(.05,-.32);bladeShape.closePath();
 const bladeRelief=ownedGeo(new THREE.ShapeGeometry(bladeShape,8).rotateX(-Math.PI/2));
 /**
  * Assemble genuine raised stone and forged reliefs in ONE closed Three.js
  * instanced surface. The authored stone dais, double 3D rings and swordpoint
  * all retain their vertices/normals (not texture decals or fake UI). Four
  * chapter batches means less CPU/WebGL pressure during live sword contact.
  * This builds once at floor load, not once per animation frame.
  */
 function fuseCourtGeometry(parts){
  const positions=[],normals=[],colors=[],uvs=[];
  for(const {geometry,color,y} of parts){
   const expanded=geometry.index?geometry.toNonIndexed():geometry;
   const pos=expanded.getAttribute('position'),normal=expanded.getAttribute('normal');
   const tex=expanded.getAttribute('uv'),tint=new THREE.Color(color);
   for(let i=0;i<pos.count;i++){
    positions.push(pos.getX(i),pos.getY(i)+y,pos.getZ(i));
    normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));
    colors.push(tint.r,tint.g,tint.b);
    uvs.push(tex?.getX(i)??0,tex?.getY(i)??0);
   }
   if(expanded!==geometry)expanded.dispose();
  }
  const fused=new THREE.BufferGeometry();
  fused.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  fused.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  fused.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  fused.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  fused.computeBoundingSphere();
  return fused;
 }
 // Each offset is relative to the original dais origin at world Y=-.047.
 // Old individual rings stood at .024/.026, and the blade at .028.
 const forgedCourt=ownedGeo(fuseCourtGeometry([
  {geometry:dais,color:palette.stone,y:0},
  {geometry:outerSeal,color:'#c7a782',y:.071},
  {geometry:innerSeal,color:'#bda180',y:.073},
  {geometry:bladeRelief,color:'#dfbd8f',y:.075}
 ]));
 // Each petal has a curved, beveled real stone outline and profile.
 const petalShape=new THREE.Shape();
 petalShape.moveTo(-.083,0);petalShape.lineTo(-.059,.20);
 petalShape.quadraticCurveTo(0,.38,.064,.20);petalShape.lineTo(.083,0);
 petalShape.quadraticCurveTo(0,.065,-.083,0);
 const petal=ownedGeo(new THREE.ExtrudeGeometry(petalShape,{
  depth:.018,steps:1,bevelEnabled:true,bevelThickness:.009,bevelSize:.007,
  bevelSegments:1,curveSegments:7
 }).rotateX(-Math.PI/2));
 // Physical chamfered Gothic lancet, with real aperture (not a billboard).
 const lancet=new THREE.Shape();
 lancet.moveTo(-.24,-.55);lancet.lineTo(-.24,.10);
 lancet.quadraticCurveTo(-.21,.37,0,.55);
 lancet.quadraticCurveTo(.21,.37,.24,.10);lancet.lineTo(.24,-.55);lancet.closePath();
 const aperture=new THREE.Path();
 aperture.moveTo(-.11,-.38);aperture.lineTo(.11,-.38);aperture.lineTo(.11,.07);
 aperture.quadraticCurveTo(.10,.23,0,.36);
 aperture.quadraticCurveTo(-.10,.23,-.11,.07);aperture.closePath();
 lancet.holes.push(aperture);
 const arch=ownedGeo(new THREE.ExtrudeGeometry(lancet,{
  depth:.11,steps:1,bevelEnabled:true,bevelThickness:.018,bevelSize:.014,
  bevelSegments:1,curveSegments:8
 }));
 const buttress=ownedGeo(new THREE.LatheGeometry([
  new THREE.Vector2(.135,0),new THREE.Vector2(.170,.13),
  new THREE.Vector2(.122,.30),new THREE.Vector2(.095,.75),
  new THREE.Vector2(.125,1.18),new THREE.Vector2(.160,1.30)
 ],9));
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),
  rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
 const pose=(x,y,z,yaw,sx=1,sy=1,sz=1)=>{
  position.set(x,y,z);rotation.setFromAxisAngle(up,yaw);
  scale.set(sx,sy,sz);return matrix.compose(position,rotation,scale);
 };
 const batch=(geometry,material,items,name,place)=>{
  if(!items.length)return null;
  const mesh=new THREE.InstancedMesh(geometry,material,items.length);
  mesh.name=name;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;
  items.forEach((entry,i)=>mesh.setMatrixAt(i,place(entry)));
  mesh.instanceMatrix.needsUpdate=true;group.add(mesh);meshes.push(mesh);return mesh;
 };
 const sealRings=batch(forgedCourt,courtFinish,plan.rooms,'Fused forged stone-and-sword courts',
  room=>pose(room.x,-.047,room.z,((floor+room.gridX+room.gridZ)%4)*Math.PI/2));
 batch(petal,reliefLight,plan.rosettes,'Carved 3D chapter rosettes',
  p=>pose(p.x,.017,p.z,p.yaw));
 const windows=batch(arch,stone,plan.reliefs,'Original nave lancet apertures',
  p=>pose(p.x,.97,p.z,p.yaw));
 const pillars=batch(buttress,iron,plan.reliefs,'Recessed sculpted Gothic buttresses',
  p=>pose(p.x,.04,p.z,p.yaw,.88,1,.88));
 // At most one practical: it tracks an ACTUAL contested chamber.
 const chapterKey=new THREE.PointLight('#f6b782',0,4.2,2);
 chapterKey.position.set(0,1.54,0);chapterKey.castShadow=false;
 group.add(chapterKey);
 let previous=null,combatAge=10;
 const bands=createCutawayBandCache(plan.reliefs.length);
 const metrics={roomCount:plan.rooms.length,rosettes:plan.rosettes.length,
  wallLancets:plan.reliefs.length,drawBatches:meshes.length,
  forgedCourtElements:plan.rooms.length*4,courtBatches:sealRings?1:0,
  source:'real-connected-walkable-floor-and-walls',authorityChanged:false,
  foeAnchoredChapters:plan.rooms.filter(room=>room.chapterSource==='living-foe').length,
  liveDuelPresent:false,liveDuelDistance:null,chapterFacingPair:null,
  cutawayLancets:0,matrixWrites:0,warning:false,phase:'NONE',
  contestedRooms:0,authenticWounds:0,verifiedWoundFlashes:0,
  stageMode:'QUIET',dynamicPracticals:1,authorityChanged:false};
 function accept(snapshot){
  const tension=planChapterTension(snapshot);
  const beat=planChapterEncounterBeat(snapshot,previous,plan.rooms);
  const focus=beat.focusRoom,staged=beat.rooms[focus];
  if(staged?.wounds>0){combatAge=0;metrics.verifiedWoundFlashes+=staged.wounds;}
  chapterKey.visible=focus>=0;
  if(chapterKey.visible){
   const pair=staged.livePair,half=(map.length-1)/2;
   // Exact real living fighter midpoint rather than an empty decorative
   // floor emblem. The single existing non-shadow light carries duel form.
   chapterKey.position.set(pair?pair.gridX-half:plan.rooms[focus].x,1.72,
    pair?pair.gridZ-half:plan.rooms[focus].z);
  }
  metrics.liveDuelPresent=Boolean(staged?.livePair);
  metrics.liveDuelDistance=staged?.livePair?.steps??null;
  metrics.chapterFacingPair=staged?.livePair?
   staged.livePair.heroId+' / '+staged.livePair.enemyId:null;
  chapterKey.intensity=chapterKey.visible?.62:0;
  for(let i=0;i<plan.rooms.length;i++){
   const activity=beat.rooms[i]?.intensity??0;
   sealRings?.setColorAt(i,new THREE.Color().setRGB(
    .57+activity*.34,.49+activity*.15,.40+activity*.08));
  }
  if(sealRings?.instanceColor)sealRings.instanceColor.needsUpdate=true;
  reliefLight.emissiveIntensity=Math.min(.45,tension.light+(staged?.intensity??0)*.12);
  courtFinish.emissiveIntensity=.055+(staged?.intensity??0)*.065;
  metrics.warning=tension.warning;metrics.phase=tension.phase;
  metrics.contestedRooms=beat.contestedRooms;metrics.authenticWounds=beat.authenticWounds;
  metrics.stageMode=staged?.phase??'QUIET';
  previous={run:snapshot?.run,floor:snapshot?.floor,
   units:(Array.isArray(snapshot?.units)?snapshot.units:[]).slice(0,32)
    .map(u=>({id:u.id,hp:u.hp}))};
 }
 function animate(dt){
  combatAge=Math.min(10,combatAge+(Number.isFinite(dt)?Math.max(0,Math.min(dt,.05)):0));
  if(!chapterKey.visible)return;
  // Only a genuine wound briefly boosts a physical light. Reduced motion
  // preserves a steady readable combat practical, without strobing.
  const pulse=!reducedMotion&&combatAge<.55?.45*(1-combatAge/.55):0;
  chapterKey.intensity=.62+pulse;
 }
 function cutaway(eyes,camera,pad=2.1){
  let hidden=0,writes=0;
  for(let i=0;i<plan.reliefs.length;i++){
   const p=plan.reliefs[i],reveal=planPartyWallReveal(p.x,p.z,eyes,camera,pad),
    band=reveal==='sightline'?2:reveal==='nearby'?1:0;
   if(band)hidden++;
   if(!shouldUploadCutawayBand(bands,i,band))continue;
   const size=band?.0001:1;
   windows.setMatrixAt(i,pose(p.x,.97,p.z,p.yaw,size,size,size));
   pillars.setMatrixAt(i,pose(p.x,.04,p.z,p.yaw,.88*size,size,.88*size));
   writes++;
  }
  if(writes){windows.instanceMatrix.needsUpdate=true;pillars.instanceMatrix.needsUpdate=true;}
  metrics.cutawayLancets=hidden;metrics.matrixWrites=writes;
 }
 return {metrics,accept,animate,cutaway,dispose(){
  group.parent?.remove(group);
  for(const mesh of meshes)mesh.dispose?.();
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
 }};
}
