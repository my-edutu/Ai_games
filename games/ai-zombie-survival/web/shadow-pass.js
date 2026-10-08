// Native WebGL2 directional shadow-map pass for the *actual* static/dynamic 3D scene.
// Optional 'cinematic' graphics mode; CPU/software renderers keep an inexpensive fallback.
export function createSunShadows(gl,{resolution=640}={}){
  const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE)||1024;
  const size=Math.max(256,Math.min(resolution,maxTexture));
  const depth=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,depth);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const fbo=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
  gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  const complete=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  if(!complete){
    gl.deleteFramebuffer(fbo);gl.deleteTexture(depth);
    return {available:false,render(){return null},texture:null,resolution:0};
  }
  const compile=(type,source)=>{
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Shadow GLSL: '+gl.getShaderInfoLog(shader));
    return shader;
  };
  const vertex=compile(gl.VERTEX_SHADER,[
    '#version 300 es','precision highp float;',
    'layout(location=0) in vec3 aPosition;',
    'uniform mat4 uLightVP;',
    'void main(){gl_Position=uLightVP*vec4(aPosition,1.0);}'
  ].join('\n'));
  const frag=compile(gl.FRAGMENT_SHADER,[
    '#version 300 es','precision highp float;',
    'void main(){}'
  ].join('\n'));
  const program=gl.createProgram();
  gl.attachShader(program,vertex);gl.attachShader(program,frag);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shadow link: '+gl.getProgramInfoLog(program));
  gl.detachShader(program,vertex);gl.detachShader(program,frag);gl.deleteShader(vertex);gl.deleteShader(frag);
  const uniform=gl.getUniformLocation(program,'uLightVP');
  const ortho=(l,r,b,t,n,f)=>[
    2/(r-l),0,0,0, 0,2/(t-b),0,0, 0,0,-2/(f-n),0,
    -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1
  ];
  const norm=(v)=>{const h=Math.hypot(...v)||1;return v.map(x=>x/h);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0);
  const view=(eye,target)=>{
    const f=norm(target.map((x,i)=>x-eye[i]));const side=norm(cross(f,[0,1,0])),up=cross(side,f);
    return[side[0],up[0],-f[0],0,side[1],up[1],-f[1],0,side[2],up[2],-f[2],0,-dot(side,eye),-dot(up,eye),dot(f,eye),1];
  };
  const mul=(a,b)=>{const o=Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++){
    let t=0;for(let k=0;k<4;k++)t+=a[k*4+row]*b[col*4+k];o[col*4+row]=t;
  }return o;};
  return {
    available:true,texture:depth,resolution:size,
    render(meshes,cameraX,cameraZ,canvasWidth,canvasHeight){
      const target=[cameraX,0,cameraZ],eye=[cameraX-55,84,cameraZ+45];
      const lightVP=mul(ortho(-77,77,-68,68,2,180),view(eye,target));
      const prevProgram=gl.getParameter(gl.CURRENT_PROGRAM);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,size,size);
      gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
      gl.useProgram(program);gl.uniformMatrix4fv(uniform,false,new Float32Array(lightVP));
      for(const mesh of meshes)if(mesh.count){
        gl.bindVertexArray(mesh.vao);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
      }
      gl.bindVertexArray(null);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      gl.viewport(0,0,canvasWidth,canvasHeight);gl.useProgram(prevProgram);
      return lightVP;
    },
    dispose(){
      gl.deleteFramebuffer(fbo);gl.deleteTexture(depth);gl.deleteProgram(program);
    }
  };
}
