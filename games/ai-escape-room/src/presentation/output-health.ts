export interface EscapeOutputProbe{snapshotAgeMs:number;paintAgeMs:number;audioAgeMs:number;blackFrame:boolean;frozenFrame:boolean;muted:boolean;}
export interface EscapeOutputHealth{level:'healthy'|'degraded'|'safe-scene';reason:null|'stale-snapshot'|'stale-paint'|'black-output'|'frozen-output'|'silent-output';}
export function classifyEscapeOutputHealth(probe:EscapeOutputProbe):EscapeOutputHealth{
  for(const key of ['snapshotAgeMs','paintAgeMs','audioAgeMs'] as const)if(!Number.isFinite(probe[key])||probe[key]<0)throw new RangeError(key);
  if(probe.blackFrame)return{level:'safe-scene',reason:'black-output'};
  if(probe.frozenFrame||probe.paintAgeMs>3000)return{level:'safe-scene',reason:'frozen-output'};
  if(probe.snapshotAgeMs>2500)return{level:'degraded',reason:'stale-snapshot'};
  if(probe.paintAgeMs>1500)return{level:'degraded',reason:'stale-paint'};
  if(!probe.muted&&probe.audioAgeMs>5000)return{level:'degraded',reason:'silent-output'};
  return{level:'healthy',reason:null};
}
