'use strict';
/* Original WebGL2 character turntable. Cosmetic only; never writes race state. */
(function(root){
  const VERTEX=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition; layout(location=1) in vec3 aNormal;
  uniform mat4 uModel,uVP; uniform mat3 uNormal;
  out vec3 vNormal,vWorld,vLocal;
  void main(){vec4 p=uModel*vec4(aPosition,1.);vWorld=p.xyz;vLocal=aPosition;vNormal=normalize(uNormal*aNormal);gl_Position=uVP*p;}`;
  const FRAGMENT=`#version 300 es
  precision highp float;
  in vec3 vNormal,vWorld,vLocal;
  uniform vec3 uColor,uEye; uniform float uKind,uPattern,uSeed; uniform sampler2D uBadge;
  out vec4 color;
  void main(){
    if(uKind>2.5){float a=(1.-smoothstep(.12,1.,length(vLocal.xz)))*.56;color=vec4(.01,.025,.05,a);return;}
    vec3 n=normalize(vNormal),v=normalize(uEye-vWorld),p=normalize(vLocal);
    vec3 key=normalize(vec3(-.6,.85,1.)),fill=normalize(vec3(.8,.25,-.6));
    vec3 pigment=uColor;
    if(uKind<.5){
      float mask=0.;
      if(uPattern<1.5)mask=smoothstep(.62,.84,abs(sin(p.x*13.)*sin(p.y*13.)*sin(p.z*13.)));
      else if(uPattern<2.5)mask=1.-smoothstep(.12,.23,abs(fract((p.x+abs(p.y)*.7)*3.5)-.5));
      else if(uPattern<3.5)mask=1.-smoothstep(.11,.2,abs(p.y));
      else mask=smoothstep(-.04,.04,p.x);
      pigment=mix(pigment,vec3(.91,.96,1.),mask*.7);
      float vein=sin(p.x*18.+p.z*14.+sin(p.y*11.+uSeed*.4)*2.4+uSeed*.71);
      pigment=mix(pigment,pigment*vec3(.55,.8,1.2),smoothstep(.45,.95,vein)*.28);
      float code=pow(max(0.,sin(atan(p.z,p.x)*(4.+mod(uSeed,7.))+p.y*19.+uSeed)),12.);
      pigment+=uColor*code*.13;
      vec2 badgeUV=vLocal.xy*1.65+vec2(.5,.37);
      if(vLocal.z>.74&&all(greaterThanEqual(badgeUV,vec2(0.)))&&all(lessThanEqual(badgeUV,vec2(1.)))){
        vec4 ink=texture(uBadge,badgeUV);pigment=mix(pigment,ink.rgb,ink.a);
      }
    }
    float diffuse=max(dot(n,key),0.),secondary=max(dot(n,fill),0.);
    float rim=pow(1.-max(dot(n,v),0.),3.);
    vec3 reflected=reflect(-v,n);
    float softbox=pow(max(dot(reflected,normalize(vec3(-.42,.8,.38))),0.),24.);
    float strip=pow(max(dot(reflected,normalize(vec3(.8,.3,-.5))),0.),70.);
    float specular=pow(max(dot(n,normalize(key+v)),0.),uKind<.5?160.:70.);
    vec3 lit=pigment*(.3+diffuse*.8+secondary*.24);
    lit+=vec3(.78,.91,1.)*(specular*.75+softbox*.72);
    lit+=vec3(1.,.69,.34)*strip*.48+mix(uColor,vec3(.35,.78,1.),.5)*rim*.35;
    if(uKind>1.5)lit+=uColor*.58;
    lit=pow(max(lit,vec3(0.)),vec3(.85));
    color=vec4(lit,1.);
  }`;
  const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  function mul(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
  const norm=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  function rotate([x,y,z]){
    const a=I(),b=I(),c=I();a[5]=a[10]=Math.cos(x);a[6]=Math.sin(x);a[9]=-a[6];
    b[0]=b[10]=Math.cos(y);b[2]=-Math.sin(y);b[8]=-b[2];
    c[0]=c[5]=Math.cos(z);c[1]=Math.sin(z);c[4]=-c[1];return mul(mul(b,a),c);
  }
  function model(position,scale,rotation){const r=rotate(rotation);for(let c=0;c<3;c++)for(let row=0;row<3;row++)r[c*4+row]*=scale[c];r[12]=position[0];r[13]=position[1];r[14]=position[2];return r;}
  function vp(aspect,eye){const z=norm(eye.map((x,i)=>x-[0,.12,0][i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
    const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
    const f=1/Math.tan(Math.PI/8),near=.1,far=30;return mul([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0],view);
  }
  function create(canvas){
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false});
    if(!gl)return null;
    const modelAPI=root.MarbleStudioModel,buffers=[],vaos=[];let texture=null,program=null,disposed=false;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;}
    function mesh(data){const vao=gl.createVertexArray();vaos.push(vao);gl.bindVertexArray(vao);
      for(const [location,values] of [[0,data.positions],[1,data.normals]]){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);}
      const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.indices),gl.STATIC_DRAW);gl.bindVertexArray(null);return {vao,count:data.indices.length};
    }
    function dispose(){if(disposed)return;disposed=true;for(const b of buffers)gl.deleteBuffer(b);for(const v of vaos)gl.deleteVertexArray(v);if(texture)gl.deleteTexture(texture);if(program)gl.deleteProgram(program);}
    try{
      const vertex=shader(gl.VERTEX_SHADER,VERTEX);let fragment;
      try{fragment=shader(gl.FRAGMENT_SHADER,FRAGMENT);}catch(error){gl.deleteShader(vertex);throw error;}
      program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      const uniforms={};for(const name of ['uModel','uVP','uNormal','uColor','uEye','uKind','uPattern','uSeed','uBadge'])uniforms[name]=gl.getUniformLocation(program,name);
      const meshes={sphere:mesh(modelAPI.sphere()),torus:mesh(modelAPI.torus()),box:mesh(modelAPI.box())};
      const badge=document.createElement('canvas');badge.width=badge.height=256;const ink=badge.getContext('2d');
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      let lastIdentity=null,parts=[],frames=0;
      function badgeFor(character){
        const key=character.id+':'+character.number+':'+character.role;if(key===lastIdentity)return;lastIdentity=key;parts=modelAPI.roleParts(character.role);
        ink.clearRect(0,0,256,256);ink.beginPath();ink.arc(128,128,105,0,Math.PI*2);ink.fillStyle='#edf6ff';ink.fill();
        ink.lineWidth=8;ink.strokeStyle='#0b2446';ink.stroke();ink.fillStyle='#0b2446';ink.font='900 108px system-ui';ink.textAlign='center';ink.textBaseline='middle';ink.fillText(String(character.number).padStart(2,'0'),128,133,190);
        gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,badge);
      }
      function draw(character,angle){
        if(disposed||gl.isContextLost())return;
        const rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;
        const dpr=Math.min(root.devicePixelRatio||1,1.5),w=Math.min(900,Math.round(rect.width*dpr)),h=Math.min(700,Math.round(rect.height*dpr));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
        gl.viewport(0,0,w,h);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
        badgeFor(character);const eye=[2.3,1.55,4.9],view=vp(w/h,eye),spin=rotate([0,angle,0]);
        gl.uniformMatrix4fv(uniforms.uVP,false,view);gl.uniform3fv(uniforms.uEye,eye);gl.uniform1f(uniforms.uPattern,character.patternId);gl.uniform1f(uniforms.uSeed,character.seed);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniforms.uBadge,0);
        function object(shape,position,scale,rotation,color,kind,spinning=true){
          let matrix=model(position,scale,rotation);if(spinning)matrix=mul(spin,matrix);
          const normal=new Float32Array(9);for(let c=0;c<3;c++){const d=matrix[c*4]**2+matrix[c*4+1]**2+matrix[c*4+2]**2;for(let r=0;r<3;r++)normal[c*3+r]=matrix[c*4+r]/Math.max(d,1e-9);}
          gl.uniformMatrix4fv(uniforms.uModel,false,matrix);gl.uniformMatrix3fv(uniforms.uNormal,false,normal);gl.uniform3fv(uniforms.uColor,color);gl.uniform1f(uniforms.uKind,kind);gl.bindVertexArray(meshes[shape].vao);gl.drawElements(gl.TRIANGLES,meshes[shape].count,gl.UNSIGNED_SHORT,0);
        }
        gl.depthMask(false);object('box',[0,-1.04,0],[1.8,.004,1.8],[0,0,0],[0,0,0],3,false);gl.depthMask(true);
        object('torus',[0,-1.12,0],[1.28,.5,1.28],[0,0,0],character.color.map(v=>v*.45),1,false);
        object('sphere',[0,.08,0],[1,1,1],[0,0,0],character.color,0);
        for(const part of parts)object(part.shape,part.position,part.scale,part.rotation,part.finish==='light'?character.color:character.color.map(v=>.24+v*.42),part.finish==='light'?2:1);
        gl.bindVertexArray(null);canvas.dataset.renderer='webgl2';canvas.dataset.characterId=String(character.id);canvas.dataset.role=character.role;canvas.dataset.angle=angle.toFixed(4);canvas.dataset.frames=String(++frames);
      }
      return {draw,dispose};
    }catch(error){dispose();throw error;}
  }
  root.MarbleRacerPortrait=Object.freeze({create});
})(window);
