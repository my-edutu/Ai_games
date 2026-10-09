// Native WebGL2 distant infected renderer: one permanent articulated silhouette mesh,
// thousands of agent positions in ONE GPU instanced draw rather than CPU rebuilding
// and uploading a complete human mesh for every zombie 20–30 times per second.
// Read-only from the game's fixed-step authoritative state.

const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
export function partitionHorde(zombies,cameraX,cameraZ,{detailRadius=12,maxDetailed=22,maxInstances=500,range=58}={}){
  const detail=[],instanced=[];
  const cutoff=detailRadius*detailRadius,maxDist=range*range;
  // Preserve all visible enemies. Do not mutate or sort game.zombies in place.
  const candidates=[];
  for(const zombie of zombies){
    if(zombie.health<=0)continue;
    const dist=(zombie.x-cameraX)**2+(zombie.y-cameraZ)**2;
    if(dist<=maxDist)candidates.push({actor:zombie,dist});
  }
  candidates.sort((a,b)=>a.dist-b.dist||(String(a.actor.id).localeCompare(String(b.actor.id))));
  for(const entry of candidates){
    if(entry.dist<=cutoff&&detail.length<maxDetailed)detail.push(entry);
    else if(instanced.length<maxInstances)instanced.push(entry);
  }
  return {detail,instanced,culled:candidates.length-detail.length-instanced.length};
}

const skin={
  shambler:[.59,.66,.52],runner:[.63,.75,.56],brute:[.71,.59,.49]
};
function makeSilhouette(){
  const triangles=[];
  const tri=(a,b,c,color)=>{
    const u=b.map((v,i)=>v-a[i]),v=c.map((p,i)=>p-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const len=Math.hypot(...n)||1;
    triangles.push({a,b,c,n:n.map(i=>i/len),color});
  };
  const ellipsoid=(x,y,z,rx,ry,rz,col,rows=6,sides=9)=>{
    const pt=(phi,theta)=>[x+Math.sin(phi)*Math.cos(theta)*rx,
      y+Math.cos(phi)*ry,z+Math.sin(phi)*Math.sin(theta)*rz];
    for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){
      const p=i*Math.PI/rows,q=(i+1)*Math.PI/rows;
      const t=j*2*Math.PI/sides,u=(j+1)*2*Math.PI/sides;
      tri(pt(p,t),pt(q,u),pt(q,t),col);tri(pt(p,t),pt(p,u),pt(q,u),col); // outward sphere normals
    }
  };
  const capsule=(a,b,radius,col,segments=7)=>{
    const direction=b.map((v,i)=>v-a[i]),length=Math.hypot(...direction);
    if(length<1e-5)return;
    const up=direction.map(v=>v/length);
    let cross=[-up[2],0,up[0]];
    if(Math.hypot(...cross)<.001)cross=[1,0,0];
    const len=Math.hypot(...cross);cross=cross.map(v=>v/len);
    const bitangent=[up[1]*cross[2]-up[2]*cross[1],up[2]*cross[0]-up[0]*cross[2],up[0]*cross[1]-up[1]*cross[0]];
    const at=(center,t)=>center.map((v,i)=>v+radius*(Math.cos(t)*cross[i]+Math.sin(t)*bitangent[i]));
    for(let i=0;i<segments;i++){
      const t=i*2*Math.PI/segments,u=(i+1)*2*Math.PI/segments;
      const A=at(a,t),B=at(b,t),C=at(b,u),D=at(a,u);
      tri(A,B,C,col);tri(A,C,D,col);
    }
  };
  // Infected proportions: slouched ribcage, forward skull, asymmetric reach.
  ellipsoid(0,1.48,-.06,.38,.48,.28,[.33,.40,.38],8,11);
  ellipsoid(0,1.01,-.10,.28,.21,.23,[.25,.32,.31],6,9);
  ellipsoid(0,2.25,.12,.24,.29,.23,[.64,.61,.50],8,11);
  ellipsoid(-.087,2.25,.313,.048,.052,.019,[.97,.33,.28],4,7);
  ellipsoid(.094,2.25,.313,.043,.053,.019,[.92,.40,.30],4,7);
  capsule([-.33,1.78,0],[-.53,1.37,.26],.106,[.39,.44,.37]);
  capsule([-.53,1.37,.26],[-.51,1.08,.43],.081,[.54,.56,.47]);
  capsule([.34,1.75,0],[.50,1.42,.28],.122,[.40,.41,.35]);
  capsule([.50,1.42,.28],[.46,1.14,.47],.085,[.56,.53,.42]);
  capsule([-.19,.92,-.09],[-.20,.51,.10],.145,[.22,.29,.29]);
  capsule([-.20,.51,.10],[-.24,.13,-.08],.119,[.27,.32,.31]);
  capsule([.21,.91,-.09],[.28,.55,-.25],.158,[.24,.30,.30]);
  capsule([.28,.55,-.25],[.24,.14,-.16],.121,[.26,.31,.32]);
  ellipsoid(-.26,.12,.12,.14,.09,.28,[.15,.22,.25],4,8);
  ellipsoid(.23,.12,.06,.14,.09,.28,[.16,.22,.26],4,8);
  const array=new Float32Array(triangles.length*27);
  let at=0;
  for(const triangle of triangles)for(const p of [triangle.a,triangle.b,triangle.c]){
    for(const v of p)array[at++]=v;
    for(const v of triangle.n)array[at++]=v;
    for(const v of triangle.color)array[at++]=v;
  }
  return {data:array,triangles:triangles.length};
}

export function inspectHordeSilhouette(){return makeSilhouette();}
// Loop 56: software hordes use cheap fog and a cool night rim; hardware remains cinematic.
export function hordeFragmentSource(shaderPath='cinematic'){
  const common=[
    '#version 300 es','precision highp float;',
    'in vec3 vNormal;in vec3 vColor;in vec3 vWorld;',
    'uniform vec3 uEye;uniform vec3 uFogColor;uniform float uFog;uniform float uNight;',
    'out vec4 outColor;'
  ];
  const body=shaderPath==='low-spec'?[
    'void main(){vec3 n=normalize(vNormal);',
    'float key=max(dot(n,normalize(vec3(-.55,1.0,.48))),0.0);',
    'float hemi=.69+.27*key+.12*max(n.y,0.0);',
    'vec3 color=vColor*hemi*mix(vec3(1.04,1.00,.90),vec3(.82,.90,1.11),uNight);',
    'vec3 delta=uEye-vWorld;',
    'float rim=1.0-max(dot(n,normalize(delta)),0.0);rim*=rim;',
    'color+=vec3(.20,.30,.37)*rim*(.12+.72*uNight);',
    'float fog2=dot(delta,delta)*uFog*uFog;',
    'float haze=clamp(fog2/(1.0+fog2),0.0,.69);',
    'outColor=vec4(mix(color,uFogColor,haze),1.0);}'
  ]:[
    'void main(){vec3 n=normalize(vNormal),light=normalize(vec3(-.55,1.0,.48));',
    'float hemi=.52+.29*max(0.0,dot(n,light))+.14*max(n.y,0.0);',
    'vec3 color=vColor*hemi*mix(vec3(1.08,1.04,.90),vec3(.66,.77,1.12),uNight);',
    'float haze=1.0-exp(-pow(distance(uEye,vWorld)*uFog,2.0));',
    'outColor=vec4(mix(color,uFogColor,clamp(haze,0.0,.71)),1.0);}'
  ];
  return [...common,...body].join('\n');
}
export function createInstancedHorde(gl,{maxInstances=500,shaderPath='cinematic'}={}){
  const compiled=makeSilhouette(),limit=Math.max(1,Math.min(2048,maxInstances));
  const compile=(kind,source)=>{
    const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Horde shader: '+gl.getShaderInfoLog(shader));
    return shader;
  };
  const vertex=compile(gl.VERTEX_SHADER,[
    '#version 300 es','precision highp float;',
    'layout(location=0) in vec3 aPosition;',
    'layout(location=1) in vec3 aNormal;',
    'layout(location=2) in vec3 aColor;',
    'layout(location=3) in vec4 aInstance;', // x, z, yaw, body scale
    'layout(location=4) in vec3 aTint;',
    'uniform mat4 uVP; uniform float uTime;',
    'out vec3 vNormal; out vec3 vColor; out vec3 vWorld;',
    'void main(){float yaw=aInstance.z,c=cos(yaw),s=sin(yaw);',
    'float variant=aTint.b;', // arbitrary tint variations keep crowd distinct
    'vec3 p=aPosition;',
    'p.y+=sin(uTime*(5.0+variant)+aInstance.x*1.97+aInstance.y)*.024*min(1.0,p.y);',
    'p.x*=aInstance.w;p.y*=aInstance.w;p.z*=aInstance.w;',
    'vec3 pos=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c)+vec3(aInstance.x,0.0,aInstance.y);',
    'vNormal=normalize(vec3(aNormal.x*c+aNormal.z*s,aNormal.y,-aNormal.x*s+aNormal.z*c));',
    'vColor=aColor*mix(vec3(.58,.64,.60),aTint,.63);vWorld=pos;',
    'gl_Position=uVP*vec4(pos,1.0);}'
  ].join('\n'));
  const fragment=compile(gl.FRAGMENT_SHADER,hordeFragmentSource(shaderPath));
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Horde link: '+gl.getProgramInfoLog(program));
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  const vao=gl.createVertexArray(),geometry=gl.createBuffer(),instances=gl.createBuffer();
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,geometry);
  gl.bufferData(gl.ARRAY_BUFFER,compiled.data,gl.STATIC_DRAW);
  for(let slot=0;slot<3;slot++){
    gl.enableVertexAttribArray(slot);gl.vertexAttribPointer(slot,3,gl.FLOAT,false,36,slot*12);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,instances);
  gl.bufferData(gl.ARRAY_BUFFER,limit*7*4,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.FLOAT,false,28,0);gl.vertexAttribDivisor(3,1);
  gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,3,gl.FLOAT,false,28,16);gl.vertexAttribDivisor(4,1);
  gl.bindVertexArray(null);
  const uniform=Object.fromEntries(['uVP','uEye','uFogColor','uFog','uNight','uTime'].map(k=>[k,gl.getUniformLocation(program,k)]));
  const scratch=new Float32Array(limit*7);
  let count=0,trianglesDrawn=0;
  function update(entries){
    count=Math.min(limit,entries.length);let n=0;
    for(let i=0;i<count;i++){
      const z=entries[i].actor??entries[i],tint=skin[z.archetype]||skin.shambler;
      scratch[n++]=z.x;scratch[n++]=z.y;scratch[n++]=z.facing||0;
      scratch[n++]=z.archetype==='brute'?1.31:z.archetype==='runner'?.87:1;
      const variation=1+((z.variant||0)%5-2)*.065;
      scratch[n++]=clamp(tint[0]*variation,0,1);
      scratch[n++]=clamp(tint[1]*variation,0,1);
      scratch[n++]=clamp(tint[2]*variation,0,1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,instances);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,scratch.subarray(0,count*7));
    trianglesDrawn=compiled.triangles*count;
    return count;
  }
  function render({vp,eye,sky,night=0,fog=.004,time=0}){
    if(!count)return 0;
    const original=gl.getParameter(gl.CURRENT_PROGRAM);
    gl.useProgram(program);
    gl.uniformMatrix4fv(uniform.uVP,false,new Float32Array(vp));
    gl.uniform3fv(uniform.uEye,new Float32Array(eye));
    gl.uniform3fv(uniform.uFogColor,new Float32Array(sky));
    gl.uniform1f(uniform.uNight,night?1:0);
    gl.uniform1f(uniform.uFog,fog);
    gl.uniform1f(uniform.uTime,time);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLES,0,compiled.data.length/9,count);
    gl.bindVertexArray(null);gl.useProgram(original);
    return count;
  }
  return {update,render,get shaderPath(){return shaderPath},get count(){return count},get triangles(){return trianglesDrawn},
    get silhouetteTriangles(){return compiled.triangles},
    dispose(){gl.deleteProgram(program);gl.deleteBuffer(geometry);gl.deleteBuffer(instances);gl.deleteVertexArray(vao);}};
}
