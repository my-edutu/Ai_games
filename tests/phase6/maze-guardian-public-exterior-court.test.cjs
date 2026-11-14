'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), os=require('node:os'), path=require('node:path');
const {pathToFileURL}=require('node:url');
async function loadRealWorld(){
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-guardian-exterior-'));
  try {
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    return {world:(await import(pathToFileURL(path.join(tmp,'world.js')).href)).createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(tmp,{recursive:true,force:true});throw error;}
}
const tile=(cell,neighbors=[])=>({cell,neighbors,blocked:false,trap:false,checkpoint:false,clue:false});
function frame(threats=[], tick=1){
  // All tiles are in the same original physical tier; 24 is a confirmed
  // ordinary, disconnected side spectator, NOT another open route to 23.
  return {runToken:'public-guardian-exterior',tick,width:7,height:7,
    lifecycle:'running',currentCell:22,cells:[tile(22,[23]),tile(23,[22]),tile(24)],
    visibleCells:[22,23,24],doors:[],keys:[],inventory:[],threats,
    exitCell:null,result:null};
}
test('witnessed guardian public side gallery clears full 3D undercroft dressing, while solid disclosed court persists',async()=>{
  const {world,cleanup}=await loadRealWorld();
  try{
    const quiet=frame([{cell:23}],1), untouched=JSON.stringify(quiet);
    world.update(quiet);
    const encounter=world.stats();
    assert.ok(encounter.guardianCausewayTiles>=2,'two reciprocal public actor cells own the original full-scale duel court');
    assert.ok(encounter.guardianForecourtShoulderTiles+encounter.guardianOuterCourtFloorTiles>=1,
      'published third ordinary tile forms the separate spectator ring');
    assert.equal(encounter.undercroftButtresses,0,
      'whole external 3D buttress/strata/dial/fern family clears, not a narrow cosmetic strip');
    assert.equal(encounter.closedTideMedallions,0,'no large ornamental tide-dials compete with the physical duel');
    assert.equal(encounter.hangingFacadeGardens,0,'no hanging undercroft ferns hide the actors');
    assert.deepEqual([...encounter.renderedCells].sort((a,b)=>a-b),[22,23,24],
      'all original publicly disclosed structural tile cells remain in the 3D stage');
    assert.ok(encounter.geometryCount<100,'do not create new pooled draw resources');
    assert.equal(JSON.stringify(quiet),untouched,'stage rendering cannot write back to public AI knowledge');
    world.update(frame([],2));
    const restored=world.stats();
    assert.ok(restored.undercroftButtresses>=2,
      'without an authentic witnessed guardian, the full ordinary exterior architecture returns');
    assert.equal(restored.guardianCausewayTiles,0);
    world.update({...frame([],3),runToken:'new-public-run',cells:[],visibleCells:[]});
    assert.equal(world.stats().undercroftButtresses,0,'reset clears all previously viewed exterior instances');
    assert.equal(world.stats().renderedCells.length,0);
  } finally {world.dispose();cleanup();}
});
