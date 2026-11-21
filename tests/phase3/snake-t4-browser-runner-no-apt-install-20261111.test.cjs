'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
// Browser capture is acceptance-critical. ubuntu-24.04 comes with its shared
// libraries; apt font mirror outages must not abort before Chromium tests.
test('actual source-head Snake browser verification downloads Chromium without apt-dependent system-install preflight',()=>{
 for(const name of ['snake-3d-preview.yml','ci.yml']){
  const file=fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');
  assert.match(file,/runs-on:\s*ubuntu-24\.04/);
  assert.match(file,/npx playwright install chromium\b/);
  assert.doesNotMatch(file,/playwright install --with-deps chromium/);
 }
});
