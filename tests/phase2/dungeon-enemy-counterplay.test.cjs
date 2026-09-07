'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{planDungeonAction}=require('../../dist/games/ai-dungeon-endless-adventure/src/ai/policy.js');

const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};
function encounter(kind,distance=1){const runtime=new DungeonRuntime(base,`counterplay-${kind}-${distance}`,`counterplay-${kind}-${distance}-run`),width=runtime.state.floor.width,hero=10*width+10,target=hero+distance;runtime.state.floor.tiles.fill(0);for(let offset=0;offset<=distance;offset++)runtime.state.floor.tiles[hero+offset]=1;runtime.state.hero.cell=hero;runtime.state.hero.vision=6;runtime.state.hero.hp=runtime.state.hero.maxHp;runtime.state.hero.shield=0;runtime.state.floor.sigil=hero+6;runtime.state.floor.gate=hero+7;runtime.state.floor.chest=hero+8;runtime.state.floor.shrine=hero+9;runtime.state.ai.knownCells=[hero,hero+1,hero+2];runtime.state.enemies=[{id:`${kind}-test`,kind,cell:target,hp:8,maxHp:8,attack:2,armour:0,cooldown:0,telegraph:null,phase:1,alive:true}];return{runtime,hero,target,width}}

test('Bone Warden signals a committed adjacent strike before damage resolves',()=>{const{runtime}=encounter('bone-warden',1),before=runtime.state.hero.hp;const warned=runtime.step({kind:'wait'});assert.equal(runtime.state.hero.hp,before);assert.equal(runtime.state.enemies[0].telegraph,'melee');assert.ok(warned.some(event=>event.type==='enemy.telegraph'));runtime.step({kind:'wait'});assert.ok(runtime.state.hero.hp<before);assert.equal(runtime.state.enemies[0].telegraph,null)});

test('melee cooldown creates an actual recovery interval instead of damaging every tick',()=>{const{runtime}=encounter('mireling',1),before=runtime.state.hero.hp;runtime.state.enemies[0].cooldown=2;runtime.step({kind:'wait'});assert.equal(runtime.state.hero.hp,before);runtime.step({kind:'wait'});assert.ok(runtime.state.hero.hp<before)});

test('Void Hound telegraphs a two-cell leap before closing and striking',()=>{const{runtime,hero,target}=encounter('void-hound',2),before=runtime.state.hero.hp;runtime.step({kind:'wait'});assert.equal(runtime.state.hero.hp,before);assert.equal(runtime.state.enemies[0].cell,target);assert.equal(runtime.state.enemies[0].telegraph,'leap');runtime.step({kind:'wait'});assert.ok(runtime.state.hero.hp<before);assert.equal(runtime.state.enemies[0].cell,hero+1);assert.equal(runtime.state.enemies[0].telegraph,null)});

test('Astra braces against a visible committed attack instead of blindly trading into it',()=>{const{runtime}=encounter('bone-warden',1);runtime.state.enemies[0].telegraph='melee';const proposal=planDungeonAction(runtime.state);assert.equal(proposal.action.kind,'guard');assert.equal(proposal.ai.goal,'Survive the committed attack')});
