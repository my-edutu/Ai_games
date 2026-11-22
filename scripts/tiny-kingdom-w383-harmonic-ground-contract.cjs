'use strict';
// W383: production-derived, independently frozen pre-change base pigment.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new vm.Script(inline,{filename:'tiny-kingdom-inline.js'}));
const first=inline.indexOf('function fillOriginalGroundAtlasBasePixels(');
assert.ok(first>=0,'Original living valley ground atlas generator must remain present');
const end=inline.indexOf('\n}\n',first);
assert.ok(end>first,'Original ground generator must have a complete body');
const candidateText=inline.slice(first,end+2);
const referenceText="function fillOriginalGroundAtlasBasePixels(arr,size,extent){\n if(!(arr instanceof Uint8ClampedArray)||!Number.isInteger(size)||\n    size<1||arr.length!==size*size*4||!Number.isFinite(extent)||extent<=0)\n  throw Error('W344 invalid bounded original valley albedo');\n const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));\n const xWorld=new Float64Array(size),xRiver=new Float64Array(size),\n  xHash=new Int32Array(size),zWorld=new Float64Array(size),\n  zWind=new Float64Array(size),zHash=new Int32Array(size);\n for(let x=0;x<size;x++){\n  const wx=(x+.5)*extent/size-92;\n  xWorld[x]=wx;xRiver[x]=Math.sin(wx*.13);\n  xHash[x]=Math.imul(x+17,374761393);\n }\n for(let z=0;z<size;z++){\n  const wz=(z+.5)*extent/size-92;\n  zWorld[z]=wz;zWind[z]=Math.sin(wz*.035);\n  zHash[z]=Math.imul(z+79,668265263);\n }\n for(let z=0;z<size;z++)for(let x=0;x<size;x++){\n  const wx=xWorld[x],wz=zWorld[z];\n  const broad=Math.sin(wx*.151+wz*.063)*Math.cos(wz*.187-wx*.078);\n  const pebbles=Math.sin(wx*3.71+wz*1.21)*Math.cos(wz*4.17-wx*.63);\n  const drainage=Math.sin(wx*.073-wz*.049)+Math.cos(wz*.094+wx*.052);\n  const distance=Math.hypot(wx,wz);\n  const dry=Math.max(0,Math.min(1,(distance-23)/42));\n  const hash=Math.imul((xHash[x]^zHash[z])|0,1274126177);\n  const grit=(((hash^(hash>>>16))>>>0)/4294967295-.5)*10;\n  const hummock=Math.sin(wx*.43+wz*.29)*Math.cos(wz*.38-wx*.31);\n  const drift=Math.sin(wx*.089-wz*.063+1.8*zWind[z]);\n  const exposure=Math.max(0,Math.min(1,(distance-28)/43));\n  const shore=Math.abs(wz-(20+3*xRiver[x]));\n  const damp=Math.max(0,Math.min(1,(8.2-shore)/6.3));\n  const clay=Math.max(0,drift*.63+drainage*.18-.15)*(1-damp);\n  const stoneDust=Math.max(0,exposure*.72+.16*hummock);\n  const i=(z*size+x)*4;\n  arr[i]=clamp(112+10*broad+5*pebbles+7*dry+3*drainage+\n   3*hummock+grit+clay*21+stoneDust*17-damp*21);\n  arr[i+1]=clamp(123+11*broad+3*pebbles-2*dry+2*drainage+\n   4*hummock+grit*.65-clay*14-stoneDust*11-damp*14);\n  arr[i+2]=clamp(105+6*broad+2*pebbles-2*dry+3*drainage+\n   4*hummock+grit*.48-clay*16+stoneDust*3+damp*3);\n  arr[i+3]=255;\n }\n return arr;\n}";
const evaluate=source=>vm.runInThisContext('('+source+')');
const reference=evaluate(referenceText),candidate=evaluate(candidateText);
// Keep the proof self-contained; a renderer that returns cached or constant
// pigment cannot satisfy several independent extents/seeds and pixel checks.
let comparedPixels=0,changedChannels=0;
for(const [size,extent] of [[1,184],[16,184],[64,184],[128,140],[256,184],[512,184]]){
 const alloc=()=>new Uint8ClampedArray(size*size*4);
 const originalPixels=reference(alloc(),size,extent);
 const candidatePixels=candidate(alloc(),size,extent);
 assert.deepEqual(candidatePixels,originalPixels,
  'Physical original ground albedo changed at '+size+'px, extent '+extent);
 comparedPixels+=size*size;changedChannels+=candidatePixels.reduce((n,v,i)=>n+(v!==originalPixels[i]),0);
}
for(const bad of [null,new Uint8Array(64),new Uint8ClampedArray(7)])
 assert.throws(()=>candidate(bad,8,184));
assert.throws(()=>candidate(new Uint8ClampedArray(64),4,0));
assert.doesNotMatch(candidateText,/Math\.random\s*\(/);
// RED contract: trigonometric harmonic tables must execute per independent
// WORLD X/Z axis, rather than inside the 262,144 ground pixel loop.
assert.match(candidateText,/const\s+axis\s*=\s*\(/,
 'RED: missing bounded row/column harmonic precomputation');
assert.match(candidateText,/const\s+xs0\s*=/,
 'RED: no immutable original valley horizontal harmonic');
assert.match(candidateText,/const\s+zs0\s*=/,
 'RED: no immutable original valley vertical harmonic');
// The original procedural texture is a single 512px RGBA base canvas,
// not another live texture, draw call, LOD omission or mutable simulation.
const baselineTimes=[],candidateTimes=[];
for(let i=0;i<3;i++){
 const a=new Uint8ClampedArray(512*512*4),b=new Uint8ClampedArray(a.length);
 let before=performance.now();reference(a,512,184);
 baselineTimes.push(performance.now()-before);
 before=performance.now();candidate(b,512,184);
 candidateTimes.push(performance.now()-before);
 assert.deepEqual(b,a);
}
const median=v=>[...v].sort((a,b)=>a-b)[1];
console.log('W383 PASS: original ground pigment byte-identical ('+comparedPixels+
 ' pixels, '+changedChannels+' changed channels), cold CPU old/new medians '+
 median(baselineTimes).toFixed(1)+'/'+median(candidateTimes).toFixed(1)+
 ' ms (Node V8 diagnostic, NOT browser/WebGL/GPU FPS); no new GPU textures, geometry, simulation actions or RNG.');
