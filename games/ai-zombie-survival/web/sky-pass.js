// Render-only sky atmosphere; this pass never changes authoritative simulation state.
export function createSkyPass(gl){
  const vertexSource=[
    '#version 300 es','precision highp float;','layout(location=0) in vec2 aPosition;',
    'out vec2 vUV;',
    'void main(){vUV=aPosition*0.5+0.5;gl_Position=vec4(aPosition,0.99,1.0);}'
  ].join('\n');
  const fragmentSource=[
    '#version 300 es','precision highp float;','in vec2 vUV;',
    'uniform float uSkyTime; uniform float uSkyNight; uniform float uSkySunset; uniform float uSkyWeather;',
    'out vec4 outSky;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);',
    'return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'void main(){float h=clamp(vUV.y,0.0,1.0);',
    'vec3 dayLow=vec3(0.77,0.88,0.90),dayHigh=vec3(0.15,0.49,0.70);',
    'vec3 sunsetLow=vec3(1.00,0.62,0.38),sunsetHigh=vec3(0.40,0.29,0.62);',
    'vec3 nightLow=vec3(0.14,0.26,0.38),nightHigh=vec3(0.020,0.050,0.120);',
    'vec3 base=mix(dayLow,dayHigh,smoothstep(0.0,1.0,h));',
    'base=mix(base,mix(sunsetLow,sunsetHigh,h),uSkySunset);',
    'base=mix(base,mix(nightLow,nightHigh,h),uSkyNight);',
    'float cloud=noise(vec2(vUV.x*5.2+uSkyTime*0.001,vUV.y*5.8));',
    'cloud=0.55*cloud+0.45*noise(vec2(vUV.x*10.2-uSkyTime*0.001,vUV.y*10.1));',
    'float band=smoothstep(.49,.75,cloud)*smoothstep(.12,.42,h);',
    'base=mix(base,vec3(1.0,0.89,0.76),band*(.29-uSkyNight*.13));',
    'vec2 sunPos=vec2(.75,.67);float sun=1.0-smoothstep(.018,.065,length((vUV-sunPos)*vec2(1.5,1.0)));',
    'base+=vec3(1.0,.67,.34)*sun*(1.-uSkyNight)*(.11+.16*uSkySunset);',
    'float storm=mix(1.0,.55,uSkyWeather);base*=storm;',
    'outSky=vec4(clamp(base,0.0,1.0),1.0);}'
  ].join('\n');
  const compile=(kind,source)=>{
    const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Sky shader: '+gl.getShaderInfoLog(s));
    return s;
  };
  const program=gl.createProgram();
  const vertex=compile(gl.VERTEX_SHADER,vertexSource),fragment=compile(gl.FRAGMENT_SHADER,fragmentSource);
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Sky link: '+gl.getProgramInfoLog(program));
  gl.detachShader(program,vertex);gl.detachShader(program,fragment);gl.deleteShader(vertex);gl.deleteShader(fragment);
  const uniforms=Object.fromEntries(['uSkyTime','uSkyNight','uSkySunset','uSkyWeather'].map(k=>[k,gl.getUniformLocation(program,k)]));
  const vao=gl.createVertexArray(),vbo=gl.createBuffer();
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindVertexArray(null);
  return function drawSky(game){
    const previous=gl.getParameter(gl.CURRENT_PROGRAM);
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
    gl.useProgram(program);gl.bindVertexArray(vao);
    const phase=game.time.phase;
    gl.uniform1f(uniforms.uSkyTime,game.time.elapsed);
    gl.uniform1f(uniforms.uSkyNight,phase==='night'?1:0);
    gl.uniform1f(uniforms.uSkySunset,phase==='sunset'?1:phase==='dawn'?.65:0);
    gl.uniform1f(uniforms.uSkyWeather,game.weather.kind==='storm'?1:game.weather.kind==='rain'?.4:0);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindVertexArray(null);gl.useProgram(previous);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);
  };
}
