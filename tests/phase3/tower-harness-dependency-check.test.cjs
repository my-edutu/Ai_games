'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {inspectHarnessDependencies}=require('../../scripts/tower-harness-dependency-check.cjs');
function fixture(run){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'tower-harness-'));
  const write=(file,content)=>{const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);};
  try{return run(root,write);}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('rejects missing transitive native-video clock from an unmodified capture entry',()=>fixture((root,write)=>{
  write('tests/browser/live.cjs',`require('../../scripts/recorder.cjs');`);
  write('scripts/recorder.cjs',`require('./tower-video-timebase.cjs');`);
  const result=inspectHarnessDependencies(root,['tests/browser/live.cjs']);
  assert.equal(result.ok,false);
  assert.match(result.faults.join(' '),/Missing local module: scripts\/tower-video-timebase.cjs/);
}));
test('checks a complete relative require graph without needing external dependencies',()=>fixture((root,write)=>{
  write('tests/browser/live.cjs',`require('@playwright/test'); require('../../scripts/recorder.cjs');`);
  write('scripts/recorder.cjs',`require('node:fs');require('./tower-video-timebase.cjs');`);
  write('scripts/tower-video-timebase.cjs',`require('./recorder.cjs'); module.exports={};`);
  const result=inspectHarnessDependencies(root,['tests/browser/live.cjs']);
  assert.equal(result.ok,true,JSON.stringify(result.faults));
  assert.equal(result.checked,3);
}));
test('rejects imports escaping an immutable source checkout',()=>fixture((root,write)=>{
  write('tests/browser/live.cjs',`require('../../../outside.cjs');`);
  const result=inspectHarnessDependencies(root,['tests/browser/live.cjs']);
  assert.equal(result.ok,false);
  assert.match(result.faults.join(' '),/escapes checkout/);
}));

test('offline baseline and candidate recordings use fresh original-source host for EACH viewport',()=>{
  const offline=fs.readFileSync(path.join(__dirname,'../../scripts/tower-offline-evidence.sh'),'utf8');
  assert.match(offline,/for viewport in desktop portrait; do/,
    'a combined two-test invocation reuses the 20Hz server after desktop and shifts portrait to a later floor');
  assert.match(offline,/--grep "normal-speed Tower motion \$viewport"/,
    'each Playwright invocation must select exactly one native viewport');
  assert.match(offline,/capture-\$viewport\.log/,
    'preserve separate errors from each independently seeded original host');
  assert.match(offline,/test-results-\$viewport/,
    'preserve both native viewport failure artifacts');
});
