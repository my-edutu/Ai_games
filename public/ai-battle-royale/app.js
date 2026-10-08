'use strict';
(()=>{const MAX_EFFECTS=48,MAX_VOICES=6;const params=new URLSearchParams(location.search),cleanFeed=params.get('cleanFeed')==='1',reducedMotion=params.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches,reducedFlash=params.get('reducedFlash')==='1',highContrast=params.get('highContrast')==='1';let muted=params.get('muted')!=='0',audioContext=null,activeVoices=0,lastSnapshot=null,lastRunToken='',lastRevision=-1;const seenCues=new Set(),effects=[];document.body.dataset.reducedMotion=String(reducedMotion);document.body.dataset.reducedFlash=String(reducedFlash);document.body.dataset.highContrast=String(highContrast);document.body.classList.toggle('clean-feed',cleanFeed);document.body.classList.toggle('theatre-mode',params.get('layout')!=='panels');const canvas=document.querySelector('[data-testid="battle-canvas"]'),context=canvas.getContext('2d',{alpha:false}),objective=document.querySelector('[data-testid="objective"]'),tick=document.querySelector('[data-testid="tick"]'),intent=document.querySelector('[data-testid="ai-intent"]'),caption=document.querySelector('#caption-text'),progress=document.querySelector('#match-progress'),zonePhase=document.querySelector('#zone-phase'),zoneTimer=document.querySelector('#zone-timer'),arenaStatus=document.querySelector('#arena-status'),focusName=document.querySelector('#focus-name'),focusWeapon=document.querySelector('#focus-weapon'),focusAmmo=document.querySelector('#focus-ammo'),focusMedkits=document.querySelector('#focus-medkits'),focusConfidence=document.querySelector('#focus-confidence'),healthBar=document.querySelector('#health-bar'),shieldBar=document.querySelector('#shield-bar'),voteCard=document.querySelector('#vote-card'),voteTitle=document.querySelector('#vote-title'),voteOptions=document.querySelector('#vote-options'),leaderboard=document.querySelector('#leaderboard'),killFeed=document.querySelector('#kill-feed'),sceneBanner=document.querySelector('#scene-banner'),operatorPanel=document.querySelector('#operator-panel'),operatorTokenInput=document.querySelector('#operator-token'),operatorStatus=document.querySelector('#operator-status'),muteControl=document.querySelector('#mute-control');
const palette={ember:{background:'#070b12',grid:'rgba(255,255,255,.045)',zone:'#ff9d3d',cover:'#39475a',obstacle:'#182130',loot:'#ffd166'},neon:{background:'#050814',grid:'rgba(92,240,255,.065)',zone:'#5cf0ff',cover:'#29365d',obstacle:'#121a34',loot:'#f472ff'},arctic:{background:'#07131c',grid:'rgba(191,232,255,.065)',zone:'#8bdcff',cover:'#34566b',obstacle:'#142d3d',loot:'#fff2a8'}};
function sizeCanvas(){const box=canvas.getBoundingClientRect(),ratio=Math.min(2,Math.max(1,devicePixelRatio||1)),width=Math.max(1,Math.round(box.width*ratio)),height=Math.max(1,Math.round(box.height*ratio));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}context.setTransform(ratio,0,0,ratio,0,0);return{width:box.width,height:box.height}}
function cellPoint(cell,arena,scale,offsetX,offsetY){return{x:offsetX+(cell%arena.width+.5)*scale,y:offsetY+(Math.floor(cell/arena.width)+.5)*scale}}
function pathShape(ctx,archetype,x,y,radius){ctx.beginPath();if(archetype==='vanguard'){for(let index=0;index<6;index+=1){const angle=Math.PI/3*index-Math.PI/2,px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;if(index===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath()}else if(archetype==='ranger'){ctx.moveTo(x,y-radius);ctx.lineTo(x+radius*.9,y+radius*.8);ctx.lineTo(x-radius*.9,y+radius*.8);ctx.closePath()}else if(archetype==='scavenger'){ctx.moveTo(x,y-radius);ctx.lineTo(x+radius,y);ctx.lineTo(x,y+radius);ctx.lineTo(x-radius,y);ctx.closePath()}else{ctx.rect(x-radius*.78,y-radius*.78,radius*1.56,radius*1.56)}}
function drawCombatant(ctx,combatant,snapshot,scale,offsetX,offsetY,theme){const point=cellPoint(combatant.cell,snapshot.arena,scale,offsetX,offsetY),radius=Math.max(4,scale*.32),colours={vanguard:'#ff6b5e',ranger:'#7bdff2',scavenger:'#ffd166',tactician:'#b8f28b'};ctx.save();ctx.globalAlpha=combatant.alive?1:.28;ctx.lineWidth=Math.max(1.5,scale*.09);ctx.strokeStyle=highContrast?'#fff':'rgba(255,255,255,.9)';ctx.fillStyle=colours[combatant.archetype];pathShape(ctx,combatant.archetype,point.x,point.y,radius);ctx.fill();ctx.stroke();if(combatant.archetype==='tactician'){ctx.beginPath();ctx.moveTo(point.x-radius*.5,point.y);ctx.lineTo(point.x+radius*.5,point.y);ctx.moveTo(point.x,point.y-radius*.5);ctx.lineTo(point.x,point.y+radius*.5);ctx.stroke()}if(combatant.archetype==='scavenger'){ctx.beginPath();ctx.moveTo(point.x-radius*.55,point.y);ctx.lineTo(point.x+radius*.55,point.y);ctx.stroke()}if(snapshot.focus&&snapshot.focus.id===combatant.id&&combatant.alive){ctx.beginPath();ctx.arc(point.x,point.y,radius+Math.max(3,scale*.18),0,Math.PI*2);ctx.strokeStyle=theme.zone;ctx.lineWidth=Math.max(2,scale*.1);ctx.stroke()}if(!combatant.alive){ctx.beginPath();ctx.moveTo(point.x-radius,point.y-radius);ctx.lineTo(point.x+radius,point.y+radius);ctx.moveTo(point.x+radius,point.y-radius);ctx.lineTo(point.x-radius,point.y+radius);ctx.strokeStyle='#fff';ctx.stroke()}if(scale>=16){const health=Math.max(0,combatant.health/Math.max(1,combatant.maxHealth)),shield=Math.max(0,combatant.shield/Math.max(1,combatant.maxShield));ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(point.x-radius,point.y+radius+2,radius*2,3);ctx.fillStyle='#ff5266';ctx.fillRect(point.x-radius,point.y+radius+2,radius*2*health,1.5);ctx.fillStyle='#62c8ff';ctx.fillRect(point.x-radius,point.y+radius+3.5,radius*2*shield,1.5)}ctx.restore()}
function drawArena(snapshot){if(window.BattleArena3D&&window.BattleArena3D.render(snapshot))return;const viewport=sizeCanvas(),theme=palette[snapshot.arena.theme]||palette.ember,scale=Math.min(viewport.width/snapshot.arena.width,viewport.height/snapshot.arena.height),boardWidth=snapshot.arena.width*scale,boardHeight=snapshot.arena.height*scale,offsetX=(viewport.width-boardWidth)/2,offsetY=(viewport.height-boardHeight)/2;context.fillStyle=theme.background;context.fillRect(0,0,viewport.width,viewport.height);context.save();context.translate(offsetX,offsetY);context.strokeStyle=theme.grid;context.lineWidth=1;for(let x=0;x<=snapshot.arena.width;x+=1){context.beginPath();context.moveTo(x*scale,0);context.lineTo(x*scale,boardHeight);context.stroke()}for(let y=0;y<=snapshot.arena.height;y+=1){context.beginPath();context.moveTo(0,y*scale);context.lineTo(boardWidth,y*scale);context.stroke()}context.fillStyle=theme.obstacle;for(const cell of snapshot.arena.obstacles){const x=cell%snapshot.arena.width,y=Math.floor(cell/snapshot.arena.width);context.fillRect(x*scale+1,y*scale+1,Math.max(1,scale-2),Math.max(1,scale-2))}context.fillStyle=theme.cover;for(const cell of snapshot.arena.cover){const x=cell%snapshot.arena.width,y=Math.floor(cell/snapshot.arena.width);context.fillRect(x*scale+scale*.2,y*scale+scale*.2,scale*.6,scale*.6)}context.restore();const center=cellPoint(snapshot.zone.centerCell,snapshot.arena,scale,offsetX,offsetY);context.save();context.strokeStyle=theme.zone;context.lineWidth=Math.max(2,scale*.09);context.setLineDash(highContrast?[]:[Math.max(5,scale*.4),Math.max(3,scale*.25)]);context.beginPath();context.arc(center.x,center.y,snapshot.zone.radius*scale,0,Math.PI*2);context.stroke();context.setLineDash([]);context.fillStyle=theme.loot;for(const loot of snapshot.arena.loot.slice(0,80)){const point=cellPoint(loot.cell,snapshot.arena,scale,offsetX,offsetY),radius=Math.max(1.5,scale*.1);context.beginPath();context.arc(point.x,point.y,radius,0,Math.PI*2);context.fill()}context.restore();for(const combatant of snapshot.combatants)drawCombatant(context,combatant,snapshot,scale,offsetX,offsetY,theme);drawEffects(snapshot,scale,offsetX,offsetY,theme);if(snapshot.scene==='recovery'){context.fillStyle='rgba(3,6,11,.72)';context.fillRect(0,0,viewport.width,viewport.height);context.fillStyle='#fff';context.font=`800 ${Math.max(20,viewport.width/35)}px system-ui`;context.textAlign='center';context.fillText('VERIFIED RECOVERY',viewport.width/2,viewport.height/2)}}
function drawEffects(snapshot,scale,offsetX,offsetY,theme){const now=performance.now();for(let index=effects.length-1;index>=0;index-=1){const effect=effects[index],age=now-effect.created;if(age>1400){effects.splice(index,1);continue}const progress=age/1400,point=cellPoint(effect.cell??snapshot.zone.centerCell,snapshot.arena,scale,offsetX,offsetY);context.save();context.globalAlpha=1-progress;context.strokeStyle=effect.kind==='elimination'?'#ff5266':theme.zone;context.lineWidth=Math.max(1,3*(1-progress));context.beginPath();context.arc(point.x,point.y,scale*(.4+progress*1.4),0,Math.PI*2);context.stroke();context.restore()}}
function captureEffects(snapshot){for(const event of snapshot.recentEvents){if(event.importance<4)continue;const key=`${snapshot.runToken}:${event.sequence}`;if(effects.some(effect=>effect.key===key))continue;effects.push({key,kind:event.type,cell:event.cell,created:performance.now()})}if(effects.length>MAX_EFFECTS)effects.splice(0,effects.length-MAX_EFFECTS)}
function replaceList(container,items){const fragment=document.createDocumentFragment();for(const item of items){const li=document.createElement('li'),mark=document.createElement('span'),label=document.createElement('span'),metric=document.createElement('span');mark.textContent=item.mark;label.textContent=item.label;metric.textContent=item.metric;li.append(mark,label,metric);fragment.append(li)}container.replaceChildren(fragment)}
const arenaBiome=document.querySelector('#arena-biome'),
  arenaCounter=document.querySelector('#arena-counter'),
  arenaContenders=document.querySelector('#arena-contenders'),
  arenaStorm=document.querySelector('#arena-storm'),
  arenaDirector=document.querySelector('#arena-director');
function updateArenaChips(snapshot,status){
  const biome={ember:'CINDER BADLANDS',neon:'NEON DISTRICT',arctic:'FROST FRONTIER'}[snapshot.arena.theme]||'BATTLE ARENA';
  if(arenaBiome)arenaBiome.textContent=biome;
  if(arenaCounter)arenaCounter.textContent='TICK '+String(snapshot.tick);
  if(arenaContenders)arenaContenders.textContent=String(snapshot.goal.survivors)+' / '+String(snapshot.goal.totalContenders);
  if(arenaStorm)arenaStorm.textContent='PHASE '+String(snapshot.zone.phase);
  if(arenaDirector)arenaDirector.textContent=snapshot.scene==='result'
    ?'RESULT CONFIRMED':status.simulationFault?'SYSTEM RECOVERY'
    :snapshot.scene==='final-circle'?'FINAL CIRCLE':'AI CAMERA ACTIVE';
  document.body.dataset.arenaBiome=snapshot.arena.theme;
}
const battleHighlight=document.querySelector('#battle-highlight');
const highlightKicker=document.querySelector('#battle-highlight-kicker');
const highlightTitle=document.querySelector('#battle-highlight-title');
const highlightMeta=document.querySelector('#battle-highlight-meta');
let lastHighlightRun='',lastHighlightSequence=-1,highlightTimer=null;
function updateBattleHighlight(snapshot){
  if(!battleHighlight)return;
  if(lastHighlightRun!==snapshot.runToken){
    lastHighlightRun=snapshot.runToken;
    lastHighlightSequence=-1;
    battleHighlight.hidden=true;
    if(highlightTimer!==null)clearTimeout(highlightTimer);
    highlightTimer=null;
  }
  // Only report genuine simulation events, not invented fight results.
  const event=snapshot.recentEvents.slice(-12).reverse().find(entry=>
    Number.isSafeInteger(entry.sequence)&&entry.sequence>lastHighlightSequence&&
    (entry.type==='elimination'||entry.type==='shield-broken'));
  if(!event)return;
  lastHighlightSequence=event.sequence;
  highlightKicker.textContent=event.type==='elimination'?'ELIMINATION CONFIRMED':'SHIELD BROKEN';
  highlightTitle.textContent=String(event.detail||'Authoritative arena event').slice(0,140);
  highlightMeta.textContent='VERIFIED AI ACTION • TICK '+String(event.tick??snapshot.tick);
  battleHighlight.hidden=false;
  battleHighlight.dataset.type=event.type;
  if(highlightTimer!==null)clearTimeout(highlightTimer);
  highlightTimer=setTimeout(()=>{battleHighlight.hidden=true;highlightTimer=null},2100);
}
function updatePanels(snapshot,status){objective.textContent=`${snapshot.goal.survivors} survivors of ${snapshot.goal.totalContenders}`;tick.textContent=`Tick ${snapshot.tick}`;progress.style.width=`${Math.round(snapshot.goal.progress*100)}%`;zonePhase.textContent=`Phase ${snapshot.zone.phase}`;zoneTimer.textContent=snapshot.zone.ticksUntilShrink>0?`${snapshot.zone.ticksUntilShrink} ticks`:'Closing';arenaStatus.textContent=status.simulationFault?'Degraded':status.paused?'Paused':'Online';sceneBanner.textContent=snapshot.headline;document.body.dataset.scene=snapshot.scene;updateArenaChips(snapshot,status);updateBattleHighlight(snapshot);const focus=snapshot.focus;if(focus){focusName.textContent=`${focus.name} · ${focus.archetype}`;focusWeapon.textContent=String(focus.weapon||'Unarmed').replaceAll('-',' ').toUpperCase();focusAmmo.textContent=String(focus.ammo);focusMedkits.textContent=String(focus.medkits);focusConfidence.textContent=`${focus.confidence}%`;intent.textContent=`${focus.intent.replaceAll('-',' ')} — ${focus.goal}`;healthBar.style.transform=`scaleX(${focus.health/Math.max(1,focus.maxHealth)})`;shieldBar.style.transform=`scaleX(${focus.shield/Math.max(1,focus.maxShield)})`}else{focusName.textContent='No active contender';for(const value of [focusWeapon,focusAmmo,focusMedkits,focusConfidence])value.textContent='—';intent.textContent='Awaiting the next deterministic match.';healthBar.style.transform='scaleX(0)';shieldBar.style.transform='scaleX(0)'}caption.textContent=snapshot.captions.join(' • ');replaceList(leaderboard,snapshot.leaderboard.map((entry,index)=>({mark:String(index+1).padStart(2,'0'),label:`${entry.name} · ${entry.archetype}`,metric:entry.alive?`${entry.eliminations} K`:'OUT'})));const decisive=snapshot.recentEvents.filter(event=>event.importance>=3).slice(-7).reverse().map(event=>({mark:event.type==='elimination'?'✕':'•',label:event.detail?`${event.type.replaceAll('-',' ')} · ${event.detail}`:event.type.replaceAll('-',' '),metric:`T${event.tick}`}));replaceList(killFeed,decisive.length?decisive:[{mark:'•',label:'Arena telemetry nominal',metric:`T${snapshot.tick}`}]);const vote=snapshot.audience.currentVote;if(vote&&vote.status==='open'){voteCard.hidden=false;voteTitle.textContent=`Vote closes in ${vote.ticksRemaining} ticks`;voteOptions.textContent=vote.options.map(option=>`${option.effectId.replaceAll('-',' ')} ${option.weight}`).join(' · ')}else voteCard.hidden=true}
function ensureAudio(){if(muted)return null;if(!audioContext){const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return null;audioContext=new AudioCtor()}if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});return audioContext}
let broadcastNoise=null;
function panForCue(cue,snapshot){
  if(!snapshot?.arena?.width)return 0;
  const match=String(cue.id).match(/:(\d+)$/);
  const sequence=match?Number(match[1]):NaN;
  const event=snapshot.recentEvents.find(e=>e.sequence===sequence);
  const cell=Number.isInteger(event?.cell)?event.cell:
    cue.category==='danger'?snapshot.zone.centerCell:null;
  if(!Number.isInteger(cell))return 0;
  const x=(cell%snapshot.arena.width+.5)/snapshot.arena.width;
  return Math.max(-.75,Math.min(.75,(x-.5)*1.5));
}
function noiseForCue(audio,cue,destination,start,duration){
  if(typeof audio.createBufferSource!=='function'||typeof audio.createBuffer!=='function')return;
  if(!broadcastNoise){
    const rate=audio.sampleRate||44100;
    const length=Math.floor(rate*.95);
    broadcastNoise=audio.createBuffer(1,length,rate);
    const data=broadcastNoise.getChannelData(0);
    let seed=0x71a294c3;
    for(let i=0;i<data.length;i++){
      seed=(Math.imul(seed,1664525)+1013904223)|0;
      data[i]=((seed>>>8)/0xffffff)*2-1;
    }
  }
  const source=audio.createBufferSource(),gain=audio.createGain();
  source.buffer=broadcastNoise;
  const amount=cue.category==='action'?.11:cue.category==='danger'?.07:.028;
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.linearRampToValueAtTime(amount,start+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  if(typeof audio.createBiquadFilter==='function'){
    const filter=audio.createBiquadFilter();
    filter.type=cue.category==='action'?'bandpass':'lowpass';
    filter.frequency.setValueAtTime(cue.category==='action'?1900:620,start);
    source.connect(filter).connect(gain).connect(destination);
  }else source.connect(gain).connect(destination);
  source.start(start);
  source.stop(start+Math.min(duration,.88));
}
function tone(cue,snapshot){
  const audio=ensureAudio();
  if(!audio||activeVoices>=MAX_VOICES)return;
  activeVoices+=1;
  const category=cue.category||'action',now=audio.currentTime;
  const profile={
    terminal:{hz:300,endHz:480,duration:.76,wave:'triangle'},
    danger:{hz:120,endHz:71,duration:.48,wave:'sawtooth'},
    elimination:{hz:260,endHz:108,duration:.46,wave:'triangle'},
    audience:{hz:520,endHz:720,duration:.28,wave:'sine'},
    action:{hz:380,endHz:138,duration:.19,wave:'square'},
    ambience:{hz:67,endHz:56,duration:.85,wave:'sine'}
  }[category]||{hz:380,endHz:180,duration:.19,wave:'triangle'};
  const panner=typeof audio.createStereoPanner==='function'?audio.createStereoPanner():null;
  if(panner){
    panner.pan.setValueAtTime(panForCue(cue,snapshot),now);
    panner.connect(audio.destination);
  }
  const destination=panner||audio.destination;
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type=profile.wave;
  oscillator.frequency.setValueAtTime(profile.hz,now);
  oscillator.frequency.exponentialRampToValueAtTime(profile.endHz,now+profile.duration);
  const level=Math.min(.09,Math.max(.003,(Number(cue.gain)||.3)*.115));
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(level,now+.022);
  gain.gain.exponentialRampToValueAtTime(.0001,now+profile.duration);
  oscillator.connect(gain).connect(destination);
  try{noiseForCue(audio,cue,destination,now,profile.duration)}catch{}
  oscillator.start(now);
  oscillator.stop(now+profile.duration+.02);
  oscillator.addEventListener('ended',()=>{activeVoices=Math.max(0,activeVoices-1)},{once:true});
}
function playCues(cues,snapshot){
  for(const cue of cues){
    if(seenCues.has(cue.id))continue;
    seenCues.add(cue.id);
    tone(cue,snapshot);
  }
  if(seenCues.size>256){
    const retained=[...seenCues].slice(-128);
    seenCues.clear();
    for(const key of retained)seenCues.add(key);
  }
}
let refreshInFlight=false;
async function refresh(){if(refreshInFlight)return;refreshInFlight=true;try{const query=new URLSearchParams({w:String(innerWidth),h:String(innerHeight),cleanFeed:cleanFeed?'1':'0'}),response=await fetch(`/battle/state?${query}`,{cache:'no-store'});if(!response.ok)throw new Error(`state-${response.status}`);const payload=await response.json(),snapshot=payload.snapshot;if(!snapshot)return;if(snapshot.runToken!==lastRunToken){lastRunToken=snapshot.runToken;lastRevision=-1;effects.length=0}if(snapshot.revision<lastRevision)return;lastRevision=snapshot.revision;window.__BATTLE_PUBLIC_STATE__=snapshot;captureEffects(snapshot);updatePanels(snapshot,payload.status);drawArena(snapshot);playCues(payload.audioCues||[],snapshot);lastSnapshot=snapshot}catch{arenaStatus.textContent='Reconnecting'}finally{refreshInFlight=false}}
function configureControls(){const controls=params.get('controls')==='1';operatorPanel.hidden=!controls;if(!controls)return;for(const button of operatorPanel.querySelectorAll('[data-command]'))button.addEventListener('click',async()=>{const command=button.dataset.command,token=operatorTokenInput?.value??'';if(!token){operatorStatus.textContent='Operator token required';operatorTokenInput?.focus();return}operatorStatus.textContent=`Sending ${command}…`;try{const response=await fetch('/battle/command',{method:'POST',headers:{'content-type':'application/json','x-battle-operator-token':token},body:JSON.stringify({command})}),body=await response.json();operatorStatus.textContent=response.ok?`${command} accepted`:(body.error||'Command rejected')}catch{operatorStatus.textContent='Command unavailable'}});muteControl.textContent=muted?'Audio muted':'Audio enabled';muteControl.addEventListener('click',()=>{muted=!muted;muteControl.textContent=muted?'Audio muted':'Audio enabled';if(!muted)ensureAudio()})}
configureControls();addEventListener('resize',()=>{if(lastSnapshot)drawArena(lastSnapshot)});refresh();setInterval(refresh,180);})();
