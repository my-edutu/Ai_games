'use strict';
// W117 exact W116 pre-change generated geometry is the immutable reference.
// No staged world, no invented actor movement, no claims of real hardware FPS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function between(src,start,end){
 const a=src.indexOf(start),b=src.indexOf(end,a);
 assert(a>=0&&b>a,'Original game function exists: '+start);
 return src.slice(a,b);
}
const preW117="function tri(a,b,c,col){\n const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];\n const vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];\n const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1;\n const normalX=nx/len,normalY=ny/len,normalZ=nz/len;\n const r=col[0],g=col[1],blue=col[2],material=currentMaterial;\n data.push(a[0],a[1],a[2],normalX,normalY,normalZ,r,g,blue,material,\n  b[0],b[1],b[2],normalX,normalY,normalZ,r,g,blue,material,\n  c[0],c[1],c[2],normalX,normalY,normalZ,r,g,blue,material);\n}\n// G055: WebGL interpolates RGB per vertex across a shadow triangle, giving\n// a genuine gradient penumbra instead of the former flat green decal.\n// G075: penumbra gradients have independently coloured vertices. Preserve\n// the exact geometry/normal/RGB/material layout while batching all 30 floats\n// into one append instead of allocating three point/shade iterator pairs and\n// spreading a vertex on every animated shadow triangle.\nfunction triGradient(a,b,c,ca,cb,cc){\n let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];\n let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1;\n const normalX=nx/len,normalY=ny/len,normalZ=nz/len,material=currentMaterial;\n data.push(a[0],a[1],a[2],normalX,normalY,normalZ,ca[0],ca[1],ca[2],material,\n  b[0],b[1],b[2],normalX,normalY,normalZ,cb[0],cb[1],cb[2],material,\n  c[0],c[1],c[2],normalX,normalY,normalZ,cc[0],cc[1],cc[2],material);\n}\nfunction quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}\n// G076: reuse the eight immutable corners of a rectangular prism across all\n// six faces. The previous implementation allocated 24 separate point arrays\n// for the same eight positions per box, including in frequent animated meshes.\n// Face winding, normals (computed by tri) and 10-float vertex order are exact.\nfunction box(x,y,z,w,h,d,col){\n const xa=x-w/2,xb=x+w/2,za=z-d/2,zb=z+d/2,ya=y,yb=y+h;\n const p000=[xa,ya,za];\n const p010=[xa,yb,za];\n const p110=[xb,yb,za];\n const p100=[xb,ya,za];\n const p101=[xb,ya,zb];\n const p111=[xb,yb,zb];\n const p011=[xa,yb,zb];\n const p001=[xa,ya,zb];\n quad(p000,p010,p110,p100,col);\n quad(p101,p111,p011,p001,col);\n quad(p001,p011,p010,p000,col);\n quad(p100,p110,p111,p101,col);\n quad(p010,p011,p111,p110,col);\n quad(p001,p000,p100,p101,col);\n}\nfunction cylinder(x,y,z,r,h,col,sides=8){for(let i=0;i<sides;i++){let a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;let v=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],w=[x+Math.cos(b)*r,y,z+Math.sin(b)*r],vv=[v[0],y+h,v[2]],ww=[w[0],y+h,w[2]];quad(v,w,ww,vv,col);tri([x,y+h,z],vv,ww,col)}}\nfunction cone(x,y,z,r,h,col,sides=9){for(let i=0;i<sides;i++){let a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;tri([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x,y+h,z],col)}}\n\nfunction limbSegment(a,b,radius,col,sides=7){\n const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz);if(length<.00001)return;\n const d=[dx/length,dy/length,dz/length],ref=Math.abs(d[1])>.88?[1,0,0]:[0,1,0];\n let right=[d[1]*ref[2]-d[2]*ref[1],d[2]*ref[0]-d[0]*ref[2],d[0]*ref[1]-d[1]*ref[0]];\n const n=Math.hypot(...right);right=right.map(v=>v/n);\n const up=[d[1]*right[2]-d[2]*right[1],d[2]*right[0]-d[0]*right[2],d[0]*right[1]-d[1]*right[0]];\n const vertex=(origin,angle)=>origin.map((v,k)=>v+radius*(Math.cos(angle)*right[k]+Math.sin(angle)*up[k]));\n for(let i=0;i<sides;i++){const t=i*2*Math.PI/sides,u=(i+1)*2*Math.PI/sides;quad(vertex(a,t),vertex(a,u),vertex(b,u),vertex(b,t),col);}\n}\n\n";
const live=between(html,'function tri(a,b,c,col){','const SEASONS=')+'\n'+
 between(html,'function limbSegment(','// Low-poly but individually');
assert(live.includes('function packedFlatQuad('),'tested real packed primitive path');
assert(live.includes('function packedRing('),'bounded reused circle topology');
function create(source,vertices){
 return new Function('data','currentMaterial',source+';return {box,cylinder,cone,limbSegment,'+
  'rings:(typeof packedRingCache!=="undefined"?packedRingCache:null)};')(vertices,7);
}
const tests=[];
for(let n=0;n<56;n++){
 const t=n*.371,a=[Math.sin(t)*3,Math.cos(t)*.8,Math.sin(t*.4)*3],
 b=[a[0]+Math.sin(t*.3)*.6,a[1]+.25+Math.cos(t)*.12,a[2]+.2+Math.sin(t*.8)*.3],
 c=[.2+(n%5)*.13,.41+(n%4)*.08,.7-(n%3)*.14];
 const sides=[3,4,5,7,8,9,12,25][n%8];
 tests.push(['box',[a[0],a[1],a[2],n%17===0?0:.13+.2*(n%6),.3+(n%5)*.11,n%19===0?-.2:.22,c]]);
 tests.push(['cylinder',[a[0],a[1],a[2],.1+(n%5)*.09,.2+(n%6)*.1,c,sides]]);
 tests.push(['cone',[a[0],a[1],a[2],.1+(n%5)*.09,.2+(n%6)*.1,c,sides]]);
 tests.push(['limbSegment',[a,b,.05+(n%3)*.016,c,sides]]);
}
tests.push(['limbSegment',[[0,0,0],[0,0,0],.07,[.5,.6,.7],7]]);
let largest=0,totalVertices=0;
for(const [method,args] of tests){
 const expected=[],actual=[];
 create(preW117,expected)[method](...args);
 const renderer=create(live,actual);renderer[method](...args);
 assert.equal(actual.length,expected.length,method+' triangle count/vertex layout');
 assert.equal(actual.length%30,0,method+' complete triangles');
 for(let i=0;i<expected.length;i++){
  const a=actual[i],b=expected[i],delta=Math.abs(a-b);
  assert(Number.isFinite(a)&&Number.isFinite(b)&&delta<=1e-8,
   method+' must preserve real source vertex / normal / RGB / material at '+i+
   ' actual='+a+' reference='+b);
  largest=Math.max(largest,delta);
 }
 assert(renderer.rings?.size<=16,
  'ring topology cache remains bounded to 16 side variants');
 totalVertices+=actual.length/10;
}
console.log('W117 procedural actor primitive parity:',tests.length,
 'cases,',totalVertices,'vertices, max coordinate/normal delta',largest);
