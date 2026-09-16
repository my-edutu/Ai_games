'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{parseTowerConfig}=require('../../dist/games/infinite-tower-climb/src/config/schema.js');
const{generateTowerChunk}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');

const config=parseTowerConfig({launchFloor:0});

function chunk(floor){return generateTowerChunk(config,'experience-pass-room-seed',floor)}

test('room grammar is deterministic and every encounter slot references generated geometry',()=>{
  for(let floor=0;floor<20;floor++){
    const a=chunk(floor),b=chunk(floor);
    assert.deepEqual(a,b,`floor ${floor} changed across identical generation`);
    assert.equal(typeof a.roomArchetype,'string');
    assert.ok(a.roomArchetype.length>0);
    assert.ok(Array.isArray(a.encounterSlots));
    const ids=new Set(a.platforms.map(p=>p.id));
    for(const slot of a.encounterSlots){
      assert.ok(['pressure','blocker','crossfire','guardian-stage'].includes(slot.role),`invalid role ${slot.role}`);
      assert.ok(ids.has(slot.platformId),`slot ${slot.role} points at missing ${slot.platformId}`);
    }
  }
});

test('each sector exposes multiple deterministic room archetypes instead of one repeated staircase',()=>{
  const byTheme=new Map();
  for(let floor=0;floor<75;floor++){
    const c=chunk(floor);if(!byTheme.has(c.theme))byTheme.set(c.theme,new Set());byTheme.get(c.theme).add(c.roomArchetype);
  }
  for(const[theme,archetypes]of byTheme){assert.ok(archetypes.size>=2,`${theme} only generated ${[...archetypes].join(',')}`)}
});

test('landmark floors carry sanitized identity and guardian floors reserve a guardian stage',()=>{
  const twentyFive=chunk(25);assert.equal(twentyFive.landmarkName,'Broken Observatory');
  const ten=chunk(10);assert.equal(typeof ten.landmarkName,'string');assert.ok(ten.encounterSlots.some(s=>s.role==='guardian-stage'));
});

test('room grammar keeps a bounded ascending route through platform tops',()=>{
  for(let floor=0;floor<40;floor++){
    const c=chunk(floor),tops=c.platforms.map(p=>p.y+p.height).sort((a,b)=>a-b);
    for(let i=1;i<tops.length;i++)assert.ok(tops[i]-tops[i-1]<=90000,`floor ${floor} has vertical gap ${tops[i]-tops[i-1]}`);
    assert.ok(c.platforms.length<=config.maxPlatformsPerChunk);
    assert.ok(c.hazards.length<=config.maxHazardsPerChunk);
  }
});
