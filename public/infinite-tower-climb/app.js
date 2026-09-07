'use strict';

// Presentation consumes public snapshots. These functions never advance physics.
const TowerView = (() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  function transform(s, w, h, camera) {
    const zoom = Number.isFinite(camera?.zoom) ? clamp(camera.zoom, .82, 1.35) : 1;
    const scale = Math.min(w / (s.worldWidth / 1000 + 60), h / (s.chunkHeight / 1000 * .74)) / zoom;
    // Both snapshot geometry and the camera are ABSOLUTE world coordinates.
    const cy = (Number.isFinite(camera?.centerY) ? camera.centerY : s.player.y) / 1000;
    return {x: v => w / 2 + (v / 1000 - s.worldWidth / 2000) * scale,
      y: v => h * .64 - (v / 1000 - cy) * scale, scale};
  }
  function interpolateFrame(previous, current, alpha, reducedMotion = false) {
    const a = previous?.snapshot, b = current?.snapshot;
    if (!a || !b || reducedMotion || a.runToken !== b.runToken || a.floor !== b.floor ||
        b.tick <= a.tick || b.tick - a.tick > 8 ||
        ['result', 'intermission', 'recovery', 'upgrade'].includes(current.scene) ||
        ['result', 'intermission', 'recovery', 'upgrade'].includes(previous.scene) ||
        Math.hypot(b.player.x - a.player.x, b.player.y - a.player.y) > b.worldWidth * .5) return current;
    const t = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
    const entity = (old, next) => old ? {...next, x: mix(old.x, next.x, t), y: mix(old.y, next.y, t)} : next;
    const collection = key => {
      const old = new Map((a[key] || []).map(item => [item.id, item]));
      return (b[key] || []).map(item => entity(old.get(item.id), item));
    };
    return {...current, camera: {...current.camera,
      centerY: mix(previous.camera?.centerY ?? a.player.y, current.camera?.centerY ?? b.player.y, t)},
      snapshot: {...b, player: entity(a.player, b.player), platforms: collection('platforms'),
        enemies: collection('enemies'), projectiles: collection('projectiles')}};
  }
  return {transform, interpolateFrame};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = TowerView;

if (typeof document !== 'undefined') (() => {
  const canvas = document.getElementById('tower-canvas');
  const ctx = canvas.getContext('2d', {alpha: false});
  const body = document.body, params = new URLSearchParams(location.search);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = params.get('highContrast') === '1', clean = params.get('cleanFeed') === '1';
  let reduced = params.get('reducedMotion') === '1' || preference.matches;
  let current = null, previous = null, receivedAt = 0, blendMs = 110, lastAcceptedAt = 0;
  let stopped = false, timer = 0, raf = 0, activeRequest = null, effects = [];
  let width = 1, height = 1, ratio = 1;
  const $ = id => document.getElementById(id);
  const text = (id, value) => { const node = document.querySelector(`[data-testid="${id}"]`); if (node) node.textContent = String(value); };
  body.dataset.highContrast = String(contrast); body.dataset.reducedMotion = String(reduced);
  body.classList.toggle('clean-feed', clean);
  const palette = contrast ? {bg:'#000',rail:'#fff',accent:'#00ffff',purple:'#d5b9ff',danger:'#ff728b',gold:'#ffe070'}
    : {bg:'#080b14',rail:'#425174',accent:'#70edff',purple:'#b49aff',danger:'#ff6483',gold:'#ffd178'};

  function fit() {
    const r = canvas.getBoundingClientRect(); ratio = Math.min(2, devicePixelRatio || 1);
    width = Math.max(1, r.width); height = Math.max(1, r.height);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function line(x1,y1,x2,y2,color,width=1) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function box(x,y,w,h,color,r=3) {
    ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,Math.max(.1,w),Math.max(.1,h),Math.max(0,Math.min(r,w/2,h/2)));ctx.fill();
  }
  function label(value,x,y,color,size=10) {
    ctx.fillStyle=color;ctx.font=`600 ${size}px ui-monospace,monospace`;ctx.textAlign='center';ctx.fillText(value,x,y);
  }
  const words = value => String(value || '').replaceAll('-', ' ').replaceAll('_', ' ').toUpperCase();
  function sceneName(scene) { return ({normal:'ASCENDING',danger:'DANGER',upgrade:'BUILD CHOICE',guardian:'GUARDIAN',result:'RUN COMPLETE',intermission:'NEXT RUN',recovery:'RECOVERING'})[scene] || words(scene); }
  function setPercent(id, value) { $(id).style.width = `${Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))}%`; }
  function update(data) {
    const s = data.snapshot;
    window.__TOWER_PUBLIC_STATE__ = s;
    text('floor',s.floor); text('height',`${Math.floor(s.progress.height/1000)}m`);
    text('guardian',s.progress.nextGuardianFloor); text('tick',s.tick);
    text('health',`${s.player.health}/${s.player.maxHealth}`); text('stamina',s.player.stamina);
    text('shields',s.player.shieldCharges); text('score',s.player.score.toLocaleString());
    text('ai-intent',words(s.intent.summary)); text('scene',sceneName(data.scene)); text('run-token',s.runToken.slice(0,8));
    text('progress',`${Math.round(s.progress.floorProgressPermille/10)}%`);
    setPercent('floor-progress',s.progress.floorProgressPermille/10);
    setPercent('health-bar',100*s.player.health/Math.max(1,s.player.maxHealth));
    setPercent('stamina-bar',100*s.player.stamina/Math.max(1,s.player.maxStamina));
    $('theme-name').textContent=`${words(s.theme)} SECTOR`;
    $('intent-mode').textContent=words(s.intent.mode); $('confidence').textContent=`${Math.round(s.intent.confidencePermille/10)}%`;
    $('caption-text').textContent=data.audio?.captions?.at(-1)?.text || s.intent.summary;
    body.classList.toggle('danger',data.scene==='danger'||data.scene==='guardian');
    body.dataset.scene=data.scene;
    $('build-tags').replaceChildren(...(s.buildTags.length?s.buildTags:['BASE KIT']).slice(-6).map(value=>{
      const node=document.createElement('em');node.textContent=words(value);return node;
    }));
    $('choice-card').hidden=data.scene!=='upgrade';
    $('choice-options').replaceChildren(...s.upgradeOffers.map(offer=>{
      const node=document.createElement('span');node.textContent=offer.name;return node;
    }));
    $('result-card').hidden=!['result','intermission'].includes(data.scene);
    $('result-title').textContent=data.scene==='intermission'?'NEXT ASCENT':words(s.result?.reason||'ASCENT ENDED');
    $('result-height').textContent=`${Math.floor(s.progress.height/1000)}m`;
    $('recovery-card').hidden=data.scene!=='recovery';
  }
  function accept(data, now) {
    const s=data?.snapshot;
    if (!s || !Number.isFinite(s.tick) || !s.player || !Array.isArray(s.platforms)) throw new Error('invalid-public-frame');
    const old=current?.snapshot;
    if(old && old.runToken===s.runToken && (s.tick<old.tick || s.revision<old.revision)) return false;
    // Repeated snapshots may carry a NEW scene; update HUD without restarting motion.
    if(!old || old.runToken!==s.runToken || old.tick!==s.tick || old.revision!==s.revision) {
      const contiguous=old && old.runToken===s.runToken && now-lastAcceptedAt<400 && old.floor===s.floor;
      previous=contiguous?current:null;
      blendMs=Math.max(80,Math.min(180,now-lastAcceptedAt||110));receivedAt=now;lastAcceptedAt=now;
      if(!contiguous)effects=[];
      if(contiguous&&!reduced&&data.scene!=='recovery') {
        if(old.player.state!=='standing'&&s.player.state==='standing') effects.push({x:s.player.x,y:s.player.y-s.player.halfHeight,at:now,kind:'land'});
        if(s.player.health<old.player.health) effects.push({x:s.player.x,y:s.player.y,at:now,kind:'hit'});
        effects=effects.slice(-24);
      }
    }
    current=data;update(data);return true;
  }
  function draw(now) {
    const data=TowerView.interpolateFrame(previous,current,(now-receivedAt)/blendMs,reduced);
    const s=data?.snapshot, w=width,h=height;
    const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,contrast?'#000':'#141b30');bg.addColorStop(1,palette.bg);
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    if(!s){label('CONNECTING TO THE CLIMBER',w/2,h/2,palette.accent,13);return;}
    const t=TowerView.transform(s,w,h,data.camera), left=t.x(0),right=t.x(s.worldWidth);
    // World-anchored lift shaft. Background never suggests collidable geometry.
    ctx.globalAlpha=contrast ? .18 : .32;
    const spacing=65,offset=((data.camera?.centerY??s.player.y)/1000*t.scale*.18)%spacing;
    for(let y=-spacing+offset;y<h+spacing;y+=spacing){line(left-18,y,right+18,y,palette.rail);}
    ctx.globalAlpha=1;
    line(left-12,0,left-12,h,palette.rail,2);line(right+12,0,right+12,h,palette.rail,2);
    line(left-6,0,left-6,h,palette.accent,.7);line(right+6,0,right+6,h,palette.purple,.7);
    for(const p of s.platforms){
      const x=t.x(p.x),y=t.y(p.y+p.height),pw=p.width/1000*t.scale,ph=Math.max(4,p.height/1000*t.scale);
      if(y<-50||y>h+50)continue;
      const color=p.kind==='moving'?palette.purple:p.kind==='oneway'?palette.accent:palette.rail;
      box(x,y,pw,ph,contrast?'#222':'#25324c',2);line(x,y,x+pw,y,color,3);
      if(p.kind==='oneway'){ctx.setLineDash([4,5]);line(x,y+ph,x+pw,y+ph,color,1);ctx.setLineDash([]);}
      if(p.kind==='moving')label('‹  ›',x+pw/2,y+ph+13,palette.purple,13);
      else{for(let n=8;n<pw;n+=28)line(x+n,y+3,x+n+4,y+ph-1,palette.rail,1);}
    }
    for(const z of s.hazards){
      const x=t.x(z.x),y=t.y(z.y+z.height),zw=z.width/1000*t.scale,zh=Math.max(5,z.height/1000*t.scale);
      ctx.globalAlpha=z.active?1:.38;ctx.fillStyle=palette.danger;
      if(z.kind==='spikes'){
        const count=Math.max(2,Math.ceil(zw/10));ctx.beginPath();ctx.moveTo(x,y+zh);
        for(let i=0;i<count;i++){ctx.lineTo(x+(i+.5)*zw/count,y);ctx.lineTo(x+(i+1)*zw/count,y+zh);}ctx.closePath();ctx.fill();
      }else{
        box(x,y,zw,zh,z.active?palette.danger:'#503747',1);
        for(let n=3;n<zw-3;n+=8)line(x+n,y+1,x+Math.min(zw-2,n+4),y+zh-1,'#150e1b',2);
      }
      ctx.globalAlpha=1;
    }
    for(const item of s.pickups){
      const x=t.x(item.x),y=t.y(item.y),r=Math.max(5,Math.min(9,6*t.scale));
      const color=item.kind==='health'?'#87ffc0':item.kind==='stamina'?palette.accent:palette.gold;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);box(-r,-r,2*r,2*r,color,2);ctx.restore();
      if(item.kind==='health'){line(x-4,y,x+4,y,'#07121a',2);line(x,y-4,x,y+4,'#07121a',2);}
      else if(item.kind==='stamina'){line(x+2,y-4,x-2,y,'#07121a',2);line(x-2,y,x+2,y+4,'#07121a',2);}
      else label('•',x,y+4,'#07121a',13);
    }
    for(const e of s.enemies){
      if(!e.active)continue;
      const x=t.x(e.x),y=t.y(e.y),rw=e.halfWidth/1000*t.scale,rh=e.halfHeight/1000*t.scale;
      const color=e.kind==='guardian'?palette.gold:e.kind==='shooter'?palette.danger:palette.purple;
      box(x-rw,y-rh,rw*2,rh*2,color,Math.min(rw,6));
      box(x-rw*.72,y-rh*.45,rw*1.44,rh*.42,'#140f21',2);
      line(x-rw*.4,y-rh*.24,x+rw*.4,y-rh*.24,'#fff',2);
      if(e.kind==='guardian'){line(x-rw*.7,y-rh,x-rw*.7,y-rh-7,color,3);line(x+rw*.7,y-rh,x+rw*.7,y-rh-7,color,3);}
      if(e.health<e.maxHealth){box(x-rw,y-rh-7,rw*2,3,'#2c2031',1);box(x-rw,y-rh-7,rw*2*Math.max(0,e.health/e.maxHealth),3,color,1);}
      if(e.telegraph){ctx.strokeStyle=palette.danger;ctx.lineWidth=2;ctx.strokeRect(x-rw-5,y-rh-5,rw*2+10,rh*2+10);label('!',x,y-rh-12,'#fff',15);}
    }
    for(const p of s.projectiles){
      const x=t.x(p.x),y=t.y(p.y),color=p.owner==='player'?palette.accent:palette.danger;
      const speed=Math.hypot(p.vx,p.vy)||1,trail=reduced?0:12;
      line(x-p.vx/speed*trail,y+p.vy/speed*trail,x,y,color,3);
      box(x-2.5,y-2.5,5,5,'#fff',2);
    }
    const p=s.player,x=t.x(p.x),y=t.y(p.y),rw=p.halfWidth/1000*t.scale,rh=p.halfHeight/1000*t.scale;
    // A readable armoured climber inside the authoritative collision envelope.
    const stride=reduced||p.state!=='standing'?0:Math.sin(now*.018)*Math.min(2,Math.abs(p.vx)/7000);
    box(x-rw*.84,y+rh*.38,rw*.65,rh*.62-stride,'#526889',2);
    box(x+rw*.19,y+rh*.38+stride,rw*.65,rh*.62-stride,'#526889',2);
    box(x-rw,y-rh*.3,rw*2,rh*1.05,palette.accent,3);
    box(x-rw*.78,y-rh,rw*1.56,rh*.85,contrast?'#fff':'#dae8fb',4);
    box(x-rw*.61,y-rh*.79,rw*1.22,rh*.27,'#192438',2);
    box(x+(p.facing>0?rw*.15:-rw*.45),y-rh*.75,rw*.3,rh*.16,palette.accent,1);
    line(x-rw*.42,y+rh*.12,x+rw*.42,y+rh*.12,'#17334a',2);
    if(p.shieldCharges>0){ctx.strokeStyle=palette.accent;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,rw+7,rh+5,0,0,Math.PI*2);ctx.stroke();}
    effects=effects.filter(e=>now-e.at<500);
    if(!reduced)for(const e of effects){
      const age=(now-e.at)/500;ctx.globalAlpha=(1-age)*.65;ctx.strokeStyle=e.kind==='hit'?palette.danger:palette.accent;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(t.x(e.x),t.y(e.y),8+age*24,e.kind==='land'?3+age*5:8+age*24,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(!clean){label(`FLOOR ${s.floor} · ${words(s.theme)}`,w/2,28,'#c7d4ed',11);}
  }
  async function poll() {
    if(stopped||activeRequest)return;
    const controller=new AbortController();activeRequest=controller;
    const timeout=setTimeout(()=>controller.abort(),2500);
    try{
      const response=await fetch(`/tower/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${reduced?1:0}&cleanFeed=${clean?1:0}&muted=${params.get('muted')==='1'?1:0}`,{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('state-unavailable');
      const data=await response.json();if(stopped)return;
      $('provider-state').textContent=accept(data,performance.now())?'PUBLIC FEED CONNECTED':'WAITING FOR CURRENT VIEW';
    }catch{
      if(!stopped){previous=null;effects=[];$('provider-state').textContent='VIEW RECONNECTING · LAST CONFIRMED FRAME';}
    }finally{
      clearTimeout(timeout);activeRequest=null;if(!stopped)timer=setTimeout(poll,110);
    }
  }
  function render(now){if(stopped)return;draw(now);raf=requestAnimationFrame(render);}
  function stop(){stopped=true;clearTimeout(timer);cancelAnimationFrame(raf);activeRequest?.abort();}
  function start(){if(!stopped)return;stopped=false;previous=null;effects=[];fit();poll();raf=requestAnimationFrame(render);}
  addEventListener('pagehide',stop);addEventListener('pageshow',start);
  addEventListener('resize',fit,{passive:true});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(canvas);
  document.addEventListener('visibilitychange',()=>{previous=null;effects=[];});
  preference.addEventListener('change',event=>{reduced=params.get('reducedMotion')==='1'||event.matches;body.dataset.reducedMotion=String(reduced);previous=null;effects=[];});
  fit();poll();raf=requestAnimationFrame(render);
})();
