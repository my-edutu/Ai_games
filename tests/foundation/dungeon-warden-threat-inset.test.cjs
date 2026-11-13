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

test('mobile real-character safe zone moves full authentic threat map off the Warden confrontation',async()=>{
 const {planThreatInsetSafeZone:choose}=await load();
 const dims={width:390,height:660,panelWidth:134,panelHeight:168};
 const original=choose({...dims,subjects:[{x:268,y:262,radius:34,weight:4},
  {x:150,y:331,radius:28,weight:6},{x:85,y:320,radius:29,weight:4}]});
 assert.equal(original.zone,'lower-right');assert.equal(original.x,246);
 assert.equal(original.y,478);assert.equal(original.fullyClear,true);
 const shifted=choose({...dims,subjects:[{x:285,y:530,radius:40,weight:4},
  {x:275,y:260,radius:35,weight:4}]});
 assert.equal(shifted.zone,'lower-left');assert.equal(shifted.fullyClear,true);
});
test('safe-zone placement is finite, bounded and hysteretic for live motion',async()=>{
 const {planThreatInsetSafeZone:choose}=await load();
 const dims={width:390,height:660,panelWidth:134,panelHeight:168};
 assert.equal(choose({...dims,panelWidth:390}),null);
 assert.equal(choose({...dims,height:100}),null);
 assert.equal(choose({...dims,subjects:[{x:NaN,y:0}]}).zone,'lower-right');
 assert.equal(choose({...dims,previous:'lower-left',subjects:[]}).zone,'lower-left');
 assert.equal(choose({...dims,previous:'lower-left',subjects:[{x:80,y:550,radius:34,weight:4}]}).zone,'lower-right');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/placeWardenThreatInset\(\)/);
 assert.match(app,/planThreatInsetSafeZone\(/);
});

test('genuine adjacent mobile Warden gains a bounded original 3D view while the inset retains 23 true cells',async()=>{
 const {planWardenThreatInset,planWardenDualPlaneWarning}=await load();
 const s=state(),before=JSON.stringify(s);
 s.units[1].x=8;s.units[1].z=9;
 const unchanged=JSON.stringify(s),full=planWardenThreatInset(s);
 const close=planWardenDualPlaneWarning(s,{width:390,height:658,cinematic:true});
 assert.ok(close);assert.equal(close.originalCellCount,23);
 assert.equal(full.cells.length,23);assert.ok(close.cells.length<23&&close.cells.length>0);
 for(const cell of close.cells)assert.ok(full.cells.some(c=>c.x===cell.x&&c.z===cell.z));
 assert.ok(close.radiusScale<.8&&close.heightScale<.8);
 assert.equal(JSON.stringify(s),unchanged);
});
test('manual desktop reduced-motion and missing or remote real Warden cannot shrink danger',async()=>{
 const {planWardenDualPlaneWarning:choose}=await load();
 const s=state(),dims={width:390,height:658,cinematic:true};
 assert.equal(choose(s,{...dims,cinematic:false}),null);
 assert.equal(choose(s,{...dims,width:1440}),null);
 assert.equal(choose(s,{...dims,reducedMotion:true}),null);
 assert.equal(choose({...s,bossWarning:null},dims),null);
 assert.equal(choose({...s,tick:warning.attackTick},dims),null);
 assert.equal(choose({...s,units:s.units.map(u=>u.faction==='party'?{...u,x:0,z:0}:u)},dims),null);
});
