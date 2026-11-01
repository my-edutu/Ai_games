'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/boot-watchdog.js'),'utf8');

// Deterministic isolated DOM/timer contract: this is NOT a substitute for
// Chromium/WebGL context-loss testing or unattended performance evidence.
function launch(){
 let now=0,nextTimer=1,prevented=false;
 const intervals=new Map(),events=new Map();
 const recovery={hidden:true,textContent:'',append(){}};
 const canvas={addEventListener(type,callback){events.set(type,callback)}};
 const document={
  hidden:false,body:{dataset:{}},
  getElementById(id){return id==='world'?canvas:id==='recovery'?recovery:null},
  createElement(){return {textContent:'',className:'',type:'',addEventListener(){}}}
 };
 const window={
  __DUNGEON_RENDER_DIAGNOSTICS__:{frame:0},
  __DUNGEON_PUBLIC_STATE__:{tick:0},
  addEventListener(){}
 };
 const sandbox={
  document,window,Date:{now:()=>now},
  setInterval(callback,delay){const id=nextTimer++;intervals.set(id,{callback,delay,next:now+delay});return id},
  clearInterval(id){intervals.delete(id)},
  location:{reload(){}},
  console:{error(){}}
 };
 vm.runInNewContext(source,sandbox,{filename:'boot-watchdog.js'});
 function advance(milliseconds){
  const end=now+milliseconds;
  for(let loops=0;loops<200;loops++){
   const due=[...intervals.entries()].filter(([,timer])=>timer.next<=end).sort((a,b)=>a[1].next-b[1].next||a[0]-b[0])[0];
   if(!due)break;
   const [id,timer]=due;now=timer.next;timer.next+=timer.delay;
   if(intervals.has(id))timer.callback();
   if(loops===199)throw Error('Timer runaway');
  }
  now=end;
 }
 return {
  advance,document,recovery,window,
  lose(){const event={preventDefault(){prevented=true}};events.get('webglcontextlost')(event)},
  restore(){events.get('webglcontextrestored')()},
  get prevented(){return prevented}
 };
}

test('WebGL loss requests restoration and cannot be overwritten by a stale startup frame',()=>{
 const h=launch();h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=5;h.window.__DUNGEON_PUBLIC_STATE__.tick=12;
 h.lose();
 assert.equal(h.prevented,true,'preventDefault is needed so the browser may restore WebGL');
 h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'context-lost');
 assert.equal(h.recovery.hidden,false);
});

test('a restored context is not declared ready using frames captured before restoration',()=>{
 const h=launch();h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=5;h.window.__DUNGEON_PUBLIC_STATE__.tick=12;
 h.lose();h.restore();h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'recovering');
 assert.equal(h.recovery.hidden,false,'recovery notice remains until a post-restore frame');
});

test('after startup, the recovery banner clears only after a new render frame',()=>{
 const h=launch();h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=5;h.window.__DUNGEON_PUBLIC_STATE__.tick=12;
 h.advance(600);assert.equal(h.document.body.dataset.rendererStatus,'ready');
 h.lose();h.restore();h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'recovering');
 h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=6;
 h.window.__DUNGEON_PUBLIC_STATE__.tick=13;
 h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'ready');
 assert.equal(h.recovery.hidden,true);
});

// A post-restore render is not proof of a healthy autonomous spectator feed
// while its real authoritative tick has stopped advancing.
test('context restoration requires a fresh authoritative tick as well as a rendered frame',()=>{
 const h=launch();h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=5;h.window.__DUNGEON_PUBLIC_STATE__.tick=12;
 h.advance(600);assert.equal(h.document.body.dataset.rendererStatus,'ready');
 h.lose();h.restore();h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=6;
 h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'recovering','an unchanged authority tick cannot prove full stream recovery');
 assert.equal(h.recovery.hidden,false);
 h.window.__DUNGEON_PUBLIC_STATE__.tick=13;h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'ready');
 assert.equal(h.recovery.hidden,true);
});

test('a graphics restore without a fresh frame reports the persistent output stall',()=>{
 const h=launch();h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=5;h.window.__DUNGEON_PUBLIC_STATE__.tick=12;
 h.advance(600);h.lose();h.restore();
 h.window.__DUNGEON_PUBLIC_STATE__.tick=13;
 h.advance(13000);
 assert.equal(h.document.body.dataset.rendererStatus,'stalled','a restored context alone cannot be treated as a working broadcast');
 assert.equal(h.recovery.hidden,false);
 assert.match(h.recovery.textContent,/render|graphics|3D/i);
 h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=6;h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'ready','actual frame and tick progress permit recovery');
});


test('cold startup WebGL restoration retains truthful stalled status past the generic startup deadline',()=>{
 const h=launch();
 h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=1;
 h.lose();h.restore();
 h.advance(13500);
 assert.equal(h.document.body.dataset.rendererStatus,'stalled','generic startup timer must not overwrite a known post-restore output stall');
 assert.equal(h.recovery.hidden,false);
 assert.match(h.recovery.textContent,/render|graphics|3D/i);
});

test('a late valid frame and tick recover cold-start restoration after its stall deadline',()=>{
 const h=launch();
 h.lose();h.restore();
 h.window.__DUNGEON_PUBLIC_STATE__.tick=2;
 h.advance(13500);
 assert.equal(h.document.body.dataset.rendererStatus,'stalled','a healthy tick alone does not prove restored WebGL');
 h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=5;
 h.window.__DUNGEON_PUBLIC_STATE__.tick=3;
 h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'ready');
 assert.equal(h.recovery.hidden,true);
 h.advance(14000);
 assert.equal(h.document.body.dataset.rendererStatus,'ready','a stale startup timeout must never fire after real recovery');
});

test('late actual WebGL frames and simulation ticks clear the false cold-start failure veil',()=>{
 const h=launch();h.advance(13500);
 assert.equal(h.document.body.dataset.rendererStatus,'failed');
 h.window.__DUNGEON_RENDER_DIAGNOSTICS__.frame=6;
 h.window.__DUNGEON_PUBLIC_STATE__.tick=3;
 h.advance(1000);
 assert.equal(h.document.body.dataset.rendererStatus,'ready');
 assert.equal(h.recovery.hidden,true);
});

test('generic startup failure remains actionable when no WebGL loss or restoration was observed',()=>{
 const h=launch();
 h.advance(13500);
 assert.equal(h.document.body.dataset.rendererStatus,'failed');
 assert.equal(h.recovery.hidden,false);
});

test('pre-startup WebGL loss remains truthful rather than misclassified as a module startup failure',()=>{
 const h=launch();
 h.lose();
 h.advance(32000);
 assert.equal(h.document.body.dataset.rendererStatus,'context-lost');
 assert.equal(h.recovery.hidden,false);
});
