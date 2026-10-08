'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('weather atmosphere is cap-limited and presentation-only across three arenas',()=>{
 assert.match(code,/function biomeWeather\(/);
 assert.match(code,/quality==='low'/);
 assert.match(code,/reducedMotion/);
 assert.match(code,/reducedFlash/);
 assert.match(code,/arena\.theme==='arctic'/);
 assert.match(code,/arena\.theme==='neon'/);
 assert.match(code,/arena\.theme==='ember'/);
 assert.doesNotMatch(code,/Math\.random\(|runtime\.step\(/);
});
