'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-dungeon/warden-threat-inset.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const warning={shape:'RIFT_CROSS',attackTick:53,cells:Array.from({length:23},(_,i)=>({x:3+i%11,z:4+Math.floor(i/11)}))};
const state=()=>({map,phase:'playing',tick:52,bossWarning:warning,units:[{kind:'warden',hp:90,x:9,z:9},{faction:'party',hp:50,kind:'vanguard',x:7,z:6}]});
test('real pending full warning has 23 source cells and hero positions unchanged',async()=>{
 const {planWardenThreatInset}=await load();const s=state(),before=JSON.stringify(s),p=planWardenThreatInset(s);
 assert.equal(p.cells.length,23);assert.equal(p.ticks,1);assert.equal(p.heroes.length,1);
 assert.match(p.description,/23 real danger cells/);assert.equal(JSON.stringify(s),before);
});
test('stale, fake, invalid or absent threats do not appear',async()=>{
 const {planWardenThreatInset}=await load();
 assert.equal(planWardenThreatInset({...state(),tick:53}),null);
 assert.equal(planWardenThreatInset({...state(),bossWarning:{...warning,shape:'FAKE'}}),null);
 assert.equal(planWardenThreatInset({...state(),bossWarning:{...warning,cells:[{x:-1,z:4}]}}),null);
 assert.equal(planWardenThreatInset({...state(),units:[]}),null);
});
test('exact 23 mapped warnings, hero and boss render with no WebGL or extra copies',async()=>{
 const {planWardenThreatInset,drawWardenThreatInset}=await load(),p=planWardenThreatInset(state());
 const fills=[];const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
  fillRect(...v){fills.push({color:this.fillStyle,v})},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},strokeRect(){}};
 assert.equal(drawWardenThreatInset(ctx,p),true);
 assert.equal(fills.filter(x=>x.color==='#e69a62').length,23);
 assert.equal(fills.length,19*19+24);
 assert.equal(drawWardenThreatInset(ctx,null),false);
});
test('live page wiring and official route are present without adding a WebGL pass',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const html=fs.readFileSync(path.join(root,'public/ai-dungeon/index.html'),'utf8');
 assert.match(app,/drawWardenThreatInset\(threatCtx,plan/);
 assert.ok(server.includes("['/dungeon/warden-threat-inset.js','warden-threat-inset.js']"));
 assert.match(html,/id="threat-inset"/);assert.match(html,/id="threat-canvas"/);
 assert.doesNotMatch(source,/Math\.random|setTimeout|requestAnimationFrame|fetch\(/);
});
