'use strict';
// W243 visual-human workstream: executes the ACTUAL production face geometry
// used for genuine autonomous compact residents, without running a fake citizen.
// The seeded economy, camera, world state and hardware FPS remain separate gates.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start,'real playable JS must be present');
new vm.Script(html.slice(start+8,end),{filename:'real-tiny-kingdom.js'});
const first=html.indexOf('function renderCompactOriginalFace('),
 last=html.indexOf('function compactVillager(p){',first);
assert(first>=0&&last>first,'production compact physical face/identity function missing');
const actual=html.slice(first,last);
const compact=html.slice(last,html.indexOf('function villager(p){',last));
assert.match(compact,/renderCompactOriginalFace\(p,i,x,y,z,s,skin,hair,rig,embodiment\)/,
 'real compact citizens must render their own original detailed face');
assert.match(compact,/renderArticulatedHand\(joint\(arm\.wrist\),s,skin,sideIndex===0\?-1:1\)/,
 'genuine working hands must follow actual autonomous IK wrists');
assert.match(compact,/tagWorkSkinRange\(j\+4,handStart\)/,
 'working fingers must join the existing 13-joint GPU bone, never freeze');
assert.doesNotMatch(actual,/\b(?:people\.(?:push|splice)|city\.(?:push|splice)|state\.(?:food|wood|gold|t)\s*=|Math\.random\s*\()/,
 'presentation-only original human geometry may not invent actors, stock, RNG or clocks');
const context={
 data:[],MATERIAL:{GENERAL:4},citizenMidVisualIndices:new Set(),
 rgb:()=>[.6,.5,.4],tags:[],bounds:null
};
let triangles=0,types={};
function mark(p){
 assert(Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),
  'every source human skull vertex is finite');
 context.bounds.minY=Math.min(context.bounds.minY,p[1]);
 context.bounds.maxY=Math.max(context.bounds.maxY,p[1]);
 context.bounds.minX=Math.min(context.bounds.minX,p[0]);
 context.bounds.maxX=Math.max(context.bounds.maxX,p[0]);
}
function emit(n,type){
 triangles+=n;types[type]=(types[type]||0)+n;
 context.data.length+=30*n;
}
context.materialScope=(_m,fn)=>fn();
context.quad=(a,b,c,d)=>{[a,b,c,d].forEach(mark);emit(2,'quads')};
context.tri=(a,b,c)=>{[a,b,c].forEach(mark);emit(1,'triangles')};
context.ellipsoid=(x,y,z,rx,ry,rz,col,segments)=>{
 assert([x,y,z,rx,ry,rz].every(Number.isFinite)&&
  rx>0&&ry>0&&rz>0&&segments>=6&&segments<=9);
 mark([x-rx,y-ry,z-rz]);mark([x+rx,y+ry,z+rz]);
 emit(segments*8,'scalp');
};
context.box=(x,y,z,w,h,d)=>{
 assert([x,y,z,w,h,d].every(Number.isFinite)&&w>0&&h>0&&d>0);
 mark([x-w/2,y,z-d/2]);mark([x+w/2,y+h,z+d/2]);
 emit(12,'solid');
};
context.taperedMedievalLimb=(a,b,r0,r1,col,sides)=>{
 mark(a);mark(b);assert(r0>0&&r1>0&&sides>=4);
 emit(2*sides,'nasal/neck');
};
context.rescaleCitizenHead=(from,to,x,y,z,s)=>{
 assert.equal(from,0);assert.equal(to,context.data.length);
 context.rescaled=true;
};
context.turnCitizenHead=(from,to,x,y,z,s,pose)=>{
 assert(pose&&Number.isFinite(pose.headYaw));
 context.turned=true;
};
context.tagWorkSkinRange=(joint,start)=>{
 assert.equal(joint,11,'the real 13-joint head bone owns hair and face');
 assert.equal(start,0);
 context.tags.push({joint,start,end:context.data.length});
};
vm.createContext(context);
vm.runInContext(actual+'\nthis.makeOriginalFace=renderCompactOriginalFace;',context);
for(const mid of [false,true])for(const [job,index] of [['farmer',0],['craftsperson',1],['builder',2]]){
 context.data=[];context.tags=[];context.rescaled=false;context.turned=false;
 context.bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
 context.citizenMidVisualIndices=mid?new Set([index]):new Set();
 triangles=0;types={};
 context.makeOriginalFace({job,activity:job==='farmer'?'Harvesting grain':'Working'},
  index,3,1,-7,1,[.7,.52,.4],[.3,.25,.20],
  {working:true,acting:{beat:.65}},{headYaw:.18,headPitch:.05});
 assert(triangles>=55&&triangles<=230,
  'physical face/hair/ears/eyes remain detailed yet bounded');
 assert(context.bounds.minY>=2.08&&context.bounds.maxY<=2.80,
  'adult face remains proportional to the original 1.7m citizen');
 assert.equal(context.tags.length,1);
 assert(context.rescaled&&context.turned,'head reacts to real original head pose');
 assert.equal(context.tags[0].end,context.data.length,'no unskinned loose face meshes');
 assert(types.quads>0&&types.scalp>0,'joined head structure and curved hair');
}
console.log('W243 original human-scale compact faces, job-linked hands, bounded LOD contract PASS; real WebGL A/B and physical hardware gates still NOT PROVEN');
