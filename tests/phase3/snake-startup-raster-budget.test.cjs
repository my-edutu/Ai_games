'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const rendererPath=path.resolve(__dirname,'../../public/snake-stream/renderer.mjs');
const source=fs.readFileSync(rendererPath,'utf8');
const blob = historicalRendererGitBlob;
const {stripR53Startup}=require('../helpers/snake-r53-startup-archive.cjs');
function helper(){
  const context=vm.createContext({});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/^export (?=function )/gm,'')+'\nthis.r53=boundedStartupPixelRatio;',context);
  return context.r53;
}

test('R53 exact prior renderer is recoverable without touching earlier Gauntlet source',()=>{
  assert.equal(blob(stripR53Startup(source)),'bd7636ee3460fc09e6a9782ae66d37c20836f7f0');
  assert.equal(stripR53Startup(stripR53Startup(source)),stripR53Startup(source));
  assert.ok(source.includes('frameCount === 0'), 'initial resize only; never loop over normal frames');
});

test('R53 bounds original oversized broadcast first-frame GPU raster while leaving ordinary/mobile raster native',()=>{
  const calculate=helper();
  assert.equal(calculate(960,640,1),1,'960x640 control remains native');
  assert.equal(calculate(1000,600,1),1,'ordinary canvas remains native');
  assert.equal(calculate(640,360,2),2,'mobile landscape high DPI remains native');
  assert.equal(calculate(390,844,1.5),1.5,'portrait retains high-density readable scale');
  const broadcast=calculate(1840,840,1);
  assert.ok(broadcast>0.6 && broadcast<0.75,`large startup ratio ${broadcast}`);
  assert.ok(1840*840*broadcast*broadcast<=768001,'bounded first 1080p render workload');
  assert.equal(calculate(1840,840,0.4),0.4,'already adapted 0.4 cannot be increased');
  assert.equal(calculate(3840,2160,1),0.4,'the old minimum 0.4 raster is never undercut');
  assert.equal(calculate(0,1000,1),1,'invalid viewport is safe');
  assert.equal(calculate(1840,840,NaN),NaN,'invalid ratio does not invent a value');
  for(const ratio of [0.4,0.5,0.75,1,1.5]){
    const next=calculate(1840,840,ratio);
    assert.ok(next>=Math.min(ratio,0.4) && next<=ratio,'only conservative bounded downscale');
    assert.equal(calculate(1840,840,next),next,'repeated resize is stable');
  }
});
