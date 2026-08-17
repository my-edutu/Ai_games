'use strict';
const {runCivilizationHeadless}=require('../dist/games/ai-civilization/src/testing/headless.js');
const args=Object.fromEntries(process.argv.slice(2).map(v=>v.replace(/^--/,'').split('=')));
const seed=args.seed||'civilization-demo';const maxDays=Number(args.days||1200);
if(!Number.isInteger(maxDays)||maxDays<=0)throw new RangeError('days');
process.stdout.write(JSON.stringify(runCivilizationHeadless({seed,maxDays}),null,2)+'\n');
