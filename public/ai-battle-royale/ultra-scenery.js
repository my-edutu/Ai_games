/* Original non-playable environment vista. Props cannot affect AI gameplay. */
import * as THREE from './vendor/three.module.min.js';
const themes={
  ember:{trunk:0x694b32,canopy:0x9eab4f,pillar:0x665d39,emission:0xf6be79,name:'EMBER REACH'},
  neon:{trunk:0x324d7a,canopy:0x5ae8ff,pillar:0x263d67,emission:0xee65d4,name:'NOVA SECTOR'},
  arctic:{trunk:0x5c8695,canopy:0xe4f7ff,pillar:0x7dabbf,emission:0xc6f9ff,name:'FROSTLINE'}
};
function hash(n){
  n=Math.imul(n^n>>>15,0x2c1b3c6d);
  n=Math.imul(n^n>>>12,0x297a2d39);
  return (n^(n>>>15))>>>0;
}
function site(seed,n){return(hash(seed^Math.imul(n+1,7919))%100000)/100000}
export function buildVista(arena,runToken){
  const {width:w,height:h,theme}=arena,t=themes[theme]||themes.ember;
  const root=new THREE.Group();root.name='VISUAL_ONLY_NON_PLAYABLE_VISTA';
  const seed=[...String(runToken)].reduce((v,ch)=>hash(v+ch.charCodeAt(0)),0xabcde);
  const placements=[];
  for(let i=0;i<220;i++){
    const x=-6+site(seed,i*2+10)*(w+12);
    const z=-6+site(seed,i*2+11)*(h+12);
    if(x>-1&&x<w+1&&z>-1&&z<h+1)continue;
    if(Math.abs(x-w*.50)<3.2&&z>-5.8&&z<.7)continue;
    placements.push({x,z,scale:.75+site(seed,i+303)*1.35,rot:site(seed,i+111)*6.283});
    if(placements.length===75)break;
  }
  const body=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.20,1,8),
    new THREE.MeshStandardMaterial({color:t.trunk,roughness:.92}),placements.length);
  const canopy=new THREE.InstancedMesh(new THREE.ConeGeometry(.63,1.15,10),
    new THREE.MeshStandardMaterial({color:t.canopy,metalness:theme==='neon'?.38:.08,
      emissive:theme==='neon'?t.emission:0,emissiveIntensity:theme==='neon'?.24:0,
      roughness:.7}),placements.length);
  const cap=theme==='arctic'?new THREE.InstancedMesh(new THREE.ConeGeometry(.36,.72,9),
    new THREE.MeshStandardMaterial({color:0xf2faff,roughness:.68}),placements.length):null;
  const dummy=new THREE.Object3D();
  for(let i=0;i<placements.length;i++){
    const {x,z,scale,rot}=placements[i];
    dummy.position.set(x,-.19+.55*scale,z);
    dummy.scale.set(.7*scale,1.10*scale,.7*scale);
    dummy.rotation.y=rot;dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
    dummy.position.y=-.19+1.23*scale;
    dummy.scale.set((theme==='ember'?1.65:.95)*scale,(theme==='ember'?.60:1.10)*scale,
      (theme==='ember'?1.65:.95)*scale);
    dummy.updateMatrix();canopy.setMatrixAt(i,dummy.matrix);
    if(cap){
      dummy.position.y=-.19+1.77*scale;
      dummy.scale.set(.85*scale,.80*scale,.85*scale);
      dummy.updateMatrix();cap.setMatrixAt(i,dummy.matrix);
    }
  }
  for(const mesh of [body,canopy,cap]){
    if(!mesh)continue;
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
    mesh.instanceMatrix.needsUpdate=true;root.add(mesh);
  }
  // An independently designed district identifier gives the vista hierarchy.
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=180;
  const ctx=canvas.getContext('2d');
  if(ctx){
    ctx.fillStyle=theme==='neon'?'#1a2d59':theme==='arctic'?'#406f89':'#85563b';
    ctx.fillRect(0,0,768,180);
    ctx.strokeStyle=theme==='neon'?'#71ecff':'#f6dfaa';
    ctx.lineWidth=11;ctx.strokeRect(9,9,750,162);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#ecfaff';ctx.font='900 85px system-ui,sans-serif';
    ctx.fillText(t.name,384,91,725);
    const labelTexture=new THREE.CanvasTexture(canvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({map:labelTexture,roughness:.4,
      metalness:.24,emissive:theme==='neon'?0x186fa0:0x2d2d2b,
      emissiveIntensity:.46,side:THREE.DoubleSide});
    const label=new THREE.Mesh(new THREE.PlaneGeometry(5.2,1.2),material);
    label.position.set(w/2,4.0,-3.42);
    label.userData.disposeWithVista=true;
    root.add(label);
  }
  root.userData.instanceCount=placements.length;
  return root;
}
export function disposeVista(root){
  if(!root)return;
  root.traverse(obj=>{
    if(obj.geometry)obj.geometry.dispose();
    if(obj.material){
      for(const material of Array.isArray(obj.material)?obj.material:[obj.material]){
        if(material.map)material.map.dispose();
        material.dispose();
      }
    }
  });
}
