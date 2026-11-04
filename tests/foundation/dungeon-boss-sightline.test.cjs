'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-dungeon/cinematic-chapter-plan.js'),'utf8');
const planner=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
function scene(heroX=13,bossX=14){
 return {tick:10,phase:'exploring',map,bossRecovery:{remaining:3},guardianWard:false,bossWarning:null,units:[
  {id:'vanguard',kind:'vanguard',faction:'party',x:heroX,z:9,hp:100},
  {id:'warden',kind:'warden',faction:'enemy',x:bossX,z:9,hp:200}
 ]};
}
test('a real boundary Warden counter chooses the living hero foreground and two distinguishable physical silhouettes',async()=>{
 const {planBossDuelSightline}=await planner(),s=scene();
 const shot={mode:'warden-exposed',subjects:['vanguard','warden'],warning:false};
 const before=JSON.stringify(s),look={x:4.1,z:0},offsets=[6.5,7.55,3.6];
 const actual=planBossDuelSightline(s,shot,look,offsets,{width:1440,height:832,fov:48});
 assert.ok(actual,'an authentic boss counter near the edge requires a safe visual camera');
 assert.equal(actual.sightline.heroId,'vanguard');
 assert.equal(actual.sightline.recovered,true);
 assert.ok(actual.sightline.heroDepthLead>0,'the 3D protagonist must stand in front, not behind giant armor');
 assert.ok(actual.sightline.projectedSeparation>0,'real bodies must not be stacked in projection');
 assert.ok(Math.abs(actual.position.x)<=actual.boundaryLimit);
 assert.ok(Math.abs(actual.position.z)<=actual.boundaryLimit);
 assert.ok(Number.isFinite(actual.position.y)&&actual.position.y>4);
 assert.equal(JSON.stringify(s),before,'presentation must not mutate the authority snapshot');
});
test('Warden warning, incorrect actors, dead heroes and non-combat modes cannot invent an earned duel',async()=>{
 const {planBossDuelSightline}=await planner(),s=scene(),shot={mode:'warden-approach',subjects:['vanguard','warden']};
 const args=()=>[s,shot,{x:4.1,z:0},[6.5,7.55,3.6],{width:390,height:844,fov:52}];
 assert.ok(planBossDuelSightline(...args()));
 s.bossWarning={attackTick:11,shape:'NOVA',cells:[{x:13,z:9}]};
 assert.equal(planBossDuelSightline(...args()),null,'true warnings retain wide tactical framing');
 s.bossWarning=null;s.units[0].hp=0;
 assert.equal(planBossDuelSightline(...args()),null,'cannot film a dead hero as a fighting protagonist');
 s.units[0].hp=100;s.units[1].hp=0;
 assert.equal(planBossDuelSightline(...args()),null,'cannot conjure a defeated boss');
 s.units[1].hp=200;shot.mode='journey';
 assert.equal(planBossDuelSightline(...args()),null);
 assert.equal(planBossDuelSightline(s,{mode:'warden-contact',subjects:['no-party']},{x:0,z:0},[4,8,5]),null);
});
test('the mobile encounter solver remains bounded and honest without introducing more light passes',async()=>{
 const {planBossDuelSightline}=await planner(),s=scene(8,9),shot={mode:'warden-contact',subjects:['vanguard','warden']};
 s.bossRecovery={remaining:0};
 const before=JSON.stringify(s);
 for(const aspect of [[390,844],[1440,832]]){
  const result=planBossDuelSightline(s,shot,{x:-.5,z:0},[4.4,7.5,4.4],{width:aspect[0],height:aspect[1],fov:48});
  assert.ok(result);
  assert.ok(result.sightline.heroDepthLead>0);
  assert.ok(result.sightline.candidateCount===48);
  assert.ok(Number.isFinite(result.sightline.silhouetteGap));
 }
 assert.equal(JSON.stringify(s),before);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planBossDuelSightline\(state,cinematicShot,look,offsets/);
 assert.match(app,/const basePlannedCamera=duelCamera\?\?vistaCamera\?\?authoredCamera/,
  'the real Warden duel still has first framing priority');
 assert.match(app,/const plannedCamera=occlusionCamera\?\?basePlannedCamera/,
  "the physical camera's bounded body-visibility correction must remain applied");
 assert.match(app,/duelSightline:duelCamera\?\.sightline\?\?null/);
 assert.match(app,/__DUNGEON_RENDER_DIAGNOSTICS__\.autoDirector=autoDirector/);
});


test('actual within-cell modeled positions improve camera choice, not a hypothetical grid-only silhouette',async()=>{
 const {planBossDuelSightline}=await planner(),s=scene();
 const shot={mode:'warden-exposed',subjects:['vanguard','warden']};
 const view={x:4.1,z:0},offsets=[6.5,7.55,3.6],lens={width:1440,height:832,fov:48};
 const grid=planBossDuelSightline(s,shot,view,offsets,lens);
 const actual=new Map([
  ['vanguard',{at:{x:3.69,z:0}}],
  ['warden',{at:{x:5.38,z:0}}]
 ]);
 const posed=planBossDuelSightline(s,shot,view,offsets,{...lens,visualActors:actual});
 assert.ok(posed.sightline.renderedActorStaging);
 assert.ok(posed.sightline.heroDepthLead>0);
 assert.ok(posed.sightline.silhouetteGap>grid.sightline.silhouetteGap,
  'the real, legally staged foreground duel should gain screen-space breathing room');
 assert.equal(s.units[0].x,13);assert.equal(s.units[1].x,14);
 const fake=new Map([['vanguard',{at:{x:99,z:99}}],['warden',{at:{x:NaN,z:0}}]]);
 const ignored=planBossDuelSightline(s,shot,view,offsets,{...lens,visualActors:fake});
 assert.equal(ignored.sightline.renderedActorStaging,false,
  'bad, stale or off-cell cosmetics cannot influence physical camera decisions');
});
