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
  const nx=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);
  faces.push({side:Math.sign(a[0]+12),nx,material});
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
 for(const f of faces)assert.ok(f.side!==0&&f.nx*f.side>1e-8,
  'all original limewash and genuine oak panels outward and nondegenerate');
}
console.log('W107: V8 full game parse and 4 authentic house-side styles PASS; no browser/FPS/Day120 claim');
