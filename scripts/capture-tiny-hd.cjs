'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch,open,root}=require('../tests/tiny-kingdom/browser-harness.cjs');
(async()=>{
 const output=path.resolve(process.argv[2]||'artifacts/tiny-hd');fs.mkdirSync(output,{recursive:true});
 const source=fs.readFileSync(path.join(root,'public/tiny-kingdom/index.html'));
 const manifest={capturedAt:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),captures:[],errors:[],benchmarkPassed:false,independentCritic:false};
 const browser=await launch();try{
  const {page,errors}=await open(browser,{width:1920,height:1080});let clock=1000;
  for(const [name,time,scene,camera,hud] of [
   ['hd-village',12,null,{focus:[0,3],zoom:30,pitch:.68,yaw:2.65},'full'],
   ['hd-market',12,'market',{focus:[0,5],zoom:17,pitch:.53,yaw:.32},'cinema'],
   ['hd-dusk',18,null,{focus:[0,3],zoom:30,pitch:.57,yaw:2.65},'full'],
   ['hd-night',22,null,{focus:[0,3],zoom:25,pitch:.55,yaw:2.65},'full']
  ]){
   await page.evaluate(({time,camera,hud,clock})=>{const g=__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=time;s.checksum=__tkInspection.checksum(s.payload);g.restoreSnapshot(s);g.setCamera(camera);g.setHudMode(hud);__drawFrame(clock)},{time,camera,hud,clock});clock+=250;
   await page.screenshot({path:path.join(output,name+'.png')});manifest.captures.push({file:name+'.png',time,camera,hud,resolution:[1920,1080]});
  }
  manifest.renderer=await page.evaluate(()=>__tinyKingdom.renderQuality());manifest.lighting=await page.evaluate(()=>__tinyKingdom.getLightingStats?.());manifest.geometry=await page.evaluate(()=>__tinyKingdom.getGeometryAudit());manifest.district=await page.evaluate(()=>__tinyKingdom.getDistrictStats?.());
  await page.setViewportSize({width:390,height:844});await page.evaluate(({clock})=>{const g=__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=12;s.checksum=__tkInspection.checksum(s.payload);g.restoreSnapshot(s);g.setCamera({focus:[0,3],zoom:32,pitch:.78,yaw:2.65});g.setHudMode('full');g.setInspector?.('citizens');__drawFrame(clock)},{clock});
  await page.screenshot({path:path.join(output,'hd-mobile.png')});manifest.captures.push({file:'hd-mobile.png',time:12,resolution:[390,844],inspector:'citizens'});manifest.errors.push(...errors);await page.close();
  // Unmodified animation loop: elapsed time and frames are observed, never set.
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:output,size:{width:1280,height:720}}});
  const live=await context.newPage();live.on('pageerror',e=>manifest.errors.push(e.message));await live.setContent(source.toString());await live.waitForFunction(()=>!!window.__tinyKingdom);
  await live.evaluate(()=>{__tinyKingdom.setCamera({focus:[0,5],zoom:19,pitch:.58,yaw:.3});__tinyKingdom.setGraphicsPreset?.('balanced')});
  const begin=await live.evaluate(()=>({clock:performance.now(),frames:__tinyKingdom.renderQuality().framesDrawn,t:__tinyKingdom.getState().state.t}));
  await live.waitForTimeout(8000);
  const end=await live.evaluate(()=>({clock:performance.now(),frames:__tinyKingdom.renderQuality().framesDrawn,t:__tinyKingdom.getState().state.t}));
  manifest.live={begin,end,elapsedMs:end.clock-begin.clock,observedFps:(end.frames-begin.frames)*1000/(end.clock-begin.clock),renderer:await live.evaluate(()=>__tinyKingdom.renderQuality()),note:'Eight-second actual browser observation at 1280x720 Balanced; software rendering is not representative of hardware GPU performance.'};
  const video=live.video();await context.close();if(video){const from=await video.path();fs.renameSync(from,path.join(output,'hd-live.webm'));manifest.live.video='hd-live.webm'}
 }finally{await browser.close()}
 fs.writeFileSync(path.join(output,'hd-manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));if(manifest.errors.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
