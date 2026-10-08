import * as THREE from '/dungeon/vendor/three.module.js';

/**
 * 2D spectator annotations projected from real Three.js world positions.
 * No damage is invented: damage/healing flyups derive from successive
 * authoritative HP snapshots, not cosmetic random numbers.
 */
const names={vanguard:'ASHEN VANGUARD',ranger:'WILDSHADOW',mystic:'STARWEAVER',revenant:'REVENANT',cultist:'CULTIST',warden:'THE ETERNAL WARDEN'};
const colors={vanguard:'#69c9ff',ranger:'#79ffc4',mystic:'#bd95ff',revenant:'#ff946d',cultist:'#ff77a2',warden:'#ffcf75'};
const PI2=Math.PI*2;
export function createCombatOverlay(canvas){
 const ctx=canvas.getContext('2d',{alpha:true}),hpBefore=new Map(),floaters=[];
 let lastScene='',width=0,height=0,ratio=1,observedUnits=0;
 function setSize(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  const d=Math.min(devicePixelRatio||1,1.7);
  if(w!==width||h!==height||d!==ratio){width=w;height=h;ratio=d;canvas.width=Math.max(1,Math.floor(w*d));canvas.height=Math.max(1,Math.floor(h*d))}
  ctx.setTransform(ratio,0,0,ratio,0,0);
 }
 function record(s,now){
  const scene=s.run+':'+s.floor;if(scene!==lastScene){hpBefore.clear();floaters.length=0;lastScene=scene}
  const keys=new Set();
  for(const u of s.units){const key=scene+':'+u.id;keys.add(key);
   const hp=hpBefore.get(key);
   if(hp!==undefined&&u.hp!==hp){
    floaters.push({id:u.id,text:(hp-u.hp)>0?'-'+(hp-u.hp):'+'+(u.hp-hp),heal:u.hp>hp,start:now,kind:u.kind});
    if(floaters.length>35)floaters.shift();
   }hpBefore.set(key,u.hp)
  }
  for(const k of hpBefore.keys())if(!keys.has(k))hpBefore.delete(k);
 }
 function point(camera,actor,y=2.0){
  const position=new THREE.Vector3();actor.root.getWorldPosition(position);position.y+=y*(actor.root.scale?.y||1);
  position.project(camera);
  if(position.z>1||position.z<-1)return null;
  const x=(position.x*.5+.5)*width,sy=(-position.y*.5+.5)*height;
  if(x< -100||x>width+100||sy< -100||sy>height+100)return null;
  return {x,y:sy};
 }
 function rounded(x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 }
 function label(u,p,time,focused){
  const boss=u.kind==='warden',hero=u.faction==='party',w=boss?145:hero?110:76,barWidth=w-13;
  const cx=p.x,ty=p.y,top=Math.max(70,ty-(boss?9:0));
  ctx.save();
  ctx.globalAlpha=hero||focused?1:.82;
  const bg=ctx.createLinearGradient(cx-w/2,top,cx+w/2,top);
  bg.addColorStop(0,'#0a152cea');bg.addColorStop(1,boss?'#501f35d9':'#1b2244dd');
  ctx.shadowBlur=hero?13:boss?18:6;ctx.shadowColor=colors[u.kind]+'99';
  ctx.fillStyle=bg;rounded(cx-w/2,top-10,w,27,6);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle=colors[u.kind];rounded(cx-w/2,top-10,3,27,1.5);ctx.fill();
  ctx.font=(boss?'800 10px':hero?'800 9px':'700 8px')+' system-ui, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4f9ff';
  ctx.fillText(names[u.kind]||u.kind.toUpperCase(),cx,top-1,w-14);
  ctx.fillStyle='#29354c';rounded(cx-barWidth/2,top+8,barWidth,4,2);ctx.fill();
  const pct=Math.max(0,Math.min(1,u.hp/u.maxHp));
  ctx.fillStyle=colors[u.kind];rounded(cx-barWidth/2,top+8,Math.max(0,barWidth*pct),4,2);ctx.fill();
  if(boss&&u.action==='cast'){
   ctx.strokeStyle='#ff8768';ctx.lineWidth=1.4;rounded(cx-w/2-3,top-13,w+6,33,8);ctx.stroke();
  }
  ctx.restore();
 }
 function flyup(f,actor,camera,time){
  const p=point(camera,actor,2.3);
  if(!p)return;
  const age=time-f.start,max=.98,progress=Math.min(age/max,1),fade=1-progress;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 15px system-ui,sans-serif';ctx.shadowBlur=9;ctx.shadowColor=f.heal?'#60ffdc':'#fe4977';
  ctx.globalAlpha=fade;
  ctx.fillStyle=f.heal?'#a2ffe8':'#ffe29a';
  ctx.fillText(f.text,p.x+16+Math.sin(progress*3)*5,p.y-12-progress*36);
  ctx.restore();
 }
 function render(s,actors,camera,time){
  setSize();ctx.clearRect(0,0,width,height);
  if(!s||!width||!height)return;
  let drawCount=0;
  const living=s.units.filter(u=>u.hp>0),heroes=living.filter(u=>u.faction==='party');
  for(const u of living){
   const a=actors.get(u.id);if(!a||!a.root.visible)continue;
   const range=Math.min(...heroes.map(h=>Math.abs(h.x-u.x)+Math.abs(h.z-u.z)));
   const nearby=u.faction==='party'||range<=6;
   if(!nearby)continue;
   const p=point(camera,a,u.kind==='warden'?3.1:2.1);
   if(!p)continue;
   label(u,p,time,range<=3);
   drawCount++;
  }
  for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];
   if(time-f.start>.98){floaters.splice(i,1);continue;}
   const a=actors.get(f.id);if(a)flyup(f,a,camera,time);
  }
  observedUnits=drawCount;
 }
 return {record,render,metrics:()=>({labels:observedUnits,activeFlyups:floaters.length}),dispose(){hpBefore.clear();floaters.length=0;ctx.clearRect(0,0,canvas.width,canvas.height)}};
}
