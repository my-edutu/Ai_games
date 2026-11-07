'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-dungeon/encounter-viewport-plan.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const hero=(x,z,hp=30)=>({id:'v',kind:'vanguard',faction:'party',x,z,hp});
const foe=(x,z,hp=20,kind='revenant')=>({id:'e',kind,faction:'enemy',x,z,hp});
test('true living opponents select a phone experience stage without affecting the game',async()=>{
 const {planEncounterViewport:plan}=await load();
 const cases=[
  [{units:[hero(9,9),foe(16,16)]},'journey'],
  [{units:[hero(9,9),foe(11,10)]},'combat'],
  [{units:[hero(9,9),foe(12,11,32,'warden')]},'warden'],
  [{units:[hero(9,9),foe(9,10,0,'warden')]},'journey'],
  [{units:[hero(9,9,0),foe(9,10,25,'warden')]},'journey'],
  [{phase:'intermission',units:[hero(9,9,0),foe(9,10,25,'warden')]},'defeat'],
  [{units:[]},'journey'],
  [{units:[hero(9,9),foe(NaN,9)]},'journey']
 ];
 for(const [state,expected] of cases){
  const before=JSON.stringify(state);assert.equal(plan(state),expected);
  assert.equal(JSON.stringify(state),before,'no change to authoritative snapshot');
 }
 assert.equal(plan({units:Array(81).fill(hero(9,9))}),'journey');
 assert.doesNotMatch(source,/Math\.random|Date\.|performance\.|requestAnimationFrame|fetch\(|localStorage/);
});
test('live mobile encounter camera keeps actual HP, physically bounded foreground clearance and served source',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'public/ai-dungeon/styles.css'),'utf8');
 const stone=fs.readFileSync(path.join(root,'public/ai-dungeon/party-visibility-plan.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.match(app,/document\.body\.dataset\.encounterStage=planEncounterViewport\(s\)/);
 assert.match(css,/data-encounter-stage="warden"/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/height:78svh/);
 assert.match(css,/\.party\{grid-template-columns:1fr;gap:5px\}/);
 assert.match(app,/planPortraitStageClearance\(world\.userData\.authoredPropVolumes/);
 assert.match(stone,/Math\.hypot\(actor\.x-cx,actor\.z-cz\)>7\.1/);
 assert.ok(server.includes("['/dungeon/encounter-viewport-plan.js','encounter-viewport-plan.js']"));
 assert.ok(pkg.scripts['dungeon:test'].includes('dungeon-encounter-viewport.test.cjs'));
});
