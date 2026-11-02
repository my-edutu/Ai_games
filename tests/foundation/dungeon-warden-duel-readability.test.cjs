'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=async p=>import('data:text/javascript;base64,'+Buffer.from(read(p)).toString('base64'));

test('one coherent imported-model and fallback Warden scale gives an imposing but readable REAL 3D duel',async()=>{
 const plan=await load('public/ai-dungeon/warden-regalia-plan.js');
 const {worldScale,sourceHeight}=plan.WARDEN_STAGE_PROFILE;
 const trueHeight=worldScale*sourceHeight,ratio=trueHeight/1.82;
 assert.ok(ratio>=1.40&&ratio<=1.55,'boss must dominate without hiding the adjacent living protagonist: '+ratio);
 assert.ok(sourceHeight>=2.2&&sourceHeight<=2.4&&worldScale>=1&&worldScale<=1.2);
 const regalia=plan.planWardenRegalia('warden');
 assert.equal(regalia.length,24);
 const farthest=Math.max(...regalia.flatMap(piece=>piece.shape==='horn'?piece.points.map(p=>Math.abs(p[0])):[Math.abs(piece.x)+piece.sx/2]));
 assert.ok(farthest*worldScale<.90,'horns/pauldrons cannot form a full-width opaque screen ahead of the hero');
 assert.match(read('public/ai-dungeon/model-assets.js'),/targetHeight=isBoss\?WARDEN_STAGE_PROFILE\.sourceHeight:1\.82/);
 assert.match(read('public/ai-dungeon/app.js'),/scale=boss\?WARDEN_STAGE_PROFILE\.worldScale:enemy/);
});
test('true Warden counter transforms the body silhouette and restores tactical warning camera',async()=>{
 const {planWardenExposurePose}=await load('public/ai-dungeon/warden-chapter-plan.js');
 const recovery=planWardenExposurePose({remaining:3},false,false);
 assert.ok(recovery.dip>.18&&recovery.torsoPitch>.27&&recovery.shoulderPitch>.23,'earned counter needs a visibly lowered guard');
 assert.equal(planWardenExposurePose({remaining:3},false,true).weight,0,'danger takes priority');
 assert.equal(planWardenExposurePose({remaining:3},true,false).weight,0,'bound ward remains sealed');
 const camera=read('public/ai-dungeon/cinematic-chapter-plan.js');
 assert.match(camera,/'warden-warning':\s*Object\.freeze\(\{radius:9\.05,height:10\.55/);
 assert.match(camera,/'warden-exposed':Object\.freeze\(\{radius:6\.85,height:6\.65/);
});
test('the live spectator has ONE boss identity and a clear physical arena, not two overlapping health banners',()=>{
 const overlay=read('public/ai-dungeon/combat-overlay.js');
 assert.match(overlay,/if\(u\.kind==='warden'\)continue/);
 const app=read('public/ai-dungeon/app.js');
 assert.match(app,/bossStrip\.dataset\.phase=phase/);
 const arena=read('public/ai-dungeon/warden-ritual.js');
 assert.match(arena,/pylon\.position\.set\(Math\.cos\(angle\)\*2\.50/);
 assert.doesNotMatch(read('public/ai-dungeon/warden-regalia-plan.js'),/Math\.random|Date\.|fetch\(/);
});
