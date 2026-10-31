// A single bounded depth texture. Unsupported devices retain the old geometry
// fallback; no simulation state, randomness, provider or asset fetch is involved.
const sunMap={supported:false,complete:false,size:0,passes:0,key:'',matrix:new Float32Array(16),reason:'WebGL unavailable'};
if(gpuAvailable&&gl.getExtension('WEBGL_depth_texture')){
 const size=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE));
 const fb=gl.createFramebuffer(),depth=gl.createTexture(),color=gl.createRenderbuffer();
 gl.bindTexture(gl.TEXTURE_2D,depth);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
 gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
 gl.bindRenderbuffer(gl.RENDERBUFFER,color);gl.renderbufferStorage(gl.RENDERBUFFER,gl.RGBA4,size,size);
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,color);
 const complete=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
 if(complete){
  const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,'attribute vec3 position;uniform mat4 matrix;void main(){gl_Position=matrix*vec4(position,1.);}'));
  gl.attachShader(p,shader(gl.FRAGMENT_SHADER,'precision mediump float;void main(){gl_FragColor=vec4(1.);}'));gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Sun depth program: '+gl.getProgramInfoLog(p));
  Object.assign(sunMap,{supported:true,complete:true,size,fb,depth,color,program:p,position:gl.getAttribLocation(p,'position'),uniform:gl.getUniformLocation(p,'matrix'),reason:''});
 }else{gl.deleteFramebuffer(fb);gl.deleteTexture(depth);gl.deleteRenderbuffer(color);sunMap.reason='Depth framebuffer unavailable';}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindRenderbuffer(gl.RENDERBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,null);
}
function drawSunMap(staticCount,dynamicCount,atmosphere){
 if(!sunMap.supported)return;
 const key=scenicMeshRebuilds+':'+state.t+':'+people.map(p=>[p.x,p.z,p.phase,p.activity].join(',')).join(';');
 if(sunMap.key===key)return;
 const az=state.t/24*Math.PI*2,light=[Math.cos(az),.30+atmosphere.daylight*.9,Math.sin(az)],length=Math.hypot(...light);
 const eye=light.map(v=>v/length*95);const projection=new Float32Array([1/54,0,0,0,0,1/54,0,0,0,0,-2/190,0,0,0,-1-2/190,1]);
 sunMap.matrix=mat4multiply(projection,lookAt(eye,[0,0,0],[0,1,0]));
 gl.bindFramebuffer(gl.FRAMEBUFFER,sunMap.fb);gl.viewport(0,0,sunMap.size,sunMap.size);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.colorMask(false,false,false,false);gl.disable(gl.CULL_FACE);
 gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(sunMap.program);
 gl.uniformMatrix4fv(sunMap.uniform,false,sunMap.matrix);gl.enableVertexAttribArray(sunMap.position);
 for(const [vbo,count] of [[staticBuffer,staticCount],[buffer,dynamicCount]]){
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.vertexAttribPointer(sunMap.position,3,gl.FLOAT,false,40,0);gl.drawArrays(gl.TRIANGLES,0,count);
 }
 gl.colorMask(true,true,true,true);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
 sunMap.key=key;sunMap.passes++;
}
function lightingStats(){return {model:'directional-depth-pcf3',supported:sunMap.supported,framebufferComplete:sunMap.complete,mapSize:sunMap.size,passes:sunMap.passes,fallbackReason:sunMap.reason,error:gpuAvailable?gl.getError():null};}
