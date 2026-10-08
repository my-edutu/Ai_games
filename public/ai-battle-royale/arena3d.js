'use strict';
/* Gauntlet WebGL2 viewport. Cosmetic only; consumes sanitized render snapshots. */
(()=>{
  const params=new URLSearchParams(location.search);
  const forced2d=params.get('visual')==='2d';
  const quality=params.get('quality')==='low'?'low':'high';
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
    'uniform float uYaw; uniform float uPitch; uniform float uPerspective;',
    'out vec3 vNormal; out vec3 vTint; out float vDepth; out vec3 vWorld;',
    'void main(){',
    'vec3 p=pos-center;',
    'float cy=cos(uYaw),sy=sin(uYaw);',
    'float cp=cos(uPitch),sp=sin(uPitch);',
    'float east=p.x*cy-p.z*sy;',
    'float along=p.x*sy+p.z*cy;',
    'float up=p.y*cp-along*sp;',
    'float depth=p.y*sp+along*cp;',
    'float cameraW=max(0.55,1.0+depth*uPerspective);',
    'gl_Position=vec4(east*scale.x,up*scale.y,-depth/80.0,cameraW);',
    'vNormal=normal;vTint=tint;vDepth=depth;vWorld=pos;',
    '}'
  ].join('\n');
  const fragmentSource=[
    '#version 300 es',
    'precision highp float;',
    'in vec3 vNormal; in vec3 vTint; in float vDepth; in vec3 vWorld;',
    'out vec4 result;',
    'void main(){',
    'vec3 n=normalize(vNormal);',
    'float direct=max(dot(n,normalize(vec3(-.52,.90,.34))),0.0);',
    'float bounce=max(dot(n,normalize(vec3(.38,.54,-.72))),0.0);',
    'float surfaceNoise=fract(sin(dot(floor(vWorld.xz*6.0),vec2(127.1,311.7)))*43758.5453123);',
    'float textureGrain=mix(.955,1.045,surfaceNoise);',
    'float ground=step(.88,n.y);',
    'float micro=ground*textureGrain+(1.0-ground)*1.0;',
    'float fill=.54+.43*direct+.10*bounce;',
    'vec3 lit=vTint*fill*micro+vec3(.043,.054,.067);',
    'float silhouette=pow(1.0-max(dot(n,normalize(vec3(.2,.8,.5))),0.0),2.0);',
    'lit+=vec3(.036,.071,.085)*silhouette;',
    'float haze=clamp(1.0-abs(vDepth)/98.0,.72,1.0);',
    'result=vec4(mix(vec3(.065,.103,.135),lit,haze),1.0);',
    '}'
  ].join('\n');
  let canvas=null,closeupLabel=null,gl=null,program=null,buffer=null,staticBuffer=null,dynamicBuffer=null,attr=null,uniform=null,lastSnapshot=null,disabled=forced2d||!host;
  const reducedMotion=params.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedFlash=params.get('reducedFlash')==='1';
  let previousSnapshot=null,startedAt=0,animationId=0,lastPaintTime=0;
  const status={mode:forced2d?'forced-2d':'initializing',frames:0,triangles:0,contenders:0,p95SubmitMs:0,sceneBuilds:0,quality:quality};
  const staticCache={key:null,vertices:0};
  const frameSamples=[];
  const headings=new Map();
  let headingRunToken='';
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
    uniform=['center','scale','uYaw','uPitch','uPerspective'].map(name=>gl.getUniformLocation(program,name));
    staticBuffer=gl.createBuffer();dynamicBuffer=gl.createBuffer();
    staticCache.key=null;staticCache.vertices=0;
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);gl.clearColor(.065,.103,.135,1);
    status.mode='webgl2';document.body.dataset.battleRenderer='webgl2';
  }
  if(!disabled){
    canvas=document.createElement('canvas');
    canvas.className='battle-webgl3d';
    canvas.dataset.testid='battle-3d-canvas';
    canvas.setAttribute('aria-hidden','true');
    host.appendChild(canvas);
    closeupLabel=document.createElement('div');
    closeupLabel.className='battle-3d-focus';
    closeupLabel.setAttribute('aria-label','Live action closeup');
    closeupLabel.textContent='● LIVE ACTION // AI SPECTATOR';
    host.appendChild(closeupLabel);
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
    let pose=null;
    function pushPose(x,z,angle){
      pose={x,z,c:Math.cos(angle),s:Math.sin(angle)};
    }
    function popPose(){pose=null}
    function tri(a,b,c,n,col){
      let normal=n;
      if(pose)normal=[n[0]*pose.c+n[2]*pose.s,n[1],-n[0]*pose.s+n[2]*pose.c];
      for(const point of [a,b,c]){
        const p=pose?[
          pose.x+(point[0]-pose.x)*pose.c+(point[2]-pose.z)*pose.s,
          point[1],
          pose.z-(point[0]-pose.x)*pose.s+(point[2]-pose.z)*pose.c
        ]:point;
        v.push(p[0],p[1],p[2],...normal,...col);
      }
    }
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

    // Smooth faceted primitives: original geometry, no third-party models/assets.
    function cone(x,y,z,rBottom,rTop,h,col,segments=9){
      const bottom=y-h/2,top=y+h/2;
      for(let i=0;i<segments;i++){
        const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
        const direction=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];
        const a0=[x+Math.cos(a)*rBottom,bottom,z+Math.sin(a)*rBottom];
        const b0=[x+Math.cos(b)*rBottom,bottom,z+Math.sin(b)*rBottom];
        const a1=[x+Math.cos(a)*rTop,top,z+Math.sin(a)*rTop];
        const b1=[x+Math.cos(b)*rTop,top,z+Math.sin(b)*rTop];
        quad(a0,b0,b1,a1,direction,col);
        tri([x,top,z],a1,b1,[0,1,0],col);
        tri([x,bottom,z],b0,a0,[0,-1,0],col);
      }
    }
    function cylinder(x,y,z,r,h,col,segments=9){cone(x,y,z,r,r,h,col,segments)}
    function limb(start,end,r,col){
      const dx=end[0]-start[0],dy=end[1]-start[1],dz=end[2]-start[2];
      const len=Math.hypot(dx,dy,dz)||1;
      const direction=[dx/len,dy/len,dz/len];
      const ref=Math.abs(direction[1])>.92?[1,0,0]:[0,1,0];
      let u=[direction[1]*ref[2]-direction[2]*ref[1],direction[2]*ref[0]-direction[0]*ref[2],direction[0]*ref[1]-direction[1]*ref[0]];
      const ul=Math.hypot(...u)||1;u=u.map(n=>n/ul);
      const v=[direction[1]*u[2]-direction[2]*u[1],direction[2]*u[0]-direction[0]*u[2],direction[0]*u[1]-direction[1]*u[0]];
      const axes=[[u[0]+v[0],u[1]+v[1],u[2]+v[2]],[u[0]-v[0],u[1]-v[1],u[2]-v[2]],
        [-u[0]-v[0],-u[1]-v[1],-u[2]-v[2]],[-u[0]+v[0],-u[1]+v[1],-u[2]+v[2]]];
      for(let i=0;i<4;i++){
        const a=axes[i],b=axes[(i+1)%4];
        const startA=start.map((n,k)=>n+a[k]*r),startB=start.map((n,k)=>n+b[k]*r);
        const endA=end.map((n,k)=>n+a[k]*r),endB=end.map((n,k)=>n+b[k]*r);
        const n=axes[i].map((value,k)=>value+axes[(i+1)%4][k]);
        quad(startA,startB,endB,endA,n,col);
      }
    }
    function blade(x,y,z,width,height,col){
      quad([x-width/2,y,z],[x,y+height,z],[x+width/2,y,z],[x-width/2,y,z],[0,0,1],col);
    }
    return{v,quad,box,ring,cone,cylinder,limb,blade,pushPose,popPose};
  }
  function pos(cell,w){return{x:cell%w+.5,z:Math.floor(cell/w)+.5}}
  function actorHeading(f,w,events,roster){
    // Orientation is derived from *visible* events and last public movement only.
    const attack=events.slice(-12).reverse().find(e=>e.actorId===f.id&&(e.type==='hit'||e.type==='miss'));
    const target=attack?.targetId?roster.find(c=>c.id===attack.targetId):null;
    const prior=previousSnapshot?.combatants.find(c=>c.id===f.id);
    const to=target&&target.alive&&target.cell!==f.cell?pos(target.cell,w):pos(f.cell,w);
    const from=target&&target.alive&&target.cell!==f.cell?pos(f.cell,w):
      prior&&prior.cell!==f.cell?pos(prior.cell,w):null;
    if(from){
      const dx=to.x-from.x,dz=to.z-from.z;
      if(Math.abs(dx)+Math.abs(dz)>.01){
        const angle=Math.atan2(dx,dz);
        headings.set(f.id,angle);
        return angle;
      }
    }
    return headings.get(f.id)??0;
  }
  function contender(b,f,w,theme,focus,events,roster){
    const p=f.visual||pos(f.cell,w);
    const dead=!f.alive;
    const neutral=[.075,.115,.17],undersuit=[.13,.20,.25],steel=[.28,.39,.43],helmet=[.62,.72,.74];
    const roleArmor={
      vanguard:{main:[.94,.35,.24],trim:[1,.76,.47],shoulders:.30,backpack:.25},
      ranger:{main:[.20,.76,.90],trim:[.70,.95,.99],shoulders:.16,backpack:.13},
      scavenger:{main:[.98,.69,.25],trim:[1,.85,.49],shoulders:.20,backpack:.34},
      tactician:{main:[.49,.81,.46],trim:[.79,.96,.70],shoulders:.18,backpack:.23}
    }[f.archetype]||{main:suits.vanguard,trim:steel,shoulders:.2,backpack:.2};
    if(dead){
      b.box(p.x,.07,p.z,.74,.10,.58,neutral);
      b.cylinder(p.x,.13,p.z,.26,.12,roleArmor.main,8);
      b.ring(p.x,.08,p.z,.38,.035,[.72,.25,.27],20);
      return;
    }
    b.pushPose(p.x,p.z,actorHeading(f,w,events,roster));
    const prev=previousSnapshot?.combatants.find(c=>c.id===f.id);
    const moving=Boolean(prev&&prev.cell!==f.cell);
    const walkPhase=(!reducedMotion&&moving)?Math.sin(performance.now()/125+f.cell*.23):0;
    const bob=Math.abs(walkPhase)*.055;
    const cx=p.x,cz=p.z;
    const dark=[.07,.12,.16];
    b.box(cx,.032,cz,.67,.026,.56,dark); // soft contact silhouette
    b.ring(cx,.053,cz,.31,.028,[.21,.32,.36],16);
    const hipY=.73+bob,hipLeft=[cx-.14,hipY,cz],hipRight=[cx+.14,hipY,cz];
    const leftKnee=[cx-.18,.39+bob+walkPhase*.105,cz+walkPhase*.15];
    const rightKnee=[cx+.18,.39+bob-walkPhase*.105,cz-walkPhase*.15];
    const leftFoot=[cx-.19,.14,cz+walkPhase*.30+.07];
    const rightFoot=[cx+.19,.14,cz-walkPhase*.30+.07];
    b.limb(hipLeft,leftKnee,.100,undersuit);
    b.limb(leftKnee,leftFoot,.080,steel);
    b.limb(hipRight,rightKnee,.100,undersuit);
    b.limb(rightKnee,rightFoot,.080,steel);
    b.box(leftFoot[0],.095,leftFoot[2]+.085,.23,.16,.32,neutral);
    b.box(rightFoot[0],.095,rightFoot[2]+.085,.23,.16,.32,neutral);
    b.cone(cx,hipY+.18,cz,.29,.36,.34,undersuit,8); // armored waist
    b.cone(cx,hipY+.59,cz,.33,.255,.68,roleArmor.main,10); // shaped chest
    b.box(cx,hipY+.65,cz+.24,.43,.35,.09,roleArmor.trim); // ballistic breast plate
    b.box(cx,hipY+.36,cz+.26,.33,.09,.10,neutral); // utility belt
    b.box(cx,hipY+.63,cz-roleArmor.backpack,.43,.47,.16,neutral);
    b.cylinder(cx,hipY+.99,cz,.13,.16,undersuit,8);
    const shoulderY=hipY+.87,elbowZ=cz+.15,handZ=cz+.41;
    b.cone(cx-.38,shoulderY,cz,roleArmor.shoulders,.16,.22,roleArmor.trim,7);
    b.cone(cx+.38,shoulderY,cz,roleArmor.shoulders,.16,.22,roleArmor.trim,7);
    b.limb([cx-.36,shoulderY,cz],[cx-.36,hipY+.53,elbowZ],.095,roleArmor.main);
    b.limb([cx-.36,hipY+.53,elbowZ],[cx-.20,hipY+.64,handZ],.080,undersuit);
    b.limb([cx+.36,shoulderY,cz],[cx+.36,hipY+.53,elbowZ],.095,roleArmor.main);
    b.limb([cx+.36,hipY+.53,elbowZ],[cx+.24,hipY+.65,handZ],.080,undersuit);
    b.cylinder(cx,hipY+1.19,cz,.245,.30,helmet,10); // modeled head
    b.cone(cx,hipY+1.38,cz,.268,.17,.18,roleArmor.main,10);
    b.box(cx,hipY+1.22,cz+.24,.33,.115,.06,[.065,.19,.25]); // visor
    b.box(cx,hipY+1.11,cz+.22,.23,.045,.075,steel); // mask
    b.box(cx,hipY+1.42,cz,.35,.05,.23,roleArmor.trim); // crest
    if(f.archetype==='vanguard'){
      b.box(cx-.42,shoulderY-.08,cz,.20,.32,.34,steel);
      b.box(cx+.42,shoulderY-.08,cz,.20,.32,.34,steel);
    }else if(f.archetype==='ranger'){
      b.limb([cx+.15,hipY+1.45,cz],[cx+.20,hipY+1.78,cz-.03],.023,roleArmor.trim);
      b.cone(cx+.20,hipY+1.79,cz-.03,.055,.01,.13,roleArmor.trim,6);
    }else if(f.archetype==='scavenger'){
      b.box(cx,hipY+.51,cz-.40,.38,.50,.31,[.38,.27,.13]);
      b.cylinder(cx-.17,hipY+.55,cz-.47,.10,.28,roleArmor.trim,8);
    }else{
      b.box(cx-.39,hipY+1.12,cz,.12,.17,.15,theme.accent);
      b.ring(cx,hipY+1.54,cz,.21,.025,roleArmor.trim,20);
    }
    // Distinct modeled firearms stay presentation-only: they never determine hit legality.
    const weaponShade=f.weapon==='sniper'?[.31,.41,.45]:[.20,.24,.31];
    b.limb([cx+.05,hipY+.67,cz+.27],[cx+.05,hipY+.72,cz+.84],.085,weaponShade);
    b.box(cx+.06,hipY+.79,cz+.55,.15,.12,.35,neutral);
    b.cylinder(cx+.06,hipY+.72,cz+.92,.045,.12,steel,6);
    b.box(cx-.06,hipY+.48,cz+.45,.13,.24,.09,steel);
    const muzzleFlash=!reducedFlash&&events.some(e=>(e.type==='hit'||e.type==='miss')&&e.actorId===f.id);
    if(muzzleFlash){
      b.cone(cx+.06,hipY+.72,cz+1.04,.16,0,.28,[1,.88,.31],7);
      b.ring(cx+.06,hipY+.72,cz+1.0,.17,.05,[1,.42,.12],16);
    }
    const hp=Math.max(0,Math.min(1,f.health/Math.max(1,f.maxHealth)));
    const shield=Math.max(0,Math.min(1,f.shield/Math.max(1,f.maxShield)));
    b.box(cx,hipY+1.72,cz,.86,.085,.13,neutral);
    if(hp>0)b.box(cx-.43+.43*hp,hipY+1.73,cz+.01,.86*hp,.080,.13,[.97,.29,.35]);
    if(shield>0)b.box(cx-.43+.43*shield,hipY+1.82,cz,.86*shield,.065,.11,[.26,.78,1]);
    if(focus){
      b.ring(cx,.06,cz,.57,.048,roleArmor.trim,32);
      b.cone(cx,hipY+2.10,cz,.10,0,.27,roleArmor.trim,7);
    }
    b.popPose();
  }

  function worldLandmarks(b,arena,theme){
    // Decorative scenery stays on or beyond the perimeter, never fake cover.
    const w=arena.width,h=arena.height;
    function beacon(x,z,height){
      b.cone(x,height/2,z,.19,.13,height,theme.wall,8);
      b.cylinder(x,height,z,.38,.15,theme.accent,8);
      b.cone(x,height+.24,z,.12,0,.35,[.80,.94,.98],8);
      b.box(x+.20,height-.50,z,.08,.68,.13,[.08,.14,.20]);
    }
    for(let x=2;x<w-1;x+=5){
      beacon(x,-.32,x%2===0?1.9:2.4);
      beacon(x,h+.32,2.0);
      b.box(x,.024,.46,.83,.020,.045,theme.accent);
      b.box(x,.024,h-.46,.83,.020,.045,theme.accent);
    }
    for(let z=3;z<h-2;z+=6){
      beacon(-.32,z,1.9);beacon(w+.32,z,1.9);
    }
    for(let i=0;i<8;i++){
      const x=1+i*(w-2)/7,z=i%2===0?-1.05:h+1.05;
      if(arena.theme==='arctic'){
        b.cone(x,.48,z,.35,.09,.96,[.25,.40,.46],7);
        b.cone(x,.99,z,.27,0,.88,[.71,.88,.89],7);
      }else if(arena.theme==='neon'){
        b.box(x,.36,z,.58,.71,.53,[.15,.22,.37]);
        b.box(x,.75,z,.60,.10,.55,theme.accent);
        b.limb([x,.80,z],[x+.11,1.43,z],.034,[.44,.91,.98]);
      }else{
        b.cone(x,.35,z,.41,.31,.68,[.35,.27,.22],7);
        b.cone(x,.81,z,.32,.01,.53,[.54,.39,.30],7);
      }
    }
    // Stadium silhouette / warning rail.
    b.box(w/2,.07,-.10,w+.2,.13,.13,theme.accent);
    b.box(w/2,.07,h+.10,w+.2,.13,.13,theme.accent);
  }
  function combatEffects(b,s,theme){
    // Genuine combat cues, derived from existing authoritative event envelopes.
    const byId=new Map(s.combatants.map(f=>[f.id,f]));
    const w=s.arena.width;
    for(const event of s.recentEvents.slice(-12)){
      const actor=event.actorId?byId.get(event.actorId):null;
      const target=event.targetId?byId.get(event.targetId):null;
      if((event.type==='hit'||event.type==='miss'||event.type==='shield-broken')&&actor){
        const from=pos(actor.cell,w);
        const to=target?pos(target.cell,w):(Number.isInteger(event.cell)?pos(event.cell,w):null);
        if(to&&Math.abs(from.x-to.x)+Math.abs(from.z-to.z)>.2){
          const tint=event.type==='miss'?[.49,.83,1]:[1,.85,.35];
          b.limb([from.x,1.51,from.z],[to.x,1.16,to.z],.034,tint);
          b.cone(to.x,.86,to.z,.18,.01,.35,tint,8);
          if(event.type==='shield-broken')b.ring(to.x,.11,to.z,.48,.070,[.24,.72,1],24);
        }
      }
      if(event.type==='elimination'){
        const victim=target||(Number.isInteger(event.cell)?{cell:event.cell}:null);
        if(victim){
          const at=pos(victim.cell,w);
          b.ring(at.x,.13,at.z,.56,.08,[1,.27,.33],32);
          b.cone(at.x,.50,at.z,.26,0,.98,[.96,.26,.30],10);
          b.cone(at.x,1.11,at.z,.12,0,.45,[1,.77,.32],8);
        }
      }
      if(event.type==='pickup'&&actor){
        const at=pos(actor.cell,w);
        b.ring(at.x,.09,at.z,.45,.043,[.98,.84,.4],24);
      }
    }
  }

  function terrainDetails(b,arena,theme){
    // Pure, bounded coordinate variation: visual only, no new collision geometry.
    const width=arena.width,height=arena.height;
    const blocked=new Set(arena.obstacles);
    const palette={
      ember:{soil:[.18,.27,.24],growth:[.29,.44,.30],debris:[.44,.38,.31]},
      neon:{soil:[.16,.23,.37],growth:[.30,.55,.64],debris:[.38,.41,.56]},
      arctic:{soil:[.30,.43,.47],growth:[.52,.70,.72],debris:[.55,.60,.64]}
    }[arena.theme]||{soil:[.18,.27,.24],growth:[.29,.44,.30],debris:[.44,.38,.31]};
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const cell=y*width+x;
      if(blocked.has(cell))continue;
      const seed=(x*73856093^y*19349663)>>>0;
      const mark=seed%13;
      if(mark<=2){
        const cx=x+.17+((seed>>>3)%60)/100,cz=y+.13+((seed>>>6)%65)/100;
        b.quad([cx-.19,.018,cz-.10],[cx-.11,.018,cz+.18],[cx+.20,.018,cz+.15],
          [cx+.17,.018,cz-.12],[0,1,0],palette.soil);
      }
      if(mark===3||mark===4){
        const cx=x+.30,cz=y+.40;
        b.cone(cx,.11,cz,.15,.02,.22,palette.debris,6);
        b.cone(cx+.21,.085,cz+.18,.11,.01,.17,theme.wall,5);
      }
      if(mark===5||mark===8){
        // Tiny ankle-high grass or metallic scrub; never deceptive waist-high cover.
        const cx=x+.32,cz=y+.52;
        for(let i=0;i<3;i++){
          const dx=(i-1)*.07,dz=(i%2)*.065;
          b.limb([cx+dx,.018,cz+dz],[cx+dx*.68,.21+i*.021,cz+dz+.035],.017,palette.growth);
        }
      }
      if(mark===11){
        b.ring(x+.50,.015,y+.50,.24,.018,palette.debris,14);
      }
    }
    // Traversable centerline treatment: surface markings only, no obstacles.
    for(let x=0;x<width;x+=3){
      b.box(x+.55,.018,height/2,.78,.012,.036,palette.debris);
    }
  }
  function fortification(b,cell,width,theme,isCover){
    const p=pos(cell,width),x=p.x,z=p.z;
    if(isCover){
      // Knee-high modular concrete cover, faceted silhouette and caution stripe.
      b.box(x,.31,z,.79,.62,.80,theme.wall);
      b.box(x,.62,z,.84,.060,.85,[.23,.30,.35]);
      b.box(x,.67,z+.25,.68,.055,.055,theme.accent);
      for(const dx of [-.30,.30]){
        b.box(x+dx,.34,z+.416,.055,.50,.035,[.085,.14,.18]);
      }
    }else{
      // Tall legitimate obstacle shown as an industrial barricade with a beveled parapet.
      b.box(x,.65,z,.90,1.30,.90,theme.wall);
      b.box(x,1.33,z,.97,.090,.98,[.32,.39,.45]);
      b.box(x,1.44,z,.83,.11,.83,theme.accent);
      const variant=cell%4;
      if(variant===0||variant===2){
        b.box(x-.18,.69,z+.463,.09,.97,.045,[.10,.17,.22]);
        b.box(x+.18,.69,z+.463,.09,.97,.045,[.10,.17,.22]);
        b.box(x,.91,z+.488,.42,.10,.035,[.52,.60,.61]);
      }else{
        b.box(x,.68,z+.47,.58,.45,.055,[.13,.22,.28]);
        b.box(x,.69,z+.50,.47,.05,.060,theme.accent);
      }
      b.cylinder(x-.33,1.51,z-.34,.070,.13,[.14,.17,.20],6);
      b.cylinder(x+.33,1.51,z+.34,.070,.13,[.14,.17,.20],6);
    }
  }
  function atmosphericBackdrop(b,arena,theme){
    // Distant sculptural silhouettes beyond the tactical board boundary.
    // These are never passed into the game physics or agent observations.
    const w=arena.width,h=arena.height;
    const palette=arena.theme==='arctic'
      ?[[.44,.62,.67],[.30,.51,.60],[.68,.80,.82]]
      :arena.theme==='neon'
      ?[[.22,.33,.51],[.19,.27,.45],[.35,.47,.61]]
      :[[.32,.43,.39],[.23,.35,.34],[.42,.44,.37]];
    for(let i=0;i<9;i++){
      const x=i*(w+5)/8-2.5;
      const z=-2.5-(i%3)*.3;
      const height=1.4+(i*7%5)*.47;
      b.cone(x,height*.46,z,.72,.09,height,palette[i%3],7);
      if(i%2===0)b.cone(x+.42,height*.28,z+.5,.48,.07,height*.6,palette[(i+1)%3],6);
    }
    for(let i=0;i<8;i++){
      const x=i*(w+4)/7-2;
      const z=h+2.1+(i%3)*.25;
      b.cone(x,.63,z,.62,.18,1.26,palette[i%3],6);
    }
    // Big distant transmission mast anchors the skyline.
    b.cone(w*.5,1.5,-3.0,.23,.10,3.0,[.19,.27,.30],8);
    b.cylinder(w*.5,3.10,-3.0,.42,.12,theme.accent,10);
    b.cone(w*.5,3.55,-3.0,.14,0,.82,[.69,.89,.90],8);
  }

  function environmentProps(b,arena,theme){
    // Perimeter-only biome silhouettes. Decorative entities never enter AI rules.
    const w=arena.width,h=arena.height;
    for(let i=0;i<16;i++){
      const lane=i%2,idx=Math.floor(i/2);
      const x=1.3+idx*(w-2.6)/7,z=lane===0?-1.48:h+1.48;
      const height=1.3+((i*7)%5)*.26;
      if(arena.theme==='arctic'){
        const green=[.17,.39,.38],frost=[.73,.89,.89];
        b.cone(x,.60,z,.10,.065,1.19,[.30,.37,.39],8);
        for(let tier=0;tier<3;tier++){
          const y=.79+tier*.39,r=.58-tier*.11;
          b.cone(x,y,z,r,.03,.78,tier===2?frost:green,9);
        }
        b.cone(x,1.94,z,.12,0,.35,frost,8);
      }else if(arena.theme==='neon'){
        const magenta=[.64,.31,.76],electric=[.26,.85,.98];
        b.cylinder(x,.57,z,.21,1.12,[.20,.29,.41],8);
        b.cone(x,1.62,z,.35,.03,1.18,i%3===0?magenta:electric,7);
        for(const delta of [-.35,.35]){
          b.limb([x,.63,z],[x+delta,1.17,z+.11],.075,[.27,.35,.51]);
          b.cone(x+delta,1.27,z+.11,.14,.02,.37,electric,6);
        }
      }else if(arena.theme==='ember'){
        const trunk=[.40,.31,.24],crown=i%3===0?[.61,.47,.23]:[.31,.46,.31];
        b.cone(x,height*.46,z,.15,.095,height*.92,trunk,8);
        b.cylinder(x,height*.91,z,.24,.12,trunk,8);
        for(let leaf=0;leaf<5;leaf++){
          const a=leaf*Math.PI*2/5;
          const dx=Math.cos(a)*.53,dz=Math.sin(a)*.53;
          b.limb([x,height*.92,z],[x+dx,height*1.02,z+dz],.06,trunk);
          b.cone(x+dx,height*.96,z+dz,.36,.02,.44,crown,7);
        }
      }else{
        b.cone(x,.65,z,.42,.08,1.3,theme.wall,6);
      }
    }
  }
  function worldStatic(b,a){
    const w=a.width,h=a.height,t=colours[a.theme]||colours.ember;
    b.box(w/2,-.25,h/2,w,.5,h,t.wall);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const variation=(x*17+y*31+x*y*7)%11;
      const mult=variation<3?1.13:variation>8?.82:1;
      const tint=t.ground.map(v=>Math.min(1,v*mult));
      b.quad([x,.012,y],[x,.012,y+1],[x+1,.012,y+1],[x+1,.012,y],[0,1,0],tint);
      if((x*7+y*13)%41===0)b.box(x+.24,.065,y+.32,.11,.12,.13,t.accent);
    }
    if(quality!=='low')terrainDetails(b,a,t);
    for(const cell of a.obstacles.slice(0,2048)){
      if(quality==='low'){const p=pos(cell,w);b.box(p.x,.72,p.z,.91,1.44,.91,t.wall)}
      else fortification(b,cell,w,t,false);
    }
    for(const cell of a.cover.slice(0,2048)){
      if(quality==='low'){const p=pos(cell,w);b.box(p.x,.32,p.z,.75,.64,.75,t.wall)}
      else fortification(b,cell,w,t,true);
    }
    b.box(w/2,.15,-.1,w+.35,.3,.2,t.wall);
    b.box(w/2,.15,h+.1,w+.35,.3,.2,t.wall);
    b.box(-.1,.15,h/2,.2,.3,h+.35,t.wall);
    b.box(w+.1,.15,h/2,.2,.3,h+.35,t.wall);
    if(quality!=='low'){
      worldLandmarks(b,a,t);
      atmosphericBackdrop(b,a,t);
      environmentProps(b,a,t);
    }
    for(const [x,z] of [[0,0],[w,0],[0,h],[w,h]]){
      b.box(x,1.04,z,.35,2.08,.35,t.wall);
      b.box(x,2.16,z,.54,.24,.54,t.accent);
    }
  }

  function victorySequence(b,snapshot){
    // A purely cosmetic result sequence, never a fabricated winner.
    if(snapshot.scene!=='result'||!snapshot.result||
       snapshot.result.kind!=='game'||!snapshot.result.winnerId)return;
    const fighter=snapshot.combatants.find(c=>c.id===snapshot.result.winnerId);
    if(!fighter)return;
    const p=pos(fighter.cell,snapshot.arena.width);
    const gold=[1,.76,.30],copper=[.61,.33,.17];
    b.ring(p.x,.085,p.z,.80,.080,gold,48);
    b.ring(p.x,.09,p.z,1.10,.044,copper,48);
    for(let i=0;i<9;i++){
      const angle=Math.PI*2*i/9,x=p.x+Math.cos(angle)*.88,z=p.z+Math.sin(angle)*.88;
      b.cone(x,.40,z,.075,.020,.78,gold,6);
      if(!reducedFlash)b.cone(x,.85,z,.03,0,.24,[1,.94,.66],5);
    }
    b.cone(p.x,2.68,p.z,.31,.08,.38,gold,9);
    b.cylinder(p.x,2.89,p.z,.24,.075,copper,10);
    for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5;
      b.cone(p.x+Math.cos(angle)*.22,3.03,p.z+Math.sin(angle)*.22,.09,0,.29,gold,6);
    }
    if(!reducedMotion){
      const pulse=(Math.sin(performance.now()/460)+1)/2;
      b.ring(p.x,.14,p.z,1.21+.20*pulse,.035,[.98,.87,.43],48);
    }
  }
  function worldDynamic(b,s){
    const a=s.arena,w=a.width,t=colours[a.theme]||colours.ember;
    for(const item of a.loot.slice(0,100)){
      const p=pos(item.cell,w);
      b.box(p.x,.09,p.z,.48,.18,.48,t.wall);
      b.box(p.x,.30,p.z,.24,.25,.24,[1,.80,.35]);
      b.box(p.x,.51,p.z,.10,.18,.10,[.60,.96,1]);
    }
    for(const f of s.combatants.slice(0,64))contender(b,f,w,t,Boolean(s.focus&&s.focus.id===f.id),s.recentEvents,s.combatants);
    const c=pos(s.zone.centerCell,w);
    b.ring(c.x,.056,c.z,Math.max(.25,s.zone.radius),.08,t.accent,128);
    if(!reducedFlash){
      for(const event of s.recentEvents.slice(-8)){
        if((event.type==='elimination'||event.type==='shield-broken')&&Number.isInteger(event.cell)){
          const p=pos(event.cell,w);
          b.ring(p.x,.075,p.z,.32,.048,[1,.25,.32],24);
        }
      }
    }
    combatEffects(b,s,t);
    victorySequence(b,s);
  }
  function bindSceneBuffer(buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(let i=0;i<3;i++){
      gl.enableVertexAttribArray(attr[i]);
      gl.vertexAttribPointer(attr[i],3,gl.FLOAT,false,36,i*12);
    }
  }
  let dynamicVertexCount=0;
  function drawScene(){
    bindSceneBuffer(staticBuffer);
    if(staticCache.vertices)gl.drawArrays(gl.TRIANGLES,0,staticCache.vertices);
    bindSceneBuffer(dynamicBuffer);
    if(dynamicVertexCount)gl.drawArrays(gl.TRIANGLES,0,dynamicVertexCount);
  }

  function spectatorCloseup(snapshot,area){
    // Second camera pass views the SAME public geometry: no synthetic battles,
    // no hidden outcome changes, no second simulation.
    if(area.width<950||area.height<450||snapshot.scene==='recovery')return;
    const recent=snapshot.recentEvents.slice(-8).reverse()
      .find(event=>event.importance>=3&&(event.targetId||event.actorId));
    const id=snapshot.scene==='result'&&snapshot.result?.kind==='game'&&snapshot.result?.winnerId
      ?snapshot.result.winnerId:(recent?.targetId||recent?.actorId||snapshot.focus?.id);
    const focal=snapshot.combatants.find(f=>f.id===id&&f.alive)
      ||snapshot.combatants.find(f=>f.alive);
    if(!focal)return;
    if(closeupLabel){
      const title=snapshot.scene==='result'&&snapshot.result?.winnerId===focal.id?'CHAMPION':'LIVE ACTION';
      closeupLabel.textContent=title+'  //  '+String(focal.name||focal.archetype||'CONTENDER').slice(0,30).toUpperCase();
    }
    const p=pos(focal.cell,snapshot.arena.width);
    const frameW=Math.max(1,Math.round(canvas.width*.27));
    const frameH=Math.max(1,Math.round(canvas.height*.27));
    const frameX=Math.round(canvas.width*.705);
    const frameY=Math.round(canvas.height*.65);
    const aspect=frameW/frameH;
    const zoom=.43;
    gl.enable(gl.SCISSOR_TEST);
    try{
      gl.scissor(frameX,frameY,frameW,frameH);
      gl.viewport(frameX,frameY,frameW,frameH);
      gl.clearColor(.055,.103,.145,1);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform3f(uniform[0],p.x,.8,p.z);
      gl.uniform2f(uniform[1],zoom/aspect,zoom);
      gl.uniform1f(uniform[2],.95);
      gl.uniform1f(uniform[3],.43);
      gl.uniform1f(uniform[4],.032);
      drawScene();
    }finally{
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(.065,.103,.135,1);
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
      const a=snapshot.arena;
      const key=JSON.stringify([a.width,a.height,a.theme,a.obstacles,a.cover,quality]);
      if(key!==staticCache.key){
        const staticBuilder=mesh();
        worldStatic(staticBuilder,a);
        const fixed=new Float32Array(staticBuilder.v);
        bindSceneBuffer(staticBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,fixed,gl.STATIC_DRAW);
        staticCache.key=key;
        staticCache.vertices=fixed.length/9;
        status.sceneBuilds++;
      }
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
      worldDynamic(b,presented);
      const data=new Float32Array(b.v),w=snapshot.arena.width,h=snapshot.arena.height;
      const aspect=area.width/area.height;
      const scale=Math.min(1.87/((w*.61+h*.79)*.52+5),1.87*aspect/(w*.79+h*.61+4));
      gl.useProgram(program);
      const close=snapshot.scene==='final-circle';
      const winner=snapshot.scene==='result'&&snapshot.result?.kind==='game'
        ?snapshot.combatants.find(f=>f.id===snapshot.result?.winnerId):null;
      const focus=winner?pos(winner.cell,w):(close?pos(snapshot.zone.centerCell,w):{x:w/2,z:h/2});
      const zoom=winner?1.20:(close?1.15:1.10);
      gl.uniform3f(uniform[0],focus.x,0,focus.z);
      gl.uniform2f(uniform[1],scale*zoom/aspect,scale*zoom);
      gl.uniform1f(uniform[2],.65+(reducedMotion?0:Math.sin(performance.now()/18000)*.035));
      gl.uniform1f(uniform[3],.56);
      gl.uniform1f(uniform[4],.013);
      bindSceneBuffer(dynamicBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
      dynamicVertexCount=data.length/9;
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      drawScene();
      spectatorCloseup(snapshot,area);
      status.frames++;status.triangles=(data.length/9+staticCache.vertices)/3;
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
    if(headingRunToken!==snapshot.runToken){
      headings.clear();headingRunToken=snapshot.runToken;
    }
    previousSnapshot=lastSnapshot&&lastSnapshot.runToken===snapshot.runToken?lastSnapshot:null;
    lastSnapshot=snapshot;
    startedAt=performance.now();
    const painted=paint(snapshot);
    if(painted&&!reducedMotion&&!animationId)animationId=requestAnimationFrame(animate);
    return painted;
  }
  window.BattleArena3D={render,status};
})();