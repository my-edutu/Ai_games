import * as THREE from '/dungeon/vendor/three.module.js';
import {addDungeonWindows} from '/dungeon/architecture.js';

// Purely cosmetic, reproducible procedural dressing. This code never touches game authority.
// All geometry is batched or tightly budgeted so a streaming run can regenerate indefinitely.
// Decorative biome details.
const BIOMES=[
 {mortar:'#151b31',stone:'#48566a',edge:'#7486a0',glow:'#47e4d6',banner:'#357ba0',foliage:'#3b7774'},
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
export function enrichEnvironment(world,map,floor){
 const N=map.length,O=(N-1)/2,biome=BIOMES[(floor-1)%BIOMES.length];
 const geometries=[],materials=[],textures=[],flames=[];
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
 const floorSurface=new THREE.MeshStandardMaterial({map:floorTex,bumpMap:reliefTex,bumpScale:.07,color:'#e4efff',roughness:.84,metalness:.11});
 const wallSurface=new THREE.MeshStandardMaterial({map:wallTex,bumpMap:reliefTex,bumpScale:.14,color:'#dcecff',roughness:.9,metalness:.07});
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
 const floorDetails=[],wallFaces=[],columnCap=[],mossPatches=[],runeInlays=[],rubble=[],brazierBases=[],vases=[];
 const pillars=[],banners=[],statues=[],worldAnchors=[],foregroundGroups=[];
 const open=(x,z)=>x>=0&&z>=0&&x<N&&z<N&&map[z][x]==='.';
 for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++){
  const px=x-O,pz=z-O,h=hash(x,z,floor);
  if(open(x,z)){
   floorDetails.push([px,-.005,pz,.965,.035,.965,(h%4)*Math.PI/2]);
   if(h%9===0)mossPatches.push([px+.2,.016,pz-.21,.42,.018,.23]);
   if(h%13===0)runeInlays.push([px,.02,pz,.45,.017,.075,(h%4)*Math.PI/2]);
   if(h%23===0&&x>2&&z>2&&x<N-3&&z<N-3)rubble.push([px-.27,.08,pz+.28,.27,.16,.19,(h%8)*Math.PI/4]);
   if(h%47===0)vases.push([px+.28,.18,pz-.25,.24,.37,.24]);
   if(h%31===0&&x>2&&z>2&&x<N-3&&z<N-3)worldAnchors.push([px,pz,h]);
   continue;
  }
  const faces=[{dx:1,dz:0,yaw:Math.PI/2},{dx:-1,dz:0,yaw:Math.PI/2},{dx:0,dz:1,yaw:0},{dx:0,dz:-1,yaw:0}];
  for(const face of faces){if(!open(x+face.dx,z+face.dz))continue;
   const ax=px+face.dx*.511,az=pz+face.dz*.511;
   wallFaces.push([ax,1.22,az,face.dz!==0?.88:.024,2.31,face.dx!==0?.88:.024,0,face.dx,face.dz]);
   if(h%5===0)columnCap.push([ax,2.42,az,face.dz!==0?.72:.09,.115,face.dx!==0?.72:.09]);
   if(h%21===0){pillars.push([ax,az,face.yaw,h]);}
   if(h%31===0){banners.push([ax,az,face.yaw,h]);}
  }
 }
 batched(world,box,floorSurface,floorDetails,{variation:true,floor});
 // Wall trims stand slightly proud to create depth; avoid overdraw covering actors.
 const facadeMesh=batched(world,box,wallSurface,wallFaces,{variation:true,floor});
 batched(world,box,chrome,columnCap,{floor});
 batched(world,box,moss,mossPatches,{floor});
 batched(world,box,jade,runeInlays,{floor});
 batched(world,box,wallSurface,rubble,{variation:true,floor});
 batched(world,new THREE.CylinderGeometry(.31,.22,1,9),brass,vases,{floor});
 const buildTorch=(x,z,angle,h)=>{
  const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;
  const holder=new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,.36,8),brass);holder.position.y=1.58;group.add(holder);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.2,.1,.12,9),chrome);cup.position.y=1.82;group.add(cup);
  const fire=new THREE.Mesh(new THREE.ConeGeometry(.15,.46,9),flameMaterial);fire.position.y=2.04;group.add(fire);
  const inner=new THREE.Mesh(new THREE.ConeGeometry(.065,.26,8),new THREE.MeshBasicMaterial({color:'#fff2c7',transparent:true,opacity:.87,depthWrite:false}));inner.position.y=1.99;group.add(inner);
  world.add(group);foregroundGroups.push(group);
  if(flames.length<5){const torchLight=new THREE.PointLight(warmTorch,2.3,7.2,2);torchLight.position.set(x,2.1,z);world.add(torchLight)}
  flames.push({fire,inner,phase:(h%37)*.33});return group;
 };
 for(const [x,z,yaw,h] of pillars.slice(0,20)){
  const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=yaw;
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.14,.17,2.12,8),chrome);pillar.position.y=1.1;root.add(pillar);
  for(const y of [.14,1.02,1.99]){const collar=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.14,8),brass);collar.position.y=y;root.add(collar)}
  world.add(root);foregroundGroups.push(root);
  if(h%3===0&&flames.length<12)buildTorch(x,z,yaw,h);
 }
 // Hanging banners are visual storytelling; they do not affect collision or pathing.
 for(const [x,z,yaw,h] of banners.slice(0,13)){
  const root=new THREE.Group();root.position.set(x,0,z);root.rotation.y=yaw;
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.82,7),brass);rod.rotation.z=Math.PI/2;rod.position.y=2.22;root.add(rod);
  const pennant=new THREE.Mesh(new THREE.PlaneGeometry(.56,1.07),cloth);pennant.position.y=1.55;pennant.position.z=.055;root.add(pennant);
  const emblem=new THREE.Mesh(new THREE.IcosahedronGeometry(.095,0),jade);emblem.position.set(0,1.74,.065);root.add(emblem);
  world.add(root);foregroundGroups.push(root);
 }
 // Bespoke altar islands and guardian statues provide landmarks; caps prevent resource growth.
 for(const [x,z,h] of worldAnchors.slice(0,5)){
  foregroundGroups.push(buildStatue(world,x,z,chrome,wallSurface,jade,h));
  const halo=new THREE.Mesh(ring,jade);halo.position.set(x,1.58,z);halo.rotation.x=Math.PI/2;world.add(halo);foregroundGroups.push(halo);
 }
 // Architectural accents share this floor's resource budget and the same camera cutaway.
 const archWindows=addDungeonWindows(world,wallFaces,floor,biome,materials,geometries,textures,foregroundGroups);
 const pillarsCount=pillars.length,bannersCount=banners.length,ruins=worldAnchors.length;
 const totalDecor=floorDetails.length+wallFaces.length+columnCap.length+mossPatches.length+runeInlays.length+rubble.length+pillarsCount+bannersCount+ruins;
 // Same 3D visibility policy as the base walls: rich wall cladding must not hide the AI.
 let previousCutaway='';const sceneMetrics={clearedForeground:0};
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
 function cutaway(subjects,camera){
  if(!facadeMesh)return;
  // World cladding, banners, stained-glass windows and statuary share the
  // multi-hero camera clearance, instead of tracking only the focus actor.
  const eyes=Array.isArray(subjects)?subjects:[subjects];
  const obscures=(x,z,pad)=>eyes.some(subject=>{
   if(!subject)return false;
   const vx=camera.x-subject.x,vz=camera.z-subject.z,len=Math.hypot(vx,vz);
   if(len<.001)return false;
   const dx=x-subject.x,dz=z-subject.z;
   const forward=(dx*vx+dz*vz)/len;
   const lateral=Math.abs(dx*vz-dz*vx)/len;
   return forward>-.55&&forward<len+.7&&lateral<pad+forward*.13;
  });
  let cleared=0;
  for(let i=0;i<wallFaces.length;i++){
   const f=wallFaces[i],blocked=obscures(f[0],f[2],2.1);
   const h=blocked?.15:f[4];
   p.set(f[0],blocked?.13:f[1],f[2]);scale.set(f[3],h,f[5]);matrix.compose(p,q,scale);
   facadeMesh.setMatrixAt(i,matrix);
  }
  facadeMesh.instanceMatrix.needsUpdate=true;
  for(const group of foregroundGroups){
   const blocked=obscures(group.position.x,group.position.z,2.1);
   group.visible=!blocked;if(blocked)cleared++;
  }
  sceneMetrics.clearedForeground=cleared;
 }

 const animate=time=>{for(const p of flames){const t=time*5+p.phase,scale=1+Math.sin(t)*.13;p.fire.scale.y=scale;p.inner.scale.setScalar(.91+Math.sin(t+1.3)*.14)}};
 return {animate,cutaway,occluders:[facadeMesh,...foregroundGroups].filter(Boolean),metrics:Object.assign(sceneMetrics,{biome:floor,decorInstances:totalDecor+archWindows,archWindows,torches:flames.length,banners:bannersCount,landmarks:ruins,texturedSurfaces:floorDetails.length+wallFaces.length}),dispose:()=>{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();for(const f of flames){f.inner.material.dispose()}}};
}

