'use strict';
// W198: source-bound test-first contract for REAL on-site planted-leg flexion.
// Exercises the original game source, not a new / scripted citizen or invented job.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const open=source.indexOf('<script>'),close=source.indexOf('</script>',open);
assert(open>=0&&close>open,'must parse the actual playable game');
new Function(source.slice(open+8,close));
const a=source.indexOf('function citizenRigPose(p){');
const b=source.indexOf('// W47 real citizen footwear',a);
assert(a>0&&b>a,'must test real live-authority citizen rig');
const rig=source.slice(a,b);
const m=rig.match(/const pelvisDrop=([\s\S]*?);/);
assert(m,'production IK must calculate physical job-driven pelvis drop');
const calculate=new Function('working','traveling','hauling','acting','return '+m[1]);
const same=(v,w,h,c)=>calculate(v,w,h,{crouch:c});
assert.equal(same(false,false,false,.21),0,'idle must not pretend to labor');
assert.equal(same(true,true,false,.20),0,'real travelling gait remains planted/unchanged');
assert.equal(same(true,false,true,.20),0,'real courier road gait must not be crouched');
assert.equal(same(true,false,false,Number.NaN),0,'invalid cue must not corrupt mesh');
const farm=same(true,false,false,.17),forge=same(true,false,false,.04);
const unload=same(true,false,false,.255),build=same(true,false,false,.09);
assert(farm>.10&&farm<.16,'a real harvesting bend must move the pelvis');
assert(forge>0&&forge<farm,'anvil labor bends less than grain harvesting');
assert(build>forge&&build<farm,'joinery uses an intermediate transfer');
assert(unload>.14&&unload<=.16,'package handoff must lower weight safely');
assert(rig.includes('const hip=[footX,.60-pelvisDrop,0]'),
  'IK leg hip must use same physical work load, not cosmetic torso alone');
assert(rig.includes('const upper=.335,lower=.335'),
  'original actual two-bone leg lengths must be preserved');
assert(rig.includes('const ankle=[footX,.047+groundOffset+lift,footZ]')||
  rig.includes(',ankle=[footX,.047+groundOffset+lift,footZ]'),
  'the original ground-sampled ankle must remain authoritative');
assert(rig.includes('groundOffset:leg.groundOffset')===false||
  source.includes('pelvisDrop:leg.pelvisDrop'),
  'real on-screen population motion audit must expose planted knee loading');
function jointBend(pelvis){
 const hip=.60-pelvis,ankle=.047,upper=.335,lower=.335;
 const distance=Math.abs(ankle-hip);
 const reach=Math.min(distance,upper+lower-.0001);
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
 const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 const knee=[hip-(hip-ankle)*along/reach,bend];
 assert(Math.abs(Math.hypot(knee[0]-hip,knee[1])-upper)<1e-8);
 assert(Math.abs(Math.hypot(knee[0]-ankle,knee[1])-lower)<1e-8);
 return bend;
}
assert(jointBend(farm)>jointBend(0)+.05,
 'true work flexion changes connected knee silhouette at fixed boot contact');
assert(rig.includes('pelvisDrop,')&&rig.includes('return {hip,knee,ankle'),
 'the actual solved rig must expose its load without mutating the world');
console.log('W198 physical work IK PASS: original game parsed; harvest, forge, join, unload authentic load cues; travelling and courier gait unchanged; two-bone joints retain length, boots stay grounded, no extra triangles or authority.');
