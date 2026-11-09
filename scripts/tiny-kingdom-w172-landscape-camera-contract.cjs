'use strict';
// W172 Phase 1 real production source contracts; NOT an FPS or screenshot pass.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline,'full original playable JavaScript present');
new Function(inline);
assert.match(html,/packLinearResidentScenery\(landscapeMeshCache,'landscape'\)\|\|\s*packSpatialScenery\(landscapeMeshCache\)/,
 'actual landscape resident builds attempt linear retained upload then proven fallback');
const a=html.indexOf('const SCENIC_LINEAR_LOCAL_MAX_TRIANGLES='),b=html.indexOf('function sceneFrustumPlanes(m){',a);
assert.ok(a>=0&&b>a,'real retained geometry packer');
const pack=new Function(html.slice(a,b)+'return {packLinearResidentScenery,getScenicLinearPackAudit};')();
// Physically local terrain and nearby trees, plus a separated woodland tract.
const mesh=new Float32Array(7800*30);
for(let i=0;i<7800;i++){
 const forest=i>=3900,cell=i%60,x=(forest?47:0)+Math.floor(cell/6)*.11,
  z=(forest?52:0)+(cell%6)*.13;
 for(let k=0;k<3;k++){
  const o=i*30+k*10;mesh[o]=x+k*.03;mesh[o+1]=(forest?1.3:0)+k*.02;
  mesh[o+2]=z+k*.03;
  mesh[o+3]=0;mesh[o+4]=1;mesh[o+5]=0;
  mesh[o+6]=.44;mesh[o+7]=.37;mesh[o+8]=.26;mesh[o+9]=forest?7:1;
 }
}
const selected=pack.packLinearResidentScenery(mesh,'landscape');
assert.ok(selected,'locally grouped original landscape accepted');
assert.equal(selected.vertices,mesh,'NO duplicate million-float scatter/upload staging array');
let n=0;
for(const range of selected.ranges){
 assert.equal(range.first,n,'no missing or duplicated triangles');
 assert.ok(range.count<=768*3,'bounded per-range submission');
 n+=range.count;
 for(let v=range.first;v<n;v++){
  const o=v*10;
  assert.ok(mesh[o]>=range.minX&&mesh[o]<=range.maxX,'original x fully enclosed');
  assert.ok(mesh[o+1]>=range.minY&&mesh[o+1]<=range.maxY,'original y fully enclosed');
  assert.ok(mesh[o+2]>=range.minZ&&mesh[o+2]<=range.maxZ,'original z fully enclosed');
 }
}
assert.equal(n,mesh.length/10,'every genuine triangle accounted for');
const broken=new Float32Array(50000*30);
for(let i=0;i<50000;i++)for(let k=0;k<3;k++){
 const o=i*30+k*10;broken[o]=i*60+k*.01;broken[o+1]=1;
 broken[o+2]=i*60+k*.01;broken[o+4]=1;broken[o+9]=1;
}
assert.equal(pack.packLinearResidentScenery(broken,'fragmented-landscape'),null,
 'scattered geometry must trigger exact original spatial-packer fallback');
const audit=pack.getScenicLinearPackAudit();
assert.equal(audit.classes.landscape,1);
assert.equal(audit.neverDropsSourceVertices,true);
assert.ok(audit.fallbacks>=1);
assert.match(html,/portraitLens\?\[3\.15,3\.45,3\.8,4\.2,4\.8,5\.6\]/,
 'authentic 390px farmer survey contains human-scale nearer real positions');
console.log('W172 source PASS: original landscape direct GPU Float32 resident, complete 7,800-triangle AABBs, bounded fragmented fallback, nearer physical mobile farmer lens; runtime FPS, visual change, and 390px contact remain NOT PROVEN.');
