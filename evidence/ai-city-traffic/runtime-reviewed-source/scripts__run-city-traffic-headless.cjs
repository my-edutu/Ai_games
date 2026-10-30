'use strict';
const {createTrafficSimulation,TRAFFIC_VERSION}=require('../dist/games/ai-city-traffic/src/simulation.js');
function numberArgument(name,fallback,minimum,maximum){
 const value=Number(process.argv.find(argument=>argument.startsWith(`--${name}=`))?.split('=')[1]??fallback);
 if(!Number.isFinite(value)||value<minimum||value>maximum)throw new RangeError(`Invalid ${name}`);
 return value;
}
const seed=numberArgument('seed',11026,0,4294967295),ticks=numberArgument('ticks',9000,0,1080000),demand=numberArgument('demand',1,0.25,2);
if(!Number.isInteger(seed)||!Number.isInteger(ticks))throw new RangeError('seed and ticks must be integers');
const first=createTrafficSimulation({seed,demand}),repeat=createTrafficSimulation({seed,demand});
first.step(ticks);repeat.step(ticks);
const matching=first.serialize()===repeat.serialize(),snapshot=first.snapshot();
console.log(JSON.stringify({version:TRAFFIC_VERSION,seed,ticks,simulatedSeconds:ticks/30,demand,matching,
 metrics:snapshot.metrics,vehicles:snapshot.vehicles.length,pedestrians:snapshot.pedestrians.length,
 signals:snapshot.signals.length,productionReady:false},null,2));
if(!matching)process.exitCode=1;
