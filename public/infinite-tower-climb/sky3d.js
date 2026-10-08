// Cinematic procedural atmosphere: sky gradient, depth bands, god-rays and
// low-cost three-dimensional haze. All visual; no gameplay-state mutation.
export function createTowerSky(THREE,scene){
  const uniforms={
    top:{value:new THREE.Color(0x0e1c2d)},
    horizon:{value:new THREE.Color(0x6d6275)},
    ground:{value:new THREE.Color(0x242431)},
    time:{value:0},
    stars:{value:0}
  };
  const sky=new THREE.Mesh(
    new THREE.SphereGeometry(490,36,22),
    new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
      uniforms,
      vertexShader:`varying vec3 vDirection;
        void main(){
          vDirection=normalize(position);
          vec4 view= modelViewMatrix*vec4(position,1.0);
          gl_Position=projectionMatrix*view;
        }`,
      fragmentShader:`varying vec3 vDirection;
        uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;
        uniform float time;uniform float stars;
        float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
        void main(){
          float h=normalize(vDirection).y;
          vec3 col=mix(ground,horizon,smoothstep(-0.52,.13,h));
          col=mix(col,top,smoothstep(-.03,.93,h));
          float glow=pow(max(0.0,1.0-length(vec2(h-.05,vDirection.x*.65))),8.0);
          col+=vec3(.18,.12,.06)*glow;
          float grain=(hash(floor(vDirection*900.0))-0.5)*.005;
          col+=grain;
          if(stars>.0&&h>.05){
            float sparkle=pow(hash(floor(vDirection*270.0)),54.0)*stars;
            col+=vec3(.49,.62,1.)*sparkle*(.75+.25*sin(time*.6));
          }
          gl_FragColor=vec4(col,1.0);
        }`
    })
  );
  sky.name='Procedural cinematic sky';sky.renderOrder=-100;sky.frustumCulled=false;scene.add(sky);
  const shafts=new THREE.Group();shafts.name='Volumetric approximation';scene.add(shafts);
  const shaftMaterial=new THREE.MeshBasicMaterial({
    color:0xffd6aa,transparent:true,opacity:.026,depthWrite:false,depthTest:true,
    side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  });
  const shaftGeo=new THREE.ConeGeometry(7,63,13,1,true);
  for(let n=0;n<10;n++){
    const beam=new THREE.Mesh(shaftGeo,shaftMaterial);
    const side=n%2?-1:1;
    beam.position.set(side*(15+n*1.9),((n%5)-2)*26, -12+(n%3)*5);
    beam.rotation.z=side*(.14+n*.014);
    beam.rotation.x=.13;
    shafts.add(beam);
  }
  const dustGeometry=new THREE.BufferGeometry(),positions=new Float32Array(340*3);
  let randomSeed=0x49486a;
  const rand=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296};
  for(let i=0;i<340;i++){
    positions[i*3]=(rand()-.5)*85;
    positions[i*3+1]=(rand()-.5)*110;
    positions[i*3+2]=rand()*45-17;
  }
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const distantDust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({
    color:0xcfc2ab,size:.16,transparent:true,opacity:.2,depthWrite:false
  }));
  distantDust.frustumCulled=false;shafts.add(distantDust);
  const palette={
    foundry:[0x0d1725,0x865d58,0x262b3e,0xffbd74,0],
    ruins:[0x091e1e,0x678e75,0x253a32,0xbcffc8,0],
    clockwork:[0x171e2b,0x92775b,0x33293a,0xffcc77,0],
    storm:[0x10172b,0x627798,0x24273d,0x95b8ff,0],
    void:[0x080b1d,0x504078,0x0f102c,0x9876ff,1]
  };
  let biome='foundry';
  function setTheme(theme){
    if(theme===biome)return;
    biome=theme;const c=palette[theme]||palette.foundry;
    uniforms.top.value.setHex(c[0]);uniforms.horizon.value.setHex(c[1]);
    uniforms.ground.value.setHex(c[2]);uniforms.stars.value=c[4];
    shaftMaterial.color.setHex(c[3]);
    distantDust.material.color.setHex(c[3]);
  }
  setTheme('foundry');
  function update(t,camera,options={}){
    sky.position.copy(camera.position);
    shafts.position.y=(Number(options.climberY)||0)*.93;
    uniforms.time.value=Number(t)||0;
    if(!options.reducedMotion){
      distantDust.rotation.y=Math.sin(t*.08)*.07;
      shaftMaterial.opacity=.022+.006*Math.sin(t*.19);
    }
  }
  return {update,setTheme,sky,shafts,signature:'cinematic-atmosphere-v1'};
}
