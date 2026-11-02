'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function policy(){
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/encounter-sightlines.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const map=Array.from({length:19},()=>'.'.repeat(19));
const sample=()=>({map,units:[
 {id:'vanguard',faction:'party',kind:'vanguard',hp:50,x:8,z:9},
 {id:'mystic',faction:'party',kind:'mystic',hp:30,x:9,z:10},
 {id:'ranger',faction:'party',kind:'ranger',hp:0,x:12,z:12},
 {id:'warden',faction:'enemy',kind:'warden',hp:100,x:10,z:9},
 {id:'revenant',faction:'enemy',kind:'revenant',hp:22,x:8,z:10}
]});
test('boss-combat camera subjects include the real living Warden and surviving heroes only',async()=>{
 const {planEncounterSightlines}=await policy(),s=sample();
 const before=JSON.stringify(s);
 assert.deepEqual(planEncounterSightlines(s,{x:0,z:0},true),[
  {x:-1,z:0},{x:0,z:1},{x:1,z:0}
 ]);
 assert.equal(JSON.stringify(s),before,'render visibility policy must not mutate authority');
});
test('normal traversal does not clear paths to distant boss and dead targets',async()=>{
 const {planEncounterSightlines}=await policy(),s=sample();
 assert.deepEqual(planEncounterSightlines(s,{x:0,z:0},false),[{x:-1,z:0},{x:0,z:1}]);
 s.units[3].hp=0;
 assert.deepEqual(planEncounterSightlines(s,{x:0,z:0},true),[{x:-1,z:0},{x:0,z:1}]);
});
test('bounded sightline policy uses actual map centre and never trusts malformed positions',async()=>{
 const {planEncounterSightlines}=await policy();
 const s={map:Array.from({length:13},()=>'.'.repeat(13)),units:[
  {faction:'party',hp:1,x:7,z:6},
  {kind:'warden',hp:1,x:8,z:6},
  {faction:'party',hp:1,x:NaN,z:8},
  ...Array.from({length:120},(_,i)=>({faction:'party',hp:1,x:6+(i%2),z:6}))
 ]};
 const p=planEncounterSightlines(s,{x:0,z:0},true);
 assert.deepEqual(p,[{x:1,z:0},{x:0,z:0},{x:1,z:0},{x:0,z:0},{x:2,z:0}].slice(0,p.length),'expected ordered bounded independent subjects');
 assert.ok(p.length<=5);
 assert.ok(p.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z)));
 assert.deepEqual(planEncounterSightlines(null,{x:1,z:2},true),[{x:1,z:2}]);
 assert.deepEqual(planEncounterSightlines(null,{x:NaN,z:2},true),[{x:0,z:0}]);
});
test('the real stream wires the deterministic render-only policy through strict same-origin routing',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/import \{planEncounterSightlines\} from '\/dungeon\/encounter-sightlines\.js'/);
 assert.match(app,/planEncounterSightlines\(state,target,Boolean\(bossDistance\)\)/);
 assert.ok(server.includes("['/dungeon/encounter-sightlines.js','encounter-sightlines.js']"));
});

test('live unobstructed melee shows the real hostile target without enlarging every room',async()=>{
 const {planEncounterSightlines}=await policy(),s=sample();
 s.tick=15;s.units[0].action='attack';s.units[0].actionTick=15;s.units[0].targetId='revenant';
 assert.deepEqual(planEncounterSightlines(s,{x:0,z:0},false),[
  {x:-1,z:0},{x:0,z:1},{x:-1,z:1}
 ]);
 s.units[0].targetId='warden';
 assert.deepEqual(planEncounterSightlines(s,{x:0,z:0},true),[
  {x:-1,z:0},{x:0,z:1},{x:1,z:0}
 ],'warden priority cannot double-count a boss silhouette');
});
test('hostile sightline is suppressed for stale actions, dead targets and obstructed or diagonal lanes',async()=>{
 const {planEncounterSightlines}=await policy(),s=sample();
 s.tick=30;s.units[0].action='attack';s.units[0].actionTick=30;s.units[0].targetId='revenant';
 assert.equal(planEncounterSightlines(s,{x:0,z:0},false).length,3);
 s.units[0].actionTick=20;
 assert.equal(planEncounterSightlines(s,{x:0,z:0},false).length,2);
 s.units[0].actionTick=30;s.units[4].hp=0;
 assert.equal(planEncounterSightlines(s,{x:0,z:0},false).length,2);
 s.units[4].hp=20;s.units[4].x=8;s.units[4].z=12;
 s.map=s.map.map((row,z)=>z===11?row.substring(0,8)+'#'+row.substring(9):row);
 assert.equal(planEncounterSightlines(s,{x:0,z:0},false).length,2);
 s.units[4].x=10;s.units[4].z=10;
 assert.equal(planEncounterSightlines(s,{x:0,z:0},false).length,2);
});
