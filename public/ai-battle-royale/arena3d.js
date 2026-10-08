'use strict';
/* Gauntlet WebGL2 viewport. Cosmetic only; consumes sanitized render snapshots. */
(()=>{
  const params=new URLSearchParams(location.search);
  const forced2d=params.get('visual')==='2d';
  const tactical=document.querySelector('[data-testid="battle-canvas"]');
  const host=tactical?.parentElement;
  const colours={
    ember:{ground:[.14,.20,.22],wall:[.27,.31,.36],accent:[.96,.55,.24]},
    neon:{ground:[.09,.13,.24],wall:[.27,.33,.51],accent:[.35,.93,1]},
    arctic:{ground:[.22,.38,.46],wall:[.35,.52,.60],accent:[.60,.89,1]}
  };
  const suits={vanguard:[.98,.39,.31],ranger:[.37,.84,.97],scavenger:[.97,.76,.37],tactician:[.70,.94,.53]};
  const vertexSource=[
    '#version 300 es',
    'in vec3 pos; in vec3 normal; in vec3 tint;',
    'uniform vec3 center; uniform vec2 scale;',
    'out vec3 vNormal; out vec3 vTint; out float vDepth;',
    'void main(){',
    'vec3 p=pos-center;',
    'float east=p.x*.79-p.z*.61;',
    'float along=p.x*.61+p.z*.79;',
    'float up=p.y*.85-along*.52;',
    'float depth=p.y*.52+along*.85;',
    'gl_Position=vec4(east*scale.x,up*scale.y,-depth/80.0,1.0);',
    'vNormal=normal;vTint=tint;vDepth=depth;',
    '}'
  ].join('\n');
  const fragmentSource=[
    '#version 300 es',
    'precision highp float;',
    'in vec3 vNormal; in vec3 vTint; in float vDepth;',
    'out vec4 result;',
    'void main(){',
    'float direct=max(dot(normalize(vNormal),normalize(vec3(-.52,.90,.34))),0.0);',
    'vec3 lit=vTint*(.43+.57*direct)+vec3(.035,.045,.060);',
    'float haze=clamp(1.0-abs(vDepth)/85.0,.68,1.0);',
    'result=vec4(mix(vec3(.045,.07,.11),lit,haze),1.0);',
    '}'
  ].join('\n');
  let canvas=null,gl=null,program=null,buffer=null,attr=null,uniform=null,lastSnapshot=null,disabled=forced2d||!host;
  const reducedMotion=params.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedFlash=params.get('reducedFlash')==='1';
  let previousSnapshot=null,startedAt=0,animationId=0,lastPaintTime=0;
  const status={mode:forced2d?'forced-2d':'initializing',frames:0,triangles:0,contenders:0,p95SubmitMs:0};
  const frameSamples=[];
  function compile(type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(error)}
    return shader;
  }
  function initialize(){
    const v=compile(gl.VERTEX_SHADER,vertexSource),f=compile(gl.FRAGMENT_SHADER,fragmentSource);
    program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
    gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('shader-link');
    attr=['pos','normal','tint'].map(name=>gl.getAttribLocation(program,name));
    uniform=['center','scale'].map(name=>gl.getUniformLocation(program,name));
    buffer=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);gl.clearColor(.025,.043,.068,1);
    status.mode='webgl2';document.body.dataset.battleRenderer='webgl2';
  }
  if(!disabled){
    canvas=document.createElement('canvas');
    canvas.className='battle-webgl3d';
    canvas.dataset.testid='battle-3d-canvas';
    canvas.setAttribute('aria-hidden','true');
    host.appendChild(canvas);
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();status.mode='context-lost';canvas.style.display='none';
      document.body.dataset.battleRenderer='2d-fallback';
    });
    canvas.addEventListener('webglcontextrestored',()=>{
      try{initialize();canvas.style.display='';if(lastSnapshot)render(lastSnapshot)}
      catch{status.mode='fallback-2d';disabled=true;canvas.style.display='none'}
    });
    try{
      gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
      if(!gl)throw Error('webgl2-unavailable');
      initialize();
    }catch{
      status.mode='fallback-2d';disabled=true;canvas.remove();canvas=null;
      document.body.dataset.battleRenderer='2d-fallback';
    }
  }
  function mesh(){
    const v=[];
    function tri(a,b,c,n,col){for(const p of [a,b,c])v.push(p[0],p[1],p[2],...n,...col)}
    function quad(a,b,c,d,n,col){tri(a,b,c,n,col);tri(a,c,d,n,col)}
    function box(x,y,z,w,h,d,col){
      const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
      quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[0,1,0],col);
      quad([x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[0,-1,0],col);
      quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],col);
      quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],col);
      quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],col);
      quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],col);
    }
    function ring(x,y,z,r,t,col,segments=64){
      for(let i=0;i<segments;i++){
        const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
        quad([x+Math.cos(a)*(r-t),y,z+Math.sin(a)*(r-t)],
             [x+Math.cos(a)*(r+t),y,z+Math.sin(a)*(r+t)],
             [x+Math.cos(b)*(r+t),y,z+Math.sin(b)*(r+t)],
             [x+Math.cos(b)*(r-t),y,z+Math.sin(b)*(r-t)],[0,1,0],col);
      }
    }
    return{v,quad,box,ring};
  }
  function pos(cell,w){return{x:cell%w+.5,z:Math.floor(cell/w)+.5}}
  function contender(b,f,w,theme,focus){
    const p=f.visual||pos(f.cell,w);
    if(!f.alive){b.box(p.x,.08,p.z,.46,.13,.46,[.25,.28,.32]);return}
    const col=suits[f.archetype]||suits.vanguard,steel=[.13,.19,.25],shadow=[.07,.11,.16];
    b.box(p.x,.035,p.z,.72,.03,.55,shadow);
    b.box(p.x-.13,.28,p.z,.17,.48,.20,steel);
    b.box(p.x+.13,.28,p.z,.17,.48,.20,steel);
    b.box(p.x,.79,p.z,.49,.55,.30,col);
    b.box(p.x,.88,p.z+.18,.35,.33,.09,steel);
    b.box(p.x-.34,.80,p.z,.16,.50,.18,steel);
    b.box(p.x+.34,.80,p.z,.16,.50,.18,steel);
    b.box(p.x,1.28,p.z,.33,.34,.32,[.77,.78,.74]);
    b.box(p.x,1.41,p.z,.39,.20,.36,col);
    b.box(p.x,1.30,p.z+.18,.26,.10,.045,[.04,.16,.23]);
    b.box(p.x+.26,.92,p.z+.25,.10,.10,.47,steel);
    if(f.archetype==='vanguard'){
      b.box(p.x-.33,1.02,p.z,.28,.18,.35,steel);b.box(p.x+.33,1.02,p.z,.28,.18,.35,steel);
    }else if(f.archetype==='ranger')b.box(p.x,1.60,p.z,.07,.24,.08,col);
    else if(f.archetype==='scavenger')b.box(p.x,.85,p.z-.22,.28,.44,.17,[.37,.27,.15]);
    else b.box(p.x-.31,1.19,p.z,.14,.14,.13,theme.accent);
    const hp=Math.max(0,Math.min(1,f.health/Math.max(1,f.maxHealth)));
    const shield=Math.max(0,Math.min(1,f.shield/Math.max(1,f.maxShield)));
    b.box(p.x,1.82,p.z,.80,.08,.12,shadow);
    if(hp>0)b.box(p.x-.40+.4*hp,1.83,p.z+.01,.8*hp,.08,.12,[.93,.26,.28]);
    if(shield>0)b.box(p.x-.40+.4*shield,1.93,p.z+.01,.8*shield,.06,.11,[.25,.73,.98]);
    if(focus)b.ring(p.x,.07,p.z,.53,.045,theme.accent,24);
  }
  function world(b,s){
    const a=s.arena,w=a.width,h=a.height,t=colours[a.theme]||colours.ember;
    b.box(w/2,-.25,h/2,w,.5,h,t.wall);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const variation=(x*17+y*31+x*y*7)%11;
      const mult=variation<3?1.13:variation>8?.82:1;
      const tint=t.ground.map(v=>Math.min(1,v*mult));
      b.quad([x,.012,y],[x,.012,y+1],[x+1,.012,y+1],[x+1,.012,y],[0,1,0],tint);
      if((x*7+y*13)%41===0)b.box(x+.24,.065,y+.32,.11,.12,.13,t.accent);
    }
    for(const cell of a.obstacles.slice(0,2048)){
      const p=pos(cell,w);b.box(p.x,.72,p.z,.90,1.44,.90,t.wall);
      b.box(p.x,1.48,p.z,.96,.08,.96,t.accent);
    }
    for(const cell of a.cover.slice(0,2048)){
      const p=pos(cell,w);b.box(p.x,.32,p.z,.72,.64,.72,t.wall);
      b.box(p.x,.67,p.z,.76,.07,.76,t.accent);
    }
    for(const item of a.loot.slice(0,100)){
      const p=pos(item.cell,w);b.box(p.x,.09,p.z,.48,.18,.48,t.wall);
      b.box(p.x,.30,p.z,.24,.25,.24,[1,.80,.35]);
      b.box(p.x,.51,p.z,.10,.18,.10,[.60,.96,1]);
    }
    for(const f of s.combatants.slice(0,64))contender(b,f,w,t,Boolean(s.focus&&s.focus.id===f.id));
    const c=pos(s.zone.centerCell,w);
    b.ring(c.x,.056,c.z,Math.max(.25,s.zone.radius),.08,t.accent,128);
    // High-priority tactical signals, derived exclusively from published semantic events.
    if(!reducedFlash){
      for(const event of s.recentEvents.slice(-8)){
        if((event.type==='elimination'||event.type==='shield-broken')&&Number.isInteger(event.cell)){
          const p=pos(event.cell,w);
          b.ring(p.x,.075,p.z,.32,.048,[1,.25,.32],24);
        }
      }
    }
    b.box(w/2,.15,-.1,w+.35,.3,.2,t.wall);
    b.box(w/2,.15,h+.1,w+.35,.3,.2,t.wall);
    b.box(-.1,.15,h/2,.2,.3,h+.35,t.wall);
    b.box(w+.1,.15,h/2,.2,.3,h+.35,t.wall);
    for(const [x,z] of [[0,0],[w,0],[0,h],[w,h]]){
      b.box(x,1.04,z,.35,2.08,.35,t.wall);
      b.box(x,2.16,z,.54,.24,.54,t.accent);
    }
  }
  function paint(snapshot){
    const startSubmit=performance.now();
    if(disabled||!gl||gl.isContextLost()||status.mode!=='webgl2')return false;
    if(!snapshot?.arena||!snapshot.zone||!Array.isArray(snapshot.combatants))return false;
    try{
      const area=host.getBoundingClientRect();
      if(area.width<1||area.height<1)return false;
      const ratio=Math.min(1.5,Math.max(1,devicePixelRatio||1));
      const width=Math.min(3840,Math.max(1,Math.round(area.width*ratio)));
      const height=Math.min(2160,Math.max(1,Math.round(area.height*ratio)));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
      gl.viewport(0,0,width,height);
      const b=mesh();
      const alpha=Math.min(1,Math.max(0,(performance.now()-startedAt)/200));
      const prior=previousSnapshot&&previousSnapshot.runToken===snapshot.runToken
        ? new Map(previousSnapshot.combatants.map(f=>[f.id,f])):new Map();
      const presented=reducedMotion?snapshot:{
        ...snapshot,
        combatants:snapshot.combatants.map(f=>{
          const previous=prior.get(f.id);
          if(!previous||!previous.alive||!f.alive||previous.cell===f.cell)return f;
          const from=pos(previous.cell,snapshot.arena.width),to=pos(f.cell,snapshot.arena.width);
          if(Math.abs(from.x-to.x)+Math.abs(from.z-to.z)>2)return f;
          return {...f,visual:{x:from.x+(to.x-from.x)*alpha,z:from.z+(to.z-from.z)*alpha}};
        })
      };
      world(b,presented);
      const data=new Float32Array(b.v),w=snapshot.arena.width,h=snapshot.arena.height;
      const aspect=area.width/area.height;
      const scale=Math.min(1.87/((w*.61+h*.79)*.52+5),1.87*aspect/(w*.79+h*.61+4));
      gl.useProgram(program);
      const close=snapshot.scene==='final-circle';
      const focus=close?pos(snapshot.zone.centerCell,w):{x:w/2,z:h/2};
      const zoom=close?1.12:1;
      gl.uniform3f(uniform[0],focus.x,0,focus.z);
      gl.uniform2f(uniform[1],scale*zoom/aspect,scale*zoom);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
      for(let i=0;i<3;i++){
        gl.enableVertexAttribArray(attr[i]);
        gl.vertexAttribPointer(attr[i],3,gl.FLOAT,false,36,i*12);
      }
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES,0,data.length/9);
      status.frames++;status.triangles=data.length/27;
      frameSamples.push(performance.now()-startSubmit);
      if(frameSamples.length>90)frameSamples.shift();
      const ordered=[...frameSamples].sort((a,b)=>a-b);
      status.p95SubmitMs=Number(ordered[Math.max(0,Math.ceil(ordered.length*.95)-1)].toFixed(2));
      status.contenders=snapshot.combatants.filter(f=>f.alive).length;
      canvas.dataset.renderer='webgl2';
      canvas.dataset.triangles=String(status.triangles);
      canvas.dataset.contenders=String(status.contenders);
      return true;
    }catch{
      disabled=true;status.mode='fallback-2d';
      document.body.dataset.battleRenderer='2d-fallback';
      canvas.style.display='none';return false;
    }
  }
  function animate(time){
    animationId=0;
    if(disabled||!lastSnapshot||status.mode!=='webgl2'||document.hidden)return;
    if(time-lastPaintTime>=42){paint(lastSnapshot);lastPaintTime=time}
    if(time-startedAt<230)animationId=requestAnimationFrame(animate);
  }
  function render(snapshot){
    if(!snapshot)return false;
    previousSnapshot=lastSnapshot&&lastSnapshot.runToken===snapshot.runToken?lastSnapshot:null;
    lastSnapshot=snapshot;
    startedAt=performance.now();
    const painted=paint(snapshot);
    if(painted&&!reducedMotion&&!animationId)animationId=requestAnimationFrame(animate);
    return painted;
  }
  window.BattleArena3D={render,status};
})();