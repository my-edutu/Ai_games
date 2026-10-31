import * as THREE from 'three';

// Presentation-only art direction; immutable and independent of campaign RNG.
const STYLES = [
 {silhouette:'conservatory',sky:'#489ab7',horizon:'#e3efd6',masonry:'#b5c3a0',stone:'#e9e0be',tile:'#f4e8c7',metal:'#297f79',sun:'#fff0ce',ground:'#697552',exposure:1.04},
 {silhouette:'aqueduct',sky:'#469ac8',horizon:'#f4dfb2',masonry:'#cf9a63',stone:'#f0d3a2',tile:'#f4e7c9',metal:'#208f9b',sun:'#ffe3ad',ground:'#967c50',exposure:1.04},
 {silhouette:'copperworks',sky:'#687e94',horizon:'#edc6a0',masonry:'#74665d',stone:'#ceb798',tile:'#d8c8a6',metal:'#b67645',sun:'#ffd3a1',ground:'#75614d',exposure:1.06},
 {silhouette:'frost',sky:'#688fbd',horizon:'#e4f6f4',masonry:'#93b5c9',stone:'#d3e8ed',tile:'#edf7f4',metal:'#5c90a6',sun:'#e8f5ff',ground:'#718b9b',exposure:1.02},
 {silhouette:'coral',sky:'#688db0',horizon:'#f2d9d5',masonry:'#ad8293',stone:'#e2bfc0',tile:'#f0dbd5',metal:'#428d99',sun:'#ffe4d6',ground:'#826879',exposure:1.04},
 {silhouette:'canopy',sky:'#66b2bd',horizon:'#eff4d7',masonry:'#a0bea2',stone:'#e7e2bd',tile:'#f3ecd0',metal:'#398d73',sun:'#fff2ca',ground:'#6d8061',exposure:1.03},
 {silhouette:'foundry',sky:'#716071',horizon:'#d89c79',masonry:'#655562',stone:'#a38d83',tile:'#c9b8a2',metal:'#c18346',sun:'#ffca91',ground:'#654f52',exposure:1.12},
 {silhouette:'observatory',sky:'#283e69',horizon:'#94a6c5',masonry:'#596784',stone:'#a4b2cd',tile:'#c6d1dd',metal:'#9f9cc3',sun:'#cadcfe',ground:'#475b7c',exposure:1.16},
 {silhouette:'astral',sky:'#52467b',horizon:'#c0b4d8',masonry:'#85739b',stone:'#c8b9dc',tile:'#e6d8ed',metal:'#56aab6',sun:'#f3ddff',ground:'#605978',exposure:1.10},
 {silhouette:'crown',sky:'#b69a7b',horizon:'#fff0c7',masonry:'#c49e68',stone:'#f6dfae',tile:'#fff0d3',metal:'#c29a46',sun:'#ffe5b3',ground:'#9e8259',exposure:1.02},
].map(Object.freeze);
export function districtStyle(index) {
 return Number.isInteger(index) && index >= 0 && index < STYLES.length ? STYLES[index] : STYLES[0];
}

/** A small linear-color backdrop. No image requests or frame-time allocations. */
export function createSkyTexture(index) {
 const style=districtStyle(index),width=16,height=128,data=new Uint8Array(width*height*4);
 const top=new THREE.Color(style.sky),horizon=new THREE.Color(style.horizon),color=new THREE.Color();
 for(let y=0;y<height;y++){
  const t=Math.pow(y/(height-1),.72);
  color.copy(horizon).lerp(top,t);
  for(let x=0;x<width;x++){const i=(y*width+x)*4;data[i]=Math.round(color.r*255);data[i+1]=Math.round(color.g*255);data[i+2]=Math.round(color.b*255);data[i+3]=255;}
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.colorSpace=THREE.LinearSRGBColorSpace;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
 return texture;
}

// Cut lines are presentation-only. Same topology drives color and relief so the
// engraved joints align. Each district uses a distinct masonry grammar instead
// of recoloring one strict square grid. Analytic warps are periodic at 128 px.
export function tileTopology(x,y,index=0){
 const d=Number.isInteger(index)&&index>=0&&index<10?index:0;
 const px=Number.isFinite(x)?x:0,py=Number.isFinite(y)?y:0;
 const pi2=Math.PI*2,sin=Math.sin,angle=pi2/8;
 if(d===7){
  const dx=px-64,dy=py-64,r=Math.hypot(dx,dy),theta=(Math.atan2(dy,dx)+pi2)%pi2;
  const ring=r%24,sector=theta%angle;
  const edge=Math.min(ring,24-ring,r*Math.min(sector,angle-sector));
  return {seam:edge<2,edge,cell:Math.floor(r/24)*17+Math.floor(theta/angle)};
 }
 let u=px,v=py,sx=32,sy=32,offset=0;
 const warpX=sin(pi2*py/128*2),warpY=sin(pi2*px/128*2);
 switch(d){
  case 0:u+=warpX*4;v+=warpY*3;break;
  case 1:sx=64;sy=32;u+=sin(pi2*py/128)*1.1;break;
  case 2:break;
  case 3:u+=py*.5;v-=px*.5;break;
  case 4:u+=warpX*6;v+=sin(pi2*px/128*3)*4;break;
  case 5:u+=warpX*8;v+=warpY*6;break;
  case 6:sy=16;break;
  case 8:u+=py;v-=px;break;
  case 9:sx=64;sy=64;u+=sin(pi2*py/128)*2;break;
 }
 const row=Math.floor(v/sy);
 if(d===0||d===1||d===4||d===5||d===9)offset=(row&1)*sx*.5;
 const column=Math.floor((u+offset)/sx),ux=((u+offset)%sx+sx)%sx,vy=((v%sy)+sy)%sy;
 const edge=Math.min(ux,sx-ux,vy,sy-vy);
 return {seam:edge<2,edge,cell:Math.imul(column+37,251)+Math.imul(row+43,733)};
}

// Red is relief, green is roughness. Sharing the map avoids a second texture.
function detailTexture(kind, districtIndex=0) {
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=(Math.sin(x*1.71+y*3.19)+Math.sin(x*.31-y*.53))*.5;
  const brick=kind==='brick'&&(y%32<2||(x+(Math.floor(y/32)%2)*32)%64<2);
  const joint=brick||(kind==='tile'&&tileTopology(x,y,districtIndex).seam);
  const height=joint?65:184+grain*10+Math.sin(x*.13)*Math.cos(y*.11)*8;
  const i=(y*size+x)*4;data[i]=height;data[i+1]=joint?245:210+grain*14;data[i+2]=data[i];data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;
 return texture;
}


// Original, deterministic material studies. No image downloads or random rule state.
function surfaceTexture(kind, color, districtIndex = 0) {
 const size=128, data=new Uint8Array(size*size*4), base=new THREE.Color(color);
 let state=173;
 const noise=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let v=.91+noise()*.17;
  if(kind==='stone')v+=Math.sin(y*.42+Math.sin(x*.05)*3)*.025;
  if(kind==='rock')v+=Math.sin(y*.19+Math.sin(x*.06)*1.6)*.12+Math.sin(y*.71)*.04;
  if(kind==='moss')v+=Math.sin(x*.13)*Math.sin(y*.19)*.12;
  if(kind==='brick') {const row=Math.floor(y/32), seam=y%32<2 || (x+(row%2)*32)%64<2;v=seam?.75:v;}
  if(kind==='copper')v+=Math.sin(x*.13)*Math.cos(y*.08)*.1;
  if(kind==='tile'){
   // Deterministic per-block patina and worn, incised grout. Unlike the old
   // 1-pixel white grid, this remains visible from the gameplay camera.
   const {cell,edge,seam}=tileTopology(x,y,districtIndex);
   let hash=Math.imul(cell+11,0x45d9f3b)^Math.imul(districtIndex+5,0x165667b1);
   hash=Math.imul(hash^(hash>>>16),0x45d9f3b);
   const patina=((hash>>>0)&255)/255;
   v=.67+patina*.33+(noise()-.5)*.065+.025*Math.sin(x*.45+Math.sin(y*.17)*1.7);
   if(seam)v=.4+patina*.075;
   else if(edge<5)v*=.88;
  }
  const i=(y*size+x)*4;
  data[i]=Math.min(255,base.r*255*v);data[i+1]=Math.min(255,base.g*255*v);data[i+2]=Math.min(255,base.b*255*v);data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;texture.colorSpace=THREE.LinearSRGBColorSpace;
 return texture;
}
export function palette(district) {
 const style=districtStyle(district?.index),accent=style.metal;
 const districtIndex=Number.isInteger(district?.index)&&district.index>=0&&district.index<10?district.index:0;
 const mat=(color,roughness=.64,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const textured=(kind,color,roughness=.9,metalness=0)=>{
  const detail=detailTexture(kind,districtIndex);
  return new THREE.MeshStandardMaterial({map:surfaceTexture(kind,color,districtIndex),bumpMap:detail,roughnessMap:detail,bumpScale:kind==='brick'?.085:kind==='tile'?.025:.045,roughness,metalness});
 };
 return {
  terracotta:textured('brick',style.masonry), clay:textured('stone',style.ground), shadow:mat('#3b645d'),
  water:new THREE.MeshStandardMaterial({color:'#269dab',roughness:.19,metalness:.4,emissive:'#094b56',emissiveIntensity:.16}),
  soil:textured('stone','#473c29'), ivory:mat('#f1e7cd'), pale:mat('#fff4d9'), edge:textured('stone',style.stone),
  stone:textured('stone',style.stone), tile:textured('tile',style.tile), copper:textured('copper',accent,.55,.3),
  dark:mat('#163f47',.4,.5), teal:mat(accent,.38,.45), gold:mat('#dca545',.32,.65),
  leaf:new THREE.MeshStandardMaterial({color:'#217c48',roughness:.72,side:THREE.DoubleSide}),
  leaf2:new THREE.MeshStandardMaterial({color:'#72ac49',roughness:.8,side:THREE.DoubleSide}),
  leafDark:new THREE.MeshStandardMaterial({color:'#165e43',roughness:.85,side:THREE.DoubleSide}),
  flower:mat('#efb85b'), coral:mat('#d97369'), bark:textured('stone','#73573a'),
  danger:mat('#eb5934',.33,.25), glow:new THREE.MeshStandardMaterial({color:'#ffd37d',emissive:'#f8a82e',emissiveIntensity:.65}),
  glass:new THREE.MeshStandardMaterial({color:'#123c52',roughness:.18,metalness:.35}), white:mat('#fff9ed'),black:mat('#102c38'),
  cliff:textured('rock',style.ground), moss:textured('moss','#558449'),
  distant:mat(style.sky),distant2:mat(style.horizon),
 };
}
export function disposeTree(root) {
 const geometries=new Set(), materials=new Set(), textures=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
 for(const m of materials)for(const value of Object.values(m))if(value?.isTexture)textures.add(value);
 geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
