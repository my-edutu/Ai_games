'use strict';
// W330 red/green: authentic medieval night illumination for the SAME
// live farm -> receiving market -> inhabited home. Never create fake actors.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../public/tiny-kingdom/index.html'),'utf8');
const exact = (str) => assert.ok(html.includes(str), 'Missing production night light contract: '+str);
exact('const VILLAGE_LIGHT_ANCHORS=Object.freeze([');
exact('function selectAuthenticCarriedLights(');
exact('function getVillageNightLightingAudit()');
exact('uniform vec4 villageLanterns[4]');
exact('uniform vec4 commuterLanterns[2]');
exact('float lamplight =');
exact('if(sunStrength<.47');
exact('gl.uniform4fv(uniforms.villageLanterns');
exact('gl.uniform4fv(uniforms.commuterLanterns');
exact('getVillageNightLightingAudit,');
const original=/lantern\(-5,-7,1\.7\);lantern\(6,9,1\.45\);lantern\(2,6,1\.7\);lantern\(-14,6,1\.45\)/;
assert.doesNotMatch(html,original,'Real lamps must use the SAME source anchors as illumination.');
assert.match(html,/for\(const \[x,z,height\] of VILLAGE_LIGHT_ANCHORS\)lantern\(x,z,height\)/);
assert.match(html,/people\.filter\(carryingCommuterLantern\)/,'Only real homebound commuters may cast lantern light.');
assert.match(html,/commuterLanternPoint\(p\)/,'Mobile light must follow actual IK wrist.');
assert.match(html,/Math\.min\(2,carriers\.length\)/,'At most two actual dynamic lanterns.');
const lightSources=(html.match(/const VILLAGE_LIGHT_ANCHORS=Object\.freeze\(\[/g)||[]).length;
assert.equal(lightSources,1);
console.log('W330 authentic source-linked four street + bounded two real-carrier night lights contract PASS; gameplay videos, native GPU FPS, G088 comparison NOT PROVEN.');
