'use strict';
const MAX_TRAIL=240;
const query=new URLSearchParams(location.search);
const modes={reducedMotion:query.has('reducedMotion')?query.get('reducedMotion')==='1':matchMedia('(prefers-reduced-motion: reduce)').matches,highContrast:query.get('highContrast')==='1',muted:query.get('muted')==='1',cleanFeed:query.get('cleanFeed')==='1',evidence:query.get('evidence')==='1'};
for(const [key,value] of Object.entries(modes))document.body.setAttribute(`data-${key.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`,String(value));
document.body.dataset.cameraMode='room';window.__ESCAPE_TRAIL_BOUND__=MAX_TRAIL;
const $=id=>document.getElementById(id),canvas=document.querySelector('[data-testid="escape-canvas"]');
const elements={room:document.querySelector('[data-testid="room"]'),stage:document.querySelector('[data-testid="stage"]'),tick:document.querySelector('[data-testid="tick"]'),objective:document.querySelector('[data-testid="objective"]'),intent:$('ai-intent'),observation:$('ai-observation'),goal:$('ai-goal'),confidence:$('confidence'),progress:$('progress-fill'),progressLabel:$('progress-label'),timer:$('timer-value'),inventory:$('inventory'),inventoryCount:$('inventory-count'),mechanisms:$('mechanisms'),mechanismCount:$('mechanism-count'),score:$('score'),streak:$('streak'),theme:$('theme'),difficulty:$('difficulty'),caption:$('caption-text'),connection:$('connection'),health:$('health'),danger:document.querySelector('[data-testid="danger"]'),dangerCopy:$('danger-copy'),safe:$('safe-scene'),inspect:$('inspect-label'),roomTitleIndex:$('room-title-index'),roomTitleName:$('room-title-name'),milestone:$('milestone-label')};
const THEME_NAMES={'cipher-vault':'CIPHER VAULT','clockwork-study':'CLOCKWORK STUDY','chromatic-lab':'CHROMATIC LAB','archive-zero':'ARCHIVE ZERO'};
let publicState=null,inFlight=false,failures=0,lastEventSeq=0,evidenceFrame=false,presentationEpoch=0,activePollController=null,disposed=false,lastInventoryKey='',lastMechanismKey='',lastStepsKey='';
const stateClient=window.EscapeNetwork.createStateClient({evidence:modes.evidence});
function text(node,value){if(node)node.textContent=String(value??'—')}
function human(value){return String(value??'').replace(/^escape\.object\./,'').replace(/[-_.]+/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
function renderList(container,items,render){while(container.firstChild)container.removeChild(container.firstChild);for(const item of items)container.appendChild(render(item))}
function milestoneFor(state){const left=Math.max(0,state.progress.totalPuzzles-state.progress.solvedPuzzles);if((state.scene==='result'||state.scene==='intermission')&&state.avatar?.mode==='celebrating')return'ESCAPE CONFIRMED';if(state.scene==='result'||state.scene==='intermission')return'ATTEMPT COMPLETE';if(state.progress.permille===1000)return'ALL LOCKS OPEN';if(left===1)return'FINAL VAULT';if(state.progress.permille>=750)return'LAST QUARTER';if(state.progress.permille>=500)return'DEEP CLEARANCE';if(state.progress.permille>=250)return'ROOM BREAKTHROUGH';return'VAULT CLEARANCE'}
class EscapeAudio{
  constructor(muted){this.muted=muted;this.context=null;this.enabled=false;this.lastCue=new Map()}
  start(){if(this.muted||this.enabled)return;try{const C=window.AudioContext||window.webkitAudioContext;this.context=new C();this.master=this.context.createGain();this.master.gain.value=.085;this.compressor=this.context.createDynamicsCompressor();this.compressor.threshold.value=-15;this.compressor.knee.value=8;this.compressor.ratio.value=4;this.compressor.attack.value=.006;this.compressor.release.value=.18;this.ambience=this.context.createGain();this.sfx=this.context.createGain();this.danger=this.context.createGain();this.ambience.gain.value=.18;this.sfx.gain.value=.8;this.danger.gain.value=.01;this.ambience.connect(this.master);this.sfx.connect(this.master);this.danger.connect(this.master);this.master.connect(this.compressor).connect(this.context.destination);
      const humA=this.context.createOscillator(),humB=this.context.createOscillator(),humGainA=this.context.createGain(),humGainB=this.context.createGain();humA.type='sine';humA.frequency.value=43;humB.type='triangle';humB.frequency.value=67;humGainA.gain.value=.05;humGainB.gain.value=.018;humA.connect(humGainA).connect(this.ambience);humB.connect(humGainB).connect(this.ambience);humA.start();humB.start();
      const noiseBuffer=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate),data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++){const raw=Math.sin(i*12.9898+78.233)*43758.5453;data[i]=((raw-Math.floor(raw))*2-1)*.08;}const noise=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),noiseGain=this.context.createGain();noise.buffer=noiseBuffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=540;noiseGain.gain.value=.06;noise.connect(filter).connect(noiseGain).connect(this.ambience);noise.start();
      const alarm=this.context.createOscillator(),alarmGain=this.context.createGain();alarm.type='sawtooth';alarm.frequency.value=78;alarmGain.gain.value=.035;alarm.connect(alarmGain).connect(this.danger);alarm.start();this.enabled=true;if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{this.enabled=false}}
  setMuted(muted){this.muted=muted;if(!muted&&!this.enabled)this.start();if(this.context&&this.master){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(muted?0:.085,now,.025);if(!muted&&this.context.state==='suspended')this.context.resume().then(syncControls).catch(()=>syncControls());}syncControls()}
  tone(frequency,duration=.08,type='sine',gain=.22,delay=0,bus='sfx'){if(!this.enabled||this.muted||!this.context)return;const at=this.context.currentTime+delay,osc=this.context.createOscillator(),amp=this.context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,at);amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(Math.max(.001,gain),at+.012);amp.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(amp).connect(this[bus]||this.sfx);osc.onended=()=>{osc.disconnect();amp.disconnect()};osc.start(at);osc.stop(at+duration+.04)}
  cueAllowed(type,ms=55){const now=performance.now(),last=this.lastCue.get(type)??-Infinity;if(now-last<ms)return false;this.lastCue.set(type,now);return true}
  setScene(state){if(!this.enabled||!this.context)return;const now=this.context.currentTime,danger=state.scene==='danger'?1:0,result=state.scene==='result'?1:0;this.danger.gain.cancelScheduledValues(now);this.danger.gain.linearRampToValueAtTime(danger?.22:.005,now+.12);this.ambience.gain.cancelScheduledValues(now);this.ambience.gain.linearRampToValueAtTime(result?.08:(danger?.11:.18),now+.22)}
  event(event){if(!event||this.muted||!this.enabled||!this.cueAllowed(event.type))return;switch(event.type){case'object-inspected':this.tone(230,.045,'triangle',.09);break;case'clue-discovered':this.tone(420,.08,'sine',.18);this.tone(630,.14,'sine',.14,.07);break;case'item-taken':this.tone(300,.06,'triangle',.14);this.tone(455,.07,'triangle',.10,.04);break;case'items-combined':this.tone(265,.05,'square',.08);this.tone(540,.13,'triangle',.16,.06);break;case'puzzle-solved':this.tone(330,.08,'triangle',.18);this.tone(494,.11,'triangle',.18,.09);this.tone(660,.20,'sine',.17,.19);break;case'hazard-phase':this.tone(96,.20,'sawtooth',.12,0,'danger');break;case'hazard-failure':this.tone(78,.34,'sawtooth',.20,0,'danger');this.tone(52,.45,'square',.12,.11,'danger');break;case'escape':this.tone(392,.12,'triangle',.18);this.tone(523,.16,'triangle',.19,.12);this.tone(784,.38,'sine',.20,.28);break;default:break}}
}
const audio=new EscapeAudio(modes.muted);
let renderer;
try{renderer=new window.EscapeRoom3D(canvas,{reducedMotion:modes.reducedMotion,highContrast:modes.highContrast})}catch(error){console.error(error);elements.safe.classList.add('active');text(elements.connection,'RENDER SAFE');window.__ESCAPE_RENDER_DIAGNOSTICS__={renderer:'safe-scene',webgl:false,reason:'webgl-unavailable'}}
if(renderer)renderer.followFocus=false;
function syncControls(){
  const overview=renderer?.mode==='room',follow=Boolean(renderer?.followFocus);
  $('overview-button')?.setAttribute('aria-pressed',String(overview&&!follow));
  $('overview-button')?.classList.toggle('active',overview&&!follow);
  $('follow-button')?.setAttribute('aria-pressed',String(follow));
  $('follow-button')?.classList.toggle('active',follow);
  $('character-button')?.setAttribute('aria-pressed',String(renderer?.mode==='character'));
  const audible=Boolean(audio.enabled&&!audio.muted&&audio.context?.state==='running');
  const soundLabel=audible?'Mute sound':'Enable sound';
  $('sound-button')?.setAttribute('aria-pressed',String(audible));
  $('sound-button')?.setAttribute('aria-label',`${soundLabel} (M)`);
  $('sound-button')?.setAttribute('title',`${soundLabel} · M`);text($('sound-label'),soundLabel);
  $('motion-button')?.setAttribute('aria-pressed',String(modes.reducedMotion));
  $('contrast-button')?.setAttribute('aria-pressed',String(modes.highContrast));
  $('clean-feed-button')?.setAttribute('aria-pressed',String(modes.cleanFeed));
}
function roomView(){if(renderer){renderer.followFocus=false;renderer.roomView()}syncControls()}
function inspectObject(id){if(renderer){renderer.followFocus=false;renderer.inspect(id)}syncControls()}
function followFocus(){if(renderer){renderer.followFocus=true;if(publicState?.focusObjectId)renderer.inspect(publicState.focusObjectId,true)}syncControls()}
function characterView(){if(renderer){renderer.followFocus=false;renderer.characterView?.()}if($('view-settings'))$('view-settings').open=false;canvas.focus({preventScroll:true});syncControls()}
function setMode(key,value){
  modes[key]=Boolean(value);document.body.setAttribute(`data-${key.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`,String(modes[key]));
  const url=new URL(location.href);url.searchParams.set(key,modes[key]?'1':'0');history.replaceState(null,'',url);
  if(key==='reducedMotion'&&renderer)renderer.reducedMotion=modes.reducedMotion;
  if(key==='highContrast'&&renderer){renderer.highContrast=modes.highContrast;renderer.rebuildTheme(renderer.lastTheme||'cipher-vault')}
  if(key==='muted')audio.setMuted(modes.muted);
  if(key==='cleanFeed'){
    if($('view-settings'))$('view-settings').open=false;
    requestAnimationFrame(()=>{renderer?.resize();(modes.cleanFeed?$('show-interface-button'):$('overview-button'))?.focus({preventScroll:true})});
  }
  syncControls();
}
function toggleSound(){setMode('muted',audio.enabled&&!audio.muted&&audio.context?.state==='running')}
$('overview-button')?.addEventListener('click',roomView);
$('follow-button')?.addEventListener('click',followFocus);
$('character-button')?.addEventListener('click',characterView);
$('sound-button')?.addEventListener('click',toggleSound);
$('motion-button')?.addEventListener('click',()=>setMode('reducedMotion',!modes.reducedMotion));
$('contrast-button')?.addEventListener('click',()=>setMode('highContrast',!modes.highContrast));
$('clean-feed-button')?.addEventListener('click',()=>setMode('cleanFeed',!modes.cleanFeed));
$('show-interface-button')?.addEventListener('click',()=>setMode('cleanFeed',false));
canvas.addEventListener('pointerdown',()=>{if(renderer)renderer.followFocus=false;queueMicrotask(syncControls)});
document.addEventListener('pointerdown',event=>{const settings=$('view-settings');if(settings?.open&&!settings.contains(event.target))settings.open=false});
addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.target?.matches('input,textarea,select,[contenteditable="true"]'))return;
  if(event.key==='Escape'){if($('view-settings'))$('view-settings').open=false;roomView()}
  else if(event.key.toLowerCase()==='i')followFocus();
  else if(event.key.toLowerCase()==='m')toggleSound();
  else if(event.key.toLowerCase()==='c')setMode('cleanFeed',!modes.cleanFeed);
});
window.__ESCAPE_INSPECT_OBJECT__=inspectObject;
window.__ESCAPE_ROOM_VIEW__=roomView;
window.__ESCAPE_CHARACTER_VIEW__=characterView;
syncControls();
function emptyNote(message){const node=document.createElement('p');node.className='empty-note';node.textContent=message;return node}
function updateCollections(state){
  const inventoryKey=JSON.stringify(state.inventory);
  if(inventoryKey!==lastInventoryKey){
    lastInventoryKey=inventoryKey;text(elements.inventoryCount,`${state.inventory.length} ${state.inventory.length===1?'tool':'tools'}`);
    renderList(elements.inventory,state.inventory,item=>{const slot=document.createElement('div');slot.className='inventory-slot';slot.setAttribute('aria-label',human(item.label));const icon=document.createElement('i');icon.setAttribute('aria-hidden','true');icon.textContent='⌘';const label=document.createElement('span');label.textContent=human(item.label);slot.append(icon,label);return slot});
    if(!state.inventory.length)elements.inventory.appendChild(emptyNote('No tools collected yet.'));
  }
  const mechanisms=state.objects.filter(item=>item.mechanismKind&&(item.inspected||item.solved||item.id===state.focusObjectId));
  text(elements.mechanismCount,`${state.progress.solvedPuzzles} / ${state.progress.totalPuzzles}`);
  const mechanismKey=JSON.stringify(mechanisms.map(item=>[item.id,item.mechanismKind,item.solved,item.inspected]));
  if(mechanismKey!==lastMechanismKey){
    lastMechanismKey=mechanismKey;
    const focusedId=elements.mechanisms.contains(document.activeElement)?document.activeElement?.dataset?.objectId:null;
    renderList(elements.mechanisms,mechanisms,item=>{
      const name=`${Number.isInteger(item.placement?.stage)?String(item.placement.stage).padStart(2,'0')+' · ':''}${human(item.mechanismKind)}`;
      const row=document.createElement('button');row.type='button';row.className=`mechanism${item.solved?' solved':''}`;row.dataset.objectId=item.id;row.setAttribute('aria-label',`Inspect ${name}, ${item.solved?'open':item.inspected?'discovered':'current focus'}`);
      const icon=document.createElement('i');icon.setAttribute('aria-hidden','true');icon.textContent=item.solved?'✓':'◇';const label=document.createElement('span');label.textContent=name;const status=document.createElement('strong');status.textContent=item.solved?'OPEN':item.inspected?'KNOWN':'FOCUS';row.append(icon,label,status);row.addEventListener('click',()=>inspectObject(item.id));return row;
    });
    if(!mechanisms.length)elements.mechanisms.appendChild(emptyNote('The Archivist is locating mechanisms.'));
    if(focusedId)Array.from(elements.mechanisms.children).find(row=>row.dataset.objectId===focusedId)?.focus({preventScroll:true});
  }
  for(const row of elements.mechanisms.children)if(row.dataset.objectId)row.setAttribute('aria-current',String(row.dataset.objectId===state.focusObjectId));
  const stepsKey=`${state.progress.totalPuzzles}:${state.progress.solvedPuzzles}`;
  if(stepsKey!==lastStepsKey){lastStepsKey=stepsKey;const steps=$('lock-steps');if(steps)renderList(steps,Array.from({length:Math.min(24,state.progress.totalPuzzles)},(_,index)=>index),index=>{const node=document.createElement('i');node.className=index<state.progress.solvedPuzzles?'completed':index===state.progress.solvedPuzzles?'current':'';return node})}
}
function update(state){
  if(publicState?.runToken!==state.runToken)lastEventSeq=-1;
  publicState=state;window.__ESCAPE_PUBLIC_STATE__=state;renderer?.setState(state);audio.setScene(state);syncControls();
  text(elements.room,String(state.roomIndex).padStart(2,'0'));text(elements.stage,`${state.progress.solvedPuzzles}/${state.progress.totalPuzzles}`);text(elements.tick,state.tick);text(elements.objective,state.objective);text(elements.intent,state.ai.intent);text(elements.observation,state.ai.observation);text(elements.goal,human(state.ai.goal).toUpperCase());text(elements.confidence,state.ai.confidenceBand.toUpperCase());text(elements.roomTitleIndex,`ROOM ${String(state.roomIndex).padStart(2,'0')}`);text(elements.roomTitleName,THEME_NAMES[state.theme]||human(state.theme).toUpperCase());text(elements.milestone,milestoneFor(state));
  if(state.scene==='result'||(state.scene==='intermission'&&state.avatar?.mode==='celebrating')){
    const escaped=state.avatar?.mode==='celebrating';
    text(elements.intent,escaped?'Escape confirmed':'The attempt has ended');
    text(elements.observation,escaped?'Every mechanism is open. The Archivist has cleared this chamber.':'The room has recorded this attempt. A new chamber follows.');
    text(elements.goal,escaped?'CHAMBER CLEARED':'ATTEMPT RECORDED');
  }else if(state.scene==='intermission'){
    text(elements.intent,'A new chamber awaits');text(elements.observation,'The Archivist is preparing for the next investigation.');text(elements.goal,'NEXT CHAMBER');
  }
  const percent=Math.round(state.progress.permille/10);elements.progress.style.width=`${percent}%`;elements.progress.parentElement.setAttribute('aria-valuenow',String(percent));text(elements.progressLabel,`${percent}%`);
  const totalTicks=state.tick+state.timer.remainingTicks,reserve=totalTicks>0?Math.max(0,Math.min(100,Math.round(state.timer.remainingTicks/totalTicks*100))):0;text(elements.timer,`${reserve}%`);elements.timer.parentElement.dataset.urgent=String(Boolean(state.timer.danger));elements.timer.parentElement.setAttribute('aria-label',`${reserve} percent of the time reserve remains`);
  text(elements.score,state.record.score.toLocaleString());text(elements.streak,state.record.streak);text(elements.theme,human(state.theme).toUpperCase());text(elements.difficulty,state.difficulty);updateCollections(state);
  const activeHazard=state.hazards.find(hazard=>hazard.phase==='active')||state.hazards.find(hazard=>hazard.phase==='telegraph');text(elements.dangerCopy,activeHazard?`${human(activeHazard.kind).toUpperCase()} · ${activeHazard.phase.toUpperCase()}`:'ROOM HAZARD ACTIVE');
  const latest=state.events.at(-1);text(elements.caption,(latest?.label||state.ai.observation).replace(/^The AI /,'The Archivist '));for(const event of state.events){if(event.seq>lastEventSeq){lastEventSeq=event.seq;audio.event(event)}}text(elements.health,state.health.level.toUpperCase());elements.danger.classList.toggle('active',state.scene==='danger');elements.safe.classList.toggle('active',!renderer||state.scene==='recovery'||state.health.level==='safe-scene');text(elements.connection,evidenceFrame?'REPLAY':'LIVE');document.body.dataset.replay=String(evidenceFrame);failures=0;
}
window.__ESCAPE_PRESENT_FRAME__=state=>{if(disposed)return;evidenceFrame=true;presentationEpoch++;activePollController?.abort();update(state)};
window.__ESCAPE_RESUME_LIVE__=()=>{if(disposed)return;evidenceFrame=false;presentationEpoch++;activePollController?.abort();poll()};
$('resume-live-button')?.addEventListener('click',()=>window.__ESCAPE_RESUME_LIVE__());
async function poll(){
  if(disposed||inFlight||evidenceFrame)return;
  inFlight=true;
  const requestEpoch=presentationEpoch,controller=new AbortController();activePollController=controller;
  const params=new URLSearchParams({w:String(innerWidth),h:String(innerHeight),reducedMotion:modes.reducedMotion?'1':'0',cleanFeed:modes.cleanFeed?'1':'0',muted:modes.muted?'1':'0'}),url=`/escape-room/state?${params}`;
  try{
    const liveState=await stateClient.read(url,{signal:controller.signal});
    if(disposed||evidenceFrame||requestEpoch!==presentationEpoch)return;
    update(liveState);
  }catch(error){
    if(!disposed&&!evidenceFrame&&requestEpoch===presentationEpoch){
      failures++;text(elements.connection,failures>2?'RESTORING':'RECONNECTING');if(failures>5)elements.safe.classList.add('active');if(failures===1)console.warn('Escape Room state reconnect',error?.message||'network');
    }
  }finally{
    if(activePollController===controller)activePollController=null;
    inFlight=false;
    if(!disposed&&!evidenceFrame&&requestEpoch!==presentationEpoch)queueMicrotask(poll);
  }
}
const pollInterval=setInterval(poll,180);poll();
addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;presentationEpoch++;clearInterval(pollInterval);activePollController?.abort();stateClient.dispose();renderer?.dispose();audio.context?.close().catch(()=>{});});
