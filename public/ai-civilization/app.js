'use strict';
const byId=id=>document.getElementById(id);
const state={snapshot:null,eventSource:null,reconnectAttempt:0,lastEventSequence:-1,audio:null,audioEnabled:true};
const preferences={get(key){try{return window.localStorage.getItem(key)}catch{return null}},set(key,value){try{window.localStorage.setItem(key,value)}catch{}}};
const palette=[['#74e0aa','#214b37'],['#f1c86f','#70512c'],['#91c8ff','#294e72'],['#f18a82','#66302d'],['#d9f77e','#46602a'],['#d2a5ff','#543270'],['#81e5e5','#285e60'],['#f5aee0','#6c315b']];
function text(id,value){const node=byId(id);if(node)node.textContent=String(value??'—')}
function pct(value){return`${Math.round(Math.max(0,Math.min(1,value))*100)}%`}
function title(value){return String(value??'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function setConnection(mode,label){const node=byId('connection');node.dataset.state=mode;node.textContent=label;byId('recovery-slate').hidden=mode==='live'}
function portrait(node,recipe){if(!node||!recipe)return;const pair=palette[recipe.palette%palette.length];node.style.setProperty('--portrait-a',pair[0]);node.style.setProperty('--portrait-b',pair[1]);node.dataset.silhouette=recipe.silhouette;node.title=`${title(recipe.silhouette)} portrait with ${title(recipe.emblem)} emblem`}
function renderMap(world){
  const map=byId('kingdom-map');map.style.setProperty('--map-width',world.width);map.replaceChildren();
  const fragment=document.createDocumentFragment();
  for(const tile of world.tiles){
    const cell=document.createElement('div');cell.className='tile';cell.dataset.terrain=tile.terrain;cell.dataset.owner=tile.owner;
    cell.dataset.building=String(Boolean(tile.building));cell.dataset.capital=String(tile.capital);cell.dataset.hazard=String(Boolean(tile.hazard));cell.dataset.focus=String(tile.index===world.focusTile);
    cell.title=`${title(tile.terrain)} · ${title(tile.owner)}${tile.building?` · ${tile.building}`:''}${tile.hazard?` · Threat: ${tile.hazard}`:''}`;
    cell.setAttribute('aria-hidden','true');fragment.appendChild(cell);
  }
  map.appendChild(fragment);map.setAttribute('aria-label',`${world.width} by ${world.height} kingdom map. Focus tile ${world.focusTile}.`);
}
function renderResources(resources){const root=byId('resources');root.replaceChildren();for(const resource of resources){const row=document.createElement('div');row.className='resource';const name=document.createElement('span');name.textContent=title(resource.key);const value=document.createElement('b');value.dataset.direction=resource.direction;value.textContent=`${resource.direction==='up'?'↑':resource.direction==='down'?'↓':'•'} ${resource.value}`;row.append(name,value);root.appendChild(row)}}
function renderCourt(characters){
  const root=byId('court');root.replaceChildren();
  for(const member of[characters.heir,...characters.councillors]){const row=document.createElement('div');row.className='court-member';const name=document.createElement('strong');name.textContent=member.name;const role=document.createElement('span');role.textContent=`${member.role} · ${member.expression}`;row.append(name,role);root.appendChild(row)}
  const rivals=byId('rivals');rivals.replaceChildren();for(const rival of characters.rivals){const row=document.createElement('div');row.className='rival-row';const name=document.createElement('strong');name.textContent=rival.name;const status=document.createElement('span');status.textContent=`${title(rival.status)} · ${title(rival.strengthBand)} · ${title(rival.tensionBand)} tension`;row.append(name,status);rivals.appendChild(row)}
}
function renderEvents(events){const root=byId('event-rail');root.replaceChildren();for(const event of events.slice(0,6)){const item=document.createElement('li');item.className='event';item.dataset.importance=String(event.importance);const time=document.createElement('span');time.textContent=`DAY ${event.tick}`;const heading=document.createElement('strong');heading.textContent=event.title;const detail=document.createElement('p');detail.textContent=event.detail;item.append(time,heading,detail);root.appendChild(item)}if(!events.length){const item=document.createElement('li');item.className='event';item.textContent='The kingdom is gathering its first chronicle entry.';root.appendChild(item)}}
function render(snapshot){
  state.snapshot=snapshot;text('subtitle',snapshot.headline.subtitle);text('era-clock',`Year ${snapshot.time.year} · Day ${snapshot.time.day}`);text('tier-chip',snapshot.progress.tier);
  text('goal',snapshot.goal.name);text('decree',`${snapshot.goal.decree} · ${snapshot.goal.pressure}`);
  const danger=byId('danger');danger.dataset.level=snapshot.danger.level;danger.querySelector('.danger-label').textContent=snapshot.danger.level.toUpperCase();text('danger-cause',snapshot.danger.cause);text('danger-instruction',snapshot.danger.instruction);
  text('renown',`${snapshot.progress.renown.toLocaleString()} renown`);text('next-tier',`Next ${snapshot.progress.nextTierRenown.toLocaleString()}`);byId('progress-fill').style.width=pct(snapshot.progress.percent);
  renderMap(snapshot.world);text('ruler-name',snapshot.characters.ruler.name);text('ruler-intent',snapshot.characters.ruler.intent);portrait(byId('ruler-portrait'),snapshot.characters.ruler.portrait);
  const traits=byId('ruler-traits');traits.replaceChildren();for(const trait of snapshot.characters.ruler.traits){const badge=document.createElement('span');badge.textContent=trait;traits.appendChild(badge)}
  text('population',snapshot.realm.population.total.toLocaleString());text('housing',`${snapshot.realm.population.housing} housing · ${snapshot.realm.population.lastDelta>=0?'+':''}${snapshot.realm.population.lastDelta} today`);text('stability',snapshot.realm.stability);text('defence',snapshot.realm.defence);text('great-works',snapshot.progress.completedGreatWorks);text('great-work-progress',snapshot.progress.greatWork?`${snapshot.progress.greatWork.name} · ${snapshot.progress.greatWork.progress}%`:'No active work');
  renderResources(snapshot.realm.resources);renderCourt(snapshot.characters);renderEvents(snapshot.events);text('audience-state',snapshot.audience.label);text('summary',snapshot.accessibility.summary);text('captions',snapshot.accessibility.caption);document.body.dataset.mood=snapshot.scene.mood;document.title=`${snapshot.progress.tier} · ${snapshot.characters.ruler.name} · AI Civilization`;
}
async function fetchState(){const response=await fetch('/civilization/state',{cache:'no-store'});if(!response.ok)throw new Error('state unavailable');const snapshot=await response.json();render(snapshot);setConnection('live','LIVE');state.reconnectAttempt=0;return snapshot}
function connect(){
  state.eventSource?.close();const source=new EventSource('/civilization/stream');state.eventSource=source;
  source.addEventListener('snapshot',event=>{try{render(JSON.parse(event.data));setConnection('live','LIVE');state.reconnectAttempt=0}catch{setConnection('degraded','RECOVERING')}});
  source.onerror=()=>{source.close();state.reconnectAttempt++;setConnection('degraded','RECONNECTING');const delay=Math.min(8000,500*2**Math.min(state.reconnectAttempt,4));window.setTimeout(()=>{fetchState().catch(()=>{});connect()},delay)};
}
function toggle(id,className,key){const button=byId(id);const active=!document.body.classList.contains(className);document.body.classList.toggle(className,active);button.setAttribute('aria-pressed',String(active));preferences.set(key,String(active));return active}
function initControls(){
  const saved=[['motion-toggle','reduce-motion','civilization.motion'],['contrast-toggle','high-contrast','civilization.contrast'],['text-toggle','large-text','civilization.text']];for(const [id,className,key]of saved){const active=preferences.get(key)==='true';document.body.classList.toggle(className,active);byId(id).setAttribute('aria-pressed',String(active));byId(id).addEventListener('click',()=>toggle(id,className,key))}
  byId('audio-toggle').addEventListener('click',()=>{state.audioEnabled=!state.audioEnabled;byId('audio-toggle').setAttribute('aria-pressed',String(state.audioEnabled));byId('audio-toggle').textContent=state.audioEnabled?'Audio on':'Audio muted';preferences.set('civilization.audio',String(state.audioEnabled));if(state.audioEnabled)ensureAudio()});state.audioEnabled=preferences.get('civilization.audio')!=='false';byId('audio-toggle').textContent=state.audioEnabled?'Audio on':'Audio muted';byId('audio-toggle').setAttribute('aria-pressed',String(state.audioEnabled));
}
function ensureAudio(){if(!state.audio&&state.audioEnabled){const AudioContext=window.AudioContext||window.webkitAudioContext;if(AudioContext)state.audio=new AudioContext()}if(state.audio?.state==='suspended')state.audio.resume().catch(()=>{})}
function playEventCue(event){if(event.sequence<=state.lastEventSequence)return;state.lastEventSequence=event.sequence;if(!state.audioEnabled||!state.audio)return;const frequencies={crisis:190,result:430,dynasty:520,'great-work':620,milestone:580,construction:450};const frequency=frequencies[event.kind]||360;try{const oscillator=state.audio.createOscillator(),gain=state.audio.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,state.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.09,state.audio.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,state.audio.currentTime+.22);oscillator.connect(gain).connect(state.audio.destination);oscillator.start();oscillator.stop(state.audio.currentTime+.24)}catch{}}
async function pollEvents(){try{const response=await fetch('/civilization/events',{cache:'no-store'});if(!response.ok)return;const events=await response.json();for(const event of events.slice().sort((a,b)=>a.sequence-b.sequence))playEventCue(event)}catch{}finally{window.setTimeout(pollEvents,2500)}}
window.addEventListener('DOMContentLoaded',()=>{initControls();document.addEventListener('pointerdown',ensureAudio,{once:true});fetchState().then(connect).catch(()=>{setConnection('degraded','RECONNECTING');connect()});pollEvents()});
