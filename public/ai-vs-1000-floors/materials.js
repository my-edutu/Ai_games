import * as THREE from 'three';

// Original, deterministic material studies. No image downloads or random rule state.
function surfaceTexture(kind, color) {
 const size=128, data=new Uint8Array(size*size*4), base=new THREE.Color(color);
 let state=173;
 const noise=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let v=.91+noise()*.17;
  if(kind==='stone')v+=Math.sin(y*.42+Math.sin(x*.05)*3)*.025;
  if(kind==='rock')v+=Math.sin(y*.19+Math.sin(x*.06)*1.6)*.12+Math.sin(y*.71)*.04;
  if(kind==='moss')v+=Math.sin(x*.13)*Math.sin(y*.19)*.12;
  if(kind==='brick') {const row=Math.floor(y/32), seam=y%32<2 || (x+(row%2)*32)%64<2;v=seam?.55:v;}
  if(kind==='copper')v+=Math.sin(x*.13)*Math.cos(y*.08)*.1;
  if(kind==='tile'){const seam=x%32<1||y%32<1;v=seam?.64:v;}
  const i=(y*size+x)*4;
  data[i]=Math.min(255,base.r*255*v);data[i+1]=Math.min(255,base.g*255*v);data[i+2]=Math.min(255,base.b*255*v);data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;texture.colorSpace=THREE.LinearSRGBColorSpace;
 return texture;
}
export function palette(district) {
 const colors=['#268c80','#288d9b','#a76638','#8bc5ce','#c37a70','#48997f','#ac573e','#53688f','#7d6b9b','#c99a48'];
 const accent=colors[district?.index%10]||colors[0];
 const mat=(color,roughness=.64,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const textured=(kind,color,roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({map:surfaceTexture(kind,color),roughness,metalness});
 return {
  terracotta:textured('brick','#ad6346'), clay:textured('stone','#c28760'), shadow:mat('#3b645d'),
  water:new THREE.MeshStandardMaterial({color:'#269dab',roughness:.19,metalness:.4,emissive:'#094b56',emissiveIntensity:.16}),
  soil:textured('stone','#473c29'), ivory:mat('#f1e7cd'), pale:mat('#fff4d9'), edge:textured('stone','#c6ab7f'),
  stone:textured('stone','#e6d5ad'), tile:textured('tile','#e9ddbd'), copper:textured('copper',accent,.4,.5),
  dark:mat('#163f47',.4,.5), teal:mat(accent,.38,.45), gold:mat('#dca545',.32,.65),
  leaf:new THREE.MeshStandardMaterial({color:'#217c48',roughness:.72,side:THREE.DoubleSide}),
  leaf2:new THREE.MeshStandardMaterial({color:'#72ac49',roughness:.8,side:THREE.DoubleSide}),
  leafDark:new THREE.MeshStandardMaterial({color:'#165e43',roughness:.85,side:THREE.DoubleSide}),
  flower:mat('#efb85b'), coral:mat('#d97369'), bark:textured('stone','#73573a'),
  danger:mat('#eb5934',.33,.25), glow:new THREE.MeshStandardMaterial({color:'#ffd37d',emissive:'#f8a82e',emissiveIntensity:.65}),
  glass:new THREE.MeshStandardMaterial({color:'#123c52',roughness:.18,metalness:.35}), white:mat('#fff9ed'),black:mat('#102c38'),
  cliff:textured('rock','#a18460'), moss:textured('moss','#558449'),
  distant:mat('#6c9595'),distant2:mat('#89aaaa'),
 };
}
export function disposeTree(root) {
 const geometries=new Set(), materials=new Set(), textures=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
 for(const m of materials)for(const value of Object.values(m))if(value?.isTexture)textures.add(value);
 geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
