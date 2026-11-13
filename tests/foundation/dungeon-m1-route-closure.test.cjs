'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const PUBLIC=path.join(ROOT,'public/ai-dungeon');
const source=fs.readFileSync(path.join(ROOT,'scripts/serve-dungeon-stream.cjs'),'utf8');
// Parse the server's actual fixed allowlist instead of inventing a mock HTTP router.
const declaration=source.match(/const paths=new Map\(\[([\s\S]*?)\]\);/);
assert.ok(declaration,'production HTTP allowlist must remain inspectable');
const paths=vm.runInNewContext('new Map(['+declaration[1]+'])',{Map});
function assertServed(name){
 const route='/dungeon/'+name;
 assert.equal(paths.get(route),name,route+' must be served by the production test host');
 const stat=fs.statSync(path.join(PUBLIC,name));
 assert.ok(stat.isFile(),name+' must exist on the exact branch');
}
test('organic 3D startup resolves the actual connected-chapter scene and its nested planner',()=>{
 for(const name of ['connected-journey.js','connected-journey-plan.js',
  'alternate-gallery.js','alternate-gallery-plan.js'])assertServed(name);
 const env=fs.readFileSync(path.join(PUBLIC,'environment.js'),'utf8');
 assert.match(env,/from '\/dungeon\/connected-journey\.js'/);
 assert.match(env,/from '\/dungeon\/alternate-gallery\.js'/);
 for(const name of ['connected-journey','alternate-gallery']){
  const content=fs.readFileSync(path.join(PUBLIC,name+'.js'),'utf8');
  assert.match(content,new RegExp("from '\\/dungeon\\/"+name+"-plan\\.js'"));
 }
});
test('authentic frame-driven WebM recorder can load its live capture module',()=>{
 assertServed('rendered-frame-capture.js');
 const film=fs.readFileSync(path.join(ROOT,'tests/browser/dungeon-m1-organic-journey.spec.cjs'),'utf8');
 assert.match(film,/import\('\/dungeon\/rendered-frame-capture\.js'\)/);
});
