'use strict';
// W548: test actual extracted production dirty-tile helpers, with a seeded
// multi-frame moving-world oracle; replay and world-state code untouched.
const {test,expect}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
function extract(name){
 const marker='function '+name+'(',at=source.indexOf(marker);
 assert.ok(at>=0,'missing production helper '+name);
 let brace=source.indexOf('{',at),depth=0;
 for(let i=brace;i<source.length;i++){
  if(source[i]==='{')depth++;
  if(source[i]==='}'&&!--depth)return source.slice(at,i+1);
 }
 throw Error('incomplete '+name);
}
const mark=vm.runInNewContext('('+extract('softwareMarkDynamicTiles')+')');
const restore=vm.runInNewContext('('+extract('softwareRestoreDynamicTiles')+')');
const rectangles=vm.runInNewContext('('+extract('softwareDirtyTileRects')+')');
test('W548 original moving-depth tile restoration matches full static replay over 180 changing frames',()=>{
 const w=73,h=59,tile=16,columns=Math.ceil(w/tile),
  len=columns*Math.ceil(h/tile),n=w*h;
 const staticColors=new Uint32Array(n),staticDepth=new Float32Array(n);
 for(let i=0;i<n;i++){staticColors[i]=(i*2654435761)>>>0;staticDepth[i]=(i%37)/41;}
 let output=new Uint32Array(staticColors),depth=new Float32Array(staticDepth),
  before=new Uint8Array(len),seed=83127;
 const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
 let partialFrames=0;
 for(let frame=0;frame<180;frame++){
  restore(output,depth,staticColors,staticDepth,before,w,h,tile);
  const oracle=new Uint32Array(staticColors),
   oracleDepth=new Float32Array(staticDepth),
   current=new Uint8Array(len),count=1+Math.floor(rnd()*6);
  for(let i=0;i<count;i++){
   const x=Math.floor(rnd()*w),y=Math.floor(rnd()*h),
    x1=Math.min(w-1,x+Math.floor(rnd()*13)),
    y1=Math.min(h-1,y+Math.floor(rnd()*12)),
    color=(frame*1103515245+i*12345)>>>0,level=.99;
   mark(current,x,y,x1,y1,w,h,tile);
   for(let yy=y;yy<=y1;yy++)for(let xx=x;xx<=x1;xx++){
    const p=yy*w+xx;
    output[p]=color;depth[p]=level;
    oracle[p]=color;oracleDepth[p]=level;
   }
  }
  assert.deepEqual(output,oracle,'moving colour difference on frame '+frame);
  assert.deepEqual(depth,oracleDepth,'moving depth difference on frame '+frame);
  const merged=new Uint8Array(len);
  for(let id=0;id<len;id++)merged[id]=before[id]|current[id];
  const rects=rectangles(merged,w,h,tile,64);
  assert.ok(rects,'bounded dirty tile plan');
  for(let id=0;id<len;id++)if(merged[id]){
   const tx=id%columns,ty=Math.floor(id/columns),cx=tx*tile,cy=ty*tile;
   assert.ok(rects.some(r=>r.x0<=cx&&r.x1>=cx&&r.y0<=cy&&r.y1>=cy),
    'a genuine touched tile was not submitted');
  }
  if(rects.length)partialFrames++;
  before=current;
 }
 assert.ok(partialFrames>=160);
 assert.equal(rectangles(new Uint8Array(len),w,h,tile,64).length,0);
 const mask=new Uint8Array(len);
 mask[0]=1;mask[len-1]=1;
 assert.equal(rectangles(mask,w,h,tile,1),null);
});
test('W548 actual renderer retains exact full redraw and original actor depth on camera change',()=>{
 assert.match(source,/if\(dirtyEnabled\)\{/);
 assert.match(source,/softwareRestoreDynamicTiles\(/);
 assert.match(source,/rasterRange\(staticCount,count,true\)/);
 assert.match(source,/rasterRange\(0,staticCount\)/);
 assert.match(source,/ctx\.putImageData\(softwareImage,0,0,rect\.x0,rect\.y0,w,h\)/);
 assert.match(source,/if\(!depthDrawn\)\{/);
 assert.match(source,/softwareCanvasFrameReady=false/);
});
test.use({video:'on'});
test('W548 real 390px static world pixels equal with dirty tiles disabled/enabled',async({page},info)=>{
 test.setTimeout(200000);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(['webgl','experimental-webgl','webgl2'].includes(kind))return null;
   return original.call(this,kind,...args);
  };
 });
 await page.setContent(source);
 await page.waitForFunction(()=>window.__tinyKingdom?.getCanvasFallbackRasterAudit?.().draws>=2,
  null,{timeout:155000});
 await page.locator('#pause').click();
 const folder='artifacts/tiny-kingdom-w548';fs.mkdirSync(folder,{recursive:true});
 async function capture(disable,name){
  const start=await page.evaluate(disable=>{
   globalThis.__tinyKingdomDisableDynamicDirtyRegions=disable;
   const g=window.__tinyKingdom,count=g.getCanvasFallbackRasterAudit().draws;
   g.setCamera({yaw:.37,pitch:.71,zoom:28,focus:[0,0]});return count;
  },disable);
  await page.waitForFunction(n=>window.__tinyKingdom.getCanvasFallbackRasterAudit().draws>n,
   start,{timeout:35000});
  const data=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {png:document.querySelector('#world').toDataURL('image/png'),
    audit:g.getCanvasFallbackRasterAudit(),
    checksum:g.exportSnapshot().checksum,
    scroll:document.documentElement.scrollWidth};
  });
  const bytes=Buffer.from(data.png.split(',')[1],'base64');
  fs.writeFileSync(path.join(folder,name+'.png'),bytes);
  delete data.png;
  fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify({
   sourceSha:process.env.GITHUB_SHA||'local',
   workload:'real paused 390px scene + genuine camera invalidation',
   softwareOnly:true,physicalHardwareFps:'NOT MEASURED',
   ...data},null,2));
  await info.attach(name+'.png',{body:bytes,contentType:'image/png'});
  return {bytes,data};
 }
 const exhaustive=await capture(true,'full-screen-original');
 const dirty=await capture(false,'bounded-dirty-original');
 expect(dirty.bytes.equals(exhaustive.bytes)).toBe(true);
 expect(dirty.data.checksum).toBe(exhaustive.data.checksum);
 expect(dirty.data.scroll).toBeLessThanOrEqual(390);
 expect(dirty.data.audit.dynamicDirtyTiles).toBeDefined();
 expect(errors).toEqual([]);
 console.log('W548 exact real 390px paused pixels',JSON.stringify({
  sourceSha:process.env.GITHUB_SHA||'local',
  pixelIdentical:true,checksum:dirty.data.checksum,
  dirtyAudit:dirty.data.audit.dynamicDirtyTiles,
  movingFps:'NOT MEASURED',commercialExperience:'NOT PROVEN'}));
});
