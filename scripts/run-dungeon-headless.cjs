'use strict';
const{DEFAULT_DUNGEON_CONFIG}=require('../dist/games/ai-dungeon-endless-adventure/src/config/schema.js');
const{runDungeonHeadless}=require('../dist/games/ai-dungeon-endless-adventure/src/testing/headless.js');
const seed=process.argv[2]||'dungeon-headless';const ticks=Number(process.argv[3]||2000);process.stdout.write(JSON.stringify(runDungeonHeadless(DEFAULT_DUNGEON_CONFIG,seed,ticks),null,2)+'\n');
