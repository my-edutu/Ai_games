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
 geometries.push(jamb,arch,pane,keystone,sill,pier,finial,tracery,peakRib,corbel);
 let count=0;
 // Only visible wall facades are supplied. Selection is stable per floor.
 for(let i=7;i<faces.length&&count<10;i+=23){
  const face=faces[i],group=new THREE.Group();
  group.position.set(face[0],0,face[2]);
  // Face the walkable corridor, not an arbitrary world direction; otherwise
  // the solid wall hides half the panes in actual WebGL screenshots.
  group.rotation.y=Math.atan2(face[7]||0,face[8]||0);
  const add=(geometry,material,x,y,z)=>{
   const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;
  };
  add(pane,glass,0,1.43,.092);
  add(arch,frame,0,1.82,.105);
  // Three-dimensional lead tracery and pointed vault ribs break up flat wall slabs.
  // Reuse geometries/materials across every window; no per-window GPU allocations.
  for(const side of [-1,0,1])add(tracery,frame,side*.17,1.43,.15);
  for(const side of [-1,1]){
   const rib=add(peakRib,frame,side*.145,2.00,.14);
   rib.rotation.z=-side*.68;
   add(corbel,stone,side*.42,.91,.075);
  }
  for(const side of [-1,1]){
   add(jamb,frame,side*.34,1.34,.11);
   add(pier,stone,side*.45,1.42,.015);
  }
  add(sill,stone,0,.89,.08);
  const crown=add(keystone,frame,0,2.17,.13);
  crown.scale.y=(floor-1)%4===2?1.75:1.28;
  for(const side of [-1,1]){
   const spire=add(finial,frame,side*.44,2.14,.03);
   spire.rotation.z=side*.17;
  }
  // Never create per-window materials, lights or geometries.
  world.add(group);occluders.push(group);count++;
 }
 return count;
}
