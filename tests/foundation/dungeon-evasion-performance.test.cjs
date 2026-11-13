'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(read('public/ai-dungeon/evasion-performance-plan.js')).toString('base64'));
const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>x===0||z===0||x===18||z===18?'#':'.').join(''));
const hero=(kind,x,z,tick,action='move')=>({id:kind,kind,faction:'party',x,z,hp:50,action,actionTick:tick});
test('actual same-tick semantic event and exactly one legal party move are required for an escape',async()=>{
 const {planAuthorityEvasions:plan}=await load();
 const old={run:1,floor:1,tick:14,map,units:[hero('vanguard',8,8,14,'idle')]};
 const next={...old,tick:15,phase:'exploring',units:[hero('vanguard',9,8,15)],
  events:[{kind:'evade',tick:15,text:'vanguard moved toward clear stone before the Warden strike'}]};
 const beats=plan(old,next);assert.equal(beats.length,1);
 assert.equal(beats[0].threat,'warden-warning');assert.deepEqual(beats[0].from,{x:8,z:8});
 assert.equal(plan(old,{...next,events:[]}).length,0);
 assert.equal(plan(old,{...next,events:[{kind:'evade',tick:14,text:next.events[0].text}]}).length,0);
 assert.equal(plan(old,{...next,units:[hero('vanguard',10,8,15)]}).length,0);
 assert.equal(plan(old,{...next,units:[hero('vanguard',9,8,15,'idle')]}).length,0);
 assert.equal(plan(old,{...next,run:2}).length,0);
 assert.equal(plan(old,{...next,floor:2}).length,0);
 assert.equal(plan(old,{...next,tick:19}).length,0);
});
test('locked cultist hex and revenant breach each require their own genuine successful hero dodge',async()=>{
 const {planAuthorityEvasions:plan}=await load();
 const old={run:1,floor:1,tick:22,map,units:[hero('ranger',5,5,22,'idle'),hero('mystic',7,7,22,'idle')]};
 const next={...old,tick:23,phase:'exploring',units:[hero('ranger',5,6,23),hero('mystic',7,6,23)],
  events:[{kind:'evade',tick:23,text:'ranger slipped away from the marked shadow hex'},
   {kind:'evade',tick:23,text:'mystic slipped away from the marked revenant breach'}]};
 assert.deepEqual(plan(old,next).map(x=>x.threat),['shadow-hex','revenant-breach']);
 assert.equal(plan(old,{...next,events:[{kind:'evade',tick:23,text:'The revenant shield-break struck empty stone'}]}).length,0);
});
test('coherent dodge poses differ by role, are deterministic, bounded and respect reduced motion',async()=>{
 const {planEvasionPerformance:pose,EVASION_BEAT_DURATION:limit}=await load();
 const beat={kind:'vanguard',dx:1,dz:0};
 const anticipation=pose('vanguard',.075,beat),strike=pose('vanguard',.23,beat);
 assert.ok(anticipation.root.y<0&&strike.root.x>.035&&strike.root.roll<-.04);
 assert.ok(Math.abs(strike.legs.left.upper)>.1);
 assert.notDeepEqual(pose('ranger',.23,{...beat,kind:'ranger'}).legs,strike.legs);
 for(const t of [-Infinity,NaN,-1,0,.075,.23,.38,.51,limit,1,Infinity]){
  const v=pose('vanguard',t,beat);assert.deepEqual(v,pose('vanguard',t,beat));
  const num=[v.strength,...Object.values(v.root),...Object.values(v.spine),
   ...Object.values(v.arms.left),...Object.values(v.arms.right),...Object.values(v.elbows),
   ...Object.values(v.legs.left),...Object.values(v.legs.right)];
  assert.ok(num.every(n=>Number.isFinite(n)&&Math.abs(n)<=1.2));
  assert.equal(pose('vanguard',t,beat,{reducedMotion:true}).strength,0);
 }
 assert.equal(pose('vanguard',.2,{...beat,dx:2}).strength,0);
 assert.equal(pose('warden',.2,{...beat,kind:'warden'}).strength,0);
 assert.equal(pose('vanguard',limit,beat).strength,0);
 assert.doesNotMatch(read('public/ai-dungeon/evasion-performance-plan.js'),/Math\.random|Date\.|performance\.now|DungeonRuntime|fetch\(/);
});
test('actual renderer joints, bounded ground VFX, real opt-in audio and browser route are wired',()=>{
 const app=read('public/ai-dungeon/app.js'),model=read('public/ai-dungeon/model-assets.js');
 const combat=read('public/ai-dungeon/combat-director.js');
 assert.match(app,/planAuthorityEvasions\(previousState,s\)/);assert.match(app,/recordEvasions\(evasionBeats\)/);
 assert.match(model,/planEvasionPerformance/);assert.match(model,/evasionFrame.root/);
 assert.match(combat,/mode:'evade-dust'/);
 assert.match(read('public/ai-dungeon/soundstage-plan.js'),/evade:'evade'/);
 assert.match(read('scripts/serve-dungeon-stream.cjs'),/\/dungeon\/evasion-performance-plan\.js/);
});
