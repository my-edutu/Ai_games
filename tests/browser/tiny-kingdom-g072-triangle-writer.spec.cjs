'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('function tri(a,b,c,col){');
const last=html.indexOf('// G055: WebGL interpolates RGB',first);
const productionTriangle=first<0||last<0?'':html.slice(first,last).trim();

// G072: the common triangle writer is called thousands of times while drawing
// moving citizens, cast shadows and ambient effects. Lock exact legacy
// position/normal/RGB/material order while rejecting per-triangle iterator
// allocation and three separate JS-array pushes.
test('G072 triangle writer preserves all 30 floats without per-triangle vertex iterator allocation',()=>{
 expect(productionTriangle).toContain('function tri(a,b,c,col)');
 expect(productionTriangle).not.toMatch(/for\s*\(\s*const\s+v\s+of\s*\[a,b,c\]/);
 expect(productionTriangle).toContain('data.push(a[0],a[1],a[2]');
 expect((productionTriangle.match(/data\.push\(/g)||[]).length).toBe(1);
 const fast=[],reference=[];
 const write=vm.runInNewContext('('+productionTriangle+')',{data:fast,currentMaterial:7});
 const old=(a,b,c,col)=>{
  let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];
  let vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1;
  for(const v of [a,b,c])reference.push(...v,nx/len,ny/len,nz/len,...col,7);
 };
 const cases=[
  [[0,0,0],[1,0,0],[0,0,1],[.2,.4,.8]],
  [[-2.3,1.7,4.2],[.1,2.6,-3.3],[7.4,-.7,2.9],[.6,.5,.4]],
  [[0,0,0],[0,0,0],[0,0,0],[1,1,1]],
  [[-2,-3,-4],[-1,-2,-3],[2,3,4],[0,.125,1]]
 ];
 for(let i=0;i<900;i++){
  const k=i*.037;
  cases.push([[k,k/7,-k/9],[k+.5,k+.12,k-.6],[k-.4,k+.93,k+.5],[(i%31)/31,(i%19)/19,(i%11)/11]]);
 }
 for(const [a,b,c,col] of cases){old(a,b,c,col);write(a,b,c,col);}
 expect(fast.length).toBe(cases.length*30);
 expect(fast).toStrictEqual(reference);
});

test('G072 live WebGL geometry and replay remain valid after fast triangle writing',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const game=window.__tinyKingdom;
  const audit=game.getGeometryAudit(),stats=game.renderStats();
  const snapshot=game.exportSnapshot();
  const before=JSON.stringify(snapshot);
  game.restoreSnapshot(snapshot);
  return {audit,stats,
   authorityIdentical:before===JSON.stringify(game.exportSnapshot()),
   glError:document.getElementById('world').getContext('webgl')?.getError()||0};
 });
 expect(result.authorityIdentical).toBe(true);
 expect(result.audit.totalTriangles).toBeLessThan(160000);
 expect(result.audit.totalTriangles).toBeGreaterThan(145000);
 for(const part of ['static','dynamic']){
  expect(result.audit[part].aligned).toBe(true);
  for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(result.audit[part][key]).toBe(0);
 }
 expect(result.glError).toBe(0);
 expect(errors).toEqual([]);
});
