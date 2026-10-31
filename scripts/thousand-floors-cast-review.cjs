'use strict';
/** Isolated asset inspection, explicitly NOT gameplay or an animation-quality proof. */
const path=require('node:path');
async function captureCast(browser,origin,output,label){
 const context=await browser.newContext({viewport:{width:640,height:640},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[],records=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/floors/cast-review',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#d7e4dc;font-family:Arial,sans-serif;color:#153c3a}canvas{display:block}header{position:absolute;top:24px;left:28px;right:28px;display:flex;justify-content:space-between;font-size:10px;letter-spacing:1px}footer{position:absolute;left:28px;bottom:24px;font-size:12px}small{display:block;margin-top:6px;font-size:10px;color:#425f58}
  </style><script type="importmap">{"imports":{"three":"/floors/vendor/three.module.js"}}</script></head><body><header><b>THOUSAND / CAST INSPECTION</b><span>ISOLATED ASSET · NOT GAMEPLAY</span></header><canvas id="cast"></canvas><footer><b id="pose"></b><small>Production character module · fixed pose sample · studio lighting</small></footer><script type="module">
  import * as THREE from 'three';import {createCharacter} from '/floors/character.js';import {disposeTree} from '/floors/materials.js';
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#cast'),antialias:true});renderer.setSize(640,640);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d7e4dc');const camera=new THREE.PerspectiveCamera(34,1,.1,40);camera.position.set(3.1,2.8,4.5);camera.lookAt(-.15,1.08,0);
  scene.add(new THREE.HemisphereLight('#ffffff','#67897a',2));const sun=new THREE.DirectionalLight('#fff3d8',3.2);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.03;scene.add(sun);const fill=new THREE.DirectionalLight('#c8e4ff',1.3);fill.position.set(4,3,-3);scene.add(fill);
  const actor=createCharacter();actor.root.rotation.y=.45;scene.add(actor.root);
  const ground=new THREE.Mesh(new THREE.CircleGeometry(4,64),new THREE.MeshStandardMaterial({color:'#c9d9ca',roughness:.96}));ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;scene.add(ground);
  window.__CAST_REVIEW__=(action)=>{actor.animate(action,1.25,false,{lookYaw:.12,jumpProgress:.45,landAge:action==='land'?.12:Infinity,groundOffset:0});document.querySelector('#pose').textContent=action.toUpperCase()+' / Field cartographer & seed lantern';renderer.render(scene,camera);let bones=0;actor.root.traverse(o=>{if(o.isBone)bones++});return {bones,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,textures:renderer.info.memory.textures}};
  window.__CAST_REVIEW__('idle');window.addEventListener('pagehide',()=>{actor.dispose();disposeTree(scene);renderer.dispose()});
  </script></body></html>`}));
  await page.goto(origin+'/floors/cast-review');
  await page.waitForFunction(()=>typeof window.__CAST_REVIEW__==='function');
  for(const pose of ['idle','wait','jump','celebrate']){
   const diagnostics=await page.evaluate(action=>window.__CAST_REVIEW__(action),pose);
   const file=`${label}-cast-${pose}.jpg`;await page.screenshot({path:path.join(output,file),type:'jpeg',quality:90});
   records.push({file,pose,method:'isolated production cast module, fixed pose fixture, not gameplay',diagnostics});
  }
  if(errors.length)throw Error('Cast inspection errors: '+JSON.stringify(errors));
  return records;
 }finally{await context.close();}
}
module.exports={captureCast};
