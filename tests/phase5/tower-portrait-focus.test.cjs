'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const s=fs.readFileSync(path.resolve(__dirname,
 '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
const start=s.indexOf('function correctTowerPortraitFocus(');
const end=s.indexOf('\n// Wide jumps must keep the camera',start);
assert.ok(start>0&&end>start);
const correct=vm.runInNewContext('('+s.slice(start,end).trim()+')',
 {towerCoreSightlineClear:()=>true});
class V {
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
 project(c){
  const v=[this.x-c.position.x,this.y-c.position.y,this.z-c.position.z];
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const d=dot(v,c.front),t=Math.tan(c.fov*Math.PI/360)*d;
  this.x=dot(v,c.right)/(t*c.aspect);this.y=dot(v,c.up)/t;
  this.z=1-2/Math.max(2,d);return this;
 }
}
class C {
 constructor(){this.aspect=.462;this.fov=55;this.position=new V(0,0,40);
  this.matrixWorld={elements:Array(16).fill(0)};this.lookAt(new V());}
 lookAt(g){
  const norm=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  this.front=norm([g.x-this.position.x,g.y-this.position.y,g.z-this.position.z]);
  this.right=norm(cross(this.front,[0,1,0]));
  this.up=norm(cross(this.right,this.front));
  const m=this.matrixWorld.elements;
  [m[0],m[1],m[2]]=this.right;[m[4],m[5],m[6]]=this.up;
  [m[8],m[9],m[10]]=this.front.map(x=>-x);
 }
 updateMatrixWorld(){}
}
function setup(screenX=.86){
 const camera=new C(),gaze=new V();
 const actor=new V(screenX*40*Math.tan(55*Math.PI/360)*camera.aspect,0,0);
 const scratch=Array.from({length:4},()=>new V());
 const projection=p=>new V().copy(p).project(camera);
 return {camera,gaze,actor,scratch,projection};
}
test('portrait hero at an authentic unsafe edge is brought inside the safe window',()=>{
 const a=setup(),pos={...a.camera.position};
 assert.ok(a.projection(a.actor).x>.78);
 assert.ok(correct(a.camera,a.gaze,a.actor,null,null,.05,...a.scratch)>.012);
 assert.ok(a.projection(a.actor).x<.78);
 assert.deepEqual({...a.camera.position},pos);
});
test('hero already in frame remains unchanged',()=>{
 const a=setup(.6),old={...a.gaze};
 assert.equal(correct(a.camera,a.gaze,a.actor,null,null,.05,...a.scratch),0);
 assert.deepEqual({...a.gaze},old);
});
test('visible guardian across frame vetoes a harmful gaze change',()=>{
 const a=setup();
 const guardian=new V(-.81*40*Math.tan(55*Math.PI/360)*a.camera.aspect,0,0);
 const old={...a.gaze};
 assert.equal(correct(a.camera,a.gaze,a.actor,guardian,null,.05,...a.scratch),0);
 assert.deepEqual({...a.gaze},old);
});
test('real airborne landing across frame vetoes a hero-only crop',()=>{
 const a=setup();
 const landing=new V(-.89*40*Math.tan(55*Math.PI/360)*a.camera.aspect,0,0);
 const old={...a.gaze};
 assert.equal(correct(a.camera,a.gaze,a.actor,null,landing,.05,...a.scratch),0);
 assert.deepEqual({...a.gaze},old);
});
test('offscreen actor cannot provoke a presentation cut',()=>{
 const a=setup(1.15),old={...a.gaze};
 assert.equal(correct(a.camera,a.gaze,a.actor,null,null,.05,...a.scratch),0);
 assert.deepEqual({...a.gaze},old);
});
