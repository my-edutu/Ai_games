'use strict';
(()=>{
const canvas=document.getElementById('tower-canvas');
const ctx=canvas.getContext('2d',{alpha:false});
const body=document.body;
const params=new URLSearchParams(location.search);
const reduced=params.get('reducedMotion')==='1';
const contrast=params.get('highContrast')==='1';
const muted=params.get('muted')==='1';
const clean=params.get('cleanFeed')==='1';
body.dataset.reducedMotion=String(reduced);
body.dataset.highContrast=String(contrast);
body.classList.toggle('clean-feed',clean);

const $=id=>document.getElementById(id);
const q=id=>document.querySelector(`[data-testid=${id}]`);
const MAX_PARTICLES=96;
const MAX_FRAME_SAMPLES=120;
const MILESTONE_FLOORS=[10,25,50,100,250,500,1000];
const particles=[];
const frameSamples=[];
let current=null,polling=false,closed=false,lastChecksum='',lastState=null,lastFloor=-1,lastAudioId='',audioCtx=null,master=null;
let visual=null,impactPulse=0,hitPulse=0,shieldPulse=0,lastFrameMsP95=0,framesSinceMetric=0;

const PALETTES={
  foundry:{sky0:'#120806',sky1:'#3c140b',fog:'#ff7b32',edge:'#ffd08a',metal:'#49332d',metal2:'#15171a',accent:'#ff5f2e',ambient:'#ff9c5a'},
  ruins:{sky0:'#0d1411',sky1:'#263a2c',fog:'#b7d29e',edge:'#ddd0a8',metal:'#555248',metal2:'#161d19',accent:'#83c96f',ambient:'#c8dfa8'},
  storm:{sky0:'#04101d',sky1:'#102d4c',fog:'#76dbff',edge:'#b4f2ff',metal:'#25384d',metal2:'#0c1724',accent:'#43ccff',ambient:'#75e8ff'},
  clockwork:{sky0:'#100914',sky1:'#3c233d',fog:'#eab969',edge:'#ffe0a3',metal:'#654e38',metal2:'#18131c',accent:'#f1b84c',ambient:'#ffd77f'},
  void:{sky0:'#030309',sky1:'#160d2b',fog:'#9a63ff',edge:'#e2ceff',metal:'#2d2544',metal2:'#09070f',accent:'#9e61ff',ambient:'#c28cff'}
};

function fit(){
  const d=Math.min(2,devicePixelRatio||1),r=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;ctx.setTransform(d,0,0,d,0,0)}
}
function sceneName(scene){return({normal:'ASCENDING',danger:'DANGER',upgrade:'BUILD CHOICE',guardian:'GUARDIAN',result:'RUN COMPLETE',intermission:'NEXT RUN',recovery:'RECOVERING'})[scene]||String(scene).toUpperCase()}
function setText(testId,value){const node=q(testId);if(node)node.textContent=String(value)}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967295}
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function palette(theme){return PALETTES[theme]||PALETTES.foundry}
function polygon(points,fill,stroke,lineWidth=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}}
function line(x1,y1,x2,y2,color,width=1,alpha=1){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1}
function glow(x,y,r,color,a=.3){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalAlpha=1}
function circle(x,y,r,fill,stroke=null,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function nextMilestone(floor){for(const value of MILESTONE_FLOORS)if(value>floor)return value;return Math.ceil((floor+1)/500)*500}
function milestoneStrength(floor){return MILESTONE_FLOORS.includes(floor)?1:0}

function update(data){
  const s=data.snapshot;if(!s)return;
  window.__TOWER_PUBLIC_STATE__=s;
  setText('floor',s.floor);setText('height',`${Math.floor(s.progress.height/1000)}m`);setText('guardian',s.progress.nextGuardianFloor);setText('tick',s.tick);
  setText('health',`${s.player.health}/${s.player.maxHealth}`);setText('stamina',s.player.stamina);setText('shields',s.player.shieldCharges);setText('ai-intent',s.intent.summary.toUpperCase());setText('score',s.player.score.toLocaleString());setText('scene',sceneName(data.scene));
  setText('milestone',`F${nextMilestone(s.floor)}`);
  const progress=Math.round(s.progress.floorProgressPermille/10);setText('progress',`${progress}%`);
  $('floor-progress').style.width=`${progress}%`;$('health-bar').style.width=`${100*s.player.health/s.player.maxHealth}%`;$('stamina-bar').style.width=`${100*s.player.stamina/s.player.maxStamina}%`;
  $('theme-name').textContent=`${s.theme.toUpperCase()} SECTOR`;$('intent-mode').textContent=s.intent.mode.toUpperCase();$('confidence').textContent=`${Math.round(s.intent.confidencePermille/10)}%`;$('caption-text').textContent=data.audio?.captions?.[0]?.text||s.intent.summary;
  body.classList.toggle('danger',data.scene==='danger'||data.scene==='guardian');body.dataset.theme=s.theme;
  const tags=$('build-tags');tags.replaceChildren(...(s.buildTags.length?s.buildTags:['BASE KIT']).map(text=>{const e=document.createElement('em');e.textContent=text.replaceAll('-',' ').toUpperCase();return e}));
  $('choice-card').hidden=data.scene!=='upgrade';$('result-card').hidden=!['result','intermission'].includes(data.scene);$('recovery-card').hidden=data.scene!=='recovery';
  if(!visual||lastState?.runToken!==s.runToken)visual={x:s.player.x,y:s.player.y,vx:s.player.vx,vy:s.player.vy};
  if(lastState){
    const previousGrounded=lastState.player.state==='grounded',nowGrounded=s.player.state==='grounded';
    if(!previousGrounded&&nowGrounded)impactPulse=Math.max(impactPulse,clamp(Math.abs(lastState.player.vy)/17000,0,.9));
    if(s.player.health<lastState.player.health)hitPulse=1;
    if(s.player.shieldCharges<lastState.player.shieldCharges)shieldPulse=1;
  }
  if(lastFloor>=0&&s.floor!==lastFloor)burst(canvas.clientWidth*.5,canvas.clientHeight*.35,palette(s.theme).edge,30,'milestone');
  lastFloor=s.floor;lastState=s;playFrameAudio(data.audio);
}

function transform(s,w,h,camera){
  const base=Math.min(w/(s.worldWidth/1000+105),h/(s.chunkHeight/1000*.68));
  const scale=base/Math.max(.78,camera?.zoom||1),cx=(camera?.centerX||s.worldWidth/2)/1000,cy=((camera?.centerY||s.player.y)-s.chunkBaseY)/1000;
  const shake=!reduced&&(camera?.impulse||0)>.05?(hash(`${s.tick}:x`)-.5)*8*(camera.impulse||0):0;
  return{x:v=>w/2+(v/1000-cx)*scale+shake,y:v=>h*.63-((v-s.chunkBaseY)/1000-cy)*scale,scale};
}
function isVisible(x,y,w,h,pad=30){return x>=-pad&&x<=w+pad&&y>=-pad&&y<=h+pad}

function drawSky(s,w,h,p,time){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,p.sky0);g.addColorStop(.62,p.sky1);g.addColorStop(1,'#020306');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const moonX=w*.76,moonY=h*.18;glow(moonX,moonY,h*.23,p.fog,.17);ctx.globalAlpha=.2;circle(moonX,moonY,h*.058,p.edge);ctx.globalAlpha=1;
  for(let layer=0;layer<4;layer++){
    const y=h*(.2+layer*.145),speed=reduced?0:time*(.003+layer*.0015);ctx.globalAlpha=.045+layer*.035;ctx.fillStyle=layer<2?p.fog:p.metal;
    ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w+120;x+=80){const n=hash(`${s.theme}:${layer}:${Math.floor((x+speed)%2000)}`),peak=y+n*h*.12;ctx.lineTo(x,peak)}ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  }
  if(s.theme==='storm')for(let i=0;i<18;i++){const x=(hash(`rainx${i}`)*w+time*.15*(i%3+1))%w,y=(hash(`rainy${i}`)*h+time*.32*(i%5+2))%h;line(x,y,x-13,y+30,'#b9f2ff',1,.16)}
  if(s.theme==='void'){for(let i=0;i<28;i++){const x=hash(`starx${i}`)*w,y=hash(`stary${i}`)*h*.72,r=1+hash(`starr${i}`)*1.7;ctx.globalAlpha=.2+.45*hash(`stara${i}`);ctx.fillStyle='#eadfff';ctx.fillRect(x,y,r,r)}ctx.globalAlpha=1}
}

function drawTowerDepth(s,w,h,p,time){
  const vanX=w*.5,tiers=[.07,.15,.26,.39];
  for(let i=0;i<tiers.length;i++){
    const inset=w*tiers[i],top=h*(.02+i*.065),alpha=.11+i*.045;ctx.globalAlpha=alpha;
    polygon([[inset,h],[w-inset,h],[w*.61,top],[w*.39,top]],p.metal2,p.edge,1);
    for(let y=top+26;y<h;y+=45+i*9)line(lerp(w*.39,inset,(y-top)/(h-top)),y,lerp(w*.61,w-inset,(y-top)/(h-top)),y,p.edge,1,.1);
    ctx.globalAlpha=1;
  }
  for(let i=0;i<7;i++){const side=i%2?1:-1,baseX=vanX+side*(w*.18+(i%4)*w*.055),par=(time*.006*(i%3+1))%80;line(baseX,0,baseX+side*90,h,p.edge,2,.07);for(let y=-80+par;y<h;y+=90)glow(baseX+side*y*.08,y,8,p.accent,.1)}
}

function drawFoundryMachinery(s,w,h,p,time){
  for(const side of[-1,1]){
    const x=side<0?w*.12:w*.88;
    for(let i=0;i<3;i++){
      const y=h*(.28+i*.24),r=Math.min(w,h)*(.065+i*.008);glow(x,y,r*1.7,p.accent,.12);circle(x,y,r,p.metal2,p.edge,2);circle(x,y,r*.58,'#24100a',p.accent,2);circle(x,y,r*.26,p.accent);for(let a=0;a<8;a++){const ang=a*Math.PI/4;line(x+Math.cos(ang)*r*.62,y+Math.sin(ang)*r*.62,x+Math.cos(ang)*r*.92,y+Math.sin(ang)*r*.92,p.edge,5,.35)}
    }
  }
  for(let i=0;i<5;i++){const x=w*(.24+i*.13),sway=reduced?0:Math.sin(time*.001+i)*7;line(x,0,x+sway,h*.2,'#141414',7,.8);for(let y=12;y<h*.2;y+=16)circle(x+sway*(y/(h*.2)),y,3,'#191919',p.edge,.6)}
  const g=ctx.createLinearGradient(0,h*.78,0,h);g.addColorStop(0,'rgba(255,91,36,0)');g.addColorStop(1,'rgba(255,91,36,.28)');ctx.fillStyle=g;ctx.fillRect(0,h*.72,w,h*.28);
}
function drawRuinsGrowth(s,w,h,p,time){
  for(const side of[-1,1]){
    const x=side<0?w*.1:w*.9;
    for(let i=0;i<4;i++){const y=h*(.18+i*.2),ww=w*.09,hh=h*.12;ctx.globalAlpha=.38;polygon([[x-ww*.5,y+hh],[x+ww*.5,y+hh],[x+ww*.36,y],[x-ww*.42,y-hh*.05]],'#34382f',p.edge,1);ctx.globalAlpha=1;line(x-ww*.42,y+hh*.4,x-ww*.16,y+hh*.02,p.accent,3,.5)}
  }
  ctx.strokeStyle=p.accent;ctx.lineWidth=3;ctx.globalAlpha=.34;
  for(let i=0;i<8;i++){const x=w*(.08+i*.12),len=h*(.13+.16*hash(`vine${i}`));ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+25,len*.25,x-30,len*.7,x+10,len);ctx.stroke()}ctx.globalAlpha=1;
  for(let i=0;i<12;i++){const x=hash(`leafx${i}`)*w,y=hash(`leafy${i}`)*h*.76;circle(x,y,2+hash(`leafr${i}`)*4,p.accent)}
}
function drawStormCoils(s,w,h,p,time){
  for(const side of[-1,1]){
    const x=side<0?w*.13:w*.87;
    for(let i=0;i<3;i++){const y=h*(.23+i*.25),r=18+i*3;line(x,y+50,x,y-45,p.edge,5,.28);for(let ring=0;ring<4;ring++){ctx.strokeStyle=p.edge;ctx.globalAlpha=.28+ring*.08;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y-ring*12,r+ring*7,7,0,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1;glow(x,y-40,36,p.accent,.2)}
  }
  if(!reduced){for(let i=0;i<4;i++){const y=h*(.2+i*.19),phase=Math.sin(time*.005+i);const x1=w*.18,x2=w*.82;line(x1,y,x1+w*.18,y-10*phase,p.edge,1.5,.3);line(x1+w*.18,y-10*phase,x1+w*.36,y+14*phase,'#fff',1.3,.35);line(x1+w*.36,y+14*phase,x2,y,p.edge,1.5,.3)}}
}
function gear(x,y,r,teeth,p,rotation){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle=p.metal;ctx.strokeStyle=p.edge;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<teeth*2;i++){const a=i*Math.PI/teeth,rr=i%2?r:r*.82,px=Math.cos(a)*rr,py=Math.sin(a)*rr;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();circle(0,0,r*.45,p.metal2,p.edge,2);circle(0,0,r*.12,p.accent);ctx.restore()}
function drawClockworkGears(s,w,h,p,time){
  const rot=reduced?0:time*.00025;gear(w*.14,h*.29,58,12,p,rot);gear(w*.87,h*.45,76,14,p,-rot*.75);gear(w*.18,h*.73,40,10,p,-rot*1.2);gear(w*.82,h*.78,42,10,p,rot*1.1);
  line(w*.5,0,w*.5,h*.25,p.edge,4,.2);const py=h*.25+Math.sin(reduced?0:time*.0012)*h*.045;circle(w*.5,py,16,p.metal,p.edge,2);line(w*.5,0,w*.5,py,p.edge,3,.35);
}
function drawVoidFractures(s,w,h,p,time){
  for(let i=0;i<8;i++){
    const cx=hash(`voidx${i}`)*w,cy=hash(`voidy${i}`)*h*.8,r=24+hash(`voidr${i}`)*65,spin=(reduced?0:time*.00012)*(i%2?1:-1);ctx.save();ctx.translate(cx,cy);ctx.rotate(spin);ctx.globalAlpha=.14+.12*hash(`voida${i}`);polygon([[-r,-r*.2],[-r*.2,-r],[r*.75,-r*.45],[r*.45,r*.6],[-r*.45,r*.8]],p.metal,p.edge,1);ctx.restore();ctx.globalAlpha=1;
  }
  const ringX=w*.5,ringY=h*.2;ctx.strokeStyle=p.edge;ctx.lineWidth=2;ctx.globalAlpha=.25;ctx.beginPath();ctx.ellipse(ringX,ringY,w*.18,h*.045,Math.sin(time*.0002)*.3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;glow(ringX,ringY,w*.2,p.accent,.08);
  for(let i=0;i<11;i++){const x=w*.5+(hash(`fractx${i}`)-.5)*w*.65,y=h*.06+hash(`fracty${i}`)*h*.74;line(x,y,x+(hash(`fractdx${i}`)-.5)*90,y+(hash(`fractdy${i}`)-.5)*70,p.edge,1,.22)}
}
function drawThemeArchitecture(s,w,h,p,time){
  if(s.theme==='ruins')drawRuinsGrowth(s,w,h,p,time);
  else if(s.theme==='storm')drawStormCoils(s,w,h,p,time);
  else if(s.theme==='clockwork')drawClockworkGears(s,w,h,p,time);
  else if(s.theme==='void')drawVoidFractures(s,w,h,p,time);
  else drawFoundryMachinery(s,w,h,p,time);
}
function drawMilestoneStructure(s,w,h,p,time){
  if(!milestoneStrength(s.floor))return;
  const pulse=reduced?1:.86+.14*Math.sin(time*.003),cx=w*.5,cy=h*.2,r=Math.min(w,h)*.12;
  glow(cx,cy,r*2.4,p.edge,.18*pulse);ctx.strokeStyle=p.edge;ctx.globalAlpha=.55;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  line(cx-r,cy,cx-r,h,p.edge,8,.25);line(cx+r,cy,cx+r,h,p.edge,8,.25);line(cx,0,cx,h,p.edge,2,.12);
  for(let i=0;i<7;i++){const x=cx+(i-3)*r*.22;glow(x,cy,8,p.edge,.4)}
}

function drawPlatform(t,pf,p){
  const x=t.x(pf.x),y=t.y(pf.y+pf.height),ww=pf.width/1000*t.scale,hh=Math.max(5,pf.height/1000*t.scale),depth=Math.max(8,16*t.scale),slant=depth*.7;
  const top=pf.kind==='moving'?p.accent:p.edge,front=pf.kind==='moving'?p.metal:p.metal2;
  polygon([[x,y],[x+ww,y],[x+ww-slant,y-depth],[x+slant,y-depth]],top,null);polygon([[x,y],[x+ww,y],[x+ww,y+hh],[x,y+hh]],front,p.edge,.7);polygon([[x+ww,y],[x+ww-slant,y-depth],[x+ww-slant,y-depth+hh],[x+ww,y+hh]],'#08090c',null);
  ctx.globalAlpha=.22;for(let gx=x+18;gx<x+ww-10;gx+=34)line(gx,y+2,gx-8,y-depth+2,p.edge,1,.5);ctx.globalAlpha=1;
  if(pf.kind==='moving'){glow(x+ww*.5,y-depth*.5,Math.min(55,ww*.35),p.accent,.18);for(let i=0;i<3;i++)glow(x+ww*(.25+i*.25),y+hh*.45,6,p.edge,.65)}
}
function drawHazard(t,hz,p,time){
  const x=t.x(hz.x),y=t.y(hz.y+hz.height),ww=hz.width/1000*t.scale,hh=Math.max(8,hz.height/1000*t.scale),active=hz.active,hot=active?p.accent:'#50515b';ctx.save();ctx.globalAlpha=active?1:.34;
  if(hz.kind==='spikes'){const n=Math.max(3,Math.floor(ww/12));for(let i=0;i<n;i++)polygon([[x+i*ww/n,y],[x+(i+.5)*ww/n,y-hh*1.7],[x+(i+1)*ww/n,y]],hot,'#1a1110',.7)}
  else if(hz.kind==='heat'){const g=ctx.createLinearGradient(x,y-hh*2,x,y);g.addColorStop(0,'rgba(255,188,84,0)');g.addColorStop(1,hot);ctx.fillStyle=g;ctx.fillRect(x,y-hh*2,ww,hh*2);for(let i=0;i<5;i++){const px=x+ww*hash(`${hz.id}${i}`),py=y-hh*(1+Math.sin(time*.01+i)*.6);glow(px,py,8,hot,.45)}}
  else if(hz.kind==='crusher'){ctx.fillStyle=p.metal;ctx.fillRect(x,y-hh*.4,ww,hh*.4);for(let i=0;i<6;i++){const tx=x+i*ww/5;line(tx,y-hh*.4,tx,y-hh*2.2,p.edge,2,.6)}polygon([[x,y-hh*.4],[x+ww,y-hh*.4],[x+ww*.86,y-hh*1.1],[x+ww*.14,y-hh*1.1]],hot,p.edge,1)}
  else if(hz.kind==='lightning'){line(x+ww*.1,y-hh,x+ww*.5,y-hh*3,hot,4,.7);line(x+ww*.5,y-hh*3,x+ww*.72,y-hh*1.8,'#fff',2,.8);line(x+ww*.72,y-hh*1.8,x+ww*.9,y-hh,hot,4,.7);glow(x+ww*.5,y-hh*2.1,30,hot,.35)}
  else{ctx.strokeStyle=hot;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x+ww*.5,y-hh*.7,ww*.48,hh*.95,0,0,Math.PI*2);ctx.stroke();glow(x+ww*.5,y-hh*.7,ww*.55,hot,.24)}
  ctx.restore();
}
function drawPickup(t,item,p,time){const x=t.x(item.x),y=t.y(item.y),r=6+3*Math.sin(time*.008+hash(item.id)*6);glow(x,y,22,item.kind==='health'?'#6ef5ae':item.kind==='stamina'?'#5fe9ff':p.accent,.28);ctx.save();ctx.translate(x,y);ctx.rotate(time*.001+hash(item.id)*5);const c=item.kind==='health'?'#79ffc0':item.kind==='stamina'?'#7deeff':p.edge;polygon([[0,-r],[r*.8,0],[0,r],[-r*.8,0]],c,'#fff',.8);ctx.restore()}
function drawProjectile(t,item,p){const x=t.x(item.x),y=t.y(item.y),c=item.owner==='player'?'#69eaff':'#ff5d72';glow(x,y,18,c,.5);line(x-item.vx/2600,y+item.vy/2600,x,y,c,3,.7);circle(x,y,2.6,'#fff')}

function drawGuardian(t,e,p,time){
  const x=t.x(e.x),y=t.y(e.y),rw=Math.max(19,e.halfWidth/1000*t.scale*1.55),rh=Math.max(27,e.halfHeight/1000*t.scale*1.55),pulse=reduced?1:.9+.1*Math.sin(time*.008);
  ctx.save();ctx.translate(x,y);glow(0,0,rh*4.3,p.accent,.3);glow(0,0,rh*2.3,'#fff',.07);
  polygon([[-rw*2,rh*.6],[-rw*2.55,-rh*.28],[-rw*1.35,-rh*1.25],[0,-rh*1.85],[rw*1.35,-rh*1.25],[rw*2.55,-rh*.28],[rw*2,rh*.6],[rw*.9,rh*1.35],[-rw*.9,rh*1.35]],p.metal2,p.edge,2);
  polygon([[-rw*.9,-rh*.45],[0,-rh*1.18],[rw*.9,-rh*.45],[rw*.66,rh*.52],[0,rh*.88],[-rw*.66,rh*.52]],p.accent,p.edge,2);
  for(const side of[-1,1]){line(side*rw*.95,-rh*.12,side*rw*2.45,rh*.55,p.edge,6,.9);circle(side*rw*2.48,rh*.58,7,p.accent,p.edge,1);glow(side*rw*2.48,rh*.58,15,p.accent,.5)}
  polygon([[-rw*.45,-rh*1.68],[0,-rh*2.35],[rw*.45,-rh*1.68],[rw*.15,-rh*1.45],[-rw*.15,-rh*1.45]],p.edge,null);glow(0,-rh*.58,11*pulse,'#fff',.7);
  if(e.telegraph){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.globalAlpha=.75+.2*pulse;ctx.beginPath();ctx.arc(0,0,rh*2.3,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,rh*3.15,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  const hp=clamp(e.health/Math.max(1,e.maxHealth),0,1),barW=rw*4.6;ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(-barW/2,-rh*2.8,barW,6);ctx.fillStyle=p.edge;ctx.fillRect(-barW/2,-rh*2.8,barW*hp,6);ctx.strokeStyle='rgba(255,255,255,.4)';ctx.strokeRect(-barW/2,-rh*2.8,barW,6);ctx.restore();
  return{x,y,radius:rh*3.3};
}
function drawEnemy(t,e,p,time){
  if(!e.active)return null;
  if(e.kind==='guardian')return drawGuardian(t,e,p,time);
  const x=t.x(e.x),y=t.y(e.y),rw=Math.max(9,e.halfWidth/1000*t.scale),rh=Math.max(12,e.halfHeight/1000*t.scale),bob=reduced?0:Math.sin(time*.006+hash(e.id)*5)*2;ctx.save();ctx.translate(x,y+bob);const c=e.kind==='shooter'?'#d66bff':'#ff6d7f';glow(0,0,rh*1.7,c,.18);polygon([[-rw*.8,rh],[-rw,-rh*.2],[-rw*.45,-rh],[rw*.45,-rh],[rw,-rh*.2],[rw*.8,rh]],p.metal,p.edge,1);polygon([[-rw*.55,-rh*.2],[0,-rh*.65],[rw*.55,-rh*.2],[rw*.35,rh*.42],[-rw*.35,rh*.42]],c,null);if(e.kind==='shooter'){line(rw*.6,-rh*.1,rw*1.55,-rh*.1,c,4,.9);glow(rw*1.55,-rh*.1,8,c,.45)}if(e.telegraph){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,0,Math.max(rw,rh)*1.8,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}ctx.restore();return{x,y,radius:rh*1.8};
}

function drawClimber(t,s,p,time){
  if(!visual)return null;
  visual.x=lerp(visual.x,s.player.x,reduced?.35:.22);visual.y=lerp(visual.y,s.player.y,reduced?.35:.22);visual.vx=lerp(visual.vx,s.player.vx,.2);visual.vy=lerp(visual.vy,s.player.vy,.2);
  const x=t.x(visual.x),y=t.y(visual.y),rw=Math.max(10.5,s.player.halfWidth/1000*t.scale*1.15),rh=Math.max(17,s.player.halfHeight/1000*t.scale*1.15),speed=Math.abs(visual.vx),grounded=s.player.state==='grounded',air=!grounded;
  const sprint=speed>7500,exhausted=s.player.stamina<=14,falling=air&&visual.vy<-1200,rising=air&&visual.vy>1200,run=air?0:Math.sin(time*(.012+speed/1200000))*clamp(speed/5000,0,1),f=s.player.facing||1,lean=clamp(visual.vx/16000,-.3,.3);
  const squash=impactPulse>.02?1-impactPulse*.18:1,stretch=rising?1.06:falling?.96:1;
  ctx.save();ctx.translate(x,y);ctx.scale(f/squash,stretch*squash);ctx.rotate(lean*.18+(falling?.08:rising?-.05:0));
  if(s.player.shieldCharges>0||shieldPulse>.05){ctx.strokeStyle='#6be9ff';ctx.globalAlpha=.3+.18*shieldPulse;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,rw*2.35,rh*1.95,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
  glow(0,0,rh*2.5,hitPulse>.05?'#ff5c74':p.ambient,.15+.12*hitPulse);
  const hipY=rh*.28,shoulderY=-rh*.34,headY=-rh*.88,armSwing=run*rw*(sprint?1.25:1),legSwing=run*rw*(sprint?1.15:1);
  const legColor=exhausted?'#b79f92':p.edge,armColor=exhausted?'#b79f92':p.edge;
  line(-rw*.18,hipY,-rw*.36+legSwing*.28,rh*1.03,legColor,Math.max(3.5,rw*.34),1);line(rw*.18,hipY,rw*.48-legSwing*.28,rh*1.03,legColor,Math.max(3.5,rw*.34),1);
  line(-rw*.25,shoulderY,-rw*.72-armSwing*.3,rh*.16,armColor,Math.max(3.2,rw*.27),1);line(rw*.25,shoulderY,rw*.82+armSwing*.3,rh*.04,armColor,Math.max(3.2,rw*.27),1);
  ctx.fillStyle='#111820';ctx.beginPath();ctx.moveTo(-rw*.82,shoulderY);ctx.quadraticCurveTo(-rw*.58,hipY,rw*.55,hipY*1.58);ctx.lineTo(rw*.62,shoulderY);ctx.closePath();ctx.fill();
  polygon([[-rw*.56,shoulderY],[-rw*.3,-rh*.63],[rw*.3,-rh*.63],[rw*.62,shoulderY],[rw*.38,hipY],[-rw*.38,hipY]],'#293746',p.edge,1.2);
  polygon([[-rw*.34,-rh*.5],[rw*.32,-rh*.5],[rw*.44,-rh*.04],[-rw*.4,-rh*.01]],p.accent,null);
  polygon([[-rw*.58,-rh*.26],[-rw*.84,-rh*.06],[-rw*.7,rh*.3],[-rw*.36,rh*.18]],'#1b242f',p.edge,.8);
  ctx.fillStyle='#d8b28d';circle(0,headY,rw*.5,'#d8b28d');ctx.fillStyle='#10161e';ctx.beginPath();ctx.arc(-rw*.05,headY-rw*.11,rw*.54,Math.PI,Math.PI*2);ctx.fill();
  ctx.strokeStyle=p.edge;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,headY,rw*.56,Math.PI*.1,Math.PI*.9);ctx.stroke();polygon([[rw*.32,headY-rw*.03],[rw*.76,headY+rw*.12],[rw*.32,headY+rw*.28]],p.edge,null);
  if(rising){line(-rw*.2,hipY,-rw*.78,rh*.66,p.edge,Math.max(3.5,rw*.34),1);line(rw*.15,hipY,rw*.82,rh*.38,p.edge,Math.max(3.5,rw*.34),1)}
  if(falling){line(-rw*.26,shoulderY,-rw*1.05,-rh*.05,p.edge,Math.max(3.2,rw*.27),1);line(rw*.25,shoulderY,rw*1.08,-rh*.08,p.edge,Math.max(3.2,rw*.27),1)}
  if(exhausted&&!air){ctx.rotate(.08);line(-rw*.25,shoulderY,-rw*.5,rh*.32,p.edge,Math.max(3.2,rw*.27),1);line(rw*.25,shoulderY,rw*.52,rh*.32,p.edge,Math.max(3.2,rw*.27),1)}
  ctx.restore();impactPulse*=.88;hitPulse*=.9;shieldPulse*=.88;return{x,y,radius:rh*1.35};
}

function routeCue(t,s,p){if(!s.platforms.length)return;const above=s.platforms.filter(v=>v.y>s.player.y+8000).sort((a,b)=>a.y-b.y)[0];if(!above)return;const sx=t.x(s.player.x),sy=t.y(s.player.y),tx=t.x(above.x+above.width/2),ty=t.y(above.y+above.height);ctx.save();ctx.setLineDash([5,9]);ctx.strokeStyle=p.edge;ctx.globalAlpha=.14+.18*(s.intent.confidencePermille/1000);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+tx)/2,Math.min(sy,ty)-45,tx,ty);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.restore()}
function burst(x,y,color,count=12,kind='dust'){while(particles.length+count>MAX_PARTICLES)particles.shift();for(let i=0;i<count;i++){const a=Math.PI*2*hash(`${performance.now()}:${i}:${kind}`),sp=18+hash(`sp${i}${kind}`)*70;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(kind==='milestone'?55:10),life:1,size:1.5+hash(`sz${i}`)*4,color})}}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt*.7;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=44*dt;if(p.life<=0){particles.splice(i,1);continue}ctx.globalAlpha=p.life*.65;circle(p.x,p.y,p.size*p.life,p.color)}ctx.globalAlpha=1}
function drawForeground(s,w,h,p,time){ctx.globalAlpha=.48;for(let i=0;i<5;i++){const side=i%2?1:-1,x=side<0?w*(.02+i*.025):w*(.98-i*.025),swing=reduced?0:Math.sin(time*.0015+i)*18;ctx.strokeStyle='#08090b';ctx.lineWidth=10-i;ctx.beginPath();ctx.moveTo(x,-20);ctx.bezierCurveTo(x+swing,h*.3,x-swing,h*.65,x+swing,h+30);ctx.stroke();ctx.strokeStyle=p.edge;ctx.globalAlpha=.07;ctx.lineWidth=1;ctx.stroke()}ctx.globalAlpha=1;const vg=ctx.createRadialGradient(w*.5,h*.48,h*.15,w*.5,h*.48,h*.78);vg.addColorStop(.5,'transparent');vg.addColorStop(1,'rgba(0,0,0,.58)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h)}

function percentile95(values){if(!values.length)return 0;const copy=[...values].sort((a,b)=>a-b);return copy[Math.min(copy.length-1,Math.floor(copy.length*.95))]}
function publishDiagnostics(s,t,w,h,frameMs,playerAnchor,guardianAnchors){
  frameSamples.push(frameMs);if(frameSamples.length>MAX_FRAME_SAMPLES)frameSamples.shift();framesSinceMetric++;if(framesSinceMetric>=30){framesSinceMetric=0;lastFrameMsP95=percentile95(frameSamples)}
  let platformsVisible=0,hazardsVisible=0,guardiansVisible=0;
  for(const pf of s.platforms){if(isVisible(t.x(pf.x+pf.width/2),t.y(pf.y),w,h))platformsVisible++}
  for(const hz of s.hazards){if(hz.active&&isVisible(t.x(hz.x+hz.width/2),t.y(hz.y),w,h))hazardsVisible++}
  for(const a of guardianAnchors)if(isVisible(a.x,a.y,w,h,a.radius))guardiansVisible++;
  const playerVisible=!!playerAnchor&&isVisible(playerAnchor.x,playerAnchor.y,w,h,playerAnchor.radius);
  window.__TOWER_RENDER_DIAGNOSTICS__={floor:s.floor,theme:s.theme,playerVisible,platformsVisible,hazardsVisible,guardiansVisible,frameMsP95:lastFrameMsP95,particles:particles.length,sampleCount:frameSamples.length};
}

function draw(data,time,frameMs){
  fit();const w=canvas.clientWidth,h=canvas.clientHeight,s=data?.snapshot,p=palette(s?.theme);drawSky(s||{theme:'foundry'},w,h,p,time);if(!s)return;
  drawTowerDepth(s,w,h,p,time);drawThemeArchitecture(s,w,h,p,time);drawMilestoneStructure(s,w,h,p,time);
  const t=transform(s,w,h,data.camera);routeCue(t,s,p);
  for(const pf of s.platforms)drawPlatform(t,pf,p);for(const hz of s.hazards)drawHazard(t,hz,p,time);for(const item of s.pickups)drawPickup(t,item,p,time);
  const guardianAnchors=[];for(const e of s.enemies){const a=drawEnemy(t,e,p,time);if(a&&e.kind==='guardian')guardianAnchors.push(a)}for(const projectile of s.projectiles)drawProjectile(t,projectile,p);
  const playerAnchor=drawClimber(t,s,p,time);updateParticles(1/60);drawForeground(s,w,h,p,time);
  if(data.scene==='guardian'){ctx.globalAlpha=.075;ctx.fillStyle=p.accent;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1}
  if(data.scene==='danger'&&!reduced){const a=.055+.03*Math.sin(time*.02);ctx.fillStyle=`rgba(255,30,65,${a})`;ctx.fillRect(0,0,w,h)}
  if(milestoneStrength(s.floor)){ctx.textAlign='center';ctx.fillStyle=p.edge;ctx.font='800 13px system-ui';ctx.globalAlpha=.78;ctx.fillText(`ASCENT MILESTONE // FLOOR ${s.floor}`,w/2,38);ctx.globalAlpha=1}
  publishDiagnostics(s,t,w,h,frameMs,playerAnchor,guardianAnchors);
}

function ensureAudio(){if(muted||audioCtx)return;try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.045;master.connect(audioCtx.destination)}catch{audioCtx=null}}
function tone(freq,duration,type='sine',gain=.7,delay=0){if(!audioCtx||audioCtx.state!=='running'||!master)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),start=audioCtx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(gain,start+.015);g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g);g.connect(master);o.start(start);o.stop(start+duration+.03)}
function playFrameAudio(audio){if(muted||!audio?.voices?.length)return;ensureAudio();const v=audio.voices[0];if(!v||v.id===lastAudioId)return;lastAudioId=v.id;const map={impact:[90,.18,'sawtooth'],warning:[440,.12,'square'],'floor-rise':[520,.16,'triangle'],'enemy-break':[180,.16,'sawtooth'],upgrade:[660,.2,'triangle'],'fall-end':[70,.45,'sine'],replan:[260,.13,'triangle'],'safe-tone':[220,.3,'sine']},spec=map[v.cue]||[300,.12,'sine'];tone(spec[0],spec[1],spec[2],.45);if(v.cue==='floor-rise'||v.cue==='upgrade')tone(spec[0]*1.5,spec[1],spec[2],.3,.08)}
addEventListener('pointerdown',()=>{ensureAudio();audioCtx?.resume?.()},{once:true});

async function poll(){
  if(polling||closed)return;polling=true;
  try{const response=await fetch(`/tower/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${reduced?1:0}&cleanFeed=${clean?1:0}&muted=${muted?1:0}`,{cache:'no-store'});if(!response.ok)throw new Error(String(response.status));const data=await response.json();current=data;if(data.snapshot?.publicChecksum!==lastChecksum){lastChecksum=data.snapshot?.publicChecksum||'';update(data)}$('provider-state').textContent='AUTONOMOUS CORE ONLINE'}
  catch(error){$('provider-state').textContent='VIEW RECOVERING — AI CONTINUES';console.warn('tower state unavailable',String(error))}
  finally{polling=false;if(!closed)setTimeout(poll,110)}
}
let lastFrame=performance.now();function render(now){const frameMs=Math.min(100,Math.max(0,now-lastFrame));lastFrame=now;draw(current,now,frameMs);requestAnimationFrame(render)}
addEventListener('resize',fit);addEventListener('beforeunload',()=>closed=true);fit();poll();requestAnimationFrame(render);
})();
