'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/index.html'),'utf8');
const js=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/app.js'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/styles.css'),'utf8');
test('live broadcast exposes only sanitized public AI loadout and confidence',()=>{
 for(const id of ['focus-weapon','focus-ammo','focus-medkits','focus-confidence']){
   assert.match(html,new RegExp('id="'+id+'"'));
   assert.match(js,new RegExp('#'+id));
 }
 assert.match(js,/focus\.weapon/);
 assert.match(js,/focus\.confidence/);
 assert.match(css,/\.loadout-grid/);
 assert.doesNotMatch(html,/API_KEY|secretToken|providerActor/);
});
