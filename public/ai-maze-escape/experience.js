'use strict';
// Presentation-only interface. This consumes public render snapshots, never the hidden maze.
const modes=new Set(['cinema','follow','tactical']);
const query=new URLSearchParams(location.search);
const requested=query.get('camera');
const initial=modes.has(requested)?requested:'cinema';
window.__MAZE_CAMERA_MODE__=initial;
const buttons=[...document.querySelectorAll('[data-camera-mode]')];
const journal=document.getElementById('event-feed');
const risk=document.getElementById('threat-status');
const riskLabel=document.getElementById('threat-label');
const mission=document.getElementById('mission-title');
const missionStatus=document.getElementById('mission-status');
const confidence=document.getElementById('confidence-score');
const runLabel=document.getElementById('run-label');
const zoneNumber=document.getElementById('zone-number');
const renderStatus=document.getElementById('render-state');
const audienceMode=document.getElementById('audience-mode');
const audiencePressure=document.getElementById('audience-pressure');
const audienceFill=document.getElementById('audience-pressure-fill');
const audienceEffect=document.getElementById('audience-effect');
let currentRun='';
let lastMessage='';
const entries=[];
function setCamera(mode){
  if(!modes.has(mode))return;
  window.__MAZE_CAMERA_MODE__=mode;
  for(const button of buttons){
    button.setAttribute('aria-pressed',String(button.dataset.cameraMode===mode));
  }
}
for(const button of buttons){
  button.addEventListener('click',()=>setCamera(button.dataset.cameraMode));
}
setCamera(initial);
function addJournal(message){
  if(typeof message!=='string'||!message.trim()||message===lastMessage)return;
  lastMessage=message;
  entries.unshift(message.slice(0,160));
  if(entries.length>3)entries.length=3;
  journal.replaceChildren();
  for(const value of entries){
    const row=document.createElement('li');
    row.textContent=value;
    journal.appendChild(row);
  }
}
window.addEventListener('maze:frame',event=>{
  const snapshot=event.detail?.snapshot;
  if(!snapshot)return;
  if(snapshot.runToken!==currentRun){
    currentRun=snapshot.runToken;
    entries.length=0;
    lastMessage='';
    addJournal('A new expedition begins. The AI is observing its surroundings.');
  }
  const level=String(snapshot.level||1).padStart(2,'0');
  runLabel.textContent='RUN '+level;
  zoneNumber.textContent='ZONE '+level;
  const discoveredExit=snapshot.exitCell!==null;
  const threats=snapshot.threats.length>0;
  risk.dataset.level=threats?'high':'low';
  riskLabel.textContent=threats?'HUNTER ACTIVE':'CALM';
  const confidenceValue=Number.isFinite(snapshot.intent?.confidence)?
    Math.max(0,Math.min(100,Math.round(snapshot.intent.confidence*100))):0;
  confidence.textContent=confidenceValue+'%';
  if(snapshot.lifecycle==='intermission'){
    mission.textContent='NEXT EXPEDITION';
    missionStatus.textContent='PREPARING';
  }else if(snapshot.lifecycle==='result'){
    mission.textContent=snapshot.result?.reason==='escape'?'ESCAPE ACHIEVED':'EXPEDITION ENDED';
    missionStatus.textContent='COMPLETE';
  }else if(threats){
    mission.textContent='EVADE THE HUNTER';
    missionStatus.textContent='DANGER';
  }else if(discoveredExit){
    mission.textContent='REACH THE EXIT';
    missionStatus.textContent='EXIT FOUND';
  }else if(snapshot.inventory.length>0){
    mission.textContent='UNLOCK THE WAY OUT';
    missionStatus.textContent='SEARCHING';
  }else{
    mission.textContent='FIND THE WAY OUT';
    missionStatus.textContent='EXPLORING';
  }
  const influence=snapshot.audience||{};
  const pressure=Number.isFinite(influence.pressure)?Math.max(0,Number(influence.pressure)):0;
  audiencePressure.textContent=String(Math.round(pressure));
  // Pressure has no fixed published maximum, so the UI shows a bounded illustrative bar.
  audienceFill.style.width=Math.min(100,pressure)+'%';
  audienceMode.textContent=influence.recordCategory==='audience-influenced'?'CHAT VS AI':'AUTONOMOUS';
  const effects=Array.isArray(influence.activeEffects)?influence.activeEffects:[];
  audienceEffect.textContent=effects.length?'Active: '+effects.map(e=>String(e).replaceAll('-',' ')).join(', ')+'.':
    (influence.queued>0?'Audience events queued: '+influence.queued+'.':'No active interventions. The explorer makes its own decisions.');
  const captions=event.detail.audio?.captions||[];
  if(captions.length)addJournal(String(captions.at(-1)));
  // No oracle, seed or route truth is consumed or stored by the UX.
});
let statusAt=0;
function updateRendererStatus(now){
  if(now-statusAt<800)return;
  statusAt=now;
  const is3D=!!window.__MAZE_3D_READY__;
  const metrics=window.__MAZE_3D_METRICS__;
  renderStatus.textContent=is3D
    ?'● 3D WORLD'+(metrics?.fps?' · '+metrics.fps+' FPS':'')
    :'● TACTICAL VIEW';
}
(function loop(now){
  updateRendererStatus(now);
  requestAnimationFrame(loop);
})(0);
