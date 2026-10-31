'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {launch,open,root}=require('../tests/tiny-kingdom/browser-harness.cjs');
(async()=>{
 const source=fs.readFileSync(path.join(root,'public/tiny-kingdom/index.html'));
 const sha=crypto.createHash('sha256').update(source).digest('hex');
 if(sha!=='f7ae295be845aaa45d885e80d75b3820d69ca3838acd81f2ac4c425f0988c44a')throw Error('Refusing to mislabel a different source as the HD baseline');
 const out=path.resolve(process.argv[2]||'artifacts/tiny-hd');fs.mkdirSync(out,{recursive:true});const b=await launch();
 try{const {page,errors}=await open(b,{width:1920,height:1080});await page.evaluate(()=>{const g=__tinyKingdom,s=g.exportSnapshot();s.payload.state.t=12;s.checksum=__tkInspection.checksum(s.payload);g.restoreSnapshot(s);g.setRenderQuality(1);g.setCamera({focus:[0,3],zoom:30,pitch:.68,yaw:2.65});g.setHudMode('full');__drawFrame(1000)});await page.screenshot({path:path.join(out,'hd-before.png')});fs.writeFileSync(path.join(out,'hd-before-manifest.json'),JSON.stringify({sourceSha256:sha,capturedAt:new Date().toISOString(),renderer:await page.evaluate(()=>__tinyKingdom.renderQuality()),errors},null,2));if(errors.length)throw Error(errors.join('\n'));await page.close()}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
