'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=game.indexOf('<script>'),b=game.indexOf('</script>',a);
assert.ok(a>0&&b>a,'live game script exists');
new Function(game.slice(a+8,b));
const start=game.indexOf('function renderLivedBurgageSideMateriality(');
const stop=game.indexOf('// G108:',start);
assert.ok(start>0&&stop>start,'original occupied wall source exists');
const source=game.slice(start,stop);
assert.ok(source.includes('W107: Convert the original inhabited side walls'));
assert.ok(!source.includes('for(let sprig=0;sprig<3;sprig++'));
for(let style=0;style<4;style++){
 const verts=[];const faces=[];let material=0;
 const MAT={STONE:5,WOOD:6,PLASTER:8,FOLIAGE:4};
 const stats={burgageMaterialHomes:0,burgageMaterialWallPairs:0,
  burgageMaterialGardenBoxes:0,burgageMaterialDownspouts:0,
  burgageMaterialTriangles:0};
 const box=()=>{for(let i=0;i<360;i++)verts.push(0)};
 const quad=(a,b,c,d)=>{for(let i=0;i<60;i++)verts.push(0);
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
  const v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
  const nx=u[1]*v[2]-u[2]*v[1],
   ny=u[2]*v[0]-u[0]*v[2],
   nz=u[0]*v[1]-u[1]*v[0];
  faces.push({side:Math.sign(a[0]+12),nx,ny,nz,material});
 };
 const draw=new Function('data','terrain','rgb','materialScope','MATERIAL',
  'box','quad','villageVisualLod','compactHouseArchetype',
  source+String.fromCharCode(10)+'return renderLivedBurgageSideMateriality')(
   verts,()=>.30,v=>[v,v,v],(m,callback)=>{const prior=material;material=m;
    callback();material=prior},MAT,box,quad,stats,()=>style);
 draw(-12,8,2,6,true);
 assert.equal(verts.length%30,0);
 assert.equal(stats.burgageMaterialHomes,1);
 assert.equal(stats.burgageMaterialWallPairs,2);
 assert.equal(stats.burgageMaterialGardenBoxes,4,'original four planted casement boxes');
 assert.equal(stats.burgageMaterialDownspouts,2,'original two rain spouts');
 assert.equal(stats.burgageMaterialTriangles,68,'W261 actual visible open-trough sidewall contract');
 assert.equal(verts.length/30,68);
 assert.equal(176-verts.length/30,108,'108 physically hidden triangles saved, not a visual milestone');
 assert.equal(faces.filter(f=>f.material===MAT.PLASTER).length,4);
 assert.equal(faces.filter(f=>f.material===MAT.WOOD).length,26);
 // The real open planter cheeks face along +/-Z, and open lips face +Y.
 // They cannot have a nonzero outward X normal like wall-facing plaster.
 // Reject degenerate triangles and genuinely inward X-facing façades while
 // accepting the physical 3D trough instead of accidentally testing a box.
 for(const f of faces){
  assert.ok(f.side!==0&&
   f.nx*f.nx+f.ny*f.ny+f.nz*f.nz>1e-12,
   'original wall, planter cheek or lip must be nondegenerate');
  if(Math.abs(f.nx)>1e-8)
   assert.ok(f.nx*f.side>1e-8,'wall-facing panels must face outward');
  else assert.ok(Math.abs(f.ny)+Math.abs(f.nz)>1e-8,
   'original 3D cheek or open lip must retain a valid normal');
 }
}
console.log('W107: V8 full game parse and 4 authentic house-side styles PASS; no browser/FPS/Day120 claim');
