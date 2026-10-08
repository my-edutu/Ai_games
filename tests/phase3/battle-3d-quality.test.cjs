'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const s=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('explicit reduced GPU quality never eliminates agents or authoritative zone cues',()=>{
 assert.match(s,/params\.get\('quality'\)/);
 assert.match(s,/quality==='low'/);
 assert.match(s,/status=\{[^\n]*quality:/);
 assert.match(s,/worldDynamic\(b,presented\)/);
 assert.match(s,/worldStatic\(staticBuilder,a\)/);
 assert.match(s,/b\.ring\(c\.x/);
});
