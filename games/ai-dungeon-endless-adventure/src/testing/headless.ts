import type{DungeonConfig}from '../../../../packages/game-contracts/src/index';
import{DungeonRuntime}from '../runtime/run';
export function runDungeonHeadless(config:DungeonConfig,seed:string,ticks:number){const runtime=new DungeonRuntime(config,seed,`headless-${seed}`);for(let i=0;i<ticks&&runtime.state.lifecycle!=='run-result'&&runtime.state.lifecycle!=='quarantined';i++)runtime.step();return{checksum:runtime.checksum(),state:runtime.state}}
