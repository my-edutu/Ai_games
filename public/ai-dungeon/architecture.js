import * as THREE from '/dungeon/vendor/three.module.js';

// Cosmetic-only architectural accents; capped and disposed with each floor.
export function addDungeonWindows(world,faces,floor,biome,materials,geometries,textures,occluders){
 const palettes=[['#164a53','#50dfc0','#b4ffe8'],['#69322b','#ff9952','#ffe6a0'],['#164568','#67cbff','#d2f3ff'],['#35205c','#b38bff','#f5b9ff']];
 const colors=palettes[(floor-1)%4],canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#101729';ctx.fillRect(0,0,128,192);
 for(let y=0;y<6;y++)for(let x=0;x<4;x++){
  ctx.fillStyle=colors[(x+y*3+floor)%3];ctx.fillRect(x*32+3,y*32+3,26,26);
  ctx.strokeStyle='#18243b';ctx.lineWidth=4;ctx.strokeRect(x*32+2,y*32+2,28,28);
 }
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);
 const glass=new THREE.MeshStandardMaterial({map:tex,emissive:biome.glow,emissiveIntensity:.45,side:THREE.DoubleSide});
 const frame=new THREE.MeshStandardMaterial({color:biome.edge,metalness:.55,roughness:.34});
 materials.push(glass,frame);
 const jamb=new THREE.CylinderGeometry(.07,.09,1.05,8),arch=new THREE.TorusGeometry(.34,.06,7,18,Math.PI);
 const pane=new THREE.PlaneGeometry(.58,.78),keystone=new THREE.OctahedronGeometry(.11,0);
 geometries.push(jamb,arch,pane,keystone);
 let count=0;
 for(let i=7;i<faces.length&&count<10;i+=23){
  const face=faces[i],group=new THREE.Group();group.position.set(face[0],0,face[2]);group.rotation.y=face[3]<.1?Math.PI/2:0;
  const add=(geometry,material,x,y,z)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh};
  add(pane,glass,0,1.43,.073);add(arch,frame,0,1.82,.09);
  for(const side of [-1,1])add(jamb,frame,side*.34,1.32,.09);
  const gem=add(keystone,frame,0,2.2,.1);gem.scale.y=(floor-1)%4===2?1.9:1.2;
  world.add(group);occluders.push(group);count++;
 }
 return count;
}
