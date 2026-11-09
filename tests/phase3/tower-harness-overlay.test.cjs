'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
  fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('every neutral Tower browser evidence dependency is copied into the frozen source without modifying its game',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/tower-transformation-visual-evidence.yml'),'utf8');
  const browser=fs.readFileSync(path.join(root,'tests/browser/tower-live-motion.spec.cjs'),'utf8');
  const requireFiles=[...browser.matchAll(/require\('\.\.\/\.\.\/scripts\/([^']+\.cjs)'\)/g)]
    .map(match=>match[1]);
  assert.ok(requireFiles.length>=8,'the live original film test must have real source dependencies');
  for(const file of requireFiles){
    assert.ok(fs.existsSync(path.join(root,'scripts',file)),'local neutral helper exists: '+file);
    assert.ok(workflow.includes('cp current-harness/scripts/'+file+' source/scripts/'+file),
      'baseline immutable checkout MUST receive the same neutral witness dependency: '+file);
  }
  assert.ok(workflow.includes('cp current-harness/tests/phase3/tower-public-state-witness.test.cjs source/tests/phase3/tower-public-state-witness.test.cjs'));
  assert.match(workflow,/run: node --test[^\n]*tower-public-state-witness\.test\.cjs/,
    'test the original-host witness on frozen and candidate recording workers');
  assert.doesNotMatch(workflow,/cp current-harness\/scripts\/serve-tower-stream\.cjs source\/scripts\/serve-tower-stream\.cjs/,
    'never replace the immutable baseline authority host');
  assert.match(workflow,/git -C source diff --exit-code -- scripts\/serve-tower-stream\.cjs/);
});
