'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,'public/ai-dungeon',file),'utf8');
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const loadPlan=()=>import(url(read('soundstage-plan.js')));
const unit=(id,kind,faction,hp,maxHp=60)=>({id,kind,faction,hp,maxHp,x:2,z:2,
 action:'idle',actionTick:10});
const snap=(tick,units,run=1,floor=1)=>({tick,run,floor,units,events:[],
 phase:'exploring',map:['.....','.....','.....','.....','.....']});

test('three authored physical material timbres require genuine positive HP loss',async()=>{
 const {planConfirmedImpactMaterial:material}=await loadPlan();
 for(const [kind,expected] of [
  ['vanguard','iron'],['warden','iron'],['revenant','bone'],
  ['cultist','cloth'],['ranger','cloth'],['mystic','cloth']]){
  const prior=snap(10,[unit('victim',kind,'enemy',60)]);
  const after=snap(11,[unit('victim',kind,'enemy',43)]);
  const cue=material(prior,after,'victim');
  assert.ok(cue&&Object.isFrozen(cue));
  assert.equal(cue.material,expected);
  assert.equal(cue.damage,17);
  assert.ok(cue.strength>=.44&&cue.strength<=1);
  assert.equal(cue.tick,11);
  assert.equal(material(after,after,'victim'),null,'no duplicate tone');
  assert.equal(material(prior,snap(11,[unit('victim',kind,'enemy',60)]),'victim'),null,'hurt alone is silent');
  assert.equal(material(prior,snap(11,[unit('victim',kind,'enemy',61)]),'victim'),null,'healing is not a strike');
  assert.equal(material(prior,snap(11,[unit('victim',kind,'enemy',43)],2),'victim'),null,'run boundary');
  assert.equal(material(prior,snap(11,[unit('victim',kind,'enemy',43)],1,2),'victim'),null,'floor boundary');
  assert.equal(material(prior,snap(17,[unit('victim',kind,'enemy',43)]),'victim'),null,'stale poll');
  assert.equal(material(prior,snap(11,[unit('victim',kind,'party',43)]),'victim'),null,'replaced faction');
 }
 assert.equal(material(snap(10,[unit('hero','vanguard','party',60)]),
  snap(11,[unit('hero','vanguard','party',43)]),'other'),null,'no anonymous attacker inference');
});
test('real soundstage keeps original opt-in, bounded foley, one true-material hit and one shared 215ms contact',async()=>{
 const plan=url(read('soundstage-plan.js'));
 const facing=url(read('facing-plan.js'));
 const foley=url(read('material-foley.js'));
 const impact=url(read('impact-choreography-plan.js'));
 const source=read('soundstage.js')
  .replace("'/dungeon/soundstage-plan.js'","'"+plan+"'")
  .replace("'/dungeon/facing-plan.js'","'"+facing+"'")
  .replace("'/dungeon/material-foley.js'","'"+foley+"'")
  .replace("'/dungeon/impact-choreography-plan.js'","'"+impact+"'");
 const {createDungeonSoundstage}=await import(url(source));
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},
  cancelScheduledValues(){},setTargetAtTime(){}});
 const filters=[],tones=[];
 const node=()=>({connect(){},disconnect(){}});
 const ctx={state:'running',currentTime:2,sampleRate:44100,destination:node(),
  createGain:()=>({...node(),gain:param()}),
  createOscillator:()=>({...node(),type:'sine',frequency:param(),
    start(){},stop(){}}),
  createBuffer:(_channels,count)=>({getChannelData:()=>new Float32Array(count)}),
  createBufferSource:()=>({...node(),playbackRate:{value:1},start(){},stop(){}}),
  createBiquadFilter:()=>{const filter={...node(),frequency:{value:0},Q:{value:0}};
   filters.push(filter);return filter}
 };
 const stage=createDungeonSoundstage(ctx);
 assert.equal(stage.stats().started,false);
 assert.equal(stage.enable(),true);
 const prev=snap(10,[{...unit('hero','vanguard','party',60),x:2,z:2},
  {...unit('boss','warden','enemy',60),x:3,z:2}]);
 const next=snap(11,[{...prev.units[0],action:'attack',actionTick:11,targetId:'boss'},
  {...prev.units[1],hp:43}]);
 stage.acceptSnapshot(prev);stage.acceptSnapshot(next);
 assert.equal(stage.stats().confirmedMaterialImpacts,0,'before physical contact');
 for(let i=0;i<4;i++)stage.advanceVisualFrame(.05);
 assert.equal(stage.stats().confirmedMaterialImpacts,0,'not before 215ms');
 stage.advanceVisualFrame(.05);
 const stats=stage.stats();
 assert.equal(stats.confirmedMaterialImpacts,1,'one proven HP loss');
 assert.equal(stats.lastMaterialImpact.material,'iron');
 assert.equal(stats.lastMaterialImpact.victimId,'boss');
 assert.equal(stats.lastMaterialImpact.tick,11);
 assert.equal(stats.foley.confirmedImpactMaterials.iron,1);
 assert.ok(filters.some(f=>f.frequency.value===1240),'original plate transient emitted');
 stage.acceptSnapshot(next);
 assert.equal(stage.stats().confirmedMaterialImpacts,1,'duplicate poll silent');
 assert.ok(stats.voiceCap<=10,'bounded opt-in voices');
 stage.disable();
 assert.equal(stage.stats().enabled,false);
 stage.dispose();
});
