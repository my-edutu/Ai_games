'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
test('authentic detailed and compact cloth normals are continuous across shared rig rings',()=>{
 const begin=html.indexOf('function continuousWorkcoatNormals(');
 const end=html.indexOf('function tailoredGarment(',begin);
 assert(begin>0&&end>begin,'smooth original medieval cloth normal helper must exist');
 const factory=new Function(html.slice(begin,end)+';return {continuousWorkcoatNormals};');
 const {continuousWorkcoatNormals}=factory();
 const segments=8,points=Array.from({length:5},(_,row)=>
  Array.from({length:segments+1},(_,col)=>{
   const a=col%segments*Math.PI*2/segments;
   const rx=.36-row*.035,rz=.29-row*.027;
   return [rx*Math.sin(a),row*.23,rz*Math.cos(a)];
  }));
 const normals=continuousWorkcoatNormals(points,segments);
 assert.equal(normals.length,5);
 for(let row=0;row<5;row++){
  assert.equal(normals[row].length,segments+1);
  for(let col=0;col<=segments;col++){
   const n=normals[row][col],p=points[row][col];
   assert(n.every(Number.isFinite),'every actual material normal must be finite');
   assert(Math.abs(Math.hypot(...n)-1)<1e-6,'unit-length 3D lighting normals');
   assert(n[0]*p[0]+n[2]*p[2]>.12,'normal must point away from the citizen body');
   if(col===segments)assert.deepEqual(n,normals[row][0],'seam must have no lighting break');
  }
 }
 assert(html.includes('quadContinuousWorkcoat('),'both real actor renderers must use the normal field');
 const tailored=html.slice(html.indexOf('function tailoredGarment('),html.indexOf('function taperedMedievalLimb('));
 const compact=html.slice(html.indexOf('function renderRealVillageWorkwear('),html.indexOf('function getVillageClothAudit('));
 assert(tailored.includes('continuousWorkcoatNormals(shell,n)')&&tailored.includes('quadContinuousWorkcoat('),'detailed role clothes must use smooth joints');
 assert(compact.includes('continuousWorkcoatNormals(shell,8)')&&compact.includes('quadContinuousWorkcoat('),'compact workers must use the same continuous shading');
 assert(html.includes('renderRealVillageWorkwear(p,index,x,y,z,size,rig,cloth,true)')===false||
  html.includes('renderRealVillageWorkwear(p,i,x,y,z,s,rig,cloth,true)'));
 assert(!tailored.includes('Math.random(')&&!compact.includes('Math.random('),'no simulation randomness in cloth rendering');
});
