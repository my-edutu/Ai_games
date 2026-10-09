/* Infinite Tower — authored gameplay ledges, v18.
 * Unlike non-interactive scenic catwalks, every shelf here comes from the
 * authoritative snapshot. Collision rectangles NEVER change.
 * All cosmetic irregularity is clipped below the true flat walking top.
 */
import * as THREE from '/tower/three.module.js';

const themeColors={
  foundry:{bed:0x835044,top:0xd3a074,ink:'#4c332f',light:'#edba7b',metal:0xe8a35c},
  ruins:{bed:0x597465,top:0xaac79d,ink:'#274a3e',light:'#cce7a9',metal:0x83ce97},
  storm:{bed:0x547e9c,top:0x9fbdd5,ink:'#274d6a',light:'#aedce6',metal:0x81e5e9},
  clockwork:{bed:0x8f6851,top:0xe6ba78,ink:'#564137',light:'#ffdca0',metal:0xf7bf71},
  void:{bed:0x645782,top:0xb39ace,ink:'#40365f',light:'#e3b5f4',metal:0xe0a2ff}
};
const materialCache=new Map();
const wave=(n)=>{const v=Math.sin(n*78.233+11.771)*12345.678;return v-Math.floor(v)};
function stoneTexture(theme,colors){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const g=canvas.getContext('2d');
  const fill=new THREE.Color(colors.top).getStyle();
  g.fillStyle=fill;g.fillRect(0,0,256,256);
  // Painterly stratification rather than smooth cubes.
  for(let i=0;i<550;i++){
    const x=wave(i*15+theme.length)*256,y=wave(i*21+6)*256;
    g.fillStyle=i%3===0?'rgba(255,248,230,.11)':'rgba(25,29,35,.095)';
    g.fillRect(x,y,.7+wave(i*44)*9,.5+wave(i*19)*2.7);
  }
  for(let i=0;i<29;i++){
    const x=wave(i*13+theme.length)*252,y=wave(i*81)*256;
    g.strokeStyle=i%3===0?colors.light:colors.ink;
    g.globalAlpha=i%3===0?.19:.22;g.lineWidth=.7;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+7,y+3);g.lineTo(x+12,y-1);g.lineTo(x+18,y+6);g.stroke();
  }
  g.globalAlpha=1;
  const t=new THREE.CanvasTexture(canvas);
  t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(1.1,1.6);t.anisotropy=2;
  return t;
}
function materials(theme){
  if(materialCache.has(theme))return materialCache.get(theme);
  const p=themeColors[theme]||themeColors.foundry;
  const face=new THREE.MeshStandardMaterial({map:stoneTexture(theme,p),roughness:.91,metalness:.035,flatShading:true,side:THREE.DoubleSide});
  const edge=new THREE.MeshStandardMaterial({color:p.bed,roughness:.84,metalness:.12,flatShading:true,side:THREE.DoubleSide});
  const lip=new THREE.MeshStandardMaterial({color:p.metal,roughness:.42,metalness:.6,side:THREE.DoubleSide});
  const glow=new THREE.MeshStandardMaterial({color:p.metal,emissive:p.metal,emissiveIntensity:.72,roughness:.48});
  for(const m of [face,edge,lip,glow])m.userData.pooled=true;
  const mat={face,edge,lip,glow};materialCache.set(theme,mat);return mat;
}
export function createTowerLedge({platform,theme}){
  const m=materials(theme);
  const width=Math.max(7,platform.width/1000),height=Math.max(1,platform.height/1000);
  const seed=platform.id.length+platform.x/17000+platform.y/11000;
  const half=width/2,top=height/2,bottom=-height/2;
  const profile=new THREE.Shape();
  profile.moveTo(-half,top);
  profile.lineTo(half,top);
  // Irregular cliff face only BELOW the physically traversable top.
  const points=Math.max(4,Math.min(14,Math.round(width/22)));
  for(let i=0;i<=points;i++){
    const u=i/points,x=half-u*width;
    const inset=i===0||i===points?0:(wave(seed+i*7)-.5)*Math.min(7,width*.06);
    const underside=bottom+1.5+wave(seed+i*9)*2.5;
    profile.lineTo(x+inset,underside);
  }
  profile.closePath();
  const depth=22;
  const geom=new THREE.ExtrudeGeometry(profile,{
    depth,steps:1,bevelEnabled:false,curveSegments:2,
    material:0,extrudePath:undefined,extrudeMaterial:1
  });
  geom.translate(0,0,-depth/2);
  const root=new THREE.Group();root.name='authoritative-ledger:'+platform.id;
  const mass=new THREE.Mesh(geom,[m.face,m.edge]);
  mass.castShadow=true;mass.receiveShadow=true;
  root.add(mass);
  // Slim cap makes the actual landing line visible. It ends EXACTLY at
  // x=+-half; decoration is never mistaken for a larger collision ledge.
  const cap=new THREE.Mesh(new THREE.BoxGeometry(width,.85,depth+2),m.lip);
  cap.position.set(0,top-.65,0);cap.castShadow=false;root.add(cap);
  if(platform.kind==='moving'){
    const mark=new THREE.Mesh(new THREE.TorusGeometry(4.2,1.05,7,20),m.glow);
    mark.rotation.x=Math.PI/2;mark.position.set(0,bottom+3.7,depth/2+1.5);
    root.add(mark);
  }else if(platform.kind==='oneway'){
    // Identifiable one-way silhouette, same physical landing width.
    const rib=new THREE.Mesh(new THREE.BoxGeometry(width*.7,.72,depth+1),m.glow);
    rib.position.set(0,top-.9,0);root.add(rib);
  }
  root.userData.authBounds={left:platform.x,right:platform.x+platform.width,top:platform.y+platform.height};
  root.userData.authId=platform.id;
  root.userData.decorativeOnly=true;
  return root;
}
