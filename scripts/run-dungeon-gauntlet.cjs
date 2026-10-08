'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DungeonRuntime,assertDungeonState}=require('../dist/games/ai-dungeon/src/index.js');
const out=path.resolve(__dirname,'../evidence/dungeon/gauntlet-latest.json'),publicOut=path.resolve(__dirname,'../public/ai-dungeon/gauntlet-latest.json');
const seeds=24,ticks=900;const runs=[];let failures=[];
for(let i=0;i<seeds;i++){
 const seed='gauntlet-corpus-v1-'+i,start=Date.now();
 try{
  const game=DungeonRuntime.create(seed),mirror=DungeonRuntime.create(seed);let highestFloor=1,deaths=0,changes=0,lastFloor=1,lastRun=1;
  for(let t=0;t<ticks;t++){const a=game.step(),b=mirror.step();
   if(a.checksum!==b.checksum)throw new Error('determinism mismatch at tick '+t);
   if(a.run>lastRun)deaths+=a.run-lastRun;
   if(a.floor!==lastFloor)changes++;
   lastRun=a.run;lastFloor=a.floor;highestFloor=Math.max(highestFloor,a.floor);
   if(t===Math.floor(ticks/2)){const restored=DungeonRuntime.restore(game.save());if(restored.save().signature!==game.save().signature)throw new Error('snapshot restore mismatch')}
   if(t%30===0)assertDungeonState(game.state);
  }
  runs.push({seed,highestFloor,deaths,floorsAdvanced:changes,kills:game.state.kills,elapsedMs:Date.now()-start});
 }catch(e){failures.push({seed,error:String(e)})}
}
const successful=runs.length,metrics={sample_seeds:seeds,ticks_per_seed:ticks,verified_seed_runs:successful,determinism_failures:failures.length,highest_floor_seen:Math.max(1,...runs.map(r=>r.highestFloor)),total_floor_advances:runs.reduce((a,r)=>a+r.floorsAdvanced,0),total_restarts:runs.reduce((a,r)=>a+r.deaths,0),max_seed_elapsed_ms:Math.max(0,...runs.map(r=>r.elapsedMs))};
const report={schemaVersion:1,generatedAt:new Date().toISOString(),status:failures.length?'FAILED - INTEGRITY GAP':'PASSED - HEADLESS ONLY',reference:'Path of Exile 2 — visual gate NOT ASSESSED',metrics,failures,runs,visualVerdict:'NOT ASSESSED',productionReady:false};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(publicOut,JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({status:report.status,metrics,failures})+'\n');if(failures.length)process.exitCode=1;
