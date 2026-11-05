'use strict';
// Capture the actual renderer. The host keeps running while the inspected view freezes.
// These stills do not certify motion quality, frame rate, or the commercial reference bar.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

async function capture() {
  const prefixArg=process.argv.find(arg=>arg.startsWith('--prefix='));
  const prefix=prefixArg?prefixArg.slice(9):`review-${new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14)}`;
  if(!/^[a-z0-9][a-z0-9-]{0,49}$/.test(prefix))throw new Error('Capture prefix must contain 1–50 lowercase letters, digits, or hyphens.');
  const url=new URL(process.env.ROYALE_CAPTURE_URL||'http://127.0.0.1:4177/royale/');
  const high=process.argv.includes('--high');
  url.searchParams.set('inspect','1');url.searchParams.set('capture','1');url.searchParams.set('quality','low');
  const output=path.resolve(__dirname,'../public/ai-battle-royale/dev/captures');
  fs.mkdirSync(output,{recursive:true});
  const errors=[],evidence={capturedAt:new Date().toISOString(),source:url.origin+url.pathname,quality:high?'high':'low',captures:[]};
  let browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    async function openView(viewport) {
      const page=await browser.newPage({viewport,deviceScaleFactor:1});
      page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.message));
      await page.goto(url.href,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.royaleInspection?.metrics.frozen&&window.royaleInspection.metrics.renderedMatch===window.royaleInspection.snapshot?.matchId,null,{timeout:45000});
      if(high)await page.evaluate(()=>{
        const setting=document.getElementById('low-quality');setting.checked=false;setting.dispatchEvent(new Event('change'));
        window.royaleInspection.renderOnce();
      });
      return page;
    }
    async function save(page,label) {
      const filename=`${prefix}-${label}.png`;
      await page.screenshot({path:path.join(output,filename),timeout:30000});
      const state=await page.evaluate(()=>({matchId:window.royaleInspection.snapshot.matchId,tick:window.royaleInspection.snapshot.tick,metrics:window.royaleInspection.metrics}));
      evidence.captures.push({filename,...state});console.log(filename,JSON.stringify(state));
    }
    const desktop=await openView({width:1280,height:800});
    await save(desktop,'game');
    const id=await desktop.evaluate(()=>{
      const view=window.royaleInspection,agents=view.snapshot.agents.filter(a=>a.alive);
      const score=a=>(a.action==='healing'||a.action==='reloading'?-5:0)+(a.archetype==='support'?2:0);
      agents.sort((a,b)=>score(b)-score(a));
      return agents.find(a=>view.portrait(a.id))?.id;
    });
    if(!id)throw new Error('No unobstructed live character portrait was available in this snapshot.');
    evidence.portraitAgent=id;
    await save(desktop,'character');await desktop.close();
    const phone=await openView({width:390,height:844});
    await save(phone,'phone');await phone.close();
    evidence.pageErrors=errors;
    fs.writeFileSync(path.join(output,`${prefix}.json`),JSON.stringify(evidence,null,2)+'\n');
    if(errors.length)throw new Error(`Capture encountered ${errors.length} browser errors; inspect the evidence JSON.`);
  } finally {if(browser)await browser.close();}
}
capture().catch(error=>{console.error(error);process.exitCode=1;});
