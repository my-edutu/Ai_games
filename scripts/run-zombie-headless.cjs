'use strict';
const{runZombieHeadless}=require('../dist/games/ai-zombie-survival/src/runtime/headless');
const seed=process.argv[2]??'zombie-headless';const ticks=Number(process.argv[3]??1800);
const report=runZombieHeadless({seed,ticks,config:{}});process.stdout.write(`${JSON.stringify(report,null,2)}\n`);
