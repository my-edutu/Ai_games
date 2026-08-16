const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {SnakeRuntime}=require('../../dist/games/autonomous-snake/src/runtime/run.js');
const {EFFECT_IDS,generateEffectCandidates,enqueueInfluence,applyDueInfluence}=require('../../dist/games/autonomous-snake/src/influence/index.js');

function runtime(seed='effects'){return SnakeRuntime.create({width:16,height:12,targetLength:30,profile:'portals'},seed)}
function command(state,effectId,candidateId,overrides={}){return {schemaVersion:1,id:`cmd-${effectId}`,idempotencyKey:`key-${effectId}`,source:'vote',effectId,candidateId,scheduledTick:state.tick,expiresAtTick:state.tick+20,recordCategory:'chat-vs-ai',...overrides}}

test('all ten launch effects expose deterministic bounded candidate sets',()=>{
  const r=runtime();
  assert.equal(EFFECT_IDS.length,10);
  for(const id of EFFECT_IDS){
    const a=generateEffectCandidates(r.state,id),b=generateEffectCandidates(r.state,id);
    assert.deepEqual(a,b,id); assert.ok(a.length<=16,id);
    for(const c of a){assert.equal(typeof c.id,'string'); assert.ok(c.id.length<=80);}
  }
});

test('placement candidates never occupy the snake, current food, obstacle or active hazard',()=>{
  const r=runtime('placement');
  const blocked=new Set([...r.state.snake.body,...r.state.obstacles,...r.state.hazards,r.state.food].filter(x=>x!==null));
  for(const id of ['bonus-food','obstacle-choice','food-choice']){
    for(const c of generateEffectCandidates(r.state,id)) if(c.cell!==undefined) assert.equal(blocked.has(c.cell),false,`${id}:${c.cell}`);
  }
});

test('duplicate influence command is queued/applied at most once',()=>{
  const r=runtime('dedupe'), candidate=generateEffectCandidates(r.state,'safe-hint')[0];
  const cmd=command(r.state,'safe-hint',candidate.id);
  const once=enqueueInfluence(r.state,cmd),twice=enqueueInfluence(once.state,cmd);
  assert.equal(once.status,'queued'); assert.equal(twice.status,'duplicate');
  const applied=applyDueInfluence(twice.state,NamedRng.fromSeed('dedupe'));
  assert.equal(Object.keys(applied.state.influence.applied).length,1);
});

test('expired and terminal-state commands reject without mutating gameplay',()=>{
  const r=runtime('reject'), c=generateEffectCandidates(r.state,'fog-field')[0];
  const expired=enqueueInfluence(r.state,command(r.state,'fog-field',c.id,{expiresAtTick:r.state.tick-1}));
  assert.equal(expired.status,'rejected'); assert.equal(expired.reason,'expired');
  const terminal=structuredClone(r.state);terminal.lifecycle='result';
  const rejected=enqueueInfluence(terminal,command(terminal,'fog-field',c.id));
  assert.equal(rejected.status,'rejected'); assert.equal(rejected.reason,'lifecycle');
});

test('due effects are bounded, explicit and never rewrite an existing result',()=>{
  let r=runtime('apply');
  for(const id of EFFECT_IDS){
    const candidates=generateEffectCandidates(r.state,id); if(!candidates.length) continue;
    const queued=enqueueInfluence(r.state,command(r.state,id,candidates[0].id,{id:`cmd-${id}-${r.state.tick}`,idempotencyKey:`key-${id}-${r.state.tick}`}));
    if(queued.status==='queued') r.state=applyDueInfluence(queued.state,r.rng).state;
  }
  assert.ok(r.state.influence.speedPermille>=750&&r.state.influence.speedPermille<=1250);
  assert.ok(r.state.influence.shieldCharges<=1);
  assert.ok(['standard','assisted','chat-vs-ai'].includes(r.state.influence.recordCategory));
  const terminal=structuredClone(r.state);terminal.lifecycle='result';terminal.result={kind:'game',reason:'stagnation',tick:terminal.tick,score:0,length:terminal.snake.body.length,finalChecksum:'frozen'};
  const out=applyDueInfluence(terminal,NamedRng.fromSeed('terminal'));
  assert.deepEqual(out.state.result,terminal.result);
});

test('timed modifiers expire deterministically at their declared tick',()=>{
  const r=runtime('expiry'),c=generateEffectCandidates(r.state,'fog-field')[0];
  let state=enqueueInfluence(r.state,command(r.state,'fog-field',c.id)).state;
  state=applyDueInfluence(state,r.rng).state;
  assert.ok(state.influence.fogUntilTick>state.tick);
  state.tick=state.influence.fogUntilTick;
  const expired=applyDueInfluence(state,r.rng).state;
  assert.equal(expired.influence.fogUntilTick,0);
});
