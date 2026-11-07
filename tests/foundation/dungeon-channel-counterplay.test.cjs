'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime,planThreatInterceptions}=require('../../dist/games/ai-dungeon/src/index.js');
function fixture(){
 const game=DungeonRuntime.create('m1-actual-channel-intercept'),s=game.state;
 s.map=Array.from({length:19},(_,z)=>z===0||z===18?'#'.repeat(19):'#'+'.'.repeat(17)+'#');
 s.exit={x:17,z:17};s.traps=[];s.tick=4;
 for(const u of s.units)if(u.faction==='enemy')u.hp=0;
 const hero=s.units.find(u=>u.id==='ranger'),ally=s.units.find(u=>u.id==='mystic');
 Object.assign(s.units.find(u=>u.id==='vanguard'),{x:10,z:10});
 Object.assign(hero,{x:4,z:4,hp:hero.maxHp});Object.assign(ally,{x:4,z:8,hp:ally.maxHp});
 const channel={id:'charged-cult',kind:'cultist',faction:'enemy',x:4,z:7,hp:32,maxHp:32,attack:7,cooldown:0,
  action:'guard',actionTick:4,channelUntilTick:5,channelTargetId:'mystic',channelX:4,channelZ:8};
 const bait={id:'near-bait',kind:'revenant',faction:'enemy',x:5,z:4,hp:72,maxHp:72,attack:4,cooldown:0,
  action:'idle',actionTick:4};
 s.units.push(channel,bait);
 return{game,s,hero,ally,channel,bait};
}
test('autonomous ranger spends a real shot to stop the saved cultist attack, not a nearer nuisance',()=>{
 const {game,hero,channel,bait}=fixture(),before=game.save(),oldHP=channel.hp,baitHP=bait.hp;
 const result=game.step();
 assert.ok(channel.hp<oldHP);assert.equal(bait.hp,baitHP);
 assert.equal(channel.channelUntilTick,undefined);
 assert.equal(hero.action,'attack');assert.equal(hero.targetId,channel.id);
 assert.ok(result.events.some(e=>e.kind==='interrupt'&&e.text.includes('cultist hex')));
 const restored=DungeonRuntime.restore(before);
 assert.deepEqual(restored.step(),result);
 for(let i=0;i<35;i++)assert.equal(game.step().checksum,restored.step().checksum);
});
test('no candidate if the marked ally escapes, cast expires or warning is not imminent',()=>{
 const {s,hero,ally,channel}=fixture();
 assert.deepEqual(planThreatInterceptions(s,hero).map(u=>u.id),[channel.id]);
 ally.z=9;assert.deepEqual(planThreatInterceptions(s,hero),[]);
 ally.z=8;channel.channelUntilTick=s.tick-1;assert.deepEqual(planThreatInterceptions(s,hero),[]);
 channel.channelUntilTick=s.tick+3;assert.deepEqual(planThreatInterceptions(s,hero),[]);
});
test('real recorded interruption has a distinct, deduplicated original sound cue',async()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/soundstage-plan.js'),'utf8');
 const {planSoundCues}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
 const old={tick:4,run:1,floor:1,units:[]};
 const next={tick:5,run:1,floor:1,units:[],events:[{tick:5,kind:'interrupt',text:'ranger interrupted cultist hex with a real hit'}]};
 const cues=planSoundCues(old,next);
 assert.ok(cues.some(c=>c.kind==='interrupt'));assert.ok(!cues.some(c=>c.kind==='opening'));
 assert.deepEqual(planSoundCues(next,next),[]);
});
