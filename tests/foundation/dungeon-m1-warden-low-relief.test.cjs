'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('the actual Warden cathedral source buttress no longer becomes a 2.3m foreground opaque shaft',async()=>{
 const s=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/warden-chapter-plan.js'),'utf8');
 const {WARDEN_WALL_BUTTRESS_PROFILE:p}=await import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));
 assert.ok(p.shaftY+p.shaftHeight/2<=1.2);
 assert.ok(p.capY+p.capHeight/2<=1.2);
 assert.ok(p.archY+p.archRadius+p.archTube<=1.4);
 assert.ok(p.finialY+p.finialRadius<=1.2);
 assert.ok(p.capTop<=.26&&p.shaftBase<=.2&&p.maxTopMeters<=1.2);
 assert.equal(p.oldShaftHeight,2.3);
 assert.ok(Object.isFrozen(p));
});
