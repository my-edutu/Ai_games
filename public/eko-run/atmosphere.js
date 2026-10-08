// EKO RUN — sunlit sky, original procedural atmospheric backdrop.
// Single gradient shader + bounded cloud puffs. Presentation only.
export function createCityAtmosphere(THREE, scene) {
  const root = new THREE.Group();
  root.name = 'Eko Run | sun and clouds';
  scene.add(root);
  const uniforms={
    skyTop:{value:new THREE.Color('#1686bc')},
    skyBottom:{value:new THREE.Color('#f9b87c')},
    horizon:{value:new THREE.Color('#fff0b6')},
    sunTint:{value:new THREE.Color('#ffe4a1')},
    sunPosition:{value:new THREE.Vector2(.69,.56)},
    darkness:{value:0},
  };
  const fragmentShader=[
    'varying vec2 vUv;',
    'uniform vec3 skyTop, skyBottom, horizon, sunTint;',
    'uniform vec2 sunPosition;',
    'uniform float darkness;',
    'void main(){',
    '  float height=smoothstep(0.0,1.0,vUv.y);',
    '  vec3 sky=mix(skyBottom,skyTop,pow(height,0.78));',
    '  float horizonBand=exp(-pow((vUv.y-.39)*4.8,2.0));',
    '  sky=mix(sky,horizon,0.28*horizonBand);',
    '  float d=length((vUv-sunPosition)*vec2(1.5,1.0));',
    '  float disc=1.0-smoothstep(.023,.041,d);',
    '  float halo=1.0-smoothstep(.035,.25,d);',
    '  float outer=1.0-smoothstep(.08,.48,d);',
    '  sky+=sunTint*(disc*.92+halo*.23+outer*.06)*(1.0-darkness*.22);',
    '  float cloudA=sin(vUv.x*19.0+sin(vUv.y*11.0))*sin(vUv.x*37.0-vUv.y*7.0);',
    '  sky+=vec3(1.0,.90,.72)*max(0.0,cloudA-0.7)*.055;',
    '  gl_FragColor=vec4(sky,1.);',
    '}',
  ].join('\n');
  const shader=new THREE.ShaderMaterial({
    uniforms,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader,
    depthWrite:false,depthTest:false,toneMapped:false,fog:false,side:THREE.DoubleSide
  });
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(520,125),shader);
  sky.name='Eko procedural sunset sky';sky.position.set(0,18,-74);
  sky.renderOrder=-500;root.add(sky);
  const cloudMat=new THREE.MeshBasicMaterial({color:0xfff9e5,transparent:true,opacity:.68,depthWrite:false,fog:false});
  // Previous nine groups × five cloud sphere meshes required 45 GPU draw calls
  // in the expensive software CI renderer. Bake their transforms into ONE
  // dynamic instanced mesh without losing original scrolling parallax.
  const cloudGeometry=new THREE.SphereGeometry(1.0,8,6);
  const CLOUD_COUNT=45;
  const clouds=new THREE.InstancedMesh(cloudGeometry,cloudMat,CLOUD_COUNT);
  clouds.name='Eko instanced atmospheric cloud formations';
  clouds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  clouds.frustumCulled=false;clouds.renderOrder=-100;root.add(clouds);
  const cloudPivot=new THREE.Object3D();
  function placeClouds(viewX,now,reducedMotion){
    for(let i=0;i<9;i++){
      const spread=(i%4)*3.3;
      const radius=.7+.23*(i%3);
      const base=(i-4)*15+(i%3)*7;
      const scroll=viewX*.70+base+(reducedMotion?0:Math.sin(now*.00008+i)*1.3);
      for(let j=0;j<5;j++){
        const k=i*5+j;
        cloudPivot.position.set(
          scroll+(j-2)*radius*1.35,
          11+spread+Math.sin(j*2.9)*radius*.22,
          -45-(i%3)*6
        );
        cloudPivot.scale.set(radius*(1.7+j*.15),radius*(.45+j%2*.16),radius*.38);
        cloudPivot.rotation.set(0,0,0);cloudPivot.updateMatrix();
        clouds.setMatrixAt(k,cloudPivot.matrix);
      }
    }
    clouds.instanceMatrix.needsUpdate=true;
  }
  placeClouds(0,0,true);
  const skies={
    'mainland-morning':['#1488be','#ffaa74','#ffe1a5','#ffe8b3',.14],
    'market-rush':['#b75385','#ff9b63','#ffd0a8','#ffcf8a',.16],
    'danfo-junction':['#2797c2','#fbb96f','#ffe3aa','#fff0b0',.15],
    'rainy-lagos':['#364b79','#92a8b9','#c7d5dc','#e7f0e7',.75],
    'island-night':['#121947','#5b3d77','#a05d85','#c7b6e7',.92],
    'bridge-run':['#208dac','#95d8ba','#fff0c3','#fff6cb',.18],
  };
  let active='',lastX=NaN;
  function setDistrict(district){
    if(district===active)return;
    const [top,bottom,near,sunColor,dark]=skies[district]||skies['mainland-morning'];
    uniforms.skyTop.value.set(top);uniforms.skyBottom.value.set(bottom);
    uniforms.horizon.value.set(near);uniforms.sunTint.value.set(sunColor);
    uniforms.darkness.value=dark;
    cloudMat.opacity=district==='rainy-lagos'?.43:district==='island-night'?.18:.61;
    uniforms.sunPosition.value.set(district==='island-night'?.77:.67,district==='island-night'?.47:.66);
    active=district;
  }
  function update(viewX,now=0,reducedMotion=false) {
    if(!Number.isFinite(viewX))return;
    if(!Number.isFinite(lastX)||Math.abs(lastX-viewX)>.01){
      sky.position.x=viewX;lastX=viewX;
    }
    placeClouds(viewX,now,reducedMotion);
  }
  function destroy(){
    root.parent?.remove(root);
    clouds.dispose();cloudMat.dispose();cloudGeometry.dispose();sky.geometry.dispose();shader.dispose();
  }
  return Object.freeze({setDistrict,update,destroy,signature:'single-shader-city-sky'});
}
