'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.join(root,'public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
 .replace("'./vendor/three.module.js'",JSON.stringify(three))
 .replace("'./gate-moment.mjs'",JSON.stringify(gate))
 .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const all=Array.from({length:49},(_,i)=>i);
const stage=()=>({
 runToken:'real-exit-forecourt',tick:6,lifecycle:'running',result:null,
 width:7,height:7,currentCell:23,exitCell:24,
 visibleCells:all.filter(i=>i!==24),
 cells:all.map(cell=>({cell,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false})),
 doors:[],keys:[],inventory:[],threats:[]
});
const ornaments=stats=>stats.coastalGardens+stats.wallGardens+stats.tideFossilAlcoves
 +stats.tidePennants+stats.wallWindcatchers+stats.windcatcherTowers
 +stats.coastCanopies+stats.tidalObservatories+stats.collapsedPavilions;
test('source-disclosed original exit suppresses genuine optional THREE scenery without a hidden map or false win',async()=>{
 const {createMazeWorld,publicDisclosedExitForecourtCells}=await load();
 const before=stage(),revealed={...before,tick:7,visibleCells:all.slice()},original=JSON.stringify(before);
 assert.equal(publicDisclosedExitForecourtCells(before).size,0,
  'undisclosed exit must not change any scenic tile');
 const clear=publicDisclosedExitForecourtCells(revealed);
 assert.ok(clear.has(24)&&clear.has(23)&&clear.has(17)&&clear.has(25),
  'the authentic portal and its adjacent visible stage receive negative space');
 assert.ok(!clear.has(0)&&!clear.has(48),
  'a far public cell must retain its original scene');
 assert.equal(publicDisclosedExitForecourtCells({...revealed,exitCell:null}).size,0);
 assert.equal(publicDisclosedExitForecourtCells({...revealed,visibleCells:all.filter(i=>i!==24)}).size,0);
 const withProtected={...revealed,
  keys:[{id:'key-1',cell:17,collected:false}],
  doors:[{a:18,b:19,open:false}],
  cells:revealed.cells.map(c=>c.cell===25?{...c,trap:true}:c)};
 const protectedCourt=publicDisclosedExitForecourtCells(withProtected);
 assert.ok(!protectedCourt.has(17)&&!protectedCourt.has(18)
  &&!protectedCourt.has(25),'keys, real gate landings and pressure traps are untouched');
 assert.ok(protectedCourt.has(24),'known actual portal still has a sightline');
 const w=createMazeWorld({balanced:true});
 try{
  w.update(before); const baseline=w.stats(),baselineOrnaments=ornaments(baseline);
  assert.ok(baselineOrnaments>0,'test uses real installed ornamental Three geometry');
  w.update(revealed);const earned=w.stats();
  assert.ok(ornaments(earned)<baselineOrnaments,
    'one real disclosed portal removes multiple independent non-interactive foreground distractions');
  assert.ok(w.group.getObjectByName('Disclosed exit portal'),
    'actual solid exit structure and connected wing models are preserved');
  assert.equal(earned.knownCells,baseline.knownCells,
    'the public stage does not discard a terrain cell or mask map topology');
  assert.ok(earned.geometryCount<100,'the original six-reset strict GPU budget is unchanged');
  w.update({...before,tick:8});
  assert.equal(ornaments(w.stats()),baselineOrnaments,
    'public sightline withdrawal restores ordinary neutral scenery');
  for(let n=0;n<6;n++){
    w.update({...revealed,runToken:'forecourt-replay-'+n,tick:1});
    assert.ok(w.stats().geometryCount<100,'no geometry class leak after six resets');
  }
  assert.equal(JSON.stringify(before),original,'renderer never mutates public authority');
 }finally{w.dispose();}
 assert.equal(w.stats().geometryCount,0);
 assert.equal(w.stats().materialCount,0);
});
