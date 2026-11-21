'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const open=html.indexOf('<script>'),close=html.lastIndexOf('</script>');
assert(open>=0&&close>open,'actual game script required');
new Function(html.slice(open+8,close));
const from=html.indexOf('const MEDIEVAL_WARDROBE=');
const end=html.indexOf('function tailoredGarment(',from);
assert(from>=0&&end>from,'six-role medieval wardrobe must exist');
const api=new Function('rgb',html.slice(from,end)+
 ';return {medievalCitizenIdentity,garmentProfile};')(
 hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255]);
const jobs=['farmer','forester','builder','merchant','craftsperson','gatherer'];
const body={activity:'Resting at home',phase:0,job:'farmer'};
const variants=jobs.map((job,i)=>{
 const p={...body,job},before=JSON.stringify(p);
 const d=api.medievalCitizenIdentity(p,i);
 const rig={stride:.1,working:false,acting:{lean:0}};
 const g=api.garmentProfile(p,i,rig);
 assert.equal(JSON.stringify(p),before,'presentation may not edit real citizen');
 assert.equal(d.job,job);assert.equal(g.rings.length,5);
 assert.equal(g.panelCount,8);
 assert(d.wool.every(v=>v>=0&&v<=1),'valid shaded wool');
 assert(g.rings.every(v=>Number.isFinite(v.rx)&&v.rx>0&&v.rz>0));
 return [job,d.name,g.rings[0].rx,g.rings[3].rx];
});
assert.equal(new Set(variants.map(v=>v[1])).size,6,'genuine role silhouette');
assert(variants[3][2]>variants[2][2],'merchant coat must hang below/broader than joiner');
assert(variants[2][3]>variants[0][3],'builder shoulders differ from farmer');
for(const token of [
 'function taperedMedievalLimb(','function renderArticulatedHand(',
 'function renderMedievalWardrobe(','function renderMedievalHairline(',
 'renderMedievalWardrobe(p,idx,x,y,z,size,rig,',
 'citizenMidVisualIndices.has(i)?','function getMedievalPopulationAudit(',
 'midIndices:new Set','const rawMidIndices=new Set',
 'renderArticulatedHand(worldJoint(arm.wrist)',
 'getMedievalPopulationAudit,','drawForegroundResidentMesh();',
 'resetWorkingResidents();resetForegroundResidents();'
])if(token!=='midIndices:new Set')assert(html.includes(token),'missing real renderer integration '+token);
assert(html.includes('const midIndices=keptPlan?'),
 'paused camera may retain the original middle-detail workers');
assert(html.includes('new Set(citizenOrbitDetailHold.plan.midIndices)'),
 'same actual actors remain in the existing middle-detail rig');
assert(html.includes('new Set(citizenOrbitDetailHold.plan.indices)'),
 'real full-body citizen identity remains unchanged during shallow orbit');
// W530: actor path guards now branch on bounded GPU residency; source-only
// adjacent-line asserts were stale and blocked real G088/current gameplay A/B.
// Verify that every original person takes one explicit, truthful draw path.
const actorFrom=html.indexOf('const actualActorBodyPaths=new Uint8Array(people.length);');
const actorTo=html.indexOf('lastActorPresentationPaths=actualActorBodyPaths;',actorFrom);
assert(actorFrom>0&&actorTo>actorFrom,'real full-population draw dispatch exists');
const draw=html.slice(actorFrom,actorTo);
assert.match(draw,/for\(let i=0;i<people\.length;i\+\+\)/,
 'every authoritative citizen receives an original body decision');
assert.match(draw,/else if\(!foregroundIndices\.has\(i\)\)\s*\{\s*villager\(people\[i\]\)/,
 'full near sculpt stays live if GPU admission is rejected');
assert.match(draw,/else\s*\{\s*compactVillager\(people\[i\]\)/,
 'distant original rig stays live if no GPU resident accepts it');
for(const [name,path] of [['compactCPU',1],['fullCPU',2],
 ['restingGPU',3],['commuterGPU',4],['workingGPU',5],['foregroundGPU',6]])
 assert(draw.includes('actualActorBodyPaths[i]='+path),
  name+' must retain original full-population representation');
assert(html.includes('lastActorPresentationPaths=actualActorBodyPaths;'),
 'the population coverage audit consumes actual path IDs');
assert(!html.slice(from,html.indexOf('function renderRealVillageWorkwear(',from)).includes('Math.random('),
 'cosmetic identity is deterministic');
console.log('W125 original six-role population, sculpted anatomical rig, 3-tier rendering source/parse contracts PASS');
