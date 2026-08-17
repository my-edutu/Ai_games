'use strict';
const MAX_TRAIL=240;
const canvas=document.getElementById('zombie-canvas');
const context=canvas.getContext('2d',{alpha:false});
const body=document.body;
const query=new URLSearchParams(location.search);
let reducedMotion=query.get('reducedMotion')==='1';
let highContrast=query.get('highContrast')==='1';
let cleanFeed=query.get('cleanFeed')==='1';
let muted=query.get('muted')==='1';
let polling=false;
let frame=null;
let lastTick=-1;
let trail=[];
let connectionFailures=0;
const resourceLabels={materials:'MAT',ammo:'AMMO',medicine:'MED',food:'FOOD',power:'PWR'};
const resourceGlyphs={materials:'M',ammo:'A',medicine:'+',food:'F',power:'P'};

function element(id){return document.getElementById(id)}
function setText(id,value){const node=element(id);if(node)node.textContent=String(value)}
function percent(value,max=1000){return `${Math.max(0,Math.min(100,Math.round(value*100/max)))}%`}
function setPressed(id,pressed){const button=element(id);if(button)button.setAttribute('aria-pressed',String(pressed))}
function applyPreferences(){
  body.dataset.reducedMotion=String(reducedMotion);
  body.dataset.highContrast=String(highContrast);
  body.dataset.cleanFeed=String(cleanFeed);
  body.dataset.muted=String(muted);
  setPressed('toggle-motion',reducedMotion);setPressed('toggle-contrast',highContrast);setPressed('toggle-mute',muted);setPressed('toggle-clean',cleanFeed);
}
function toggle(id,read,write){const button=element(id);if(button)button.addEventListener('click',()=>{write(!read());applyPreferences()})}
toggle('toggle-motion',()=>reducedMotion,value=>{reducedMotion=value});
toggle('toggle-contrast',()=>highContrast,value=>{highContrast=value});
toggle('toggle-mute',()=>muted,value=>{muted=value});
toggle('toggle-clean',()=>cleanFeed,value=>{cleanFeed=value});
applyPreferences();

function updateResources(snapshot){
  const parent=element('resources'),nodes=[];
  for(const key of['materials','ammo','medicine','food','power']){
    const card=document.createElement('div'),value=document.createElement('b'),label=document.createElement('span');
    card.className='resource-item';value.textContent=String(snapshot.resources[key]);label.textContent=resourceLabels[key];card.append(value,label);nodes.push(card);
  }
  parent.replaceChildren(...nodes);
}
function updateSquad(snapshot){
  const parent=element('squad-list'),nodes=[];
  for(const survivor of snapshot.survivors){
    const row=document.createElement('div'),icon=document.createElement('span'),copy=document.createElement('span'),name=document.createElement('strong'),intent=document.createElement('small'),health=document.createElement('b');
    row.className='squad-member';icon.className='role-icon';icon.textContent=survivor.role.slice(0,1).toUpperCase();copy.className='member-copy';name.textContent=survivor.role;intent.textContent=survivor.intent;copy.append(name,intent);health.className=`member-health${survivor.health<40?' critical':''}`;health.textContent=`${survivor.health} HP`;row.append(icon,copy,health);nodes.push(row);
  }
  parent.replaceChildren(...nodes);
}
function updateSurvivorDots(snapshot){
  const parent=element('survivor-dots'),nodes=[];
  for(let index=0;index<snapshot.survivors.length;index++){const dot=document.createElement('i');if(snapshot.survivors[index].status==='dead')dot.className='lost';nodes.push(dot)}
  parent.replaceChildren(...nodes);
}
function updateCaptions(captions){
  const parent=element('captions'),span=document.createElement('span');
  span.textContent=captions.length?captions[captions.length-1]:'Autonomous play continues. Awaiting the next semantic event.';
  parent.replaceChildren(span);
}
function phaseClock(snapshot){const total=Math.ceil(snapshot.phaseRemaining/10);return`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
function updateDom(publicFrame){
  const snapshot=publicFrame.snapshot;if(!snapshot)return;
  window.__ZOMBIE_PUBLIC_STATE__=snapshot;
  setText('objective',snapshot.objective);setText('tick',snapshot.tick);setText('day',`${snapshot.day} / ${snapshot.evacuationDay}`);setText('phase',snapshot.phase.toUpperCase());setText('phase-clock',phaseClock(snapshot));setText('horde',`${snapshot.horde.remaining} REMAIN`);setText('base-integrity',percent(snapshot.baseIntegrity));setText('survivors',`${snapshot.survivorsAlive} / ${snapshot.survivors.length}`);setText('strategy',snapshot.strategy.replace('-', ' ').toUpperCase());setText('ai-intent',snapshot.primaryIntent);setText('weather',snapshot.weather.toUpperCase());setText('danger-value',percent(snapshot.dangerPermille));setText('run-status',snapshot.result?`${snapshot.result.outcome.toUpperCase()} — DAY ${snapshot.result.day}`:snapshot.phase==='horde'?'DEFENDING THE REFUGE':'PREPARING DEFENSES');
  element('base-fill').style.width=percent(snapshot.baseIntegrity);element('danger-fill').style.width=percent(snapshot.dangerPermille);
  updateResources(snapshot);updateSquad(snapshot);updateSurvivorDots(snapshot);updateCaptions(publicFrame.captions||[]);
  const connection=element('connection-state');connection.classList.toggle('degraded',publicFrame.failed||connectionFailures>0);connection.lastChild.textContent=publicFrame.failed?' RECOVERY SCENE':' LIVE AUTHORITY';
  if(snapshot.tick!==lastTick){for(const survivor of snapshot.survivors.filter(item=>item.status==='active'))trail.push({cell:survivor.cell,role:survivor.role,tick:snapshot.tick});if(trail.length>MAX_TRAIL)trail=trail.slice(-MAX_TRAIL);lastTick=snapshot.tick}
}

async function poll(){
  if(polling)return;
  polling=true;
  try{
    const response=await fetch('/zombie/state',{cache:'no-store',headers:{accept:'application/json'}});
    if(!response.ok)throw new Error(`state ${response.status}`);
    frame=await response.json();connectionFailures=0;updateDom(frame);
  }catch(error){
    connectionFailures++;const connection=element('connection-state');connection.classList.add('degraded');connection.lastChild.textContent=' RECONNECTING — AI CONTINUES';
  }finally{polling=false}
}

function palette(){return highContrast?{background:'#000000',grid:'#252525',blocked:'#ffffff',base:'#003d1d',core:'#00ff7b',resource:'#ffe600',defense:'#00eaff',survivor:'#ffffff',zombie:'#ff3b3b',trail:'rgba(0,255,123,.25)'}:{background:'#07110d',grid:'rgba(139,196,169,.08)',blocked:'#1c2924',base:'#173b2c',core:'#83f5b9',resource:'#ffc96a',defense:'#75dfff',survivor:'#ecfff5',zombie:'#ff6868',trail:'rgba(131,245,185,.16)'}}
function roundedRect(ctx,x,y,w,h,r){const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.roundRect(x,y,w,h,radius)}
function draw(){
  requestAnimationFrame(draw);
  const snapshot=frame&&frame.snapshot;if(!snapshot)return;
  const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;
  const ratio=Math.min(2,window.devicePixelRatio||1),pixelWidth=Math.floor(rect.width*ratio),pixelHeight=Math.floor(rect.height*ratio);
  if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight}
  context.setTransform(ratio,0,0,ratio,0,0);
  const colors=palette(),width=rect.width,height=rect.height,padding=Math.max(16,Math.min(width,height)*.035),cell=Math.max(4,Math.min((width-padding*2)/snapshot.width,(height-padding*2)/snapshot.height)),gridWidth=cell*snapshot.width,gridHeight=cell*snapshot.height,originX=(width-gridWidth)/2,originY=(height-gridHeight)/2;
  context.fillStyle=colors.background;context.fillRect(0,0,width,height);
  context.strokeStyle=colors.grid;context.lineWidth=1;
  for(let x=0;x<=snapshot.width;x++){context.beginPath();context.moveTo(originX+x*cell,originY);context.lineTo(originX+x*cell,originY+gridHeight);context.stroke()}
  for(let y=0;y<=snapshot.height;y++){context.beginPath();context.moveTo(originX,originY+y*cell);context.lineTo(originX+gridWidth,originY+y*cell);context.stroke()}
  const xy=cellId=>({x:originX+(cellId%snapshot.width)*cell,y:originY+Math.floor(cellId/snapshot.width)*cell});
  context.fillStyle=colors.blocked;for(const cellId of snapshot.blockedCells){const point=xy(cellId);context.fillRect(point.x+1,point.y+1,cell-2,cell-2)}
  context.fillStyle=colors.base;for(const cellId of snapshot.baseCells){const point=xy(cellId);context.fillRect(point.x+1,point.y+1,cell-2,cell-2)}
  context.fillStyle=colors.trail;for(const item of trail){const point=xy(item.cell);context.beginPath();context.arc(point.x+cell/2,point.y+cell/2,Math.max(1,cell*.12),0,Math.PI*2);context.fill()}
  for(const site of snapshot.resourceSites){const point=xy(site.cell);context.fillStyle=colors.resource;roundedRect(context,point.x+cell*.2,point.y+cell*.2,cell*.6,cell*.6,cell*.15);context.fill();if(cell>13){context.fillStyle=colors.background;context.font=`700 ${Math.max(8,cell*.32)}px system-ui`;context.textAlign='center';context.textBaseline='middle';context.fillText(resourceGlyphs[site.kind],point.x+cell/2,point.y+cell/2)}}
  for(const defense of snapshot.defenses){const point=xy(defense.cell),ratioValue=defense.integrity/defense.maxIntegrity;context.strokeStyle=ratioValue<.3?colors.zombie:colors.defense;context.lineWidth=Math.max(2,cell*.13);context.strokeRect(point.x+cell*.14,point.y+cell*.14,cell*.72,cell*.72)}
  {const point=xy(snapshot.coreCell),pulse=reducedMotion?1:.85+Math.sin(performance.now()/260)*.12;context.fillStyle=colors.core;context.beginPath();context.arc(point.x+cell/2,point.y+cell/2,cell*.34*pulse,0,Math.PI*2);context.fill()}
  for(const zombie of snapshot.zombies){const point=xy(zombie.cell);context.fillStyle=colors.zombie;context.beginPath();context.moveTo(point.x+cell/2,point.y+cell*.12);context.lineTo(point.x+cell*.88,point.y+cell*.82);context.lineTo(point.x+cell*.12,point.y+cell*.82);context.closePath();context.fill()}
  for(const survivor of snapshot.survivors){if(survivor.status==='dead')continue;const point=xy(survivor.cell);context.fillStyle=survivor.health<40?colors.resource:colors.survivor;context.beginPath();context.arc(point.x+cell/2,point.y+cell/2,cell*.27,0,Math.PI*2);context.fill();context.strokeStyle=colors.core;context.lineWidth=Math.max(1,cell*.07);context.stroke()}
  context.strokeStyle=colors.core;context.lineWidth=2;context.strokeRect(originX,originY,gridWidth,gridHeight);
}

window.addEventListener('resize',()=>{canvas.width=0});
window.setInterval(poll,250);poll();requestAnimationFrame(draw);
