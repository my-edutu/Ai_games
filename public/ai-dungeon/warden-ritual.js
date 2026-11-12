import * as THREE from '/dungeon/vendor/three.module.js';
import {planWardenCourtChapter,planWardenCourtStone,planWardenRift,WARDEN_COURT_STONES,WARDEN_RIFT_SEGMENTS,WARDEN_WALL_BUTTRESS_PROFILE} from '/dungeon/warden-chapter-plan.js';
import {planWardenTellStage,planWardenReliefBeat,planWardenReliefTile} from '/dungeon/warden-tell-plan.js';
// Read-only original Warden ritual art. All beams, rings and shatter effects
// derive exclusively from the real public boss/defender/simulation state.
const UP=new THREE.Vector3(0,1,0),LIMIT=3,MAX_RANGE=7,SHATTER_TIME=1.05,MAX_WARNING_TILES=48;
export function createWardenRitual(world,exit,{reducedMotion=false,map=null}={}){
 const group=new THREE.Group();group.name='Living Warden ritual court';
 group.position.set(exit.x-9,0,exit.z-9);world.add(group);
 const fixedCourt=new THREE.Group();fixedCourt.name='Original immovable Warden cathedral';
 fixedCourt.position.set(exit.x-9,0,exit.z-9);world.add(fixedCourt);
 const stone=new THREE.MeshStandardMaterial({color:'#43404a',roughness:.86,metalness:.12});
 const metal=new THREE.MeshStandardMaterial({color:'#aa895b',roughness:.40,metalness:.66});
 const glyph=new THREE.MeshBasicMaterial({color:'#8cbede',transparent:true,opacity:.70,depthWrite:false});
 const conduit=new THREE.MeshBasicMaterial({color:'#a0d3ed',transparent:true,opacity:.56,depthWrite:false});
 const fragmentMat=new THREE.MeshStandardMaterial({color:'#afb5d2',emissive:'#647da5',emissiveIntensity:.6,roughness:.44,metalness:.42,transparent:true,opacity:0});
 const put=(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
 };
 // A restrained sculpted court gives the sealed boss a unique stage, not a
 // giant translucent effect that can hide real combat or block navigation.
 const plinth=new THREE.CylinderGeometry(.23,.30,.24,8),column=new THREE.CylinderGeometry(.085,.19,.82,7);
 const crest=new THREE.ConeGeometry(.20,.37,7),emblem=new THREE.TorusGeometry(.15,.019,5,24);
 // Reuse the six ORIGINAL ceremonial pylons and their exact authored poses,
 // but render their four parts as four real GPU batches rather than 24 draws.
 // This is scene-only: guardian ward, camera cutaway and source map are intact.
 const plinths=[];
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3+.18,pylon=new THREE.Object3D();
  pylon.name='Ritual plinth '+i;pylon.position.set(Math.cos(angle)*2.50,0,Math.sin(angle)*2.50);pylon.rotation.y=-angle;
  plinths.push(pylon);
 }
 const ceremonialParts=[
  {name:'Warden ceremonial plinth stones',geometry:plinth,material:stone,y:.12},
  {name:'Warden ceremonial forged shafts',geometry:column,material:metal,y:.49,sy:.72},
  {name:'Warden ceremonial pointed capitals',geometry:crest,material:stone,y:.85,tilt:true},
  {name:'Warden ceremonial engraved badges',geometry:emblem,material:glyph,y:.53,z:-.128,sx:.7,sy:.7,sz:.7,turn:Math.PI/2}
 ];
 const ceremonialBatches=ceremonialParts.map(part=>{
  const mesh=new THREE.InstancedMesh(part.geometry,part.material,plinths.length);
  mesh.name=part.name;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
  fixedCourt.add(mesh);return mesh;
 });
 const plinthUploadState=plinths.map(()=>({y:NaN,visible:null}));
 const anchor=new THREE.Object3D(),component=new THREE.Object3D(),instanceMatrix=new THREE.Matrix4();
 function uploadCeremonialPlinths(){
  let dirty=false;
  for(let i=0;i<plinths.length;i++){
   const pylon=plinths[i],state=plinthUploadState[i];
   if(Math.abs(pylon.position.y-state.y)<.000001&&state.visible===pylon.visible)continue;
   pylon.updateMatrix();state.y=pylon.position.y;state.visible=pylon.visible;dirty=true;
   for(let k=0;k<ceremonialParts.length;k++){
    const part=ceremonialParts[k];
    component.position.set(0,part.y,part.z||0);
    component.rotation.set(0,part.turn||0,part.tilt?(i%2?-.06:.06):0);
    component.scale.set(part.sx||1,part.sy||1,part.sz||1);component.updateMatrix();
    instanceMatrix.multiplyMatrices(pylon.matrix,component.matrix);
    if(!pylon.visible)instanceMatrix.scale(new THREE.Vector3(.00001,.00001,.00001));
    ceremonialBatches[k].setMatrixAt(i,instanceMatrix);
   }
  }
  if(dirty)for(const mesh of ceremonialBatches)mesh.instanceMatrix.needsUpdate=true;
 }
 uploadCeremonialPlinths();
 // Original low-profile sculpted basalt court: a visually continuous combat
 // stage that remains beneath feet. Unlike towering copies of corridor props,
 // radial relief stones give the Warden chamber its own material grammar without
 // covering autonomous actors or their real shockwave warning.
 const slabGeo=new THREE.BoxGeometry(.47,.048,.23),inciseGeo=new THREE.BoxGeometry(.32,.012,.020);
 const basalt=new THREE.MeshStandardMaterial({color:'#312c37',roughness:.94,metalness:.06});
 // Exact twelve original concentric basalt stones and engraved iron cuts,
 // sharing two batches rather than 24 separate meshes on the duel floor.
 const concentricLayers=[
  {name:'Warden concentric basalt stepping stones',geometry:slabGeo,material:basalt,y:.014},
  {name:'Warden concentric iron cuts',geometry:inciseGeo,material:metal,y:.047}
 ];
 const concentricBatches=concentricLayers.map(part=>{
  const mesh=new THREE.InstancedMesh(part.geometry,part.material,12);
  mesh.name=part.name;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
  const pose=new THREE.Object3D();
  for(let i=0;i<12;i++){
   const angle=i*Math.PI/6,radius=i%2?1.26:1.34;
   pose.position.set(Math.cos(angle)*radius,part.y,Math.sin(angle)*radius);
   pose.rotation.set(0,-angle,0);pose.scale.set(1,1,1);pose.updateMatrix();
   mesh.setMatrixAt(i,pose.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;group.add(mesh);return mesh;
 });
 // M1 Warden chapter: an original low, sculptural, traversable stone roundel.
 // All ornament lies below boots; gameplay collision and dangerous floor cells
 // remain solely the authority's. Batched original relief, no proprietary art.
 const courtSlabCount=WARDEN_COURT_STONES,cutCount=18,archMax=4;
 const reliefStone=new THREE.MeshStandardMaterial({color:'#4a4649',roughness:.95,metalness:.04});
 const reliefRim=new THREE.MeshStandardMaterial({color:'#876e53',roughness:.74,metalness:.30});
 const reliefVein=new THREE.MeshStandardMaterial({color:'#57747a',emissive:'#273e43',
  emissiveIntensity:.20,roughness:.55,metalness:.34,transparent:true,opacity:.64});
 const wedge=new THREE.Shape();
 wedge.moveTo(-.20,-.37);wedge.lineTo(.22,-.32);wedge.lineTo(.26,-.18);
 wedge.lineTo(.19,.32);wedge.lineTo(-.23,.40);wedge.lineTo(-.27,.14);wedge.closePath();
 const wedgeGeo=new THREE.ExtrudeGeometry(wedge,{depth:.055,steps:1,bevelEnabled:true,
  bevelThickness:.012,bevelSize:.012,bevelSegments:1});
 wedgeGeo.rotateX(-Math.PI/2);
 const slabs=new THREE.InstancedMesh(wedgeGeo,reliefStone,courtSlabCount);
 slabs.name='Original radial sculpted Warden court paving';slabs.receiveShadow=true;
 const monumentTransform=new THREE.Object3D();
 for(let i=0;i<courtSlabCount;i++){
  const pose=planWardenCourtStone(i,0);
  monumentTransform.position.set(pose.x,pose.y,pose.z);
  monumentTransform.rotation.set(pose.pitch,pose.yaw,pose.roll);
  monumentTransform.scale.set(pose.sx,1,pose.sz);
  monumentTransform.updateMatrix();slabs.setMatrixAt(i,monumentTransform.matrix);
  const shade=.83+(i%7)*.025;
  slabs.setColorAt(i,new THREE.Color().setRGB(shade,shade*.985,shade*.965));
 }
 slabs.instanceMatrix.needsUpdate=true;if(slabs.instanceColor)slabs.instanceColor.needsUpdate=true;
 fixedCourt.add(slabs);
 // Engraved, NOT high-volume effect geometry: genuine phase hue supports the
 // already authoritative warning footprint, instead of competing with it.
 const scoreGeo=new THREE.BoxGeometry(.036,.011,.47);
 const scoreMarks=new THREE.InstancedMesh(scoreGeo,reliefVein,cutCount);
 scoreMarks.name='Original phase-responsive engraved score marks';
 for(let i=0;i<cutCount;i++){
  const a=i*Math.PI*2/cutCount,r=1.86+(i%2)*.11;
  monumentTransform.position.set(Math.cos(a)*r,.056,Math.sin(a)*r);
  monumentTransform.rotation.set(0,-a,0);monumentTransform.scale.set(1,1,1);
  monumentTransform.updateMatrix();scoreMarks.setMatrixAt(i,monumentTransform.matrix);
 }
 scoreMarks.instanceMatrix.needsUpdate=true;fixedCourt.add(scoreMarks);
 const outerRelief=new THREE.Mesh(new THREE.TorusGeometry(2.80,.027,5,76),reliefRim);
 outerRelief.name='Stone roundel bronze-edged broken orbit';outerRelief.rotation.x=-Math.PI/2;
 outerRelief.position.y=.019;outerRelief.receiveShadow=true;fixedCourt.add(outerRelief);
 // Two bounded instance batches of shallow fractured ground. No enemy path
 // changes, no invented impact or opaque overlays on the true Warden telegraph.
 const faultVoidMaterial=new THREE.MeshStandardMaterial({color:'#19161b',roughness:.98,
  transparent:true,opacity:.84,depthWrite:false,side:THREE.DoubleSide});
 const faultEmberMaterial=new THREE.MeshBasicMaterial({color:'#b36e49',transparent:true,
  opacity:.45,depthWrite:false,side:THREE.DoubleSide});
 const faultVoidGeo=new THREE.PlaneGeometry(.21,.78),faultEmberGeo=new THREE.PlaneGeometry(.045,.74);
 faultVoidGeo.rotateX(-Math.PI/2);faultEmberGeo.rotateX(-Math.PI/2);
 const faultVoidMesh=new THREE.InstancedMesh(faultVoidGeo,faultVoidMaterial,WARDEN_RIFT_SEGMENTS);
 const faultEmberMesh=new THREE.InstancedMesh(faultEmberGeo,faultEmberMaterial,WARDEN_RIFT_SEGMENTS);
 faultVoidMesh.name='Original physical phase fracture';
 faultEmberMesh.name='Original subsurface heat seams';
 for(const mesh of [faultVoidMesh,faultEmberMesh]){
  mesh.visible=false;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
  fixedCourt.add(mesh);
 }

 // Gothic buttresses are restricted to EXISTING impassable map wall cells.
 // No ghost obstacles are drawn on legal AI routes or over contact silhouettes.
 const wallProps=[],mapSize=Array.isArray(map)?map.length:0;
 const candidates=[];
 if(mapSize>=7&&mapSize<=64&&map.every(row=>typeof row==='string'&&row.length===mapSize)){
  for(let z=0;z<mapSize;z++)for(let x=0;x<mapSize;x++){
   if(map[z][x]!=='#')continue;
   const dx=x-exit.x,dz=z-exit.z,dist=Math.hypot(dx,dz);
   if(dist<3||dist>5.35)continue;
   const inwardX=x-(Math.abs(dx)>=Math.abs(dz)?Math.sign(dx):0);
   const inwardZ=z-(Math.abs(dz)>Math.abs(dx)?Math.sign(dz):0);
   if(map[inwardZ]?.[inwardX]!=='.')continue;
   candidates.push({dx,dz,score:Math.abs(dist-4.1)+(dz>0?2.5:0)+(Math.abs(dx)<1?.4:0)});
  }
 }
 candidates.sort((a,b)=>a.score-b.score||a.dx-b.dx||a.dz-b.dz);
 const buttressStone=new THREE.MeshStandardMaterial({color:'#484247',roughness:.95,metalness:.09});
 const buttressMetal=new THREE.MeshStandardMaterial({color:'#82705b',roughness:.67,metalness:.39});
 // Genuine after-footage still showed a gigantic dark shaft with a broad
 // bronze polygonal capital. These EXACT source cylinders and bronze caps
 // produced the recognizable physical silhouette. Reconstruct them into
 // low original masonry-mounted sculptural relief without losing the boss
 // cathedral, authored materials, genuine solid-wall source placement or batching.
 const wallMass=WARDEN_WALL_BUTTRESS_PROFILE;
 const shaft=new THREE.CylinderGeometry(wallMass.shaftTop,wallMass.shaftBase,wallMass.shaftHeight,7);
 const capGeo=new THREE.CylinderGeometry(wallMass.capTop,wallMass.capBase,wallMass.capHeight,7);
 const archGeo=new THREE.TorusGeometry(wallMass.archRadius,wallMass.archTube,5,18,Math.PI);
 const budGeo=new THREE.DodecahedronGeometry(wallMass.finialRadius,0);
 // Same original Gothic shaft, cap, ogive and finial, in the same genuine
 // impassable wall niches. Four retained submissions replace up to sixteen
 // separate objects; visibility follows the exact physical sightline policy.
 for(const c of candidates){
  if(wallProps.length>=archMax)break;
  if(wallProps.some(p=>Math.hypot(p.position.x-c.dx,p.position.z-c.dz)<1.8))continue;
  const buttress=new THREE.Group();buttress.name='Warden cathedral wall buttress';
  buttress.position.set(c.dx,0,c.dz);
  fixedCourt.add(buttress);wallProps.push(buttress);
 }
 const buttressParts=[
  {name:'Warden batched cathedral shaft',geometry:shaft,material:buttressStone,y:wallMass.shaftY,z:0},
  {name:'Warden batched cathedral cap',geometry:capGeo,material:buttressMetal,y:wallMass.capY,z:0},
  {name:'Warden batched cathedral pointed arch',geometry:archGeo,material:buttressStone,y:wallMass.archY,z:-.08,roll:Math.PI},
  {name:'Warden batched cathedral finial',geometry:budGeo,material:buttressMetal,y:wallMass.finialY,z:-.08}
 ];
 const buttressBatches=wallProps.length?buttressParts.map(part=>{
  const mesh=new THREE.InstancedMesh(part.geometry,part.material,wallProps.length);
  mesh.name=part.name;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
  fixedCourt.add(mesh);return mesh;
 }):[];
 const buttressPose=new THREE.Object3D(),buttressMatrix=new THREE.Matrix4();
 const hiddenButtressScale=new THREE.Vector3(.00001,.00001,.00001);
 function uploadButtressSightlines(){
  if(!buttressBatches.length)return;
  for(let i=0;i<wallProps.length;i++){
   const site=wallProps[i];site.updateMatrix();
   for(let partIndex=0;partIndex<buttressParts.length;partIndex++){
    const part=buttressParts[partIndex];
    buttressPose.position.set(0,part.y,part.z);
    buttressPose.rotation.set(0,0,part.roll||0);
    buttressPose.scale.set(1,1,1);buttressPose.updateMatrix();
    buttressMatrix.multiplyMatrices(site.matrix,buttressPose.matrix);
    if(!site.visible)buttressMatrix.scale(hiddenButtressScale);
    buttressBatches[partIndex].setMatrixAt(i,buttressMatrix);
   }
  }
  for(const mesh of buttressBatches)mesh.instanceMatrix.needsUpdate=true;
 }
 uploadButtressSightlines();
 let hiddenWallProps=0,hiddenPlinths=0;
 function setSightlines(subjects=[],cameraPosition=null){
  hiddenWallProps=hiddenPlinths=0;
  if(!cameraPosition||!Array.isArray(subjects))return;
  // Six actual ceremonial pylons are anchored to the exit room, rather than
  // running around with the enemy. Ornament yields to real combat silhouettes.
  let buttressVisibilityChanged=false;
  for(const [props,radius] of [[wallProps,2],[plinths,1.65]]){
   for(const prop of props){
    const wx=fixedCourt.position.x+prop.position.x,wz=fixedCourt.position.z+prop.position.z;
    const front=Math.hypot(cameraPosition.x-wx,cameraPosition.z-wz);
    const blocks=subjects.some(u=>Number.isFinite(u?.x)&&Number.isFinite(u?.z)&&
     Math.hypot(u.x-wx,u.z-wz)<radius&&
     front+.2<Math.hypot(cameraPosition.x-u.x,cameraPosition.z-u.z));
    if(props===wallProps&&prop.visible===blocks)buttressVisibilityChanged=true;
    prop.visible=!blocks;
    if(blocks){if(props===wallProps)hiddenWallProps++;else hiddenPlinths++;}
   }
  }
  uploadCeremonialPlinths();
  if(buttressVisibilityChanged)uploadButtressSightlines();
 }
 const rings=[];
 for(const [r,y] of [[1.04,.27],[.86,.85],[.67,1.41]]){
  const mesh=put(group,new THREE.TorusGeometry(r,.017,6,56),glyph,0,y,0);
  mesh.rotation.x=Math.PI/2;rings.push(mesh);
 }
 const tetherGeometry=new THREE.CylinderGeometry(.023,.038,1,7),links=[];
 for(let i=0;i<LIMIT;i++){
  const link=put(group,tetherGeometry,conduit,0,1,0);
  link.name='Authority-backed living ward link '+i;link.visible=false;links.push(link);
 }
 // Twelve authentic ward-fracture shards retain every original 3D trajectory,
 // phase and material in one dynamically updated draw. Nothing is invented.
 const SHATTER_SHARD_COUNT=12,shardGeo=new THREE.TetrahedronGeometry(.12,0);
 const shardPositions=Array.from({length:SHATTER_SHARD_COUNT},(_,i)=>({
  angle:i*Math.PI/6,height:1.1+(i%3)*.13
 }));
 const shatterShards=new THREE.InstancedMesh(shardGeo,fragmentMat,SHATTER_SHARD_COUNT);
 shatterShards.name='Warden authentic breaking-ward fragments';shatterShards.count=0;
 shatterShards.frustumCulled=false;shatterShards.castShadow=false;
 shatterShards.receiveShadow=false;group.add(shatterShards);
 const shatterPose=new THREE.Object3D();
 // Predictive stones are actually dangerous in the AI authority. One bounded
 // instanced draw renders all marked tiles below feet, not full-height beams.
 // A threatened cell is a fitted piece of the EXISTING floor, not an
 // oversized HUD ring: actual carved basalt rises through the authentic
 // three-beat Warden anticipation, then subsides on the real strike.
 // One shared bevelled stone geometry, one bounded instanced draw, no lamps.
 const warningStoneShape=new THREE.Shape();
 warningStoneShape.moveTo(-.390,-.365);
 warningStoneShape.lineTo(-.340,-.417);
 warningStoneShape.lineTo(.333,-.417);
 warningStoneShape.lineTo(.408,-.354);
 warningStoneShape.lineTo(.390,.368);
 warningStoneShape.lineTo(.328,.408);
 warningStoneShape.lineTo(-.353,.408);
 warningStoneShape.lineTo(-.408,.352);
 warningStoneShape.closePath();
 const warningStoneGeometry=new THREE.ExtrudeGeometry(warningStoneShape,{
  steps:1,depth:.020,bevelEnabled:true,bevelThickness:.004,
  bevelSize:.006,bevelSegments:1
 });
 warningStoneGeometry.rotateX(-Math.PI/2);
 const warningMaterial=new THREE.MeshStandardMaterial({color:'#bc8454',
  emissive:'#73412b',emissiveIntensity:.17,metalness:.07,roughness:.86,
  transparent:true,opacity:.60,depthWrite:false,side:THREE.DoubleSide});
 const warningTiles=new THREE.InstancedMesh(
  warningStoneGeometry,warningMaterial,MAX_WARNING_TILES);
 warningTiles.name='Warden authoritative marked floor';warningTiles.count=0;
 warningTiles.visible=false;warningTiles.frustumCulled=false;group.add(warningTiles);
 // In genuine live NOVA and RIFT_CROSS screenshots, bright octagons on
 // EVERY threatened square bury skinned bodies and obscure tactical escape.
 // The true union boundary is drawn once by warningPerimeter below; no
 // independent per-cell halo can overdraw heroes or confuse adjacent tiles.
 // The warning is a PHYSICAL part of the court, not an overlay UI timer.
 // Each actual dangerous tile raises two original carved fissures as impact
 // nears. One additional bounded instanced draw call; no covering character
 // bodies, no lights per tile, no particle RNG, no invisible collision.
 const incisionMaterial=new THREE.MeshStandardMaterial({color:'#a95a32',emissive:'#f09b50',
  emissiveIntensity:.24,roughness:.57,metalness:.14,transparent:true,opacity:.80});
 const warningIncisions=new THREE.InstancedMesh(new THREE.BoxGeometry(.59,.034,.075),
  incisionMaterial,MAX_WARNING_TILES);
 warningIncisions.name='Warden physically incised authority warning stone';
 warningIncisions.count=0;warningIncisions.visible=false;
 warningIncisions.frustumCulled=false;group.add(warningIncisions);
 // Render a LOW physical perimeter on the exact authoritative danger cells.
 // One bounded instanced draw call, no copied assets or fictional collision.
 // A physically scored, ember-lined union contour instead of a technical
 // white grid. The raised basalt tiles still delineate ALL true threatened
 // cells; only exterior edges receive these recessed iron seams.
 const perimeterMaterial=new THREE.MeshStandardMaterial({color:'#a47859',
  emissive:'#612d20',emissiveIntensity:.22,roughness:.74,metalness:.26,
  transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide});
 const warningPerimeter=new THREE.InstancedMesh(
  new THREE.BoxGeometry(.87,.03,.052),perimeterMaterial,MAX_WARNING_TILES*4);
 warningPerimeter.name='Authoritative Warden strike perimeter in stone';
 warningPerimeter.count=0;warningPerimeter.visible=false;
 warningPerimeter.frustumCulled=false;group.add(warningPerimeter);
 const marker=new THREE.Object3D();
 let warningStage=planWardenTellStage(null,reducedMotion);
 let warningCount=0,warningBoundaryEdges=0,warningIncisionCount=0,warningShape='none',impactAge=0,lastCastTick=-1;
 let warningOffsets=[],warningStoneLift=0,impactReliefFrames=0;
 let ward=false,previousWard=null,tick=-1,breakAge=SHATTER_TIME,exposed=false;
 let visible=false,defenders=0,linkCount=0,phase='SENTINEL';
 let decorativePriority={mode:'inactive',ritualGlyphOpacity:.70,ritualConduitOpacity:.56,ritualReliefOpacity:.46};
 function setDecorativePriority(next){
  if(next&&['inactive','vanquished','warning','release','counter','sealed','approach'].includes(next.mode)&&
   [next.ritualGlyphOpacity,next.ritualConduitOpacity,next.ritualReliefOpacity].every(n=>Number.isFinite(n)&&n>=0&&n<=1))decorativePriority=next;
 }
 let chapterTarget=planWardenCourtChapter({guardianWard:true}),chapterOpenness=0,chapterRendered=-1,chapterTransitions=0;
 const from=new THREE.Vector3(),to=new THREE.Vector3(),delta=new THREE.Vector3();
 function accept(s){
  if(!Array.isArray(s?.units))return;
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  visible=Boolean(boss);group.visible=visible;
  if(!boss){chapterTarget=planWardenCourtChapter({phase:'VANQUISHED',hp:0,maxHp:1});ward=false;exposed=false;defenders=linkCount=warningCount=0;warningTiles.count=warningIncisions.count=warningPerimeter.count=0;warningBoundaryEdges=warningIncisionCount=0;warningTiles.visible=warningIncisions.visible=warningPerimeter.visible=false;warningStage=planWardenTellStage(null,reducedMotion);warningOffsets=[];warningStoneLift=0;for(const link of links)link.visible=false;return;}
  const half=(Array.isArray(s.map)?s.map.length-1:18)/2;
  group.position.set(boss.x-half,0,boss.z-half);
  const warning=s.bossWarning;
  warningStage=planWardenTellStage(warning,reducedMotion);
  if(Array.isArray(warning?.cells)){
   warningCount=Math.min(MAX_WARNING_TILES,warning.cells.length);
   const stoneBeat=planWardenReliefBeat(warningStage,impactAge,reducedMotion);
   warningStoneLift=stoneBeat.lift;
   warningOffsets.length=warningCount;
   warningShape=warning.shape||'none';
   warningMaterial.color.set(warning.shape==='ECLIPSE_SWEEP'?'#ad8fe0':
    warning.shape==='RIFT_CROSS'?'#f9a070':'#efc47d');
   for(let i=0;i<warningCount;i++){
    const p=warning.cells[i];
    // Actual authoritative cell coordinates only; tiny carved-stone relief
    // stages the true countdown without misleading the AI hitbox or escape.
    const ox=p.x-boss.x,oz=p.z-boss.z;
    warningOffsets[i]={x:ox,z:oz};
    const tile=planWardenReliefTile(warningStage,impactAge,Math.abs(ox)+Math.abs(oz),reducedMotion);
    marker.position.set(ox,.055+tile.lift,oz);
    // A signed tiny real-stone cant introduces a propagating physical
    // strike wave without lifting a safe cell or modifying collision.
    marker.rotation.set(0,(i%4)*Math.PI/2,(ox+oz<0?-1:1)*tile.tilt);
    marker.scale.set(tile.footprint,1,tile.footprint);
    marker.updateMatrix();warningTiles.setMatrixAt(i,marker.matrix);
   }
   // The *union* of actual danger cells has exactly one readable edge.
   // Adjacent threatened cells share no inner white fences. Sparse, shallow
   // fault lines reinforce the outer lip instead of painting every cell.
   const marked=new Set(warning.cells.slice(0,warningCount).map(p=>p.x+','+p.z));
   const frontier=[];
   warningBoundaryEdges=0;
   for(let i=0;i<warningCount;i++){
    const p=warning.cells[i];let isFrontier=false;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
     if(marked.has((p.x+dx)+','+(p.z+dz)))continue;
     isFrontier=true;
     marker.position.set(p.x-boss.x+dx*.43,.092+warningStage.emboss,p.z-boss.z+dz*.43);
     marker.rotation.set(0,dx!==0?Math.PI/2:0,0);
     marker.scale.set(1,1,1);marker.updateMatrix();
     warningPerimeter.setMatrixAt(warningBoundaryEdges++,marker.matrix);
    }
    if(isFrontier)frontier.push(p);
   }
   // One original shallow in-stone fissure for EVERY legitimately dangerous
   // authority cell. The old sparse frontier sample left most of a real
   // 25-cell NOVA indistinguishable from safe masonry on a 390px recording.
   // Keep the same ONE existing GPU instance batch, no new meshes/lights and
   // no mark outside the authoritative footprint. Physical stroke direction
   // distinguishes radial NOVA, axis-aligned RIFT and swept ECLIPSE even
   // without colour, with all geometry below a standing source GLB's boots.
   warningIncisionCount=0;
   for(let i=0;i<warningCount;i++){
    const p=warning.cells[i],ox=p.x-boss.x,oz=p.z-boss.z;
    const radial=Math.atan2(oz,ox)+Math.PI/2;
    const direction=warning.shape==='NOVA'?radial:
     warning.shape==='RIFT_CROSS'?(Math.abs(ox)>Math.abs(oz)?Math.PI/2:0):
     (i%2===0?Math.PI/3:-Math.PI/3);
    marker.position.set(ox,.107+warningStage.emboss,oz);
    marker.rotation.set(0,direction,0);
    marker.scale.set(warningStage.ornamentScale,1,1);
    marker.updateMatrix();warningIncisions.setMatrixAt(warningIncisionCount++,marker.matrix);
   }
   warningPerimeter.count=warningBoundaryEdges;
   warningPerimeter.instanceMatrix.needsUpdate=true;
   warningTiles.count=warningCount;
   warningIncisions.count=warningIncisionCount;
   warningTiles.instanceMatrix.needsUpdate=true;
   warningIncisions.instanceMatrix.needsUpdate=true;
  }else if(impactAge<=0){warningCount=warningBoundaryEdges=warningIncisionCount=0;warningShape='none';warningTiles.count=warningIncisions.count=warningPerimeter.count=0;warningOffsets=[];warningStoneLift=0;}
  if(boss.action==='cast'&&boss.actionTick===s.tick&&s.tick>lastCastTick){
   impactAge=.42;lastCastTick=s.tick;
  }
  warningTiles.visible=warningIncisions.visible=warningPerimeter.visible=warningCount>0&&Boolean(warning||impactAge>0);
  const minions=s.units.filter(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0);
  minions.sort((a,b)=>Math.abs(a.x-boss.x)+Math.abs(a.z-boss.z)-Math.abs(b.x-boss.x)-Math.abs(b.z-boss.z)||a.id.localeCompare(b.id));
  defenders=minions.length;ward=Boolean(s.guardianWard);
  exposed=Number.isInteger(s.bossRecovery?.remaining)&&s.bossRecovery.remaining>0;
  const newPhase=s.bossPhase||'SENTINEL';
  if(newPhase!==phase){
   const tint={SENTINEL:'#8cbede',RUPTURE:'#f0b381',ECLIPSE:'#caa2fc',VANQUISHED:'#88868a'}[newPhase]||'#8cbede';
   glyph.color.set(tint);conduit.color.set(tint);reliefVein.color.set(tint);reliefVein.emissive.set(tint);phase=newPhase;
  }
  const previousChapter=chapterTarget;
  chapterTarget=planWardenCourtChapter({phase:newPhase,guardianWard:ward,hp:boss.hp,maxHp:boss.maxHp});
  if(previousChapter.phase!==chapterTarget.phase||previousChapter.sealed!==chapterTarget.sealed)chapterTransitions++;
  if(previousWard===true&&!ward&&Number.isInteger(s.tick)&&s.tick>tick)breakAge=0;
  previousWard=ward;tick=Number.isInteger(s.tick)?s.tick:tick;
  for(const ring of rings)ring.visible=ward;
  const nearby=ward?minions.filter(u=>Math.abs(u.x-boss.x)+Math.abs(u.z-boss.z)<=MAX_RANGE).slice(0,LIMIT):[];
  for(let i=0;i<LIMIT;i++){
   const link=links[i],unit=nearby[i];link.visible=Boolean(unit);if(!unit)continue;
   from.set(0,1.33,0);to.set(unit.x-boss.x,.83,unit.z-boss.z);
   delta.subVectors(to,from);link.position.copy(from).addScaledVector(delta,.5);
   link.quaternion.setFromUnitVectors(UP,delta.clone().normalize());link.scale.y=delta.length();
  }
  linkCount=nearby.length;
 }
 function animate(time,dt=0){
  // The Warden's actual binding guards sustain his cathedral plinths; as the
  // seal breaks the ROOM architecture sinks, clearing the real boss fight.
  // Reduced motion cuts directly to the correct phase without interpolation.
  const step=Math.max(0,Math.min(.05,dt));
  for(const pillar of plinths){
   const target=ward?0:-.91;
   pillar.position.y=reducedMotion?target:pillar.position.y+(target-pillar.position.y)*Math.min(1,step*5.2);
  }
  uploadCeremonialPlinths();
  const goal=chapterTarget.openness;
  chapterOpenness=reducedMotion?goal:chapterOpenness+(goal-chapterOpenness)*Math.min(1,step*2.6);
  if(Math.abs(chapterOpenness-chapterRendered)>.0007){
   for(let i=0;i<courtSlabCount;i++){
    const p=planWardenCourtStone(i,chapterOpenness);
    monumentTransform.position.set(p.x,p.y,p.z);
    monumentTransform.rotation.set(p.pitch,p.yaw,p.roll);
    monumentTransform.scale.set(p.sx,1,p.sz);monumentTransform.updateMatrix();
    slabs.setMatrixAt(i,monumentTransform.matrix);
   }
   slabs.instanceMatrix.needsUpdate=true;
   for(let i=0;i<WARDEN_RIFT_SEGMENTS;i++){
    const p=planWardenRift(i,chapterOpenness);
    monumentTransform.position.set(p.x,.061,p.z);
    monumentTransform.rotation.set(0,p.yaw,0);
    monumentTransform.scale.set(Math.max(.001,p.width),1,p.length);
    monumentTransform.updateMatrix();faultVoidMesh.setMatrixAt(i,monumentTransform.matrix);
    monumentTransform.position.y=.065;
    monumentTransform.scale.x=Math.max(.001,p.width*.85);
    monumentTransform.updateMatrix();faultEmberMesh.setMatrixAt(i,monumentTransform.matrix);
   }
   faultVoidMesh.instanceMatrix.needsUpdate=true;
   faultEmberMesh.instanceMatrix.needsUpdate=true;
   faultVoidMesh.visible=faultEmberMesh.visible=chapterOpenness>.11;
   faultEmberMaterial.opacity=Math.min(.49,chapterOpenness*.40);
   chapterRendered=chapterOpenness;
  }
  if(!visible)return;
  impactAge=Math.max(0,impactAge-Math.max(0,Math.min(.05,dt)));
  const stoneBeat=planWardenReliefBeat(warningStage,impactAge,reducedMotion);
  warningStoneLift=stoneBeat.lift;
  // During the ACTUAL cast, the same authoritative slabs physically settle
  // into the scored courtyard. This replaces a HUD-only pulse with readable
  // contact rhythm, and is capped to 48 live tiles and the real 0.42s impact.
  if(stoneBeat.impact&&warningCount>0){
   for(let i=0;i<warningCount&&i<warningOffsets.length;i++){
    const p=warningOffsets[i];
    const tile=planWardenReliefTile(warningStage,impactAge,Math.abs(p.x)+Math.abs(p.z),reducedMotion);
    marker.position.set(p.x,.055+tile.lift,p.z);
    marker.rotation.set(0,(i%4)*Math.PI/2,(p.x+p.z<0?-1:1)*tile.tilt);
    marker.scale.set(tile.footprint,1,tile.footprint);
    marker.updateMatrix();warningTiles.setMatrixAt(i,marker.matrix);
   }
   warningTiles.instanceMatrix.needsUpdate=true;
   impactReliefFrames=Math.min(1000000,impactReliefFrames+1);
  }
  warningMaterial.emissiveIntensity=stoneBeat.ember;
  warningTiles.visible=warningIncisions.visible=warningPerimeter.visible=warningCount>0&&(impactAge>0||warningTiles.count>0);
  // The warning may only be drawn once every ~400ms on software WebGL.
  // A nearly transparent pulse becomes invisible between frames. Keep the
  // TRUE low carved floor visibly distinct at every delivery (including
  // reduced motion), with a restrained real-countdown progression.
  warningMaterial.opacity=impactAge>0?.58:
   reducedMotion?.58:Math.min(.71,.50+.18*warningStage.progress+.025*(1+Math.sin(time*2.4))*.5);
  perimeterMaterial.opacity=impactAge>0?.82:warningStage.warning?.47+.30*warningStage.progress:0;
  perimeterMaterial.emissiveIntensity=impactAge>0?.72:warningStage.warning?.18+.42*warningStage.progress:.1;
  // Material glow progresses with the real impact countdown. Even with
  // prefers-reduced-motion, the marks remain continuously visible and stable.
  incisionMaterial.emissiveIntensity=impactAge>0?.52:warningStage.glow;
  incisionMaterial.opacity=impactAge>0?.90:warningStage.warning?.84+.11*warningStage.progress:.0;
  // Quiet ONLY ornamental source glyphs, conduits and engraved relief as the
  // authoritative 23-cell hazard takes visual priority. The actual warning
  // stones, incisions, perimeter and combat actors remain entirely untouched.
  glyph.opacity=decorativePriority.ritualGlyphOpacity;
  conduit.opacity=decorativePriority.ritualConduitOpacity;
  reliefVein.emissiveIntensity=exposed?.55:warningCount>0?.42:ward?.25:.12;
  reliefVein.opacity=decorativePriority.ritualReliefOpacity;
  rings.forEach((ring,i)=>{ring.rotation.z=ward&&!reducedMotion?Math.sin(time*.45+i)*.07:0;});
  if(breakAge<SHATTER_TIME){
   breakAge=Math.min(SHATTER_TIME,breakAge+Math.max(0,Math.min(.05,dt)));
   const t=breakAge/SHATTER_TIME;
   fragmentMat.opacity=(1-t)*.83;
   shatterShards.count=t<1?SHATTER_SHARD_COUNT:0;
   if(shatterShards.count){
    for(let i=0;i<SHATTER_SHARD_COUNT;i++){
     const shard=shardPositions[i],angle=shard.angle;
     shatterPose.position.set(Math.cos(angle)*(.78+(reducedMotion?.14:t*.9)),
      shard.height+(reducedMotion?0:.65*t*t),Math.sin(angle)*(.78+(reducedMotion?.14:t*.9)));
     shatterPose.rotation.set(reducedMotion?0:t*2.6,reducedMotion?0:t*1.8,0);
     shatterPose.updateMatrix();shatterShards.setMatrixAt(i,shatterPose.matrix);
    }
    shatterShards.instanceMatrix.needsUpdate=true;
   }
  }else shatterShards.count=0;
 }
 // Teardown releases the runtime's original scene-owned geometries/materials.
 function dispose(){
  group.removeFromParent();fixedCourt.removeFromParent();
  const allGeometry=new Set(),allMaterials=new Set();
  for(const parent of [group,fixedCourt])parent.traverse(node=>{
   if(node.geometry)allGeometry.add(node.geometry);
   for(const mat of Array.isArray(node.material)?node.material:node.material?[node.material]:[])allMaterials.add(mat);
  });
  for(const geometry of allGeometry)geometry.dispose();
  for(const material of allMaterials)material.dispose();
 }
 return {accept,animate,setDecorativePriority,setSightlines,dispose,metrics:()=>({ceremonialDrawBatches:ceremonialBatches.length,
  concentricDrawBatches:concentricBatches.length,sculptedCourtSlabs:courtSlabCount,originalEngravings:cutCount,cathedralWallButtresses:wallProps.length,cathedralWallBatches:buttressBatches.length,
  cathedralSourceDraws:wallProps.length*4,cathedralWallProfile:{mountedOnImpassableWall:true,actualPhysicalTopMeters:wallMass.maxTopMeters,originalPhysicalShaftMeters:wallMass.oldShaftHeight,originalCrownHeightMeters:wallMass.oldArchHeight,retainedDrawBatches:buttressBatches.length},shatterDrawBatches:shatterShards.count>0?1:0,
  decorativePriority:{mode:decorativePriority.mode,glyphOpacity:glyph.opacity,
   conduitOpacity:conduit.opacity,reliefOpacity:reliefVein.opacity},
  shatterSourcePieces:SHATTER_SHARD_COUNT,phaseFractureSegments:faultVoidMesh.visible?WARDEN_RIFT_SEGMENTS:0,chapterOpenness:Math.round(chapterOpenness*1000)/1000,chapterTransitions,hiddenWallButtresses:hiddenWallProps,fixedCeremonialPlinths:plinths.length,hiddenPlinths,retractedPlinths:plinths.filter(p=>p.position.y<-.55).length,phaseRelief:phase,visible,shieldActive:ward,exposedCounterWindow:exposed,phase,activeDefenders:defenders,activeTethers:linkCount,shattering:breakAge<SHATTER_TIME,maxTethers:LIMIT,originalBasaltReliefs:12,warningTiles:warningCount,warningEdgedTiles:0,warningBoundaryEdges,warningIncisions:warningIncisions.count,warningTellProgress:warningStage.progress,warningShape,warningStoneLift,warningStoneGeometry:'bevelled-original-basalt',impactReliefFrames,impactActive:impactAge>0})};
}
