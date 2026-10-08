'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');

test('Battle Royale 3D renderer is a local, optional WebGL2 visual adapter',()=>{
 const source=read('public/ai-battle-royale/arena3d.js');
 const host=read('public/ai-battle-royale/index.html');
 const app=read('public/ai-battle-royale/app.js');
 const server=read('scripts/serve-battle-royale-stream.cjs');
 assert.match(source,/getContext\('webgl2'/);
 assert.match(source,/webglcontextlost/);
 assert.match(source,/visual.*2d/);
 assert.match(source,/createShader/);
 assert.match(source,/drawArrays/);
 assert.match(host,/\/battle\/arena3d\.js/);
 assert.match(app,/BattleArena3D\.render\(snapshot\)/);
 assert.match(server,/\/battle\/arena3d\.js/);
 assert.doesNotMatch(source,/fetch\(|WebSocket|\.step\(|Math\.random\(/);
});
