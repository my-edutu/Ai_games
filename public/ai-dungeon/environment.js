import * as THREE from '/dungeon/vendor/three.module.js';
import {addDungeonWindows} from '/dungeon/architecture.js';
import {planStoneRelief} from '/dungeon/stone-relief-plan.js';
import {planCutawayFloorBacking,planCutawayCapTransform} from '/dungeon/cutaway-floor-plan.js';
import {planPartyWallReveal,planLiveFacadeBodyReveal,createCutawayBandCache,shouldUploadCutawayBand,planProjectedBodyAperture,planPortraitStageClearance} from '/dungeon/party-visibility-plan.js';
import {planDungeonWallProfiles,planLegibleWallMass} from '/dungeon/wall-profile-plan.js';
import {createWardenCourt} from '/dungeon/warden-court.js';
import {createConnectedDungeonJourney} from '/dungeon/connected-journey.js';
import {createAlternateDungeonGallery} from '/dungeon/alternate-gallery.js';
import {planWardenCourtNegativeSpace} from '/dungeon/warden-court-plan.js';
import {planWardenBattleFloor,planWardenCourtDetailMask} from '/dungeon/warden-battle-floor-plan.js';
import {captureForegroundVolumes,planForegroundBodyClearance,planForegroundWarningClearance} from '/dungeon/foreground-sightline-plan.js';
import {applyForegroundRecession} from '/dungeon/foreground-recession.js';
import {configureSoftwareStoneSurfaces,createSoftwareDiffuseMasonry,fuseOriginalForegroundGroup,createRetainedForegroundReplicaBatches} from '/dungeon/postfx-budget.js';

// Purely cosmetic, reproducible procedural dressing. This code never touches game authority.
// All geometry is batched or tightly budgeted so a streaming run can regenerate indefinitely.
// Decorative biome details.
const BIOMES=[
 {mortar:'#292721',stone:'#776a59',edge:'#af977a',glow:'#64baa2',banner:'#685947',foliage:'#59654d'},
 {mortar:'#2b1529',stone:'#65515e',edge:'#b98984',glow:'#ff975a',banner:'#af5069',foliage:'#a06a43'},
 {mortar:'#131c35',stone:'#36496b',edge:'#7e9bd1',glow:'#77e3ff',banner:'#4b7db6',foliage:'#497e91'},
 {mortar:'#1d1737',stone:'#62517b',edge:'#ad9cc8',glow:'#ba9bff',banner:'#7e5fc4',foliage:'#62528c'}
];
function hash(a,b,c){let n=Math.imul(a+37,374761393)^Math.imul(b+93,668265263)^Math.imul(c+17,1442695041);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0}
function rand(a,b,c){return hash(a,b,c)/4294967296}
function texture(floor,kind,biome){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle=biome.mortar;c.fillRect(0,0,256,256);
 const base=new THREE.Color(biome.stone),edge=new THREE.Color(biome.edge);
 for(let row=0;row<5;row++){
  const y=row*52-15;
  for(let col=-1;col<5;col++){
   const shift=(row%2)*27,x=col*66+shift-14;
   const h=rand(col+10,row+10,floor),rgb=base.clone().lerp(edge,.08+h*.35).multiplyScalar(.7+h*.48);
   c.fillStyle='#'+rgb.getHexString();c.fillRect(x+2,y+3,62,47);
   const light=rgb.clone().multiplyScalar(1.18);c.fillStyle='#'+light.getHexString();c.fillRect(x+4,y+4,57,2);
   c.fillStyle='rgba(0,0,0,.2)';c.fillRect(x+3,y+47,59,2);
   if(rand(col+31,row+6,floor)> .32){
    c.beginPath();c.lineWidth=.7+rand(row,col,floor);
    c.strokeStyle='rgba(13,23,37,.52)';
    c.moveTo(x+15+rand(col,row+1,floor)*15,y+3);
    c.lineTo(x+12+rand(col,row+2,floor)*15,y+19);
    c.lineTo(x+35+rand(col,row+3,floor)*20,y+32);
    c.stroke();
   }
  }
 }
 for(let i=0;i<900;i++){const x=Math.floor(rand(i,41,floor)*256),y=Math.floor(rand(53,i,floor)*256);c.fillStyle=i%3===0?'#ffffff15':'#02071321';c.fillRect(x,y,1+(i%2),1+(i%2))}
 if(kind==='wall'){c.strokeStyle='#00000045';c.lineWidth=3;for(let y=0;y<256;y+=51){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke()}}
 const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.colorSpace=THREE.SRGBColorSpace;return t;
}
// Original hand-patterned fantasy tapestries add warm, readable landmarks to
// bare rooms. Rugs lie flat and never change autonomous navigation.
function weaveTexture(floor){
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=256;
 const c=canvas.getContext('2d'),colors=[
  ['#176b70','#f6d69a','#ffa978','#123d4e'],
  ['#a04b42','#ffda80','#632948','#fdc58d'],
  ['#2c5597','#b5eaff','#daa76e','#162e64'],
  ['#714bad','#f6b4ff','#e9c878','#33174f']
 ][(floor-1)%4];
 const w=canvas.width,h=canvas.height;
 const background=c.createLinearGradient(0,0,w,h);
 background.addColorStop(0,colors[0]);background.addColorStop(.55,colors[3]);background.addColorStop(1,colors[0]);
 c.fillStyle=background;c.fillRect(0,0,w,h);
 for(let i=0;i<3800;i++){
  const x=Math.floor(rand(i,109,floor)*w),y=Math.floor(rand(17,i,floor)*h);
  c.fillStyle=i%5===0?'#ffffff12':'#00000017';c.fillRect(x,y,2,1);
 }
 for(let k=0;k<3;k++){
  c.lineWidth=k===0?9:k===1?3:1.5;c.strokeStyle=k===0?colors[1]:k===1?colors[3]:colors[2];
  c.strokeRect(10+k*7,11+k*8,w-20-k*14,h-22-k*16);
 }
 for(let y=24;y<h-16;y+=17){
  c.fillStyle=colors[1];c.globalAlpha=.50;
  for(const x of [16,36,w-36,w-16]){
   c.beginPath();c.moveTo(x,y-4);c.lineTo(x+4,y);c.lineTo(x,y+4);c.lineTo(x-4,y);c.fill();
  }
 }
 c.globalAlpha=1;
 c.save();c.translate(w/2,h/2);c.rotate(Math.PI/4);
 c.lineWidth=5;c.strokeStyle=colors[1];c.strokeRect(-33,-33,66,66);
 c.lineWidth=3;c.strokeStyle=colors[2];c.strokeRect(-23,-23,46,46);
 c.fillStyle=colors[1];c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.fill();
 c.fillStyle=colors[3];c.beginPath();c.arc(0,0,5,0,Math.PI*2);c.fill();c.restore();
 for(let x=13;x<w-10;x+=8){c.fillStyle=colors[1];c.fillRect(x,1,3,12);c.fillRect(x,h-13,3,12)}
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 return tex;
}
function batched(world,geometry,material,transforms,options={}){
 if(!transforms.length)return null;
 const mesh=new THREE.InstancedMesh(geometry,material,transforms.length);
 const matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3(),euler=new THREE.Euler();
 for(let i=0;i<transforms.length;i++){
  const t=transforms[i];pos.set(t[0],t[1],t[2]);euler.set(0,t[6]||0,0);rot.setFromEuler(euler);scale.set(t[3],t[4],t[5]);matrix.compose(pos,rot,scale);mesh.setMatrixAt(i,matrix);
  if(options.variation){const shade=.79+rand(i,transforms.length,options.floor||1)*.30;mesh.setColorAt(i,new THREE.Color().setRGB(shade,shade,shade))}
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;mesh.castShadow=Boolean(options.shadow);mesh.frustumCulled=false;world.add(mesh);return mesh;
}
function tubeBetween(parent,material,a,b,radius=0.03){
 const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),dir=to.clone().sub(from),mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,dir.length(),6),material);
 mesh.position.copy(from.add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());parent.add(mesh);return mesh;
}
function buildStatue(world,x,z,metal,stone,glow,variant){
 const group=new THREE.Group();group.position.set(x,0,z);
 const make=(geometry,material,px,py,pz)=>{const m=new THREE.Mesh(geometry,material);m.position.set(px,py,pz);m.castShadow=false;group.add(m);return m};
 const cylinder=(a,b,h,n=10)=>new THREE.CylinderGeometry(a,b,h,n);
 make(cylinder(.49,.54,.16),stone,0,.12,0);
 make(cylinder(.25,.37,.55),stone,0,.39,0);
 make(cylinder(.18,.31,1.05),metal,0,1.05,0);
 make(new THREE.IcosahedronGeometry(.19,1),stone,0,1.65,0);
 const visor=make(new THREE.BoxGeometry(.27,.075,.035),glow,0,1.65,-.14);visor.castShadow=false;
 const wings=variant%2===0?[-1,1]:[];
 for(const side of wings){const panel=make(new THREE.ConeGeometry(.35,.99,4),metal,side*.42,1.1,.22);panel.rotation.z=side*.31}
 for(const side of [-1,1]){const horn=make(new THREE.ConeGeometry(.11,.48,7),stone,side*.14,1.96,-.02);horn.rotation.z=-side*.28}
 world.add(group);return group;
}
export function enrichEnvironment(world,map,floor,vaultedSites=[],exit=null,encounterUnits=[],traps=[],{softwareWebGL=false}={}){
 // The arch cannot be a solid cube with a pretty ornament. Every selected
 // impassable tile uses a physically low facade as the Gothic gallery takes
 // over its upper volume. Source map, collision and AI stay completely intact.
 const vaultedTiles=new Set(Array.isArray(vaultedSites)?vaultedSites.map(site=>site.gridZ*map.length+site.gridX):[]);
 const N=map.length,O=(N-1)/2,biome=BIOMES[(floor-1)%BIOMES.length];
 const wardenCourt=createWardenCourt(world,map,exit,floor);
 const wardenBattleFloor=planWardenBattleFloor(map,exit,floor);
 const battleCells=planWardenCourtDetailMask(wardenBattleFloor);
 const connectedJourney=createConnectedDungeonJourney(world,map,floor,exit,encounterUnits);
 const alternateGallery=createAlternateDungeonGallery(world,map,floor,exit,
  connectedJourney.plan,encounterUnits,traps);
 const masonryProfiles=planDungeonWallProfiles(map,floor);
 const masonryHeights=planLegibleWallMass(map,floor,vaultedSites);
 const claddingHeightByTile=new Map(masonryProfiles.map((p,i)=>[p.z*N+p.x,masonryHeights[i]]));
 const geometries=[],materials=[],textures=[],flames=[];
 // Camera-recessed original torch, pillar and sculpture Groups keep their
 // full physical triangles, UVs and moving flames while merging static
 // parts sharing the SAME source material before first WebGL submission.
 const foregroundFusion={sourceDraws:0,outputDraws:0,drawsSaved:0,sourceTriangles:0,mergedTriangles:0,mergedGroups:0};
 const fuseLocalDecor=(group,protectedParts=[])=>{
  const fusion=fuseOriginalForegroundGroup(THREE,group,{preserve:protectedParts});
  geometries.push(...fusion.geometries);
  for(const key of Object.keys(foregroundFusion))foregroundFusion[key]+=fusion[key];
 };

 const box=new THREE.BoxGeometry(1,1,1),blade=new THREE.OctahedronGeometry(1,0),ring=new THREE.TorusGeometry(.36,.055,8,24);
 const floorTex=texture(floor,'floor',biome),wallTex=texture(floor,'wall',biome);textures.push(floorTex,wallTex);
 // Generated masonry relief yields real physically based surface response rather than flat colour tiles.
 const relief=document.createElement('canvas');relief.width=256;relief.height=256;const rc=relief.getContext('2d');
 const image=rc.createImageData(256,256),pix=image.data;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const row=Math.floor((y+15)/52),brick=(x-((row%2)*27)+14)%66;
  const grout=((y+15)%52<3)||brick<3||brick>63;
  const h=((x*11+y*29+floor*43)^(x*y*3))&31,grain=140+Math.floor(h*.85);
  const depth=grout?40:grain,i=(y*256+x)*4;pix[i]=depth;pix[i+1]=depth;pix[i+2]=depth;pix[i+3]=255;
 }
 rc.putImageData(image,0,0);const reliefTex=new THREE.CanvasTexture(relief);reliefTex.wrapS=reliefTex.wrapT=THREE.RepeatWrapping;textures.push(reliefTex);
 const cryptGrade=(floor-1)%4===0;
 const authoredFloorSurface=new THREE.MeshStandardMaterial({map:floorTex,bumpMap:reliefTex,bumpScale:.07,color:cryptGrade?'#f3e5d1':'#e4efff',roughness:.84,metalness:.11});
 const authoredWallSurface=new THREE.MeshStandardMaterial({map:wallTex,bumpMap:reliefTex,bumpScale:.14,color:cryptGrade?'#f0e2cf':'#dcecff',roughness:.9,metalness:.07});
 const stoneRasterBudget=configureSoftwareStoneSurfaces([authoredFloorSurface,authoredWallSurface],{software:softwareWebGL});
 // Preserve original maps and lighting: only CPU raster uses diffuse stone.
 const floorSurface=createSoftwareDiffuseMasonry(THREE,authoredFloorSurface,{software:softwareWebGL});
 const wallSurface=createSoftwareDiffuseMasonry(THREE,authoredWallSurface,{software:softwareWebGL});
 if(softwareWebGL){authoredFloorSurface.dispose();authoredWallSurface.dispose()}
 const chrome=new THREE.MeshStandardMaterial({color:biome.edge,roughness:.38,metalness:.72});
 const brass=new THREE.MeshStandardMaterial({color:'#efbb76',roughness:.33,metalness:.68});
 const jade=new THREE.MeshStandardMaterial({color:biome.glow,emissive:biome.glow,emissiveIntensity:2.0,roughness:.20,metalness:.08});
 const moss=new THREE.MeshStandardMaterial({color:biome.foliage,roughness:1});
 // Warm candlelight against cold enchanted stone creates shape and depth;
 // earlier genuine captures were 98% cyan/blue and read as monotonous.
 const warmPalette=['#ffb96b','#ff8749','#ffce8e','#ffb3db'];
 const warmTorch=warmPalette[(floor-1)%4];
 const flameMaterial=new THREE.MeshStandardMaterial({color:warmTorch,emissive:warmTorch,emissiveIntensity:2.4,roughness:.3,metalness:0});
 materials.push(flameMaterial);
 const bannerCanvas=document.createElement('canvas');bannerCanvas.width=128;bannerCanvas.height=256;
 const bc=bannerCanvas.getContext('2d'),bannerGrad=bc.createLinearGradient(0,0,0,256);
 bannerGrad.addColorStop(0,'#e9efff');bannerGrad.addColorStop(1,'#9bacc9');bc.fillStyle=bannerGrad;bc.fillRect(0,0,128,256);
 bc.lineWidth=5;bc.strokeStyle='#2d405e';bc.strokeRect(9,8,110,235);
 bc.lineWidth=3;bc.strokeStyle='#ffd38a';bc.beginPath();bc.arc(64,94,33,0,Math.PI*2);bc.stroke();
 bc.fillStyle='#172f50';bc.font='64px Georgia';bc.textAlign='center';bc.fillText(['✦','✧','◆','♜'][(floor-1)%4],64,119);
 bc.lineWidth=2;bc.strokeStyle='#4d627e';for(let i=0;i<5;i++){bc.beginPath();bc.moveTo(26,166+i*12);bc.lineTo(102,166+i*12);bc.stroke()}
 const bannerTexture=new THREE.CanvasTexture(bannerCanvas);bannerTexture.colorSpace=THREE.SRGBColorSpace;textures.push(bannerTexture);
 const cloth=new THREE.MeshStandardMaterial({map:bannerTexture,color:biome.banner,roughness:.87,side:THREE.DoubleSide});
 materials.push(floorSurface,wallSurface,chrome,brass,jade,moss,cloth);geometries.push(box,blade,ring);
 const floorDetails=[],wallFaces=[],columnCap=[],columnCapParents=[],mossPatches=[],runeInlays=[],rubble=[],brazierBases=[],vases=[];
 const rugs=[],rugCandidates=[];
 const pillars=[],banners=[],statues=[],worldAnchors=[],foregroundGroups=[];
 const originalPillarRoots=[],originalBannerRoots=[];
 const open=(x,z)=>x>=0&&z>=0&&x<N&&z<N&&map[z][x]==='.';
 let bossCourtLooseClutterSuppressed=0,bossCourtTallFixturesSuppressed=0;
 let battleFloorDetailsSuppressed=0;
 for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++){
  const px=x-O,pz=z-O,h=hash(x,z,floor),court=planWardenCourtNegativeSpace(map,exit,x,z);
  const battleStone=battleCells.has(x+','+z);
  if(open(x,z)){
   // Original substrate and physics remain. The court gets one coherent matte
   // physical layer, not competition from rugs, runes and unrelated plant pots.
   floorDetails.push([px,-.005,pz,.965,.035,.965,(h%4)*Math.PI/2]);
   if(x>2&&z>2&&x<N-3&&z<N-3&&open(x-1,z)&&open(x+1,z)&&open(x,z-1)&&open(x,z+1)){
    if(battleStone){if(h%19===5)battleFloorDetailsSuppressed++;}
    else{rugCandidates.push([px,pz,h]);if(h%19===5&&rugs.length<6)rugs.push([px,pz,h]);}
   }
   if(h%9===0){if(battleStone)battleFloorDetailsSuppressed++;
    else mossPatches.push([px+.2,.016,pz-.21,.42,.018,.23]);}
   if(h%13===0){if(battleStone)battleFloorDetailsSuppressed++;
    else runeInlays.push([px,.02,pz,.45,.017,.075,(h%4)*Math.PI/2]);}
   if(h%23===0&&x>2&&z>2&&x<N-3&&z<N-3){
    if(court.clearInterior)bossCourtLooseClutterSuppressed++;
    else rubble.push([px-.27,.08,pz+.28,.27,.16,.19,(h%8)*Math.PI/4]);
   }
   if(h%47===0){if(court.clearInterior)bossCourtLooseClutterSuppressed++;
    else vases.push([px+.28,.18,pz-.25,.24,.37,.24]);}
   if(h%31===0&&x>2&&z>2&&x<N-3&&z<N-3){
    if(court.clearInterior)bossCourtLooseClutterSuppressed++;
    else worldAnchors.push([px,pz,h]);
   }
   continue;
  }
  const faces=[{dx:1,dz:0,yaw:Math.PI/2},{dx:-1,dz:0,yaw:Math.PI/2},{dx:0,dz:1,yaw:0},{dx:0,dz:-1,yaw:0}];
  for(const face of faces){if(!open(x+face.dx,z+face.dz))continue;
   const ax=px+face.dx*.511,az=pz+face.dz*.511;
   const gallery=vaultedTiles.has(z*N+x);
   const faceHeight=gallery?1.04:Math.max(.88,(claddingHeightByTile.get(z*N+x)??1.42)-.045);
   wallFaces.push([ax,faceHeight*.5,az,face.dz!==0?.88:.024,faceHeight,face.dx!==0?.88:.024,0,face.dx,face.dz,Number(gallery)]);
   if(!gallery&&h%5===0){columnCap.push([ax,faceHeight+.065,az,face.dz!==0?.72:.09,.115,face.dx!==0?.72:.09]);columnCapParents.push(wallFaces.length-1);}
   if(h%21===0){if(court.quietPerimeter)bossCourtTallFixturesSuppressed++;
    else pillars.push([ax,az,face.yaw,h]);}
   if(h%31===0){if(court.quietPerimeter)bossCourtTallFixturesSuppressed++;
    else banners.push([ax,az,face.yaw,h]);}
  }
 }
 // Real camera sightlines may compress opaque masonry; paint the *same*
 // textured stone beneath those tiles, rather than showing bare black voids.
 // Add to the existing floor batch, with no new draw call or physics surface.
 const backing=planCutawayFloorBacking(map,floor);
 for(const tile of backing)floorDetails.push([tile.x,-.005,tile.z,.965,.035,.965,tile.yaw]);
 // Floor tapestries are not collisions: they help viewers distinguish rooms
 // at a glance, even during fast autonomous combat.
 if(!rugs.length&&rugCandidates.length)rugs.push(rugCandidates[0]);
 const rugTexture=weaveTexture(floor);textures.push(rugTexture);
 const rugMaterial=new THREE.MeshStandardMaterial({map:rugTexture,roughness:.94,metalness:0,side:THREE.DoubleSide,emissive:'#21161c',emissiveIntensity:.15});
 materials.push(rugMaterial);
 const rugGeometry=new THREE.PlaneGeometry(.88,1.34);geometries.push(rugGeometry);
 for(const [px,pz,h] of rugs){
  const carpet=new THREE.Mesh(rugGeometry,rugMaterial);
  carpet.rotation.set(-Math.PI/2,0,(h%2)*Math.PI/2);
  carpet.position.set(px,.027,pz);carpet.receiveShadow=true;world.add(carpet);
 }
  batched(world,box,floorSurface,floorDetails,{variation:true,floor});
 // A genuine 7x7 stone fighting court: original low chamfered geometry
 // below real Warden warning stones (.055m), no extra lights/texture,
 // navigation changes or per-frame draw families.
 const battleShape=new THREE.Shape();
 battleShape.moveTo(-.45,-.47);battleShape.lineTo(.36,-.48);
 battleShape.lineTo(.475,-.35);battleShape.lineTo(.46,.39);
 battleShape.lineTo(.35,.47);battleShape.lineTo(-.40,.46);
 battleShape.lineTo(-.475,.36);battleShape.closePath();
 const battleGeo=new THREE.ExtrudeGeometry(battleShape,{depth:.018,steps:1,
  bevelEnabled:true,bevelThickness:.003,bevelSize:.015,bevelSegments:1,curveSegments:1});
 battleGeo.rotateX(-Math.PI/2);battleGeo.translate(0,.014,0);
 const battleSource=new THREE.MeshStandardMaterial({
  color:biome.stone,roughness:.98,metalness:0,flatShading:true});
 const battleMaterial=createSoftwareDiffuseMasonry(THREE,battleSource,{software:softwareWebGL});
 if(softwareWebGL)battleSource.dispose();
 geometries.push(battleGeo);materials.push(battleMaterial);
 const battleMesh=batched(world,battleGeo,battleMaterial,
  wardenBattleFloor.stones.map(t=>[t.x,0,t.z,t.width,1,t.depth,t.yaw]),
  {variation:true,floor});
 if(battleMesh)battleMesh.name='Original Warden walkable matte bevelled combat floor';
 // Wall trims stand slightly proud to create depth; avoid overdraw covering actors.
 const facadeMesh=batched(world,box,wallSurface,wallFaces,{variation:true,floor});
 const stoneWeather=planStoneRelief(wallFaces,floor);
 // Original bevel-chipped stone plates and fractured parapet rubble. Both
 // types are instanced: two shared draws, fixed resource budget and no lights.
 const scar=new THREE.Shape();
 scar.moveTo(-.48,-.32);
 scar.lineTo(-.32,-.49);scar.lineTo(.34,-.47);
 scar.lineTo(.49,-.27);scar.lineTo(.45,.31);
 scar.lineTo(.26,.47);scar.lineTo(-.40,.42);scar.closePath();
 const spallGeometry=new THREE.ExtrudeGeometry(scar,{
  depth:.18,steps:1,bevelEnabled:true,bevelThickness:.035,bevelSize:.042,
  bevelSegments:1,curveSegments:1
 });
 spallGeometry.translate(0,0,-.09);
 const copingGeometry=new THREE.DodecahedronGeometry(.5,0);
 const spallMaterial=new THREE.MeshStandardMaterial({color:biome.edge,roughness:.96,metalness:.015,flatShading:true});
 const copingMaterial=new THREE.MeshStandardMaterial({color:biome.stone,roughness:.98,metalness:.02,flatShading:true});
 geometries.push(spallGeometry,copingGeometry);materials.push(spallMaterial,copingMaterial);
 const placements=items=>items.map(item=>[item.x,item.y,item.z,item.sx,item.sy,item.sz,item.yaw]);
 const spallMesh=batched(world,spallGeometry,spallMaterial,placements(stoneWeather.spalls));
 const copingMesh=batched(world,copingGeometry,copingMaterial,placements(stoneWeather.coping));
 for(const [mesh,items] of [[spallMesh,stoneWeather.spalls],[copingMesh,stoneWeather.coping]]){
  if(!mesh)continue;
  for(let i=0;i<items.length;i++){
   const tint=items[i].shade;mesh.setColorAt(i,new THREE.Color().setRGB(tint,tint,tint));
  }
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 }
 const columnCapMesh=batched(world,box,chrome,columnCap,{floor});
 batched(world,box,moss,mossPatches,{floor});
 batched(world,box,jade,runeInlays,{floor});
 batched(world,box,wallSurface,rubble,{variation:true,floor});
 batched(world,new THREE.CylinderGeometry(.31,.22,1,9),brass,vases,{floor});
 const buildTorch=(x,z,angle,h)=>{
  const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;
  // The fire basket has a visible, slender forged vertical support rooted in
  // the existing real wall. Never suspend a floating torch above short ruins.
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.052,.075,1.5,9),chrome);
  stem.position.set(0,.80,-.045);group.add(stem);
  const crook=new THREE.Mesh(new THREE.CylinderGeometry(.038,.038,.31,7),brass);
  crook.rotation.x=Math.PI/2;crook.position.set(0,1.45,.12);group.add(crook);
  const holder=new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,.36,8),brass);holder.position.y=1.58;group.add(holder);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.2,.1,.12,9),chrome);cup.position.y=1.82;group.add(cup);
  const fire=new THREE.Mesh(new THREE.ConeGeometry(.15,.46,9),flameMaterial);fire.position.y=2.04;group.add(fire);
  const inner=new THREE.Mesh(new THREE.ConeGeometry(.065,.26,8),new THREE.MeshBasicMaterial({color:'#fff2c7',transparent:true,opacity:.87,depthWrite:false}));inner.position.y=1.99;group.add(inner);
  fuseLocalDecor(group,[fire,inner]);
  world.add(group);foregroundGroups.push(group);
  let light=null;
  if(flames.length<5){
   light=new THREE.PointLight(warmTorch,2.1,7.2,2);
   light.position.set(0,2.04,.12);light.userData.dungeonDecorativePractical=true;group.add(light);
  }
  // Torch visibility and its actual light now obey the SAME cinematic cutaway.
  // No invisible floating lights stay on after masonry hides a foreground prop.
  flames.push({fire,inner,light,phase:(h%37)*.33});return group;
 };
 for(const [x,z,yaw,h] of pillars.slice(0,11)){
  const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=yaw;
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.14,.17,2.12,8),chrome);pillar.position.y=1.1;root.add(pillar);
  for(const y of [.14,1.02,1.99]){const collar=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.14,8),brass);collar.position.y=y;root.add(collar)}
  fuseLocalDecor(root);
  world.add(root);foregroundGroups.push(root);originalPillarRoots.push(root);
  if(h%3===0&&flames.length<12)buildTorch(x,z,yaw,h);
 }
 // A crypt without any fire loses depth and encounter landmarks; genuine
 // Chromium at 1c1a062 recorded ZERO torches as well as ZERO glass windows.
 // Use two physically mounted, cutaway-aware originals on existing solid
 // masonry if a seeded room happens to spawn no eligible pillar torch.
 // No NPC, maze wall, RNG, navigation or encounter rule is modified.
 if(!flames.length){
  // Mount a pair of original flame sconces on genuine standing piers when
  // low, open ruin junctions leave no pillar-based torches. Deliberately
  // spread the two anchors across the level, not over the nearest hero.
  const standing=wallFaces.filter(face=>face[4]>=1.16);
  const candidates=standing.length?standing:wallFaces;
  const clearStage=candidates.filter(face=>{
   // Offset from world units back into the genuine integer tile stage;
   // torch-bearing near-court masonry must not obscure the Warden duel.
   const x=Math.round(face[0]+O),z=Math.round(face[2]+O);
   return !planWardenCourtNegativeSpace(map,exit,x,z).quietPerimeter;
  });
  const available=clearStage.length?clearStage:candidates;
  const stride=Math.max(1,Math.ceil(available.length/2));
  for(let i=0;i<available.length&&flames.length<3;i+=stride){
   const face=available[i];
   buildTorch(face[0],face[2],Math.atan2(face[7]||0,face[8]||0),floor*31+i);
  }
 }
 // Hanging banners are visual storytelling; they do not affect collision or pathing.
 for(const [x,z,yaw,h] of banners.slice(0,7)){
  const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=yaw;
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.82,7),brass);rod.rotation.z=Math.PI/2;rod.position.y=2.22;root.add(rod);
  const pennant=new THREE.Mesh(new THREE.PlaneGeometry(.56,1.07),cloth);pennant.position.y=1.55;pennant.position.z=.055;root.add(pennant);
  const emblem=new THREE.Mesh(new THREE.IcosahedronGeometry(.095,0),jade);emblem.position.set(0,1.74,.065);root.add(emblem);
  world.add(root);foregroundGroups.push(root);originalBannerRoots.push(root);
 }
 // Bespoke altar islands and guardian statues provide landmarks; caps prevent resource growth.
 for(const [x,z,h] of worldAnchors.slice(0,3)){
  const statue=buildStatue(world,x,z,chrome,wallSurface,jade,h);
  fuseLocalDecor(statue);foregroundGroups.push(statue);
  const halo=new THREE.Mesh(ring,jade);halo.position.set(x,1.58,z);halo.rotation.x=Math.PI/2;world.add(halo);foregroundGroups.push(halo);
 }
 // Architectural accents share this floor's resource budget and the same camera cutaway.
 // High, impassable wall cores already occupy the rest of these tiles.
 // The old >2m selector silently removed ALL real Gothic windows after
 // shallow walkable-side cladding was introduced. Mount the same original
 // stained-glass ensembles on intact non-gallery masonry only, leaving the
 // genuinely open vaults free of opaque panes and respecting camera cutaway.
 // A real 0.88m impassable stone plinth can bear a narrow buttressed lancet.
 // The previous 1.04m threshold silently removed every non-gallery window
 // from genuine low-ruin seeds: keep meaningful original chapter landmarks.
 const windowFaces=wallFaces.filter(face=>face[4]>=.88&&face[9]!==1);
 const archWindows=addDungeonWindows(world,windowFaces,floor,biome,materials,geometries,textures,foregroundGroups);
 const pillarsCount=pillars.length,bannersCount=banners.length,ruins=worldAnchors.length;
 const totalDecor=floorDetails.length+wallFaces.length+columnCap.length+mossPatches.length+runeInlays.length+rubble.length+pillarsCount+bannersCount+ruins;
 // Same 3D visibility policy as the base walls: rich wall cladding must not hide the AI.
 const facadeBands=createCutawayBandCache(wallFaces.length);
 // Instanced caps begin intact, so band zero already matches their GPU matrices.
 const capBands=new Uint8Array(columnCap.length);
 const foregroundVolumes=captureForegroundVolumes(THREE,foregroundGroups);
 // This stage retains the original cutaway/physical-volume roots but replaces
 // duplicate authored decorative GPU submissions with exact replicas.
 const foregroundReplicas=[
  createRetainedForegroundReplicaBatches(THREE,world,originalPillarRoots),
  createRetainedForegroundReplicaBatches(THREE,world,originalBannerRoots)
 ];
 const sceneMetrics={wardenBattleFloorStatus:wardenBattleFloor.status,
  wardenBattleFloorTiles:wardenBattleFloor.stones.length,
  wardenBattleFloorCellsCovered:wardenBattleFloor.coveredWalkableCells,
   wardenBattleFloorDetailMaskCells:battleCells.size,
  wardenBattleFloorDetailSuppressed:battleFloorDetailsSuppressed,
  wardenBattleFloorCollisionChanges:wardenBattleFloor.collisionChanges,
  stoneRasterBudget,foregroundFusion,foregroundReplicas:{sourceDrawCalls:foregroundReplicas.reduce((n,b)=>n+b.sourceDrawCalls,0),drawCalls:foregroundReplicas.reduce((n,b)=>n+b.drawCalls,0),savedDrawCalls:foregroundReplicas.reduce((n,b)=>n+b.savedDrawCalls,0)},clearedForeground:0,portraitStagePropsCleared:0,screenSpaceClearedFacades:0,clearedWeatheredPieces:0,clearedCapstones:0,matrixWrites:{facade:0,weathered:0,capstone:0}};
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 const yAxis=new THREE.Vector3(0,1,0),blockedFaces=new Uint8Array(wallFaces.length);
 // This exact physical slab plan drives BOTH what the GPU renders and the
 // cinematic director's evaluation, preventing a false 'fully visible' report.
 const facadeReveal=(face,eyes,camera,wallPad=2.1)=>{
  const coarse=planPartyWallReveal(face[0],face[2],eyes,camera,wallPad,face[4]);
  return coarse==='sightline'||planLiveFacadeBodyReveal(face,eyes,camera,coarse)?
   'sightline':coarse;
 };
 function cutaway(subjects,camera,wallPad=2.1,view=null,forceFacades=null,frameDt=0,reducedMotion=false,actualWarningCells=[]){
  if(!facadeMesh)return;
  // World cladding, banners, stained-glass windows and statuary share the
  // multi-hero camera clearance, instead of tracking only the focus actor.
  const eyes=Array.isArray(subjects)?subjects:[subjects];
  const obscures=(x,z,pad)=>planPartyWallReveal(x,z,eyes,camera,pad)==='sightline';
  let cleared=0,portraitCleared=0,facadeMatrixWrites=0,weatheredChanged=false,screenSpaceClearedFacades=0;q.identity();
  for(let i=0;i<wallFaces.length;i++){
   const f=wallFaces[i],coarse=facadeReveal(f,eyes,camera,wallPad);
   const projectedHeight=coarse==='nearby'?.43:f[4],projectedY=coarse==='nearby'?.23:f[1];
   const projected=coarse!=='sightline'&&eyes.some(p=>p.visibleActor===true&&
    Math.hypot(f[0]-p.x,f[2]-p.z)<4.6)&&
    planProjectedBodyAperture([f[0]-f[3]/2,projectedY-projectedHeight/2,f[2]-f[5]/2,
     f[0]+f[3]/2,projectedY+projectedHeight/2,f[2]+f[5]/2],eyes,camera,view);
   const reveal=forceFacades?.has(i)?'sightline':projected?'sightline':coarse;
   if(projected)screenSpaceClearedFacades++;
   const blockedBand=reveal==='sightline'?2:reveal==='nearby'?1:0;
   if(blockedFaces[i]!==blockedBand){weatheredChanged=true;blockedFaces[i]=blockedBand;}
   if(!shouldUploadCutawayBand(facadeBands,i,reveal==='sightline'?2:reveal==='nearby'?1:0))continue;
   facadeMatrixWrites++;
   const h=reveal==='sightline'?.13:reveal==='nearby'?.43:f[4];
   p.set(f[0],reveal==='sightline'?.115:reveal==='nearby'?.23:f[1]);
   scale.set(f[3],h,f[5]);matrix.compose(p,q,scale);
   facadeMesh.setMatrixAt(i,matrix);
  }
  if(facadeMatrixWrites)facadeMesh.instanceMatrix.needsUpdate=true;
  // The two original stone batches use the same real camera occlusion mask as
  // their parent wall faces; they never leave opaque rubble over a living hero.
  let weatheringCleared=sceneMetrics.clearedWeatheredPieces,weatheredMatrixWrites=0;
  if(weatheredChanged){
   weatheringCleared=0;
   function cutPieces(mesh,pieces){
   if(!mesh)return;
   for(let i=0;i<pieces.length;i++){
    const item=pieces[i],band=blockedFaces[item.faceIndex];
    const hidden=band===2,ruin=band===1;
    if(hidden)weatheringCleared++;
    // Re-seat real chip and coping geometry onto the now-shorter *physical*
    // rear ruin. Retaining its original full-height Y produced floating
    // stones; hiding every detail made a bare box. No new meshes or draws.
    const lowY=Math.max(.08,Math.min(.37,item.y*.14));
    p.set(item.x,hidden?.018:ruin?lowY:item.y,item.z);
    scale.set(hidden?.001:ruin?item.sx*.84:item.sx,
      hidden?.001:ruin?Math.min(.12,item.sy*.38):item.sy,
      hidden?.001:ruin?item.sz*.84:item.sz);
    q.setFromAxisAngle(yAxis,item.yaw);
    matrix.compose(p,q,scale);mesh.setMatrixAt(i,matrix);weatheredMatrixWrites++;
   }
  }
   cutPieces(spallMesh,stoneWeather.spalls);
   cutPieces(copingMesh,stoneWeather.coping);
   if(spallMesh)spallMesh.instanceMatrix.needsUpdate=true;
   if(copingMesh)copingMesh.instanceMatrix.needsUpdate=true;
   q.identity();
  }
  // Decorative crowns follow their exact parent exposed face, not their own
  // independent visibility policy. Full-width caps previously floated over
  // sightline-cleared walls and obscured the actual living party.
  let clearedCapstones=0,capMatrixWrites=0;
  if(columnCapMesh){
   for(let i=0;i<columnCap.length;i++){
    const blocked=blockedFaces[columnCapParents[i]]>0;
    if(blocked)clearedCapstones++;
    if(!shouldUploadCutawayBand(capBands,i,blocked?2:0))continue;
    const transform=planCutawayCapTransform(blocked?'sightline':'none',columnCap[i]);
    if(!transform)continue;
    p.set(transform[0],transform[1],transform[2]);q.identity();
    scale.set(transform[3],transform[4],transform[5]);
    matrix.compose(p,q,scale);columnCapMesh.setMatrixAt(i,matrix);capMatrixWrites++;
   }
   if(capMatrixWrites)columnCapMesh.instanceMatrix.needsUpdate=true;
  }
  sceneMetrics.clearedCapstones=clearedCapstones;
  sceneMetrics.screenSpaceClearedFacades=screenSpaceClearedFacades;
  sceneMetrics.matrixWrites.capstone=capMatrixWrites;
  sceneMetrics.clearedWeatheredPieces=weatheringCleared;
  sceneMetrics.matrixWrites.facade=facadeMatrixWrites;
  sceneMetrics.matrixWrites.weathered=weatheredMatrixWrites;
  let warningCleared=0;
  for(let i=0;i<foregroundGroups.length;i++){
   const group=foregroundGroups[i];
   // Clear only the physical arch wing across a real full-body sightline,
   // even when the source prop's origin is behind the old 2D camera wedge.
   const blocked=obscures(group.position.x,group.position.z,wallPad)||
    planForegroundBodyClearance(foregroundVolumes[i],eyes,camera)||
    planProjectedBodyAperture(foregroundVolumes[i],eyes,camera,view);
   const portrait=planPortraitStageClearance(foregroundVolumes[i],eyes,camera,view);
   const warningBlocked=planForegroundWarningClearance(foregroundVolumes[i],actualWarningCells,camera);
   applyForegroundRecession(group,blocked||portrait||warningBlocked,frameDt,reducedMotion,foregroundVolumes[i]);
   if(blocked||portrait||warningBlocked)cleared++;
   if(warningBlocked&&!blocked&&!portrait)warningCleared++;
    if(portrait&&!blocked)portraitCleared++;
  }
  sceneMetrics.clearedForeground=cleared;sceneMetrics.portraitStagePropsCleared=portraitCleared;
  sceneMetrics.wardenWarningForegroundCleared=warningCleared;
  // Copy actual source foreground roots AFTER their physical recession.
  sceneMetrics.foregroundReplicaMatrixWrites=foregroundReplicas.reduce((n,b)=>n+b.sync().matrixWrites,0);
  wardenCourt.cutaway(eyes,camera,wallPad);
  connectedJourney.cutaway(eyes,camera,wallPad);
  alternateGallery.cutaway(eyes,camera,wallPad);
 }

 // The same flames now tell the truth about the actual authoritative encounter:
 // real telegraphed boss danger swells the room light, exposed recovery settles
 // it, and defeat dims it. No synthetic boss cue, map edit, or new AI event.
 let encounterLight=0;
 const accept=s=>{
  wardenCourt.accept(s);
  encounterLight=s?.phase==='intermission'?-0.24:
   (Array.isArray(s?.bossWarning?.cells)&&s.bossWarning.cells.length>0)?0.34:
   s?.bossRecovery?.remaining?-0.12:0;
  sceneMetrics.encounterTorchMood=encounterLight;
  for(const p of flames)if(p.light)p.light.intensity=2.1*(1+encounterLight);
 };
 const animate=time=>{wardenCourt.animate(time);for(const p of flames){
  const t=time*5+p.phase,scale=1+Math.sin(t)*.13;
  p.fire.scale.y=scale;p.inner.scale.setScalar(.91+Math.sin(t+1.3)*.14);
  if(p.light)p.light.intensity=2.1*(1+encounterLight)*(1+.035*Math.sin(time*2.5+p.phase));
 }};
 return {animate,accept,cutaway,facadeReveal,occlusionFaces:wallFaces,occlusionPropVolumes:[...foregroundVolumes.filter(Boolean),...connectedJourney.occluderVolumes,...alternateGallery.occluderVolumes],occluders:[facadeMesh,...foregroundGroups].filter(Boolean),metrics:Object.assign(sceneMetrics,{wardenCourt:wardenCourt.metrics,connectedJourney:connectedJourney.metrics,alternateGallery:alternateGallery.metrics,biome:floor,vaultedFacadeOpenings:wallFaces.filter(f=>f[4]<1.2).length,decorInstances:totalDecor+archWindows,archWindows,torches:flames.length,banners:bannersCount,landmarks:ruins,bossCourtLooseClutterSuppressed,bossCourtTallFixturesSuppressed,wovenRugs:rugs.length,cutawayFloorBackings:backing.length,columnCapstones:columnCap.length,texturedSurfaces:floorDetails.length+wallFaces.length,weatheredSpalls:stoneWeather.spalls.length,brokenCopingStones:stoneWeather.coping.length,weatheredBatches:Number(Boolean(spallMesh))+Number(Boolean(copingMesh))}),dispose:()=>{for(const batch of foregroundReplicas)batch.dispose();alternateGallery.dispose();connectedJourney.dispose();wardenCourt.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();for(const f of flames){f.inner.material.dispose()}}};
}

