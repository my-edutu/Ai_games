'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test,expect}=require('@playwright/test');
const {restorePreR46}=require('../helpers/snake-r46-cache-archive.cjs');
const {stripR49Contact}=require('../helpers/snake-r49-contact-archive.cjs');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const blob = historicalRendererGitBlob;
const evidence=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const oldLoop=[
  '    contacts.count = 0;',
  '    for (const path of motion.paths) for (const point of path) {',
  '      if (contacts.count === 2048) break;',
  '      contactTransform.position.set(point.x + 0.07, 0.022, point.z + 0.08);',
  '      contactTransform.updateMatrix();',
  '      contacts.setMatrixAt(contacts.count++, contactTransform.matrix);',
  '    }',
  '    contacts.instanceMatrix.needsUpdate = true;',
  ''
].join('\n');

function stripLaterR43(source){
  let content=source;
  for(const name of ['WATER SAMPLING HELPER','WATER SAMPLING ADAPT','WATER SAMPLING INIT','WATER SAMPLING STATS']){
    const begin='// BEGIN R43 '+name+'\n',end='// END R43 '+name+'\n';
    const a=content.indexOf(begin),b=content.indexOf(end);
    if(a<0||b<a||content.indexOf(begin,a+1)>=0)throw new Error('invalid reversible later R43 '+name);
    const lineStart=content.lastIndexOf('\n',a-1)+1;
    content=content.slice(0,lineStart)+content.slice(b+end.length);
  }
  return content;
}

function predecessor(source){
  let previous=source;
  for(const name of ['CONTACT HELPER','CONTACT COUNTERS','CONTACT STATS']){
    const rule=new RegExp('^.*// BEGIN R38 '+name+'\\n[\\s\\S]*?^.*// END R38 '+name+'\\n','gm');
    expect((previous.match(rule)||[]).length).toBe(1);
    previous=previous.replace(rule,'');
  }
  const call=/^.*\/\/ BEGIN R38 CONTACT SUBRANGE\n[\s\S]*?^.*\/\/ END R38 CONTACT SUBRANGE\n/gm;
  expect((previous.match(call)||[]).length).toBe(1);
  previous=previous.replace(call,oldLoop);
  // R38 historical source SHA excludes newer R46 only; the actual A/B renders retain R46 in BOTH arms.
  expect(blob(restorePreR46(stripLaterR43(previous)))).toBe('14d5f7dc3e344e9850ac325b768928eba9546c60');
  return previous;
}
test('actual Chromium WebGL retains exact shadows and gameplay on smaller grounded contact uploads',async({browser,baseURL})=>{
  test.setTimeout(140000);
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.dangerLevel=0; // Controlled synthetic parity fixture; never production danger suppression.
  const frozen=JSON.stringify(frame);
  // The old R38 A/B remains byte-exact; R49 is exercised separately.
  const current=stripR49Contact(fs.readFileSync(path.join(repo,'public/snake-stream/renderer.mjs'),'utf8'));
  const old=predecessor(current);
  const freeze='    const time = timestamp / 1000;';
  expect(current.split(freeze).length).toBe(2);
  const rows=[];
  for(const mode of ['overview','detail']){
    const captures=[];
    for(const [label,source] of [['before',old],['after',current]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        // Synthetic clock held at zero in BOTH arms. No production speed/display claim.
        const frozenSource=source.replace(freeze,'    const time = 0; // controlled R38 static visual fixture');
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:frozenSource}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=5);
        const state=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(0);
        expect(state.glError).toBe(0);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:evidence('snake-r38-contact-'+mode+'-'+label+'-synthetic.png')});
        captures.push({label,png,state});
        rows.push({label,mode,frameCount:state.stats.frameCount,
          contactShadowUpload:state.stats.contactShadowUpload||null,
          drawCalls:state.stats.drawCalls,triangles:state.stats.triangles,
          world:state.stats.world,serpent:state.stats.serpent});
      }finally{await page.close();}
    }
    expect(Buffer.compare(captures[0].png,captures[1].png)).toBe(0);
    const before=captures[0].state.stats,after=captures[1].state.stats;
    expect(after.contactShadowUpload.instances).toBeGreaterThan(0);
    expect(after.contactShadowUpload.capacityBytes).toBe(2048*16*4);
    expect(after.contactShadowUpload.requestedSubrangeBytes).toBe(after.contactShadowUpload.instances*16*4);
    expect(after.contactShadowUpload.requestedSubrangeBytes).toBeLessThan(after.contactShadowUpload.capacityBytes);
    expect(after.contactShadowUpload.accumulatedRequestedBytes).toBeGreaterThan(0);
    expect(after.drawCalls).toBe(before.drawCalls);
    expect(after.triangles).toBe(before.triangles);
    for(const key of ['geometries','textures','materials','drawObjects','staticMeshes'])
      expect(after.world[key]).toBe(before.world[key]);
    for(const key of ['geometries','textures','materials','bodyRings','bodyTriangles','bufferBytes','paths'])
      expect(after.serpent[key]).toBe(before.serpent[key]);
  }
  fs.writeFileSync(evidence('snake-r38-contact-transfer-metrics.json'),JSON.stringify({
    syntheticFrozenPublicFixture:true,controlledClock:0,independentArtReview:false,
    notLiveFps:true,notDisplayPresentFps:true,notCausalSpeedup:true,
    oldSourceGitBlob:'14d5f7dc3e344e9850ac325b768928eba9546c60',rows
  },null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(frozen);
});
