'use strict';
// W447 original game geometry contract. Executed against the real HTML
// source, not a test-only replica; NO browser/headless FPS claim here.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function functionSource(name){
 const begin=html.indexOf('function '+name+'(');
 assert(begin>=0,'missing actual source function '+name);
 const open=html.indexOf('{',begin);let depth=0,pos=open;
 for(;pos<html.length;pos++){
  if(html[pos]==='{')depth++;
  if(html[pos]==='}'&&!--depth)return html.slice(begin,pos+1);
 }
 throw Error('malformed '+name);
}
const ctx={forestVisualStats:{broadleafLobes:0,microCrownLobes:0},faces:[]};
ctx.tri=(a,b,c,col)=>ctx.faces.push({a,b,c,col});
vm.runInNewContext(functionSource('woodlandCrownContour')+'\n'+
 functionSource('crownLobe')+'\nthis.make=crownLobe;',ctx);
function make(options){
 ctx.faces.length=0;
 ctx.make(0,2,0,1,.8,1,[.4,.6,.3],3.5,...options);
 return JSON.parse(JSON.stringify(ctx.faces));
}
const near=make([false,true,false]);
assert.equal(near.length,48,'RED on old 54-face rounded near canopy');
assert(near.every(f=>[...f.a,...f.b,...f.c,...f.col].every(Number.isFinite)));
const distant=make([false,true,'far']),middle=make([false,true,true]),
 fine=make([true,true,false]);
assert.equal(distant.length,20,'original far canopy stays 20 faces');
assert.equal(middle.length,28,'original mid canopy stays 28 faces');
assert.equal(fine.length,24,'original micro crown stays 24 faces');
const radius=point=>Math.hypot(point[0],point[2]);
const outside=near.filter(f=>[f.a,f.b,f.c].some(p=>radius(p)>1.12));
assert(outside.length>=12,'near canopy should have genuine outreaching leaf sprays');
assert(!distant.some(f=>[f.a,f.b,f.c].some(p=>radius(p)>1.12)));
const repeated=make([false,true,false]);
assert.deepEqual(repeated,near,'seed/position must produce byte-identical geometry');
assert.equal(ctx.forestVisualStats.broadleafLobes,5);
assert.equal(ctx.forestVisualStats.microCrownLobes,1);
assert(html.includes('const detailTier=forestDetailTier(x,z);'),'same real seeded trees must remain');
console.log('W447 48/28/20/24 original world rooted canopy and six double-sided fringe sprays GREEN; full running WebGL/art/FPS unverified');
