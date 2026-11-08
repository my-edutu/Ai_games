'use strict';
// W126: RED-before/GREEN-after contract for the real, saved workday.
// Browser gameplay/clip assertions are separate; source strings are NOT FPS proof.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(source);
for(const symbol of [
 "function getAuthenticWorkGesture(p)",
 "function getBuilderConstructionIntent(p)",
 "function courierCartGripTarget(side)",
 "function getAuthenticWorkdayAudit()",
 "getAuthenticWorkdayAudit,getCourierCartGripAudit",
 "const construction=getBuilderConstructionIntent(p);"
])
 assert(source.includes(symbol),'W126 actual workday implementation missing: '+symbol);
// This prevents new workday staging from silently replacing the genuine engine.
for(const invariant of [
 'function beginMarketHandoff(p)',
 'function completeActualDelivery(p)',
 'function startActualDelivery(p)',
 'function routeCitizen(p)',
 'function work(p)',
 'function exportSnapshot()',
 'function getHarvestInteractionAudit()',
 'function getForgeCraftCycleAudit()',
 'function renderCompletedHarvestWitnesses()'])
 assert(source.includes(invariant),'W126 authoritative contract lost: '+invariant);
assert(source.includes('if(construction.canBuild){'),
 'W126 a physical building frame must never award a fake cottage');
assert(source.includes('for(let i=vertexStart;i<bodyEnd;i+=10)'),
 'W126 weighted citizen torso cannot shear a genuine inventory cart');
assert(source.includes('p.activity===\'Harvesting grain\''),
 'W126 winter-store task cannot pretend to cut a living field');
console.log('W126 genuine profession/source boundaries PASS; runtime, mobile, replay and footprint remain browser gates.');
