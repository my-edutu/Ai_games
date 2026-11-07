'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'public/ai-dungeon/cinematic-figure.js');
test('M1 integrated cranial sculpture retains original distinct roles, not disconnected helmet and face draws',async()=>{
 const source=fs.readFileSync(file,'utf8');
 const {planCinematicFigure,planCinematicHeadShell}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const pieces=planCinematicFigure(kind).pieces,head=planCinematicHeadShell(kind);
  assert.equal(head.length,kind==='mystic'?5:4);
  assert.deepEqual(new Set(head.map(p=>p.anchor)),new Set(['head']));
  assert.ok(['helmet','face','visor'].every(id=>head.some(p=>p.id===id)));
  assert.equal(new Set(head.map(p=>p.id)).size,head.length);
  assert.ok(pieces.length<=(kind==='warden'?30:24));
 }
 assert.equal(planCinematicHeadShell('unknown').length,0);
 assert.match(source,/new T\.Mesh\(sculptedHead,mat\.integratedHead\)/);
 assert.match(source,/joints\.head\.attach\(headMesh\)/);
 assert.match(source,/for\(const p of headPieces\)\{excluded\.add\(p\.id\)/);
 assert.match(source,/vertexColors:true/);
 assert.doesNotMatch(source,/Math\.random\(|fetch\(/);
});
test('live browser contract enforces continuous skinned original heads instead of detached cosmetic bodies',()=>{
 const body=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-cinematic-figure.spec.cjs'),'utf8');
 assert.match(body,/nativeContinuousActors:/);
 assert.match(body,/nativeVisibleSkinnedMeshes:/);
 assert.match(body,/nativeTexturedSourceMeshes:/);
 assert.match(browser,/desktop\.nativeContinuousActors/);
 assert.match(browser,/mobile\.nativeContinuousActors/);
 assert.match(browser,/desktop\.cinematicFigures\)\.toBe\(0\)/);
 assert.match(browser,/mobile\.cinematicFigures\)\.toBe\(0\)/);
});
