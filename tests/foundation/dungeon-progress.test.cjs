'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../..');
test('progress page uses a same-origin stylesheet under the strict server CSP',()=>{
 const html=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.html'),'utf8');
 assert.match(html,/<link[^>]+href="\/dungeon\/gauntlet.css"/);
 assert.doesNotMatch(html,/<style\b|\sstyle\s*=/i);
 const css=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.css'),'utf8');
 assert.match(css,/\.grid\s*\{[^}]*display:grid/);
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(server.includes("['/dungeon/gauntlet.css','gauntlet.css']"));
 assert.ok(server.includes("style-src 'self'"));
});
test('progress page keeps the approved benchmark and truthful evidence bindings',()=>{
 const html=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.html'),'utf8');
 assert.match(html,/Diablo IV/);assert.match(html,/NOT AAA CERTIFIED/);
 for(const id of ['health','floor','run','tick','warden-phase','heroes-alive','hazards-active','checkpoint','evidence','measurements','visual-audit','iterations','world-capture','world-capture-placeholder','actual-capture','local-capture'])assert.ok(html.includes(`id="${id}"`),id);
});

test('transformation progress is anchored to an immutable real-game baseline and cannot pass on CI alone',()=>{
 const history=JSON.parse(fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet-history.json'),'utf8'));
 const t=history.transformation;
 assert.ok(t,'missing experience-level transformation milestone');
 assert.match(t.baseline.sha,/^[0-9a-f]{40}$/);
 assert.equal(t.baseline.locked,true);
 assert.match(t.baseline.artifactUrl,/^https:\/\/github\.com\/my-edutu\/Ai_games\/actions\/runs\/\d+\/artifacts\/\d+$/);
 assert.ok(['NOT_TRANSFORMED','TRANSFORMED_VERIFIED'].includes(t.verdict));
 for(const pillar of ['looks','feels','plays'])assert.ok(['UNVERIFIED','AFTER_PREFERRED','REJECTED'].includes(t.pillars[pillar].status));
 if(t.verdict==='TRANSFORMED_VERIFIED'){
  assert.equal(t.status,'TRANSFORMED_VERIFIED');
  const evidence=t.evidence,panel=evidence.independentCriticPanel;
  assert.equal(panel.status,'PASSED');assert.ok(panel.criticCount>=3);
  for(const k of ['looks','feels','plays'])assert.equal(t.pillars[k].status,'AFTER_PREFERRED');
  for(const k of ['looksMajority','feelsMajority','playsMajority'])assert.equal(panel[k],true);
  for(const k of ['actualContinuousScenarioReel','matchedBeforeAfter','mobileBeforeAfter'])assert.equal(evidence[k],'VERIFIED');
  assert.equal(evidence.safetyChecks,'PASSED');
 }
 const html=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'public/ai-dungeon/gauntlet.js'),'utf8');
 for(const id of ['transformation-status','transform-looks','transform-feels','transform-plays','transform-baseline','transform-evidence','transform-critics','transform-gap'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/IN PROGRESS — NOT TRANSFORMED/);
 assert.match(html,/looks/i);assert.match(html,/feels/i);assert.match(html,/plays/i);
 assert.match(script,/renderTransformation\(history\.transformation\)/);
 assert.match(script,/panel\.status==='PASSED'/);
 assert.match(script,/Number\(panel\.criticCount\)>=3/);
 assert.match(script,/e\.actualContinuousScenarioReel==='VERIFIED'/);
 assert.match(script,/e\.safetyChecks==='PASSED'/);
});
