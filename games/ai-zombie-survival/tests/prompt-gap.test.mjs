import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,validateWorld,selectCameraEvent,survivorPose,zombiePose} from '../dist/index.js';

test('world contains physical rescue civilians and authoritative objective',()=>{const g=createGame({seed:2026,zombieCount:0});assert.ok(g.civilians.length>=3);assert.ok(g.civilians.every(c=>c.state==='trapped'));assert.equal(g.objective.kind,'rescue');assert.ok(g.objective.targetId);});

test('survivors can complete a physical rescue and score it',()=>{let g=createGame({seed:2026,zombieCount:0});for(let i=0;i<30*80&&g.score.rescued===0;i++)g=stepGame(g,1/30);assert.ok(g.score.rescued>0);assert.ok(g.civilians.some(c=>c.state==='safe'));assert.ok(g.events.some(e=>e.type==='rescue'));});

test('rescued civilians are escorted to safe house rather than disappearing',()=>{let g=createGame({seed:77,zombieCount:0});const c=g.civilians[0],s=g.survivors[0];s.x=c.x;s.y=c.y;s.role='leader';for(let i=0;i<40;i++)g=stepGame(g,1/30);const current=g.civilians.find(x=>x.id===c.id);assert.ok(current);assert.ok(['following','escorting','safe'].includes(current.state));assert.ok(Number.isFinite(current.x)&&Number.isFinite(current.y));});

test('safe house visibly upgrades with rescued population and materials',()=>{let g=createGame({seed:9,zombieCount:0});g.resources.materials=160;g.score.rescued=4;g.time.elapsed=360;g.time.day=4;g=stepGame(g,1/30);assert.ok(g.safeHouse.level>=2);assert.ok(g.safeHouse.features.length>2);assert.ok(g.events.some(e=>e.type==='safehouse-upgrade'));});

test('special zombie archetypes exist and have meaningful silhouettes and behaviour tags',()=>{const g=createGame({seed:11,zombieCount:90});const kinds=new Set(g.zombies.map(z=>z.archetype));assert.ok(kinds.has('runner'));assert.ok(kinds.has('brute'));assert.ok(kinds.has('shambler'));const brute=g.zombies.find(z=>z.archetype==='brute');const runner=g.zombies.find(z=>z.archetype==='runner');assert.notEqual(zombiePose(brute).silhouette,zombiePose(runner).silhouette);assert.ok(brute.maxHealth>runner.maxHealth);});

test('building interior state hides roof for occupant and validates civilians',()=>{let g=createGame({seed:13,zombieCount:0});const b=g.buildings.find(x=>x.kind!=='safehouse');const s=g.survivors[0];s.x=b.x;s.y=b.y;g=stepGame(g,1/30);assert.equal(g.buildings.find(x=>x.id===b.id).roofVisible,false);assert.equal(g.survivors[0].insideBuildingId,b.id);assert.deepEqual(validateWorld(g).filter(i=>i.severity==='error'),[]);});

test('camera prioritizes rescue when a survivor is escorting a civilian',()=>{const g=createGame({seed:15,zombieCount:0});const s=g.survivors[0],c=g.civilians[0];s.action='rescue';s.escortCivilianId=c.id;c.escortId=s.id;c.state='escorting';const event=selectCameraEvent(g);assert.equal(event.mode,'rescue');assert.equal(event.targetId,s.id);});

test('survivor pose exposes carry rescue and frightened injury readability',()=>{assert.equal(survivorPose({action:'rescue',health:100,stamina:80}).stance,'escort');assert.equal(survivorPose({action:'move',health:100,stamina:80,carrying:4}).stance,'carry');assert.equal(survivorPose({action:'move',health:100,stamina:80,threat:.95}).stance,'frightened');assert.equal(survivorPose({action:'move',health:10,stamina:30}).stance,'limp');});
