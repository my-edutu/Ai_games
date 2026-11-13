'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/party-visibility-plan.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const actors=()=>new Map([
 ['vanguard',{root:{visible:true,position:{x:-1,z:0}}}],
 ['revenant',{root:{visible:true,position:{x:0,z:0}}}]
]);
test('one real rooted walkable hero versus one live hostile owns a narrow physical combat lane',async()=>{
 const {resolveRenderedSilhouetteSubjects:resolve}=await load();
 const state={map,units:[
  {id:'vanguard',kind:'vanguard',faction:'party',hp:80,x:8,z:9,action:'move'},
  {id:'revenant',kind:'revenant',faction:'enemy',hp:50,x:9,z:9,action:'move'}
 ]};
 const before=JSON.stringify(state),a=actors();
 const subjects=resolve(state,[{x:-1,z:0,kind:'vanguard'}],a);
 assert.equal(subjects[0].visibleActor,true);
 assert.equal(subjects[0].unitId,'vanguard');
 assert.equal(subjects[0].combatRecess,true,'actual nearby opposing living fighter counts even during footwork');
 assert.deepEqual(subjects[0].duelPartner,{x:0,z:0});
 assert.equal(JSON.stringify(state),before,'presentation must never edit authority');
 state.units[1].hp=0;
 const dead=resolve(state,[{x:-1,z:0,kind:'vanguard'}],a);
 assert.equal(dead[0].combatRecess,false);
 assert.equal(dead[0].duelPartner,null);
 state.units[1].hp=50;state.units[1].x=15;a.get('revenant').root.position.x=6;
 assert.equal(resolve(state,[{x:-1,z:0,kind:'vanguard'}],a)[0].duelPartner,null,
  'remote living hostiles cannot cut away an unrelated landmark');
 a.get('revenant').root.visible=false;state.units[1].x=9;a.get('revenant').root.position.x=0;
 assert.equal(resolve(state,[{x:-1,z:0,kind:'vanguard'}],a)[0].duelPartner,null,
  'unrendered fighters cannot erase visible geometry');
});
test('authentic bounded blade space can clear a blocking original foreground pillar without flattening the rear scene',async()=>{
 const {planProjectedBodyAperture,planPortraitStageClearance}=await load();
 const camera={x:6,y:3,z:0},view={look:{x:0,y:1,z:0},fov:50,aspect:.52};
 const plain={x:0,z:0,kind:'vanguard',visibleActor:true,combatRecess:true};
 const paired={...plain,duelPartner:{x:0,z:2}};
 // Find a physically projected column that covers only the ground/contact
 // lane, not the native torso/head. The search is bounded and deterministic.
 let witness=null;
 for(const x of [1.6,2.0,2.4,2.8,3.2,3.6]){
  for(const z of [.45,.65,.85,1.05,1.25,1.45]){
   const b=[x,.12,z,x+.3,2.6,z+.22];
   if(planProjectedBodyAperture(b,[paired],camera,view)&&
      !planProjectedBodyAperture(b,[plain],camera,view)){witness=b;break}
  }
  if(witness)break;
 }
 assert.ok(witness,'at least one true foreground column blocks the live attack lane but not the body');
 const rear=[-2,.1,.7,-1.7,2.5,1.0];
 assert.equal(planProjectedBodyAperture(rear,[paired],camera,view),false);
 assert.equal(planPortraitStageClearance(rear,[paired],camera,view),false);
 assert.equal(planProjectedBodyAperture(witness,[{...plain,duelPartner:{x:0,z:10}}],camera,view),false,
  'no speculative full-room clearing for an opponent beyond an actual melee lane');
 assert.equal(planProjectedBodyAperture(witness,[{x:0,z:0,combatRecess:true,duelPartner:{x:0,z:2}}],camera,view),false,
  'an arbitrary scenic point cannot borrow rooted combat visibility');
});
