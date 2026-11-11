'use strict';
// Test-first barrier: D04 browser harness must parse before expensive asset
// retrieval, WebGL startup or AudioContext capture can produce genuine evidence.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');

test('isolated D04 Playwright source parses before any real-browser A/V run',()=>{
 const script=path.resolve(__dirname,'../browser/dungeon-physical-feedback-preview.spec.cjs');
 const result=spawnSync(process.execPath,['--check',script],{
  encoding:'utf8',timeout:15000,maxBuffer:64*1024
 });
 assert.equal(result.error,undefined,'node --check must execute');
 assert.equal(result.status,0,
  'A JavaScript syntax error makes the entire genuine Dungeon evidence run impossible:\n'+
   String(result.stderr||result.stdout).slice(0,1000));
});
