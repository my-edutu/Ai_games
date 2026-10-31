'use strict';
/** Actual-game evidence: no injected snapshots, fake canvases, or fixed test HUD. */
const fs=require('node:fs/promises');
const path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const {chromium}=require('@playwright/test');
const ROOT=path.resolve(__dirname,'..');
const label=process.argv.find(v=>v.startsWith('--label='))?.slice(8)||'review';
if(!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Invalid evidence label');
const output=path.join(ROOT,'evidence/thousand-floors/captures');
const port=4185,origin=`http://127.0.0.1:${port}`;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const server=spawn(process.execPath,['scripts/serve-thousand-floors.cjs',`--port=${port}`],{cwd:ROOT,stdio:['ignore','pipe','pipe']});
 let serverLog='';server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
 let browser;
 const evidence={source:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),label,method:'actual worker replay; pause through controls; high-quality stills on software WebGL; not an FPS result',captures:[]};
 try{
  let ready=false;for(let i=0;i<100;i++){try{const r=await fetch(origin+'/floors/health');if(r.ok){ready=true;break}}catch{}await wait(100)}
  if(!ready)throw Error('Evidence server did not start: '+serverLog);
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  for(const floor of [6,102,403,902]){
   const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`)});
   await page.addInitScript(()=>localStorage.setItem('thousand-floors-settings-v1',JSON.stringify({quality:'low',qualityManual:true})));
   await page.goto(`${origin}/floors/?review=${floor}`,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__FLOORS_DIAGNOSTICS__?.().initialized,{},{timeout:120000});
   await page.evaluate(()=>document.querySelector('#pause-button').click());
   await page.waitForFunction(()=>window.__FLOORS_DIAGNOSTICS__().paused);
   await page.evaluate(()=>{const q=document.querySelector('#quality-select');q.value='high';q.dispatchEvent(new Event('change',{bubbles:true}))});
   await page.waitForTimeout(700);
   const name=`${label}-floor-${String(floor).padStart(3,'0')}.jpg`;
   await page.screenshot({path:path.join(output,name),type:'jpeg',quality:88,timeout:60000});
   const diagnostics=await page.evaluate(()=>window.__FLOORS_DIAGNOSTICS__());
   evidence.captures.push({file:name,viewport:'1280x720',diagnostics,errors:[...errors]});
   if(floor===6){
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
    const mobile=`${label}-mobile.jpg`;
    await page.screenshot({path:path.join(output,mobile),type:'jpeg',quality:88,timeout:60000});
    evidence.captures.push({file:mobile,viewport:'390x844',diagnostics:await page.evaluate(()=>window.__FLOORS_DIAGNOSTICS__()),errors:[...errors]});
   }
   if(errors.length)throw Error('Captured game errors: '+JSON.stringify(errors));
   await context.close();console.log(`Captured actual district at floor ${floor}`);
  }
 }finally{
  await fs.writeFile(path.join(output,`${label}-capture.json`),JSON.stringify(evidence,null,2)+'\n');
  await browser?.close();server.kill('SIGTERM');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
