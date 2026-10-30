'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('three');

test('the real room renderer exposes an explicit disposal lifecycle for its owned resources',()=>{
  const context=vm.createContext({window:{THREE},console});
  const root=path.resolve(__dirname,'../../public/ai-escape-room');
  for(const file of ['room3d-polish.js','mechanisms3d.js','scenery3d.js','archivist3d.js','room3d.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  assert.equal(typeof context.window.EscapeRoom3D,'function');
  assert.equal(typeof context.window.EscapeRoom3D.prototype.dispose,'function','a renderer that owns RAF, DOM listeners, a ResizeObserver and GPU resources must offer a disposal boundary');
});
