'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const vm=require('node:vm'),{test}=require('node:test');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test('W428 complete original 390px input remains accessible from a 44px compact dock',()=>{
 assert.match(html,/id="mobile-transport-disclosure"[^>]*aria-controls="transport-actions"/);
 assert.match(html,/id="transport-actions" data-mobile-collapsed="true"/);
 assert.match(html,/setMobileTransportExpanded\(expanded\)/);
 assert.match(html,/mobileTransportDisclosure\.addEventListener\('click'/);
 assert.match(html,/#transport-actions\[data-mobile-collapsed="true"\] #pause/);
 assert.match(html,/#transport-actions\[data-mobile-collapsed="true"\] > :not\(#pause\)/);
 assert.match(html,/\[data-mobile-collapsed="false"\] \.btn/);
 assert.match(html,/min-height:44px!important/);
 assert.match(html,/transportActions.style.setProperty\('height','auto','important'\)/);
 assert.match(html,/transportActions.style.setProperty\('z-index','39','important'\)/);
 assert.match(html,/action.style.setProperty\('min-width','44px','important'\)/);
 // The old world-view :not(#pause):not(#speed1)...!important CSS hid
 // user-requested Save, Restore and Speed even after W428 expansion.
 assert.match(html,/action\.style\.setProperty\('display','inline-flex','important'\)/);
 assert.match(html,/action\.style\.removeProperty\('display'\)/);
 assert.match(html,/transportActions\.addEventListener\('keydown'/);
 assert.match(html,/mobileTransportDisclosure\.focus\(\)/);
 assert.match(html,/mobileTransportMedia\.addEventListener\('change'/);
 for(const id of ['pause','save','restore','speed1','speed4','speed16','focus','camera'])
  assert.match(html,new RegExp('id="'+id+'"'));
});
test('W428 real original citizens preserve all profession rigs and draw budget',()=>{
 const from=html.indexOf('function compactVillager(p){'),to=html.indexOf('function villager(p){',from);
 assert.ok(from>0&&to>from);
 const compact=html.slice(from,to);
 for(const fragment of ['taperedMedievalLimb(joint(leg.hip),joint(leg.knee)',
  'taperedMedievalLimb(joint(leg.knee),joint(leg.ankle)',
  'taperedMedievalLimb(joint(arm.shoulder),joint(arm.elbow)',
  'taperedMedievalLimb(joint(arm.elbow),joint(arm.wrist)',
  'tagWorkSkinRange(j,from)','tagWorkSkinRange(j+4,from)',
  'renderCompactOriginalFace','emitStreetCargo(p,x,y,z,s)'])
  assert.ok(compact.includes(fragment),fragment);
 const near=html.slice(html.indexOf('function tailoredGarment('),
  html.indexOf('// W63: real medieval fabric'));
 assert.match(near,/hemSweep=hang\*hang\*physical\.stride/);
 assert.match(near,/quadContinuousWorkcoat\(/);
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>0,'embedded game script exists');
 for(const [,js] of scripts) new vm.Script(js,{filename:'tiny-kingdom-inline.js'});
});
