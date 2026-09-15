import { createGame, stepGame, selectCameraEvent, survivorPose, zombiePose, districtPalette, type GameState, type Survivor, type Zombie, type Building, type Barricade, type LootNode } from '../index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d', { alpha:false })!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const statusEl = document.querySelector<HTMLElement>('#status')!;
let game = createGame({seed:2026,zombieCount:180});
const heardEventIds=new Set<number>();
let paused=false, hideHud=false, last=performance.now(), accumulator=0, visualTime=0, lastEventId=0;
const fixed=1/30;
const camera={x:0,y:0,zoom:1.08,targetX:0,targetY:0,targetZoom:1.08};
const audio = new AudioContext();

function resize(){ const dpr=Math.min(2,devicePixelRatio||1); canvas.width=Math.floor(innerWidth*dpr); canvas.height=Math.floor(innerHeight*dpr); canvas.style.width=`${innerWidth}px`; canvas.style.height=`${innerHeight}px`; ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize',resize); resize();
addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='h'){hideHud=!hideHud;hud.style.display=hideHud?'none':'block';} if(e.key.toLowerCase()==='r'){game=createGame({seed:2026,zombieCount:180});} if(e.code==='Space'){paused=!paused;} });
addEventListener('pointerdown',()=>audio.resume());

function iso(x:number,y:number,z=0){ const scale=22*camera.zoom; const sx=(x-y)*scale+innerWidth/2-camera.x; const sy=(x+y)*scale*0.5+innerHeight*0.48-z*scale-camera.y; return {x:sx,y:sy}; }
function poly(points:{x:number;y:number}[],fill:string,stroke?:string){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function diamond(x:number,y:number,w:number,h:number,fill:string){const a=iso(x-w/2,y-h/2),b=iso(x+w/2,y-h/2),c=iso(x+w/2,y+h/2),d=iso(x-w/2,y+h/2);poly([a,b,c,d],fill);}
function shadow(x:number,y:number,rx:number,ry:number,alpha=.28){const p=iso(x,y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,0.42);ctx.beginPath();ctx.ellipse(0,0,rx*camera.zoom,ry*camera.zoom,0,0,Math.PI*2);ctx.fillStyle=`rgba(0,0,0,${alpha})`;ctx.fill();ctx.restore();}

function drawGround(){
  const sky=ctx.createLinearGradient(0,0,0,innerHeight); sky.addColorStop(0,game.time.phase==='night'?'#101519':'#5a625f'); sky.addColorStop(1,'#232826'); ctx.fillStyle=sky;ctx.fillRect(0,0,innerWidth,innerHeight);
  for(const d of game.districts){const p=districtPalette(d.kind);diamond(d.x,d.y,d.w,d.h,p.ground);}
  ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.035)';for(let i=-55;i<=55;i+=4){let a=iso(i,-55),b=iso(i,55);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();a=iso(-55,i);b=iso(55,i);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  diamond(0,0,16,13,'#383b39'); diamond(0,0,10,8,'#4d514e');
}

function drawBuilding(b:Building){
  const pal=districtPalette(b.district), z=1.6+b.floors*0.9, damage=b.damage;
  const a=iso(b.x-b.w/2,b.y-b.h/2,0),bb=iso(b.x+b.w/2,b.y-b.h/2,0),c=iso(b.x+b.w/2,b.y+b.h/2,0),d=iso(b.x-b.w/2,b.y+b.h/2,0);
  const at=iso(b.x-b.w/2,b.y-b.h/2,z),bt=iso(b.x+b.w/2,b.y-b.h/2,z),ct=iso(b.x+b.w/2,b.y+b.h/2,z),dt=iso(b.x-b.w/2,b.y+b.h/2,z);
  poly([bb,c,ct,bt],shade(pal.wall,-18),'rgba(0,0,0,.24)'); poly([d,c,ct,dt],shade(pal.wall,-32),'rgba(0,0,0,.28)'); poly([at,bt,ct,dt],shade(pal.roof,-damage*30),'rgba(0,0,0,.35)');
  if(b.kind==='safehouse'){ctx.fillStyle='#d9bd78';ctx.font='700 11px system-ui';const p=iso(b.x,b.y,z+.2);ctx.fillText('SAFE HOUSE',p.x-34,p.y);}
  const windows=Math.max(1,b.floors);for(let f=0;f<windows;f++){const wp=iso(b.x+b.w/2+.02,b.y,z*.2+f*.62+.45);ctx.fillStyle=game.time.phase==='night'&&b.kind==='safehouse'?'#f2c96f':'rgba(16,23,24,.72)';ctx.fillRect(wp.x-5,wp.y-7,9,5);}
  if(damage>.45){const p=iso(b.x,b.y,z);ctx.strokeStyle='rgba(28,25,23,.8)';ctx.beginPath();ctx.moveTo(p.x-7,p.y+2);ctx.lineTo(p.x+2,p.y+12);ctx.lineTo(p.x-3,p.y+22);ctx.stroke();}
}
function shade(hex:string,delta:number){const n=parseInt(hex.slice(1),16);const r=Math.max(0,Math.min(255,(n>>16)+delta)),g=Math.max(0,Math.min(255,((n>>8)&255)+delta)),b=Math.max(0,Math.min(255,(n&255)+delta));return `rgb(${r},${g},${b})`;}

function drawBarricade(b:Barricade){const p=iso(b.x,b.y);shadow(b.x,b.y,15,7,.32);ctx.save();ctx.translate(p.x,p.y-4);ctx.rotate(b.angle*.32);const hp=b.hp/b.maxHp;ctx.fillStyle=b.material==='metal'?'#737b7b':b.material==='vehicle'?'#5d665f':'#70583f';ctx.fillRect(-14,-8,28,9);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-12,-7,24,2);ctx.strokeStyle=hp<.35?'#ca735e':'rgba(0,0,0,.5)';ctx.strokeRect(-14,-8,28,9);ctx.restore();}
function drawLoot(l:LootNode){if(l.amount<=0)return;const p=iso(l.x,l.y,.18);shadow(l.x,l.y,7,4,.18);ctx.fillStyle=l.kind==='medicine'?'#a9b6ad':'#8f744c';ctx.fillRect(p.x-5,p.y-7,10,7);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(p.x-4,p.y-6,8,2);}

function drawSurvivor(s:Survivor){
  if(!s.alive){const p=iso(s.x,s.y,.05);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(.28);ctx.fillStyle='#3e4140';ctx.fillRect(-8,-2,17,5);ctx.restore();return;}
  const p=iso(s.x,s.y);const pose=survivorPose(s);const phase=visualTime*(5+pose.stride*4)+Number(s.id.slice(2));const stride=Math.sin(phase)*pose.stride;shadow(s.x,s.y,9,5,.3);
  ctx.save();ctx.translate(p.x,p.y-16);ctx.rotate((s.facing+Math.PI/4)*.06);if(pose.stance==='limp')ctx.rotate(.09);
  const roleColor:{[k:string]:string}={leader:'#c8ad70',scout:'#6e897d',medic:'#b8b7aa',defender:'#7f756c',scavenger:'#9b815d',engineer:'#7e8791'};
  ctx.strokeStyle='#202524';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-2,10);ctx.lineTo(-4+stride*3,19);ctx.moveTo(2,10);ctx.lineTo(5-stride*3,19);ctx.stroke();
  ctx.fillStyle=roleColor[s.role]||'#888';ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(5,-2);ctx.lineTo(4,11);ctx.lineTo(-4,11);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#b28a70';ctx.lineWidth=3;ctx.beginPath();if(pose.stance==='weapon-forward'){ctx.moveTo(3,0);ctx.lineTo(11,-3);ctx.moveTo(-2,1);ctx.lineTo(9,-1);}else{ctx.moveTo(-4,0);ctx.lineTo(-7,7+stride*2);ctx.moveTo(4,0);ctx.lineTo(7,7-stride*2);}ctx.stroke();
  ctx.fillStyle='#a77d65';ctx.beginPath();ctx.ellipse(0,-6,4,4.5,0,0,Math.PI*2);ctx.fill();
  if(pose.stance==='weapon-forward'){ctx.strokeStyle='#282b2b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-2);ctx.lineTo(16,-4);ctx.stroke();}
  if(s.health<45){ctx.fillStyle='rgba(155,55,48,.7)';ctx.fillRect(-5,6,4,2);}
  ctx.restore();
}

function drawZombie(z:Zombie){
  if(z.health<=0){const p=iso(z.x,z.y,.02);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.35+(z.variant%3)*.2);ctx.fillStyle='#39433d';ctx.fillRect(-7,-2,15,4);ctx.restore();return;}
  const p=iso(z.x,z.y);const pose=zombiePose(z);const phase=visualTime*(3.2*pose.cadence)+(z.variant*1.7);const sway=Math.sin(phase)*2.2;shadow(z.x,z.y,8,4,.25);ctx.save();ctx.translate(p.x,p.y-14);ctx.rotate(sway*.018 + (pose.stance==='lunge'?.12:0));
  ctx.strokeStyle='#303a35';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-2,8);ctx.lineTo(-4-sway*.35,17);ctx.moveTo(2,8);ctx.lineTo(5+sway*.3,17);ctx.stroke();
  const tones=['#55675b','#5f6650','#646157','#4f6258','#665f54','#59695c'];ctx.fillStyle=tones[z.variant%tones.length];ctx.beginPath();ctx.moveTo(-4,-2);ctx.lineTo(4,-2);ctx.lineTo(5,9);ctx.lineTo(-3,10);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#59685e';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-8,6+sway*.25);ctx.moveTo(3,0);ctx.lineTo(pose.stance==='lunge'?10:7,4-sway*.2);ctx.stroke();
  ctx.fillStyle='#71806f';ctx.beginPath();ctx.ellipse(0,-6,3.7,4.2,.12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#131817';ctx.fillRect(1,-7,1.2,1.2);ctx.restore();
}

function drawVfx(){for(const e of game.events){if(e.id<=Math.max(lastEventId-45,0))continue;const age=game.time.elapsed-e.time;if(age<0||age>1.1)continue;const p=iso(e.x,e.y,.5);if(e.type==='shot'){ctx.fillStyle=`rgba(255,213,122,${1-age})`;ctx.beginPath();ctx.arc(p.x,p.y-18,4*(1-age)+1,0,Math.PI*2);ctx.fill();}if(e.type==='barricade-hit'){ctx.fillStyle=`rgba(185,150,110,${.55*(1-age)})`;for(let i=0;i<4;i++){ctx.fillRect(p.x+(i-2)*3,p.y-10-age*18-(i%2)*4,2,2);}}if(e.type==='loot'){ctx.fillStyle=`rgba(226,205,133,${1-age})`;ctx.font='700 11px system-ui';ctx.fillText('SUPPLIES',p.x-24,p.y-24-age*14);} }
  lastEventId=game.events.at(-1)?.id ?? lastEventId;
}

function drawLighting(){
  if(game.time.phase==='night'||game.time.phase==='sunset'){ctx.fillStyle=game.time.phase==='night'?'rgba(9,18,27,.58)':'rgba(69,35,25,.20)';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.globalCompositeOperation='screen';for(const s of game.survivors.filter(s=>s.alive)){const p=iso(s.x,s.y,.7);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,60*camera.zoom);g.addColorStop(0,'rgba(255,224,150,.16)');g.addColorStop(1,'rgba(255,224,150,0)');ctx.fillStyle=g;ctx.fillRect(p.x-70,p.y-70,140,140);}ctx.globalCompositeOperation='source-over';}
  if(game.weather.kind==='fog'){ctx.fillStyle=`rgba(190,199,196,${.10*game.weather.intensity})`;ctx.fillRect(0,0,innerWidth,innerHeight);}
  if(game.weather.kind==='rain'||game.weather.kind==='storm'){ctx.strokeStyle=`rgba(188,205,211,${.25+game.weather.intensity*.18})`;ctx.lineWidth=1;for(let i=0;i<90;i++){const x=((i*97+visualTime*210)% (innerWidth+80))-40;const y=((i*53+visualTime*390)% (innerHeight+100))-50;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+18);ctx.stroke();}}
}

function render(){
  drawGround();
  const items:any[]=[];for(const b of game.buildings)items.push({d:b.x+b.y,kind:'building',v:b});for(const l of game.loot)items.push({d:l.x+l.y,kind:'loot',v:l});for(const b of game.barricades)items.push({d:b.x+b.y+.2,kind:'bar',v:b});for(const z of game.zombies)items.push({d:z.x+z.y+.4,kind:'z',v:z});for(const s of game.survivors)items.push({d:s.x+s.y+.6,kind:'s',v:s});items.sort((a,b)=>a.d-b.d);
  for(const it of items){if(it.kind==='building')drawBuilding(it.v);if(it.kind==='loot')drawLoot(it.v);if(it.kind==='bar')drawBarricade(it.v);if(it.kind==='z')drawZombie(it.v);if(it.kind==='s')drawSurvivor(it.v);}
  drawVfx();drawLighting();updateHud();
}

function updateCamera(dt:number){const ev=selectCameraEvent(game);let tx=0,ty=0,z=1.08;if(ev.targetId){const s=game.survivors.find(v=>v.id===ev.targetId);const b=game.barricades.find(v=>v.id===ev.targetId);const t=s||b;if(t){const p=iso(t.x,t.y);tx=p.x-innerWidth/2;ty=p.y-innerHeight*.5;z=ev.mode==='near-death'?1.35:1.2;}}if(ev.mode==='horde-overview')z=.9;camera.targetX=tx;camera.targetY=ty;camera.targetZoom=z;const k=1-Math.pow(.002,dt);camera.x+=(camera.targetX-camera.x)*k;camera.y+=(camera.targetY-camera.y)*k;camera.zoom+=(camera.targetZoom-camera.zoom)*k;}
function updateHud(){if(hideHud)return;const alive=game.survivors.filter(s=>s.alive).length;const phase=game.time.phase.toUpperCase();const threat=Math.round(game.hordePressure*100);statusEl.textContent=game.status==='running'?`${phase} · DAY ${game.time.day}`:'SAFE HOUSE OVERRUN';hud.innerHTML=`<div class="brand">AI ZOMBIE SURVIVAL</div><div class="chips"><span>${alive} survivors</span><span>${game.zombies.filter(z=>z.health>0).length} infected</span><span>${threat}% threat</span><span>food ${Math.floor(game.resources.food)}</span><span>med ${Math.floor(game.resources.medicine)}</span><span>ammo ${Math.floor(game.resources.ammo)}</span><span>safehouse ${Math.round(game.safeHouse.integrity)}%</span></div><div class="intent">${selectCameraEvent(game).mode.replaceAll('-',' ')} · H hide HUD · R restart · Space pause</div>`;}
function playEventSounds(){if(audio.state!=='running')return;for(const e of game.events.slice(-16)){if(heardEventIds.has(e.id))continue;heardEventIds.add(e.id);if(e.type==='shot'||e.type==='barricade-hit'||e.type==='near-death'){const o=audio.createOscillator(),g=audio.createGain();o.type=e.type==='shot'?'square':'sawtooth';o.frequency.value=e.type==='shot'?150:e.type==='near-death'?70:90;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.13);}}if(heardEventIds.size>256){const keep=new Set(game.events.slice(-64).map(e=>e.id));for(const id of heardEventIds)if(!keep.has(id))heardEventIds.delete(id);}}
function frame(now:number){const dt=Math.min(.08,(now-last)/1000);last=now;visualTime+=dt;if(!paused&&game.status==='running'){accumulator+=dt;while(accumulator>=fixed){game=stepGame(game,fixed);accumulator-=fixed;}}updateCamera(dt);render();playEventSounds();requestAnimationFrame(frame);}requestAnimationFrame(frame);
