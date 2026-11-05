'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {chromium}=require('@playwright/test');
async function main(){
 const output=path.resolve(process.argv.find(x=>x.startsWith('--output='))?.slice(9)||'public/ai-city-traffic/progress/captures');
 const label=process.argv.find(x=>x.startsWith('--label='))?.slice(8)||'review';
 const jpeg=process.argv.includes('--jpeg');
 if(!/^[a-z0-9-]+$/.test(label))throw new Error('Capture label must contain only lowercase letters, digits and hyphens');
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.CITY_BROWSER_PATH?{executablePath:process.env.CITY_BROWSER_PATH}:{})});
 const sourceFiles=['public/ai-city-traffic/index.html','public/ai-city-traffic/styles.css','public/ai-city-traffic/main.mjs','public/ai-city-traffic/world.mjs','public/ai-city-traffic/world-assets.mjs','public/ai-city-traffic/audio.mjs','dist/city-traffic-browser/simulation.js','dist/city-traffic-browser/traffic-network.js'];
 const hashes=()=>Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
 const results={capturedAt:new Date().toISOString(),label,errors:[],scenes:[],sourcesBefore:hashes(),method:'Actual browser output. Reduced-motion preference. Paused via the public operator command. Desktop 1920×1080; mobile 390×844. Internal pixel ratio is recorded per view.'};
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
  page.on('pageerror',error=>{results.errors.push(error.message);console.error('Page error:',error.message);});
  page.on('console',message=>{if(message.type()==='error'){results.errors.push(message.text());console.error('Console error:',message.text());}});
  await page.goto(process.env.CITY_CAPTURE_URL||'http://127.0.0.1:4311/traffic/',{waitUntil:'networkidle'});
  await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
  console.log('First render:',JSON.stringify(await page.evaluate(()=>window.cityTraffic.getDiagnostics())));
  await page.evaluate(()=>window.cityTraffic.command({type:'set-paused',value:true}));
  async function capture(scene){
   console.log('Capturing:',scene);
   const file=`${label}-${scene}.${jpeg?'jpg':'png'}`;
   await page.screenshot({path:path.join(output,file),fullPage:true,timeout:90000,...(jpeg?{type:'jpeg',quality:94}:{})});
   results.scenes.push({scene,file,diagnostics:await page.evaluate(()=>window.cityTraffic.getDiagnostics()),snapshot:await page.evaluate(()=>{const s=window.cityTraffic.getSnapshot();return{tick:s.tick,metrics:s.metrics,signals:s.signals.length,pedestrians:s.pedestrians.length};})});
  }
  await capture('aerial');
  await page.evaluate(()=>window.cityTraffic.command({type:'set-camera',value:'street'}));
  await page.waitForFunction(()=>window.cityTraffic.getDiagnostics().cameraMode==='street');
  await page.waitForTimeout(1400);
  await capture('street');
  await page.evaluate(()=>window.cityTraffic.command({type:'set-camera',value:'follow'}));
  await page.waitForTimeout(900);
  await capture('follow');
  await page.evaluate(()=>{window.cityTraffic.command({type:'set-camera',value:'aerial'});window.cityTraffic.command({type:'set-night',value:true});});
  await page.waitForTimeout(1800);
  await capture('night');
  await page.evaluate(()=>window.cityTraffic.command({type:'set-night',value:false}));
  await page.setViewportSize({width:390,height:844});
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
  await page.evaluate(()=>window.cityTraffic.command({type:'set-paused',value:true}));
  await capture('mobile');
  await page.locator('#overlay-toggle').click();
  await page.locator('#experiment-toggle').click();
  await capture('mobile-experiment');
  results.sourcesAfter=hashes();
  results.sourceStable=JSON.stringify(results.sourcesBefore)===JSON.stringify(results.sourcesAfter);
  fs.writeFileSync(path.join(output,`${label}-report.json`),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
