'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const world=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');

test('Pass543 original observatory ROOT physically recedes on the SAME source-earned guardian recoil and resets when witness disappears',()=>{
 assert.match(world,/const earnedParry=witnessedLane && options\.guardianParried===true/);
 assert.match(world,/snapshot\.threats\.some\(threat=>threat\?\.cell===guardianCell/);
 assert.match(world,/const resonance=publicGuardianEarnedResonance\(/);
 assert.match(world,/const counterWave=resonance\.wave/);
 assert.match(world,/const observedImpactDepth=publicGuardianObservatoryImpactDrop\(/);
 assert.match(world,/signal\.observatory\.instrument\.position\.y=-1\.72\*observedImpactDepth/);
 assert.match(world,/const mastLift=reduced\?0:Math\.max\(0,Math\.min\(1,warningAction\)\)/);
 // The ray-identified actor-obscuring mast was deliberately rebuilt off the
 // observed lane, not restored to its old center position merely for a regex.
 // Retain the strict 1.72m root impact check above, plus require BOTH lane
 // orientations, joined low rig and its separately earned plinth seating.
 assert.match(world,/instrument\.position\.set\(alongX\?0:-\.53,0,alongX\?-\.53:0\)/);
 assert.match(world,/const lowMechanism=new THREE\.Group\(\)/);
 assert.match(world,/lowMechanism\.position\.y=-\.47/);
 assert.match(world,/lowMechanism\.scale\.y=\.52/);
 assert.match(world,/instrument\.add\(lowMechanism\)/);
 assert.match(world,/signal\.observatory\.lowMechanism\.position\.y=-\.47-\.4\*observedImpactDepth/);
 assert.match(world,/for\(const vane of signal\.observatory\.vanes\)/);
});
test('Pass543 publicly discovered spectator negative-space removes ONLY decorative floor mosaics; maintains solid floor and pressure stage',()=>{
 assert.match(world,/const guardianQuietRingCell=guardianQuietRing\.has\(c\.cell\)/);
 assert.match(world,/&& !c\.trap && !c\.checkpoint && !c\.clue/);
 assert.match(world,/if \(!pressureCourtApron && !guardianQuietRingCell && tier === 0/);
 assert.match(world,/if \(!pressureCourtApron && !guardianCourtCell && !guardianQuietRingCell && courtSeed > \.68/);
 assert.match(world,/if \(!pressureCourtApron && !guardianCourtCell && !guardianQuietRingCell && !gateCourt/);
 assert.match(world,/if \(!pressureCourtApron && !guardianCourtCell && !guardianQuietRingCell\) for/);
 assert.match(world,/const floorMaterial = pressureCourtBasin \? darkJade/);
 assert.match(world,/if \(pressureCourtBasin\) \{/);
 assert.match(world,/if \(guardianCourtCell\) \{/);
 assert.match(world,/if \(c\.trap && !c\.blocked\) \{/);
 assert.match(world,/if \(c\.blocked\) \{/);
 assert.match(world,/for \(const door of Array\.isArray\(s\.doors\) \? s\.doors : \[\]\)/);
});
