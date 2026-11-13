'use strict';const $=id=>document.getElementById(id);const set=(id,text)=>{const e=$(id);if(e)e.textContent=String(text)};let lastEvidence='';
function renderTransformation(t){
 const status=$('transformation-status');
 if(!status)return;
 if(!t||!t.baseline||t.baseline.locked!==true){
  set('transformation-status','NO VERIFIED MILESTONE');
  set('transform-evidence','NOT AVAILABLE');
  return;
 }
 const e=t.evidence||{},panel=e.independentCriticPanel||{},pillars=t.pillars||{};
 const preferred=['looks','feels','plays'].every(k=>pillars[k]?.status==='AFTER_PREFERRED');
 const accepted=t.status==='TRANSFORMED_VERIFIED'&&t.verdict==='TRANSFORMED_VERIFIED'
  &&panel.status==='PASSED'&&Number(panel.criticCount)>=3
  &&panel.looksMajority===true&&panel.feelsMajority===true&&panel.playsMajority===true
  &&preferred&&e.actualContinuousScenarioReel==='VERIFIED'&&e.matchedBeforeAfter==='VERIFIED'
  &&e.mobileBeforeAfter==='VERIFIED'&&e.safetyChecks==='PASSED';
 set('transformation-status',accepted?'TRANSFORMED & VERIFIED':'IN PROGRESS — NOT TRANSFORMED');
 document.body.dataset.transformation=accepted?'verified':'in-progress';
 for(const k of ['looks','feels','plays']){const verdict=String(pillars[k]?.status||'UNVERIFIED');set('transform-'+k,accepted?'AFTER PREFERRED':verdict.replaceAll('_',' '));}
 const sha=String(t.baseline.sha||'');
 set('transform-baseline',/^[0-9a-f]{40}$/.test(sha)?sha.slice(0,9):'UNVERIFIED');
 const link=$('transform-baseline-link');
 if(link&&/^https:\/\/github\.com\/my-edutu\/Ai_games\/actions\/runs\/\d+\/artifacts\/\d+$/.test(t.baseline.artifactUrl||''))link.href=t.baseline.artifactUrl;
 set('transform-evidence',e.actualContinuousScenarioReel||'NOT RUN');
 set('transform-critics',panel.status==='PASSED'?'PANEL REVIEWED':'NOT RUN / UNVERIFIED');
 set('transform-gap',t.biggestRemainingGap||'Evidence for an integrated experiential transformation is missing');
 set('transform-work',t.currentWork||'Not yet started');
 set('transform-media',e.originalAudioMotionClip==='VERIFIED'?'VERIFIED LIVE AUDIO/VIDEO':e.originalAudioMotionClip||'UNVERIFIED');
 set('transform-audio',e.audioLoudnessAndClipping||'NOT MEASURED');
 const candidate=String(t.candidateCommit||'');
 set('transform-candidate-sha',/^[0-9a-f]{40}$/.test(candidate)?candidate.slice(0,9):'UNVERIFIED');
 const candidateLink=$('transform-candidate-link'),candidateUrl=String(t.candidateArtifactUrl||'');
 const candidateReal=/^https:\/\/github\.com\/my-edutu\/Ai_games\/actions\/runs\/\d+\/artifacts\/\d+$/.test(candidateUrl);
 if(candidateLink){candidateLink.hidden=!candidateReal;if(candidateReal)candidateLink.href=candidateUrl;else candidateLink.removeAttribute('href');}
 set('transform-candidate-proof',candidateReal?'Real candidate artifact exists — not independently judged':'Exact-head browser capture not verified here');
 const reelVerified=e.actualContinuousScenarioReel==='VERIFIED'&&e.mobileBeforeAfter==='VERIFIED'&&e.matchedBeforeAfter==='VERIFIED';
 set('transform-scenario-gate',reelVerified?'REEL VERIFIED, CRITICS PENDING':'NOT VERIFIED');
}
async function refresh(){try{const res=await fetch('/dungeon/gauntlet/state',{cache:'no-store'});if(!res.ok)throw Error('telemetry unavailable');const j=await res.json();set('health',j.status.status.toUpperCase());set('floor',j.game.floor);set('run',j.game.run);set('tick',j.game.tick);set('warden-phase',j.game.bossPhase||'—');set('heroes-alive',j.game.heroesAlive);set('hazards-active',j.game.hazardsActive);set('checkpoint',j.status.checkpointTick??'NOT SAVED');document.body.dataset.offline='false';try{const e=await fetch(j.evidence,{cache:'no-store'});if(e.ok){const report=await e.json();const serialized=JSON.stringify(report);if(serialized!==lastEvidence){lastEvidence=serialized;set('evidence',report.status||'NOT MEASURED');const n=$('measurements');n.replaceChildren();for(const [key,val] of Object.entries(report.metrics||{})){const p=document.createElement('p');p.textContent=key.replaceAll('_',' ')+' : '+JSON.stringify(val);n.append(p)}}}}catch{set('evidence','LOCAL CAMPAIGN NOT YET RUN')}
 try{const response=await fetch('/dungeon/evidence/visual-metrics.json',{cache:'no-store'});if(response.ok){const m=await response.json();const a=Number(m.colouredFraction||0),b=Number(m.meanLuminance||0);set('visual-audit','CAPTURED • coloured pixels '+(a*100).toFixed(1)+'% • average luminance '+b.toFixed(1)+' / 255 • A/B NOT ASSESSED')}else set('visual-audit','NOT RUN — NO SCREENSHOT EVIDENCE')}catch{set('visual-audit','NOT RUN — NO SCREENSHOT EVIDENCE')}
 try{const h=await fetch('/dungeon/gauntlet-history.json',{cache:'no-store'});if(h.ok){const history=await h.json(),rounds=history.rounds||[],list=$('iterations');renderTransformation(history.transformation);list.replaceChildren(...rounds.slice().reverse().map(r=>{const li=document.createElement('li');li.textContent='Implementation '+r.round+' · '+r.status+' · '+r.sampleSeeds+' seeds · floor '+r.highestFloor+' · visual: '+r.visualVerdict;
 if(r.artifactUrl&&/^https:\/\/github\.com\/my-edutu\/Ai_games\/actions\/runs\/\d+\/artifacts\/\d+$/.test(r.artifactUrl)){const link=document.createElement('a');link.href=r.artifactUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=' · Open real CI screenshot artifact ↗';li.append(link)}
 return li}))}}catch{}const world=$('world-capture');if(world&&!world.dataset.loaded){const source='/dungeon/evidence/world-only.png';fetch(source,{cache:'no-store'}).then(r=>{if(!r.ok)return;world.src=source+'?t='+Date.now();world.hidden=false;$('world-capture-placeholder').hidden=true;world.dataset.loaded='1'}).catch(()=>{})}const img=$('actual-capture');if(img&&!img.dataset.loaded){const source='/dungeon/evidence/desktop.png';fetch(source,{method:'GET',cache:'no-store'}).then(r=>{if(!r.ok)return;img.src=source+'?t='+Date.now();img.hidden=false;$('local-capture').hidden=true;img.dataset.loaded='1'}).catch(()=>{})}}catch{set('health','OFFLINE');document.body.dataset.offline='true'}finally{setTimeout(refresh,1600)}}refresh();