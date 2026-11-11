'use strict';
// W128 test-first contract for the real original near-detail worksite mesh.
// This is source/parity verification, not a browser/GPU/performance PASS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=src.indexOf('<script>'),end=src.lastIndexOf('</script>');
assert(start>=0&&end>start,'Executable Tiny Kingdom script exists');
new vm.Script(src.slice(start+8,end),{filename:'tiny-kingdom-runtime.js'});
const expect=s=>assert(src.includes(s),'W128 missing integration: '+s);
for(const snippet of [
 'function workSkinDetailedPoint(',
 'function workSkinDetailedMatrices(',
 'foregroundResidentJointBuffer',
 'foregroundResidentJointData',
 'foregroundSkinDrawCalls',
 'workSkinSegments(rig,body,bind,point=workSkinPoint)',
 'function workSkinFramePalette(entry,p,slot,detail)',
 'const pose=citizenEmbodiedPose(p,i,rig);',
 'detail?workSkinSegments(rig,pose,entry,workSkinDetailedPoint)',
 'workSkinCapture=labels;',
 'tagWorkSkinRange(j,from);',
 'tagWorkSkinRange(j+1,from);',
 'tagWorkSkinRange(j+2,from);',
 'tagWorkSkinRange(j+3,from);',
 'tagWorkSkinRange(j+4,from);',
 'tagWorkSkinRange(11,headMeshStart);',
 'tagWorkSkinRange(12,toolStart);',
 'getForegroundSkinAudit',
 'surfaceNormal.xz=vec2(co*surfaceNormal.x+si*surfaceNormal.z,',
 'tagWorkSkinRange(11,brimStart);',
 'tagWorkSkinRange(11,capStart);'
])expect(snippet);
const detailed=src.slice(src.indexOf('function villager(p)'),
 src.indexOf('function stoneBoulder('));
for(const snippet of ['tagWorkSkinRange(j,from);',
 'tagWorkSkinRange(j+1,from);','tagWorkSkinRange(j+2,from);',
 'tagWorkSkinRange(j+3,from);','tagWorkSkinRange(j+4,from);',
 'tagWorkSkinRange(11,headMeshStart);','tagWorkSkinRange(12,toolStart);'])
 assert(detailed.includes(snippet),'tag must belong to authentic villager: '+snippet);
const begin=src.indexOf('function workSkinDetailedPoint(');
const finish=src.indexOf('function workSkinSegments(',begin);
assert(begin>=0&&finish>begin,'Detailed bone vertex map must precede segment selection');
const ctx={};vm.runInNewContext(src.slice(begin,finish)+
 '\nthis.project=workSkinDetailedPoint;',ctx,{timeout:2000});
const actual=ctx.project;
const independent=(q,rig,body,bind)=>{
 const s=bind.scale,x=q[0]*s,z=q[2]*s;let y=q[1]*s,zz=z;
 if(rig.working){
  const rise=Math.max(0,Math.min(1.55*s,y-.44*s));
  if(rise>0){zz+=rise*rig.acting.lean;
   y-=rig.acting.crouch*Math.min(1,rise/(.65*s))}
 }
 const t=Math.max(0,Math.min(1,(y-.43*s)/(.77*s)));
 const sx=x+s*body.spineShift*t,sz=zz+s*body.forwardLean*t;
 y+=s*body.rise*t;
 return [bind.x+Math.cos(bind.angle)*sx+Math.sin(bind.angle)*sz,
  bind.ground+y,
  bind.z-Math.sin(bind.angle)*sx+Math.cos(bind.angle)*sz];
};
const bind={x:12.3,z:-7.5,ground:.41,scale:1.04,angle:1.6};
const bodies=[
 {spineShift:.035,forwardLean:.07,rise:.018},
 {spineShift:-.042,forwardLean:-.025,rise:-.011}
];
let samples=0;
for(const working of [true,false])
 for(const lean of [-.33,0,.34])
  for(const crouch of [0,.15,.34])
   for(const body of bodies)
    for(const q of [[0,.1,0],[.11,.43,-.04],[-.2,.72,.13],
      [.34,.9,-.12],[.08,1.2,.17],[0,1.65,0]]){
     const rig={working,acting:{lean,crouch}};
     const got=actual(q,rig,body,bind),want=independent(q,rig,body,bind);
     for(let i=0;i<3;i++)
      assert(Math.abs(got[i]-want[i])<1e-10,
       'Original full villager lean/crouch/heading/hip map mismatch '+JSON.stringify({q,got,want}));
     samples++;
    }
assert(src.includes('resetForegroundResidents();'),'GPU test toggle invalidates stale pose');
assert(src.includes('gl.disableVertexAttribArray(skinJointAttribute)'),
 'Bone attribute must be released after draw');
console.log('W128 SOURCE CONTRACT PASS: '+samples+
 ' real-detail original coordinate projections, full 13-joint routing, bounded resident GPU joint integration');
