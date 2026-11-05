'use strict';
const {BattleRoyaleRuntime}=require('../dist/games/ai-battle-royale/src/runtime.js');
const results=[];
for(let sample=0;sample<8;sample++){
  const runtime=new BattleRoyaleRuntime(`royale-campaign-${sample}`);
  let result=null;
  for(let tick=0;tick<12500;tick++){
    runtime.step();
    if(tick%20!==0)continue;
    const view=runtime.snapshot();
    if(view.phase==='intermission'&&!result)result={seed:`royale-campaign-${sample}`,winner:view.winner,seconds:view.time,remaining:view.remaining,checksum:view.checksum};
    if(view.matchId>1){results.push({...result,restarted:true});break;}
  }
  if(results.length!==sample+1)throw new Error(`Campaign seed ${sample} failed to resolve and restart`);
}
console.log(JSON.stringify({game:'ai-battle-royale',matches:results.length,results},null,2));
