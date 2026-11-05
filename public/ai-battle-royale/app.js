import * as THREE from './vendor/three.module.js';
import {createBattlefield} from './world.js';
import {createCombatant} from './characters.js';
import {createAudio} from './audio.js';

const $ = id => document.getElementById(id);
const canvas = $('arena');
let audio = createAudio();
const app = $('app'), connection = $('connection');
const query = new URLSearchParams(location.search), inspectionEnabled = query.has('inspect');
const captureAfterFirstFrame = inspectionEnabled && query.get('capture') === '1';
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedQuery.matches, lowQuality = innerWidth < 700 || query.get('quality') === 'low';
$('reduced-motion').checked = reducedMotion; $('low-quality').checked = lowQuality;
let snapshot, previous, receivedAt = 0, matchId = null, world, focusedId = null;
let mode = 'director', lastSwitch = 0, lastAnnouncedStage = -1, announcementUntil = 0, cameraReady = false, viewYaw = .6;
let renderer, scene, camera, sun, animationId, pollTimer, disposed = false, suspended = false, frameCount = 0, inspectionFrozen = false, renderedMatch = null, renderedTick = null;
let activePoll, activePollTimeout, lifecycle = 0, retryTimer, contextTimer, contextLost = false, worldNeedsReset = true;
let renderState = 'starting', renderFailures = 0, lastFrameMs = 0, lastBuildMs = 0;
const maxRenderRetries = 3, contextRecoveryMs = 12000, listeners = new AbortController();
let rosterListeners = new AbortController();
let lastFrame = performance.now(), elapsed = 0, frames = 0, framesAt = performance.now(), measuredFps = 0;
let pointerDown = false, pointerX = 0, orbitOffset = 0, zoom = 1;
const actors = new Map(), pickups = new Map(), rosterRows = new Map(), effects = [];
const lowMaterials = new Map(), materialBindings = new Map();
let effectCursor = 0, lastPollError = '';
const stage = new THREE.Group(), combatants = new THREE.Group(), fx = new THREE.Group();
const targetPosition = new THREE.Vector3(), desiredCamera = new THREE.Vector3(), lookAt = new THREE.Vector3();
const mapCanvas = $('minimap'), mapContext = mapCanvas.getContext('2d');
let selectedRing, zoneWall, zoneRing;

function clock(seconds) { const s = Math.max(0, Math.ceil(seconds || 0)); return `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`; }
function shortName(text) { return String(text ?? '').replace(/[-_]/g, ' ').toUpperCase(); }
function isVisible(el, value) { el.hidden = !value; }
function active() { return !disposed && !suspended && !inspectionFrozen; }
function on(target, name, handler, options = {}) { target.addEventListener(name, handler, {...options, signal:listeners.signal}); }
function disposeResource(resource) {
  try { resource?.dispose(); }
  catch(error) { console.error('Royale resource cleanup failed:', {message:String(error?.message || error)}); }
}
function cleanupMesh(mesh) {
  const resources = new Set();
  mesh?.traverse?.(child => {
    if(child.geometry)resources.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : child.material ? [child.material] : []) { if(material.map)resources.add(material.map); resources.add(material); }
  });
  for(const resource of resources)disposeResource(resource);
}
function releaseLowMaterials() {
  // Restore the owners' originals before their normal disposal paths run.
  for(const [object, material] of materialBindings)object.material=material;
  materialBindings.clear();
  for(const material of lowMaterials.values())disposeResource(material);
  lowMaterials.clear();
}
function lowMaterial(original) {
  if(!original?.isMeshStandardMaterial)return original;
  let material=lowMaterials.get(original);
  if(!material) {
    material=new THREE.MeshLambertMaterial();
    THREE.Material.prototype.copy.call(material,original);
    // Share textures and mutable colors; the world/rig still owns and animates them.
    for(const key of ['color','map','lightMap','lightMapIntensity','aoMap','aoMapIntensity','emissive','emissiveIntensity','emissiveMap',
      'bumpMap','bumpScale','normalMap','normalMapType','normalScale','displacementMap','displacementScale','displacementBias',
      'alphaMap','wireframe','wireframeLinewidth','wireframeLinecap','wireframeLinejoin','flatShading','fog'])material[key]=original[key];
    lowMaterials.set(original,material);
  }
  return material;
}
function applyMaterialQuality() {
  if(!lowQuality){releaseLowMaterials();return;}
  scene?.traverse(object=>{
    if(!object.material || materialBindings.has(object))return;
    const original=object.material;
    const material=Array.isArray(original)?original.map(lowMaterial):lowMaterial(original);
    const changed=Array.isArray(original)?material.some((entry,index)=>entry!==original[index]):material!==original;
    if(changed){materialBindings.set(object,original);object.material=material;}
  });
}
function syncLowMaterials() {
  for(const [original,material] of lowMaterials) {
    material.opacity=original.opacity;
    material.emissiveIntensity=original.emissiveIntensity;
  }
}
function resultVisible(next) {
  return renderState === 'healthy' && renderedMatch === next?.matchId && renderedTick === next?.tick && next?.phase === 'intermission';
}
function updateStatus() {
  let message = '';
  if(renderState === 'failed') message = 'The 3D view is unavailable. Match results are hidden. Refresh this page to try again, or enable hardware acceleration in a WebGL-capable browser.';
  else if(renderState === 'context-lost') message = 'Restoring the 3D view… Match results are hidden until the view recovers.';
  else if(renderState === 'recovering') message = `Restoring the 3D view… Recovery attempt ${renderFailures} of ${maxRenderRetries}.`;
  else if(lastPollError) message = snapshot ? 'Reconnecting to the match… The last verified view is held.' : 'The arena is unavailable. Retrying automatically…';
  else if(renderState === 'starting') message = 'Preparing the arena…';
  connection.hidden = !message;
  connection.classList.toggle('reconnecting', renderState === 'healthy' && !!lastPollError && !!snapshot);
  if(connection.textContent !== message)connection.textContent = message;
  isVisible($('result'), resultVisible(snapshot));
  if(renderState !== 'healthy')isVisible($('announcement'), false);
}
function clearEffects() {
  for (const effect of effects) {fx.remove(effect.mesh);cleanupMesh(effect.mesh);}effects.length=0;
}
function releaseWorld() {
  releaseLowMaterials();
  if(world) {stage.remove(world.group);disposeResource(world);world=undefined;}
  for(const actor of actors.values()) {combatants.remove(actor.group);cleanupMesh(actor.label);disposeResource(actor);}actors.clear();
  for(const mesh of pickups.values()) {scene?.remove(mesh);cleanupMesh(mesh);}pickups.clear();
  clearEffects();rosterListeners.abort();rosterRows.clear();$('roster').replaceChildren();worldNeedsReset=true;
}
function releaseRenderer() {
  releaseWorld();
  cleanupMesh(selectedRing);cleanupMesh(zoneWall);cleanupMesh(zoneRing);disposeResource(sun?.shadow);
  scene?.clear();disposeResource(renderer);
  renderer=scene=camera=sun=selectedRing=zoneWall=zoneRing=undefined;
}
function stopWork() {
  lifecycle++;clearTimeout(pollTimer);clearTimeout(activePollTimeout);clearTimeout(retryTimer);clearTimeout(contextTimer);
  pollTimer=activePollTimeout=retryTimer=contextTimer=undefined;
  activePoll?.abort();activePoll=undefined;cancelAnimationFrame(animationId);animationId=undefined;
}
function resetContinuity(next) {
  clearEffects();effectCursor=0;audio.reset();lastAnnouncedStage=-1;announcementUntil=0;lastSwitch=0;
  matchId=next.matchId;cameraReady=false;elapsed=0;renderedMatch=renderedTick=null;worldNeedsReset=true;
}
function failRender(error, source = 'frame') {
  if(disposed || suspended)return;
  cancelAnimationFrame(animationId);animationId=undefined;clearTimeout(retryTimer);retryTimer=undefined;
  console.error('Royale renderer unavailable:', {source, matchId:snapshot?.matchId, tick:snapshot?.tick, attempt:renderFailures, message:String(error?.message || error)});
  if(renderFailures >= maxRenderRetries || inspectionFrozen)renderState='failed';
  else {
    renderState='recovering';renderFailures++;
    retryTimer=setTimeout(recoverRenderer,250 * 2 ** (renderFailures-1));
  }
  updateStatus();
}
function recoverRenderer() {
  retryTimer=undefined;
  if(!active() || contextLost || renderState === 'failed')return;
  try {
    releaseRenderer();setup();
    if(snapshot) {resetContinuity(snapshot);resetWorld(snapshot);previous=snapshot;}
    lastFrame=performance.now();animationId=requestAnimationFrame(frame);
  }catch(error) {failRender(error,'rebuild');}
}
function setup() {
  renderer = new THREE.WebGLRenderer({canvas, antialias:!lowQuality, alpha:false, powerPreference:'high-performance'});
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  if(debug&&/swiftshader|llvmpipe|software/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))){lowQuality=true;$('low-quality').checked=true;}
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowQuality ? .75 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = !lowQuality; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.13;
  scene = new THREE.Scene(); scene.background = new THREE.Color('#b9d9dc'); scene.fog = new THREE.Fog('#b9d9dc',100,330);
  camera = new THREE.PerspectiveCamera(49,innerWidth/innerHeight,.1,600); camera.position.set(58,39,62);
  scene.add(new THREE.HemisphereLight(0xd6eeff,0x8a694d,2.8));
  sun = new THREE.DirectionalLight(0xffefd8,3.2); sun.position.set(-42,74,22); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;
  sun.shadow.camera.near=1;sun.shadow.camera.far=160;sun.shadow.bias=-.0002;sun.shadow.normalBias=.08;
  selectedRing = new THREE.Mesh(new THREE.RingGeometry(1.05,1.14,48),new THREE.MeshBasicMaterial({color:0xdfff6c,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide}));
  selectedRing.rotation.x=-Math.PI/2;selectedRing.position.y=.045;
  zoneWall = new THREE.Mesh(new THREE.CylinderGeometry(1,1,22,128,1,true),new THREE.MeshBasicMaterial({color:0x83e8d4,transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false}));
  zoneRing = new THREE.Mesh(new THREE.RingGeometry(.995,1.005,128),new THREE.MeshBasicMaterial({color:0xaefff1,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));
  zoneRing.rotation.x=-Math.PI/2;zoneRing.position.y=.09;
  scene.add(sun, sun.target, stage, combatants, fx, selectedRing, zoneWall, zoneRing);
  const fill = new THREE.DirectionalLight(0x9adce2, .5); fill.position.set(45,30,-35); scene.add(fill);
  return true;
}

function nameplate(agent) {
  const label = document.createElement('canvas'); label.width=256;label.height=64;
  const ctx=label.getContext('2d');ctx.fillStyle='rgba(10,30,34,.82)';ctx.roundRect(9,5,238,49,7);ctx.fill();
  ctx.fillStyle=agent.color;ctx.fillRect(9,5,5,49);ctx.font='700 23px Arial';ctx.textAlign='center';ctx.fillStyle='#f2f8df';ctx.fillText(agent.name.toUpperCase(),128,38);
  const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));sprite.position.set(0,3.8,0);sprite.scale.set(3,.75,1);return sprite;
}
function addActor(agent) {
  const model=createCombatant(THREE,agent), label=nameplate(agent);
  model.group.add(label); combatants.add(model.group);
  model.group.position.set(agent.x,0,agent.z);model.group.rotation.y=agent.yaw;
  actors.set(agent.id,{...model,label,lastX:agent.x,lastZ:agent.z});
}
function resetWorld(next) {
  const started=performance.now();
  releaseWorld();
  world=createBattlefield(THREE,next.map);stage.add(world.group);
  for (const agent of next.agents) addActor(agent);
  for (const loot of next.loot) {
    const group = new THREE.Group();
    const healing = /heal|med/i.test(loot.kind);
    const material = new THREE.MeshStandardMaterial({color:healing?0xededda:0x254c5b,roughness:.5,metalness:.4});
    const box = new THREE.Mesh(new THREE.BoxGeometry(.85,.42,.58),material);box.position.y=.38;box.castShadow=true;group.add(box);
    const accent = new THREE.Mesh(new THREE.BoxGeometry(.6,.05,.12),new THREE.MeshStandardMaterial({color:healing?0xfd806f:0xdfff6c,emissive:healing?0x61221b:0x45592a}));accent.position.y=.62;group.add(accent);
    const halo = new THREE.Mesh(new THREE.RingGeometry(.6,.68,24),new THREE.MeshBasicMaterial({color:healing?0xff9c8e:0xdfff6c,side:THREE.DoubleSide,transparent:true,opacity:.6,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.05;group.add(halo);
    group.position.set(loot.x,0,loot.z);scene.add(group);pickups.set(loot.id,group);
  }
  matchId=next.matchId;cameraReady=false;worldNeedsReset=false;
  if(!next.agents.some(agent=>agent.id===focusedId)) focusedId=next.agents[0]?.id;
  const opening=next.agents.find(agent=>agent.id===focusedId)||next.agents[0];
  if(opening){camera.position.set(opening.x-14,11,opening.z+16);lookAt.set(opening.x,1.4,opening.z);camera.lookAt(lookAt);}
  applyMaterialQuality();
  buildRoster(next.agents);
  lastBuildMs=performance.now()-started;
}
function buildRoster(agents) {
  rosterListeners.abort();rosterListeners=new AbortController();
  const list=$('roster');list.replaceChildren();rosterRows.clear();
  for (const agent of agents) {
    const holder=document.createElement('div');holder.setAttribute('role','listitem');
    const button=document.createElement('button');button.className='roster-row';button.style.setProperty('--operator',agent.color);
    button.setAttribute('aria-label',`Observe ${agent.name}`);
    const icon=document.createElement('span');icon.className='operator-icon';icon.textContent=agent.name.slice(0,1);
    const name=document.createElement('span');name.className='operator-name';name.textContent=agent.name.split(' ')[0].toUpperCase();name.title=agent.name;
    const bar=document.createElement('span');bar.className='operator-mini';const fill=document.createElement('i');bar.append(fill);
    const kills=document.createElement('span');kills.className='operator-kills';kills.textContent='0';button.append(icon,name,bar,kills);
    button.addEventListener('click',()=>{focusedId=agent.id;setMode('follow');updateHUD(snapshot);},{signal:rosterListeners.signal});
    holder.append(button);list.append(holder);rosterRows.set(agent.id,{button,fill,kills});
  }
}
function pickFocus(next) {
  const alive=next.agents.filter(a=>a.alive);const current=next.agents.find(a=>a.id===focusedId);
  if(next.phase==='intermission'&&next.winner) {focusedId=next.winner;return;}
  if (!current || !current.alive) {focusedId=alive.sort((a,b)=>b.kills-a.kills)[0]?.id||next.agents[0]?.id;cameraReady=false;lastSwitch=next.time;return;}
  if(mode!=='director'||next.time-lastSwitch<16) return;
  let best=current,bestScore=-Infinity;
  for(const agent of alive) {
    const enemyDistance=Math.min(...alive.filter(other=>other.id!==agent.id).map(other=>Math.hypot(other.x-agent.x,other.z-agent.z)),80);
    const score=(agent.action==='firing'?50:0)+(agent.targetId?20:0)+agent.kills*3-enemyDistance*.8+(agent.id===focusedId?10:0);
    if(score>bestScore){best=agent;bestScore=score;}
  }
  if(focusedId!==best.id)cameraReady=false;focusedId=best.id;lastSwitch=next.time;
}
function updateHUD(next) {
  if(!next)return;
  $('remaining').textContent=next.remaining;
  document.querySelector('.out-of').textContent=`/ ${next.agents.length}`;
  $('match-id').textContent=String(next.matchId).padStart(2,'0');
  $('match-clock').textContent=clock(next.time);
  $('zone-time').textContent=clock(next.zone.secondsToShrink);
  $('zone-stage').textContent=`PHASE ${String(next.zone.stage+1).padStart(2,'0')}`;
  $('zone-label').textContent=next.zone.stage>0?'STORM CLOSING':'STORM APPROACHING';
  for(const agent of next.agents) {
    const row=rosterRows.get(agent.id);if(!row)continue;
    row.button.classList.toggle('selected',agent.id===focusedId);row.button.classList.toggle('eliminated',!agent.alive);
    row.button.setAttribute('aria-pressed',String(agent.id===focusedId));row.fill.style.width=`${Math.max(0,agent.hp)}%`;row.kills.textContent=agent.alive?agent.kills:'×';
  }
  const agent=next.agents.find(a=>a.id===focusedId)||next.agents[0];
  if(agent){
    $('focus-name').textContent=agent.name.toUpperCase();$('focus-type').textContent=shortName(agent.archetype);$('focus-kills').textContent=`${agent.kills} ELIMS`;
    $('health-bar').style.width=`${Math.max(0,agent.hp)}%`;$('shield-bar').style.width=`${Math.min(100,agent.shield/75*100)}%`;
    $('health-value').textContent=`${Math.ceil(agent.hp)} HP`;$('focus-intent').textContent=agent.alive?agent.intent:'ELIMINATED';
    $('weapon-name').textContent=shortName(agent.weapon);$('ammo').replaceChildren(document.createTextNode(String(agent.ammo)));const rounds=document.createElement('small');rounds.textContent=agent.action==='reloading'?'RELOADING':'ROUNDS';$('ammo').append(rounds);
    $('focus-emblem').textContent=agent.name.slice(0,1).toUpperCase();$('focus-card').style.setProperty('--focus-color',agent.color);
  }
  const reports=next.events.filter(event=>!['shot','hit','move','reload','heal','loot'].includes(event.kind)).slice(-4).reverse();
  $('events').replaceChildren(...reports.map(event=>{const row=document.createElement('div');row.className='event-row';row.textContent=event.text;return row;}));
  if(next.phase==='countdown') {
    $('announce-kicker').textContent='TWELVE MINDS. ONE SURVIVOR.';$('announce-title').textContent=`DEPLOYING IN ${Math.ceil(next.countdown)}`;isVisible($('announcement'),true);
  }else if(next.zone.stage!==lastAnnouncedStage&&next.phase==='running') {
    lastAnnouncedStage=next.zone.stage;announcementUntil=performance.now()+3500;
    $('announce-kicker').textContent=next.zone.stage?'THE STORM IS MOVING':'WELCOME TO CINDER COAST';
    $('announce-title').textContent=next.zone.stage?'STAY IN THE LIGHT':'LET THE HUNT BEGIN';isVisible($('announcement'),true);
  }else if(performance.now()>announcementUntil) isVisible($('announcement'),false);
  const result=next.phase==='intermission';isVisible($('result'),resultVisible(next));
  if(result){const winner=next.agents.find(a=>a.id===next.winner);$('winner-name').textContent=winner?winner.name.toUpperCase():'NO SURVIVORS';$('winner-detail').textContent=winner?`${winner.kills} ELIMINATIONS · ${clock(next.time)} SURVIVED`:'THE STORM CLAIMED THE FIELD';$('restart-time').textContent=Math.ceil(next.countdown);}
  drawMap(next);
}
function drawMap(next) {
  const ctx=mapContext,w=mapCanvas.width,scale=w/next.map.size;const pos=v=>(v+next.map.size/2)*scale;
  ctx.fillStyle='#244b4d';ctx.fillRect(0,0,w,w);
  ctx.fillStyle='#887f59';ctx.beginPath();ctx.roundRect(15,15,w-30,w-30,55);ctx.fill();
  ctx.strokeStyle='#cbdca41d';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(i*w/5,0);ctx.lineTo(i*w/5,w);ctx.moveTo(0,i*w/5);ctx.lineTo(w,i*w/5);ctx.stroke();}
  ctx.fillStyle='#d1d1b3';for(const o of next.map.buildings)ctx.fillRect(pos(o.x-o.w/2),pos(o.z-o.d/2),o.w*scale,o.d*scale);
  ctx.fillStyle='#496463';for(const o of next.map.covers)ctx.fillRect(pos(o.x-o.w/2),pos(o.z-o.d/2),o.w*scale,o.d*scale);
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,w);ctx.arc(pos(next.zone.x),pos(next.zone.z),next.zone.radius*scale,0,Math.PI*2,true);ctx.fillStyle='#255f735e';ctx.fill('evenodd');ctx.restore();
  ctx.strokeStyle='#deffae';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(pos(next.zone.x),pos(next.zone.z),next.zone.radius*scale,0,Math.PI*2);ctx.stroke();
  for(const a of next.agents){if(!a.alive)continue;ctx.fillStyle=a.id===focusedId?'#f8ffdf':a.color;ctx.beginPath();ctx.arc(pos(a.x),pos(a.z),a.id===focusedId?6:3.5,0,Math.PI*2);ctx.fill();if(a.id===focusedId){ctx.strokeStyle='#e0ff7e';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(pos(a.x),pos(a.z),11,0,Math.PI*2);ctx.stroke();}}
  ctx.font='bold 18px Arial';ctx.fillStyle='#edffdd';ctx.textAlign='center';ctx.fillText('N',w/2,22);
}
function acceptEffects(next) {
  for(const event of next.events){
    if(event.id<=effectCursor)continue;effectCursor=event.id;
    if(event.kind==='shot'){
      const a=next.agents.find(v=>v.id===event.actor),b=next.agents.find(v=>v.id===event.target);if(!a||!b)continue;
      const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,1.8,a.z),new THREE.Vector3(b.x,1.5,b.z)]);
      const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xffeb9c,transparent:true,opacity:.85}));fx.add(line);effects.push({mesh:line,life:.13,max:.13});
    }else if(['elimination','eliminated'].includes(event.kind)){
      const ring=new THREE.Mesh(new THREE.RingGeometry(.1,.24,24),new THREE.MeshBasicMaterial({color:0xffcf96,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(event.x,.06,event.z);fx.add(ring);effects.push({mesh:ring,life:.7,max:.7,expand:true});
    }
  }
  while(effects.length>64){const old=effects.shift();fx.remove(old.mesh);cleanupMesh(old.mesh);}
}
async function poll() {
  if(!active() || activePoll)return;
  const generation=lifecycle,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
  activePoll=controller;activePollTimeout=timeout;
  const current=()=>active() && lifecycle===generation && activePoll===controller;
  try {
    const response=await fetch('/royale/state',{cache:'no-store',signal:controller.signal});
    if(!current())return;
    if(controller.signal.aborted)throw new Error('Stream timed out');
    if(!response.ok)throw new Error('Stream temporarily unavailable');
    const next=await response.json();
    if(!current())return;
    if(controller.signal.aborted)throw new Error('Stream timed out');
    if(!Array.isArray(next.agents)||!next.zone||next.schemaVersion!==1)throw new Error('Invalid view');
    const restarted=!snapshot || next.matchId!==snapshot.matchId || next.tick<snapshot.tick;
    previous=restarted?next:snapshot;
    snapshot=next;receivedAt=performance.now();lastPollError='';
    try {
      if(restarted)resetContinuity(next);
      pickFocus(next);
      if(renderer && (renderState==='starting' || renderState==='healthy')) {
        if(worldNeedsReset)resetWorld(next);
        acceptEffects(next);
        if(renderState==='healthy')audio.accept(next.events,focusedId);
      }
      updateHUD(next);
    }catch(error) {failRender(error,'snapshot');}
    updateStatus();
  }catch(error){
    if(!current())return;
    const reason=String(error?.message||error);if(reason!==lastPollError){console.error('Royale presentation unavailable:',reason);lastPollError=reason;}
    updateStatus();
  }finally {
    clearTimeout(timeout);
    if(activePoll===controller) {activePoll=undefined;activePollTimeout=undefined;}
    if(active() && lifecycle===generation)pollTimer=setTimeout(poll,100);
  }
}
function angleLerp(a,b,t){let d=(b-a+Math.PI*3)%(Math.PI*2)-Math.PI;return a+d*t;}
function viewBlocked(from,to,obstacle) {
  const min=[obstacle.x-obstacle.w/2-.35,-.2,obstacle.z-obstacle.d/2-.35];
  const max=[obstacle.x+obstacle.w/2+.35,obstacle.h+.65,obstacle.z+obstacle.d/2+.35];
  const a=[from.x,from.y,from.z],b=[to.x,to.y,to.z];let enter=0,exit=1;
  for(let axis=0;axis<3;axis++){const d=b[axis]-a[axis];if(Math.abs(d)<1e-6){if(a[axis]<min[axis]||a[axis]>max[axis])return false;}else{let t1=(min[axis]-a[axis])/d,t2=(max[axis]-a[axis])/d;if(t1>t2)[t1,t2]=[t2,t1];enter=Math.max(enter,t1);exit=Math.min(exit,t2);if(enter>exit)return false;}}
  return exit>.03&&enter<.98;
}
function cameraUpdate(dt) {
  if(!snapshot)return;
  const agent=snapshot.agents.find(a=>a.id===focusedId)||snapshot.agents[0],actor=actors.get(agent?.id);if(!actor)return;
  targetPosition.copy(actor.group.position);
  // Frame the whole contender above the compact phone controls, including both feet.
  const phone=innerWidth<=560;
  targetPosition.y=mode==='follow'?(phone?1.5:2.5):(phone?2.1:4);
  if(mode==='tactical'){
    desiredCamera.set(snapshot.zone.x,Math.max(60,snapshot.zone.radius*1.35)*zoom,snapshot.zone.z+17);targetPosition.set(snapshot.zone.x,0,snapshot.zone.z);
  }else {
    if(!cameraReady)viewYaw=Math.atan2(-agent.x,-agent.z);
    else viewYaw=angleLerp(viewYaw,actor.group.rotation.y,reducedMotion?0:1-Math.exp(-dt*.2));
    const yaw=viewYaw+orbitOffset;
    const distance=mode==='director'?17:9,height=mode==='director'?3.8:2.3;
    desiredCamera.set(targetPosition.x-Math.sin(yaw)*distance*zoom,targetPosition.y+height*zoom,targetPosition.z-Math.cos(yaw)*distance*zoom);
    const enemy=snapshot.agents.find(a=>a.id===agent.targetId&&a.alive);
    if(!phone&&enemy&&mode==='director'&&Math.hypot(enemy.x-agent.x,enemy.z-agent.z)<23){targetPosition.x+=(enemy.x-agent.x)*.2;targetPosition.z+=(enemy.z-agent.z)*.2;}
    const sightStart=new THREE.Vector3(actor.group.position.x,1.6,actor.group.position.z);
    const solids=[...snapshot.map.buildings,...snapshot.map.covers];
    if(solids.some(o=>viewBlocked(sightStart,desiredCamera,o))){
      let found=false;
      for(const offset of [.65,-.65,1.3,-1.3,2,-2,Math.PI]){
        const candidate=new THREE.Vector3(sightStart.x-Math.sin(yaw+offset)*distance*zoom,targetPosition.y+height*zoom,sightStart.z-Math.cos(yaw+offset)*distance*zoom);
        if(!solids.some(o=>viewBlocked(sightStart,candidate,o))){desiredCamera.copy(candidate);viewYaw=yaw+offset-orbitOffset;found=true;break;}
      }
      if(!found)desiredCamera.set(sightStart.x,18,sightStart.z+7);
    }
    // Do not ease through a solid wall after switching sides of cover.
    if(solids.some(o=>viewBlocked(sightStart,camera.position,o)))cameraReady=false;
  }
  const factor=cameraReady?1-Math.exp(-dt*4):1;
  camera.position.lerp(desiredCamera,factor);lookAt.lerp(targetPosition,factor);camera.lookAt(lookAt);cameraReady=true;
  selectedRing.position.set(actor.group.position.x,.045,actor.group.position.z);selectedRing.visible=mode!=='follow';
  sun.target.position.set(actor.group.position.x,0,actor.group.position.z);sun.position.set(actor.group.position.x-42,74,actor.group.position.z+22);
}
function drawFrame(now) {
  const started=performance.now();
  const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;elapsed+=dt;
  if(snapshot && !worldNeedsReset){
    const alpha=Math.min(1,(now-receivedAt)/100);
    for(const agent of snapshot.agents){
      const actor=actors.get(agent.id);if(!actor)continue;const old=previous?.agents.find(a=>a.id===agent.id)||agent;
      actor.group.position.set(THREE.MathUtils.lerp(old.x,agent.x,alpha),0,THREE.MathUtils.lerp(old.z,agent.z,alpha));
      actor.group.rotation.y=angleLerp(actor.group.rotation.y,agent.yaw,1-Math.exp(-dt*10));actor.group.userData.reducedMotion=reducedMotion;actor.group.userData.reducedFlash=reducedMotion;actor.update(agent,dt,elapsed);
      actor.label.visible=agent.alive&&(mode==='tactical'||agent.id!==focusedId);actor.label.material.opacity=agent.id===focusedId?1:.72;
      // Keep nameplates legible without obscuring a close observer camera.
      const distance=camera.position.distanceTo(actor.group.position);actor.label.scale.setScalar(Math.max(.75,Math.min(1.7,distance/28)));actor.label.scale.multiply(new THREE.Vector3(3,.75,1));
    }
    for(const loot of snapshot.loot){const model=pickups.get(loot.id);if(model){model.visible=loot.active;model.children[0].position.y=.38+Math.sin(elapsed*2+loot.x)*.05;}}
    world?.update(snapshot,elapsed);cameraUpdate(dt);
    zoneWall.scale.set(snapshot.zone.radius,1,snapshot.zone.radius);zoneWall.position.set(snapshot.zone.x,9,snapshot.zone.z);
    zoneRing.scale.set(snapshot.zone.radius,snapshot.zone.radius,1);zoneRing.position.x=snapshot.zone.x;zoneRing.position.z=snapshot.zone.z;
    for(let i=effects.length-1;i>=0;i--){const effect=effects[i];effect.life-=dt;if(effect.life<=0){fx.remove(effect.mesh);cleanupMesh(effect.mesh);effects.splice(i,1);}else{effect.mesh.material.opacity=effect.life/effect.max*.8;if(effect.expand)effect.mesh.scale.setScalar(1+(1-effect.life/effect.max)*15);}}
  }
  syncLowMaterials();
  renderer.render(scene,camera);
  if(snapshot && !worldNeedsReset) {
    const recovered=renderState!=='healthy';renderedMatch=snapshot.matchId;renderedTick=snapshot.tick;renderState='healthy';
    if(recovered)updateHUD(snapshot);
  }else if(renderState==='recovering')renderState='starting';
  frameCount++;frames++;lastFrameMs=performance.now()-started;
  if(now-framesAt>1000){measuredFps=frames*1000/(now-framesAt);frames=0;framesAt=now;}
  updateStatus();
}
function frame(now) {
  animationId=undefined;
  if(!active() || contextLost || !renderer || renderState==='failed')return;
  try {
    drawFrame(now);
    if(captureAfterFirstFrame && snapshot && renderedTick===snapshot.tick)freezeInspection();
  }catch(error) {failRender(error);}
  if(active() && !contextLost && (renderState==='healthy' || renderState==='starting'))animationId=requestAnimationFrame(frame);
}
function freezeInspection() {
  inspectionFrozen=true;stopWork();
}
function renderOnce() {
  if(!inspectionFrozen || disposed || suspended || contextLost || !renderer || renderState==='failed')return false;
  try {drawFrame(performance.now());return true;}
  catch(error) {failRender(error,'inspection');return false;}
}
function setMode(value){if(mode!==value)cameraReady=false;mode=value;orbitOffset=0;for(const button of document.querySelectorAll('[data-camera]')){const active=button.dataset.camera===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}}
function nextAgent(){if(!snapshot)return;const alive=snapshot.agents.filter(a=>a.alive);const index=alive.findIndex(a=>a.id===focusedId);focusedId=alive[(index+1)%alive.length]?.id||focusedId;setMode('follow');updateHUD(snapshot);}
function toggleClean(){const clean=app.classList.toggle('clean');$('restore-ui').hidden=!clean;$('clean').setAttribute('aria-label',clean?'Show interface':'Hide interface');}
for(const button of document.querySelectorAll('[data-camera]'))on(button,'click',()=>setMode(button.dataset.camera));
on($('next-agent'),'click',nextAgent);
function setSoundLabel(enabled) {$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'Mute sound':'Enable sound');$('sound').querySelector('span').textContent=enabled?'SOUND ON':'SOUND OFF';}
on($('sound'),'click',async()=>{const owner=audio,generation=lifecycle,enabled=await owner.toggle();if(!disposed&&!suspended&&owner===audio&&generation===lifecycle)setSoundLabel(enabled);});
on($('clean'),'click',toggleClean);on($('restore-ui'),'click',toggleClean);
function toggleSettings(){const show=$('settings-panel').hidden;$('settings-panel').hidden=!show;$('settings').setAttribute('aria-expanded',String(show));if(show)$('reduced-motion').focus();else $('settings').focus();}
on($('settings'),'click',toggleSettings);on($('close-settings'),'click',toggleSettings);
on($('reduced-motion'),'change',e=>reducedMotion=e.target.checked);
on($('low-quality'),'change',e=>{
  lowQuality=e.target.checked;
  if(renderer){try{renderer.shadowMap.enabled=!lowQuality;renderer.setPixelRatio(Math.min(devicePixelRatio,lowQuality?.75:1.5));applyMaterialQuality();}catch(error){failRender(error,'quality');}}
});
on($('roster-toggle'),'click',()=>{const show=$('roster').hidden;$('roster').hidden=!show;$('roster-toggle').textContent=show?'−':'+';$('roster-toggle').setAttribute('aria-expanded',String(show));});
on(window,'keydown',event=>{if(/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;if(event.key.toLowerCase()==='h')toggleClean();if(event.key.toLowerCase()==='m')$('sound').click();if(event.key==='ArrowRight'){event.preventDefault();nextAgent();}if(event.key==='Escape'&&!$('settings-panel').hidden)toggleSettings();});
on(canvas,'pointerdown',event=>{pointerDown=true;pointerX=event.clientX;canvas.setPointerCapture(event.pointerId);});
on(canvas,'pointermove',event=>{if(pointerDown){orbitOffset-=(event.clientX-pointerX)*.007;pointerX=event.clientX;}});
on(canvas,'pointerup',()=>pointerDown=false);on(canvas,'pointercancel',()=>pointerDown=false);
on(canvas,'wheel',event=>{event.preventDefault();zoom=THREE.MathUtils.clamp(zoom+event.deltaY*.001,.65,1.8);},{passive:false});
on(window,'resize',()=>{if(renderer&&camera){try{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}catch(error){failRender(error,'resize');}}});
on(canvas,'webglcontextlost',event=>{
  event.preventDefault();
  if(disposed||suspended||renderState==='failed')return;
  contextLost=true;cancelAnimationFrame(animationId);animationId=undefined;clearTimeout(retryTimer);retryTimer=undefined;clearTimeout(contextTimer);
  renderFailures++;renderState=renderFailures>maxRenderRetries?'failed':'context-lost';updateStatus();
  console.error('Royale WebGL context lost:', {attempt:renderFailures,matchId:snapshot?.matchId,tick:snapshot?.tick});
  if(renderState!=='failed')contextTimer=setTimeout(()=>{contextTimer=undefined;if(contextLost&&!disposed&&!suspended){renderState='failed';updateStatus();console.error('Royale WebGL context restoration timed out');}},contextRecoveryMs);
});
on(canvas,'webglcontextrestored',()=>{
  if(!contextLost)return;contextLost=false;clearTimeout(contextTimer);contextTimer=undefined;
  if(disposed||suspended||renderState==='failed')return;
  renderState='recovering';updateStatus();recoverRenderer();
});
on(window,'pagehide',event=>{
  if(disposed||suspended)return;
  suspended=!!event.persisted;disposed=!event.persisted;stopWork();disposeResource(audio);releaseRenderer();
  snapshot=previous=undefined;matchId=renderedMatch=renderedTick=null;pointerDown=false;
  if(disposed){listeners.abort();if(inspectionEnabled)delete window.royaleInspection;}
});
on(window,'pageshow',event=>{
  if(!event.persisted||!suspended||disposed)return;
  suspended=false;inspectionFrozen=false;contextLost=false;renderFailures=0;renderState='starting';lastPollError='';
  audio=createAudio();setSoundLabel(false);frames=0;framesAt=lastFrame=performance.now();
  startPresentation();
});
function startPresentation() {
  try {setup();lastFrame=performance.now();animationId=requestAnimationFrame(frame);}
  catch(error) {failRender(error,'startup');}
  updateStatus();poll();
}
startPresentation();
// Read-only development instrumentation, deliberately outside the normal spectator surface.
if(inspectionEnabled) {
  window.royaleInspection = {
    get snapshot(){return snapshot;},
    get metrics(){return {frames:frameCount,renderedMatch,renderedTick,frozen:inspectionFrozen,renderState,recoveryAttempts:renderFailures,frameMs:lastFrameMs,buildMs:lastBuildMs,fps:Math.round(measuredFps),drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,geometries:renderer?.info.memory.geometries,textures:renderer?.info.memory.textures};},
    setCamera:setMode,focus(id){focusedId=id;setMode('follow');cameraReady=false;updateHUD(snapshot);},freeze:freezeInspection,renderOnce,
    portrait(id){
      freezeInspection();const actor=actors.get(id);if(!actor||!renderer||contextLost)return false;
      const p=actor.group.position,target=new THREE.Vector3(p.x,1.45,p.z),solids=[...snapshot.map.buildings,...snapshot.map.covers];
      let clear=null;
      for(const offset of [.55,-.55,0,1.1,-1.1,1.6,-1.6]){
        const a=actor.group.rotation.y+offset,candidate=new THREE.Vector3(p.x+Math.sin(a)*4.7,2.25,p.z+Math.cos(a)*4.7);
        if(!solids.some(o=>viewBlocked(target,candidate,o))){clear=candidate;break;}
      }
      if(!clear)return false;
      focusedId=id;updateHUD(snapshot);camera.position.copy(clear);camera.lookAt(target);
      for(const model of actors.values())model.label.visible=false;
      selectedRing.visible=false;sun.target.position.set(p.x,0,p.z);sun.position.set(p.x-42,74,p.z+22);app.classList.add('clean');
      try{syncLowMaterials();renderer.render(scene,camera);return true;}catch(error){failRender(error,'portrait');return false;}
    },
    get camera(){return camera;},get scene(){return scene;}
  };
}
