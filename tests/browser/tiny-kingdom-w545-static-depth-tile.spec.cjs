'use strict';
const {test}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function extract(name){
 const anchor='function '+name+'(';
 const p=source.indexOf(anchor);
 assert.ok(p>=0,'production implementation missing: '+name);
 const start=source.indexOf('{',p+anchor.length);
 let level=0;
 for(let i=start;i<source.length;i++){
  if(source[i]==='{')level++;
  else if(source[i]==='}'&&!--level)return source.slice(p,i+1);
 }
 throw Error('unclosed production function: '+name);
}
const build=vm.runInNewContext('('+extract('measureSoftwareStaticDepthTiles')+')');
const hidden=vm.runInNewContext('('+extract('softwareRectangleHiddenByStaticDepth')+')');
function brute(depth,width,{x0,x1,y0,y1},limit){
 for(let y=y0;y<=y1;y++)
  for(let x=x0;x<=x1;x++)if(depth[y*width+x]<limit)return false;
 return true;
}
test('original static-depth tile rejection never hides a possibly visible original live triangle',()=>{
 const width=51,height=35,depth=new Float32Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)
  depth[y*width+x]=(((x*17+y*43)%31)+1)/46;
 const tiles=build(depth,width,height,16);
 assert.equal(tiles.minDepth.length,12);
 let skipped=0,eligible=0;
 for(let x0=0;x0<width;x0+=4)for(let y0=0;y0<height;y0+=3)
  for(const threshold of [.001,.02,.22,.65,.99]){
   const box={x0,y0,x1:Math.min(width-1,x0+9),y1:Math.min(height-1,y0+8)};
   const conservative=hidden(box,threshold,tiles);
   if(conservative)skipped++;
   if(brute(depth,width,box,threshold+1e-7))eligible++;
   assert.equal(conservative&&!brute(depth,width,box,threshold),false,
    'tile rejection invented a hidden actor');
  }
 assert.ok(skipped>0,'test must observe real safe depth rejections');
 assert.ok(eligible>=skipped);
});
test('static-depth rejection respects uncovered edges, invalid coordinates, and changing depth',()=>{
 const width=32,height=32,depth=new Float32Array(1024).fill(.3);
 let tiles=build(depth,width,height,16);
 assert.equal(hidden({x0:1,y0:1,x1:14,y1:14},.2,tiles),true);
 assert.equal(hidden({x0:1,y0:1,x1:14,y1:14},.31,tiles),false);
 depth[5*width+5]=0;
 tiles=build(depth,width,height,16);
 assert.equal(hidden({x0:6,y0:6,x1:8,y1:8},.2,tiles),false,
  'a partially unfilled physical tile must never hide an actor');
 assert.equal(hidden({x0:16,y0:16,x1:31,y1:31},.2,tiles),true);
 for(const box of [{x0:-1,y0:0,x1:3,y1:3},{x0:0,y0:0,x1:32,y1:3},
  {x0:7,y0:7,x1:6,y1:9},{x0:0,y0:0,x1:3.5,y1:4}]){
  assert.equal(hidden(box,.1,tiles),false);
 }
 assert.equal(hidden({x0:1,y0:1,x1:2,y1:2},NaN,tiles),false);
 assert.equal(hidden({x0:1,y0:1,x1:2,y1:2},.1,null),false);
});
test('production software painter uses depth tiles ONLY after genuine static scene and keeps full fallback',()=>{
 assert.match(source,/const softwareTileDepth=.*?;|let softwareStaticTileMap=null/s);
 assert.match(source,/softwareRectangleHiddenByStaticDepth\(\{x0,x1,y0,y1\},\s*Math\.max\(da,db,dc\),softwareStaticTileMap\)/);
 assert.match(source,/rasterRange\(staticCount,count,true\)/);
 assert.match(source,/rasterRange\(0,staticCount\)/);
 assert.match(source,/globalThis\.__tinyKingdomLegacyCanvasPainter/);
});
