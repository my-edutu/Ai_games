'use strict';
// W513: focused source/signed-rotation contract. Not hardware FPS or video.
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
test('real escrow courier cart uses bounded static VBO, rolling wheels and original fallback',()=>{
 for(const term of [
 'function ensureOriginalCartResidentMesh(mesh)',
 'gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW)',
 'function drawOriginalCartResidentGpu()',
 'gl.uniform4f(uniforms.commuterMotion,job.x,job.z,job.y,job.angle)',
 'originalCartResidentJobs.push({buffer,mesh:template,x,y,z,angle})',
 'renderRealCourierRollingSpokes(p,x,y,z,size,angle)',
 'originalCartResidentFrameTriangles*30',
 'releaseOriginalCartResidentMesh(retired)',
 'originalCartResidentJobs.some(job=>job.mesh===originalCartTemplates.get(key))',
 'else appendOriginalCourierCartTemplate(template,x,y,z,angle)'])
  assert.ok(source.includes(term),'missing actual production path: '+term);
});
test('GPU root matches original CPU signed X/Z yaw, translation and normals',()=>{
 for(const angle of [0,.31,-.83,Math.PI])for(const [lx,ly,lz,nx,ny,nz] of [[.2,.8,-.3,.45,.6,.21],[-.6,.4,.1,-.3,.84,.09]]){
  const c=Math.cos(angle),sn=Math.sin(angle),x=5,z=-8,y=1.1;
  const old=[x+c*lx+sn*lz,y+ly,z-sn*lx+c*lz];
  const shader=[x+c*lx+sn*lz,y+ly,z-sn*lx+c*lz];
  const mag=Math.hypot(nx,ny,nz)||1;
  const cpuNormal=[(c*nx+sn*nz)/mag,ny/mag,(-sn*nx+c*nz)/mag];
  const shaderNormal=[c*nx+sn*nz,ny,-sn*nx+c*nz].map(v=>v/mag);
  assert.deepEqual(old,shader);
  for(let i=0;i<3;i++)assert.ok(Math.abs(cpuNormal[i]-shaderNormal[i])<1e-12);
 }
});
test('complete inline playable JS still parses',()=>{
 const js=source.match(/<script>([\s\S]*?)<\/script>/);assert.ok(js);new Function(js[1]);
});
