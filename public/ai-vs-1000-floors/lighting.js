import * as THREE from 'three';
import {districtStyle} from './materials.js';

/** Small original HDR reflection field. It is lighting, not a background image.
 * The renderer prefilters it for material roughness. One map is retained for the
 * active district; no remote art, scene camera, simulation or random state.
 */
export function createDistrictRadiance(index) {
 const style=districtStyle(index),width=128,height=64,data=new Float32Array(width*height*4);
 const sky=new THREE.Color(style.sky),horizon=new THREE.Color(style.horizon),ground=new THREE.Color(style.ground),warm=new THREE.Color(style.sun);
 const key=new THREE.Vector3(-.55,.65,.52).normalize(),fill=new THREE.Vector3(.78,.32,-.54).normalize(),d=new THREE.Vector3(),color=new THREE.Color();
 for(let y=0;y<height;y++){
  const latitude=(y/(height-1)-.5)*Math.PI,up=Math.sin(latitude),radius=Math.cos(latitude);
  for(let x=0;x<width;x++){
   const phi=(x/width-.5)*Math.PI*2;d.set(Math.cos(phi)*radius,up,Math.sin(phi)*radius);
   if(up>=0)color.copy(horizon).lerp(sky,Math.pow(up,.45)).multiplyScalar(.48+.18*up);
   else color.copy(horizon).lerp(ground,Math.pow(-up,.20)).multiplyScalar(.18);
   // Broad warm key and cool rim create readable reflected planes, not glitter.
   const a=Math.pow(Math.max(0,d.dot(key)),24)*4.0,b=Math.pow(Math.max(0,d.dot(fill)),14)*1.25;
   const i=(y*width+x)*4;data[i]=color.r+warm.r*a+b*.70;data[i+1]=color.g+warm.g*a+b*.85;data[i+2]=color.b+warm.b*a+b;data[i+3]=1;
  }
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);
 texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;
 texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;texture.name='district-radiance';
 return texture;
}
