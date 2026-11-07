'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function discovered(config){
 return execFileSync(process.execPath,[path.join(root,'node_modules','@playwright','test','cli.js'),'test','--list','-c',config],{cwd:root,encoding:'utf8',timeout:15000});
}
test('shared browser discovery does not schedule Dungeon tests against the Snake baseURL',()=>{
 const output=discovered('playwright.config.cjs');
 assert.doesNotMatch(output,/dungeon-(?:authored-motion|facing|interface|materials|setpieces|stream|warden-regalia)\.spec\.cjs/);
 assert.match(output,/snake|maze|ant|tower/);
 assert.ok(require('../../playwright.config.cjs').webServer.every(server=>!server.url.includes(':4181/')),'dedicated Dungeon server must not start in the shared suite');
});
test('dedicated Dungeon browser config retains interface, materials, setpieces and runtime coverage',()=>{
 const output=discovered('tests/browser/dungeon.playwright.config.cjs');
 for(const file of ['dungeon-authored-motion.spec.cjs','dungeon-warden-regalia.spec.cjs','dungeon-facing.spec.cjs','dungeon-interface.spec.cjs','dungeon-materials.spec.cjs','dungeon-setpieces.spec.cjs','dungeon-stream.spec.cjs'])assert.ok(output.includes(file),file+' missing from dedicated suite');
});
