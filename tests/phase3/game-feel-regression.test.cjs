'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// The same exported pure functions are used by the browser. No simulated physics.
function load(relative) {
  const file = path.join(__dirname, '../..', relative);
  if (!fs.existsSync(file)) return {};
  if (fs.readFileSync(file,'utf8').includes('module.exports =')) return require(file);
  const canvasContext = new Proxy({}, { get: (_, key) => key === 'createLinearGradient'
    ? () => ({addColorStop(){}}) : () => {} });
  const node = () => ({dataset:{},style:{},classList:{toggle(){},add(){}},
    getContext:()=>canvasContext,getBoundingClientRect:()=>({width:1000,height:650}),
    clientWidth:1000,clientHeight:650,width:1000,height:650,replaceChildren(){}});
  const sandbox={module:{exports:{}},console,URLSearchParams,AbortController,
    document:{body:node(),getElementById:node,querySelector:node,createElement:node},
    window:{},location:{search:''},innerWidth:1000,innerHeight:650,devicePixelRatio:1,
    performance:{now:()=>0},matchMedia:()=>({matches:false,addEventListener(){}}),
    addEventListener(){},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},
    fetch:()=>new Promise(()=>{})};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
  return sandbox.module.exports;
}
const tower=load('public/infinite-tower-climb/app.js');
const maze=load('public/ai-maze-escape/app.js');
function fn(api,name){assert.equal(typeof api[name],'function',`${name} must be an exported runtime function`);return api[name]}
const frame=(x=100000,y=1280000)=>({scene:'normal',camera:{centerY:y,zoom:1},snapshot:{
  runToken:'run-a',revision:10,tick:10,floor:2,lifecycle:'running',worldWidth:500000,
  chunkHeight:600000,chunkBaseY:1200000,
  player:{x,y,halfWidth:10000,halfHeight:18000,state:'airborne',health:5},
  platforms:[{id:'moving',x,y:1250000}],enemies:[],projectiles:[]}});
const board=(currentCell=0)=>({runToken:'maze-a',level:1,revision:1,tick:1,lifecycle:'running',
  width:4,height:3,currentCell,progressPermille:200,doors:[],travelledRoute:[0,1,5,6],
  cells:[{cell:0,neighbors:[1]},{cell:1,neighbors:[0,5]},{cell:5,neighbors:[1,6]},
    {cell:6,neighbors:[5]}]});
const plain=value=>JSON.parse(JSON.stringify(value));

for(const floor of [0,1,2,50]) test(`tower camera stays on absolute world coordinates at floor ${floor}`,()=>{
  const s=frame().snapshot;s.chunkBaseY=floor*600000;s.player.y=s.chunkBaseY+80000;
  const t=fn(tower,'transform')(s,1000,650,{centerY:s.player.y,zoom:1});
  assert.equal(t.y(s.player.y),416);assert.ok(Number.isFinite(t.scale));
});
test('tower camera honors zero instead of replacing it with player height',()=>{
  const t=fn(tower,'transform')(frame().snapshot,1000,650,{centerY:0,zoom:1});assert.equal(t.y(0),416);
});
test('tower motion interpolates both actor and moving platform without mutating snapshots',()=>{
  const a=frame(),b=frame(140000);b.snapshot.tick=12;b.snapshot.revision=12;
  const before=JSON.stringify([a,b]);const r=fn(tower,'interpolateFrame')(a,b,.5);
  assert.equal(r.snapshot.player.x,120000);assert.equal(r.snapshot.platforms[0].x,120000);
  assert.equal(JSON.stringify([a,b]),before);
});
test('tower motion never extrapolates after a stalled response',()=>{
  const a=frame(),b=frame(140000);b.snapshot.tick=12;
  assert.equal(fn(tower,'interpolateFrame')(a,b,5).snapshot.player.x,140000);
});
for(const change of ['run','floor','rewind','result','teleport'])test(`tower motion snaps safely on ${change}`,()=>{
  const a=frame(),b=frame(140000);b.snapshot.tick=12;
  if(change==='run')b.snapshot.runToken='run-b';if(change==='floor')b.snapshot.floor=3;
  if(change==='rewind')b.snapshot.tick=5;if(change==='result')b.scene='result';
  if(change==='teleport')b.snapshot.player.x=450000;
  assert.equal(fn(tower,'interpolateFrame')(a,b,.2).snapshot.player.x,b.snapshot.player.x);
});
test('tower reduced motion uses the current snapshot exactly',()=>{
  const a=frame(),b=frame(140000);b.snapshot.tick=12;
  assert.equal(fn(tower,'interpolateFrame')(a,b,.1,true).snapshot.player.x,140000);
});
test('maze route follows real corners rather than diagonal shortcuts',()=>{
  assert.deepEqual(plain(fn(maze,'routeSegments')(board(),[0,1,5,6],new Set([0,1,5,6]))),[[0,1,5,6]]);
});
test('maze route breaks across a hidden middle cell',()=>{
  assert.deepEqual(plain(fn(maze,'routeSegments')(board(),[0,1,5,6],new Set([0,5,6]))),[[5,6]]);
});
test('maze route refuses a visible but disconnected edge',()=>{
  assert.deepEqual(plain(fn(maze,'routeSegments')(board(),[0,6],new Set([0,6]))),[]);
});
test('maze route refuses a closed door',()=>{
  const s=board();s.doors=[{a:1,b:5,open:false}];
  assert.deepEqual(plain(fn(maze,'routeSegments')(s,[0,1,5,6],new Set([0,1,5,6]))),[[0,1],[5,6]]);
});
test('maze route refuses row wrapping and blocked cells',()=>{
  const s=board();s.cells=[{cell:3,neighbors:[4]},{cell:4,neighbors:[3]}];
  assert.deepEqual(plain(fn(maze,'routeSegments')(s,[3,4],new Set([3,4]))),[]);
  const b=board();b.cells[1].blocked=true;
  assert.deepEqual(plain(fn(maze,'routeSegments')(b,[0,1],new Set([0,1]))),[]);
});
test('maze motion only interpolates a confirmed adjacent corridor',()=>{
  const a=board(),b=board(1);b.tick=2;
  assert.deepEqual(plain(fn(maze,'explorerPosition')(a,b,.5)),{col:.5,row:0});
});
test('maze motion snaps across unobserved movement rather than moving through walls',()=>{
  const a=board(),b=board(6);b.tick=2;
  assert.deepEqual(plain(fn(maze,'explorerPosition')(a,b,.5)),{col:2,row:1});
});
test('maze motion resets between runs and in reduced-motion mode',()=>{
  const a=board(),b=board(1);b.tick=2;b.runToken='maze-b';
  assert.equal(fn(maze,'explorerPosition')(a,b,.5).col,1);
  b.runToken=a.runToken;assert.equal(fn(maze,'explorerPosition')(a,b,.5,true).col,1);
});
test('maze routes are bounded to the latest 240 cells',()=>{
  const s=board();const route=Array.from({length:2000},(_,i)=>i%2);
  const segments=fn(maze,'routeSegments')(s,route,new Set([0,1]));
  assert.ok(segments.reduce((n,segment)=>n+segment.length,0)<=240);
});
