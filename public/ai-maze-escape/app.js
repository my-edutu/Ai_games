'use strict';

// Grid movement remains authoritative. Presentation never invents a corridor.
const MazeView = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function edge(snapshot, known, a, b) {
    const first = known.get(a), second = known.get(b);
    if (!first || !second || first.blocked || second.blocked) return false;
    const distance = Math.abs(a % snapshot.width - b % snapshot.width) +
      Math.abs(Math.floor(a / snapshot.width) - Math.floor(b / snapshot.width));
    return distance === 1 && first.neighbors.includes(b) && second.neighbors.includes(a) &&
      !(snapshot.doors || []).some(d => !d.open && ((d.a === a && d.b === b) || (d.a === b && d.b === a)));
  }
  function routeSegments(snapshot, route, visible) {
    const known = new Map(snapshot.cells.map(c => [c.cell, c])), segments = [];
    let segment = [];
    const flush = () => { if (segment.length > 1) segments.push(segment); segment = []; };
    for (const cell of route.slice(-240)) {
      if (!visible.has(cell) || !known.has(cell) || known.get(cell).blocked) { flush(); continue; }
      if (segment.length && !edge(snapshot, known, segment.at(-1), cell)) flush();
      segment.push(cell);
    }
    flush(); return segments;
  }
  function explorerPosition(previous, current, alpha, reducedMotion = false) {
    const target = {col: current.currentCell % current.width, row: Math.floor(current.currentCell / current.width)};
    if (!previous || reducedMotion || previous.runToken !== current.runToken || previous.level !== current.level ||
        previous.width !== current.width || previous.height !== current.height || current.result ||
        current.tick <= previous.tick || current.tick - previous.tick > 2 ||
        !edge(current, new Map(current.cells.map(c => [c.cell, c])), previous.currentCell, current.currentCell)) return target;
    const t = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
    const col = previous.currentCell % current.width, row = Math.floor(previous.currentCell / current.width);
    return {col: col + (target.col - col) * t, row: row + (target.row - row) * t};
  }
  return {routeSegments, explorerPosition};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MazeView;

if (typeof document !== 'undefined') (() => {
  const canvas = document.getElementById('maze'), ctx = canvas.getContext('2d', {alpha:false});
  const $ = id => document.getElementById(id), query = new URLSearchParams(location.search);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const settings = {reducedMotion: query.get('reducedMotion') === '1' || preference.matches,
    highContrast: query.get('highContrast') === '1', cleanFeed: query.get('cleanFeed') === '1'};
  document.body.dataset.reducedMotion = String(settings.reducedMotion);
  document.body.dataset.highContrast = String(settings.highContrast);
  $('broadcast').classList.toggle('clean-feed', settings.cleanFeed);
  const color = {floor:settings.highContrast?'#191919':'#17352f', wall:settings.highContrast?'#fff':'#84baa8',
    hero:settings.highContrast?'#e5ff72':'#a7ffba', route:'#ffd18a', danger:'#ff7e96', memory:'#17312d'};
  let current=null, previous=null, received=0, lastAccepted=0, blendMs=180;
  let stopped=false, timer=0, raf=0, request=null, width=1, height=1, ratio=1;
  let cached=null, view=null, known=null, travelled=[], planned=[], lastCaption='Mapping the nearest frontier.';
  function resize(){
    const rect=canvas.getBoundingClientRect();ratio=Math.min(devicePixelRatio||1,2);
    width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);cached=null;
  }
  function computePublicView(s,camera){
    const cells=s.cells.length?s.cells:[{cell:s.currentCell}];
    const cols=cells.map(c=>c.cell%s.width),rows=cells.map(c=>Math.floor(c.cell/s.width));
    const overview=s.progressPermille>=850||camera?.mode==='overview'||camera?.mode==='result';
    const localColumns=width<640&&width<height?7:11;
    const wc=Math.min(s.width,Math.max(Math.min(s.width,7),Math.min(overview?s.width:localColumns,Math.max(...cols)-Math.min(...cols)+3)));
    const hc=Math.min(s.height,Math.max(Math.min(s.height,5),Math.min(overview?s.height:8,Math.max(...rows)-Math.min(...rows)+3)));
    let center=cells.some(c=>c.cell===camera?.centerCell)?camera.centerCell:s.currentCell;
    const start=(cell)=>({col:Math.max(0,Math.min(s.width-wc,cell%s.width-Math.floor(wc/2))),
      row:Math.max(0,Math.min(s.height-hc,Math.floor(cell/s.width)-Math.floor(hc/2)))});
    let a=start(center),col=s.currentCell%s.width,row=Math.floor(s.currentCell/s.width);
    if(col<a.col||col>=a.col+wc||row<a.row||row>=a.row+hc){center=s.currentCell;a=start(center);}
    return {startCol:a.col,startRow:a.row,widthCells:wc,heightCells:hc,centerCell:center,
      mode:overview?'overview':camera?.mode||'local',containsCurrentCell:true};
  }
  function visible(cell,s){const col=cell%s.width,row=Math.floor(cell/s.width);return col>=view.startCol&&col<view.startCol+view.widthCells&&row>=view.startRow&&row<view.startRow+view.heightCells;}
  function prepare(s,camera){
    if(cached===s)return;cached=s;view=computePublicView(s,camera);known=new Map(s.cells.map(c=>[c.cell,c]));
    const shown=new Set(s.cells.filter(c=>visible(c.cell,s)).map(c=>c.cell));
    travelled=MazeView.routeSegments(s,s.travelledRoute,shown);planned=MazeView.routeSegments(s,s.plannedRoute,shown);
    window.__MAZE_VIEW__=view;
  }
  function rect(x,y,w,h,fill,r=3){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,Math.max(.1,w),Math.max(.1,h),Math.min(r,w/2,h/2));ctx.fill();}
  function line(x,y,ex,ey,stroke,size=1){ctx.strokeStyle=stroke;ctx.lineWidth=size;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();}
  function text(value,x,y,fill,size=10,align='center'){ctx.fillStyle=fill;ctx.font=`600 ${size}px ui-monospace,monospace`;ctx.textAlign=align;ctx.fillText(value,x,y);}
  function draw(now){
    ctx.fillStyle=settings.highContrast?'#000':'#060f12';ctx.fillRect(0,0,width,height);
    if(!current){text('CONNECTING TO THE EXPLORER',width/2,height/2,color.hero,12);return;}
    const s=current.snapshot;prepare(s,current.camera);
    const top=settings.cleanFeed?12:58,bottom=settings.cleanFeed?12:34,pad=Math.min(28,width*.06);
    const cell=Math.max(1,Math.min((width-pad*2)/view.widthCells,(height-top-bottom)/view.heightCells));
    const ox=(width-cell*view.widthCells)/2,oy=top+Math.max(0,(height-top-bottom-cell*view.heightCells)/2);
    const point=(id)=>({x:ox+(id%s.width-view.startCol+.5)*cell,y:oy+(Math.floor(id/s.width)-view.startRow+.5)*cell});
    const shown=s.cells.filter(c=>visible(c.cell,s));
    for(const c of shown){
      const p=point(c.cell),x=p.x-cell/2,y=p.y-cell/2;
      rect(x+2,y+2,cell-4,cell-4,c.visible?color.floor:color.memory,Math.min(5,cell*.09));
      if(c.blocked){line(x+cell*.2,y+cell*.2,x+cell*.8,y+cell*.8,color.danger,3);line(x+cell*.8,y+cell*.2,x+cell*.2,y+cell*.8,color.danger,3);}
      if(c.checkpoint){ctx.strokeStyle='#89dfff';ctx.lineWidth=2;ctx.strokeRect(p.x-cell*.23,p.y-cell*.23,cell*.46,cell*.46);}
      if(c.clue)text('?',p.x,p.y+cell*.1,'#89dfff',Math.max(9,cell*.3));
      if(c.neighbors.some(n=>!known.has(n))){rect(x+cell*.73,y+cell*.18,3,3,'#89dfff',1);}
      // Extruded wall base, followed by its bright top edge; never hide openings.
      const col=c.cell%s.width,row=Math.floor(c.cell/s.width),ns=new Set(c.neighbors);
      const walls=[];
      if(row===0||!ns.has(c.cell-s.width))walls.push([x,y,x+cell,y]);
      if(col===s.width-1||!ns.has(c.cell+1))walls.push([x+cell,y,x+cell,y+cell]);
      if(row===s.height-1||!ns.has(c.cell+s.width))walls.push([x,y+cell,x+cell,y+cell]);
      if(col===0||!ns.has(c.cell-1))walls.push([x,y,x,y+cell]);
      ctx.globalAlpha=c.visible?1:.52;
      for(const [a,b,d,e] of walls){line(a,b+3,d,e+3,'#071716',Math.max(4,cell*.09));line(a,b,d,e,color.wall,Math.max(2,cell*.055));}
      ctx.globalAlpha=1;
    }
    function route(segments,stroke,dashed){
      ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(2,cell*.055);ctx.lineJoin='round';ctx.lineCap='round';
      ctx.setLineDash(dashed?[5,5]:[]);
      for(const segment of segments){ctx.beginPath();segment.forEach((id,i)=>{const p=point(id);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();}
      ctx.setLineDash([]);
    }
    route(travelled,'#59a8b9',false);route(planned,color.route,true);
    for(const door of s.doors){
      if(!visible(door.a,s)||!visible(door.b,s))continue;
      const a=point(door.a),b=point(door.b),x=(a.x+b.x)/2,y=(a.y+b.y)/2;
      const dx=(b.y-a.y)*.22,dy=(b.x-a.x)*.22;
      if(!door.open){line(x-dx,y+dy,x+dx,y-dy,color.route,Math.max(5,cell*.14));text('×',x,y+4,'#18231d',13);}
    }
    for(const key of s.keys){
      if(key.collected||!known.has(key.cell)||!visible(key.cell,s))continue;
      const p=point(key.cell),r=Math.max(3,cell*.105);
      ctx.strokeStyle=color.route;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(p.x-r,p.y-r*.3,r,0,Math.PI*2);ctx.stroke();
      line(p.x,p.y,p.x+r*1.6,p.y+r*1.6,color.route,3);line(p.x+r,p.y+r,p.x+r*1.6,p.y+r*.35,color.route,2);
    }
    for(const c of shown.filter(c=>c.trap)){
      const p=point(c.cell),r=cell*.25;ctx.strokeStyle=color.danger;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x+r,p.y+r*.8);ctx.lineTo(p.x-r,p.y+r*.8);ctx.closePath();ctx.stroke();text('!',p.x,p.y+r*.48,color.danger,Math.max(9,r));
    }
    if(s.exitCell!==null&&known.has(s.exitCell)&&visible(s.exitCell,s)){
      const p=point(s.exitCell),r=cell*.29;ctx.strokeStyle=color.hero;ctx.lineWidth=3;ctx.strokeRect(p.x-r,p.y-r,r*2,r*2);
      text('↗',p.x,p.y+r*.53,color.hero,Math.max(11,r*1.7));
    }
    for(const threat of s.threats){
      if(!known.has(threat.cell)||!visible(threat.cell,s))continue;
      const p=point(threat.cell),r=cell*.24;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);rect(-r,-r,r*2,r*2,color.danger,3);ctx.restore();
      line(p.x-r*.45,p.y,p.x+r*.45,p.y,'#241019',3);
    }
    const position=MazeView.explorerPosition(previous?.snapshot,s,(now-received)/blendMs,settings.reducedMotion||['result','intermission','recovery'].includes(current.scene));
    const x=ox+(position.col-view.startCol+.5)*cell,y=oy+(position.row-view.startRow+.5)*cell,r=Math.max(4,cell*.26);
    rect(x-r-2,y-r+3,r*2+4,r*2+2,'#030909',Math.max(2,r*.4));
    rect(x-r,y-r,r*2,r*2,color.hero,Math.max(2,r*.35));
    rect(x-r*.7,y-r*.4,r*1.4,r*.55,'#14302a',2);
    rect(x-r*.47,y-r*.27,r*.27,r*.18,'#fff',1);rect(x+r*.2,y-r*.27,r*.27,r*.18,'#fff',1);
    line(x-r*.4,y+r*.55,x+r*.4,y+r*.55,'#315643',2);
    if(!settings.cleanFeed){
      text(`${view.mode.toUpperCase()} · DISCOVERED PASSAGES ONLY`,ox,Math.max(48,oy-10),'#a6c7bd',Math.max(8,Math.min(10,width/50)),'left');
      text('— travelled    - - planned    △ danger',width/2,height-13,'#a6c7bd',Math.max(8,Math.min(10,width/45)));
    }
    if(current.scene==='danger'){ctx.strokeStyle=color.danger;ctx.lineWidth=3;ctx.strokeRect(2,2,width-4,height-4);}
  }
  function update(data){
    const s=data.snapshot;window.__MAZE_PUBLIC_STATE__=s;prepare(s,data.camera);
    $('tick').textContent=s.tick;$('steps').textContent=Math.max(0,s.travelledRoute.length-1);
    $('time').textContent=s.timeRemaining;$('keys').textContent=s.inventory.length;
    $('progress').textContent=`${Math.floor(s.progressPermille/10)}%`;$('progress-fill').style.width=`${s.progressPermille/10}%`;
    $('intent-mode').textContent=s.intent.mode.replaceAll('-',' ');$('intent-copy').textContent=s.intent.explanation;
    $('confidence-fill').style.width=`${Math.max(0,Math.min(100,s.intent.confidence*100))}%`;
    $('inventory').textContent=s.inventory.length?s.inventory.join(' · '):'No keys collected';
    $('profile').textContent=`${s.profile.toUpperCase()} · L${s.level}`;$('integrity').textContent='PUBLIC FEED CONNECTED';
    const caption=data.audio?.captions?.at(-1);if(typeof caption==='string')lastCaption=caption;
    $('caption').textContent=lastCaption;
    const scene=data.scene;$('broadcast').dataset.scene=scene;
    $('scene-card').hidden=!['result','intermission','recovery'].includes(scene);
    $('scene-title').textContent=scene==='recovery'?'RECOVERING VIEW':scene==='intermission'?'NEXT MAZE':s.result?.reason==='escape'?'ESCAPE COMPLETE':'RUN COMPLETE';
    $('scene-message').textContent=scene==='recovery'?'Restoring the latest confirmed public state.':scene==='intermission'?'A new challenge is being prepared.':`Outcome: ${s.result?.reason||'complete'}.`;
  }
  async function poll(){
    if(stopped||request)return;const controller=new AbortController();request=controller;
    const timeout=setTimeout(()=>controller.abort(),2500);
    try{
      const response=await fetch(`/maze/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${settings.reducedMotion?1:0}&cleanFeed=${settings.cleanFeed?1:0}`,{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('state-unavailable');const data=await response.json();if(stopped)return;
      const s=data?.snapshot;if(!s||!Array.isArray(s.cells)||!Number.isFinite(s.tick))throw new Error('invalid-public-frame');
      const old=current?.snapshot,now=performance.now();
      if(old&&old.runToken===s.runToken&&(s.tick<old.tick||s.revision<old.revision)){$('integrity').textContent='WAITING FOR CURRENT VIEW';return;}
      if(!old||old.runToken!==s.runToken||old.tick!==s.tick||old.revision!==s.revision){
        previous=old&&now-lastAccepted<500&&old.runToken===s.runToken?current:null;
        received=now;blendMs=Math.max(100,Math.min(220,now-lastAccepted||180));lastAccepted=now;
      }
      current=data;update(data);
    }catch{
      if(!stopped){previous=null;$('integrity').textContent='VIEW RECONNECTING';$('scene-card').hidden=false;
        $('scene-title').textContent='RECONNECTING';$('scene-message').textContent='Showing the last confirmed frame. No new outcome is assumed.';}
    }finally{clearTimeout(timeout);request=null;if(!stopped)timer=setTimeout(poll,180);}
  }
  function animate(now){if(stopped)return;draw(now);raf=requestAnimationFrame(animate);}
  function stop(){stopped=true;clearTimeout(timer);cancelAnimationFrame(raf);request?.abort();}
  function start(){if(!stopped)return;stopped=false;previous=null;resize();poll();raf=requestAnimationFrame(animate);}
  addEventListener('pagehide',stop);addEventListener('pageshow',start);addEventListener('resize',resize,{passive:true});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange',()=>{previous=null;});
  preference.addEventListener('change',event=>{settings.reducedMotion=query.get('reducedMotion')==='1'||event.matches;
    document.body.dataset.reducedMotion=String(settings.reducedMotion);previous=null;});
  resize();poll();raf=requestAnimationFrame(animate);
})();
