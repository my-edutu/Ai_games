'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.env.ESCAPE_REPO||path.resolve(__dirname,'../..'),THREE=require(path.join(root,'node_modules/three'));
const bootstrap=process.env.ESCAPE_BOOTSTRAP||path.join(root,'public/ai-escape-room/bootstrap.js');

function fixture(width,height){
  const portrait=width<600,top=portrait?130:144,bottom=height-(portrait?101:125);
  const rect=(left,y,w,h)=>({left,top:y,right:left+w,bottom:y+h,width:w,height:h});
  let canvasRect=rect(26,86,width,height);
  const elements={
    '.room-title':rect(26+20,86+20,220,76),
    '.stage-controls':rect(26+width-210,86+20,190,42),
    '#inspect-label':rect(26+width/2-80,86+top-28,160,28),
    '.camera-help':rect(26+20,86+bottom,300,14),
    '.progress-dock':rect(26+20,86+height-90,width-40,70),
  };
  const nodes=new Map(Object.entries(elements).map(([selector,value])=>[selector,{getBoundingClientRect:()=>value,classList:{add(){},remove(){},contains(){return false;}}}]));
  const document={body:{dataset:{}},getElementById:id=>nodes.get('#'+id)||null,querySelector:selector=>nodes.get(selector)||null,querySelectorAll:selectors=>selectors.split(',').map(selector=>nodes.get(selector.trim())).filter(Boolean)};
  const context=vm.createContext({window:{THREE},THREE,console,document});
  for(const file of ['room3d-polish.js','mechanisms3d.js','scenery3d.js','archivist3d.js','room3d.js'])vm.runInContext(fs.readFileSync(path.join(root,'public/ai-escape-room',file),'utf8'),context);
  const source=fs.readFileSync(bootstrap,'utf8').replace(/^import .*;$/mg,'').replace(/^await import\(.*\);$/mg,'');
  vm.runInContext(source,context,{filename:bootstrap});
  const room=Object.create(context.window.EscapeRoom3D.prototype);
  room.canvas={getBoundingClientRect:()=>canvasRect};room.renderer={setSize(){}};room.camera=new THREE.PerspectiveCamera(46,width/height,.08,42);room.targetCamera=new THREE.Vector3();room.targetLook=new THREE.Vector3();room.mode='room';room.objectWorld=new Map();room.dynamicRoot=new THREE.Group();
  const materials={};for(const name of ['dark','metal','brass','cyan','accent','success','danger','wood','paper','ink','stone','glass'])materials[name]=new THREE.MeshStandardMaterial({color:0x888888});
  const result={room,api:context.window.EscapeMechanisms,scenery:context.window.EscapeScenery,materials,document,width,height,limits:{left:16,right:width-16,top:top+10,bottom:bottom-10},setCanvasSize(w,h){
    const mobile=w<600,newTop=mobile?130:144,newBottom=h-(mobile?101:125);canvasRect=rect(26,86,w,h);result.width=w;result.height=h;result.limits={left:16,right:w-16,top:newTop+10,bottom:newBottom-10};
    for(const [selector,value] of Object.entries({'.room-title':rect(46,106,220,76),'.stage-controls':rect(26+w-210,106,190,42),'#inspect-label':rect(26+w/2-80,86+newTop-28,160,28),'.camera-help':rect(46,86+newBottom,300,14),'.progress-dock':rect(46,86+h-90,w-40,70)}))nodes.get(selector).getBoundingClientRect=()=>value;
  }};return result;
}
function addObject(f,kind,surface='back-wall',slot=0,solved=false,variant=3){
  const object=Object.freeze({id:kind+'-'+surface+'-'+slot,kind:'lock',labelKey:kind,mechanismKind:kind,inspected:true,solved,carried:false,placement:Object.freeze({surface,slot,variant})});
  const group=f.api.build(kind,object,{materials:f.materials});f.scenery.merge(group.userData.staticRoot);
  const transform=f.room.placementTransform(object);group.position.set(...transform.pos);group.rotation.set(...transform.rot);group.userData.objectId=object.id;
  f.room.dynamicRoot.add(group);f.room.objectWorld.set(object.id,group.position.clone());f.room.state={objects:[object]};
  return {object,group};
}
function projected(f,group){
  const camera=f.room.camera.clone();camera.position.copy(f.room.targetCamera);camera.lookAt(f.room.targetLook);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
  const box=new THREE.Box3().setFromObject(group),points=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);points.push({x:(p.x+1)*f.width/2,y:(1-p.y)*f.height/2,z:p.z});}
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y)),points};
}
function assertFrame(f,object,group){
  const bounds=projected(f,group),label=object.id+' '+f.width+'x'+f.height;
  assert.ok(bounds.left>=f.limits.left&&bounds.right<=f.limits.right,`${label}: complete width ${bounds.left.toFixed(1)}..${bounds.right.toFixed(1)} must fit ${f.limits.left}..${f.limits.right}`);
  assert.ok(bounds.top>=f.limits.top&&bounds.bottom<=f.limits.bottom,`${label}: complete height ${bounds.top.toFixed(1)}..${bounds.bottom.toFixed(1)} must clear HUD ${f.limits.top}..${f.limits.bottom}`);
  assert.ok(bounds.points.every(p=>p.z>-1&&p.z<1),label+' depth must fit camera frustum');
  const eye=f.room.targetCamera,point=f.room.objectWorld.get(object.id),distance=eye.distanceTo(point);
  assert.ok(distance>=1.9&&distance<=3.600001,`${label}: existing bounded distance 1.9..3.6, actual ${distance}`);
  assert.ok(eye.x>=-5.37&&eye.x<=5.37&&eye.y>=.88&&eye.y<=4.72&&eye.z>=-5.72&&eye.z<=4.42,label+' must preserve room clearance');
}

for(const [width,height] of [[1256,862],[364,576]])test(`inspection keeps complete real mechanism above the HUD at ${width}x${height}`,()=>{
  const f=fixture(width,height),{object,group}=addObject(f,'final-vault');f.room.inspect(object.id);assertFrame(f,object,group);
});

test('inspection exposes the side of the physical housing instead of a frontal elevation',()=>{
  const f=fixture(1256,862),{object,group}=addObject(f,'final-vault');f.room.inspect(object.id);
  const eye=group.worldToLocal(f.room.targetCamera.clone()),angle=Math.abs(Math.atan2(eye.x,eye.z))*180/Math.PI;
  assert.ok(angle>=20&&angle<=45,`visible housing depth requires a 20..45 degree horizontal oblique view, actual ${angle}`);
});

test('all eight real mechanism families fit desktop and portrait across solved states and wall placements without mutating public objects',()=>{
  for(const [width,height] of [[1256,862],[364,576]]){
    const f=fixture(width,height);
    for(const kind of f.api.supported)for(const solved of [false,true])for(const surface of ['left-wall','right-wall']){
      f.room.dynamicRoot.clear();const {object,group}=addObject(f,kind,surface,3,solved),before=JSON.stringify(object);f.room.inspect(object.id);assertFrame(f,object,group);assert.equal(JSON.stringify(object),before);
    }
  }
});

test('an already inspected mechanism stays clear of the HUD after a portrait resize',()=>{
  const f=fixture(1256,862),{object,group}=addObject(f,'final-vault');f.room.inspect(object.id,true);f.setCanvasSize(364,576);f.room.resize();assertFrame(f,object,group);assert.equal(f.document.body.dataset.inspectAutomatic,'true');
});

test('portrait inspection reserves the danger caption area before the hazard appears',()=>{
  const f=fixture(364,576),{object,group}=addObject(f,'final-vault'),query=f.document.querySelectorAll;
  const danger={getBoundingClientRect:()=>({left:58,top:86+442,right:358,bottom:86+473,width:300,height:31})};
  f.document.querySelectorAll=selectors=>query(selectors).concat(selectors.split(',').includes('.danger-ribbon')?[danger]:[]);
  f.limits.bottom=432;f.room.inspect(object.id);assertFrame(f,object,group);
});
