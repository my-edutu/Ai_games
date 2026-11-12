'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function sourceFunction(name){
 const start=html.indexOf('function '+name+'(');
 if(start<0)throw Error('Original production function missing: '+name);
 const brace=html.indexOf('{',start);
 let depth=0,end=brace;
 for(;end<html.length;end++){
  if(html[end]==='{')depth++;
  if(html[end]==='}'&&!--depth){end++;break;}
 }
 if(depth!==0)throw Error('Malformed original woodland function');
 return html.slice(start,end);
}
test('W263 original woodland has organic deterministic canopy and constant 7-triangle fir layer',()=>{
 const shape=vm.runInNewContext('('+sourceFunction('woodlandCrownContour')+')');
 const contour=Array.from({length:12},(_,i)=>shape(7.3,Math.PI*.54,i*Math.PI/6));
 expect(contour.every(p=>p.radius>=.69&&p.radius<=1.32)).toBe(true);
 expect(new Set(contour.map(p=>p.radius.toFixed(4))).size).toBeGreaterThan(7);
 expect(shape(7.3,Math.PI*.54,1.2)).toEqual(shape(7.3,Math.PI*.54,1.2));
 expect(()=>shape(NaN,.4,1.5)).toThrow();
 let faces=[],context={tri:(a,b,c,col)=>faces.push({a,b,c,col})};
 const fir=vm.runInNewContext('('+sourceFunction('coniferTierCanopy')+')',context);
 fir(12,2,11,.48,1.1,[.36,.43,.31],.71);
 expect(faces).toHaveLength(7);
 expect(faces.every(f=>[...f.a,...f.b,...f.c,...f.col].every(Number.isFinite))).toBe(true);
 const radii=faces.map(f=>Math.hypot(f.a[0]-12,f.a[2]-11));
 expect(new Set(radii.map(v=>v.toFixed(4))).size).toBeGreaterThan(4);
 expect(html).toContain("silhouette:'w263-original-broken-crown-and-fir-tier'");
 expect(html).toContain('allTreesPreserved:true,additionalCanopyTriangles:0');
});
for(const viewport of [{width:1024,height:768},{width:390,height:844}]){
 test('W263 actual '+viewport.width+'px WebGL original forest, working town, and no discarded houses or workers',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:125000});
  const evidence=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const snapshot=JSON.stringify(g.exportSnapshot());
   const f=g.getForestVisualStats(),lod=g.getForestLodStats(),scene=g.renderStats();
   const gl=document.getElementById('world').getContext('webgl');
   return {f,lod,scene,unchanged:JSON.stringify(g.exportSnapshot())===snapshot,
    glError:gl?.getError()??-1,documentWidth:document.documentElement.scrollWidth};
  });
  expect(evidence.f.silhouette).toBe('w263-original-broken-crown-and-fir-tier');
  expect(evidence.f.allTreesPreserved).toBe(true);
  expect(evidence.f.additionalCanopyTriangles).toBe(0);
  expect(evidence.f.renderedTrees).toBeGreaterThan(0);
  expect(evidence.f.sourceTrees).toBeGreaterThan(0);
  expect(evidence.lod.renderedTrees).toBe(evidence.f.renderedTrees);
  expect(evidence.scene.lastFrameTriangles).toBeLessThan(160000);
  expect(evidence.glError).toBe(0);
  expect(evidence.unchanged).toBe(true);
  expect(evidence.documentWidth).toBeLessThanOrEqual(viewport.width);
  expect(errors).toEqual([]);
  const dir='artifacts/tiny-kingdom-w263';
  fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:dir+'/original-woodland-'+viewport.width+'.png',fullPage:false});
  fs.writeFileSync(dir+'/audit-'+viewport.width+'.json',JSON.stringify(evidence,null,2));
 });
}
