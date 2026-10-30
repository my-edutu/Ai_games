'use strict';
(function(){
  const THREE=window.THREE,Polish=window.EscapeRoomPolish,Mechanisms=window.EscapeMechanisms;if(!THREE||!Polish||!Mechanisms)return;
  const RENDERER=Polish.rendererId;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const human=value=>String(value??'').replace(/^escape\.object\./,'').replace(/[-_.]+/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
  const escaped=state=>(state?.scene==='result'||state?.scene==='intermission')&&state?.avatar?.mode==='celebrating';
  class EscapeRoom3D{
    constructor(canvas,options={}){
      this.canvas=canvas;this.reducedMotion=Boolean(options.reducedMotion);this.highContrast=Boolean(options.highContrast);this.state=null;this.followFocus=false;this.mode='room';this.inspectId=null;this.objectWorld=new Map();this.interactive=[];this.lastEventSeq=0;this.lastSignature='';this.lastHazardSignature='';this.lastTheme='';this.qualityTier='high';this.frameSamples=[];this.effectBursts=[];this.lastSolved=new Set();this.geo=new Map();this.materials={};this.staticPropCount=0;this.themedDressing=0;
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.24;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;canvas.dataset.renderer=RENDERER;
      this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(0x091317,9,25);this.camera=new THREE.PerspectiveCamera(Polish.camera.fov,1,Polish.camera.near,Polish.camera.far);this.targetCamera=new THREE.Vector3(...Polish.camera.room);this.targetLook=new THREE.Vector3(...Polish.camera.look);this.currentLook=this.targetLook.clone();this.camera.position.copy(this.targetCamera);
      this.staticRoot=new THREE.Group();this.dynamicRoot=new THREE.Group();this.hazardRoot=new THREE.Group();this.effectRoot=new THREE.Group();this.scene.add(this.staticRoot,this.dynamicRoot,this.hazardRoot,this.effectRoot);
      this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.archivist=window.EscapeArchivist.create();this.aiRoot=this.archivist.group;this.scene.add(this.aiRoot);let shadowMeshes=0;this.aiRoot.traverse(n=>{if(n.isMesh){n.castShadow=shadowMeshes++<4;}});
      this.keyLight=new THREE.DirectionalLight(0xffe4c7,3.2);this.keyLight.position.set(2.5,7,5);this.keyLight.castShadow=true;this.keyLight.shadow.mapSize.set(1024,1024);this.keyLight.shadow.bias=-.0004;this.keyLight.shadow.normalBias=.035;this.keyLight.shadow.camera.left=-7;this.keyLight.shadow.camera.right=7;this.keyLight.shadow.camera.top=7;this.keyLight.shadow.camera.bottom=-7;this.keyLight.shadow.camera.near=.5;this.keyLight.shadow.camera.far=22;this.fillLight=new THREE.HemisphereLight(0xc5dbe0,0x64513b,2.05);this.warmLight=new THREE.PointLight(0xffc28b,32,10,2);this.warmLight.position.set(-2.6,3.35,-5.7);this.coolLight=new THREE.PointLight(0x9dc5d6,24,10,2);this.coolLight.position.set(4.2,3.8,.4);this.scene.add(this.keyLight,this.fillLight,this.warmLight,this.coolLight);
      this.setQuality('high');this.rebuildTheme('cipher-vault');this.createDust();this.resize();this.roomView();
      this.onPointerDown=event=>{if(!this.disposed)this.pick(event)};
      this.onKeyDown=event=>{if(this.disposed)return;if(event.key.toLowerCase()==='i'&&this.state?.focusObjectId)this.inspect(this.state.focusObjectId);if(event.key==='Escape')this.roomView()};
      this.onResize=()=>{if(!this.disposed)this.resize()};
      canvas.addEventListener('pointerdown',this.onPointerDown);addEventListener('keydown',this.onKeyDown);addEventListener('resize',this.onResize,{passive:true});this.resizeObserver=new ResizeObserver(this.onResize);this.resizeObserver.observe(canvas);
      this.lastFrame=performance.now();this.frameRequest=requestAnimationFrame(now=>this.frame(now));
    }
    geom(key,create){if(!this.geo.has(key))this.geo.set(key,create());return this.geo.get(key)}
    add(root,geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1],shadow=true){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.scale.set(...scale);mesh.castShadow=shadow;mesh.receiveShadow=shadow;root.add(mesh);return mesh}
    material(color,metalness,roughness,extra={}){return new THREE.MeshStandardMaterial({color,metalness,roughness,...extra})}
    rebuildTheme(theme){
      this.lastTheme=theme;for(const material of Object.values(this.materials))material?.dispose?.();const p=Polish.themes[theme]||Polish.themes['cipher-vault'];const white=this.highContrast?0xf5f5f5:null;
      this.materials={
        wall:this.material(white??p.wall,.28,.72),floor:this.material(this.highContrast?0x111111:p.floor,.12,.86),wood:this.material(this.highContrast?0x4a4a4a:p.wood,.08,.74),metal:this.material(this.highContrast?0x777777:p.metal,.72,.32),brass:this.material(this.highContrast?0xffe000:p.accent,.78,.28),accent:this.material(p.accent,.55,.26,{emissive:p.accent,emissiveIntensity:.12}),cyan:this.material(p.secondary,.38,.25,{emissive:p.secondary,emissiveIntensity:.16}),paper:this.material(this.highContrast?0xffffff:p.paper,.02,.94),danger:this.material(p.danger,.35,.28,{emissive:p.danger,emissiveIntensity:.35}),success:this.material(0x58d58a,.35,.27,{emissive:0x2a9a59,emissiveIntensity:.22}),dark:this.material(0x111719,.48,.54),stone:this.material(0x363b3b,.08,.92),glass:this.material(p.secondary,.05,.2,{transparent:true,opacity:.27,depthWrite:false}),ink:this.material(0x1a1b18,.02,.86),
        hazardRed:new THREE.MeshBasicMaterial({color:p.danger,transparent:true,opacity:.32,depthWrite:false}),hazardSteam:new THREE.MeshBasicMaterial({color:0xcde9e7,transparent:true,opacity:.12,depthWrite:false}),hazardPower:new THREE.MeshBasicMaterial({color:p.secondary,transparent:true,opacity:.34,depthWrite:false}),burst:new THREE.MeshBasicMaterial({color:p.accent,transparent:true,opacity:.7,depthWrite:false}),
      };
      this.scene.background=new THREE.Color(p.background);this.scene.fog.color.setHex(p.fog);this.rebuildStatic(theme);this.applyMaterialQuality();if(this.state){this.rebuildDynamic();this.rebuildHazards();}
    }
    rebuildStatic(theme){window.EscapeScenery.build(this,theme);}
    createDust(){if(this.dust)this.scene.remove(this.dust);const count=Polish.quality.high.particles,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*12.31)*5.4;positions[i*3+1]=.25+((i*37)%97)/97*4.5;positions[i*3+2]=-6+((i*53)%101)/101*8.8;}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const material=new THREE.PointsMaterial({color:0xb3c6c3,size:.018,transparent:true,opacity:.26,depthWrite:false});this.dust=new THREE.Points(geometry,material);this.scene.add(this.dust);this.applyDustRange();}
    applyDustRange(){if(this.dust)this.dust.geometry.setDrawRange(0,Polish.quality[this.qualityTier].particles)}
    placementTransform(object){if(object.mechanismKind==='final-vault')return{pos:[0,2.1,-5.98],rot:[0,0,0]};const p=object.placement||{surface:'floor',slot:0,variant:0};const slot=p.slot||0,row=Math.floor(slot/4),col=slot%4;switch(p.surface){case'desk':return{pos:[-2.05+col*1.35,.94,.52+row*.38],rot:[0,(p.variant-3.5)*.08,0]};case'shelf':{const side=p.variant%2===0?-1:1;return{pos:[side*4.55+(Math.floor(slot/4)%3-1)*.60,1.12+(slot%4)*.88,-5.23],rot:[0,0,0]};}case'left-wall':return{pos:[-5.82,1.25+(slot%4)*.95,1.15-row*1.55],rot:[0,Math.PI/2,0]};case'right-wall':return{pos:[5.82,1.25+(slot%4)*.95,1.15-row*1.55],rot:[0,-Math.PI/2,0]};case'back-wall':return{pos:[-3.9+(slot%6)*1.55,1.45+Math.floor(slot/6)*1.55,-6.42],rot:[0,0,0]};case'console':return{pos:[3.9,1.55,-.22+(slot%3)*.28],rot:[-.12,-.18,0]};case'pedestal':return{pos:[-2.4+(slot%4)*1.6,.95,-3.45],rot:[0,(p.variant-3.5)*.05,0]};case'exit':return{pos:[0,2.05,-6.25],rot:[0,0,0]};default:return{pos:[-3.6+col*2.4,.14,-.8-row*1.25],rot:[0,(p.variant-3.5)*.12,0]};}}
    makeExit(object){
      const group=new THREE.Group(),staticRoot=new THREE.Group(),hinge=new THREE.Group();
      group.add(staticRoot,hinge);hinge.position.x=-.92;
      group.userData.staticRoot=staticRoot;group.userData.preserveArticulation=true;
      group.userData.exitHinge=hinge;group.userData.motion={progress:0,target:escaped(this.state)?1:0};
      const geometry=(key,factory)=>this.geom(key,factory);
      const panel=(w,h,d,mat,p)=>this.add(hinge,geometry(`door:${w}:${h}:${d}`,()=>new THREE.BoxGeometry(w,h,d)),mat,p);
      panel(1.84,3.25,.22,this.materials.dark,[.92,0,0]);
      panel(1.66,3.05,.08,this.materials.metal,[.92,0,.15]);
      panel(1.40,2.78,.045,this.materials.dark,[.92,0,.21]);
      for(const x of[.17,1.67])panel(.035,2.95,.055,this.materials.brass,[x,0,.245]);
      for(const y of[-1.43,1.43])panel(1.5,.035,.055,this.materials.brass,[.92,y,.245]);
      for(const y of[-1.05,1.05]){
        panel(1.35,.3,.07,this.materials.metal,[.92,y,.26]);
        for(const x of[.38,.65,.92,1.19,1.46])this.add(hinge,geometry('door-bolt',()=>new THREE.CylinderGeometry(.025,.025,.04,8)),this.materials.brass,[x,y,.315],[Math.PI/2,0,0]);
      }
      for(const y of[-1.18,.1,1.18]){
        this.add(hinge,geometry('door-hinge',()=>new THREE.CylinderGeometry(.065,.065,.3,16)),this.materials.brass,[.02,y,.04]);
        panel(.3,.12,.035,this.materials.metal,[.16,y,.17]);
      }
      panel(.1,.38,.08,this.materials.brass,[1.61,-.5,.31]);
      window.EscapeScenery.merge(hinge);hinge.userData.exitPanel=true;
      return group;
    }
    rebuildDynamic(){
      const oldMotions=new Map(this.dynamicRoot.children.map(g=>[g.userData.objectId,g.userData.motion?.progress]));this.dynamicRoot.traverse(n=>{if(n.isInstancedMesh)n.dispose();if(n.userData.dynamicBatch)n.geometry.dispose();});this.dynamicRoot.clear();this.interactive=[];this.objectWorld.clear();if(!this.state)return;const ctx={materials:this.materials};let count=0,clues=0,mechanisms=0;
      for(const object of this.state.objects.slice(0,Polish.budgets.maxDynamicObjects)){if(object.carried)continue;let group=null;if(object.kind==='exit')group=this.makeExit(object);else if(object.mechanismKind){group=Mechanisms.build(object.mechanismKind,object,ctx);mechanisms++;}else if(object.kind==='clue'){group=Mechanisms.makeClue(object,ctx);clues++;}else if(object.kind==='tool'){group=Mechanisms.makeTool(object,ctx);}else group=Mechanisms.makeDecoy(object,ctx);if(!group)continue;if(group.userData.preserveArticulation){if(group.userData.staticRoot)window.EscapeScenery.merge(group.userData.staticRoot);}else window.EscapeScenery.merge(group);if(group.userData.motion&&this.renderRun===this.state.runToken&&this.state.tick>=this.renderTick&&oldMotions.get(object.id)!==undefined)group.userData.motion.progress=oldMotions.get(object.id);
        const transform=this.placementTransform(object);group.position.set(...transform.pos);group.rotation.set(...transform.rot);group.userData.objectId=object.id;group.userData.kind=object.kind;group.traverse(node=>{if(node.isMesh){node.castShadow=false;node.userData.objectId=object.id;this.interactive.push(node);}});this.dynamicRoot.add(group);this.objectWorld.set(object.id,group.position.clone());count++;
      }
      this.renderRun=this.state.runToken;this.renderTick=this.state.tick;this.dynamicStats={physicalProps:count+this.staticPropCount,visibleClues:clues,visibleMechanisms:mechanisms,exitPresent:this.state.objects.some(object=>object.kind==='exit'&&!object.carried),mechanismVariants:Mechanisms.supported.length};
    }
    rebuildHazards(){this.hazardRoot.clear();if(!this.state)return;for(const [index,hazard] of this.state.hazards.slice(0,Polish.budgets.maxHazards).entries()){const group=new THREE.Group();group.userData.kind=hazard.kind;group.userData.phase=hazard.phase;group.userData.index=index;group.visible=hazard.phase!=='idle';if(hazard.kind==='laser-sweep'){for(let i=0;i<3;i++){const beam=this.add(group,this.geom('laser',()=>new THREE.CylinderGeometry(.025,.025,9.8,8)),this.materials.hazardRed,[0,.55+i*.7,-1.8],[0,0,Math.PI/2],undefined,false);beam.userData.beam=true;}}
        else if(hazard.kind==='steam-burst'){for(let i=0;i<7;i++){const cloud=this.add(group,this.geom(`steam:${i%3}`,()=>new THREE.SphereGeometry(.24+i%3*.08,12,8)),this.materials.hazardSteam,[-3.2+i*1.05,.35+(i%2)*.25,-2.2-(i%3)*.55],undefined,undefined,false);cloud.userData.cloud=true;}}
        else{for(let i=0;i<4;i++){const ring=this.add(group,this.geom(`power:${i}`,()=>new THREE.TorusGeometry(.8+i*.42,.025,8,40)),this.materials.hazardPower,[0,.12,-2.1],[Math.PI/2,0,0],undefined,false);ring.userData.power=true;}}
        this.hazardRoot.add(group);}}
    triggerBurst(position,success=false){if(this.reducedMotion)return;while(this.effectBursts.length>=Polish.budgets.maxBursts){const old=this.effectBursts.shift();this.effectRoot.remove(old.group);old.group.userData.material.dispose();}const group=new THREE.Group(),material=(success?this.materials.success:this.materials.burst).clone();material.transparent=true;material.opacity=.72;const ring=this.add(group,this.geom('burst-ring',()=>new THREE.TorusGeometry(.28,.022,8,32)),material,[0,0,0],[Math.PI/2,0,0],undefined,false);group.position.copy(position);group.userData.started=performance.now();group.userData.material=material;group.userData.ring=ring;this.effectRoot.add(group);this.effectBursts.push({group});}
    setState(state){const previous=this.state;this.state=state;if(previous?.runToken!==state.runToken){this.lastEventSeq=-1;this.lastSolved=new Set();for(const e of this.effectBursts){this.effectRoot.remove(e.group);e.group.userData.material.dispose();}this.effectBursts.length=0;}if(state.theme!==this.lastTheme)this.rebuildTheme(state.theme);const signature=JSON.stringify([state.runToken,state.scene,state.objects.map(o=>[o.id,o.inspected,o.carried,o.solved,o.mechanismKind,o.placement]),state.progress.permille]);if(signature!==this.lastSignature){const solvedNow=new Set(state.objects.filter(o=>o.solved).map(o=>o.id));for(const id of solvedNow)if(!this.lastSolved.has(id)&&this.objectWorld.has(id))this.triggerBurst(this.objectWorld.get(id),true);this.lastSolved=solvedNow;this.lastSignature=signature;this.rebuildDynamic();}
      const hazardSignature=JSON.stringify(state.hazards.map(h=>[h.id,h.kind,h.phase,h.phaseTick]));if(hazardSignature!==this.lastHazardSignature){this.lastHazardSignature=hazardSignature;this.rebuildHazards();}

      const unseen=state.events.filter(event=>event.seq>this.lastEventSeq);
      for(const event of unseen)this.lastEventSeq=Math.max(this.lastEventSeq,event.seq);
      if(this.followFocus&&state.focusObjectId&&(state.focusObjectId!==previous?.focusObjectId||unseen.some(event=>['clue-discovered','puzzle-solved','items-combined'].includes(event.type))))this.inspect(state.focusObjectId,true);
      if(unseen.some(event=>event.type==='escape')||(escaped(state)&&!escaped(previous))){const exit=this.objectWorld.get('exit-door');if(exit)this.triggerBurst(exit,true);this.roomView();this.targetCamera.set(0,2.8,6.9);this.targetLook.set(0,1.9,-6.0);}

      if(previous?.runToken!==state.runToken)this.roomView();this.publishDiagnostics();}
    inspect(id,automatic=false){const p=this.objectWorld.get(id);if(!p)return;this.inspectId=id;this.mode='inspect';this.updateCameraLens();let eye;if(p.x<-4.5)eye=p.clone().add(new THREE.Vector3(1.65,.55,.15));else if(p.x>4.5)eye=p.clone().add(new THREE.Vector3(-1.65,.55,.15));else if(p.z<-5.5)eye=p.clone().add(new THREE.Vector3(.6,.55,1.7));else eye=p.clone().add(new THREE.Vector3(.85,.65,1.55));this.targetCamera.copy(eye);this.targetLook.copy(p).add(new THREE.Vector3(0,.05,0));document.body.dataset.cameraMode='inspect';document.body.dataset.inspectAutomatic=String(automatic);const label=document.getElementById('inspect-label'),object=this.state?.objects.find(item=>item.id===id);if(label){label.textContent=object?`${object.solved?'OPEN':'INSPECT'} · ${human(object.mechanismKind||object.labelKey).toUpperCase()}`:'INSPECT';label.classList.add('active');}}
    roomView(){this.inspectId=null;this.mode='room';this.updateCameraLens();this.setRoomPose();document.body.dataset.cameraMode='room';document.body.dataset.inspectAutomatic='false';document.getElementById('inspect-label')?.classList.remove('active')}
    setRoomPose(){const portrait=this.camera.aspect<.85;this.targetCamera.set(...(portrait?[1.7,3.1,6.5]:Polish.camera.room));this.targetLook.set(...(portrait?[0,1.9,-3.5]:Polish.camera.look));}
    pick(event){const rect=this.canvas.getBoundingClientRect();this.pointer.x=((event.clientX-rect.left)/rect.width)*2-1;this.pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects(this.interactive,false)[0];if(hit?.object?.userData?.objectId)this.inspect(hit.object.userData.objectId);else if(this.mode==='inspect')this.roomView();}
    characterView(){this.mode='character';this.inspectId=null;this.followFocus=false;this.updateCameraLens();document.body.dataset.cameraMode='character';this.frameCharacter();document.getElementById('inspect-label')?.classList.remove('active');}
    frameCharacter(){
      const focus=this.aiRoot.position.clone().add(new THREE.Vector3(0,.05,0));
      const halfFov=Math.min(THREE.MathUtils.degToRad(this.camera.fov*.5),Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov*.5))*this.camera.aspect));
      const distance=Math.max(3.2,1.12/Math.sin(halfFov));
      // Choose a full-distance orbit from inside the room. Clamping a wall-facing
      // offset shortened the camera distance and cut off the character.
      const preferred=new THREE.Vector3(-focus.x*.6,.3,Math.max(1.5,-focus.z*.6)).normalize();
      let best=null,bestScore=-Infinity;
      for(let index=0;index<32;index++){
        const angle=index*Math.PI/16,direction=new THREE.Vector3(Math.sin(angle),.10,Math.cos(angle)).normalize();
        const eye=focus.clone().addScaledVector(direction,distance);
        if(eye.x<-5.55||eye.x>5.55||eye.z<-5.7||eye.z>4.7)continue;
        const score=direction.dot(preferred);
        if(score>bestScore){best=eye;bestScore=score;}
      }
      this.targetCamera.copy(best||focus.clone().add(new THREE.Vector3(0,.3,distance)));
      this.targetLook.copy(focus);
      // Meet-the-character is a presentation pose; the simulation snapshot is untouched.
      this.aiRoot.rotation.y=Math.atan2(this.targetCamera.x-this.aiRoot.position.x,this.targetCamera.z-this.aiRoot.position.z);
    }
    animateMechanisms(delta,time){
      let exitProgress=0;
      for(const group of this.dynamicRoot.children){
        if(group.userData.exitHinge){const motion=group.userData.motion;motion.progress=this.reducedMotion?motion.target:THREE.MathUtils.damp(motion.progress,motion.target,2.8,Math.min(delta,100)/1000);group.userData.exitHinge.rotation.y=-motion.progress*1.25;exitProgress=motion.progress;}
        else window.EscapeMechanisms.animate?.(group,delta,time,this.reducedMotion);
      }
      const final=this.dynamicRoot.children.find(g=>g.userData.objectId==='final-vault');
      if(final){const angle=-exitProgress*1.25;final.position.set(-.92+Math.cos(angle)*.92+Math.sin(angle)*.27,2.1,-6.25-Math.sin(angle)*.92+Math.cos(angle)*.27);final.rotation.y=angle;this.objectWorld.set('final-vault',final.position.clone());}
      if(this.mode==='character')this.frameCharacter();
    }
    setQuality(tier){if(!Polish.quality[tier])return;this.qualityTier=tier;const q=Polish.quality[tier],ratio=Math.min(q.pixelRatio,window.devicePixelRatio||1);this.renderer.setPixelRatio(ratio);this.renderer.shadowMap.enabled=q.shadows;this.keyLight.castShadow=q.shadows;this.applyDustRange();this.applyMaterialQuality();this.resize();}
    applyMaterialQuality(){
      for(const material of [...Object.values(this.materials),...(this.sceneryMaterials||[])]){
        if(!material.isMeshStandardMaterial)continue;
        if(!('normalMap'in material.userData))material.userData.normalMap=material.normalMap;
        const normal=this.qualityTier==='low'?null:material.userData.normalMap;
        if(material.normalMap!==normal){material.normalMap=normal;material.needsUpdate=true;}
      }
    }
    adaptQuality(fps){if(this.frameSamples.length<12||this.frameSamples.reduce((a,b)=>a+b,0)<1800)return;if(this.qualityTier==='high'&&fps<Polish.quality.lowFpsThreshold)this.setQuality(fps<Polish.quality.criticalFpsThreshold?'low':'medium');else if(this.qualityTier==='medium'){if(fps<Polish.quality.criticalFpsThreshold)this.setQuality('low');else if(fps>Polish.quality.recoverFpsThreshold)this.setQuality('high');}else if(this.qualityTier==='low'&&fps>Polish.quality.recoverFpsThreshold+3)this.setQuality('medium');this.frameSamples.length=0;}
    updateCameraLens(){const aspect=this.camera.aspect;this.camera.fov=aspect<.85?52:this.mode==='room'?clamp(THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI/6)*1.55/aspect)),Polish.camera.fov,78):Polish.camera.fov;this.camera.updateProjectionMatrix();}
    resize(){const rect=this.canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;this.renderer.setSize(Math.round(rect.width),Math.round(rect.height),false);this.camera.aspect=rect.width/rect.height;this.updateCameraLens();if(this.mode==='room')this.setRoomPose();}
    animateHazards(time){for(const group of this.hazardRoot.children){const active=group.userData.phase==='active',telegraph=group.userData.phase==='telegraph',pulse=active?1:(telegraph?.38:.12);group.visible=(active||telegraph)&&!['result','intermission'].includes(this.state?.scene);for(const node of group.children){if(node.userData.beam){node.material.opacity=pulse*(.45+.35*Math.sin(time*.014+group.userData.index));node.position.z=-1.8+Math.sin(time*.0014+group.userData.index)*3.2;}if(node.userData.cloud){node.material.opacity=pulse*.28;const s=.78+.28*Math.sin(time*.002+node.position.x);node.scale.setScalar(s);}if(node.userData.power){node.material.opacity=pulse*.55;node.rotation.z=time*.0008*(group.userData.index+1);}}}}
    animateEffects(time){for(let index=this.effectBursts.length-1;index>=0;index--){const effect=this.effectBursts[index],age=(time-effect.group.userData.started)/1000;if(age>1.05){this.effectRoot.remove(effect.group);effect.group.userData.material.dispose();this.effectBursts.splice(index,1);continue;}const scale=1+age*3.2;effect.group.scale.setScalar(scale);effect.group.userData.material.opacity=(1-age/1.05)*.72;}}
    publishDiagnostics(){const info=this.renderer.info.render;window.__ESCAPE_RENDER_DIAGNOSTICS__={renderer:RENDERER,engine:'three',threeRevision:THREE.REVISION,webgl:true,roomSurfaces:5,physicalProps:this.dynamicStats?.physicalProps??this.staticPropCount,materialFamilies:Object.keys(this.materials).length,visibleClues:this.dynamicStats?.visibleClues??0,visibleMechanisms:this.dynamicStats?.visibleMechanisms??0,exitPresent:this.dynamicStats?.exitPresent??false,mechanismVariants:this.dynamicStats?.mechanismVariants??Mechanisms.supported.length,meshFamilies:18,character:this.archivist.diagnostics(),scenery:this.sceneryStats,themedDressing:this.themedDressing,hazardVisuals:this.state?.hazards.filter(h=>h.phase!=='idle').length??0,cameraPosition:this.camera.position.toArray(),cameraLook:this.currentLook.toArray(),cameraTarget:this.targetCamera.toArray(),cameraSettled:this.camera.position.distanceTo(this.targetCamera)<.035&&this.currentLook.distanceTo(this.targetLook)<.035,characterPosition:this.aiRoot.position.toArray(),cameraMode:this.mode,inspectObjectId:this.inspectId,drawCalls:info.calls||0,triangles:info.triangles||0,activeLights:4,shadowMode:Polish.quality[this.qualityTier].shadows?'bounded-pcf':'disabled-quality-tier',particleCount:Polish.quality[this.qualityTier].particles,qualityTier:this.qualityTier,adaptiveQuality:true,fps:Math.round(this.fps||60),rendererMemoryModel:'shared cached geometry + shared PBR materials + bounded dynamic groups'};}
    dispose(){
      if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frameRequest);
      this.canvas.removeEventListener('pointerdown',this.onPointerDown);removeEventListener('keydown',this.onKeyDown);removeEventListener('resize',this.onResize);this.resizeObserver.disconnect();
      this.archivist.dispose();
      const ownedGeometry=new Set(this.geo.values()),ownedMaterials=new Set([...Object.values(this.materials),...(this.sceneryMaterials||[])]);
      this.scene.traverse(node=>{if(node.isInstancedMesh)node.dispose();if(node.userData.dynamicBatch||node.userData.sceneryBatch)ownedGeometry.add(node.geometry);});
      if(this.dust){ownedGeometry.add(this.dust.geometry);ownedMaterials.add(this.dust.material);}
      for(const effect of this.effectBursts)ownedMaterials.add(effect.group.userData.material);
      for(const geometry of ownedGeometry)geometry.dispose();for(const material of ownedMaterials)material.dispose();
      // Module-owned mechanism geometries and scenery textures survive for other rooms.
      this.effectBursts.length=0;this.interactive.length=0;this.objectWorld.clear();this.geo.clear();this.scene.clear();
      this.renderer.dispose();this.renderer.forceContextLoss();
    }
    frame(now){if(this.disposed)return;const delta=Math.max(1,now-this.lastFrame);this.lastFrame=now;this.frameSamples.push(Math.min(delta,1000));if(this.frameSamples.length>Polish.quality.sampleFrames)this.frameSamples.shift();this.fps=1000/(this.frameSamples.reduce((a,b)=>a+b,0)/this.frameSamples.length);this.adaptQuality(this.fps);
      const alpha=this.reducedMotion?1:1-Math.exp(-Math.min(delta,250)*.008);this.camera.position.lerp(this.targetCamera,alpha);this.currentLook.lerp(this.targetLook,alpha);this.camera.lookAt(this.currentLook);this.archivist.setReducedMotion(this.reducedMotion);this.archivist.update(delta,now,this.state,this.objectWorld.get(this.state?.focusObjectId));if(!this.reducedMotion)this.dust.rotation.y=now*.000015;
      this.animateMechanisms(delta,now);this.animateHazards(now);this.animateEffects(now);this.renderer.render(this.scene,this.camera);this.publishDiagnostics();this.frameRequest=requestAnimationFrame(time=>this.frame(time));}
  }
  window.EscapeRoom3D=EscapeRoom3D;
})();
