// W333 physical mobile actor-core camera rescue contract, source-bound.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const f=source.match(/function shouldRescuePortraitWorkerCore\([\s\S]*?\n\}/);
assert(f,'real camera decision must exist in shipped game');
const policy=source.match(/const PORTRAIT_CORE_BAD=[\s\S]*?;\n/);
assert(policy,'committed renderer must expose the real portrait safety thresholds');
const check=vm.runInNewContext(policy[0]+f[0]+
 '\nshouldRescuePortraitWorkerCore;',Object.create(null));
const yes=(...args)=>assert.equal(check(...args),true);
const no=(...args)=>assert.equal(check(...args),false);
yes(390,true,.41,.025,.23); yes(520,true,.22,.075,.11);
no(1024,true,.41,.025,.23);no(0,true,.41,.025,.23);
no(390,false,.41,.025,.23);no(390,true,.14,.025,.23);
no(390,true,.41,.15,.23);no(390,true,.41,.025,.05);
no(390,true,Infinity,.025,.23);no(390,true,.41,NaN,.23);
for(const token of [
 'const currentWorkerForeground=foregroundSceneProjection(eye,plan.target,roofs)',
 'const portraitCoreCandidate=canvas.clientWidth>0&&canvas.clientWidth<=520',
 'portraitCoreRepair)&&',
 'plan.blockers===0&&plannedEyeClear',
 'if(portraitCoreRepair)portraitCoreRescues++',
 'portraitWorkerCoreRescues:portraitCoreRescues',
 'portraitWorkerExtraSceneSurveys:portraitCoreExtraSurveys'
])assert(source.includes(token),'missing physically checked integration: '+token);
assert(!/\b(step|saveWorld|state\.food|deliveryReceipts\.push)\b/.test(f[0]),
 'camera decision must not mutate authoritative economy');
console.log('W333 PASS: severe real portrait actor-core obstruction, clear physical eye, no desktop or economy changes. Browser A/B remains NOT PROVEN.');
