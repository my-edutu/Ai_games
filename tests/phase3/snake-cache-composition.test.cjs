'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {restorePreR46}=require('../helpers/snake-r46-cache-archive.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
const gitBlob = historicalRendererGitBlob;
test('R46 exact prior renderer and single-pass lifecycle preserve cache and shader budget',()=>{
  const prior=restorePreR46(source);
  assert.equal(gitBlob(prior),'126d5b5f387f4ad5f22b274bd26cd8b19bdcccd5');
  for(const s of [prior,source]) assert.doesNotThrow(()=>new vm.Script(s.replace(/^import .*;\n/gm,'').replace(/^export (?=function )/gm,'')));
  for(const assertion of [/liveCacheQuad\.renderOrder = -10000/,/liveCacheQuad\.layers\.set\(DYNAMIC_LAYER\)/,
    /liveCacheQuad\.visible = false/,/scene\.remove\(liveCacheQuad\)/])
    assert.match(source,assertion);
  assert.equal((prior.match(/renderer\.render\(cacheScene, cacheCamera\);/g)||[]).length,2);
  assert.equal((source.match(/renderer\.render\(cacheScene, cacheCamera\);/g)||[]).length,1);
});
