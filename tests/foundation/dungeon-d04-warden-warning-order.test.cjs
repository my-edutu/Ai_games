'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon/warden-warning-lifecycle.js')).href);
const warning=(id,tick,attackTick,sceneKey='1:1',actorId='warden')=>({
 id,sceneKey,actorId,tick,kind:'boss-warning-final',visual:'warning',
 proof:'authority-warning-window',detail:{attackTick,cells:[{x:4,z:5}]}
});
const release=(tick,sceneKey='1:1',actorId='warden')=>({
 id:'release-'+tick,sceneKey,actorId,tick,kind:'warden-release',visual:'warden',proof:'authority-action'
});
test('a late release cannot erase a later attack warning in the same floor',async()=>{
 const {shouldRetireWardenWarning}=await load();
 const future=warning('warning-next',45,48);
 assert.equal(shouldRetireWardenWarning(future,release(43)),false);
 assert.equal(shouldRetireWardenWarning(future,release(46)),false,'the target attack tick is still in the future');
 assert.equal(shouldRetireWardenWarning(future,release(48)),true,'real matching release retires its own warning');
});
test('late older warning does not replace fresher footprint',async()=>{
 const {isStaleWardenWarning,shouldRetireWardenWarning}=await load();
 const older=warning('old',41,44),newer=warning('new',43,46);
 assert.equal(isStaleWardenWarning(older,[{cue:newer}]),true);
 assert.equal(shouldRetireWardenWarning(newer,older),false);
 assert.equal(isStaleWardenWarning(newer,[{cue:older}]),false);
 assert.equal(shouldRetireWardenWarning(older,newer),true);
});
test('equal observation tick prefers later actual attack window',async()=>{
 const {isStaleWardenWarning,shouldRetireWardenWarning}=await load();
 const old=warning('old',40,42),newer=warning('new',40,45);
 assert.equal(isStaleWardenWarning(old,[{cue:newer}]),true);
 assert.equal(shouldRetireWardenWarning(newer,old),false);
 assert.equal(shouldRetireWardenWarning(old,newer),true);
});
test('retirement is bounded to the same real Warden owner and scene',async()=>{
 const {shouldRetireWardenWarning}=await load();
 const w=warning('old',39,42);
 assert.equal(shouldRetireWardenWarning(w,release(42,'2:1')),false);
 assert.equal(shouldRetireWardenWarning(w,release(42,'1:1','another')),false);
 assert.equal(shouldRetireWardenWarning(w,{...release(42),proof:'untrusted-text'}),false);
 assert.equal(shouldRetireWardenWarning(w,release(42)),true);
});
