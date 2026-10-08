'use strict';
/* Gauntlet WebGL2 viewport. Cosmetic only; consumes sanitized render snapshots. */
(()=>{
  const params=new URLSearchParams(location.search);
  const forced2d=params.get('visual')==='2d';
  const quality=params.get('quality')==='low'?'low':'high';
  const cameraPreference=params.get('camera')==='hero'?'hero'
    :params.get('camera')==='tactical'?'tactical':'broadcast';
  function selectCameraMode(snapshot){
    if(cameraPreference!=='broadcast')return cameraPreference;
    const alive=snapshot.combatants.filter(f=>f.alive).length;
    return alive<=6||snapshot.scene==='final-circle'||snapshot.scene==='result'?'hero':'tactical';
  }
  const tactical=document.querySelector('[data-testid="battle-canvas"]');
  const host=tactical?.parentElement;
  const colours={
    ember:{ground:[.26,.34,.25],wall:[.38,.48,.46],accent:[1,.66,.24]},
    neon:{ground:[.15,.24,.40],wall:[.31,.41,.64],accent:[.23,.96,1]},
    arctic:{ground:[.34,.54,.61],wall:[.53,.69,.75],accent:[.69,.96,1]}
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
    'uniform sampler2D uSurfaceAtlas;',
    'uniform float uBiomeRow; uniform float uAtlasReady; uniform float uSurfaceStrength;',
    'out vec4 result;',
    'float hash21(vec2 p){',
    'return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);',
    '}',
    'void main(){',
    'vec3 n=normalize(vNormal);',
    'vec3 lightDir=normalize(vec3(-.52,.90,.34));',
    'vec3 viewDir=normalize(vec3(.24,.85,1.03));',
    'float diffuse=max(dot(n,lightDir),0.0);',
    'float bounce=max(dot(n,normalize(vec3(.46,.54,-.72))),0.0);',
    'float grain=hash21(floor(vWorld.xz*10.0));',
    'float grainFine=hash21(floor(vWorld.xz*32.0+19.4));',
    'float ground=step(.72,n.y);',
    'float natural=(grain*.62+grainFine*.38);',
    'float surfaceNoise=mix(1.0,mix(.92,1.10,natural),ground);',
    'float roughness=mix(.78,.32,smoothstep(.36,.88,vTint.b));',
    'vec3 halfDir=normalize(viewDir+lightDir);',
    'float specPower=mix(14.0,66.0,1.0-roughness);',
    'float specular=pow(max(0.0,dot(n,halfDir)),specPower);',
    'vec3 ambient=vec3(.20,.24,.33);',
    'vec3 axisUV=abs(n.x)>abs(n.z)?vWorld.zyx:vWorld.xyz;',
    'vec2 uv=abs(n.y)>.72?fract(vWorld.xz*.31):fract(axisUV.yz*.72);',
    'float column=abs(n.y)>.72?0.0:1.0;',
    'vec2 atlasUV=(vec2(column,uBiomeRow)+uv*.98+.01)/vec2(2.0,3.0);',
    'vec3 texel=texture(uSurfaceAtlas,atlasUV).rgb;',
    'vec3 materialColor=mix(vTint,vTint*(texel*.93+.58),uAtlasReady*uSurfaceStrength);',
    'vec3 lit=materialColor*(ambient+vec3(.53,.51,.43)*diffuse+vec3(.14,.18,.23)*bounce)*surfaceNoise;',
    'lit+=vec3(.18,.23,.31)*specular*(.14+.30*(1.0-roughness));',
    'float rim=pow(1.0-max(0.0,dot(n,viewDir)),2.0);',
    'lit+=vTint*rim*.10;',
    'float vibrant=max(vTint.r,max(vTint.g,vTint.b))-min(vTint.r,min(vTint.g,vTint.b));',
    'float luminous=smoothstep(.68,.98,max(vTint.r,max(vTint.g,vTint.b)))*vibrant;',
    'lit+=vTint*luminous*.16;',
    'float haze=clamp(1.0-abs(vDepth)/138.0,.76,1.0);',
    'vec3 finalColor=mix(vec3(.17,.28,.44),lit,haze);',
    'finalColor=clamp(finalColor,vec3(0.0),vec3(1.0));',
    'result=vec4(finalColor,1.0);',
    '}'
  ].join('\n');
  let canvas=null,closeupLabel=null,plateLayer=null,gl=null,program=null,buffer=null,staticBuffer=null,dynamicBuffer=null,attr=null,uniform=null,lastSnapshot=null,disabled=forced2d||!host;
  let surfaceAtlasImage=null,surfaceAtlasTexture=null,surfaceAtlasRequested=false;
  const reducedMotion=params.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedFlash=params.get('reducedFlash')==='1';
  let previousSnapshot=null,startedAt=0,animationId=0,lastPaintTime=0;
  const status={mode:forced2d?'forced-2d':'initializing',frames:0,triangles:0,contenders:0,p95SubmitMs:0,sceneBuilds:0,quality:quality,activeEffects:0,lastError:null,cameraMode:'tactical',materialAtlas:'fallback'};
  const staticCache={key:null,vertices:0};
  const frameSamples=[];
  const headings=new Map();
  let headingRunToken='';
  const visualEffects=[];
  const observedSequences=new Set();
  let visualEventRunToken='';
  const VISUAL_LIFETIME_MS=1350;
  const MAX_VISUAL_EVENTS=24;
  const MAX_SEEN_SEQUENCES=128;
  function ingestVisualEvents(snapshot){
    if(visualEventRunToken!==snapshot.runToken){
      visualEventRunToken=snapshot.runToken;
      observedSequences.clear();
      visualEffects.length=0;
    }
    const now=performance.now();
    const actors=new Map(snapshot.combatants.map(f=>[f.id,f]));
    const valid=['hit','miss','shield-broken','elimination','pickup','zone-shrink'];
    for(const event of snapshot.recentEvents.slice(-16)){
      if(!valid.includes(event.type)||!Number.isSafeInteger(event.sequence))continue;
      if(observedSequences.has(event.sequence))continue;
      observedSequences.add(event.sequence);
      const source=event.actorId?actors.get(event.actorId):null;
      const target=event.targetId?actors.get(event.targetId):null;
      const location=target?.cell??(Number.isInteger(event.cell)?event.cell:undefined);
      visualEffects.push({
        sequence:event.sequence,
        event,
        born:now,
        from:source?.cell,
        cell:location,
      });
    }
    if(visualEffects.length>MAX_VISUAL_EVENTS)
      visualEffects.splice(0,visualEffects.length-MAX_VISUAL_EVENTS);
    // Prevent an unbounded session-long sequence set; very old effects cannot recur.
    if(observedSequences.size>MAX_SEEN_SEQUENCES){
      const recent=visualEffects.map(f=>f.sequence);
      observedSequences.clear();
      for(const sequence of recent)observedSequences.add(sequence);
    }
  }
  function activeVisualEvents(){
    const now=performance.now();
    for(let i=visualEffects.length-1;i>=0;i--)
      if(now-visualEffects[i].born>VISUAL_LIFETIME_MS)visualEffects.splice(i,1);
    return visualEffects;
  }
  function compile(type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(error)}
    return shader;
  }
  function uploadSurfaceAtlas(){
    if(!gl||typeof gl.createTexture!=='function'||!surfaceAtlasImage?.complete||
      surfaceAtlasImage.naturalWidth<1)return;
    try{
      if(surfaceAtlasTexture&&typeof gl.deleteTexture==='function')gl.deleteTexture(surfaceAtlasTexture);
      surfaceAtlasTexture=gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,surfaceAtlasTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,surfaceAtlasImage);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D,null);
      status.materialAtlas='ready';
    }catch(error){
      surfaceAtlasTexture=null;
      status.materialAtlas='fallback';
      status.lastError='Material atlas fallback: '+String(error?.message||error).slice(0,108);
    }
  }
  function requestSurfaceAtlas(){
    if(surfaceAtlasRequested||typeof Image==='undefined')return;
    surfaceAtlasRequested=true;
    const source=new Image();
    source.onload=()=>{
      surfaceAtlasImage=source;
      uploadSurfaceAtlas();
      if(lastSnapshot&&!disabled&&status.mode==='webgl2')render(lastSnapshot);
    };
    source.onerror=()=>{status.materialAtlas='fallback'};
    source.src='/battle/material-atlas.svg';
  }
  function initialize(){
    const v=compile(gl.VERTEX_SHADER,vertexSource),f=compile(gl.FRAGMENT_SHADER,fragmentSource);
    program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
    gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('shader-link');
    attr=['pos','normal','tint'].map(name=>gl.getAttribLocation(program,name));
    uniform=['center','scale','uYaw','uPitch','uPerspective','uBiomeRow','uAtlasReady','uSurfaceStrength','uSurfaceAtlas'].map(name=>gl.getUniformLocation(program,name));
    staticBuffer=gl.createBuffer();dynamicBuffer=gl.createBuffer();
    surfaceAtlasTexture=null;status.materialAtlas='fallback';
    uploadSurfaceAtlas();
    staticCache.key=null;staticCache.vertices=0;
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
    status.mode='webgl2';status.lastError=null;document.body.dataset.battleRenderer='webgl2';
    requestSurfaceAtlas();
  }
  if(!disabled){
    canvas=document.createElement('canvas');
    canvas.className='battle-webgl3d';
    canvas.dataset.testid='battle-3d-canvas';
    canvas.setAttribute('aria-hidden','true');
    host.appendChild(canvas);
    // Optional overlay: unavailable in headless lightweight contexts, and
    // never creates a dependency for the real, authoritative 2D fallback.
    plateLayer=document.createElement('div');
    plateLayer.className='battle-3d-nameplates';
    if(typeof plateLayer.appendChild==='function')host.appendChild(plateLayer);
    else plateLayer=null;
    closeupLabel=document.createElement('div');
    closeupLabel.className='battle-3d-focus';
    closeupLabel.setAttribute('aria-label','Live action closeup');
    closeupLabel.textContent='● LIVE ACTION // AI SPECTATOR';
    host.appendChild(closeupLabel);
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();status.mode='context-lost';status.lastError='WebGL context lost';canvas.style.display='none';
      document.body.dataset.battleRenderer='2d-fallback';
    });
    canvas.addEventListener('webglcontextrestored',()=>{
      try{initialize();canvas.style.display='';if(lastSnapshot)render(lastSnapshot)}
      catch(error){status.mode='fallback-2d';status.lastError=String(error?.message||error).slice(0,180);disabled=true;canvas.style.display='none'}
    });
    try{
      gl=canvas.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'high-performance'});
      if(!gl)throw Error('webgl2-unavailable');
      initialize();
    }catch(error){
      status.mode='fallback-2d';status.lastError=String(error?.message||error).slice(0,180);disabled=true;canvas.remove();canvas=null;
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
    function facet(a,b,c,col){
      const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
      const ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
      let n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      const len=Math.hypot(...n)||1;n=n.map(v=>v/len);
      tri(a,b,c,n,col);
    }
    return{v,quad,box,ring,cone,cylinder,limb,blade,facet,pushPose,popPose};
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
  function characterizeWeapon(weapon){
    switch(weapon){
      case 'marksman': return {length:.97,barrel:.042,stock:.30,scope:true,shade:[.29,.37,.44]};
      case 'scattergun': return {length:.69,barrel:.092,stock:.19,scope:false,shade:[.31,.27,.22]};
      case 'sidearm': return {length:.37,barrel:.058,stock:.06,scope:false,shade:[.22,.26,.31]};
      case 'carbine': default: return {length:.78,barrel:.061,stock:.20,scope:true,shade:[.24,.31,.34]};
    }
  }
  function characterPose(f,moving,events){
    const healing=f.intent==='healing';
    const attacking=f.intent==='attacking'||events.some(e=>
      (e.type==='hit'||e.type==='miss')&&e.actorId===f.id);
    const running=moving&&(f.intent==='pursuing'||f.intent==='seeking-zone'
      ||f.intent==='seeking-loot'||f.intent==='fallback');
    const walkPhase=(!reducedMotion&&moving)?Math.sin(performance.now()/(running?88:133)+f.cell*.23):0;
    const breathing=reducedMotion?0:Math.sin(performance.now()/510+f.cell*.19)*.019;
    return{
      crouch:healing?.23:0,
      swing:walkPhase*(running?1.2:.72),
      bob:Math.abs(walkPhase)*.06+breathing,
      attacking,healing,running
    };
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
    groundShadow(b,p.x,p.z,.28,.48,theme);
    b.pushPose(p.x,p.z,actorHeading(f,w,events,roster));
    const prev=previousSnapshot?.combatants.find(c=>c.id===f.id);
    const moving=Boolean(prev&&prev.cell!==f.cell);
    const pose=characterPose(f,moving,events);
    const walkPhase=pose.swing;
    const bob=pose.bob;
    const weapon=characterizeWeapon(f.weapon);
    const cx=p.x,cz=p.z;
    const dark=[.07,.12,.16];
    b.box(cx,.032,cz,.67,.026,.56,dark); // soft contact silhouette
    b.ring(cx,.053,cz,.31,.028,[.21,.32,.36],16);
    const hipY=.73+bob-pose.crouch,hipLeft=[cx-.14,hipY,cz],hipRight=[cx+.14,hipY,cz];
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
    // Role-colored armor plates reinforce a readable running combat silhouette.
    for(const knee of [leftKnee,rightKnee]){
      b.cone(knee[0],knee[1]-.02,knee[2]+.085,.135,.095,.20,roleArmor.main,8);
      b.box(knee[0],knee[1]+.055,knee[2]+.165,.13,.055,.05,roleArmor.trim);
    }
    b.box(leftFoot[0],.13,leftFoot[2]+.22,.19,.09,.12,roleArmor.main);
    b.box(rightFoot[0],.13,rightFoot[2]+.22,.19,.09,.12,roleArmor.main);
    b.cone(cx,hipY+.18,cz,.29,.36,.34,undersuit,8); // armored waist
    b.cone(cx,hipY+.59,cz,.33,.255,.68,roleArmor.main,14); // shaped chest
    b.box(cx,hipY+.65,cz+.24,.43,.35,.09,roleArmor.trim); // ballistic breast plate
    b.box(cx,hipY+.36,cz+.26,.33,.09,.10,neutral); // utility belt
    for(const dx of [-.23,.23]){
      b.box(cx+dx,hipY+.36,cz+.16,.14,.21,.19,[.19,.24,.23]);
      b.box(cx+dx,hipY+.31,cz+.27,.13,.045,.05,roleArmor.trim);
    }
    // Raised harness/armor strips and central power-core geometry.
    b.limb([cx-.24,hipY+.92,cz+.20],[cx-.12,hipY+.43,cz+.315],.044,roleArmor.trim);
    b.limb([cx+.24,hipY+.92,cz+.20],[cx+.12,hipY+.43,cz+.315],.044,roleArmor.trim);
    b.box(cx,hipY+.83,cz+.31,.11,.21,.065,neutral);
    b.cylinder(cx,hipY+.83,cz+.355,.07,.055,roleArmor.trim,8);
    for(let i=0;i<3;i++){
      b.box(cx-.26,hipY+.57+i*.12,cz+.227,.08,.032,.06,[.10,.16,.21]);
      b.box(cx+.26,hipY+.57+i*.12,cz+.227,.08,.032,.06,[.10,.16,.21]);
    }
    b.box(cx,hipY+.63,cz-roleArmor.backpack,.43,.47,.16,neutral);
    b.box(cx,hipY+.64,cz-roleArmor.backpack-.105,.28,.39,.095,roleArmor.main);
    b.box(cx,hipY+.80,cz-roleArmor.backpack-.158,.19,.065,.036,roleArmor.trim);
    for(const side of [-1,1]){
      b.cylinder(cx+side*.25,hipY+.56,cz-roleArmor.backpack-.04,.067,.25,steel,7);
    }
    b.cylinder(cx,hipY+.99,cz,.13,.16,undersuit,8);
    const shoulderY=hipY+.87;
    const elbowZ=cz+(pose.attacking?.22:pose.healing?-.10:.15);
    const handZ=cz+(pose.attacking?.56:pose.healing?.04:.41);
    b.cone(cx-.38,shoulderY,cz,roleArmor.shoulders,.16,.22,roleArmor.trim,7);
    b.cone(cx+.38,shoulderY,cz,roleArmor.shoulders,.16,.22,roleArmor.trim,7);
    b.limb([cx-.36,shoulderY,cz],[cx-.36,hipY+.53,elbowZ],.095,roleArmor.main);
    b.limb([cx-.36,hipY+.53,elbowZ],[cx-.20,hipY+.64,handZ],.080,undersuit);
    b.limb([cx+.36,shoulderY,cz],[cx+.36,hipY+.53,elbowZ],.095,roleArmor.main);
    b.limb([cx+.36,hipY+.53,elbowZ],[cx+.24,hipY+.65,handZ],.080,undersuit);
    // Two-piece gauntlets and gripping gloves; procedural pose-driven pieces.
    for(const side of [-1,1]){
      b.cylinder(cx+side*.36,shoulderY-.15,cz+.08,.13,.18,roleArmor.main,9);
      b.box(cx+side*.22,hipY+.66,handZ,.15,.17,.18,neutral);
      b.box(cx+side*.22,hipY+.70,handZ+.102,.13,.042,.041,roleArmor.trim);
      b.cone(cx+side*.36,shoulderY+.07,cz,roleArmor.shoulders*.83,.07,.20,roleArmor.main,9);
    }
    b.cylinder(cx,hipY+1.19,cz,.245,.30,helmet,14); // modeled head
    b.cone(cx,hipY+1.38,cz,.268,.17,.18,roleArmor.main,14);
    b.box(cx,hipY+1.22,cz+.24,.33,.115,.06,[.065,.19,.25]); // visor
    b.box(cx,hipY+1.11,cz+.22,.23,.045,.075,steel); // mask
    b.box(cx,hipY+1.42,cz,.35,.05,.23,roleArmor.trim); // crest
    // Helmet side cheek-guards and distinct eye emitters at hero-camera scale.
    for(const side of [-1,1]){
      b.box(cx+side*.205,hipY+1.135,cz+.082,.10,.24,.24,roleArmor.main);
      b.box(cx+side*.10,hipY+1.235,cz+.289,.10,.055,.035,roleArmor.trim);
      b.cylinder(cx+side*.223,hipY+1.25,cz,.05,.066,neutral,7);
    }
    b.box(cx,hipY+1.075,cz+.235,.20,.085,.078,neutral);
    b.box(cx,hipY+1.045,cz+.277,.125,.023,.034,roleArmor.trim);
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
    // Public legal weapon types control visual shapes, not accuracy or damage.
    const weaponY=pose.attacking?hipY+.85:hipY+.68;
    const near=cz+(pose.healing?.15:.27);
    const far=near+weapon.length;
    if(!pose.healing){
      b.limb([cx+.055,weaponY,near],[cx+.055,weaponY+.02,far],weapon.barrel,weapon.shade);
      b.box(cx+.055,weaponY+.11,(near+far)/2,.17,.13,weapon.length*.44,neutral);
      b.box(cx-.055,weaponY-.21,near+.24,.12,.26,.095,steel);
      b.box(cx+.055,weaponY+.035,near-.09,.18,.17,weapon.stock,weapon.shade);
      if(weapon.scope){
        b.box(cx+.055,weaponY+.22,near+weapon.length*.49,.12,.09,.25,[.06,.16,.23]);
        b.cylinder(cx+.055,weaponY+.22,near+weapon.length*.55,.060,.18,steel,7);
      }
      if(f.weapon==='scattergun'){
        b.cylinder(cx+.055,weaponY+.02,far,.095,.20,neutral,9);
        b.box(cx+.055,weaponY-.10,near+.33,.22,.07,.25,steel);
      }
      if(f.weapon==='sidearm')b.box(cx+.055,weaponY-.12,near+.1,.12,.20,.08,steel);
      const muzzleFlash=!reducedFlash&&events.some(e=>(e.type==='hit'||e.type==='miss')&&e.actorId===f.id);
      if(muzzleFlash){
        b.cone(cx+.055,weaponY+.02,far+.12,.16,0,.25,[1,.89,.32],7);
        b.ring(cx+.055,weaponY+.02,far+.06,.14,.043,[1,.49,.16],16);
      }
    }else{
      // Health pack and triage posture are purely a reaction to public 'healing' intent.
      b.box(cx,hipY+.60,cz+.43,.29,.22,.24,[.81,.91,.85]);
      b.box(cx,hipY+.60,cz+.564,.17,.06,.045,[.22,.66,.58]);
      b.box(cx,hipY+.60,cz+.565,.045,.17,.05,[.22,.66,.58]);
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
    // Cosmetic reactions depend only on sanitized public semantic events.
    // Never reuse stale event beams beyond their own bounded visual lifetime.
    const width=s.arena.width;
    const now=performance.now();
    for(const effect of activeVisualEvents()){
      const event=effect.event;
      const progress=Math.min(1,Math.max(0,(now-effect.born)/VISUAL_LIFETIME_MS));
      const fade=1-progress;
      const from=Number.isInteger(effect.from)?pos(effect.from,width):null;
      const to=Number.isInteger(effect.cell)?pos(effect.cell,width):null;
      if((event.type==='hit'||event.type==='miss'||event.type==='shield-broken')&&from&&to){
        const dx=to.x-from.x,dz=to.z-from.z;
        const range=Math.hypot(dx,dz);
        if(range>.15){
          const shot=Math.min(1,progress*4.5);
          const tail=Math.max(0,shot-.30);
          const a=[from.x+dx*tail,1.30+(1-tail)*.27,from.z+dz*tail];
          const z=[from.x+dx*shot,1.30+(1-shot)*.27,from.z+dz*shot];
          if(!reducedFlash&&progress<.50){
            const tint=event.type==='miss'?[.52,.85,1]:[1,.78,.27];
            b.limb(a,z,.024*fade+.010,tint);
          }
          if(event.type!=='miss'&&progress<.65){
            const burst=(progress/.65),radius=.12+.28*burst;
            const color=event.type==='shield-broken'?[.28,.81,1]:[1,.58,.29];
            b.ring(to.x,.10,to.z,radius,.035*fade+.01,color,20);
            if(!reducedFlash){
              for(let i=0;i<6;i++){
                const angle=6.283185307179586*i/6+event.sequence*.25;
                const d=(.16+.30*burst),x=to.x+Math.cos(angle)*d,z=to.z+Math.sin(angle)*d;
                b.cone(x,.24+.14*burst,z,.055*fade,.004,.15*fade+.02,color,5);
              }
            }
          }
        }
      }
      if(event.type==='elimination'&&to){
        const radius=.3+1.12*progress;
        b.ring(to.x,.09,to.z,radius,.07*fade+.012,[1,.25,.39],32);
        if(!reducedFlash){
          const height=1.6*fade;
          if(height>.02)b.cone(to.x,height*.50,to.z,.22*fade,.01,height,[1,.53,.24],10);
        }
      }
      if(event.type==='pickup'&&to){
        b.ring(to.x,.08,to.z,.3+.30*progress,.040*fade+.01,[1,.81,.35],24);
      }
      if(event.type==='zone-shrink'){
        const center=pos(s.zone.centerCell,width);
        b.ring(center.x,.06,center.z,Math.max(.3,s.zone.radius)+progress*.35,.045*fade+.012,theme.accent,64);
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
  function groundShadow(b,x,z,radius,length,theme){
    // Contact and directional cast-shadow decal; visual shading only.
    // All points remain below the foot/cover mesh and above the arena floor.
    const ground=theme.ground||[.25,.35,.35];
    const shade=ground.map(channel=>Math.max(.035,channel*.35));
    const near=[x-radius*.72,.031,z-radius*.72];
    const far=[x+length,.031,z-length*.59];
    b.quad(
      [x-radius,.031,z-radius],
      [x-radius,.031,z+radius],
      [far[0]+radius*.55,.031,far[2]+radius*.50],
      [far[0],.031,far[2]-radius*.70],
      [0,1,0],shade
    );
    b.quad(
      [x-radius*.79,.033,z-radius*.55],
      [x-radius*.79,.033,z+radius*.55],
      [x+radius*.83,.033,z+radius*.55],
      [x+radius*.83,.033,z-radius*.55],
      [0,1,0],shade
    );
  }
  function fortification(b,cell,width,theme,isCover){
    const p=pos(cell,width),x=p.x,z=p.z;
    groundShadow(b,x,z,isCover?.30:.49,isCover?.42:.85,theme);
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

  function districtDetails(b,arena,theme){
    // Visual-only world dressing, all city infrastructure outside playable cells;
    // ground markings remain flush to floor and never suggest collision cover.
    const w=arena.width,h=arena.height;
    const dark=arena.theme==='arctic'?[.25,.48,.57]:[.16,.29,.41];
    const road=arena.theme==='ember'?[.31,.37,.30]:[.18,.30,.43];
    const signal=arena.theme==='neon'?[1,.42,.78]:theme.accent;
    const safeRect=(x0,z0,x1,z1,col,y=.021)=>{
      b.quad([x0,y,z0],[x0,y,z1],[x1,y,z1],[x1,y,z0],[0,1,0],col);
    };
    // Broad, intersecting roads and clean edge highlights on the traversable board.
    for(const x of [Math.floor(w*.30),Math.floor(w*.73)]){
      safeRect(x-.42,0,x+.42,h,road,.015);
      safeRect(x-.39,0,x-.34,h,theme.accent,.020);
      safeRect(x+.34,0,x+.39,h,theme.accent,.020);
      for(let z=1;z<h-1;z+=3)b.box(x,.024,z,.06,.012,1.25,[.91,.91,.74]);
    }
    for(const z of [Math.floor(h*.25),Math.floor(h*.72)]){
      safeRect(0,z-.40,w,z+.40,road,.024);
      for(let x=1;x<w-1;x+=3)b.box(x,.029,z,1.20,.012,.06,[.91,.91,.74]);
    }
    // Landing pads & painted rings are low decals, not collision objects.
    for(const [x,z] of [[w*.11,h*.16],[w*.87,h*.81],[w*.55,h*.44]]){
      b.ring(x,.032,z,1.02,.095,signal,36);
      b.ring(x,.033,z,.67,.035,[.74,.84,.88],28);
      b.box(x,.037,z,.82,.014,.07,signal);
      b.box(x,.037,z,.07,.014,.82,signal);
    }
    // Out-of-bounds world continues into a more recognizable distant district.
    for(let side=0;side<2;side++){
      for(let i=0;i<10;i++){
        const x=1.6+i*(w-3.2)/9, z=side===0?-3.5-(i%2)*.7:h+3.5+(i%2)*.7;
        if(arena.theme==='neon'){
          // Cybercity towers with layered window bands and neon aerial beacons.
          const height=2.3+(i*7%6)*.65,width=.64+(i%3)*.19;
          b.box(x,height*.5,z,width,height,width,[(i%3)*.055+.20,.26,.49]);
          b.box(x,height+.07,z,width+.19,.15,width+.17,[.17,.28,.44]);
          for(let floor=.6;floor<height-.35;floor+=.51){
            b.box(x,floor,z+width*.51,width*.68,.08,.04,i%2?signal:theme.accent);
            b.box(x+width*.51,floor,z,.04,.08,width*.65,[.64,.84,.96]);
          }
          if(i%2===0){
            b.cone(x,height+.42,z,.15,.01,.62,signal,7);
            b.box(x,height-.33,z+width*.52,width*.78,.30,.038,[.75,.25,.62]);
          }
        }else if(arena.theme==='arctic'){
          // Wind-carved ice shelves and spires use faceted, height-varying silhouettes.
          const height=1.65+(i*11%7)*.55;
          b.cone(x,height*.47,z,.81,.06,height,[.65,.83,.91],7);
          b.cone(x+.44,height*.32,z+.48,.57,.03,height*.66,[.33,.63,.79],7);
          b.cone(x-.37,height*.26,z-.38,.47,.04,height*.51,[.84,.96,1],7);
        }else{
          // Sculpted badlands, sunlit terraces and tall desert silhouettes.
          const height=1.5+(i*9%6)*.45;
          b.cone(x,height*.43,z,.87,.23,height,[.50,.40,.28],7);
          b.box(x,height*.52,z,.78,.14,.66,[.72,.52,.30]);
          b.cone(x+.39,height*.23,z+.45,.39,.02,height*.50,[.40,.48,.30],6);
          if(i%3===0){
            b.cone(x-.73,.70,z,.12,.06,1.4,[.27,.43,.32],8);
            b.cone(x-.73,1.44,z,.30,.03,.53,[.35,.55,.30],8);
          }
        }
      }
    }
    // Layered illuminated access gantries outside the tactical stage.
    for(let i=0;i<4;i++){
      const z=1.8+i*(h-3.6)/3;
      for(const x of [-.78,w+.78]){
        b.box(x,1.02,z,.19,2.04,.20,dark);
        b.box(x,2.08,z,.56,.13,.53,theme.accent);
        b.cone(x,2.30,z,.15,.01,.34,signal,7);
      }
    }
  }
  function terrainHeight(x,z,w,h){
    // Heightfield stays outside every authoritative playable cell. The edge
    // of the region returns precisely to the existing stage's (-0.48) base.
    const dx=Math.max(0,-x,x-w),dz=Math.max(0,-z,z-h);
    const outside=Math.hypot(dx,dz);
    const fade=Math.min(1,Math.pow(outside/3.9,1.38));
    const soft=Math.sin(x*.53+z*.34)*.54+
      Math.cos(z*.65-x*.41)*.31+Math.sin(x*.22+z*.27)*.19;
    const height=fade*(1.30+outside*.14+soft*.94);
    return -.48+Math.max(0,height);
  }
  function surroundingTerrain(b,arena,theme){
    // Actually sculpted triangles (not a checkerboard plane). The world is
    // beyond the collision grid, wholly cosmetic and deterministic.
    const w=arena.width,h=arena.height,padding=quality==='low'?2:6;
    const land=arena.theme==='arctic'?[.38,.61,.66]
      :arena.theme==='neon'?[.25,.35,.54]:[.47,.49,.32];
    const darker=arena.theme==='arctic'?[.27,.43,.51]
      :arena.theme==='neon'?[.17,.23,.38]:[.31,.36,.27];
    const ridge=arena.theme==='arctic'?[.75,.90,.96]
      :arena.theme==='neon'?[.46,.55,.76]:[.66,.57,.36];
    b.box(w/2,-.98,h/2,w+padding*2,.52,h+padding*2,darker);
    if(quality==='low'){
      b.box(w/2,-.55,h/2,w+padding*2,.38,h+padding*2,land);
      return;
    }
    const step=.5;
    for(let z=-padding;z<h+padding;z+=step){
      for(let x=-padding;x<w+padding;x+=step){
        if(x>=0&&x<w&&z>=0&&z<h)continue;
        const a=[x,terrainHeight(x,z,w,h),z];
        const d=[x,terrainHeight(x,z+step,w,h),z+step];
        const c=[x+step,terrainHeight(x+step,z+step,w,h),z+step];
        const e=[x+step,terrainHeight(x+step,z,w,h),z];
        const noise=Math.sin(x*.71+z*.47)*.043+Math.cos(x*.21-z*.68)*.036;
        const height=(a[1]+c[1])*.5;
        const high=Math.min(.52,Math.max(0,height-.12)*.13);
        const pigment=land.map((v,i)=>Math.max(.02,Math.min(1,v+noise+high*(ridge[i]-v))));
        b.facet(a,d,c,pigment);
        b.facet(a,c,e,pigment);
      }
    }
    // Original decorated lands beyond the simulation edge; their feet conform
    // to actual terrain height instead of appearing as floating props.
    for(let z=-padding;z<h+padding;z++){
      for(let x=-padding;x<w+padding;x++){
        if(x>=0&&x<w&&z>=0&&z<h)continue;
        const seed=(Math.imul(x+173,1913)^Math.imul(z+283,7309))>>>0;
        if(seed%13!==0&&seed%19!==0)continue;
        const px=x+.43,pz=z+.53,base=terrainHeight(px,pz,w,h);
        const height=.32+(seed%5)*.16;
        if(arena.theme==='arctic'){
          b.cone(px,base+height*.5,pz,.27,.025,height,[.80,.95,1],7);
          b.cone(px+.14,base+.13,pz+.16,.24,.015,.32,[.44,.72,.81],6);
        }else if(arena.theme==='neon'){
          b.box(px,base+height*.5,pz,.30,height,.31,[.34,.45,.70]);
          b.box(px,base+height+.055,pz,.40,.09,.39,theme.accent);
        }else{
          b.cone(px,base+height*.5,pz,.29,.045,height,[.46,.43,.30],7);
          b.cone(px,base+height,pz,.23,.01,.37,[.60,.67,.32],6);
        }
      }
    }
    // Roads use a visible slope to bridge from the raised tactical stage into
    // the scenic hinterland; they never become a real traversable route.
    for(const x of [w*.27,w*.70]){
      for(const south of [false,true]){
        for(let k=0;k<12;k++){
          const z=south?h+k*.50:-k*.50;
          const y=terrainHeight(x,z,w,h)+.025;
          const z2=south?z+.50:z-.50;
          const y2=terrainHeight(x,z2,w,h)+.025;
          const color=arena.theme==='neon'?[.17,.25,.36]:[.31,.38,.32];
          b.facet([x-.55,y,z],[x-.55,y2,z2],[x+.55,y2,z2],color);
          b.facet([x-.55,y,z],[x+.55,y2,z2],[x+.55,y,z],color);
          if(k%3===0)b.box(x,y+.035,z,.07,.015,.30,[.92,.91,.75]);
        }
      }
    }
    // Plinth and edge shadow give the studio-grade foreground depth.
    for(const side of [-1,1]){
      const z=side<0?-.66:h+.66;
      b.box(w/2,-.28,z,w+.9,.17,.76,theme.wall);
      b.box(w/2,-.17,z,w+.6,.04,.46,theme.accent);
    }
  }
  function heroLandmarks(b,arena,theme){
    // One central, legible skyline signature for each biome. Every coordinate
    // is well beyond the logical arena, and all structures are visual-only.
    const x=arena.width*.5,z=-3.5;
    if(arena.theme==='neon'){
      const cyan=[.33,.96,1],pink=[1,.42,.76],steel=[.19,.28,.45];
      for(const side of [-1,1]){
        const px=x+side*2.25,height=5.2;
        b.box(px,height*.5,z,.95,height,1.1,steel);
        b.box(px,height+.07,z,1.12,.14,1.24,cyan);
        for(let floor=.64;floor<height;floor+=.47){
          b.box(px,floor,z+.57,.72,.07,.047,floor%2>1?cyan:pink);
        }
        b.limb([px,height*.95,z],[px+side*.36,height+1,z],.08,pink);
      }
      // Suspended arena entrance/skybridge and neon title billboard.
      b.box(x,3.88,z,5.4,.39,.90,steel);
      b.box(x,4.14,z+.48,3.76,.20,.06,pink);
      b.box(x,3.64,z+.51,4.70,.12,.06,cyan);
      for(let i=-2;i<=2;i++)b.box(x+i*.78,3.90,z+.56,.28,.18,.07,cyan);
      b.cone(x,4.88,z,.50,.06,1.02,pink,9);
    }else if(arena.theme==='arctic'){
      const ice=[.80,.97,1],blue=[.46,.75,.91],stone=[.32,.53,.66];
      for(const side of [-1,1]){
        const px=x+side*2.40;
        b.cone(px,2.55,z,.72,.12,5.1,stone,9);
        b.cone(px,3.65,z,.51,.01,3.10,ice,9);
        b.cone(px+side*.55,1.27,z+.38,.59,.02,2.4,blue,7);
        b.box(px,1.62,z+.48,.69,.20,.70,ice);
      }
      b.limb([x-2.35,3.3,z],[x,4.55,z],.14,ice);
      b.limb([x,4.55,z],[x+2.35,3.3,z],.14,ice);
      b.cone(x,4.86,z,.30,.025,.66,ice,10);
      b.box(x,1.04,z,3.1,1.4,1.25,stone);
      b.box(x,1.77,z+.73,2.45,.13,.05,ice);
    }else{
      const rust=[.43,.32,.24],copper=[.70,.49,.27],fire=[1,.74,.32];
      for(const side of [-1,1]){
        const px=x+side*2.45;
        b.cone(px,1.95,z,.76,.51,3.90,rust,9);
        b.box(px,3.95,z,.95,.21,.95,copper);
        b.cone(px,4.55,z,.22,.025,1.10,fire,8);
        b.limb([px,3.60,z],[x,3.30,z],.14,copper);
        for(let y=.65;y<3.50;y+=.8)
          b.box(px,y,z+.64,.70,.12,.09,[.79,.62,.35]);
      }
      b.box(x,3.29,z,5.26,.25,.81,rust);
      b.box(x,3.43,z,5.29,.09,.89,fire);
      b.box(x,1.30,z,2.14,2.54,1.8,[.50,.40,.29]);
      b.cylinder(x,2.78,z,.62,.42,copper,10);
      b.cone(x,3.44,z,.24,.01,.83,fire,9);
    }
  }

  function worldStatic(b,a){
    const w=a.width,h=a.height,t=colours[a.theme]||colours.ember;
    surroundingTerrain(b,a,t);
    b.box(w/2,-.25,h/2,w,.5,h,t.wall);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const variation=(x*17+y*31+x*y*7)%11;
      const mult=1+Math.sin(x*.44+y*.53)*.026+Math.cos(x*.21-y*.49)*.020+(variation-5)*.002;
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
      districtDetails(b,a,t);
      heroLandmarks(b,a,t);
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
  function stormWall(b,s,theme){
    // A faithful 3D expression of the authoritative zone: no collision,
    // no damage and no alternative zone position is ever simulated here.
    const center=pos(s.zone.centerCell,s.arena.width);
    const radius=Math.max(.3,s.zone.radius);
    const segments=quality==='low'?24:56;
    const now=reducedMotion?0:performance.now()/1100;
    const color=s.arena.theme==='neon'?[.24,.80,1]
      :s.arena.theme==='arctic'?[.66,.87,.96]:[1,.45,.17];
    const horizon=s.zone.phase>1?1.38:1.12;
    const intensity=Number.isInteger(s.zone.ticksUntilShrink)
      &&s.zone.ticksUntilShrink<6?1.2:1;
    // Vertical energy pylons and upper contour give depth, unlike a ground ring.
    for(let i=0;i<segments;i++){
      const angle=i*Math.PI*2/segments;
      const wave=reducedMotion?0:Math.sin(now*1.8+i*.91)*.10;
      const r=radius+(wave*.04);
      const x=center.x+Math.cos(angle)*r;
      const z=center.z+Math.sin(angle)*r;
      const h=(horizon+(i%4===0?.25:0)+wave)*intensity;
      const beam=quality==='low'?i%4===0:i%2===0;
      if(beam){
        b.limb([x,.09,z],[x,h,z],.020,color);
        b.cone(x,h+.12,z,.078,.006,.25,color,6);
      }
      // Horizontal perimeter beams maintain a readable continuous safe-zone edge.
      const next=(i+1)*Math.PI*2/segments;
      const x2=center.x+Math.cos(next)*r,z2=center.z+Math.sin(next)*r;
      b.limb([x,.47,z],[x2,.47,z2],.014,color);
      if(quality!=='low'){
        const arcY=horizon*.73;
        b.limb([x,arcY,z],[x2,arcY,z2],.009,theme.accent);
      }
    }
    if(!reducedFlash&&s.zone.ticksUntilShrink<=3){
      const progress=(Math.sin(now*5)+1)/2;
      b.ring(center.x,.045,center.z,radius+progress*.14,.04,theme.accent,96);
    }
  }


  function biomeWeather(b,s,theme){
    // Small capped presentation-only particles, not registered in battle physics.
    if(quality==='low')return;
    const arena=s.arena;
    const count=arena.theme==='arctic'?72:arena.theme==='neon'?48:35;
    const time=reducedMotion?0:performance.now()/1000;
    const w=arena.width,h=arena.height;
    for(let i=0;i<count;i++){
      const seed=(Math.imul(i+1,2654435761)>>>0);
      const xx=((seed%1000)/1000)*w;
      const zz=(((seed>>>11)%1000)/1000)*h;
      const drift=arena.theme==='neon'?.16:arena.theme==='arctic'?.23:.07;
      const x=((xx+time*drift+i*.031)%w+w)%w;
      const z=((zz+time*drift*.40)%h+h)%h;
      const phase=((seed>>>6)%1000)/1000;
      const y=.65+(((phase*5+time*(arena.theme==='arctic'?.65:1.15))%5)+5)%5;
      if(arena.theme==='arctic'){
        // Slow snowflakes, with occasional larger flakes creating layered depth.
        const r=i%7===0?.060:.029;
        b.cone(x,y,z,r,r*.35,.10,[.87,.96,1],5);
        if(i%9===0)b.cone(x+.07,y-.10,z,.024,0,.10,[.58,.82,.96],5);
      }else if(arena.theme==='neon'){
        // Wet city atmosphere: vertical light streaks and magenta particulate haze.
        const c=i%4===0?[1,.40,.80]:[.35,.87,1];
        const length=i%3===0?.52:.32;
        b.limb([x,y,z],[x+.07,y-length,z+.04],i%5===0?.022:.010,c);
      }else if(arena.theme==='ember'){
        // Cinders and luminous fireflies drift above the battle without flashing.
        const c=i%4===0?[1,.82,.30]:[.93,.54,.25];
        b.cone(x,y,z,.029,0,.09,c,5);
        if(!reducedFlash&&i%11===0)b.cylinder(x,y+.11,z,.026,.13,theme.accent,5);
      }
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
    const eventFrames=activeVisualEvents().filter(f=>performance.now()-f.born<230).map(f=>f.event);
    for(const f of s.combatants.slice(0,64))contender(b,f,w,t,Boolean(s.focus&&s.focus.id===f.id),eventFrames,s.combatants);
    const c=pos(s.zone.centerCell,w);
    b.ring(c.x,.056,c.z,Math.max(.25,s.zone.radius),.08,t.accent,128);
    stormWall(b,s,t);
    combatEffects(b,s,t);
    biomeWeather(b,s,t);
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
    gl.uniform1f(uniform[7],.70);
    if(staticCache.vertices)gl.drawArrays(gl.TRIANGLES,0,staticCache.vertices);
    bindSceneBuffer(dynamicBuffer);
    gl.uniform1f(uniform[7],.10);
    if(dynamicVertexCount)gl.drawArrays(gl.TRIANGLES,0,dynamicVertexCount);
  }

  const SPECTATOR_HOLD_MS=1650;
  let heldSpectator=null;
  let cameraTracking=null;
  function chooseSpectatorTarget(snapshot){
    const now=performance.now();
    const roster=new Map(snapshot.combatants.map(f=>[f.id,f]));
    if(snapshot.scene==='result'&&snapshot.result?.kind==='game'&&snapshot.result?.winnerId){
      const winner=roster.get(snapshot.result.winnerId);
      if(winner)return winner;
    }
    const current=heldSpectator?.runToken===snapshot.runToken
      ?roster.get(heldSpectator.id):null;
    if(current?.alive&&now-heldSpectator.selectedAt<SPECTATOR_HOLD_MS)return current;
    const event=snapshot.recentEvents.slice(-12).reverse().find(e=>
      (e.type==='elimination'||e.type==='shield-broken'||e.type==='hit')
      &&Number.isInteger(e.tick)&&e.tick>=snapshot.tick-3&&(e.targetId||e.actorId));
    const subject=event?(roster.get(event.actorId)||roster.get(event.targetId)):null;
    const chosen=(subject?.alive?subject:null)
      ||(snapshot.focus?.alive?roster.get(snapshot.focus.id):null)
      ||snapshot.combatants.find(f=>f.alive);
    heldSpectator=chosen?{id:chosen.id,selectedAt:now,runToken:snapshot.runToken}:null;
    return chosen||null;
  }
  function smoothCameraTarget(target,snapshot){
    if(!target)return target;
    if(reducedMotion||snapshot.scene==='result'||cameraTracking?.runToken!==snapshot.runToken){
      cameraTracking={x:target.x,z:target.z,runToken:snapshot.runToken};
      return target;
    }
    const factor=Math.min(1,Math.max(0,.22));
    cameraTracking.x+=(target.x-cameraTracking.x)*factor;
    cameraTracking.z+=(target.z-cameraTracking.z)*factor;
    return {x:cameraTracking.x,z:cameraTracking.z};
  }
  function spectatorCloseup(snapshot,area,mode){
    // Second camera pass views the SAME public geometry: no synthetic battles,
    // no hidden outcome changes, no second simulation.
    if(area.width<950||area.height<450||snapshot.scene==='recovery')return;
    const tacticalInset=mode==='hero';
    const focal=tacticalInset?null:chooseSpectatorTarget(snapshot);
    if(!tacticalInset&&!focal)return;
    if(closeupLabel){
      if(tacticalInset)closeupLabel.textContent='● TACTICAL OVERVIEW // LIVE';
      else {
        const title=snapshot.scene==='result'&&snapshot.result?.winnerId===focal.id?'CHAMPION':'LIVE ACTION';
        closeupLabel.textContent=title+' // '+String(focal.name||focal.archetype||'CONTENDER').slice(0,30).toUpperCase();
      }
    }
    const p=tacticalInset?{x:snapshot.arena.width/2,z:snapshot.arena.height/2}:
      smoothCameraTarget(pos(focal.cell,snapshot.arena.width),snapshot);
    const frameW=Math.max(1,Math.round(canvas.width*.27));
    const frameH=Math.max(1,Math.round(canvas.height*.27));
    const frameX=Math.round(canvas.width*.705);
    const frameY=Math.round(canvas.height*.65);
    const aspect=frameW/frameH;
    const zoom=tacticalInset?1:.43;
    gl.enable(gl.SCISSOR_TEST);
    try{
      gl.scissor(frameX,frameY,frameW,frameH);
      gl.viewport(frameX,frameY,frameW,frameH);
      gl.clearColor(.09,.19,.30,1);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform3f(uniform[0],p.x,tacticalInset?0:.8,p.z);
      if(tacticalInset){
        const w=snapshot.arena.width,h=snapshot.arena.height;
        const wide=Math.min(1.79/((w*.61+h*.79)*.52+6),1.79*aspect/(w*.79+h*.61+5));
        gl.uniform2f(uniform[1],wide/aspect,wide);
        gl.uniform1f(uniform[2],.65);
        gl.uniform1f(uniform[3],.56);
        gl.uniform1f(uniform[4],.013);
      }else{
        gl.uniform2f(uniform[1],zoom/aspect,zoom);
        gl.uniform1f(uniform[2],.95);
        gl.uniform1f(uniform[3],.43);
        gl.uniform1f(uniform[4],.032);
      }
      drawScene();
    }finally{
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);
    }
  }
  function updateNameplates(snapshot,area,view,scale,zoom,yaw,pitch){
    // Public AI personalities visible in the *actual* 3D view, not a fake HUD.
    // Max six, no hidden player state, and no per-frame invented events.
    if(!plateLayer||quality==='low'||area.width<950)return;
    const alive=snapshot.combatants.filter(f=>f.alive);
    const focusId=snapshot.focus?.id;
    alive.sort((a,b)=>(a.id===focusId?-1000:0)-(b.id===focusId?-1000:0)||
      (b.eliminations||0)-(a.eliminations||0));
    const selected=alive.slice(0,6);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const aspect=area.width/area.height;
    const nodes=[];
    for(const f of selected){
      const p=f.visual||pos(f.cell,snapshot.arena.width);
      const px=p.x-view.x,pz=p.z-view.z,py=2.35;
      const east=px*cy-pz*sy,along=px*sy+pz*cy,up=py*cp-along*sp;
      const depth=py*sp+along*cp;
      const w=Math.max(.55,1+depth*.013);
      const nx=east*scale*zoom/aspect/w,ny=up*scale*zoom/w;
      if(Math.abs(nx)>.94||ny<-.90||ny>.90)continue;
      const tag=document.createElement('div');
      tag.className='battle-3d-nameplate';
      tag.dataset.archetype=f.archetype||'vanguard';
      tag.dataset.focus=String(f.id===focusId);
      tag.textContent=String(f.name||f.archetype||'CONTENDER').slice(0,21).toUpperCase()+
        '  '+Math.max(0,Math.round(f.health||0))+' HP';
      tag.style.left=(50+nx*50).toFixed(2)+'%';
      tag.style.top=(50-ny*50).toFixed(2)+'%';
      nodes.push(tag);
    }
    plateLayer.replaceChildren(...nodes);
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
      gl.uniform1f(uniform[5],a.theme==='neon'?1:a.theme==='arctic'?2:0);
      gl.uniform1f(uniform[6],surfaceAtlasTexture?1:0);
      if(surfaceAtlasTexture){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,surfaceAtlasTexture);
        gl.uniform1i(uniform[8],0);
      }
      const mode=selectCameraMode(snapshot);
      const hero=mode==='hero'?chooseSpectatorTarget(snapshot):null;
      const close=snapshot.scene==='final-circle';
      const winner=snapshot.scene==='result'&&snapshot.result?.kind==='game'
        ?snapshot.combatants.find(f=>f.id===snapshot.result?.winnerId):null;
      const tacticalView=winner?pos(winner.cell,w):
        (close?pos(snapshot.zone.centerCell,w):{x:w/2,z:h/2});
      const heroView=hero?smoothCameraTarget(pos(hero.cell,w),snapshot):null;
      const focus=mode==='hero'&&heroView?heroView:tacticalView;
      const zoom=mode==='hero'&&heroView?.30:(winner?1.20:(close?1.15:1.10));
      const lensScale=mode==='hero'&&heroView?zoom:scale*zoom;
      const yaw=mode==='hero'&&heroView?
        (.85+(reducedMotion?0:Math.sin(performance.now()/16000)*.07)):
        (.65+(reducedMotion?0:Math.sin(performance.now()/18000)*.035));
      const pitch=mode==='hero'&&heroView?.42:.56;
      gl.uniform3f(uniform[0],focus.x,mode==='hero'?1.0:0,focus.z);
      gl.uniform2f(uniform[1],lensScale/aspect,lensScale);
      gl.uniform1f(uniform[2],yaw);
      gl.uniform1f(uniform[3],pitch);
      gl.uniform1f(uniform[4],mode==='hero'?.033:.013);
      status.cameraMode=mode;
      document.body.dataset.battleCamera=mode;
      bindSceneBuffer(dynamicBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
      dynamicVertexCount=data.length/9;
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      drawScene();
      updateNameplates(presented,area,focus,mode==='hero'?.30:scale,mode==='hero'?1:zoom,yaw,pitch);
      spectatorCloseup(snapshot,area,mode);
      status.frames++;status.triangles=(data.length/9+staticCache.vertices)/3;
      frameSamples.push(performance.now()-startSubmit);
      if(frameSamples.length>90)frameSamples.shift();
      const ordered=[...frameSamples].sort((a,b)=>a-b);
      status.p95SubmitMs=Number(ordered[Math.max(0,Math.ceil(ordered.length*.95)-1)].toFixed(2));
      status.contenders=snapshot.combatants.filter(f=>f.alive).length;
      status.activeEffects=activeVisualEvents().length;
      canvas.dataset.renderer='webgl2';
      canvas.dataset.triangles=String(status.triangles);
      canvas.dataset.contenders=String(status.contenders);
      return true;
    }catch(error){
      disabled=true;status.mode='fallback-2d';status.lastError=String(error?.message||error).slice(0,180);
      document.body.dataset.battleRenderer='2d-fallback';
      canvas.style.display='none';return false;
    }
  }
  function animate(time){
    animationId=0;
    if(disabled||!lastSnapshot||status.mode!=='webgl2'||document.hidden)return;
    if(time-lastPaintTime>=42){paint(lastSnapshot);lastPaintTime=time}
    if(time-startedAt<230||activeVisualEvents().length>0)animationId=requestAnimationFrame(animate);
  }
  function render(snapshot){
    if(!snapshot)return false;
    ingestVisualEvents(snapshot);
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