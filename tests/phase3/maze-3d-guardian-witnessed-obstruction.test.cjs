'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const camera=()=>import(pathToFileURL(path.join(root,
  'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const fixture=()=>{
  const s={lifecycle:'running',result:null,width:9,height:9,
    currentCell:40,visibleCells:[],cells:[],doors:[],threats:[{cell:42}]};
  for(let row=0;row<9;row++)for(let col=0;col<9;col++){
    const id=row*9+col,neighbors=[];
    for(const d of [-1,1,-9,9]){
      const next=id+d;
      if(next>=0&&next<81&&(d!==1||col<8)&&(d!==-1||col>0))
        neighbors.push(next);
    }
    s.visibleCells.push(id);
    s.cells.push({cell:id,blocked:false,neighbors});
  }
  return s;
};
const hero={x:0,z:0};
const guardian={x:4.8,z:0,cell:42};
const target={x:2.4,z:0};
const orbit=-.5;
const offset={x:15*Math.cos(orbit)-18*Math.sin(orbit),
  z:15*Math.sin(orbit)+18*Math.cos(orbit)};
test('Pass384 chooses a real alternate camera only when published sealed foreground blocks the witnessed pair',async()=>{
  const {publicGuardianPublishedWallAvoidance:f}=await camera();
  const s=fixture(),base=JSON.stringify(s);
  const args=[hero,guardian,target,offset,orbit,390/844,.82,.9,false];
  assert.equal(f(s,...args),0,'open reciprocal public map cannot invent a wall');
  assert.equal(JSON.stringify(s),base,'diagnosis never changes movement/AI truth');
  s.cells.find(c=>c.cell===52).blocked=true;
  const sealed=f(s,...args);
  assert.ok(sealed>.11&&sealed<=.36,'published full solid foreground earns a bounded alternate angle');
  assert.equal(f(s,...args),sealed,'same public snapshot must replay identically');
  assert.equal(JSON.stringify(args),JSON.stringify([hero,guardian,target,offset,orbit,390/844,.82,.9,false]),
    'no actor/root/camera-offset mutation');
  assert.ok(Math.sign(orbit+sealed)===Math.sign(orbit)&&Math.abs(orbit+sealed)>=.25,
    'no change of camera side or stacked duo');
});
test('unseen geometry, secret engine truth and stale guardian never authorize a wall-avoidance camera',async()=>{
  const {publicGuardianPublishedWallAvoidance:f}=await camera();
  const s=fixture();
  const args=[hero,guardian,target,offset,orbit,390/844,.82,.9,false];
  s.cells.find(c=>c.cell===52).blocked=true;
  const published=f(s,...args);
  assert.ok(published>.11);
  assert.equal(f({...s,visibleCells:s.visibleCells.filter(c=>c!==52)},...args),0,
    'a blocked cell outside current visibleCells must not affect the view');
  assert.equal(f({...fixture(),privateMaze:{blocked:[52]},secretPath:[52]},...args),0,
    'private arrays have no camera authority');
  assert.equal(f({...s,threats:[]},...args),0);
  assert.equal(f({...s,lifecycle:'ended'},...args),0);
  assert.equal(f({...s,result:{reason:'captured'}},...args),0);
  assert.equal(f({...s,visibleCells:s.visibleCells.filter(c=>c!==guardian.cell)},...args),0);
  assert.equal(f({...s,doors:[{a:40,b:41,open:false}]},...args),published,
    'a real sealed edge cannot turn a blocked tile into an open route');
});
test('source-bound staged shot respects both camera-mode authority and reduced-motion/privacy gates',async()=>{
  const {publicGuardianPublishedWallAvoidance:f}=await camera();
  const s=fixture();s.cells.find(c=>c.cell===52).blocked=true;
  const args=[hero,guardian,target,offset,orbit,390/844,.82];
  assert.equal(f(s,...args,.10,false),0,'no advance warning camera');
  assert.equal(f(s,...args,.20,false),0);
  assert.equal(f(s,...args,.9,true),0);
  assert.equal(f(s,...args,1.01,false),0);
  assert.equal(f(s,hero,guardian,target,offset,orbit,844/390,.82,.9,false),0);
  assert.equal(f(s,hero,guardian,target,offset,orbit,1280/900,.82,.9,false),0);
  assert.equal(f(s,hero,guardian,target,offset,orbit,390/844,.69,.9,false),0);
  assert.equal(f(s,hero,guardian,target,offset,orbit,390/844,.82,NaN,false),0);
  const warning=f(s,...args,.30,false),brace=f(s,...args,.48,false),release=f(s,...args,.9,false);
  assert.ok(warning>0&&warning<brace&&brace===release,
    'warning-to-brace physical change eases rather than cutting or inventing an attack');
  const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/attentionStrength=witnessedLocally\s*&& publicGuardianOpenSightline\(s,entry\.cell\)/);
  assert.match(source,/portraitEncounterOrbit\+=publicGuardianPublishedWallAvoidance\(\s*s,pose,closestThreat,desiredTarget,portraitCameraOffset,/);
  assert.match(source,/cameraOffset\.lerp\(/,'use the existing cinematic easing');
  assert.match(source,/publicGuardianPhysicalCloseupHalfHeight\(/,'retain actual complete actor-mesh framing');
  const server=fs.readFileSync(path.join(root,'scripts/serve-maze-stream.cjs'),'utf8');
  assert.match(server,/'guardian-duel-camera\.mjs'/,
    'the explicitly allowed existing public module remains loadable');
});
