/**
 * AI Dungeon environmental look contract (Session 6).
 * No Three.js import, random source, authority mutation or geometry ownership.
 * Material roles are stable across original and future Session-5 architecture.
 * Original procedural atlases: authored here, no third-party bitmap licenses.
 */
const define = options => Object.freeze(options);
export const ENVIRONMENT_MATERIAL_ROLES = Object.freeze({
 masonry:define({family:'stone',roughness:.94,metalness:.015,normalScale:.40,texelsPerMeter:128,emissiveIntensity:0}),
 floorStone:define({family:'stone',roughness:.91,metalness:.012,normalScale:.34,texelsPerMeter:128,emissiveIntensity:0}),
 carvedStone:define({family:'stone',roughness:.93,metalness:.018,normalScale:.25,texelsPerMeter:128,emissiveIntensity:0}),
 dampStone:define({family:'stone',roughness:.78,metalness:.025,normalScale:.25,texelsPerMeter:128,emissiveIntensity:0}),
 agedMetal:define({family:'metal',roughness:.66,metalness:.62,normalScale:.20,texelsPerMeter:128,emissiveIntensity:0}),
 brass:define({family:'metal',roughness:.55,metalness:.70,normalScale:.16,texelsPerMeter:128,emissiveIntensity:0}),
 timber:define({family:'wood',roughness:.87,metalness:0,normalScale:.25,texelsPerMeter:128,emissiveIntensity:0}),
 hangingCloth:define({family:'cloth',roughness:.96,metalness:0,normalScale:.12,texelsPerMeter:128,emissiveIntensity:0}),
 soot:define({family:'soot',roughness:.98,metalness:0,normalScale:.08,texelsPerMeter:128,emissiveIntensity:0}),
 magicInset:define({family:'stone',roughness:.69,metalness:.04,normalScale:.16,texelsPerMeter:128,emissiveIntensity:.62})
});
export const ENVIRONMENT_SURFACE_DETAIL_BUDGET=define({
 size:128,wallMaps:2,floorMaps:3,textureCount:5,
 rawBytes:5*128*128*4,maxMipmappedBytes:440000,
 colorMapsAreSRGB:true,dataMapsAreLinear:true,shadowMapsAdded:0,lightSourcesAdded:0
});
export const ENVIRONMENT_SETPIECE_DETAIL_BUDGET=define({
 size:128,textureCount:7,rawBytes:7*128*128*4,maxMipmappedBytes:620000,
 roles:Object.freeze(['timber','agedMetal','hangingCloth']),
 extraLights:0,extraGeometry:0,extraRenderPasses:0
});
const LIGHT_PRESETS=[
 define({biome:'SUNKEN CRYPT',ambientScale:.97,moonIntensity:1.76,
   fogDensity:.0165,exposure:1.20,torchIntensity:1.85,
   hemisphereSky:'#b8bdba',hemisphereGround:'#5d5547',
   keyDirection:Object.freeze([-6,18,8])}),
 define({biome:'EMBER CATHEDRAL',ambientScale:.95,moonIntensity:1.76,
   fogDensity:.0175,exposure:1.18,torchIntensity:1.78,
   hemisphereSky:'#b8aab0',hemisphereGround:'#69483d',
   keyDirection:Object.freeze([-8,19,4])}),
 define({biome:'OBSIDIAN VAULT',ambientScale:1.02,moonIntensity:1.84,
   fogDensity:.0145,exposure:1.23,torchIntensity:1.72,
   hemisphereSky:'#b0c5d4',hemisphereGround:'#44566b',
   keyDirection:Object.freeze([7,21,6])}),
 define({biome:'HOLLOW SANCTUM',ambientScale:1.00,moonIntensity:1.78,
   fogDensity:.0170,exposure:1.21,torchIntensity:1.78,
   hemisphereSky:'#c0b5c8',hemisphereGround:'#544961',
   keyDirection:Object.freeze([5,20,-7])})
];
const validFloor=floor=>Number.isSafeInteger(floor)&&floor>=1;
export function getEnvironmentMaterialRole(role){
 if(!Object.prototype.hasOwnProperty.call(ENVIRONMENT_MATERIAL_ROLES,role))
  throw new RangeError('Unknown environmental material role: '+String(role));
 return ENVIRONMENT_MATERIAL_ROLES[role];
}
export function planEnvironmentLightPreset(floor){
 if(!validFloor(floor))throw new RangeError('Invalid dungeon floor');
 return LIGHT_PRESETS[(floor-1)%LIGHT_PRESETS.length];
}
function hash(x,y,z){
 let n=Math.imul((x|0)+157,0x45d9f3b)^Math.imul((y|0)+349,0x27d4eb2d)^Math.imul((z|0)+563,0x165667b1);
 n=Math.imul(n^(n>>>16),0x7feb352d);return(n^(n>>>15))>>>0;
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const smoothstep=t=>t*t*(3-2*t);
// Periodic, interpolated low-frequency noise. Unlike independent white-noise
// pixels, this avoids aliasing in live camera movement and is seamless at
// the image boundary. Evaluated only at floor creation, not every frame.
function smoothPeriodicNoise(x,y,size,cells,seed){
 const gx=x*cells/size,gy=y*cells/size,ix=Math.floor(gx),iy=Math.floor(gy);
 const tx=smoothstep(gx-ix),ty=smoothstep(gy-iy);
 const v=(a,b)=>((hash((a+cells)%cells,(b+cells)%cells,seed)&65535)/65535)*2-1;
 const top=v(ix,iy)*(1-tx)+v(ix+1,iy)*tx;
 const bottom=v(ix,iy+1)*(1-tx)+v(ix+1,iy+1)*tx;
 return top*(1-ty)+bottom*ty;
}
/**
 * Make tileable, original color/roughness/tangent-normal textures. Height is
 * regenerated from the SAME deterministic stone courses as its normal map;
 * the roughness channel follows pores, grout, pitting, damp marks or weave.
 * Four-byte RGBA layouts are ready for THREE.DataTexture without conversions.
 * No repeat texture allocations within a frame: caller creates once per floor.
 */
export function makeEnvironmentDetailPixels(role,floor,size=128){
 const spec=getEnvironmentMaterialRole(role);
 if(!validFloor(floor))throw new RangeError('Invalid dungeon floor');
 if(!Number.isInteger(size)||size<32||size>256||size%32!==0)
  throw new RangeError('Invalid environment texture dimension');
 const pixels=size*size,albedoPixels=new Uint8Array(pixels*4);
 const normalPixels=new Uint8Array(pixels*4),roughnessPixels=new Uint8Array(pixels*4);
 const height=new Uint8Array(pixels);
 const stone=spec.family==='stone',wood=spec.family==='wood',cloth=spec.family==='cloth',metal=spec.family==='metal';
 const cell=stone?size/4:wood?size/8:size/16;
 // The original live main-wall albedo has 31px courses and 44px staggered
 // bricks. Match that physical relief rather than lighting a different grid.
 const masonry=role==='masonry';
 const courseHeight=masonry?31:cell,brickWidth=masonry?44:cell;
 const stagger=masonry?22:cell/2;
 const wrap=n=>(n%size+size)%size;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,j=i*4,row=Math.floor(y/courseHeight);
  const tiledX=x+(row%2)*stagger,ax=tiledX%brickWidth,ay=y%courseHeight;
  const seam=stone&&(ax<2||ay<2);
  const fiber=wood&&((x+Math.floor(Math.sin(y*.11)*2))%8<1);
  const weave=cloth&&(x%7===0||y%7===0);
  const low=smoothPeriodicNoise(x,y,size,8,floor+41);
  const high=smoothPeriodicNoise(x,y,size,32,floor+71);
  const grain=Math.round(low*18+high*8);
  const chip=hash(x>>1,y>>1,floor+29)%73===0;
  const stain=hash(Math.floor(x/8),Math.floor(y/8),floor+13)%13===0;
  const damp=role==='dampStone'&&stain;
  const oxide=metal&&hash(x>>3,y>>3,floor+77)%9===0;
  const base=wood?168:metal?168:cloth?171:role==='soot'?92:stone?221:193;
  const dark=seam?-.56:chip?-.22:damp?-.27:stain?-.09:0;
  const shade=clamp(Math.round(base*(1+dark)+grain*.50+(fiber?-15:0)-(oxide?17:0)),12,240);
  albedoPixels[j]=clamp(shade+(oxide?11:0),0,255);
  albedoPixels[j+1]=clamp(shade+(wood?6:cloth?4:0)-(oxide?5:0),0,255);
  albedoPixels[j+2]=clamp(shade+(metal&&!oxide?7:0)-(oxide?12:0),0,255);
  albedoPixels[j+3]=255;
  height[i]=clamp(Math.round((seam?38:wood?144:metal?164:cloth?130:171)+grain*.62-
    (chip?43:0)-(weave?14:0)-(fiber?22:0)),18,220);
  const rough=clamp(Math.round(255*(spec.roughness*.94+
    (grain/22)*.035+(seam?.065:0)+(stain?.025:0)-(damp?.14:0))),60,250);
  roughnessPixels[j]=rough;roughnessPixels[j+1]=rough;roughnessPixels[j+2]=rough;roughnessPixels[j+3]=255;
 }
 const strength=spec.normalScale*1.5;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const sample=(u,v)=>height[wrap(v)*size+wrap(u)];
  const dx=(sample(x+1,y)-sample(x-1,y))/255*strength;
  const dy=(sample(x,y+1)-sample(x,y-1))/255*strength;
  const inv=1/Math.sqrt(1+dx*dx+dy*dy),j=(y*size+x)*4;
  normalPixels[j]=Math.round(clamp((1-dx*inv)*127.5,0,255));
  normalPixels[j+1]=Math.round(clamp((1-dy*inv)*127.5,0,255));
  normalPixels[j+2]=Math.round(clamp(inv*255,0,255));
  normalPixels[j+3]=255;
 }
 return {width:size,height:size,albedoPixels,normalPixels,roughnessPixels,
  rawBytes:3*pixels*4,role,floor};
}

/**
 * Original 256px wall and floor façade albedo. A mortar grid repeats cleanly
 * across both image edges (8 courses, 4 half-staggered stones per row), with
 * a bounded mineral/pitted face; no generic rectangular highlights, random
 * runtime calls, downloads, or decoration occupying the fighting lane.
 * Palette values are existing biome colours. Albedo is sRGB RGBA8.
 */
function facadePalette(palette){
 if(!palette||!['mortar','stone','edge'].every(k=>typeof palette[k]==='string'&&/^#[0-9a-f]{6}$/i.test(palette[k])))
  throw new RangeError('Invalid masonry palette');
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 return {mortar:rgb(palette.mortar),stone:rgb(palette.stone),edge:rgb(palette.edge)};
}
function facadeSample(floor,x,y,size){
 const courseHeight=size/8,blockWidth=size/4;
 const course=Math.floor(y/courseHeight);
 const shifted=x+(course%2)*blockWidth/2;
 const bx=shifted%blockWidth,by=y%courseHeight;
 const border=Math.min(bx,blockWidth-bx,by,courseHeight-by);
 const mortar=border<2;
 const brickIndex=Math.floor(shifted/blockWidth);
 const block=(hash(brickIndex,course,floor+99)%31-15)/240;
 const strata=smoothPeriodicNoise(x,y,size,8,floor+61);
 const pores=smoothPeriodicNoise(x,y,size,32,floor+83);
 const hairline=(hash(x>>2,y>>2,floor+12)%31===0)&&((x+y)%5<2);
 const chipped=border<6&&hash(x>>1,y>>1,floor+23)%19===0;
 return {mortar,border,strata,pores,hairline,chipped,block};
}
export function makeFacadeMasonryPixels(floor,kind,size=256,palette){
 if(!validFloor(floor)||size!==256||!['wall','floor'].includes(kind))
  throw new RangeError('Invalid façade texture specification');
 const rgb=facadePalette(palette),out=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const p=facadeSample(floor,x,y,size),idx=(y*size+x)*4;
  const wet=kind==='floor'&&p.border<9&&p.strata<-.16;
  const soot=kind==='wall'&&p.strata>.53&&p.pores<-.28;
  const strain=(p.strata*.10+p.pores*.045+p.block)+(p.chipped?-.13:0)+(p.hairline?-.10:0);
  const exposed=p.border>2&&p.border<6;
  const mul=p.mortar?.79:kind==='floor'?1.035:1.0;
  const tone=clamp(mul*(1+strain+(exposed?.065:0)-(wet?.10:0)-(soot?.08:0)),.55,1.18);
  const blockColor=p.mortar?rgb.mortar:rgb.stone;
  const edgeMix=p.mortar?0:clamp(.12+p.block*.6+(p.chipped?.27:0),0,.4);
  for(let c=0;c<3;c++){
   const original=blockColor[c]*(1-edgeMix)+rgb.edge[c]*edgeMix;
   out[idx+c]=Math.round(clamp(original*tone,6,248));
  }
  out[idx+3]=255;
 }
 return out;
}
/** Bump height from exactly the same stone joints, chips and seed as albedo. */
export function makeFacadeMasonryReliefPixels(floor,size=256){
 if(!validFloor(floor)||size!==256)throw new RangeError('Invalid façade relief specification');
 const out=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const p=facadeSample(floor,x,y,size),i=(y*size+x)*4;
  const depth=p.mortar?39:clamp(Math.round(155+p.strata*22+p.pores*11+p.block*70-(p.chipped?46:0)-(p.hairline?21:0)),64,218);
  out[i]=out[i+1]=out[i+2]=depth;out[i+3]=255;
 }
 return out;
}

/**
 * Stone wear is painted onto existing floor instances, NOT new geometry.
 * Inputs are the real read-only walkability grid, cosmetic floor and actual
 * exit. Never interprets a painted seam as a hazard, passage or attack.
 * No saved state, clock access, global RNG, or interpolated gameplay history.
 */
export function planEnvironmentSurfaceWear(map,floor,exit=null){
 if(!Array.isArray(map)||map.length<3||map.length>64||
   !map.every(row=>typeof row==='string'&&row.length===map.length))
  throw new RangeError('Invalid dungeon floor plan');
 if(!validFloor(floor))throw new RangeError('Invalid dungeon floor');
 const size=map.length,tiles=Array(size*size).fill(null);
 const open=(x,z)=>x>=0&&z>=0&&x<size&&z<size&&map[z][x]==='.';
 const exitValid=Number.isInteger(exit?.x)&&Number.isInteger(exit?.z)&&open(exit.x,exit.z);
 const metrics={tiles:0,damp:0,soot:0,traffic:0,dry:0,instanceColorBytes:0,
  bleedIntoWalls:0,exitLit:exitValid};
 const tone=n=>Math.round(clamp(n,.65,1.08)*1000)/1000;
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  if(!open(x,z))continue;
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].reduce(
   (n,[dx,dz])=>n+Number(open(x+dx,z+dz)),0);
  const wallCount=4-neighbors;
  const number=hash(x,z,floor);
  const wet=wallCount>0&&number%7===0;
  const soot=wallCount>=2&&number%13===0&&!wet;
  const travelled=!wet&&!soot&&neighbors<=2&&number%4!==0;
  const wear=wet?'damp':soot?'soot':travelled?'traffic':'dry';
  const grain=((number>>>7)%37)/1000-.018;
  const shadow=wallCount*.007+(wet?.085:soot?.065:0);
  const trampled=travelled?.043:0;
  const exitNear=exitValid&&Math.abs(exit.x-x)+Math.abs(exit.z-z)<=2;
  const entryNear=Math.abs(1-x)+Math.abs(1-z)<=2;
  const clarity=exitNear||entryNear;
  const value=clamp(.93+grain-shadow+trampled,.69,1.06);
  const v=clarity?Math.max(.94,value):value;
  // Damp areas cool towards mineral green; soot neutralises coloured glow.
  const rgb=wet?[tone(v*.965),tone(v*.997),tone(v*1.015)]:
   soot?[tone(v*.98),tone(v*.967),tone(v*.958)]:
   travelled?[tone(v*1.02),tone(v*1.005),tone(v*.985)]:
   [tone(v),tone(v),tone(v*.991)];
  tiles[z*size+x]=Object.freeze({x,z,r:rgb[0],g:rgb[1],b:rgb[2],wear});
  metrics.tiles++;metrics[wear]++;
 }
 metrics.instanceColorBytes=metrics.tiles*3*4;
 return Object.freeze({floor,size,tiles:Object.freeze(tiles),metrics:Object.freeze(metrics)});
}
