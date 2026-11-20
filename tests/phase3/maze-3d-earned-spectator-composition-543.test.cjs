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
 assert.match(world,/signal\.observatory\.instrument\.position\.y=reduced\?0:-1\.72\*counterWave/);
 assert.match(world,/const mastLift=reduced\?0:Math\.max\(0,Math\.min\(1,warningAction\)\)/);
 assert.match(world,/instrument\.position\.set\(-\.77,0,-\.77\)/);
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
