'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('const SOLAR_ATLAS_SIZE=384'),end=html.indexOf('function directionalCastShadows(',start);
assert(start>0&&end>start,'read actual renderer, not a visual mock');
const context={gpuAvailable:false,swiftGpu:true,
 sunShadow:()=>({strength:1,distance:2,dx:.8,dz:.6}),
 dropShadowPoint:(x,z,h,sun)=>[x+h*sun.dx*sun.distance,0,z+h*sun.dz*sun.distance]};
vm.createContext(context);
vm.runInContext('let presentationEpoch=0,lastFrozenFrameKey=null,solarShadowActive=null;'+html.slice(start,end),context,{timeout:10000});
const run=js=>vm.runInContext(js,context,{timeout:10000});
const sample=(x,z)=>run('solarAtlasPixels[('+Math.floor((z+48)*4)+'*384+'+Math.floor((x+48)*4)+')*4]');
test('original real-roof contact sweeps from foundations to projected ridge; no pasted circular disk',()=>{
 run('solarAtlasPixels.fill(255);stampSolarAtlasCaster(0,0,1.8,1.3,3,sunShadow(12),true,"roof")');
 assert(sample(2.4,1.8)<245,'real house connects actual ground to cast roof');
 assert(sample(4.8,3.6)<245,'projected roof remains dark');
 assert.equal(sample(-12,-12),255,'no invented distant roof shadow');
 assert.equal(sample(45,45),255,'atlas boundary stays unshadowed');
});
test('existing trees have separate irregular rooted canopy; no authority writes',()=>{
 run('solarAtlasPixels.fill(255);stampSolarAtlasCaster(6,6,.8,.72,2,sunShadow(12),false,"canopy")');
 assert(sample(9.2,8.4)<255,'projected rooted canopy exists');
 assert.equal(sample(2,2),255,'tree shadow does not invent a ground-spanning roof');
 assert.match(html,/for\(const \[x,z,k\] of city\)/);
 assert.match(html,/for\(const tree of trees\)/);
 assert.match(html,/staticGroundShade=1\./);
 assert.match(html,/all\(greaterThanEqual\(solarUv,vec2\(0\.\)\)\)/);
 assert.doesNotMatch(html.slice(start,end),/Math\.random|people\.push|city\.push/);
});
