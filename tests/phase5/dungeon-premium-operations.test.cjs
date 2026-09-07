'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{encodeDungeonSnapshot}=require('../../dist/games/ai-dungeon-endless-adventure/src/persistence/snapshot.js');
const{DungeonAuthorityJournal,DungeonOperationsError}=require('../../dist/games/ai-dungeon-endless-adventure/src/operations/index.js');

const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

test('verified snapshots let the authority journal compact retired dedupe IDs and continue indefinitely within its retained horizon',()=>{const runtime=new DungeonRuntime(base,'journal-compaction','journal-compaction-run'),journal=new DungeonAuthorityJournal({maxEntries:4,maxSnapshots:2}),lease=journal.acquireLease('worker');let lastSequence=0;for(let i=0;i<96;i++){const command={kind:'step',action:{kind:'guard'}},entry=journal.reserveCommand(lease.epoch,`cmd-${i}`,command);runtime.step(command.action);journal.commit(lease.epoch,entry.sequence,runtime.checksum());lastSequence=entry.sequence;if((i+1)%4===0)journal.appendSnapshot(lease.epoch,encodeDungeonSnapshot(runtime))}assert.ok(journal.dedupeSize()<=32);assert.ok(journal.entries().length<=4);const duplicate=journal.reserveCommand(lease.epoch,'cmd-95',{kind:'step',action:{kind:'guard'}});assert.equal(duplicate.sequence,lastSequence);assert.equal(duplicate.status,'committed')});

test('journal still fails closed at dedupe capacity when no verified snapshot covers retired commands',()=>{const journal=new DungeonAuthorityJournal({maxEntries:4,maxSnapshots:1}),lease=journal.acquireLease('worker');for(let i=0;i<32;i++){const entry=journal.reserve(lease.epoch,`unsnap-${i}`,`input-${i}`);journal.commit(lease.epoch,entry.sequence,`result-${i}`)}assert.throws(()=>journal.reserve(lease.epoch,'unsnap-overflow','input-overflow'),error=>error instanceof DungeonOperationsError&&error.code==='CAPACITY')});

test('retained duplicate command IDs fail closed when the command content differs',()=>{const journal=new DungeonAuthorityJournal({maxEntries:8,maxSnapshots:1}),lease=journal.acquireLease('worker'),first=journal.reserveCommand(lease.epoch,'same-id',{kind:'step',action:{kind:'guard'}});journal.commit(lease.epoch,first.sequence,'result-a');assert.throws(()=>journal.reserveCommand(lease.epoch,'same-id',{kind:'step',action:{kind:'wait'}}),error=>error instanceof DungeonOperationsError&&error.code==='MISMATCH')});
