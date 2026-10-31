/* Original instanced WebGL2 presentation. It never writes to simulation state. */
(function(){
  'use strict';
  const C=window.Ant3D;
  const VERT=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;
  layout(location=2) in mat4 iModel;layout(location=6) in vec4 iMaterial;
  uniform mat4 uVP;uniform mat4 uLightVP;
  out vec3 vWorld;out vec3 vNormal;out vec4 vMaterial;out vec4 vShadow;
  void main(){vec4 p=iModel*vec4(aPosition,1.);mat3 m=mat3(iModel);
  vNormal=normalize(m*vec3(aNormal.x/max(dot(m[0],m[0]),.000001),aNormal.y/max(dot(m[1],m[1]),.000001),aNormal.z/max(dot(m[2],m[2]),.000001)));
  vWorld=p.xyz;vMaterial=iMaterial;vShadow=uLightVP*p;gl_Position=uVP*p;}`;
  const FRAG=`#version 300 es
  precision highp float;in vec3 vWorld;in vec3 vNormal;in vec4 vMaterial;in vec4 vShadow;
  uniform vec3 uEye;uniform vec3 uLight;uniform float uDay;uniform float uRain;uniform sampler2D uShadow;uniform float uShadowOn;out vec4 color;
  float noise(vec3 p){return fract(sin(dot(floor(p),vec3(12.9898,78.233,37.719)))*43758.5453);}
  void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 l=normalize(uLight),v=normalize(uEye-vWorld),h=normalize(l+v);
  float rough=clamp(vMaterial.a,.12,1.),diff=max(dot(n,l),0.),shadow=1.;vec3 sp=vShadow.xyz/vShadow.w*.5+.5;
  if(uShadowOn>.5&&sp.x>0.&&sp.x<1.&&sp.y>0.&&sp.y<1.&&sp.z<1.){float lit=0.;vec2 texel=1./vec2(textureSize(uShadow,0));
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uShadow,sp.xy+vec2(x,y)*texel).r;lit+=sp.z-(.0015+.003*(1.-diff))<=d?1.:0.;}shadow=.4+.6*lit/9.;}
  float grain=mix(1.,.79+.21*noise(vWorld*22.),smoothstep(.55,.9,rough));
  vec3 base=vMaterial.rgb*grain;float spec=pow(max(dot(n,h),0.),mix(90.,8.,rough))*(1.-rough*.8);
  vec3 sky=mix(vec3(.11,.18,.25),vec3(.5,.57,.37),uDay),sun=mix(vec3(.31,.42,.6),vec3(1.2,1.04,.72),uDay);
  vec3 ambient=sky*(.38+.30*max(n.y,0.))+vec3(.10,.07,.035);
  vec3 lit=base*(ambient+sun*diff*shadow)+sun*spec*shadow*(.35+uRain*.35);
  float fog=1.-exp(-length(uEye-vWorld)*.006);lit=mix(lit,vec3(.13,.17,.105)*(.6+uDay*.4),fog);
  lit=lit/(lit+vec3(.64));color=vec4(pow(lit,vec3(.4545)),1.);}`;
  const DEPTH_VERT=`#version 300 es
  precision highp float;layout(location=0) in vec3 aPosition;layout(location=2) in mat4 iModel;uniform mat4 uVP;void main(){gl_Position=uVP*iModel*vec4(aPosition,1.);}`;
  const DEPTH_FRAG=`#version 300 es
  precision highp float;void main(){}`;
  function program(gl,vs,fs){
    const make=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(message);}return s;};
    const a=make(gl.VERTEX_SHADER,vs),b=make(gl.FRAGMENT_SHADER,fs),p=gl.createProgram();gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error(message);}return p;
  }
  class Mesh {
    constructor(gl,kind,capacity){
      this.gl=gl;this.batch=new C.Batch(capacity);const shape=C.mesh(kind);this.indices=shape.indices.length;
      this.vao=gl.createVertexArray();this.vertices=gl.createBuffer();this.elements=gl.createBuffer();this.instances=gl.createBuffer();gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.vertices);gl.bufferData(gl.ARRAY_BUFFER,shape.vertices,gl.STATIC_DRAW);
      for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);}
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.elements);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,shape.indices,gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.instances);gl.bufferData(gl.ARRAY_BUFFER,this.batch.data.byteLength,gl.DYNAMIC_DRAW);
      for(let i=0;i<5;i++){gl.enableVertexAttribArray(i+2);gl.vertexAttribPointer(i+2,4,gl.FLOAT,false,80,i*16);gl.vertexAttribDivisor(i+2,1);}gl.bindVertexArray(null);
    }
    upload(){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.instances);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.batch.data.subarray(0,this.batch.count*20));}
    draw(){if(!this.batch.count)return 0;const gl=this.gl;gl.bindVertexArray(this.vao);gl.drawElementsInstanced(gl.TRIANGLES,this.indices,gl.UNSIGNED_SHORT,0,this.batch.count);return 1;}
    dispose(){const gl=this.gl;gl.deleteVertexArray(this.vao);for(const b of [this.vertices,this.elements,this.instances])gl.deleteBuffer(b);}
  }
  class Renderer {
    constructor(canvas){
      this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});if(!this.gl)throw new Error('WebGL2 unavailable');
      const gl=this.gl;this.program=program(gl,VERT,FRAG);this.depthProgram=program(gl,DEPTH_VERT,DEPTH_FRAG);this.uniforms={};
      for(const name of ['uVP','uLightVP','uEye','uLight','uDay','uRain','uShadow','uShadowOn'])this.uniforms[name]=gl.getUniformLocation(this.program,name);
      this.depthVP=gl.getUniformLocation(this.depthProgram,'uVP');this.static={};this.dynamic={};
      for(const kind of ['sphere','tube','box','leaf']){this.static[kind]=new Mesh(gl,kind,10000);this.dynamic[kind]=new Mesh(gl,kind,16000);}
      this.camera={mode:'nest',yaw:0.12,pitch:.85,distance:15,target:[0,0,0]};this.worldKey='';this.metrics={frames:0,drawCalls:0,instances:0,triangles:0,frameTimes:[],webgl:true};
      this.shadowSize=innerWidth<700?512:1024;this.depthTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.depthTexture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,this.shadowSize,this.shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
      for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.NEAREST);
      for(const name of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.CLAMP_TO_EDGE);
      this.shadowFBO=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFBO);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.depthTexture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
      this.shadowReady=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    }
    setShot(mode,s){
      if(!s)return;const w=s.world,c=this.camera;c.mode=mode;c.yaw=.12;c.pitch=.85;
      let x=w.nestCenter%w.width,y=Math.floor(w.nestCenter/w.width);c.distance=15;
      if(mode==='world'){x=w.width/2;y=w.height/2;c.distance=Math.max(w.width,w.height)*1.24;c.pitch=1.04;}
      if(mode==='forest'){const a=s.ants.find(a=>a.y<=w.surfaceRow&&a.carryingFood>0)||s.ants.find(a=>a.y<=w.surfaceRow);x=a?.x??w.entrance%w.width;y=a?.y??w.surfaceRow/2;c.distance=12;c.pitch=.58;}
      if(mode==='threat'){const a=s.predators[0];x=a?.x??x;y=a?.y??y;c.distance=a?10:15;c.pitch=.65;}
      c.target=C.position(s,x,y);c.target[1]+=.35;
    }
    buildWorld(s){
      const b={};for(const [kind,m]of Object.entries(this.static)){m.batch.reset();b[kind]=m.batch;}
      const w=s.world,n=w.width*w.height,sr=w.surfaceRow;
      b.box.add([w.width/2,-2.4,w.height/2],[w.width+1,1.6,w.height+1],[.24,.125,.053],0,.95);
      b.box.add([w.width/2,-.35,(sr+1)/2],[w.width,.7,sr+1],[.19,.21,.075],0,.92);
      for(let i=0;i<n;i++){
        const x=i%w.width,y=Math.floor(i/w.width),h=C.hash(i*43),tile=w.tiles[i];
        if(y>sr&&!([1,3].includes(tile))){
          const neighbors=[x>0?i-1:i,x<w.width-1?i+1:i,y>0?i-w.width:i,y<w.height-1?i+w.width:i];
          const edge=neighbors.some(j=>[1,3].includes(w.tiles[j]));
          if(edge){
            b.sphere.add([x+.5,-.88,y+.5],[.68,.82+h*.13,.68],[.23,.125,.05],h,.95);
            for(let j=0;j<3;j++){const q=C.hash(i*97+j);b.sphere.add([x+.2+q*.6,-.02,y+.2+C.hash(i*41+j)*.6],[.12+q*.08,.065,.13],[.18,.20,.06],q*6,.94);}
          }else b.box.add([x+.5,-.86,y+.5],[1.02,1.45,1.02],[.23,.125,.05],0,.96);
        }
        if(tile===4)b.sphere.add([x+.5,(y<=sr?0:-.12)+.18,y+.5],[.4,.3,.48],[.25,.27,.22],h*6,.88);
        if(tile===5)b.sphere.add([x+.5,y<=sr?.04:-.1,y+.5],[.5,.025,.48],[.09,.25,.23],0,.18);
        if(y<=sr&&i%7===0)b.sphere.add([x+.2,.04,y+.3],[.08+h*.08,.05,.11],[.35,.29,.16],h*6,.95);
      }
      // Non-gameplay plant dressing is fixed by cell coordinates, not gameplay RNG.
      for(let i=0;i<76;i++){
        const x=C.hash(i*521+9)*w.width,z=C.hash(i*947+2)*Math.max(1,sr-1),height=.65+C.hash(i*83)*1.5;
        const green=s.environment.season==='autumn'?[.36,.25,.06]:s.environment.season==='winter'?[.22,.28,.18]:[.16,.33,.055];
        b.tube.beam([x,0,z],[x+.12,height,z+.15],.028,[.20,.28,.06]);
        for(let j=0;j<6;j++){const side=j%2?1:-1;const along=.22+j*.11;b.leaf.add([x+side*.24,along*height,z],[(.72-along)*1.1,.7,1.25-along],green,side*(.55+j*.12),.78);}
      }
      for(let i=0;i<12;i++){
        const x=C.hash(i*373+18)*w.width,z=C.hash(i*811+21)*(sr+1);
        b.tube.beam([x,0,z],[x+.7,.25,z+1.7],.14,[.24,.13,.055]);
        for(let j=0;j<3;j++)b.tube.beam([x+.2,.1,z+.3],[x-.5+j*.35,.02,z-.35],.04,[.3,.17,.07]);
      }
      // Exposed roots only on solid boundary cells; they never indicate a traversable route.
      for(let x=1;x<w.width;x+=3){const z=sr+1.5,y=-.05;b.tube.beam([x,y,z-1],[x+.65,y-.15,z+1.4],.10,[.30,.15,.065]);b.tube.beam([x+.65,y-.15,z+1.4],[x+.2,y-.2,z+2.2],.05,[.28,.14,.05]);}
      for(const m of Object.values(this.static))m.upload();
    }
    creature(entity,s,now,detail=true){
      const b=this.dynamic,r=C.rig(entity.role||entity.kind),p=C.position(s,entity.x,entity.y),angle=entity.heading??C.hash(entity.id*97)*6.283,scale=r.scale;
      const co=Math.cos(angle),si=Math.sin(angle),point=(x,y,z)=>[p[0]+(co*x+si*z)*scale,p[1]+y*scale,p[2]+(-si*x+co*z)*scale];
      const sphere=(x,y,z,sx,sy,sz,color=r.color,rough=.3)=>b.sphere.batch.add(point(x,y,z),[sx*scale,sy*scale,sz*scale],color,angle,rough);
      const beam=(a,c,width,color=r.color)=>b.tube.batch.beam(point(...a),point(...c),width*scale,color,.5);
      const walking=entity.moving,phase=walking?now*.018+entity.id*.7:entity.id*.7,spider=entity.kind==='spider',beetle=entity.kind==='beetle';
      const bounce=walking?Math.sin(phase*2)*.018:0,up=.28+bounce;
      sphere(0,up,-.38,.22,.19,.31*r.abdomen);sphere(0,up,.06,.14,.17,.24);sphere(0,up+.015,.37,.20*r.head,.18*r.head,.20*r.head);
      if(beetle){sphere(0,up+.08,-.25,.38,.25,.49,[.18,.28,.085],.22);beam([0,up+.32,-.65],[0,up+.32,.12],.015,[.05,.08,.025]);}
      if(detail){for(const side of [-1,1]){sphere(side*.15*r.head,up+.09,.50,.052,.055,.045,[.018,.014,.009],.18);beam([side*.09,up,.52],[side*.17,up-.03,.68],.032);beam([side*.17,up-.03,.68],[side*.06,up-.02,.72],.019);}}
      const pairs=r.legs/2;
      for(let j=0;j<pairs;j++)for(const side of [-1,1]){
        const z=.24-j*(spider?.19:.23),step=walking?Math.sin(phase+j*Math.PI*.66+(side>0?Math.PI:0))*.16:0,lift=walking?Math.max(0,Math.cos(phase+j*Math.PI*.66+(side>0?Math.PI:0)))*.12:0;
        const reach=spider?.88:.48,knee=[side*(spider?.49:.33),up+.06,z+step],foot=[side*reach,.025+lift,z+(j-1)*.18+step];
        beam([side*.10,up,z],knee,.027);beam(knee,foot,.018);if(detail)sphere(knee[0],knee[1],knee[2],.038,.038,.038);
      }
      if(!spider)for(const side of [-1,1]){
        const scan=walking?Math.sin(phase*.4+side)*.06:0;beam([side*.10,up+.08,.48],[side*(.25+scan),up+.26,.67],.014);beam([side*(.25+scan),up+.26,.67],[side*.27,up+.19,.91],.010);
      }
      if(entity.carryingFood>0)b.leaf.batch.add(point(0,up+.18,.76),[.55*scale,.7*scale,.8*scale],[.27,.46,.06],angle-.3,.8);
    }
    populate(s,ants,now,options){
      for(const m of Object.values(this.dynamic))m.batch.reset();
      const cx=this.camera.target[0],cz=this.camera.target[2];
      for(const ant of ants)this.creature({...ant,moving:ant.moving&&!options.reducedMotion&&!options.paused},s,now,Math.hypot(ant.x-cx,ant.y-cz)<18);
      const w=s.world,qx=w.nestCenter%w.width,qy=Math.floor(w.nestCenter/w.width);
      if(s.queen.health>0)this.creature({id:0,role:'queen',x:qx,y:qy,heading:.55,moving:false},s,now,true);
      for(const p of s.predators)if(p.health>0)this.creature(p,s,now,true);
      const chambers=[];for(let i=0;i<w.tiles.length;i++){const x=i%w.width,y=Math.floor(i/w.width);if([1,3].includes(w.tiles[i])&&Math.hypot(x-qx,y-qy)<3.5)chambers.push(i);}
      let index=0;for(const stage of ['egg','larva','pupa'])for(let i=0;i<Math.min(s.colony.broodByStage[stage],24)&&chambers.length;i++){
        const cell=chambers[index%chambers.length],x=cell%w.width+.2+C.hash(index*31)*.5,z=Math.floor(cell/w.width)+.2+C.hash(index*17)*.5;
        this.dynamic.sphere.batch.add([x,-1.46,z],stage==='egg'?[.085,.08,.12]:stage==='larva'?[.08,.08,.22]:[.11,.10,.19],stage==='pupa'?[.65,.48,.28]:[.84,.76,.53],index*.8,.5);index++;
      }
      for(let i=0;i<w.food.length;i++)if(w.food[i]>0&&w.discovered[i]){const x=i%w.width,y=Math.floor(i/w.width),p=C.position(s,x,y);for(let k=0;k<Math.min(4,Math.ceil(w.food[i]/25));k++)this.dynamic.sphere.batch.add([p[0]+(k%2)*.16,p[1]+.12,p[2]+Math.floor(k/2)*.15],[.13,.12,.18],[.55,.28,.045],k,.65);}
      if(s.environment.weather==='rain'&&!options.reducedMotion&&!options.paused)for(let i=0;i<80;i++){const x=C.hash(i*11+2)*w.width,z=C.hash(i*71+3)*(w.surfaceRow+1),y=4-((now*.005+C.hash(i*31)*4)%4);this.dynamic.tube.batch.beam([x,y,z],[x-.03,y+.3,z],.008,[.46,.65,.70],.2);}
      for(const m of Object.values(this.dynamic))m.upload();
    }
    render(s,ants,now,options={}){
      const start=performance.now(),gl=this.gl;if(gl.isContextLost())return;
      const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(innerWidth<700?1.25:1.75,devicePixelRatio||1),width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
      if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
      const w=s.world;let hash=0;for(let i=0;i<w.tiles.length;i++)hash=(Math.imul(hash,31)+w.tiles[i])|0;
      const key=`${s.runToken}:${w.width}:${w.height}:${hash}:${s.environment.season}`;
      if(this.worldKey!==key){const first=!this.worldKey||this.runToken!==s.runToken;this.worldKey=key;this.runToken=s.runToken;this.buildWorld(s);if(first)this.setShot(this.camera.mode,s);}
      this.populate(s,ants,now,options);
      const c=this.camera,eye=[c.target[0]+Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance,c.target[1]+Math.sin(c.pitch)*c.distance,c.target[2]+Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance];
      const vp=C.multiply(C.perspective(.8,width/height,.1,300),C.lookAt(eye,c.target));
      const light=[-.5,1,.35],le=c.target.map((x,i)=>x+light[i]*45),extent=Math.max(10,c.distance*.7),lvp=C.multiply(C.ortho(-extent,extent,-extent,extent,.1,150),C.lookAt(le,c.target));
      const meshes=[...Object.values(this.static),...Object.values(this.dynamic)];let drawCalls=0;
      if(this.shadowReady){gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFBO);gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(this.depthProgram);gl.uniformMatrix4fv(this.depthVP,false,lvp);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,2);for(const m of meshes)drawCalls+=m.draw();gl.disable(gl.POLYGON_OFFSET_FILL);}
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.clearColor(.085,.105,.063,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
      const u=this.uniforms;gl.uniformMatrix4fv(u.uVP,false,vp);gl.uniformMatrix4fv(u.uLightVP,false,lvp);gl.uniform3fv(u.uEye,eye);gl.uniform3fv(u.uLight,light);
      const day=C.clamp(Math.sin((s.environment.dayProgress-.2)*Math.PI*2)*1.4+.35,.12,1);gl.uniform1f(u.uDay,day);gl.uniform1f(u.uRain,s.environment.weather==='rain'?1:0);gl.uniform1f(u.uShadowOn,this.shadowReady?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.depthTexture);gl.uniform1i(u.uShadow,0);
      for(const m of meshes)drawCalls+=m.draw();gl.bindVertexArray(null);
      const metrics=this.metrics;metrics.frames++;metrics.drawCalls=drawCalls;metrics.instances=meshes.reduce((v,m)=>v+m.batch.count,0);metrics.triangles=meshes.reduce((v,m)=>v+m.batch.count*m.indices/3,0);metrics.dropped=meshes.reduce((v,m)=>v+m.batch.dropped,0);metrics.ants=ants.length;metrics.shadowReady=this.shadowReady;metrics.width=width;metrics.height=height;metrics.frameTimes.push(performance.now()-start);if(metrics.frameTimes.length>120)metrics.frameTimes.shift();
    }
    dispose(){const gl=this.gl;for(const m of [...Object.values(this.static),...Object.values(this.dynamic)])m.dispose();gl.deleteProgram(this.program);gl.deleteProgram(this.depthProgram);gl.deleteTexture(this.depthTexture);gl.deleteFramebuffer(this.shadowFBO);}
  }
  window.Ant3DRenderer=Renderer;
})();
