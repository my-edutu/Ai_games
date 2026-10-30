'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch,open,root}=require('../tests/tiny-kingdom/browser-harness.cjs');
(async()=>{
 const output=path.resolve(process.argv[2]||'docs/gauntlet/tiny-kingdom/evidence'),label=process.argv[3]||'candidate';fs.mkdirSync(output,{recursive:true});
 const source=fs.readFileSync(path.join(root,'public/tiny-kingdom/index.html'));
 const manifest={label,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),capturedAt:new Date().toISOString(),captures:[],note:'Controlled noon lighting and seeded initial population. Actual browser output; renderer capability recorded below. Manually advanced frames are not a real-time performance test.'};
 const browser=await launch();try{
  const {page,errors}=await open(browser);
  await page.evaluate(()=>{const g=window.__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=12;s.checksum=window.__tkInspection.checksum(s.payload);g.restoreSnapshot(s);g.setRenderQuality(1);g.setHudMode('cinema')});
  const citizen=await page.evaluate(()=>window.__tinyKingdom.getNavigation()[0]);
  const views=[{name:'market',camera:{focus:[0,3],zoom:27,pitch:.68,yaw:2.65}},{name:'cottage',camera:{focus:[-10,-7],zoom:10,pitch:.48,yaw:3.45}},{name:'citizen',camera:{focus:citizen.position,zoom:9,pitch:.46,yaw:.65}}];
  let clock=1000;for(const view of views){await page.evaluate(({camera,clock})=>{window.__tinyKingdom.setCamera(camera);window.__drawFrame(clock)},{camera:view.camera,clock});clock+=200;const filename=label+'-'+view.name+'.png';await page.screenshot({path:path.join(output,filename)});manifest.captures.push({file:filename,camera:view.camera})}
  manifest.renderer=await page.evaluate(()=>window.__tinyKingdom.renderQuality());manifest.geometry=await page.evaluate(()=>window.__tinyKingdom.getGeometryAudit());manifest.errors=errors;await page.close();
 }finally{await browser.close()}
 fs.writeFileSync(path.join(output,label+'-manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));if(manifest.errors.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
