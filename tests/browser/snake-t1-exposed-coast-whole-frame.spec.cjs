'use strict';
// Original frozen current 99b physical game world versus candidate, same
// source renderer, same immutable REAL public snapshot and real WebGL pixels.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
const blob = x => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(x) + '\0').update(x).digest('hex');
const filename = name => {
  const dir = path.join(ROOT, 'artifacts/phase3');
  fs.mkdirSync(dir, {recursive:true});
  return path.join(dir, name);
};
const frozen = JSON.parse(read('docs/reviews/snake-gauntlet/round-4-public-frame.json'));
const beforeSource = read('tests/fixtures/snake-t1-before-exposed-coast-831.mjs');
const afterSource = read('public/snake-stream/world.mjs');
test.use({trace:'off',video:'off',launchOptions:{
  executablePath:process.env.SNAKE_SYSTEM_CHROMIUM || undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 exposed coast exact 831 source matched complete WebGL 1920, follow, detail and portrait before after',async({browser,baseURL})=>{
  test.setTimeout(480000);
  expect(blob(beforeSource)).toBe('e3dcc29e99c28583538cd5a4cf86f3819ce98697');
  const raw=JSON.stringify(frozen),entries=[];
  const views=[
    ['overview-1080',{width:1920,height:1080},'overview'],
    ['follow-desktop',{width:960,height:640},'follow'],
    ['detail-desktop',{width:960,height:640},'detail'],
    ['overview-phone',{width:390,height:844},'overview']
  ];
  for(const [slug,viewport,mode] of views)for(const version of ['before','after']){
    const page=await browser.newPage({viewport,reducedMotion:'no-preference'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      if(version==='before')await page.route('**/world.mjs',route=>route.fulfill({
        status:200,contentType:'text/javascript',body:beforeSource}));
      await page.route('**/snapshot',route=>route.fulfill({json:frozen}));
      await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=3,{}, {timeout:115000});
      const result=await page.evaluate(()=>({
        stats:window.__snakePresentation.stats(),
        glError:document.querySelector('#game')?.getContext('webgl2')?.getError(),
        caption:document.querySelector('#caption')?.textContent?.trim(),
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
      }));
      expect(result.stats.renderer).toBe('webgl');
      expect(result.stats.cameraMode).toBe(mode);
      expect(result.stats.world.portalEnds).toBeGreaterThan(0);
      expect(result.glError).toBe(0);
      expect(result.overflow).toBe(false);
      expect(result.caption.length).toBeGreaterThan(8);
      expect(errors).toEqual([]);
      const data=await page.screenshot({path:filename('snake-t1-exposed-'+slug+'-'+version+'-actual-webgl.png'),fullPage:true});
      entries.push({slug,viewport,mode,version,
        sourceBlob:blob(version==='before'?beforeSource:afterSource),
        publicSnapshotSha256:sha256(raw),imageSha256:sha256(data),
        bytes:data.length,buffer:result.stats.drawingBuffer,quality:'SELF REVIEW / ACCEPTANCE PENDING',
        physicalDisplayFps:'NOT MEASURED',originalStrictOneSecondGate:'RUN SEPARATELY, UNCHANGED'});
    }finally{await page.close();}
  }
  expect(entries).toHaveLength(8);
  expect(JSON.stringify(frozen)).toBe(raw);
  fs.writeFileSync(filename('snake-t1-exposed-real-webgl-comparison.json'),
    JSON.stringify({beforeCommit:'831573effbb984fc1ec691d0b09b71c8851c4128',
      originalRuntimeRenderer:true,actualWebGL:true,
      independentAcceptance:'PENDING',strict17CompleteDesktopSubmissionsGateUnchanged:true,
      entries},null,2)+'\n');
});
