'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const from=html.indexOf('function box(x,y,z,w,h,d,col){');
const to=html.indexOf('function cylinder(',from);
const boxSource=from<0||to<0?'':html.slice(from,to).trim();
const referenceBox=`function box(x,y,z,w,h,d,col){
let xa=x-w/2,xb=x+w/2,za=z-d/2,zb=z+d/2,ya=y,yb=y+h;
quad([xa,ya,za],[xa,yb,za],[xb,yb,za],[xb,ya,za],col);
quad([xb,ya,zb],[xb,yb,zb],[xa,yb,zb],[xa,ya,zb],col);
quad([xa,ya,zb],[xa,yb,zb],[xa,yb,za],[xa,ya,za],col);
quad([xb,ya,za],[xb,yb,za],[xb,yb,zb],[xb,ya,zb],col);
quad([xa,yb,za],[xa,yb,zb],[xb,yb,zb],[xb,yb,za],col);
quad([xa,ya,zb],[xa,ya,za],[xb,ya,za],[xb,ya,zb],col);
}`;

test('G076 box faces share eight canonical corners and preserve every legacy vertex',()=>{
 expect(from).toBeGreaterThan(0);expect(to).toBeGreaterThan(from);
 // A cube has eight spatial corners, not 24 per-face temporary arrays.
 for(const corner of ['p000','p010','p110','p100','p001','p011','p111','p101'])
  expect(boxSource).toMatch(new RegExp('\\bconst '+corner+'=\\['));
 expect((boxSource.match(/quad\(/g)||[]).length).toBe(6);
 expect(boxSource).not.toContain('quad([');
 const a=[],b=[];
 const quad=(out)=>function(p,q,r,s,color){
  for(const [u,v,w] of [[p,q,r],[p,r,s]]){
   const ux=v[0]-u[0],uy=v[1]-u[1],uz=v[2]-u[2],vx=w[0]-u[0],vy=w[1]-u[1],vz=w[2]-u[2];
   const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1;
   for(const pt of [u,v,w])out.push(...pt,nx/len,ny/len,nz/len,...color,7);
  }
 };
 const candidate=vm.runInNewContext('('+boxSource+')',{quad:quad(a)});
 const legacy=vm.runInNewContext('('+referenceBox+')',{quad:quad(b)});
 const cases=[[0,0,0,1,2,3],[1,-2,3,0,0,0],[-4,2,5,1,.01,0],[-2,-1,6,-1,2,3]];
 for(let i=0;i<500;i++){const t=i*.013;cases.push([t,-t*.7,t*.2,1+t%5,.2+t%3,2+t%4]);}
 for(const coords of cases){const color=[.17,.43,.89];candidate(...coords,color);legacy(...coords,color);}
 expect(a.length).toBe(cases.length*360);
 expect(a).toStrictEqual(b);
});

test('G076 retained 3D world has valid bounded WebGL geometry and immutable authority',async({page})=>{
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>100000);
 await page.locator('#pause').click();
 const actual=await page.evaluate(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot());
  const geometry=g.getGeometryAudit(),gl=document.getElementById('world').getContext('webgl');
  return {geometry,authority:JSON.stringify(g.exportSnapshot())===before,glError:gl?.getError()||0};
 });
 expect(actual.authority).toBe(true);
 expect(actual.geometry.totalTriangles).toBeLessThan(160000);
 for(const key of ['static','dynamic']){
  expect(actual.geometry[key].aligned).toBe(true);
  for(const field of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
   expect(actual.geometry[key][field]).toBe(0);
 }
 expect(actual.glError).toBe(0);expect(pageErrors).toEqual([]);
});
