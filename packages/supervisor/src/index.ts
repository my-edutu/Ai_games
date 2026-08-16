export type ComponentName='simulation'|'renderer'|'audio'|'gateway'|'persistence'|'telemetry'|'dashboard'|'capture';
export type RecoveryActionType='disable-interactions'|'restart-component'|'safe-scene'|'fence-writer'|'verified-recovery'|'safe-halt'|'reduce-quality'|'mute-audio';
export interface SupervisorOptions{heartbeatTimeoutMs:number;progressTimeoutMs:number;crashThreshold:number;crashWindowMs:number;breakerCooldownMs:number;maxComponents:number}
export interface Heartbeat{component:string;nowMs:number;progressSeq:number;resourcePressure:number}
export interface ComponentSnapshot{component:string;lastHeartbeatMs:number|null;lastProgressMs:number|null;progressSeq:number;resourcePressure:number;recentCrashes:number[];breaker:'closed'|'open'|'half-open';breakerOpenedAtMs:number|null}
export interface RecoveryAction{type:RecoveryActionType;component?:string;reason:string}
export interface SupervisorEvaluation{level:'healthy'|'degraded'|'unsafe';reasons:string[];actions:RecoveryAction[]}

const allowed=new Set<ComponentName>(['simulation','renderer','audio','gateway','persistence','telemetry','dashboard','capture']);
function failure(code:string,message:string):Error{const error=new Error(message);Object.assign(error,{code});return error}
function clone<T>(value:T):T{return structuredClone(value)}

export class RunSupervisor{
  private readonly components=new Map<string,ComponentSnapshot>();
  constructor(private readonly options:SupervisorOptions){
    for(const [key,value]of Object.entries(options))if(!Number.isFinite(value)||value<=0)throw new RangeError(key);
  }

  heartbeat(input:Heartbeat):void{
    this.assertComponent(input.component);
    if(!Number.isFinite(input.nowMs)||!Number.isInteger(input.progressSeq)||input.progressSeq<0||!Number.isFinite(input.resourcePressure)||input.resourcePressure<0||input.resourcePressure>1)throw new RangeError('heartbeat');
    const existing=this.components.get(input.component);
    const next:ComponentSnapshot=existing??{component:input.component,lastHeartbeatMs:null,lastProgressMs:null,progressSeq:input.progressSeq,resourcePressure:input.resourcePressure,recentCrashes:[],breaker:'closed',breakerOpenedAtMs:null};
    if(next.lastProgressMs===null||input.progressSeq>next.progressSeq)next.lastProgressMs=input.nowMs;
    next.progressSeq=Math.max(next.progressSeq,input.progressSeq);
    next.lastHeartbeatMs=input.nowMs;
    next.resourcePressure=input.resourcePressure;
    this.components.set(input.component,next);
  }

  recordCrash(component:string,nowMs:number):void{
    this.assertComponent(component);
    if(!Number.isFinite(nowMs))throw new RangeError('nowMs');
    const state=this.components.get(component)??{component,lastHeartbeatMs:null,lastProgressMs:null,progressSeq:0,resourcePressure:0,recentCrashes:[],breaker:'closed' as const,breakerOpenedAtMs:null};
    state.recentCrashes=state.recentCrashes.filter(value=>nowMs-value<=this.options.crashWindowMs);
    state.recentCrashes.push(nowMs);
    if(state.recentCrashes.length>this.options.crashThreshold)state.recentCrashes=state.recentCrashes.slice(-this.options.crashThreshold);
    if(state.recentCrashes.length>=this.options.crashThreshold){state.breaker='open';state.breakerOpenedAtMs=nowMs}
    this.components.set(component,state);
  }

  canRestart(component:string,nowMs:number):boolean{
    const state=this.components.get(component);if(!state)return true;
    if(state.breaker==='closed')return true;
    if(state.breaker==='half-open')return true;
    if(state.breakerOpenedAtMs!==null&&nowMs-state.breakerOpenedAtMs>=this.options.breakerCooldownMs){state.breaker='half-open';return true}
    return false;
  }

  recordRecoverySuccess(component:string):void{const state=this.components.get(component);if(state){state.breaker='closed';state.breakerOpenedAtMs=null;state.recentCrashes=[]}}

  evaluate(nowMs:number):SupervisorEvaluation{
    if(!Number.isFinite(nowMs))throw new RangeError('nowMs');
    const reasons:string[]=[];const actions:RecoveryAction[]=[];
    const simulation=this.components.get('simulation');
    if(simulation){
      if(simulation.breaker==='open'){reasons.push('simulation-crash-loop');actions.push({type:'safe-halt',component:'simulation',reason:'crash-loop-breaker-open'})}
      else if(simulation.lastHeartbeatMs===null||nowMs-simulation.lastHeartbeatMs>this.options.heartbeatTimeoutMs){reasons.push('simulation-heartbeat-stale');actions.push({type:'safe-scene',reason:'simulation-heartbeat-stale'},{type:'fence-writer',component:'simulation',reason:'simulation-heartbeat-stale'},{type:'verified-recovery',component:'simulation',reason:'simulation-heartbeat-stale'})}
      else if(simulation.lastProgressMs===null||nowMs-simulation.lastProgressMs>this.options.progressTimeoutMs){reasons.push('simulation-no-progress');actions.push({type:'safe-scene',reason:'simulation-no-progress'},{type:'fence-writer',component:'simulation',reason:'simulation-no-progress'},{type:'verified-recovery',component:'simulation',reason:'simulation-no-progress'})}
      if(simulation.resourcePressure>=0.95){reasons.push('simulation-resource-pressure');actions.push({type:'safe-scene',reason:'simulation-resource-pressure'},{type:'verified-recovery',component:'simulation',reason:'simulation-resource-pressure'})}
    }
    this.evaluatePeripheral('renderer',nowMs,'unsafe',reasons,actions);
    this.evaluatePeripheral('gateway',nowMs,'degraded',reasons,actions);
    this.evaluatePeripheral('audio',nowMs,'degraded',reasons,actions);
    for(const component of ['persistence','telemetry','dashboard','capture'] as const)this.evaluatePeripheral(component,nowMs,component==='persistence'||component==='capture'?'unsafe':'degraded',reasons,actions);
    const unsafe=reasons.some(reason=>reason.startsWith('simulation-')||reason.startsWith('renderer-')||reason.startsWith('persistence-')||reason.startsWith('capture-'));
    return{level:unsafe?'unsafe':reasons.length?'degraded':'healthy',reasons:[...new Set(reasons)],actions:this.dedupeActions(actions)};
  }

  component(component:string):ComponentSnapshot{const state=this.components.get(component);if(!state)throw failure('UNKNOWN_COMPONENT',component);return clone(state)}
  snapshot():ComponentSnapshot[]{return[...this.components.values()].map(clone)}

  private evaluatePeripheral(component:ComponentName,nowMs:number,severity:'degraded'|'unsafe',reasons:string[],actions:RecoveryAction[]):void{
    const state=this.components.get(component);if(!state)return;
    const stale=state.lastHeartbeatMs===null||nowMs-state.lastHeartbeatMs>this.options.heartbeatTimeoutMs;
    const pressured=state.resourcePressure>=0.9;
    if(state.breaker==='open'){reasons.push(`${component}-crash-loop`);actions.push({type:severity==='unsafe'?'safe-scene':'restart-component',component,reason:'crash-loop-breaker-open'});return}
    if(stale){reasons.push(`${component}-heartbeat-stale`);if(component==='gateway')actions.push({type:'disable-interactions',component,reason:'gateway-unavailable'});else if(component==='audio')actions.push({type:'mute-audio',component,reason:'audio-unavailable'});else if(severity==='unsafe')actions.push({type:'safe-scene',component,reason:`${component}-unavailable`});actions.push({type:'restart-component',component,reason:`${component}-heartbeat-stale`})}
    if(pressured){reasons.push(`${component}-resource-pressure`);actions.push({type:'reduce-quality',component,reason:`${component}-resource-pressure`})}
  }

  private dedupeActions(actions:RecoveryAction[]):RecoveryAction[]{const seen=new Set<string>();return actions.filter(action=>{const key=`${action.type}:${action.component??''}:${action.reason}`;if(seen.has(key))return false;seen.add(key);return true})}
  private assertComponent(component:string):void{if(!allowed.has(component as ComponentName)||(!this.components.has(component)&&this.components.size>=this.options.maxComponents))throw failure('COMPONENT_CAPACITY',`unsupported or excess component ${component}`)}
}
