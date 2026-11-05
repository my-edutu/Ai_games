'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const output = __dirname;
const files = ['index.html', 'styles.css', 'main.mjs', 'world.mjs'];
const hashes = () => Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.resolve('public/ai-city-traffic', file))).digest('hex')]));
const report = { startedAt: new Date().toISOString(), sourcesBefore: hashes(), checks: [], scenes: [], errors: [] };
const check = (name, actual, expected) => { report.checks.push({name,actual,expected,passed:JSON.stringify(actual)===JSON.stringify(expected)}); assert.deepEqual(actual,expected,name); };
async function main() {
  const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.CITY_BROWSER_PATH?{executablePath:process.env.CITY_BROWSER_PATH}:{})});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});
    page.on('pageerror', error => report.errors.push(error.message));
    page.setDefaultTimeout(30000);
    await page.goto('http://127.0.0.1:4311/traffic/',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('body[data-ready="true"]',{timeout:60000});
    await page.evaluate(()=>window.cityTraffic.command({type:'set-paused',value:true}));
    const settle = () => page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('is-visible'),{},{timeout:10000});
    async function state() {
      return page.evaluate(()=>{
        const selectors=['.masthead','.stats-panel','.scene-tools','#experiment-panel','#overlay-legend','#queue-summary','#queue-summary-location','#queue-summary-count','#queue-focus','#queue-callout','#city-controls','#experiment-toggle','#pause-toggle','#demand-range','#experiment-close'];
        const boxes=Object.fromEntries(selectors.map(selector=>{const element=document.querySelector(selector);const r=element.getBoundingClientRect();const css=getComputedStyle(element);const x=r.x+r.width/2,y=r.y+r.height/2;const hit=document.elementFromPoint(x,y);return[selector,{x:r.x,y:r.y,width:r.width,height:r.height,visible:!element.hidden&&css.visibility!=='hidden'&&css.display!=='none',centerHit:!!hit&&(hit===element||element.contains(hit)),text:element.textContent.trim().replace(/\s+/g,' '),fontSize:css.fontSize,color:css.color,background:css.backgroundColor}];}));
        const s=window.cityTraffic.getSnapshot();
        return {viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,tick:s.tick,metrics:s.metrics,signals:s.signals,diagnostics:window.cityTraffic.getDiagnostics(),boxes,focus:{id:document.activeElement.id,tag:document.activeElement.tagName},panelScroll:{top:document.querySelector('#experiment-panel').scrollTop,height:document.querySelector('#experiment-panel').clientHeight,scrollHeight:document.querySelector('#experiment-panel').scrollHeight}};
      });
    }
    async function capture(name) {
      await settle();
      await page.screenshot({path:path.join(output,name+'.png'),fullPage:true,timeout:90000});
      const s=await state();report.scenes.push({name,...s});console.log('Captured '+name+' tick '+s.tick);return s;
    }
    const first=await capture('390-default');
    check('390 no horizontal page overflow',first.scrollWidth<=390,true);
    await page.locator('#overlay-toggle').click();
    await page.locator('#experiment-toggle').click();
    async function verifySummary(label,s) {
      const busiest=[...s.signals].sort((a,b)=>b.queue-a.queue)[0];
      check(label+' numeric count equals current busiest queue',Number(s.boxes['#queue-summary-count'].text),busiest.queue);
      check(label+' location names current busiest signal',s.boxes['#queue-summary-location'].text.startsWith(busiest.id.toUpperCase()+' '),true);
      check(label+' View button has 44 px target',s.boxes['#queue-focus'].width>=44&&s.boxes['#queue-focus'].height>=44,true);
      check(label+' summary location is not occluded',s.boxes['#queue-summary-location'].centerHit,true);
      check(label+' summary numeric count is not occluded',s.boxes['#queue-summary-count'].centerHit,true);
      check(label+' View button is not occluded',s.boxes['#queue-focus'].centerHit,true);
      check(label+' summary fits viewport',s.boxes['#queue-summary'].x>=0&&s.boxes['#queue-summary'].x+s.boxes['#queue-summary'].width<=s.viewport.width&&s.boxes['#queue-summary'].y>=0&&s.boxes['#queue-summary'].y+s.boxes['#queue-summary'].height<=s.viewport.height,true);
    }
    let s=await capture('390-experiment-overlay');
    await verifySummary('390 panel open',s);
    await page.locator('#queue-focus').click();
    s=await capture('390-view-junction');
    check('390 View closes Experiment',s.boxes['#experiment-panel'].visible,false);
    check('390 View focuses city canvas',s.focus.tag,'CANVAS');
    check('390 View selects aerial mode',s.diagnostics.cameraMode,'aerial');
    check('390 map count equals summary',s.boxes['#queue-callout'].text.includes(s.boxes['#queue-summary-count'].text+'queued'),true);
    check('390 map cue remains visible',s.boxes['#queue-callout'].visible,true);
    check('390 focused cue centered on screen',Math.abs(s.boxes['#queue-callout'].x+s.boxes['#queue-callout'].width/2-195)<=2,true);
    await page.locator('#experiment-toggle').focus();
    await page.keyboard.press('Enter');
    check('keyboard opening focuses demand slider',await page.locator('#demand-range').evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Escape');
    check('Escape closes Experiment from focused slider',await page.locator('#experiment-panel').isVisible(),false);
    check('Escape returns focus to Experiment',await page.locator('#experiment-toggle').evaluate(e=>e===document.activeElement),true);
    await page.locator('#experiment-toggle').click();
    await page.locator('#experiment-close').click();
    check('Close button returns focus to Experiment',await page.locator('#experiment-toggle').evaluate(e=>e===document.activeElement),true);
    await page.locator('#help-open').click();await page.keyboard.press('Escape');
    check('native help closes on Escape',await page.locator('#help-dialog').isVisible(),false);
    check('native help returns focus',await page.locator('#help-open').evaluate(e=>e===document.activeElement),true);
    await page.locator('#overlay-toggle').click();
    await page.locator('[data-camera="follow"]').click();
    await capture('390-follow');
    await page.setViewportSize({width:320,height:700});
    await page.locator('[data-camera="aerial"]').click();
    await page.locator('#overlay-toggle').click();
    await page.locator('#experiment-toggle').click();
    s=await capture('320-experiment-overlay');
    check('320 no horizontal page overflow',s.scrollWidth<=320,true);
    await verifySummary('320 panel open',s);
    const panel=await page.locator('#experiment-panel').boundingBox();
    await page.mouse.move(panel.x+panel.width-20,panel.y+panel.height-40);
    await page.mouse.wheel(0,600);
    s=await capture('320-experiment-scrolled');
    await verifySummary('320 panel scrolled',s);
    check('320 panel actually scrolled',s.panelScroll.top>0,true);
    await page.locator('#queue-focus').click();
    s=await capture('320-view-junction');
    check('320 View closes Experiment',s.boxes['#experiment-panel'].visible,false);
    check('320 map cue remains visible',s.boxes['#queue-callout'].visible,true);
    check('320 focused cue centered on screen',Math.abs(s.boxes['#queue-callout'].x+s.boxes['#queue-callout'].width/2-160)<=2,true);
    await page.locator('#overlay-toggle').click();
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('[data-camera="follow"]').click();
    await capture('1440-follow');
    await page.locator('#night-toggle').click();
    await capture('1440-follow-night');
    check('no uncaught page errors',report.errors,[]);
  } catch(error) {
    report.failure={message:error.message,stack:error.stack};
    throw error;
  } finally {
    report.sourcesAfter=hashes();
    report.uiSourceStable=files.slice(0,3).every(file=>report.sourcesBefore[file]===report.sourcesAfter[file]);
    report.finishedAt=new Date().toISOString();
    fs.writeFileSync(path.join(output,'probe-report.json'),JSON.stringify(report,null,2)+'\n');
    await browser.close();
  }
}
main().then(()=>console.log('All independent UI probes passed.')).catch(error=>{console.error(error);process.exitCode=1;});
