'use strict';
// Regression for genuine first native danger episode, source tick 474->489:
// desktop skipped 15 ticks and discarded the original guardian doorway,
// while portrait saw tick 480 and retained it. NOT a native-film pass.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const modulePath=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/source-immutable-crossing-browser-bridge.mjs');
const helper=import(pathToFileURL(modulePath).href);
const oldCap=Object.freeze({id:'f8:cap',x:115200,y:3212000,width:249600,height:12000});
const threshold=oldCap.x+Math.floor(oldCap.width*.76);
const ground=Object.freeze({id:'f9:ground',x:0,y:3212000,width:480000,height:12000});
const prior={floor:8,theme:'clockwork',runToken:'original-episode',tick:474,
  enemies:[{kind:'guardian',active:false,health:0}],
  player:{grounded:true,groundedPlatformId:'f8:cap'}};
const candidate={floor:9,theme:'void',lifecycle:'running',runToken:'original-episode',tick:489,
  player:{grounded:true,groundedPlatformId:'f9:ground'},
  lastGuardianCrossing:{runToken:'original-episode',sourceTick:475,fromFloor:8,toFloor:9,
    exitX:threshold,cap:oldCap,guardian:{kind:'guardian',active:false,health:0}}};
test('real first desktop F9 15-tick sparse arrival retains the original door only with immutable HP0 and shared roof',async()=>{
 const {observedImmutableCrossingSparseBrowserBridge}=await helper;
 const check=(p=prior,n=candidate,c=oldCap,g=ground,t=threshold)=>
   observedImmutableCrossingSparseBrowserBridge(p,n,c,g,t);
 assert.equal(check()?.maxSparseTicks,20);
 assert.equal(check(prior,{...candidate,tick:494})?.maxSparseTicks,20);
 assert.equal(check(prior,{...candidate,tick:495}),null,'20-tick hard bound');
 assert.equal(check(prior,{...candidate,tick:480})?.sourceTick,475,
   'portrait fast arrival remains eligible');
 for(const invalid of [
  {...candidate,runToken:'foreign'},
  {...candidate,lastGuardianCrossing:null},
  {...candidate,lastGuardianCrossing:{...candidate.lastGuardianCrossing,runToken:'foreign'}},
  {...candidate,lastGuardianCrossing:{...candidate.lastGuardianCrossing,sourceTick:474}},
  {...candidate,lastGuardianCrossing:{...candidate.lastGuardianCrossing,exitX:threshold+1}},
  {...candidate,lastGuardianCrossing:{...candidate.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:1}}},
  {...candidate,lastGuardianCrossing:{...candidate.lastGuardianCrossing,cap:{...oldCap,width:oldCap.width-1}}},
  {...candidate,player:{grounded:false,groundedPlatformId:null}},
  {...candidate,player:{grounded:true,groundedPlatformId:'f9:fake'}}
 ]) assert.equal(check(prior,invalid),null,'invalid source cannot prolong original GPU owner');
 assert.equal(check({...prior,enemies:[{kind:'guardian',active:true,health:2}]}),null);
 assert.equal(check(prior,candidate,oldCap,{...ground,y:ground.y-1}),null);
 assert.equal(check(prior,candidate,oldCap,ground,threshold+1),null);
});
test('production world pre-stage consumes the evidence at the sparse observation guard',()=>{
 const world=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/observedImmutableCrossingSparseBrowserBridge\(previous,next,authored,ground,threshold\)/);
 assert.match(world,/immutableSparseBridge\?\.maxSparseTicks/);
});
