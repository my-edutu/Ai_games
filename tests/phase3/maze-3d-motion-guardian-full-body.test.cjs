'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const modulePromise=import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

test('original WebGL 390 motion guardian and Pip entire physical boxes get a safe real camera pan',async()=>{
 const {publicGuardianMotionPortraitPairShift:shift}=await modulePromise;
 const real=[{left:-.9655787665,right:.7037262771,bottom:-.2867133895,top:.3345425841},
   {left:.0339555507,right:.7971479284,bottom:-.3694586338,top:.0681736760}];
 const h=5.82560758515,aspect=390/844;
 const move=shift(aspect,h,real,true,false);
 assert.ok(move<-.17&&move>-.29,'original source-bound mobile pair gets lateral pan');
 const ndc=move/(h*aspect);
 for(const p of real)assert.ok(p.left-ndc>-.92&&p.right-ndc<.92,
   'both complete rig envelopes now inside stricter unchanged-lens physical frame');
 assert.equal(shift(aspect,h,real,false,false),0);
 assert.equal(shift(aspect,h,real,true,true),0);
 assert.equal(shift(1.2,h,real,true,false),0);
 assert.equal(shift(aspect,h,[real[0]],true,false),0);
 assert.equal(shift(aspect,h,[{...real[0],left:NaN},real[1]],true,false);
 assert.equal(shift(aspect,h,[{...real[0],left:-1.2},real[1]],true,false),
   'cannot hide a physically unfit model by changing camera');
 assert.equal(shift(aspect,h,[{...real[0],left:-.58,right:.05}, {...real[1],right:.7}],true,false),0);
 assert.ok(source.includes('const motionPairShift=publicGuardianMotionPortraitPairShift('));
 assert.ok(source.includes('physicalPairHeight>=originalPairLens-.02'));
});
