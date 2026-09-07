'use strict';

const q=id=>document.getElementById(id);
const canvas=q('tower'),ctx=canvas.getContext('2d',{alpha:false}),root=q('broadcast'),stage=canvas.parentElement;
const ui={
  floor:q('floor'),objective:q('objective'),progress:q('progress'),sector:q('sector'),sectorName:q('sector-name'),sectorTone:q('sector-tone'),
  health:q('health'),energy:q('energy'),shield:q('shield'),score:q('score'),intent:q('intent'),reason:q('reason'),confidence:q('confidence'),
  highest:q('highest'),cleared:q('cleared'),modules:q('modules'),events:q('events'),caption:q('caption'),connection:q('connection'),motion:q('motion'),audio:q('audio'),quality:q('quality')
};

const SECTORS=[
  {name:'Intake Vaults',tone:'Orientation',range:'1–100',bg:'#071015',floor:'#15252a',floor2:'#101d22',wall:'#263a3f',wallSide:'#0b1519',accent:'#76e9ef',hazard:'#f2c76d',reward:'#a893ff'},
  {name:'Pressure Works',tone:'Tempo',range:'101–200',bg:'#100c0b',floor:'#2a211d',floor2:'#211915',wall:'#49342a',wallSide:'#1b110e',accent:'#ffb46e',hazard:'#ff785f',reward:'#ffd27e'},
  {name:'Relay Gardens',tone:'Routing',range:'201–300',bg:'#07100e',floor:'#142621',floor2:'#0f1e1a',wall:'#294238',wallSide:'#0c1714',accent:'#7de0b5',hazard:'#f4c36f',reward:'#a8ec99'},
  {name:'Glass Circuit',tone:'Telegraph',range:'301–400',bg:'#071019',floor:'#13232f',floor2:'#0d1b26',wall:'#284259',wallSide:'#0a141d',accent:'#8fdcff',hazard:'#ffd171',reward:'#a6a0ff'},
  {name:'Null Foundry',tone:'Attrition',range:'401–500',bg:'#0d0811',floor:'#211525',floor2:'#180f1c',wall:'#3c2942',wallSide:'#140b18',accent:'#d7a2ff',hazard:'#f0a661',reward:'#bb88ff'},
  {name:'Storm Archive',tone:'Adaptation',range:'501–600',bg:'#070c17',floor:'#151e34',floor2:'#0f172a',wall:'#2b3c5c',wallSide:'#0b1120',accent:'#8cbcff',hazard:'#f4d173',reward:'#91e7ff'},
  {name:'Warden Lattice',tone:'Control',range:'601–700',bg:'#0d0d0f',floor:'#25252a',floor2:'#1b1b20',wall:'#484851',wallSide:'#151519',accent:'#eceff4',hazard:'#ffc46e',reward:'#9edbff'},
  {name:'Black Reservoir',tone:'Survival',range:'701–800',bg:'#050d0e',floor:'#102122',floor2:'#0b191a',wall:'#1d393b',wallSide:'#081314',accent:'#7de1d2',hazard:'#f0aa67',reward:'#94f0e2'},
  {name:'Crown Engine',tone:'Mastery',range:'801–900',bg:'#110d07',floor:'#2b2214',floor2:'#20180e',wall:'#514125',wallSide:'#1a1208',accent:'#f0c66a',hazard:'#ff826e',reward:'#f6e28c'},
  {name:"Architect's Spine",tone:'Finale',range:'901–1000',bg:'#0c0b10',floor:'#211f28',floor2:'#17161d',wall:'#45414e',wallSide:'#141218',accent:'#f2d28b',hazard:'#ff716f',reward:'#b6a2ff'}
];
const QUALITY={
  low:{dpr:1,detail:0,particles:0,shadow:0,glow:0,targetFps:30},
  balanced:{dpr:1.35,detail:1,particles:12,shadow:1,glow:1,targetFps:60},
  high:{dpr:1.7,detail:2,particles:28,shadow:1,glow:2,targetFps:60},
  ultra:{dpr:2,detail:3,particles:48,shadow:2,glow:3,targetFps:60}
};
const MODULE_NAMES={'reinforced-shell':'Reinforced Shell','kinetic-guard':'Kinetic Guard','edge-coil':'Edge Coil','reactive-plating':'Reactive Plating','reserve-cell':'Reserve Cell','field-repair':'Field Repair','hazard-lens':'Hazard Lens','warden-key':'Warden Key','route-cache':'Route Cache','salvage-rig':'Salvage Rig','pulse-step':'Pulse Step','architect-sigil':'Architect Sigil'};
const REASON_COPY={
  'adjacent-hostile':'Immediate threat is blocking the route.',
  'critical-health':'Holding position while exposure is critical.',
  'threat-aware-route':'Taking the lowest-risk verified route toward the objective.',
  'safe-reward':'A nearby upgrade is inside the current risk limit.',
  'lowest-threat-move':'The direct route is unsafe; repositioning to reduce exposure.',
  'floor-transition':'Reassessing the newly entered floor.',
  'explicit-action':'Applying a validated operator action.',
  'wait-test':'Holding position for deterministic verification.'
};
const OBJECTIVE_COPY={'reach-exit':'Reach the exit','defeat-warden':'Defeat the Warden','defeat-architect':'Defeat the Architect'};

let snapshot=null,previousSnapshot=null,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let quality=chooseQuality(),audioEnabled=false,audioCtx=null,ambientOsc=null,ambientGain=null,lastEvent=0,lastFrame=0,lastDraw=0;
let playerMotion=null,facing=-Math.PI/2,enemyMotion=new Map(),cameraKick=0,particles=[];

function chooseQuality(){
  const memory=Number(navigator.deviceMemory||8),cores=Number(navigator.hardwareConcurrency||8);
  if(memory<=4||cores<=4)return'low';
  if(memory>=12&&cores>=10)return'high';
  return'balanced';
}
function setQuality(next){if(!QUALITY[next])return;quality=next;root.dataset.quality=next;ui.quality.value=next;resize()}
function applyMotionState(){ui.motion.setAttribute('aria-pressed',String(reduced));root.dataset.reducedMotion=String(reduced);if(reduced&&snapshot)syncMotion(snapshot,true)}
function resize(){const r=canvas.getBoundingClientRect(),cap=QUALITY[quality].dpr,dpr=Math.min(devicePixelRatio||1,cap);canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0)}
const xy=(cell,w)=>({x:cell%w,y:Math.floor(cell/w)});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const lerp=(a,b,t)=>a+(b-a)*t;

function syncMotion(s,hard=false){
  const p=xy(s.player.cell,s.width),floorChanged=!previousSnapshot||previousSnapshot.floor!==s.floor;
  if(!playerMotion||hard||floorChanged)playerMotion={x:p.x,y:p.y,tx:p.x,ty:p.y};
  else{
    const dx=p.x-playerMotion.tx,dy=p.y-playerMotion.ty;if(dx||dy)facing=Math.atan2(dy,dx);
    playerMotion.tx=p.x;playerMotion.ty=p.y;
  }
  const alive=new Set();
  for(const enemy of s.enemies){
    alive.add(enemy.id);const p2=xy(enemy.cell,s.width),current=enemyMotion.get(enemy.id);
    if(!current||hard||floorChanged)enemyMotion.set(enemy.id,{x:p2.x,y:p2.y,tx:p2.x,ty:p2.y});
    else{current.tx=p2.x;current.ty=p2.y}
  }
  for(const id of enemyMotion.keys())if(!alive.has(id))enemyMotion.delete(id);
}
function animateMotion(dt){
  const t=reduced?1:1-Math.exp(-dt/92);
  if(playerMotion){playerMotion.x=lerp(playerMotion.x,playerMotion.tx,t);playerMotion.y=lerp(playerMotion.y,playerMotion.ty,t)}
  for(const item of enemyMotion.values()){item.x=lerp(item.x,item.tx,t);item.y=lerp(item.y,item.ty,t)}
  cameraKick=reduced?0:cameraKick*Math.pow(.84,dt/16.7);
}

function boardGeometry(r,s){
  const pad=Math.max(24,Math.min(54,Math.min(r.width,r.height)*.055)),reservedBottom=r.height<520?50:74;
  const cell=Math.max(8,Math.min((r.width-pad*2)/s.width,(r.height-pad*2-reservedBottom)/s.height));
  const w=cell*s.width,h=cell*s.height,ox=(r.width-w)/2,oy=(r.height-reservedBottom-h)/2+8;
  return{cell,w,h,ox,oy,depth:Math.max(2,cell*(QUALITY[quality].detail?0.105:.075))};
}
function roundedRect(x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath()}
function glow(color,blur){if(!QUALITY[quality].glow)return;ctx.shadowColor=color;ctx.shadowBlur=blur}
function clearShadow(){ctx.shadowColor='transparent';ctx.shadowBlur=0}

function drawBackdrop(r,theme,now){
  const g=ctx.createRadialGradient(r.width*.5,r.height*.42,20,r.width*.5,r.height*.45,Math.max(r.width,r.height)*.72);g.addColorStop(0,theme.floor2);g.addColorStop(.48,theme.bg);g.addColorStop(1,'#020305');ctx.fillStyle=g;ctx.fillRect(0,0,r.width,r.height);
  ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=theme.accent;ctx.lineWidth=1;const spacing=quality==='low'?64:48,drift=reduced?0:(now*.004)%spacing;for(let x=-spacing+drift;x<r.width+spacing;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-r.height*.15,r.height);ctx.stroke()}ctx.restore();
}
function drawBoardFrame(g,theme,s){
  const lip=Math.max(7,g.cell*.18);ctx.fillStyle='rgba(0,0,0,.5)';roundedRect(g.ox-lip+g.depth,g.oy-lip+g.depth,g.w+lip*2,g.h+lip*2,Math.max(8,g.cell*.2));ctx.fill();
  const grad=ctx.createLinearGradient(g.ox,g.oy,g.ox+g.w,g.oy+g.h);grad.addColorStop(0,theme.wall);grad.addColorStop(1,theme.wallSide);ctx.fillStyle=grad;roundedRect(g.ox-lip,g.oy-lip,g.w+lip*2,g.h+lip*2,Math.max(8,g.cell*.2));ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;roundedRect(g.ox-lip+.5,g.oy-lip+.5,g.w+lip*2-1,g.h+lip*2-1,Math.max(8,g.cell*.2));ctx.stroke();
  if(QUALITY[quality].detail>=2){ctx.strokeStyle=theme.accent;ctx.globalAlpha=.18;ctx.setLineDash([g.cell*.35,g.cell*.22]);ctx.strokeRect(g.ox-lip*.45,g.oy-lip*.45,g.w+lip*.9,g.h+lip*.9);ctx.setLineDash([]);ctx.globalAlpha=1}
}
function drawFloorCell(c,x,y,size,theme,s){
  const parity=((c.index+(s.sector*3))%4),base=parity===0?theme.floor2:theme.floor;ctx.fillStyle=base;ctx.fillRect(x,y,Math.ceil(size)+.5,Math.ceil(size)+.5);
  ctx.strokeStyle='rgba(255,255,255,.045)';ctx.lineWidth=Math.max(.5,size*.018);ctx.strokeRect(x+.3,y+.3,size-.6,size-.6);
  if(QUALITY[quality].detail>=1&&!c.wall){ctx.save();ctx.globalAlpha=.11;ctx.strokeStyle=theme.accent;ctx.lineWidth=Math.max(.5,size*.012);if((c.index+s.sector)%3===0){ctx.beginPath();ctx.moveTo(x+size*.16,y+size*.78);ctx.lineTo(x+size*.84,y+size*.78);ctx.stroke()}if(QUALITY[quality].detail>=2&&(c.index+s.floor)%5===0){ctx.fillStyle=theme.accent;ctx.fillRect(x+size*.13,y+size*.13,Math.max(1,size*.025),Math.max(1,size*.025));ctx.fillRect(x+size*.84,y+size*.84,Math.max(1,size*.025),Math.max(1,size*.025))}ctx.restore()}
}
function drawWall(x,y,size,depth,theme){
  ctx.fillStyle=theme.wallSide;ctx.beginPath();ctx.moveTo(x+size,y+depth);ctx.lineTo(x+size+depth,y);ctx.lineTo(x+size+depth,y+size-depth*.15);ctx.lineTo(x+size,y+size);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(x+depth,y+size,size-depth,depth);
  const grad=ctx.createLinearGradient(x,y,x+size,y+size);grad.addColorStop(0,theme.wall);grad.addColorStop(1,theme.wallSide);ctx.fillStyle=grad;ctx.fillRect(x,y,size,size);
  ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=Math.max(.7,size*.018);ctx.strokeRect(x+.5,y+.5,size-1,size-1);
  if(QUALITY[quality].detail>=1){ctx.strokeStyle='rgba(255,255,255,.05)';ctx.beginPath();ctx.moveTo(x+size*.18,y+size*.22);ctx.lineTo(x+size*.82,y+size*.22);ctx.stroke()}
}
function drawExit(x,y,size,theme){
  ctx.save();glow('#74f2c4',Math.min(18,size*.35));ctx.strokeStyle='#71e4b8';ctx.lineWidth=Math.max(2,size*.07);roundedRect(x+size*.2,y+size*.15,size*.6,size*.7,size*.08);ctx.stroke();clearShadow();ctx.fillStyle='rgba(113,228,184,.12)';roundedRect(x+size*.28,y+size*.23,size*.44,size*.54,size*.05);ctx.fill();ctx.strokeStyle='rgba(215,255,241,.72)';ctx.lineWidth=Math.max(1,size*.025);for(let i=0;i<2;i++){const yy=y+size*(.42+i*.16);ctx.beginPath();ctx.moveTo(x+size*.39,yy);ctx.lineTo(x+size*.5,yy+size*.07);ctx.lineTo(x+size*.61,yy);ctx.stroke()}ctx.restore()
}
function drawReward(x,y,size,theme){ctx.save();ctx.translate(x+size/2,y+size/2);glow(theme.reward,Math.min(16,size*.3));ctx.fillStyle=theme.reward;ctx.beginPath();for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3,px=Math.cos(a)*size*.17,py=Math.sin(a)*size*.17;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();clearShadow();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=Math.max(1,size*.022);ctx.stroke();ctx.restore()}
function drawHazard(kind,x,y,size,theme){
  const cx=x+size/2,cy=y+size/2;ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=theme.hazard;ctx.fillStyle=theme.hazard;ctx.lineWidth=Math.max(1.2,size*.035);ctx.globalAlpha=.92;
  if(kind==='spike'){for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,-size*.25);ctx.lineTo(size*.1,-size*.05);ctx.lineTo(-size*.1,-size*.05);ctx.closePath();ctx.fill();ctx.restore()}}
  else if(kind==='heat'){ctx.strokeRect(-size*.22,-size*.2,size*.44,size*.4);for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-size*.2,i*size*.1);ctx.lineTo(size*.2,i*size*.1);ctx.stroke()}}
  else if(kind==='beam'){ctx.strokeRect(-size*.23,-size*.23,size*.46,size*.46);ctx.beginPath();ctx.moveTo(-size*.28,0);ctx.lineTo(size*.28,0);ctx.moveTo(0,-size*.28);ctx.lineTo(0,size*.28);ctx.stroke()}
  else if(kind==='null'){ctx.setLineDash([size*.08,size*.06]);ctx.beginPath();ctx.arc(0,0,size*.24,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.22;ctx.fillStyle='#05030a';ctx.beginPath();ctx.arc(0,0,size*.15,0,Math.PI*2);ctx.fill()}
  else if(kind==='storm'){ctx.beginPath();ctx.moveTo(-size*.08,-size*.27);ctx.lineTo(size*.05,-size*.05);ctx.lineTo(-size*.02,-size*.05);ctx.lineTo(size*.08,size*.25);ctx.lineTo(-size*.07,size*.04);ctx.lineTo(0,size*.04);ctx.closePath();ctx.fill()}
  else if(kind==='snare'){ctx.beginPath();ctx.arc(0,0,size*.23,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,size*.11,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*size*.12,Math.sin(a)*size*.12);ctx.lineTo(Math.cos(a)*size*.25,Math.sin(a)*size*.25);ctx.stroke()}}
  ctx.restore();
}
function drawEnemy(enemy,motion,g,theme,player){
  if(!motion)return;const x=g.ox+(motion.x+.5)*g.cell,y=g.oy+(motion.y+.5)*g.cell,size=g.cell*(enemy.kind==='architect'?.78:enemy.kind==='warden'?.68:.52),angle=Math.atan2(player.y-motion.y,player.x-motion.x);ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
  ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(0,size*.38,size*.43,size*.17,0,0,Math.PI*2);ctx.fill();ctx.translate(0,-size*.05);glow('#ff7782',QUALITY[quality].glow*4);
  const fill=enemy.kind==='architect'?'#f4c96e':enemy.kind==='warden'?'#e9a9ff':'#ff7b86';ctx.fillStyle=fill;ctx.strokeStyle='rgba(255,255,255,.68)';ctx.lineWidth=Math.max(1,g.cell*.025);
  if(enemy.kind==='sentinel'){roundedRect(-size*.34,-size*.25,size*.68,size*.5,size*.12);ctx.fill();ctx.stroke();ctx.fillStyle=theme.wallSide;ctx.fillRect(-size*.23,-size*.06,size*.46,size*.12)}
  else if(enemy.kind==='striker'){ctx.beginPath();ctx.moveTo(0,-size*.38);ctx.lineTo(size*.3,size*.28);ctx.lineTo(0,size*.18);ctx.lineTo(-size*.3,size*.28);ctx.closePath();ctx.fill();ctx.stroke()}
  else if(enemy.kind==='leech'){ctx.beginPath();ctx.arc(0,0,size*.29,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,size*.14,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*size*.2,Math.sin(a)*size*.2);ctx.lineTo(Math.cos(a)*size*.38,Math.sin(a)*size*.38);ctx.stroke()}}
  else if(enemy.kind==='warden'){ctx.beginPath();for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3,px=Math.cos(a)*size*.38,py=Math.sin(a)*size*.38;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=theme.wallSide;ctx.fillRect(-size*.2,-size*.06,size*.4,size*.14)}
  else{for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.fillRect(-size*.055,-size*.42,size*.11,size*.34);ctx.restore()}ctx.beginPath();ctx.arc(0,0,size*.24,0,Math.PI*2);ctx.fill();ctx.stroke()}
  clearShadow();
  if(enemy.telegraph==='attack'||enemy.telegraph==='charge'){ctx.strokeStyle=theme.hazard;ctx.lineWidth=Math.max(1.5,g.cell*.04);ctx.setLineDash([g.cell*.12,g.cell*.08]);ctx.beginPath();ctx.arc(0,0,size*.58,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
  if(enemy.healthPermille<1000||enemy.kind==='warden'||enemy.kind==='architect'){const bw=size*.8,bh=Math.max(2,g.cell*.035);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(-bw/2,size*.5,bw,bh);ctx.fillStyle=enemy.healthPermille<300?'#ff6d78':'#f5d37a';ctx.fillRect(-bw/2,size*.5,bw*(enemy.healthPermille/1000),bh)}
  ctx.restore();
}
function drawAstra(motion,g,theme,s){
  if(!motion)return;const x=g.ox+(motion.x+.5)*g.cell,y=g.oy+(motion.y+.5)*g.cell,size=g.cell*.56;ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(0,size*.42,size*.43,size*.17,0,0,Math.PI*2);ctx.fill();ctx.rotate(facing+Math.PI/2);glow(theme.accent,QUALITY[quality].glow*5);
  ctx.fillStyle='#c9d7dc';ctx.fillRect(-size*.18,size*.13,size*.12,size*.24);ctx.fillRect(size*.06,size*.13,size*.12,size*.24);ctx.fillStyle='#77929a';ctx.fillRect(-size*.21,size*.29,size*.15,size*.08);ctx.fillRect(size*.06,size*.29,size*.15,size*.08);
  const body=ctx.createLinearGradient(-size*.25,-size*.25,size*.25,size*.28);body.addColorStop(0,'#eef7f8');body.addColorStop(.45,'#9fb5bb');body.addColorStop(1,'#566b73');ctx.fillStyle=body;roundedRect(-size*.28,-size*.28,size*.56,size*.52,size*.11);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=Math.max(1,g.cell*.022);ctx.stroke();
  ctx.fillStyle='#60757d';ctx.fillRect(-size*.37,-size*.13,size*.1,size*.28);ctx.fillRect(size*.27,-size*.13,size*.1,size*.28);ctx.fillStyle=theme.accent;glow(theme.accent,Math.min(18,size*.45));ctx.beginPath();ctx.arc(0,-size*.05,size*.105,0,Math.PI*2);ctx.fill();clearShadow();ctx.fillStyle='#071016';ctx.fillRect(-size*.13,-size*.25,size*.26,size*.055);
  ctx.strokeStyle=theme.accent;ctx.lineWidth=Math.max(1,size*.025);ctx.beginPath();ctx.moveTo(0,-size*.31);ctx.lineTo(0,-size*.42);ctx.stroke();ctx.beginPath();ctx.arc(0,-size*.45,size*.025,0,Math.PI*2);ctx.fill();
  if(s.player.shield>0){ctx.globalAlpha=.22+Math.min(.28,s.player.shield*.025);ctx.strokeStyle='#7ddff2';ctx.lineWidth=Math.max(1.2,g.cell*.027);ctx.beginPath();ctx.arc(0,0,size*.53,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
}
function drawParticles(g){if(!particles.length)return;ctx.save();for(const p of particles){ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);ctx.fillStyle=p.color;ctx.fillRect(g.ox+(p.x+.5)*g.cell,g.oy+(p.y+.5)*g.cell,Math.max(1,g.cell*.035),Math.max(1,g.cell*.035))}ctx.restore()}
function spawnParticles(kind,s){const cap=QUALITY[quality].particles;if(!cap||!playerMotion)return;const count=Math.min(cap-particles.length,kind==='floor-cleared'?12:kind==='player-damaged'?7:5);if(count<=0)return;const theme=SECTORS[s.sector-1]||SECTORS[0],color=kind==='player-damaged'?'#ff7782':kind==='floor-cleared'?theme.accent:'#f4ce76';for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2+(s.tick%7)*.13,speed=.4+(i%4)*.12;particles.push({x:playerMotion.tx,y:playerMotion.ty,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:420+(i%3)*90,maxLife:600,color})}}
function updateParticles(dt){for(const p of particles){p.life-=dt;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vx*=Math.pow(.9,dt/16.7);p.vy*=Math.pow(.9,dt/16.7)}particles=particles.filter(p=>p.life>0).slice(-QUALITY[quality].particles)}

function draw(now){
  const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const theme=SECTORS[(snapshot?.sector||1)-1]||SECTORS[0];drawBackdrop(r,theme,now);if(!snapshot)return;
  const g=boardGeometry(r,snapshot),shake=reduced?0:cameraKick;ctx.save();ctx.translate(shake?Math.sin(now*.06)*shake:0,shake?Math.cos(now*.047)*shake*.55:0);drawBoardFrame(g,theme,snapshot);
  for(const c of snapshot.cells){const p=xy(c.index,snapshot.width),x=g.ox+p.x*g.cell,y=g.oy+p.y*g.cell;drawFloorCell(c,x,y,g.cell,theme,snapshot)}
  for(const c of snapshot.cells){if(!c.wall)continue;const p=xy(c.index,snapshot.width);drawWall(g.ox+p.x*g.cell,g.oy+p.y*g.cell,g.cell,g.depth,theme)}
  for(const c of snapshot.cells){const p=xy(c.index,snapshot.width),x=g.ox+p.x*g.cell,y=g.oy+p.y*g.cell;if(c.hazard)drawHazard(c.hazard,x,y,g.cell,theme);if(c.reward)drawReward(x,y,g.cell,theme);if(c.exit)drawExit(x,y,g.cell,theme)}
  const playerPoint=playerMotion||{x:xy(snapshot.player.cell,snapshot.width).x,y:xy(snapshot.player.cell,snapshot.width).y};for(const enemy of snapshot.enemies)drawEnemy(enemy,enemyMotion.get(enemy.id),g,theme,playerPoint);drawAstra(playerMotion,g,theme,snapshot);drawParticles(g);ctx.restore();
  const vignette=ctx.createRadialGradient(r.width/2,r.height/2,Math.min(r.width,r.height)*.28,r.width/2,r.height/2,Math.max(r.width,r.height)*.7);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.44)');ctx.fillStyle=vignette;ctx.fillRect(0,0,r.width,r.height);
}
function frame(now){const dt=Math.min(50,Math.max(0,now-lastFrame||16.7));lastFrame=now;animateMotion(dt);updateParticles(dt);const minFrame=1000/QUALITY[quality].targetFps;if(now-lastDraw>=minFrame){draw(now);lastDraw=now}requestAnimationFrame(frame)}

function ensureAudio(){if(audioCtx)return;audioCtx=new AudioContext();ambientOsc=audioCtx.createOscillator();ambientGain=audioCtx.createGain();ambientOsc.type='sine';ambientOsc.frequency.value=54;ambientGain.gain.value=.0001;ambientOsc.connect(ambientGain).connect(audioCtx.destination);ambientOsc.start()}
function updateAmbient(s){if(!audioEnabled||!audioCtx||!ambientOsc||!ambientGain)return;const target=44+s.sector*3;ambientOsc.frequency.setTargetAtTime(target,audioCtx.currentTime,.4);ambientGain.gain.setTargetAtTime(s.danger==='critical'?.012:s.archetype==='warden'||s.archetype==='architect'?.009:.006,audioCtx.currentTime,.35)}
function cue(kind){if(!audioEnabled)return;ensureAudio();const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=kind==='danger'?'sawtooth':kind==='milestone'?'triangle':'sine';osc.frequency.value=kind==='danger'?160:kind==='milestone'?610:360;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==='danger'?.028:.022,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+(kind==='milestone'?.24:.14));osc.connect(gain).connect(audioCtx.destination);osc.start(now);osc.stop(now+(kind==='milestone'?.26:.16))}

function processEvent(event,s){
  if(!event||event.seq<=lastEvent)return;lastEvent=event.seq;
  if(event.type==='player-damaged'){cameraKick=Math.max(cameraKick,QUALITY[quality].shadow?3.2:1.7);spawnParticles(event.type,s);cue('danger')}
  else if(event.type==='floor-cleared'||event.type==='enemy-defeated'||event.type==='reward-collected'){spawnParticles(event.type,s);cue(event.type==='floor-cleared'?'milestone':'progress')}
  else if(s.danger==='critical')cue('danger');
}
function friendlyReason(s){const reason=REASON_COPY[s.ai.reason]||s.ai.reason.replaceAll('-',' ');return s.ai.obstacle?`${s.ai.obstacle} · ${reason}`:reason}
function render(s){
  previousSnapshot=snapshot;snapshot=s;syncMotion(s,false);const theme=SECTORS[s.sector-1]||SECTORS[0];root.dataset.scene=s.lifecycle==='running'?'play':s.lifecycle==='intermission'?'intermission':'result';root.dataset.sector=String(s.sector);stage.dataset.danger=s.danger;
  ui.floor.textContent=`Floor ${s.floor} / 1000`;ui.objective.textContent=OBJECTIVE_COPY[s.objective]||s.objective.replaceAll('-',' ');ui.progress.style.width=`${s.progressPermille/10}%`;ui.sector.textContent=`Sector ${s.sector} · ${s.archetype.replaceAll('-',' ')}`;ui.sectorName.textContent=theme.name;ui.sectorTone.textContent=`${theme.tone} · Floors ${theme.range}`;
  ui.health.textContent=`${s.player.health}/${s.player.maxHealth}`;ui.energy.textContent=`${s.player.energy}/${s.player.maxEnergy}`;ui.shield.textContent=String(s.player.shield);ui.score.textContent=String(s.score);ui.intent.textContent=s.ai.intent;ui.reason.textContent=friendlyReason(s);ui.confidence.textContent=`${s.ai.confidence.toUpperCase()} CONFIDENCE`;ui.highest.textContent=`Floor ${s.highestFloor}`;ui.cleared.textContent=`${s.floorsCleared} floors cleared`;
  ui.modules.textContent=s.player.modules.length?s.player.modules.map(id=>MODULE_NAMES[id]||id.replaceAll('-',' ')).join(' · '):'Base kit';ui.events.replaceChildren(...s.events.slice(-5).reverse().map(e=>Object.assign(document.createElement('li'),{textContent:e.message})));const newest=s.events.at(-1);ui.caption.textContent=newest?.message??`${s.ai.intent} Floor ${s.floor}.`;q('danger').textContent=s.danger.toUpperCase();processEvent(newest,s);updateAmbient(s)
}
async function poll(){try{const res=await fetch('/floors/state',{cache:'no-store'});if(!res.ok)throw new Error('state');render(await res.json());ui.connection.textContent='LIVE';root.dataset.scene=snapshot.lifecycle==='running'?'play':root.dataset.scene}catch{ui.connection.textContent='RECOVERING';root.dataset.scene='recovery'}finally{setTimeout(poll,700)}}

ui.motion.addEventListener('click',()=>{reduced=!reduced;applyMotionState()});
ui.audio.addEventListener('click',async()=>{audioEnabled=!audioEnabled;ui.audio.setAttribute('aria-pressed',String(audioEnabled));ui.audio.textContent=audioEnabled?'Sound on':'Sound off';if(audioEnabled){ensureAudio();await audioCtx.resume();if(snapshot)updateAmbient(snapshot)}else if(ambientGain&&audioCtx)ambientGain.gain.setTargetAtTime(.0001,audioCtx.currentTime,.08)});
ui.quality.addEventListener('change',()=>setQuality(ui.quality.value));
addEventListener('resize',resize);new ResizeObserver(resize).observe(canvas);setQuality(quality);applyMotionState();resize();requestAnimationFrame(frame);poll();
