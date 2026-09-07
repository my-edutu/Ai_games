'use strict';

// Presentation consumes public snapshots. These functions never advance physics.
const TowerView = (() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const PROFILES = Object.freeze({
    low: Object.freeze({name:'low',pixelBudget:1280*720,maxDpr:1,decorativeObjectBudget:56,maxParticles:10}),
    balanced: Object.freeze({name:'balanced',pixelBudget:1920*1080,maxDpr:1.25,decorativeObjectBudget:104,maxParticles:16}),
    high: Object.freeze({name:'high',pixelBudget:2560*1440,maxDpr:1.6,decorativeObjectBudget:176,maxParticles:22}),
    ultra: Object.freeze({name:'ultra',pixelBudget:3840*2160,maxDpr:2,decorativeObjectBudget:260,maxParticles:24}),
  });
  function qualityProfile(requested='auto', capabilities={}) {
    if (Object.prototype.hasOwnProperty.call(PROFILES, requested)) return {...PROFILES[requested]};
    const memory = Number(capabilities.deviceMemory || 0), cores = Number(capabilities.hardwareConcurrency || 0);
    const chosen = memory && memory <= 4 || cores && cores <= 4 ? 'low' : memory >= 12 && cores >= 8 ? 'high' : 'balanced';
    return {...PROFILES[chosen]};
  }
  function renderRatio(profile, width, height, deviceDpr=1) {
    const pixels = Math.max(1, Number(width) * Number(height));
    const budgetRatio = Math.sqrt(profile.pixelBudget / pixels);
    return Math.max(.5, Math.min(Number(deviceDpr) || 1, profile.maxDpr, budgetRatio));
  }
  function worldLayerPlan(profile) {
    const total = Math.max(12, Math.floor(profile.decorativeObjectBudget));
    const far = Math.max(3, Math.floor(total*.22)), mid = Math.max(3, Math.floor(total*.34));
    const gameplay = Math.max(3, Math.floor(total*.26)), foreground = Math.max(3, total-far-mid-gameplay);
    return [{id:'far',budget:far},{id:'mid',budget:mid},{id:'gameplay',budget:gameplay},{id:'foreground',budget:foreground}];
  }
  function stateRequestPath(options={}) {
    const width = Math.max(320, Math.round(Number(options.width) || 1920));
    const height = Math.max(180, Math.round(Number(options.height) || 1080));
    return `/tower/state?w=${width}&h=${height}&reducedMotion=${options.reducedMotion?1:0}&cleanFeed=${options.cleanFeed?1:0}&muted=${options.muted?1:0}`;
  }
  function audioPolicy(quality='balanced', muted=false) {
    if (muted) return {maxVoices:0,cooldownMs:160,windGain:0};
    const name = Object.prototype.hasOwnProperty.call(PROFILES, quality) ? quality : 'balanced';
    const maxVoices = name==='low'?4:name==='balanced'?5:name==='high'?6:8;
    return {maxVoices,cooldownMs:name==='low'?220:160,windGain:name==='low'?.022:name==='balanced'?.03:name==='high'?.038:.045};
  }
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
  return {qualityProfile,renderRatio,worldLayerPlan,stateRequestPath,audioPolicy,transform,interpolateFrame};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = TowerView;

if (typeof document !== 'undefined') (() => {
  const canvas = document.getElementById('tower-canvas');
  let ctx = canvas.getContext('2d', {alpha: false});
  const body = document.body, params = new URLSearchParams(location.search);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = params.get('highContrast') === '1', clean = params.get('cleanFeed') === '1', muted = params.get('muted') === '1';
  let reduced = params.get('reducedMotion') === '1' || preference.matches;
  const requestedQuality = String(params.get('quality') || 'auto').toLowerCase();
  const capabilities = {deviceMemory:Number(navigator.deviceMemory||0),hardwareConcurrency:Number(navigator.hardwareConcurrency||0)};
  const profile = TowerView.qualityProfile(requestedQuality, capabilities);
  const layers = TowerView.worldLayerPlan(profile);
  const soundPolicy = TowerView.audioPolicy(profile.name, muted);
  let current = null, previous = null, receivedAt = 0, blendMs = 110, lastAcceptedAt = 0;
  let stopped = false, timer = 0, raf = 0, activeRequest = null, effects = [];
  let width = 1, height = 1, ratio = 1, contextRecoveries = 0, contextLost = false;
  const $ = id => document.getElementById(id);
  const text = (id, value) => { const node = document.querySelector(`[data-testid="${id}"]`); if (node) node.textContent = String(value); };
  body.dataset.highContrast = String(contrast); body.dataset.reducedMotion = String(reduced); body.dataset.quality = profile.name;
  body.classList.toggle('clean-feed', clean);

  const palettes = {
    'basalt-steel':{sky0:'#11141a',sky1:'#05070a',far:'#121820',wall:'#1d252d',wall2:'#2c353d',edge:'#5f6a72',accent:'#d58b45',mist:'#7d6957',plant:'#35483a'},
    'weathered-stone':{sky0:'#6c7480',sky1:'#202a31',far:'#303a3e',wall:'#4a4e49',wall2:'#68665b',edge:'#999384',accent:'#c9a36c',mist:'#a7a59b',plant:'#486347'},
    'brass-iron':{sky0:'#1b1a18',sky1:'#08090a',far:'#191916',wall:'#282823',wall2:'#3c382d',edge:'#81735b',accent:'#c49048',mist:'#81715e',plant:'#3e4934'},
    'steel-glass':{sky0:'#1b2732',sky1:'#0a1118',far:'#17222b',wall:'#24313a',wall2:'#33444d',edge:'#76909e',accent:'#8db7c8',mist:'#7f99a8',plant:'#345251'},
    'storm-metal':{sky0:'#29343f',sky1:'#0c1118',far:'#151c24',wall:'#242e36',wall2:'#38434b',edge:'#80919d',accent:'#b9d1de',mist:'#95a8b3',plant:'#30494a'},
    'pale-stone-glass':{sky0:'#73899e',sky1:'#243441',far:'#354653',wall:'#65717a',wall2:'#89949a',edge:'#c8d0d4',accent:'#e3d8b6',mist:'#c1cbd0',plant:'#516a62'}
  };
  const fallbackPalette={sky0:'#18202a',sky1:'#080b10',far:'#151c24',wall:'#26303a',wall2:'#38444f',edge:'#7d8993',accent:'#c6a267',mist:'#87939d',plant:'#3c5444'};
  const ui = contrast ? {rail:'#fff',accent:'#00ffff',purple:'#d5b9ff',danger:'#ff8aa0',gold:'#ffe070'}
    : {rail:'#9da9b8',accent:'#8bd9e8',purple:'#a99ac7',danger:'#ed667d',gold:'#dfb96e'};

  function hash32(value){let h=2166136261>>>0;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function unit(seed,index=0){let x=(hash32(seed)+Math.imul(index+1,0x9e3779b1))>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967295}
  function currentPalette(s){return contrast?{...fallbackPalette,sky0:'#000',sky1:'#000',far:'#080808',wall:'#111',wall2:'#222',edge:'#ccc',accent:'#fff',mist:'#888',plant:'#777'}:(palettes[s?.zone?.material]||fallbackPalette)}
  function fit() {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1, r.width); height = Math.max(1, r.height);
    ratio = TowerView.renderRatio(profile,width,height,devicePixelRatio||1);
    canvas.width = Math.max(1,Math.round(width*ratio)); canvas.height = Math.max(1,Math.round(height*ratio));
    ctx?.setTransform(ratio,0,0,ratio,0,0); updateDiagnostics();
  }
  function updateDiagnostics(extra={}){
    window.__TOWER_RENDER_DIAGNOSTICS__={quality:profile.name,pixelCount:canvas.width*canvas.height,pixelBudget:profile.pixelBudget,
      decorativeObjectBudget:profile.decorativeObjectBudget,layers:layers.map(layer=>layer.id),contextRecoveries,audioMuted:muted,
      activeVoices:mixer?.activeCount?.()||0,maxVoices:soundPolicy.maxVoices,...extra};
  }
  function line(x1,y1,x2,y2,color,lineWidth=1) {ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function box(x,y,w,h,color,r=3) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,Math.max(.1,w),Math.max(.1,h),Math.max(0,Math.min(r,w/2,h/2)));ctx.fill()}
  function label(value,x,y,color,size=10,align='center') {ctx.fillStyle=color;ctx.font=`600 ${size}px ui-sans-serif,system-ui,sans-serif`;ctx.textAlign=align;ctx.fillText(value,x,y)}
  const words = value => String(value || '').replaceAll('-', ' ').replaceAll('_', ' ').toUpperCase();
  function sceneName(scene) {return({normal:'ASCENDING',danger:'DANGER',upgrade:'BUILD CHOICE',guardian:'GUARDIAN',result:'RUN COMPLETE',intermission:'NEXT RUN',recovery:'RECOVERING'})[scene]||words(scene)}
  function setPercent(id, value) {const node=$(id);if(node)node.style.width=`${Math.max(0,Math.min(100,Number.isFinite(value)?value:0))}%`}

  class TowerAudioMixer{
    constructor(policy,isMuted){this.policy=policy;this.muted=isMuted;this.context=null;this.master=null;this.wind=null;this.windGain=null;this.active=[];this.seen=new Set();this.lastCue=new Map()}
    ensure(){if(this.muted||this.policy.maxVoices===0)return null;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!this.context){try{this.context=new C();this.master=this.context.createGain();this.master.gain.value=.34;this.master.connect(this.context.destination);this.createWind()}catch{return null}}return this.context}
    unlock(){const c=this.ensure();if(c?.state==='suspended')c.resume().catch(()=>{})}
    createWind(){const c=this.context;if(!c||this.wind)return;try{const length=Math.max(1,Math.floor(c.sampleRate*.7)),buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0);let x=0x51f15e;for(let i=0;i<length;i++){x^=x<<13;x^=x>>>17;x^=x<<5;data[i]=((x>>>0)/4294967295*2-1)*.32}const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=900;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();this.wind=source;this.windGain=gain}catch{}}
    updateWind(snapshot){if(this.muted)return;const c=this.ensure();if(!c||!this.windGain)return;const altitude=Math.max(0,Number(snapshot?.progress?.height||0)/1000),storm=snapshot?.zone?.id==='storm-exterior'?1.45:1,target=Math.min(.09,this.policy.windGain*(.7+Math.min(1.5,altitude/2200))*storm);try{this.windGain.gain.setTargetAtTime(target,c.currentTime,.45)}catch{}}
    tone(cue,intensity=1){const c=this.ensure();if(!c)return;const now=performance.now(),last=this.lastCue.get(cue)||-Infinity;if(now-last<this.policy.cooldownMs)return;this.lastCue.set(cue,now);this.active=this.active.filter(v=>v.until>now);if(this.active.length>=this.policy.maxVoices)return;const table={jump:[190,.08],land:[85,.12],impact:[65,.18],warning:[440,.13],upgrade:[620,.18],'floor-rise':[330,.22],'enemy-break':[120,.12],'fall-end':[75,.3],replan:[260,.1],'safe-tone':[210,.2],zone:[510,.28]};const spec=table[cue]||[240,.1];try{const osc=c.createOscillator(),gain=c.createGain();osc.type=cue==='impact'||cue==='land'?'triangle':'sine';osc.frequency.value=spec[0];gain.gain.setValueAtTime(.0001,c.currentTime);gain.gain.exponentialRampToValueAtTime(Math.max(.003,.055*intensity),c.currentTime+.008);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+spec[1]);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(c.currentTime+spec[1]+.02);this.active.push({until:now+(spec[1]+.03)*1000})}catch{}}
    consume(data,oldSnapshot){const s=data?.snapshot;if(!s)return;this.updateWind(s);if(this.muted)return;for(const voice of data?.audio?.voices||[]){if(this.seen.has(voice.id))continue;this.seen.add(voice.id);this.tone(voice.cue,voice.priority?Math.min(1.4,.65+voice.priority/18):1)}if(this.seen.size>96)this.seen=new Set([...this.seen].slice(-64));if(oldSnapshot){if(oldSnapshot.player?.state==='standing'&&s.player?.state!=='standing')this.tone('jump',.75);if(oldSnapshot.player?.state!=='standing'&&s.player?.state==='standing')this.tone('land',Math.min(1.35,.7+Math.abs(oldSnapshot.player?.vy||0)/120000));if(oldSnapshot.player?.health>s.player?.health)this.tone('impact',1.1);if(oldSnapshot.zone?.id&&s.zone?.id&&oldSnapshot.zone.id!==s.zone.id)this.tone('zone',.85)}}
    pauseBed(paused){if(this.windGain&&this.context){try{this.windGain.gain.setTargetAtTime(paused?0:this.policy.windGain,this.context.currentTime,.15)}catch{}}}
    activeCount(){const now=performance.now();this.active=this.active.filter(v=>v.until>now);return this.muted?0:this.active.length}
  }
  const mixer=new TowerAudioMixer(soundPolicy,muted);
  document.addEventListener('pointerdown',()=>mixer.unlock(),{once:true});
  document.addEventListener('keydown',()=>mixer.unlock(),{once:true});

  function update(data) {
    const s = data.snapshot;
    window.__TOWER_PUBLIC_STATE__ = s;
    text('floor',s.floor); text('height',`${Math.floor(s.progress.height/1000)}m`);text('guardian',s.progress.nextGuardianFloor); text('tick',s.tick);
    text('health',`${s.player.health}/${s.player.maxHealth}`); text('stamina',s.player.stamina);text('shields',s.player.shieldCharges); text('score',s.player.score.toLocaleString());
    text('ai-intent',words(s.intent.summary)); text('scene',sceneName(data.scene)); text('run-token',s.runToken.slice(0,8));text('progress',`${Math.round(s.progress.floorProgressPermille/10)}%`);
    setPercent('floor-progress',s.progress.floorProgressPermille/10);setPercent('health-bar',100*s.player.health/Math.max(1,s.player.maxHealth));setPercent('stamina-bar',100*s.player.stamina/Math.max(1,s.player.maxStamina));
    $('theme-name').textContent=s.zone?`${words(s.zone.name)} · ${s.zone.localFloor+1}/${s.zone.span}`:`${words(s.theme)} SECTOR`;
    $('intent-mode').textContent=words(s.intent.mode); $('confidence').textContent=`${Math.round(s.intent.confidencePermille/10)}%`;$('caption-text').textContent=data.audio?.captions?.at(-1)?.text || s.intent.summary;
    body.classList.toggle('danger',data.scene==='danger'||data.scene==='guardian');body.dataset.scene=data.scene;body.dataset.zone=s.zone?.id||s.theme;
    $('build-tags').replaceChildren(...(s.buildTags.length?s.buildTags:['BASE KIT']).slice(-6).map(value=>{const node=document.createElement('em');node.textContent=words(value);return node}));
    $('choice-card').hidden=data.scene!=='upgrade';$('choice-options').replaceChildren(...s.upgradeOffers.map(offer=>{const node=document.createElement('span');node.textContent=offer.name;return node}));
    $('result-card').hidden=!['result','intermission'].includes(data.scene);$('result-title').textContent=data.scene==='intermission'?'NEXT ASCENT':words(s.result?.reason||'ASCENT ENDED');$('result-height').textContent=`${Math.floor(s.progress.height/1000)}m`;$('recovery-card').hidden=data.scene!=='recovery';
  }
  function accept(data, now) {
    const s=data?.snapshot;if(!s||!Number.isFinite(s.tick)||!s.player||!Array.isArray(s.platforms))throw new Error('invalid-public-frame');const old=current?.snapshot;
    if(old&&old.runToken===s.runToken&&(s.tick<old.tick||s.revision<old.revision))return false;
    if(!old||old.runToken!==s.runToken||old.tick!==s.tick||old.revision!==s.revision){const contiguous=old&&old.runToken===s.runToken&&now-lastAcceptedAt<400&&old.floor===s.floor;previous=contiguous?current:null;blendMs=Math.max(80,Math.min(180,now-lastAcceptedAt||110));receivedAt=now;lastAcceptedAt=now;if(!contiguous)effects=[];if(contiguous&&!reduced&&data.scene!=='recovery'){if(old.player.state==='standing'&&s.player.state!=='standing')effects.push({x:s.player.x,y:s.player.y,at:now,kind:'jump'});if(old.player.state!=='standing'&&s.player.state==='standing')effects.push({x:s.player.x,y:s.player.y-s.player.halfHeight,at:now,kind:'land'});if(s.player.health<old.player.health)effects.push({x:s.player.x,y:s.player.y,at:now,kind:'hit'});effects=effects.slice(-24)}}
    mixer.consume(data,old);current=data;update(data);updateDiagnostics();return true;
  }

  function drawSky(p,w,h,now,s){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,p.sky0);g.addColorStop(.58,p.sky1);g.addColorStop(1,'#05070a');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);if(s.zone?.id==='storm-exterior'){ctx.globalAlpha=.13;const drift=(now*.018)%140;for(let i=0;i<Math.min(34,layers[0].budget);i++){const y=(i*79+drift)%h;line(-40,y,w+40,y+50,p.mist,.7)}ctx.globalAlpha=1}else{ctx.globalAlpha=.08;const band=h*.18+Math.sin(now*.0003)*10;const haze=ctx.createLinearGradient(0,band,0,band+150);haze.addColorStop(0,'transparent');haze.addColorStop(.5,p.mist);haze.addColorStop(1,'transparent');ctx.fillStyle=haze;ctx.fillRect(0,band,w,150);ctx.globalAlpha=1}}
  function drawFar(s,t,p,w,h,now,budget){const left=t.x(0),right=t.x(s.worldWidth),coreLeft=left-46,coreRight=right+46;ctx.globalAlpha=.9;box(coreLeft,-30,coreRight-coreLeft,h+60,p.far,0);ctx.globalAlpha=1;const side=Math.max(28,(right-left)*.035);box(coreLeft,-30,side,h+60,p.wall,0);box(coreRight-side,-30,side,h+60,p.wall,0);const rows=Math.max(5,Math.min(budget,Math.floor(h/48)));for(let i=0;i<rows;i++){const y=((i*67+(s.floor*31)%67)-20+((dataCameraY(s)/1000*.025)%67));const yy=((y%(h+80))+(h+80))%(h+80)-40;const glow=(s.zone?.id==='industrial-foundations'||s.zone?.id==='mechanical-shafts')&&i%3===0;pane(coreLeft+side+18,yy,Math.max(18,(right-left)*.07),12,glow?p.accent:p.wall2,glow?.45:.35);pane(coreRight-side-18-Math.max(18,(right-left)*.07),yy+18,Math.max(18,(right-left)*.07),12,glow?p.accent:p.wall2,glow?.36:.3)}ctx.globalAlpha=.5;line(coreLeft+side,0,coreLeft+side,h,p.edge,1);line(coreRight-side,0,coreRight-side,h,p.edge,1);ctx.globalAlpha=1}
  function dataCameraY(s){return current?.camera?.centerY??s.player.y}
  function pane(x,y,w,h,color,alpha=.3){ctx.globalAlpha=alpha;box(x,y,w,h,color,1);ctx.globalAlpha=1}
  function drawStoneBlocks(left,right,h,p,budget){ctx.globalAlpha=.22;const rows=Math.max(4,Math.min(18,Math.floor(budget/2)));for(let r=0;r<rows;r++){const y=(r*61+(current?.snapshot?.floor||0)*13)%Math.max(1,h);line(left,y,right,y,p.edge,.7);const offset=r%2?42:12;for(let x=left+offset;x<right;x+=96)line(x,y,x,y+61,p.edge,.55)}ctx.globalAlpha=1}
  function drawMid(s,t,p,w,h,now,budget){const left=t.x(0),right=t.x(s.worldWidth),span=right-left,zone=s.zone?.id||'';ctx.globalAlpha=.72;const pillar=Math.max(14,span*.028);box(left-8,0,pillar,h,p.wall2,0);box(right-pillar+8,0,pillar,h,p.wall2,0);for(let y=-30;y<h+60;y+=140){line(left,y,right,y+44,p.wall2,7);line(right,y,left,y+44,p.wall2,7)}ctx.globalAlpha=1;
    if(zone==='ruined-bastion'||zone==='summit-citadel'){drawStoneBlocks(left,right,h,p,budget);const ivy=Math.min(8,Math.floor(budget/8));for(let i=0;i<ivy;i++){const x=(i%2?right-20:left+20)+(unit(`${s.floor}:ivy`,i)-.5)*18,sy=(i*117+37)%h;ctx.strokeStyle=p.plant;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,sy);for(let k=1;k<6;k++)ctx.lineTo(x+(unit(`${s.floor}:vine:${i}`,k)-.5)*18,sy+k*18);ctx.stroke()}}
    if(zone==='industrial-foundations'||zone==='mechanical-shafts'){const pipes=Math.min(12,Math.max(3,Math.floor(budget/6)));for(let i=0;i<pipes;i++){const x=left+22+(i%4)*18+(i>7?span-100:0);ctx.globalAlpha=.35+.15*(i%2);line(x,0,x,h,p.accent,i%3===0?5:2);ctx.globalAlpha=1}for(let y=55;y<h;y+=180){ctx.globalAlpha=.5;ctx.strokeStyle=p.edge;ctx.lineWidth=4;ctx.beginPath();ctx.arc(left+65,y,22,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}}
    if(zone==='suspended-works'||zone==='storm-exterior'){const braces=Math.min(14,Math.floor(budget/5));ctx.globalAlpha=.48;for(let i=0;i<braces;i++){const y=(i*97+(s.floor*19))%h;line(left,y,right,y-70,p.edge,2)}ctx.globalAlpha=1}
    if(zone==='summit-citadel'){ctx.globalAlpha=.28;for(let i=0;i<Math.min(10,budget);i++){const x=left+span*(.1+.8*unit(`${s.floor}:glass`,i)),y=(i*91+23)%h;box(x,y,Math.max(8,span*.035),45,'#d5eef5',1)}ctx.globalAlpha=1}
  }
  function platformMaterial(s,p){const material=s.zone?.material||'';if(material.includes('stone'))return{face:'#5f625e',side:'#3d403d',top:'#aaa69a',detail:'#363a36'};if(material==='brass-iron')return{face:'#474239',side:'#292722',top:'#a68b5a',detail:'#151719'};if(material.includes('glass'))return{face:'#39505b',side:'#23323a',top:'#9bb9c4',detail:'#1b2930'};if(material==='storm-metal')return{face:'#3c4851',side:'#252e35',top:'#8d9ca5',detail:'#182028'};return{face:'#384149',side:'#232b31',top:'#89959c',detail:'#171d22'}}
  function drawGameplay(s,t,p,w,h,now,budget){const mat=platformMaterial(s,p);for(const platform of s.platforms){const x=t.x(platform.x),y=t.y(platform.y+platform.height),pw=platform.width/1000*t.scale,ph=Math.max(5,platform.height/1000*t.scale);if(y<-70||y>h+70)continue;ctx.globalAlpha=.3;box(x+3,y+ph+5,pw,Math.max(3,ph*.55),'#000',2);ctx.globalAlpha=1;box(x,y,pw,ph,mat.face,2);box(x,y+ph*.48,pw,ph*.52,mat.side,1);line(x,y,x+pw,y,platform.kind==='moving'?ui.purple:mat.top,3);if(platform.kind==='oneway'){ctx.globalAlpha=.45;ctx.setLineDash([7,7]);line(x+4,y+ph-1,x+pw-4,y+ph-1,mat.top,1);ctx.setLineDash([]);ctx.globalAlpha=1}const details=Math.min(8,Math.max(1,Math.floor(pw/42)));for(let i=1;i<=details;i++){const dx=x+pw*i/(details+1);if(s.zone?.material==='weathered-stone'||s.zone?.material==='pale-stone-glass'){line(dx,y+2,dx-4,y+ph-2,mat.detail,.8)}else{ctx.fillStyle=mat.detail;ctx.beginPath();ctx.arc(dx,y+ph*.62,1.4,0,Math.PI*2);ctx.fill()}}if(platform.kind==='moving'){label('MOVING',x+pw/2,y+ph+14,ui.purple,8)}}
    for(const z of s.hazards){const x=t.x(z.x),y=t.y(z.y+z.height),zw=z.width/1000*t.scale,zh=Math.max(6,z.height/1000*t.scale);if(y<-60||y>h+60)continue;ctx.globalAlpha=z.active?1:.38;if(z.kind==='spikes'){ctx.fillStyle=ui.danger;const count=Math.max(2,Math.ceil(zw/11));ctx.beginPath();ctx.moveTo(x,y+zh);for(let i=0;i<count;i++){ctx.lineTo(x+(i+.5)*zw/count,y);ctx.lineTo(x+(i+1)*zw/count,y+zh)}ctx.closePath();ctx.fill()}else{box(x,y,zw,zh,z.active?ui.danger:'#59404a',1);for(let n=4;n<zw-3;n+=9)line(x+n,y+1,x+Math.min(zw-2,n+4),y+zh-1,'#20151a',1.5)}ctx.globalAlpha=1}
    for(const item of s.pickups){const x=t.x(item.x),y=t.y(item.y),r=Math.max(5,Math.min(9,6*t.scale)),color=item.kind==='health'?'#8ed5a7':item.kind==='stamina'?ui.accent:ui.gold;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);box(-r,-r,2*r,2*r,color,2);ctx.restore();if(item.kind==='health'){line(x-4,y,x+4,y,'#14201b',2);line(x,y-4,x,y+4,'#14201b',2)}}
    for(const e of s.enemies){if(!e.active)continue;const x=t.x(e.x),y=t.y(e.y),rw=e.halfWidth/1000*t.scale,rh=e.halfHeight/1000*t.scale,color=e.kind==='guardian'?ui.gold:e.kind==='shooter'?ui.danger:ui.purple;ctx.globalAlpha=.32;ctx.beginPath();ctx.ellipse(x,y+rh+4,rw*.9,3,0,0,Math.PI*2);ctx.fillStyle='#000';ctx.fill();ctx.globalAlpha=1;ctx.save();ctx.translate(x,y);if(e.kind==='shooter'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-rh);ctx.lineTo(rw,rh);ctx.lineTo(-rw,rh);ctx.closePath();ctx.fill();box(-rw*.45,-rh*.2,rw*.9,rh*.32,'#17191e',2)}else{box(-rw,-rh,rw*2,rh*2,color,e.kind==='guardian'?3:5);box(-rw*.72,-rh*.45,rw*1.44,rh*.42,'#17191e',2);line(-rw*.4,-rh*.24,rw*.4,-rh*.24,'#f0f2f5',2);if(e.kind==='guardian'){line(-rw*.85,-rh,-rw*.55,-rh-9,color,4);line(rw*.85,-rh,rw*.55,-rh-9,color,4);line(-rw*.85,rh*.3,-rw-10,rh*.8,color,4);line(rw*.85,rh*.3,rw+10,rh*.8,color,4)}}ctx.restore();if(e.health<e.maxHealth){box(x-rw,y-rh-8,rw*2,3,'#281d22',1);box(x-rw,y-rh-8,rw*2*Math.max(0,e.health/e.maxHealth),3,color,1)}if(e.telegraph){ctx.strokeStyle=ui.danger;ctx.lineWidth=2;ctx.strokeRect(x-rw-5,y-rh-5,rw*2+10,rh*2+10);label('!',x,y-rh-12,'#fff',14)}}
    for(const shot of s.projectiles){const x=t.x(shot.x),y=t.y(shot.y),color=shot.owner==='player'?ui.accent:ui.danger,speed=Math.hypot(shot.vx,shot.vy)||1,trail=reduced?0:14;line(x-shot.vx/speed*trail,y+shot.vy/speed*trail,x,y,color,2.5);box(x-2,y-2,4,4,'#f4f6f7',2)}
    drawPlayer(s,t,now);
  }
  function latestEffect(kind,now){for(let i=effects.length-1;i>=0;i--)if(effects[i].kind===kind&&now-effects[i].at<420)return effects[i];return null}
  function drawPlayer(s,t,now){const p=s.player,x=t.x(p.x),y=t.y(p.y),rw=p.halfWidth/1000*t.scale,rh=p.halfHeight/1000*t.scale,land=latestEffect('land',now),landAge=land?(now-land.at)/420:1,compress=land&&!reduced?Math.sin(Math.min(1,landAge)*Math.PI)*.16:0,lean=reduced?0:Math.max(-.12,Math.min(.12,(p.vx||0)/70000));ctx.globalAlpha=p.state==='airborne'?.18:.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y+rh+5,rw*(1.05+compress),3+compress*9,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.save();ctx.translate(x,y+rh*compress*.5);ctx.rotate(lean);ctx.scale(1+compress*.08,1-compress);const armor=contrast?'#fff':'#d5dde2',suit=contrast?'#111':'#32414a',accent=ui.accent;const stride=reduced||p.state!=='standing'?0:Math.sin(now*.018)*Math.min(2,Math.abs(p.vx||0)/7000);box(-rw*.78,rh*.38,rw*.58,rh*.62-stride,suit,2);box(rw*.2,rh*.38+stride,rw*.58,rh*.62-stride,suit,2);box(-rw,-rh*.3,rw*2,rh*1.04,suit,4);box(-rw*.84,-rh*.22,rw*.22,rh*.55,armor,2);box(rw*.62,-rh*.22,rw*.22,rh*.55,armor,2);box(-rw*.72,-rh,rw*1.44,rh*.78,armor,5);box(-rw*.56,-rh*.76,rw*1.12,rh*.24,'#1a252d',2);box(p.facing>0?rw*.18:-rw*.43,-rh*.72,rw*.25,rh*.12,accent,1);line(-rw*.4,rh*.08,rw*.4,rh*.08,accent,1.6);ctx.restore();if(p.shieldCharges>0){ctx.globalAlpha=.65;ctx.strokeStyle=ui.accent;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,rw+8,rh+6,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}}
  function drawForeground(s,t,p,w,h,now,budget){const span=Math.max(1,t.x(s.worldWidth)-t.x(0)),count=Math.min(10,Math.max(2,Math.floor(budget/10)));ctx.globalAlpha=.22;for(let i=0;i<count;i++){const left=i%2===0,x=left?-18:w+18,y=(i*121+s.floor*29)%h,reach=Math.min(w*.13,36+span*.04);ctx.lineWidth=6;ctx.strokeStyle=p.wall2;ctx.beginPath();ctx.moveTo(x,y-90);ctx.lineTo(left?reach:w-reach,y);ctx.lineTo(x,y+95);ctx.stroke()}ctx.globalAlpha=1;if(s.zone?.id==='storm-exterior'&&!reduced){ctx.globalAlpha=.13;const drift=(now*.09)%100;for(let i=0;i<Math.min(18,budget);i++){const x=(i*83+drift)%w,y=(i*47+drift*1.8)%h;line(x,y,x-16,y+40,p.mist,1)}ctx.globalAlpha=1}}
  function drawEffects(t,now){effects=effects.filter(e=>now-e.at<520);if(reduced)return;for(const e of effects){const age=(now-e.at)/520,x=t.x(e.x),y=t.y(e.y);ctx.globalAlpha=(1-age)*.55;ctx.strokeStyle=e.kind==='hit'?ui.danger:e.kind==='jump'?ui.gold:ui.accent;ctx.lineWidth=2;ctx.beginPath();const rx=7+age*(e.kind==='land'?30:20),ry=e.kind==='land'?2+age*8:rx;ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke()}ctx.globalAlpha=1}
  function draw(now) {
    if(contextLost||!ctx)return;const data=TowerView.interpolateFrame(previous,current,(now-receivedAt)/blendMs,reduced),s=data?.snapshot,w=width,h=height;
    if(!s){ctx.fillStyle='#090c10';ctx.fillRect(0,0,w,h);label('CONNECTING TO THE CLIMBER',w/2,h/2,ui.accent,13);return}
    const p=currentPalette(s),t=TowerView.transform(s,w,h,data.camera);drawSky(p,w,h,now,s);drawFar(s,t,p,w,h,now,layers[0].budget);drawMid(s,t,p,w,h,now,layers[1].budget);drawGameplay(s,t,p,w,h,now,layers[2].budget);drawEffects(t,now);drawForeground(s,t,p,w,h,now,layers[3].budget);
    const target=s.intent?.targetPlatformId&&s.platforms.find(platform=>platform.id===s.intent.targetPlatformId);if(target&&!clean){const tx=t.x(target.x+target.width/2),ty=t.y(target.y+target.height);ctx.globalAlpha=.45;line(tx-7,ty-14,tx,ty-7,ui.gold,1);line(tx,ty-7,tx+7,ty-14,ui.gold,1);ctx.globalAlpha=1}
    if(!clean){label(`${words(s.zone?.name||s.theme)}  ·  FLOOR ${s.floor}`,w/2,24,'#d6dde1',10)}updateDiagnostics({activeVoices:mixer.activeCount()});
  }
  async function poll() {
    if(stopped||activeRequest)return;
    const controller=new AbortController();activeRequest=controller;const timeout=setTimeout(()=>controller.abort(),2500);
    try{const response=await fetch(TowerView.stateRequestPath({width:innerWidth,height:innerHeight,reducedMotion:reduced,cleanFeed:clean,muted,quality:profile.name}),{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('state-unavailable');const data=await response.json();if(stopped)return;$('provider-state').textContent=accept(data,performance.now())?'PUBLIC FEED CONNECTED':'WAITING FOR CURRENT VIEW'}catch{if(!stopped){previous=null;effects=[];$('provider-state').textContent='VIEW RECONNECTING · LAST CONFIRMED FRAME'}}finally{clearTimeout(timeout);activeRequest=null;if(!stopped)timer=setTimeout(poll,110)}
  }
  function render(now){if(stopped)return;draw(now);raf=requestAnimationFrame(render)}
  function stop(){stopped=true;clearTimeout(timer);cancelAnimationFrame(raf);activeRequest?.abort();mixer.pauseBed(true)}
  function start(){if(!stopped)return;stopped=false;previous=null;effects=[];fit();mixer.pauseBed(false);poll();raf=requestAnimationFrame(render)}
  canvas.addEventListener('contextlost',event=>{event.preventDefault?.();contextLost=true;previous=null;effects=[];updateDiagnostics({contextLost:true})});
  canvas.addEventListener('contextrestored',()=>{contextRecoveries++;contextLost=false;ctx=canvas.getContext('2d',{alpha:false});fit();updateDiagnostics({contextLost:false})});
  addEventListener('pagehide',stop);addEventListener('pageshow',start);addEventListener('resize',fit,{passive:true});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(canvas);
  document.addEventListener('visibilitychange',()=>{previous=null;effects=[];mixer.pauseBed(document.hidden)});
  preference.addEventListener('change',event=>{reduced=params.get('reducedMotion')==='1'||event.matches;body.dataset.reducedMotion=String(reduced);previous=null;effects=[]});
  fit();updateDiagnostics();poll();raf=requestAnimationFrame(render);
})();
