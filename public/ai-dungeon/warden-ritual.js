import * as THREE from '/dungeon/vendor/three.module.js';
import {planWardenCourtChapter,planWardenCourtStone,planWardenRift,WARDEN_COURT_STONES,WARDEN_RIFT_SEGMENTS} from '/dungeon/warden-chapter-plan.js';
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
 const plinths=[];
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3+.18,pylon=new THREE.Group();
  pylon.name='Ritual plinth '+i;pylon.position.set(Math.cos(angle)*1.68,0,Math.sin(angle)*1.68);pylon.rotation.y=-angle;
  put(pylon,plinth,stone,0,.12,0);put(pylon,column,metal,0,.61,0);
  put(pylon,crest,stone,0,1.13,0).rotation.z=i%2?-.06:.06;
  put(pylon,emblem,glyph,0,.73,-.128,.7,.7,.7).rotation.y=Math.PI/2;fixedCourt.add(pylon);plinths.push(pylon);
 }
 // Original low-profile sculpted basalt court: a visually continuous combat
 // stage that remains beneath feet. Unlike towering copies of corridor props,
 // radial relief stones give the Warden chamber its own material grammar without
 // covering autonomous actors or their real shockwave warning.
 const slabGeo=new THREE.BoxGeometry(.47,.048,.23),inciseGeo=new THREE.BoxGeometry(.32,.012,.020);
 const basalt=new THREE.MeshStandardMaterial({color:'#312c37',roughness:.94,metalness:.06});
 for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,radius=i%2?1.26:1.34,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  const slab=put(group,slabGeo,basalt,x,.014,z);
  slab.rotation.y=-angle;
  const cut=put(group,inciseGeo,metal,x,.047,z);
  cut.rotation.y=-angle;
 }

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
 const shaft=new THREE.CylinderGeometry(.22,.33,2.3,7),capGeo=new THREE.CylinderGeometry(.43,.31,.19,7);
 const archGeo=new THREE.TorusGeometry(.38,.063,5,18,Math.PI);
 const budGeo=new THREE.DodecahedronGeometry(.17,0);
 const makeWallMesh=(parent,geometry,material,x,y,z)=>{
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
 };
 for(const c of candidates){
  if(wallProps.length>=archMax)break;
  if(wallProps.some(p=>Math.hypot(p.position.x-c.dx,p.position.z-c.dz)<1.8))continue;
  const buttress=new THREE.Group();buttress.name='Warden cathedral wall buttress';
  buttress.position.set(c.dx,0,c.dz);
  makeWallMesh(buttress,shaft,buttressStone,0,1.16,0);
  makeWallMesh(buttress,capGeo,buttressMetal,0,2.26,0);
  const pointed=makeWallMesh(buttress,archGeo,buttressStone,0,2.48,-.13);
  pointed.rotation.z=Math.PI;
  makeWallMesh(buttress,budGeo,buttressMetal,0,2.49,-.14);
  fixedCourt.add(buttress);wallProps.push(buttress);
 }
 let hiddenWallProps=0,hiddenPlinths=0;
 function setSightlines(subjects=[],cameraPosition=null){
  hiddenWallProps=hiddenPlinths=0;
  if(!cameraPosition||!Array.isArray(subjects))return;
  // Six actual ceremonial pylons are anchored to the exit room, rather than
  // running around with the enemy. Ornament yields to real combat silhouettes.
  for(const [props,radius] of [[wallProps,2],[plinths,1.65]]){
   for(const prop of props){
    const wx=fixedCourt.position.x+prop.position.x,wz=fixedCourt.position.z+prop.position.z;
    const front=Math.hypot(cameraPosition.x-wx,cameraPosition.z-wz);
    const blocks=subjects.some(u=>Number.isFinite(u?.x)&&Number.isFinite(u?.z)&&
     Math.hypot(u.x-wx,u.z-wz)<radius&&
     front+.2<Math.hypot(cameraPosition.x-u.x,cameraPosition.z-u.z));
    prop.visible=!blocks;
    if(blocks){if(props===wallProps)hiddenWallProps++;else hiddenPlinths++;}
   }
  }
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
 const shards=[],shardGeo=new THREE.TetrahedronGeometry(.12,0);
 for(let i=0;i<12;i++){
  const angle=i*Math.PI/6;
  const shard=put(group,shardGeo,fragmentMat,Math.cos(angle)*.78,1.1+(i%3)*.13,Math.sin(angle)*.78);
  shard.userData.angle=angle;shard.userData.height=shard.position.y;shard.visible=false;shards.push(shard);
 }
 // Predictive stones are actually dangerous in the AI authority. One bounded
 // instanced draw renders all marked tiles below feet, not full-height beams.
 const warningMaterial=new THREE.MeshBasicMaterial({color:'#efbd79',transparent:true,
  opacity:.26,depthWrite:false,side:THREE.DoubleSide});
 const warningTiles=new THREE.InstancedMesh(
  new THREE.BoxGeometry(.84,.014,.84),warningMaterial,MAX_WARNING_TILES);
 warningTiles.name='Warden authoritative marked floor';warningTiles.count=0;
 warningTiles.visible=false;warningTiles.frustumCulled=false;group.add(warningTiles);
 // Inscribed boundaries convey the EXACT strike footprint at an isometric
 // camera angle, while the shaded tile interior leaves characters visible.
 // Shared instancing adds one bounded draw call, not a light per hazard tile.
 const edgeMaterial=new THREE.MeshBasicMaterial({color:'#fff0b6',transparent:true,
  opacity:.48,depthWrite:false,side:THREE.DoubleSide});
 const warningEdges=new THREE.InstancedMesh(new THREE.RingGeometry(.35,.445,8),edgeMaterial,MAX_WARNING_TILES);
 warningEdges.name='Warden imminent strike engraved boundaries';
 warningEdges.count=0;warningEdges.visible=false;warningEdges.frustumCulled=false;group.add(warningEdges);
 const marker=new THREE.Object3D();
 let warningCount=0,warningShape='none',impactAge=0,lastCastTick=-1;
 let ward=false,previousWard=null,tick=-1,breakAge=SHATTER_TIME;
 let visible=false,defenders=0,linkCount=0,phase='SENTINEL';
 let chapterTarget=planWardenCourtChapter({guardianWard:true}),chapterOpenness=0,chapterRendered=-1,chapterTransitions=0;
 const from=new THREE.Vector3(),to=new THREE.Vector3(),delta=new THREE.Vector3();
 function accept(s){
  if(!Array.isArray(s?.units))return;
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  visible=Boolean(boss);group.visible=visible;
  if(!boss){chapterTarget=planWardenCourtChapter({phase:'VANQUISHED',hp:0,maxHp:1});ward=false;defenders=linkCount=warningCount=0;warningTiles.count=warningEdges.count=0;warningTiles.visible=warningEdges.visible=false;for(const link of links)link.visible=false;return;}
  const half=(Array.isArray(s.map)?s.map.length-1:18)/2;
  group.position.set(boss.x-half,0,boss.z-half);
  const warning=s.bossWarning;
  if(Array.isArray(warning?.cells)){
   warningCount=Math.min(MAX_WARNING_TILES,warning.cells.length);
   warningShape=warning.shape||'none';
   warningMaterial.color.set(warning.shape==='ECLIPSE_SWEEP'?'#ad8fe0':
    warning.shape==='RIFT_CROSS'?'#f9a070':'#efc47d');
   edgeMaterial.color.set(warning.shape==='ECLIPSE_SWEEP'?'#cdb0fc':
    warning.shape==='RIFT_CROSS'?'#ffbe8d':'#ffeab1');
   for(let i=0;i<warningCount;i++){
    const p=warning.cells[i];
    marker.position.set(p.x-boss.x,.061,p.z-boss.z);
    marker.rotation.set(0,0,0);marker.scale.set(1,1,1);
    marker.updateMatrix();warningTiles.setMatrixAt(i,marker.matrix);
    marker.position.y=.084;marker.rotation.x=-Math.PI/2;
    marker.updateMatrix();warningEdges.setMatrixAt(i,marker.matrix);
   }
   warningTiles.count=warningEdges.count=warningCount;
   warningTiles.instanceMatrix.needsUpdate=true;
   warningEdges.instanceMatrix.needsUpdate=true;
  }else if(impactAge<=0){warningCount=0;warningShape='none';warningTiles.count=warningEdges.count=0;}
  if(boss.action==='cast'&&boss.actionTick===s.tick&&s.tick>lastCastTick){
   impactAge=.42;lastCastTick=s.tick;
  }
  warningTiles.visible=warningEdges.visible=warningCount>0&&Boolean(warning||impactAge>0);
  const minions=s.units.filter(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0);
  minions.sort((a,b)=>Math.abs(a.x-boss.x)+Math.abs(a.z-boss.z)-Math.abs(b.x-boss.x)-Math.abs(b.z-boss.z)||a.id.localeCompare(b.id));
  defenders=minions.length;ward=Boolean(s.guardianWard);
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
  warningTiles.visible=warningEdges.visible=warningCount>0&&(impactAge>0||warningTiles.count>0);
  warningMaterial.opacity=impactAge>0?Math.min(.48,.24+impactAge*.52):
   reducedMotion?.25:.19+.07*(1+Math.sin(time*6.2))*.5;
  edgeMaterial.opacity=impactAge>0?.72:reducedMotion?.46:.42+.18*(1+Math.sin(time*5.3))*.5;
  glyph.opacity=ward&&!reducedMotion?.63+.10*Math.sin(time*2):.70;
  reliefVein.emissiveIntensity=warningCount>0?.42:ward?.25:.12;
  reliefVein.opacity=warningCount>0?.72:.46;
  rings.forEach((ring,i)=>{ring.rotation.z=ward&&!reducedMotion?Math.sin(time*.45+i)*.07:0;});
  if(breakAge<SHATTER_TIME){
   breakAge=Math.min(SHATTER_TIME,breakAge+Math.max(0,Math.min(.05,dt)));
   const t=breakAge/SHATTER_TIME;
   fragmentMat.opacity=(1-t)*.83;
   for(const shard of shards){
    const angle=shard.userData.angle;
    shard.visible=t<1;
    shard.position.set(Math.cos(angle)*(.78+(reducedMotion?.14:t*.9)),shard.userData.height+(reducedMotion?0:.65*t*t),Math.sin(angle)*(.78+(reducedMotion?.14:t*.9)));
    shard.rotation.set(reducedMotion?0:t*2.6,reducedMotion?0:t*1.8,0);
   }
  }else for(const shard of shards)shard.visible=false;
 }
 return {accept,animate,setSightlines,metrics:()=>({sculptedCourtSlabs:courtSlabCount,originalEngravings:cutCount,cathedralWallButtresses:wallProps.length,phaseFractureSegments:faultVoidMesh.visible?WARDEN_RIFT_SEGMENTS:0,chapterOpenness:Math.round(chapterOpenness*1000)/1000,chapterTransitions,hiddenWallButtresses:hiddenWallProps,fixedCeremonialPlinths:plinths.length,hiddenPlinths,retractedPlinths:plinths.filter(p=>p.position.y<-.55).length,phaseRelief:phase,visible,shieldActive:ward,phase,activeDefenders:defenders,activeTethers:linkCount,shattering:breakAge<SHATTER_TIME,maxTethers:LIMIT,originalBasaltReliefs:12,warningTiles:warningCount,warningEdgedTiles:warningEdges.count,warningShape,impactActive:impactAge>0})};
}
