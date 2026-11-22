'use strict';
/*
 * Evidence-only authority comparison for real pinned-G088 gameplay captures.
 * Clock, camera, viewport and seed alignment do not establish the same
 * simulated society. Never report an equivalence PASS for missing/unequal
 * authoritative snapshot checksums. This module must not touch game state.
 */
const PHASES=Object.freeze([
 'day1','marketDay1','labor','day120','marketDay120',
 'marketNight','night','overnight','mobile','marketMobile'
]);
function assessWorldComparability(original,candidate){
 if(!original||!candidate)throw Error('Both actual gameplay scenarios are required');
 const frames=Object.fromEntries(PHASES.map(name=>{
  const old=original[name],next=candidate[name];
  const originalChecksum=typeof old?.snapshotChecksum==='string'&&
   old.snapshotChecksum.length?old.snapshotChecksum:null;
  const candidateChecksum=typeof next?.snapshotChecksum==='string'&&
   next.snapshotChecksum.length?next.snapshotChecksum:null;
  return [name,{
   sameSimulationHour:Boolean(Number.isFinite(old?.simulatedHour)&&
    old.simulatedHour===next?.simulatedHour),
   originalChecksum,candidateChecksum,
   authorityChecksumEqual:Boolean(originalChecksum&&candidateChecksum&&
    originalChecksum===candidateChecksum)
  }];
 }));
 return {
  source:'real-exportSnapshot-checksum',
  strictWorldStatePairProven:PHASES.every(name=>
   frames[name].sameSimulationHour&&frames[name].authorityChecksumEqual),
  frames,
  limitation:'Aligned seed, clock and camera do not prove equivalent citizens, inventories, work or growth.'
 };
}
module.exports={PHASES,assessWorldComparability};
