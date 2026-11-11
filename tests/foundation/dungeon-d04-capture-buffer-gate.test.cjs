'use strict';
// D04 scoped contract: framebuffer retention is an explicit diagnostic, never
// a change to the legacy or ordinary ?feedback=d04 spectator.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
function captureBufferFor(search){
 const flagNames=['D04_PREVIEW','D04_CAPTURE_BUFFER'];
 const declarations=flagNames.map(name=>{
  const match=source.match(new RegExp('const '+name+'\\s*=\\s*([^;]+);'));
  assert.ok(match,name+' must be declared in the real spectator');
  return 'const '+name+'='+match[1]+';';
 }).join('\n');
 return vm.runInNewContext(declarations+'\nD04_CAPTURE_BUFFER',
  {location:{search},URLSearchParams});
}
test('D04 diagnostic drawing-buffer retention cannot modify legacy or default preview',()=>{
 for(const query of ['','?feedback=d04','?captureProbe=retain','?feedback=legacy&captureProbe=retain',
                      '?feedback=d04&captureProbe=other']){
  assert.equal(captureBufferFor(query),false,query);
 }
 assert.equal(captureBufferFor('?feedback=d04&captureProbe=retain'),true);
 assert.equal(captureBufferFor('?captureProbe=retain&feedback=d04'),true);
});
test('the actual Three.js renderer receives only the narrowly gated retention flag',()=>{
 assert.match(source,/new THREE\.WebGLRenderer\(\{canvas,antialias:true,powerPreference:'high-performance',alpha:false,preserveDrawingBuffer:D04_CAPTURE_BUFFER\}\)/);
 assert.equal((source.match(/preserveDrawingBuffer:/g)||[]).length,1,
  'retention must not be enabled by another renderer path');
});
