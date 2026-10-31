'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'artifacts/g38');
fs.mkdirSync(out,{recursive:true});
const base=execFileSync('git',['show','c111ac9e9c57cfec449c46b0b07e714d7a1ffcaf:public/tiny-kingdom/index.html'],{cwd:root,encoding:'utf8'});
const candidate=fs.readFileSync(path.join(root,'public/tiny-kingdom/index.html'),'utf8');
function hash(source){return crypto.createHash('sha256').update(source).digest('hex')}
if(hash(base)!=='42e1dc44ab68c1fafefc31365aca0d1c563b5a4bde52a4df75595063978324d9')throw Error('Pinned baseline source changed');
if(hash(candidate)!=='1a32bee1f33be8cb5cfd8a848ef9e3bcfea7b1fdc7b2af00d71ed02e7579f3fb')throw Error('Candidate source does not match locally verified patch');
function instrument(source){
 const anchor='requestAnimationFrame(render);window.__tinyKingdom=';
 if(!source.includes(anchor))throw Error('Game source hook missing');
 return source.replace(anchor,'window.__tkChecksum=checksum;'+anchor).replace('<script>','<script>window.requestAnimationFrame=cb=>{window.__pendingFrame=cb;return 1};window.__drawFrame=t=>window.__pendingFrame?.(t);');
}
async function inspect(browser,label,source){
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.setContent(instrument(source));await page.waitForFunction(()=>Boolean(window.__tinyKingdom));
  await page.evaluate(()=>{const g=window.__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=12;s.checksum=window.__tkChecksum(s.payload);g.restoreSnapshot(s);g.setSpeed(0);g.setGraphicsPreset('hd');g.setHudMode('cinema');g.setCamera({focus:[0,5],zoom:17,pitch:.7,yaw:.1});window.__drawFrame(1000);});
  const renderer=await page.evaluate(()=>window.__tinyKingdom.renderQuality().tier);
  if(renderer==='canvas2d')throw Error('Real WebGL capture required');
  await page.screenshot({path:path.join(out,'g38-'+label+'-market.png')});
  await page.evaluate(()=>{window.__tinyKingdom.setHudMode('full');window.__tinyKingdom.setGraphicsPreset('balanced');});
  const samples=[];
  for(let i=0;i<11;i++){
   const start=process.hrtime.bigint();
   const result=await page.evaluate(n=>{const g=window.__tinyKingdom;g.step(1/30);window.__drawFrame(1000+n*120);document.querySelector('#world').getContext('webgl').finish();return {lighting:g.getLightingStats(),geometry:g.getGeometryAudit().static.triangles,road:g.getRoadStats?.()||null};},i);
   const ms=Number(process.hrtime.bigint()-start)/1e6;
   if(i>0)samples.push(ms);
   if(i===10&&result.lighting.error)throw Error('WebGL error '+result.lighting.error);
   if(i===10&&label==='after'&&(!result.road||result.road.cobblestones<100))throw Error('Candidate road detail missing');
  }
  const sorted=samples.slice().sort((a,b)=>a-b),last=await page.evaluate(()=>({lighting:window.__tinyKingdom.getLightingStats(),road:window.__tinyKingdom.getRoadStats?.()}));
  return {sha256:hash(source),p50ms:Number(sorted[Math.floor(sorted.length/2)].toFixed(1)),p95ms:Number(sorted[Math.ceil(sorted.length*.95)-1].toFixed(1)),meanMs:Number((samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(1)),shadowPasses:last.lighting.passes,mapSize:last.lighting.mapSize,road:last.road,renderer,pageErrors:errors,n:samples.length};
 }finally{await page.close()}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const baseline=await inspect(browser,'before',base),after=await inspect(browser,'after',candidate);
  if(baseline.pageErrors.length||after.pageErrors.length)throw Error('Page exceptions in compared captures');
  const record={capturedAt:new Date().toISOString(),baseline,candidate:after,reference:'Pioneers of Pagonia — benchmark NOT PASSED',environment:'GitHub Actions Chromium ANGLE/SwiftShader, 1280x720 Balanced, 10 manual 30Hz world ticks per source; wall clock includes browser overhead; not real hardware performance',independentCritic:false,productionReady:false};
  fs.writeFileSync(path.join(out,'g38-evidence.json'),JSON.stringify(record,null,2));
  console.log(JSON.stringify(record,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
