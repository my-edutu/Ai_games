'use strict';
const {MarbleRuntime,marbleStateChecksum}=require('../dist/games/marble-survival/src/index.js');

function run(seed='marble-headless-reference',tournaments=25){
  const config={rosterSize:16,roundQuotas:[8,4,2,2,1],roundIntroTicks:0,roundTimeoutTicks:1800,intermissionTicks:2};
  const first=MarbleRuntime.create(config,seed),second=MarbleRuntime.create(config,seed);
  let steps=0,champions=0,quarantines=0;
  while(first.state.runIndex<tournaments&&steps<2_000_000){
    first.step();second.step();steps++;
    if(marbleStateChecksum(first.state)!==marbleStateChecksum(second.state))throw new Error(`determinism-divergence:${steps}`);
    if(first.state.lifecycle==='tournament-result')champions++;
    if(first.state.lifecycle==='quarantined'){quarantines++;break;}
  }
  const report={ok:first.state.runIndex===tournaments&&quarantines===0&&champions===tournaments,seed,tournaments,steps,champions,quarantines,finalChecksum:marbleStateChecksum(first.state),finalRunIndex:first.state.runIndex};
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if(!report.ok)process.exitCode=1;
}
run(process.argv[2],Number(process.argv[3]||25));
