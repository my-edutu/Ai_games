// Biome weather authored as one GPU particle draw call, not an image overlay.
// Fire ash, jade spores, gearspark dust, driving rain and astral motes.
// All particles are decorative: the autonomous physics stream remains authoritative.
export function createTowerWeather(THREE,scene){
  const COUNT=520;
  const geometry=new THREE.BufferGeometry();
  const positions=new Float32Array(COUNT*3),seeds=new Float32Array(COUNT);
  let rng=0x1ba55971;
  const rand=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296};
  for(let i=0;i<COUNT;i++){
    positions[3*i]=(rand()-.5)*65;
    positions[3*i+1]=(rand()-.5)*90;
    positions[3*i+2]=(rand()-.5)*40;
    seeds[i]=rand();
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  const uniforms={
    uTime:{value:0},
    uMode:{value:0},
    uWind:{value:0},
    uColor:{value:new THREE.Color(0xffbd76)},
    uHighlight:{value:new THREE.Color(0xff684c)},
    uOpacity:{value:.82}
  };
  const material=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,depthTest:true,fog:false,
    blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute float aSeed;
      varying float vSeed;
      uniform float uTime;uniform float uMode;uniform float uWind;
      void main(){
        vSeed=aSeed;
        vec3 pos=position;
        float travel=uMode>2.5&&uMode<3.5?-26.0:(uMode<.5?1.6:uMode<1.5?.8:2.0);
        float drift=uTime*travel*(.38+aSeed*1.2);
        pos.y=mod(position.y+drift+45.0,90.0)-45.0;
        pos.x+=sin(uTime*.26+aSeed*43.0+position.y*.11)*(.45+aSeed*2.6);
        pos.x+=uWind*uTime*.24;
        pos.z+=cos(uTime*.37+aSeed*25.0)*(.2+aSeed*.85);
        vec4 mv=modelViewMatrix*vec4(pos,1.0);
        gl_Position=projectionMatrix*mv;
        float distanceScale=120.0/max(7.0,-mv.z);
        gl_PointSize=clamp((uMode>2.5&&uMode<3.5?3.2:5.0)*distanceScale*(.38+aSeed*.8),1.4,18.0);
      }`,
    fragmentShader:`
      varying float vSeed;
      uniform vec3 uColor;uniform vec3 uHighlight;
      uniform float uTime;uniform float uOpacity;uniform float uMode;
      void main(){
        vec2 pixel=gl_PointCoord-.5;
        if(uMode>2.5&&uMode<3.5)pixel*=vec2(2.2,.62);
        float radius=length(pixel);
        float soft=1.0-smoothstep(.05,.48,radius);
        vec3 color=mix(uColor,uHighlight,fract(vSeed*4.2));
        float twinkle=.74+.26*sin(uTime*(1.8+vSeed*3.3)+vSeed*35.0);
        float alpha=soft*twinkle*uOpacity;
        if(alpha<.01)discard;
        gl_FragColor=vec4(color,alpha);
      }`
  });
  const points=new THREE.Points(geometry,material);
  points.name='Biome atmospheric particles (1 draw call)';
  points.frustumCulled=false;points.renderOrder=2;scene.add(points);
  const palettes={
    foundry:{mode:0,color:0xffbe78,highlight:0xff5746,wind:.1,opacity:.9},
    ruins:{mode:1,color:0x75ffc1,highlight:0xd8ff85,wind:.05,opacity:.82},
    clockwork:{mode:2,color:0xffde84,highlight:0x65edff,wind:.1,opacity:.78},
    storm:{mode:3,color:0x9ee0ff,highlight:0xe6faff,wind:2.5,opacity:.73},
    void:{mode:4,color:0xc694ff,highlight:0xff72d2,wind:-.1,opacity:.95}
  };
  let active='foundry';
  function setTheme(theme){
    const key=Object.hasOwn(palettes,theme)?theme:'foundry',p=palettes[key];
    active=key;uniforms.uMode.value=p.mode;uniforms.uColor.value.setHex(p.color);
    uniforms.uHighlight.value.setHex(p.highlight);
    uniforms.uWind.value=p.wind;uniforms.uOpacity.value=p.opacity;
  }
  function update(elapsed,hero,reduced=false){
    uniforms.uTime.value=reduced?0:Math.max(0,Number(elapsed)||0);
    points.position.set(Number(hero?.x||0),Math.round(Number(hero?.y||0)/60)*60,Number(hero?.z||0));
  }
  setTheme('foundry');
  return {root:points,setTheme,update,count:COUNT,get theme(){return active},
    signature:'five-biome-gpu-atmospherics-v1'};
}
