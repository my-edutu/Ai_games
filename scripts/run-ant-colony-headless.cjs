'use strict';
const {runHeadlessCorpus}=require('../dist/games/ai-ant-colony/src/index.js');
const seeds=Number.parseInt(process.argv[2]??'100',10);
const maxTicks=Number.parseInt(process.argv[3]??'1000',10);
const report=runHeadlessCorpus({seeds,maxTicks,config:{width:48,height:30,targetPopulation:100,initialWorkers:24,broodInterval:28,eggHatchTicks:18,larvaTicks:20,pupaTicks:18,noProgressTicks:900}});
process.stdout.write(`${JSON.stringify(report,null,2)}\n`);
