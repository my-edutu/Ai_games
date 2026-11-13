import * as THREE from '/dungeon/vendor/three.module.js';

// Cosmetic architecture only: no pathfinding, authority or collider changes.
// Every GPU resource is registered with enrichEnvironment's floor disposal list.
// A bounded number of windows prevents long-running streams accumulating meshes.
export function addDungeonWindows(world,faces,floor,biome,materials,geometries,textures,occluders){
 const palettes=[
  ['#164a53','#50dfc0','#b4ffe8'], // Sunken crypt: oxidised copper / sea glass
  ['#69322b','#ff9952','#ffe6a0'], // Ember cathedral: rose and amber
  ['#164568','#67cbff','#d2f3ff'], // Obsidian vault: cobalt / ice
  ['#35205c','#b38bff','#f5b9ff']  // Hollow sanctum: violet / rose
 ];
 const colors=palettes[(floor-1)%palettes.length];
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#0b1526';ctx.fillRect(0,0,128,192);
 // Layered coloured glass with dark lead cames and a central heraldic diamond.
 for(let row=0;row<6;row++)for(let col=0;col<4;col++){
  const x=col*32,y=row*32;
  ctx.fillStyle=colors[(col+row*2+floor)%3];ctx.fillRect(x+3,y+3,26,26);
  ctx.fillStyle='#ffffff1e';ctx.fillRect(x+5,y+5,21,3);
  ctx.strokeStyle='#132238';ctx.lineWidth=4;ctx.strokeRect(x+2,y+2,28,28);
 }
 ctx.strokeStyle='#132238';ctx.lineWidth=8;
 ctx.beginPath();ctx.moveTo(64,14);ctx.lineTo(110,95);ctx.lineTo(64,174);ctx.lineTo(18,95);ctx.closePath();ctx.stroke();
 ctx.fillStyle=colors[2];ctx.beginPath();ctx.moveTo(64,58);ctx.lineTo(85,95);ctx.lineTo(64,132);ctx.lineTo(43,95);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#f8e9c6';ctx.lineWidth=2;ctx.stroke();
 const glassTexture=new THREE.CanvasTexture(canvas);glassTexture.colorSpace=THREE.SRGBColorSpace;textures.push(glassTexture);
 const glass=new THREE.MeshStandardMaterial({map:glassTexture,emissive:biome.glow,emissiveIntensity:.24,roughness:.35,metalness:.12,side:THREE.DoubleSide});
 const frame=new THREE.MeshStandardMaterial({color:biome.edge,metalness:.46,roughness:.5});
 const stone=new THREE.MeshStandardMaterial({color:biome.stone,metalness:.06,roughness:.9});
 materials.push(glass,frame,stone);
 const jamb=new THREE.CylinderGeometry(.065,.09,1.1,8);
 const arch=new THREE.TorusGeometry(.34,.055,7,20,Math.PI);
 const pane=new THREE.PlaneGeometry(.58,.78);
 const keystone=new THREE.OctahedronGeometry(.105,0);
 const sill=new THREE.BoxGeometry(.83,.12,.25);
 const pier=new THREE.BoxGeometry(.15,1.35,.24);
 const finial=new THREE.ConeGeometry(.13,.28,5);
 const tracery=new THREE.BoxGeometry(.045,.69,.045);
 const peakRib=new THREE.CylinderGeometry(.045,.045,.46,7);
 const corbel=new THREE.BoxGeometry(.20,.16,.26);
 // A narrow contiguous stone buttress reaches the genuine low wall plinth.
 // It supports the pointed glass above the former 1.65m facade minimum,
 // without erecting a full opaque slab that hides the moving party.
 const buttressFoot=new THREE.BoxGeometry(.22,.64,.30);
 geometries.push(jamb,arch,pane,keystone,sill,pier,finial,tracery,peakRib,corbel,buttressFoot);
 // Bake every original lancet component into THREE retained role meshes, once
 // per floor. Four windows formerly submitted 76 individual WebGL draws. The
 // same source geometry, transforms, UVs, normals, and original three PBR
 // materials now submit at most 12 draws, with no lower-fidelity replacements.
 // Each window remains one cutaway group, so foreground clearance can hide the
 // entire *physical* lancet without leaving disconnected glass or masonry.
 const roleParts={glass:[],frame:[],stone:[]};
 function part(role,shape,x,y,z,angle=0,scaleY=1){
  roleParts[role].push({shape,x,y,z,angle,scaleY});
 }
 part('glass',pane,0,1.43,.092);
 part('frame',arch,0,1.82,.105);
 for(const side of [-1,0,1])part('frame',tracery,side*.17,1.43,.15);
 for(const side of [-1,1]){
  part('frame',peakRib,side*.145,2.00,.14,-side*.68);
  part('stone',corbel,side*.42,.91,.075);
 }
 for(const side of [-1,1]){
  part('frame',jamb,side*.34,1.34,.11);
  part('stone',pier,side*.45,1.42,.015);
  part('stone',buttressFoot,side*.45,.48,.015);
 }
 part('stone',sill,0,.89,.08);
 part('frame',keystone,0,2.17,.13,0,(floor-1)%4===2?1.75:1.28);
 for(const side of [-1,1])part('frame',finial,side*.44,2.14,.03,side*.17);
 const pose=new THREE.Matrix4(),at=new THREE.Vector3(),rotation=new THREE.Quaternion(),
  size=new THREE.Vector3(),axis=new THREE.Vector3(0,0,1);
 function joinRole(parts){
  const pieces=[],names=['position','normal','uv'],width={position:3,normal:3,uv:2};
  let count=0;
  for(const spec of parts){
   const g=spec.shape.index?spec.shape.toNonIndexed():spec.shape.clone();
   at.set(spec.x,spec.y,spec.z);
   rotation.setFromAxisAngle(axis,spec.angle);
   size.set(1,spec.scaleY,1);
   pose.compose(at,rotation,size);
   g.applyMatrix4(pose);
   const positions=g.getAttribute('position');
   // All original Three primitives carry real normals and UVs. Reject a
   // missing attribute rather than silently dropping stone shading or glass.
   if(!positions||!g.getAttribute('normal')||!g.getAttribute('uv')){
    g.dispose();for(const piece of pieces)piece.dispose();
    throw new Error('Original lancet geometry lacks normal/UV attributes');
   }
   count+=positions.count;pieces.push(g);
  }
  const result=new THREE.BufferGeometry();
  for(const name of names){
   const values=new Float32Array(count*width[name]);let offset=0;
   for(const piece of pieces){
    const valuesFrom=piece.getAttribute(name).array;
    values.set(valuesFrom,offset);offset+=valuesFrom.length;
   }
   result.setAttribute(name,new THREE.BufferAttribute(values,width[name]));
  }
  result.computeBoundingSphere();
  for(const piece of pieces)piece.dispose();
  geometries.push(result);
  return result;
 }
 const roleGeometry={glass:joinRole(roleParts.glass),
  frame:joinRole(roleParts.frame),stone:joinRole(roleParts.stone)};
 // Each pane rises from a real impassable 0.88m+ stone wall plinth.
 // Keep the original four separated sites, orientations and atomic cutaways.
 const mounted=faces.filter(face=>Array.isArray(face)&&face[4]>=.88&&face[9]!==1&&
  Number.isFinite(face[0])&&Number.isFinite(face[2])&&
  Math.abs(face[0])<=10&&Math.abs(face[2])<=10);
 let count=0;
 const selected=[];
 const stride=Math.max(1,Math.ceil(mounted.length/4));
 for(let i=0;i<mounted.length&&count<4;i+=stride){
  const face=mounted[i];
  if(selected.some(p=>Math.hypot(p[0]-face[0],p[1]-face[2])<2.25))continue;
  const group=new THREE.Group();
  group.position.set(face[0],0,face[2]);
  group.rotation.y=Math.atan2(face[7]||0,face[8]||0);
  for(const [role,material] of [['stone',stone],['frame',frame],['glass',glass]]){
   const mesh=new THREE.Mesh(roleGeometry[role],material);
   mesh.name='authored-lancet-'+role;
   group.add(mesh);
  }
  world.add(group);occluders.push(group);selected.push([face[0],face[2]]);count++;
 }
 return count;
}
