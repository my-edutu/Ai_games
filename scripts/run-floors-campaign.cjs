'use strict';
const {runFloorsCampaign}=require('../dist/games/ai-vs-1000-floors/src/testing/campaign.js');
const args=Object.fromEntries(process.argv.slice(2).filter(v=>v.startsWith('--')).map(v=>{const [k,...rest]=v.slice(2).split('=');return[k,rest.join('=')]}));
const seeds=Number(args.seeds||100),maxTicks=Number(args.maxTicks||5000),seedPrefix=args.seedPrefix||'floors-campaign';
if(!Number.isInteger(seeds)||seeds<1)throw new RangeError('seeds');if(!Number.isInteger(maxTicks)||maxTicks<1)throw new RangeError('maxTicks');
process.stdout.write(JSON.stringify(runFloorsCampaign({seeds,maxTicks,seedPrefix}),null,2)+'\n');
