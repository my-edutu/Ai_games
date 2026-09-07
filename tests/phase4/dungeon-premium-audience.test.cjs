'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{buildDungeonRenderSnapshot}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/snapshot.js');

const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

test('audience reveal may brighten remembered terrain but never reveals a currently occluded enemy',()=>{const runtime=new DungeonRuntime(base,'reveal-privacy','reveal-privacy-run'),width=runtime.state.floor.width,hero=10*width+10,enemy=hero+2;runtime.state.floor.tiles.fill(0);for(const cell of[hero,hero-width,hero-width+1,hero-width+2,enemy-width,enemy])runtime.state.floor.tiles[cell]=1;runtime.state.hero.cell=hero;runtime.state.hero.vision=6;runtime.state.ai.knownCells=[hero,hero-width,hero-width+1,hero-width+2,enemy-width,enemy];runtime.state.enemies=[{id:'remembered-but-hidden',kind:'mireling',cell:enemy,hp:6,maxHp:6,attack:2,armour:0,cooldown:0,telegraph:null,phase:1,alive:true}];runtime.state.influence.revealUntilTick=runtime.state.tick+30;const snapshot=buildDungeonRenderSnapshot(runtime.state);const terrain=snapshot.cells.find(cell=>cell.cell===enemy);assert.ok(terrain);assert.equal(terrain.visible,true);assert.equal(snapshot.entities.some(entity=>entity.id==='remembered-but-hidden'),false)});
