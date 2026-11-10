'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name),'utf8')).toString('base64'));
test('camera-sided physical stage retains full-height Gothic rear nave without blocking the living foreground',async()=>{
 const {planPartyWallReveal:r}=await load('party-visibility-plan.js');
 const c={x:6,z:0},hero={x:0,z:0,silhouetteRecess:true},ordinary={x:0,z:0};
 assert.equal(r(-1.3,-1,[hero],c),'none','rear chapel walls keep full height');
 assert.equal(r(1.3,1,[hero],c),'sightline','genuine foreground must clear');
 assert.equal(r(-1.3,-1,[ordinary],c),'none','plain scenic points cannot flatten rear rooms');
 assert.equal(r(-2.8,-.4,[hero],c),'none');
 assert.equal(r(-2.9,1.8,[hero],c),'none');
});
test('real contact has more room than travel; unmarked or remote space is retained',async()=>{
 const {planPartyWallReveal:r}=await load('party-visibility-plan.js');
 const c={x:6,z:0},hero={x:0,z:0,silhouetteRecess:true};
 assert.equal(r(-2.3,1.2,[{...hero,combatRecess:true}],c),'none');
 assert.equal(r(-1.8,1.3,[{...hero,combatRecess:true}],c),'none');
 assert.equal(r(1.8,1.3,[{...hero,combatRecess:true}],c),'sightline');
 assert.equal(r(-2.3,1.2,[hero],c),'none');
 assert.equal(r(-1.8,1.3,[hero],c),'none',
  'rear flank masonry keeps its tall, sculptural surface rather than an empty bowl');
 assert.equal(r(1.8,1.3,[hero],c),'sightline',
  'real actor boots remain readable in the camera-facing fighting area');
 assert.equal(r(-2.9,1.8,[{...hero,combatRecess:true}],c),'none');
 assert.equal(r(0,5,[{...hero,combatRecess:true}],c),'none');
 assert.equal(r(-1.8,1.3,[{x:0,z:0,combatRecess:false}],c),'none');
});
test('hero-scale journey and contact keep Warden warning tactically wide',async()=>{
 const {planReadableExpeditionLens:plan}=await load('cinematic-chapter-plan.js');
 const shot=m=>({mode:m,offsets:[5,8.2,5.65],subjects:['vanguard']});
 const j=plan(shot('journey')),c=plan(shot('contact')),w=plan(shot('warden-warning'));
 assert.ok(Math.hypot(j.offsets[0],j.offsets[2])<=5.6&&j.offsets[1]<=4.75);
 assert.ok(Math.hypot(c.offsets[0],c.offsets[2])<=5.1&&c.offsets[1]<=4.8);
 assert.ok(w.offsets[1]>c.offsets[1]+4);
 assert.ok(Math.hypot(w.offsets[0],w.offsets[2])>Math.hypot(c.offsets[0],c.offsets[2])+3);
});


test('authentic Warden counter earns a visible adult-body duel on desktop/mobile without shrinking the real warning',async()=>{
 const {planReadableExpeditionLens:plan}=await load('cinematic-chapter-plan.js');
 const original={mode:'warden-counter',offsets:[5,8,5],subjects:['vanguard','warden']};
 const originalJSON=JSON.stringify(original);
 const pixels=(lens,height)=>{
  const distance=Math.hypot(Math.hypot(lens.offsets[0],lens.offsets[2]),lens.offsets[1]-lens.lookY);
  return 1.8*height/(2*distance*Math.tan(lens.fov*Math.PI/360));
 };
 for(const view of [{width:1440,height:832},{width:390,height:844}]){
  const lens=mode=>plan({...original,mode},view);
  const counter=lens('warden-counter'),contact=lens('warden-contact'),
   exposed=lens('warden-exposed'),warning=lens('warden-warning'),release=lens('warden-release');
  assert.ok(pixels(counter,view.height)>=1.27*pixels(contact,view.height),
   'actual counter must show a materially larger physical performer and blade');
  assert.ok(pixels(exposed,view.height)>pixels(release,view.height)*1.22,
   'recovery should be readable after a true wide release');
  assert.ok(pixels(warning,view.height)<pixels(counter,view.height)*.67,
   'a real Warden telegraph must still show the wide tactical danger floor');
  assert.ok(warning.offsets[1]>counter.offsets[1]+4,'telegraph must retain high camera');
  assert.ok([counter,contact,exposed,warning,release].every(x=>x.offsets.every(Number.isFinite)&&Number.isFinite(x.fov)));
 }
 assert.equal(JSON.stringify(original),originalJSON,'render plan must never mutate public game state');
 assert.equal(plan(original,{width:390,height:844,reducedMotion:true}).following,1);
});

test('a genuinely sealed Warden films the live defender skirmish rather than shrinking the acting party behind the boss',async()=>{
 const {planCinematicShot,planReadableExpeditionLens}=await load('cinematic-chapter-plan.js');
 const map=Array.from({length:19},()=>'.'.repeat(19));
 const s={run:1,floor:1,tick:32,phase:'exploring',map,guardianWard:true,
  bossRecovery:{remaining:0},bossWarning:null,units:[
   {id:'vanguard',kind:'vanguard',faction:'party',hp:72,x:9,z:9,action:'attack'},
   {id:'mystic',kind:'mystic',faction:'party',hp:40,x:8,z:9},
   {id:'warden',kind:'warden',faction:'enemy',hp:180,x:12,z:9,action:'idle'},
   {id:'revenant',kind:'revenant',faction:'enemy',hp:34,x:10,z:9,action:'attack'}
  ]};
 const original=JSON.stringify(s),phone={width:390,height:844,focusedHeroId:'vanguard'};
 const guardApproach=planCinematicShot(s,null,phone);
 assert.equal(guardApproach.mode,'skirmish-approach');
 assert.deepEqual(guardApproach.subjects,['vanguard','revenant']);
 const realContact={mode:'contact',actorId:'vanguard',targetId:'revenant',x:9.5,z:9};
 const guardContact=planCinematicShot(s,realContact,phone);
 assert.equal(guardContact.mode,'contact');
 assert.deepEqual(guardContact.subjects,['vanguard','revenant']);
 const closeLens=planReadableExpeditionLens(guardContact,phone);
 const watchDistance=Math.hypot(closeLens.offsets[0],closeLens.offsets[1],closeLens.offsets[2]);
 s.guardianWard=false;
 const unsealed=planCinematicShot(s,realContact,phone);
 assert.equal(unsealed.mode,'warden-approach','an unsealed actual boss supersedes remote guardian contact');
 const bossLens=planReadableExpeditionLens(unsealed,phone);
 assert.ok(watchDistance<Math.hypot(...bossLens.offsets)-1.2,
  'the live sealed-guard fight must be shown at visibly more human scale');
 s.guardianWard=true;
 s.bossWarning={attackTick:33,shape:'NOVA',cells:[{x:12,z:9}]};
 const warned=planCinematicShot(s,realContact,phone);
 assert.equal(warned.mode,'warden-warning','real lethal warning always owns the camera');
 assert.ok(planReadableExpeditionLens(warned,phone).dangerPriority);
 s.bossWarning=null;s.units[3].hp=0;
 assert.equal(planCinematicShot(s,null,phone).mode,'warden-approach',
  'no fictitious guardian encounter after the genuine defender dies');
 s.units[3].hp=34;s.guardianWard=true;
 assert.equal(JSON.stringify(s),original,'read-only director must not alter authoritative state');
});

test('actual filmed guardian and contact keep human-scale actors despite a distant autonomous companion',async()=>{
 const {planCinematicShot:shot,planReadableExpeditionLens:lens}=await load('cinematic-chapter-plan.js');
 const map=Array.from({length:19},()=>'.'.repeat(19));
 const near={run:1,floor:1,tick:40,phase:'exploring',map,guardianWard:true,
  bossRecovery:{remaining:0},bossWarning:null,units:[
   {id:'vanguard',kind:'vanguard',faction:'party',hp:70,x:9,z:9,action:'attack'},
   {id:'mystic',kind:'mystic',faction:'party',hp:40,x:9,z:8},
   {id:'ranger',kind:'ranger',faction:'party',hp:44,x:8,z:9},
   {id:'warden',kind:'warden',faction:'enemy',hp:180,x:12,z:9,action:'idle'},
   {id:'revenant',kind:'revenant',faction:'enemy',hp:32,x:10,z:9,action:'attack'}
  ]};
 const far=structuredClone(near);far.units[1].x=1;far.units[1].z=1;
 far.units[2].x=17;far.units[2].z=17;
 const originalNear=JSON.stringify(near),originalFar=JSON.stringify(far);
 const view={width:390,height:844,focusedHeroId:'vanguard'};
 for(const encounter of [null,{mode:'contact',actorId:'vanguard',targetId:'revenant',x:9.5,z:9}]){
  const a=shot(near,encounter,view),b=shot(far,encounter,view);
  assert.equal(a.mode,encounter?'contact':'skirmish-approach');
  assert.equal(b.mode,a.mode);
  assert.deepEqual(b.subjects,a.subjects);
  assert.deepEqual(b.offsets,a.offsets,
   'a distant living party member must not zoom out the authenticated local fight');
  assert.deepEqual(lens(b,view).offsets,lens(a,view).offsets);
  const closer=lens(b,view),stable=lens(b,{...view,reducedMotion:true});
  assert.ok(Math.hypot(...closer.offsets)<Math.hypot(...stable.offsets)*.92,
   'real portrait actor pair must use an actual closer optical lens, not only source offsets');
  assert.ok(closer.fov<stable.fov,'portrait contact preserves a tighter real subject envelope');
 }
 // An actual dangerous Warden telegraph is NOT a cosmetic duel. It remains
 // a wide tactical picture, with warning priority irrespective of companions.
 near.bossWarning={attackTick:41,shape:'NOVA',cells:[{x:12,z:9}]};
 far.bossWarning=structuredClone(near.bossWarning);
 const wideNear=shot(near,null,view),wideFar=shot(far,null,view);
 assert.equal(wideNear.mode,'warden-warning');assert.equal(wideFar.mode,'warden-warning');
 assert.ok(lens(wideNear,view).dangerPriority&&lens(wideFar,view).dangerPriority);
 assert.ok(Math.hypot(...wideFar.offsets)>Math.hypot(...wideNear.offsets),
  'wide warning still accounts for separated living allies');
 near.bossWarning=null;far.bossWarning=null;
 assert.equal(JSON.stringify(near),originalNear);
 assert.equal(JSON.stringify(far),originalFar);
});
