'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('function ellipsoid(x,y,z,rx,ry,rz,col,segments=9){');
const last=html.indexOf('// Gauntlet 040:',first);
const productionEllipsoid=first<0||last<0?'':html.slice(first,last).trim();

// G073 RED/GREEN: costly moving-citizen ellipsoids must emit the exact same
// 10-float GPU vertex layout, normals and material without allocating a
// three-point iterator or submitting three separate JS-array push calls.
test('G073 moving-citizen ellipsoid uses one triangle batch and preserves exact legacy vertices',()=>{
 expect(productionEllipsoid).toContain('function ellipsoid(x,y,z,rx,ry,rz,col,segments=9)');
 expect(productionEllipsoid).not.toMatch(/for\s*\(\s*const\s+point\s+of\s*\[a,b,c\]/);
 expect((productionEllipsoid.match(/data\.push\(/g)||[]).length).toBe(1);
 const emitted=[],legacy=[];
 const fast=vm.runInNewContext('('+productionEllipsoid+')',{data:emitted,currentMaterial:4});
 const old=(x,y,z,rx,ry,rz,col,segments=9)=>{
  if(!(rx>0&&ry>0&&rz>0)||!Number.isInteger(segments)||segments<3)return;
  const vertex=(latitude,azimuth)=>{
   const st=latitude===0||latitude===Math.PI?0:Math.sin(latitude);
   const ct=Math.cos(latitude),ca=Math.cos(azimuth),sa=Math.sin(azimuth);
   const normal=[st*ca/rx,ct/ry,st*sa/rz],size=Math.hypot(...normal)||1;
   return {p:[x+st*ca*rx,y+ct*ry,z+st*sa*rz],n:normal.map(v=>v/size)};
  };
  const emit=(a,b,c)=>{
   for(const point of [a,b,c])legacy.push(...point.p,...point.n,...col,4);
  };
  for(let ring=0;ring<5;ring++){
   const lat0=Math.PI*ring/5,lat1=Math.PI*(ring+1)/5;
   for(let slice=0;slice<segments;slice++){
    const az0=slice*Math.PI*2/segments,az1=(slice+1)*Math.PI*2/segments;
    const a=vertex(lat0,az0),b=vertex(lat0,az1);
    const c=vertex(lat1,az0),d=vertex(lat1,az1);
    if(ring===0)emit(a,d,c);
    else if(ring===4)emit(a,b,c);
    else {emit(a,b,d);emit(a,d,c)}
   }
  }
 };
 for(const segments of [3,4,6,9,12]){
  for(let n=0;n<8;n++){
   const x=n*.17-2,y=n*.41+1,z=n*.037-5;
   const rx=.1+n*.04,ry=.12+n*.09,rz=.06+n*.07;
   const col=[n/11,(n+2)/13,(n+1)/17];
   old(x,y,z,rx,ry,rz,col,segments);
   fast(x,y,z,rx,ry,rz,col,segments);
  }
 }
 for(const invalid of [[0,.2,.3],[-1,.2,.3],[.2,0,.3]]){
  old(0,0,0,...invalid,[1,1,1]);
  fast(0,0,0,...invalid,[1,1,1]);
 }
 expect(emitted.length).toBeGreaterThan(25000);
 expect(emitted).toStrictEqual(legacy);
});

test('G073 real WebGL ellipsoid scene keeps bounded valid geometry and replay authority',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const result=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  const audit=g.getGeometryAudit(),before=JSON.stringify(g.exportSnapshot());
  const stats=g.renderStats();
  g.restoreSnapshot(g.exportSnapshot());
  return {audit,stats,replayIdentical:JSON.stringify(g.exportSnapshot())===before,
   glError:document.getElementById('world').getContext('webgl')?.getError()||0};
 });
 expect(result.replayIdentical).toBe(true);
 expect(result.audit.totalTriangles).toBeGreaterThan(140000);
 expect(result.audit.totalTriangles).toBeLessThan(160000);
 for(const kind of ['static','dynamic']){
  expect(result.audit[kind].aligned).toBe(true);
  for(const key of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(result.audit[kind][key]).toBe(0);
 }
 expect(result.glError).toBe(0);
 expect(errors).toEqual([]);
});
