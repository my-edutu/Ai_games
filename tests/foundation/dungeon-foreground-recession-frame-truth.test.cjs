'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/foreground-recession.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const fresh=()=>({position:{y:1.25},visible:true,userData:{}}),box=[0,0,0,1,3,1];
test('verified foreground stone physically disappears in the very first blocked frame',async()=>{
 const {applyForegroundRecession:apply}=await load();
 for(const dt of [0,.001,.016,.05,.8]){
  const p=fresh();apply(p,false,.016,false,box);
  assert.equal(apply(p,true,dt,false,box),true);
  assert.equal(p.visible,false,'still covers true source actor at '+dt);
  assert.ok(Math.abs(p.position.y-(1.25-3.32))<1e-9);
  assert.equal(p.userData.dungeonForegroundRecession.fraction,0);
 }
});
test('unblocked stone stays intact and reduced-motion transition is immediate',async()=>{
 const {applyForegroundRecession:apply}=await load(),p=fresh(),q=fresh();
 apply(p,false,.016,false,box);assert.equal(p.position.y,1.25);assert.equal(p.visible,true);
 apply(q,false,.016,true,box);apply(q,true,.016,true,box);assert.equal(q.visible,false);
 apply(q,false,.016,true,box);assert.equal(q.visible,true);assert.equal(q.position.y,1.25);
});
test('real obstruction holds physically cleared through stalled frames then stone returns slowly',async()=>{
 const {applyForegroundRecession:apply}=await load(),p=fresh();
 apply(p,false,.016,false,box);apply(p,true,.016,false,box);
 for(let i=0;i<12;i++){apply(p,true,i%2?.016:0,false,box);assert.equal(p.visible,false)}
 let last=p.position.y;
 for(let i=0;i<20;i++){apply(p,false,.05,false,box);assert.ok(p.position.y+1e-9>=last);last=p.position.y}
 assert.ok(Math.abs(p.position.y-1.25)<1e-9);
});
test('invalid geometry does not gain authority to clear',async()=>{
 const {applyForegroundRecession:apply}=await load();
 assert.equal(apply(null,true,.016,false,box),false);
 assert.equal(apply({position:{y:Infinity},visible:true,userData:{}},true,.016,false,box),false);
});
