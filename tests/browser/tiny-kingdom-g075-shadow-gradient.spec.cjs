'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('function triGradient(a,b,c,ca,cb,cc){');
const last=html.indexOf('function quad(a,b,c,d,col)',first);
const production=first<0||last<0?'':html.slice(first,last).trim();

// G075: each real-time directional penumbra is built from thousands of
// per-vertex RGB triangles. Prove that a batched writer preserves every
// positional, normal, color and material float from the legacy implementation.
test('G075 gradient shadow writer batches one exactly equivalent 30-float triangle',()=>{
 expect(production).toContain('function triGradient(a,b,c,ca,cb,cc)');
 expect(production).not.toMatch(/for\s*\(\s*const\s*\[point,shade\]\s*of\s*\[\[a,ca\]/);
 expect((production.match(/data\.push\(/g)||[]).length).toBe(1);
 expect(production).not.toContain('...point');
 expect(production).not.toContain('...shade');
 const emitted=[],legacy=[];
 const batched=vm.runInNewContext('('+production+')',{data:emitted,currentMaterial:1});
 const old=(a,b,c,ca,cb,cc)=>{
  let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1;
  for(const [point,shade] of [[a,ca],[b,cb],[c,cc]])
   legacy.push(...point,nx/len,ny/len,nz/len,...shade,1);
 };
 const cases=[
  [[0,0,0],[1,0,0],[0,0,1],[0.12,.22,.32],[.34,.44,.54],[.67,.77,.87]],
  [[-4,.21,3],[-2,.22,1],[1,.26,5],[.01,.9,.6],[.6,.2,.4],[.5,.8,.2]],
  [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[1,1,1],[.5,.5,.5]],
  [[-3,-2,-1],[.9,.3,-4],[-6,.37,2],[1,0,1],[0,1,0],[1,1,0]]
 ];
 for(let i=0;i<1200;i++){
  const q=i*.023;
  cases.push([[q,.3*q,-q],[q+.67,q*.04,q-.25],[q-.38,q+.91,q+.16],
   [(i%31)/31,(i%13)/13,(i%37)/37],[(i%29)/29,(i%41)/41,(i%23)/23],
   [(i%19)/19,(i%11)/11,(i%17)/17]]);
 }
 for(const args of cases){old(...args);batched(...args);}
 expect(emitted.length).toBe(cases.length*30);
 expect(emitted).toStrictEqual(legacy);
});

test('G075 actual SwiftShader shadows and snapshots stay valid on the original WebGL scene',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const r=await page.evaluate(()=>{
  const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
  const before=JSON.stringify(g.exportSnapshot()),audit=g.getGeometryAudit();
  g.restoreSnapshot(g.exportSnapshot());
  return {audit,identical:JSON.stringify(g.exportSnapshot())===before,glError:gl?.getError()||0};
 });
 expect(r.identical).toBe(true);
 expect(r.audit.totalTriangles).toBeGreaterThan(140000);
 expect(r.audit.totalTriangles).toBeLessThan(160000);
 for(const kind of ['static','dynamic']){
  expect(r.audit[kind].aligned).toBe(true);
  for(const field of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(r.audit[kind][field]).toBe(0);
 }
 expect(r.glError).toBe(0);
 expect(errors).toEqual([]);
});
