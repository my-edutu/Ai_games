'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/overview.mjs'),'utf8');
const {restorePreR47}=require('../helpers/snake-r47-overview-archive.cjs');
const crypto=require('node:crypto');
const gitBlob=text=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
function harness(moduleSource=source){
  const draws=[];
  const methods=['clearRect','fillRect','strokeRect','beginPath','moveTo','lineTo','fill','stroke','arc'];
  const commands=Object.fromEntries(methods.map(name=>[name,(...args)=>draws.push([name==='clearRect'?'clear':name,...args])]));
  const c=new Proxy(commands,{set(target,key,value){draws.push(['style',String(key),value]);target[key]=value;return true;}});
  const stage={children:[],append(node){this.children.push(node);}};
  const document={createElement(tag){return {tagName:tag.toUpperCase(),hidden:false,children:[],setAttribute(){},append(...children){this.children.push(...children);for(const child of children)child.parentElement=this;},addEventListener(){},remove(){this.removed=true;},getContext(type){assert.equal(type,'2d');return c;}};}};
  const sandbox=vm.createContext({document});
  vm.runInContext(moduleSource.replace('export function createOverview','function createOverview')+'\nthis.createOverview=createOverview;',sandbox);
  return {create:sandbox.createOverview,stage,draws};
}
const snapshot=({runToken='run-alpha',revision=10,width=8,height=8}={})=>Object.freeze({runToken,revision,width,height,
  obstacles:Object.freeze([2,3]),hazards:Object.freeze([Object.freeze({cell:14,active:true})]),
  portals:Object.freeze([Object.freeze({entry:11,exit:45})]),
  snake:Object.freeze([Object.freeze({cell:21}),Object.freeze({cell:20})]),food:Object.freeze({cell:42})});
const count=d=>d.filter(e=>e[0]==='clear').length;
test('miniature full-board view repaints on actual public visual cues, not redundant polls',()=>{
  const env=harness(),view=env.create(env.stage,()=>{}),button=env.stage.children[0];
  assert.equal(button.hidden,true,'uninitialized mini-map must not flash during startup');
  const a=snapshot();
  view.update(a,false);assert.equal(count(env.draws),0);
  view.update(a,true);assert.equal(button.hidden,false);assert.equal(count(env.draws),1);
  let paints=1;
  const stable=(value,label)=>{view.update(value,true);assert.equal(count(env.draws),paints,label);};
  const repaint=(value,label)=>{view.update(value,true);assert.equal(count(env.draws),++paints,label);};
  for(let i=0;i<6;i++)stable(snapshot(),'unchanged public revision must not repaint board each network poll');
  stable({...snapshot(),hazards:[{cell:14,active:true,phase:1}]},'hazard phase-only change is invisible on the 2D map');
  repaint({...snapshot(),hazards:[{cell:14,active:false,phase:2}]},'danger activation is visible without a movement revision');
  repaint(snapshot(),'active danger reappears even on the same movement revision');
  repaint({...snapshot(),food:{cell:41}},'fruit can expire or respawn without a movement revision');
  repaint(snapshot(),'original fruit location returns');
  repaint({...snapshot(),portals:[{entry:12,exit:44}]},'portal connectivity is a meaningful map cue');
  repaint(snapshot(),'portal connectivity restores');
  repaint({...snapshot(),obstacles:[2,5]},'obstacles are still included in the public map visual signature');
  repaint(snapshot(),'obstacles restore');
  repaint({...snapshot(),snake:[{cell:22},{cell:20}]},'serpent body remains a public map cue');
  repaint(snapshot(),'snake pose restores');
  repaint(snapshot({revision:11}),'fresh authoritative movement revision repaints');
  repaint(snapshot({runToken:'run-beta',revision:11}),'restart with equal revision repaints');
  repaint(snapshot({runToken:'run-beta',revision:11,width:9}),'board shape change repaints');
  view.update(snapshot({runToken:'run-beta',revision:11,width:9}),false);assert.equal(button.hidden,true);
  repaint(snapshot({runToken:'run-beta',revision:11,width:9}),'returning from the full-board camera draws a complete minimap');
  assert.equal(button.hidden,false);
  view.dispose();assert.equal(button.removed,true);
});

test('R47 optimizes presentation only; exact original public mini-map module remains reconstructable',()=>{
  assert.equal(gitBlob(restorePreR47(source)),'1c74bf0cc0caa87c74c961a149aae3ea82c05502');
  assert.equal(source.includes('snapshot.authorityChecksum'),false);
});

test('R47 first complete public 2D frame preserves exact original cue paint commands',()=>{
  const pre=harness(restorePreR47(source)),post=harness(source);
  const a=snapshot();
  pre.create(pre.stage,()=>{}).update(a,true);
  post.create(post.stage,()=>{}).update(a,true);
  assert.deepEqual(post.draws,pre.draws,'unchanged first paint command sequence includes snake, food, portals, hazards and obstacles');
  assert.ok(post.draws.some(x=>x[0]==='arc'),'miniature body and fruit markers rendered');
  assert.ok(post.draws.some(x=>x[0]==='stroke'),'portal ring rendered');
});
