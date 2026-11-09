'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const file=require('node:path').resolve(__dirname,'../../public/ai-dungeon/spectator-ui.js');
async function load(){assert.ok(fs.existsSync(file),'spectator UI module must exist');return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'))}
test('boss encounter target converts grid to world coordinates exactly once',async()=>{const {encounterTarget}=await load();const p=encounterTarget({x:-8,z:-8},{x:3,z:4},19,true);assert.ok(Math.abs(p.x-(-7.44))<1e-9);assert.ok(Math.abs(p.z-(-7.16))<1e-9)});
test('no nearby boss leaves the focused position unchanged',async()=>{const {encounterTarget}=await load();assert.deepEqual(encounterTarget({x:2,z:-3},{x:17,z:17},19,false),{x:2,z:-3});assert.deepEqual(encounterTarget({x:2,z:-3},null,19,true),{x:2,z:-3})});
test('camera projection supports another odd map size without a magic offset',async()=>{const {encounterTarget}=await load();assert.deepEqual(encounterTarget({x:0,z:0},{x:10,z:10},21,true),{x:0,z:0})});
test('only high-priority events become intrusive scene alerts',async()=>{const {isSceneAlert}=await load();for(const kind of ['loot','kill','guard','disarm','block','evade','combat','healing'])assert.equal(isSceneAlert({kind}),false,kind);for(const kind of ['telegraph','phase','defeat'])assert.equal(isSceneAlert({kind}),true,kind)});

test('phone boss encounter keeps the optional tactical map below the physical world and focus is genuine',()=>{
 const css=fs.readFileSync(require('node:path').resolve(__dirname,'../../public/ai-dungeon/styles.css'),'utf8');
 const app=fs.readFileSync(require('node:path').resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(css,/@media\(max-width:759px\)[\s\S]*?\.map-panel\{position:relative!important/);
 assert.match(css,/body\[data-warden-focus=true\] \.boss-strip\{top:104px\}/);
 assert.match(css,/body\[data-warden-focus=true\] \.arena-lower\{display:none\}/);
 assert.match(app,/document\.body\.dataset\.wardenFocus=nearBoss\?'true':'false'/);
});

test('spectator reports only real imminent danger and honest recovery',async()=>{
 const {describeSpectatorDanger}=await load();
 const hero={id:'vanguard',faction:'party',kind:'vanguard',x:8,z:9,hp:70,maxHp:100};
 const warden={id:'warden',faction:'enemy',kind:'warden',x:9,z:9,hp:150,maxHp:200,action:'idle',actionTick:0};
 const base={phase:'exploring',tick:12,units:[hero,warden],guardianWard:false};
 assert.equal(describeSpectatorDanger(base),null);
 assert.deepEqual(describeSpectatorDanger({...base,bossWarning:{shape:'NOVA',cells:[{x:8,z:9}],attackTick:13}}),{
  kind:'warning',title:'WARDEN WARNING',detail:'Nova · impact in 1 turn'
 });
 assert.deepEqual(describeSpectatorDanger({...base,bossRecovery:{remaining:2}}),{
  kind:'counter',title:'COUNTER WINDOW',detail:'Warden recovering · 2 turns'
 });
 assert.equal(describeSpectatorDanger({...base,phase:'intermission'}),null);
});
