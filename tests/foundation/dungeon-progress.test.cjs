'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('progress page uses a same-origin stylesheet under the strict server CSP',()=>{
 const html=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.html'),'utf8');
 assert.match(html,/<link[^>]+href="\/dungeon\/gauntlet.css"/);
 assert.doesNotMatch(html,/<style\b|\sstyle\s*=/i);
 const css=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.css'),'utf8');
 assert.match(css,/\.grid\s*\{[^}]*display:grid/);
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(server.includes("['/dungeon/gauntlet.css','gauntlet.css']"));
 assert.ok(server.includes("style-src 'self'"));
});
test('progress page keeps the approved benchmark and truthful evidence bindings',()=>{
 const html=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.html'),'utf8');
 assert.match(html,/Diablo IV/);assert.match(html,/NOT AAA CERTIFIED/);
 for(const id of ['health','floor','run','tick','warden-phase','heroes-alive','hazards-active','checkpoint','evidence','measurements','visual-audit','iterations','world-capture','world-capture-placeholder','actual-capture','local-capture'])assert.ok(html.includes(`id="${id}"`),id);
});
