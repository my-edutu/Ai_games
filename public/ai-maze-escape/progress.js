'use strict';
// Review workstreams are versioned in gauntlet.json; gameplay telemetry is genuinely live.
const byId=id=>document.getElementById(id);
const append=(parent,tag,cls,text)=>{
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(text!==undefined)element.textContent=String(text);
  parent.appendChild(element);
  return element;
};
async function loadReview(){
  try{
    const response=await fetch('/maze/gauntlet.json',{cache:'no-store'});
    if(!response.ok)throw Error('review manifest unavailable');
    const data=await response.json();
    byId('quality-bar').textContent='QUALITY BAR / '+data.qualityBar;
    const rounds=Array.isArray(data.rounds)?data.rounds:[];
    const latest=rounds.at(-1);
    byId('verdict').textContent=latest?.visualBarMet?'BAR MET':'NOT YET PASSED';
    byId('last-updated').textContent='Last manifest update: '+String(data.updatedAt||'unknown');
    const milestones=byId('milestones');
    milestones.replaceChildren();
    for(const item of data.milestones||[]){
      const row=append(milestones,'li');
      row.dataset.state=String(item.status).startsWith('implemented previously')?'complete':'pending';
      append(row,'span','dot');
      const description=append(row,'div');
      append(description,'strong','',item.label);
      append(description,'small','',item.status);
    }
    const goals=byId('goal-cards');
    goals.replaceChildren();
    for(const item of data.gauntletGoals||[]){
      const card=append(goals,'article','goal-card');
      card.dataset.status=item.status||'pending';
      append(card,'span','gate',String(item.status||'pending').replaceAll('-',' ').toUpperCase());
      append(card,'h3','',item.name);
      const bar=append(card,'p');
      append(bar,'b','', 'REFERENCE  ');
      append(bar,'span','',item.reference);
      const actual=append(card,'p');
      append(actual,'b','', 'CURRENT  ');
      append(actual,'span','',item.current);
      append(card,'small','', 'EVIDENCE • '+item.evidence);
    }
    const history=byId('rounds');
    history.replaceChildren();
    for(const entry of rounds){
      const row=append(history,'article','round');
      append(row,'h3','', 'ROUND '+entry.number+' • '+entry.label);
      append(row,'p','', 'STATUS: '+entry.status);
      append(row,'p','', 'BUILT: '+(entry.built||[]).join(' • '));
      append(row,'p','', 'CRITIC: '+entry.independentCritic);
      const gap=append(row,'p');
      append(gap,'b','', 'BIGGEST GAP: ');
      append(gap,'span','',entry.largestKnownGap);
    }
  }catch{
    byId('verdict').textContent='MANIFEST UNAVAILABLE';
  }
}
async function sampleRuntime(){
  try{
    const response=await fetch('/maze/progress/state',{cache:'no-store'});
    if(!response.ok)throw Error('unhealthy simulation');
    const state=await response.json();
    byId('health').textContent=String(state.status).toUpperCase();
    byId('tick').textContent=String(state.tick);
    byId('discovery').textContent=String(state.discoveryPercent)+'%';
    byId('intent').textContent=String(state.aiIntent).replaceAll('-',' ').toUpperCase();
    const child=document.querySelector('iframe')?.contentWindow;
    const metrics=child?.__MAZE_3D_METRICS__;
    byId('render-mode').textContent=metrics?.active?'3D WEBGL':'2D FALLBACK';
    byId('render-performance').textContent=metrics?.active?metrics.fps+' FPS / '+metrics.drawCalls:'—';
    const model=child?.__MAZE_3D_MODEL__;
    byId('hero-rig').textContent=model?.status==='loaded'
      ?'RIGGED • '+model.bones+' BONES'
      :model?.status==='loading'?'LOADING REAL 3D ASSET'
      :model?.status==='fallback'?'PROCEDURAL FALLBACK':'AWAITING GPU';
    byId('scene-grade').textContent=metrics?.active
      ?String(metrics.cinematicCue||'EXPLORING').toUpperCase()+' • '+String(metrics.qualityMode||'ADAPTIVE').toUpperCase()
      :'TACTICAL VIEW';
  }catch{
    byId('health').textContent='RECONNECTING';
  }
}
loadReview();
sampleRuntime();
setInterval(sampleRuntime,2000);
setInterval(loadReview,30000);