import type{OperatorAction,OperatorRole}from '../../operations-core/src/operator';
export interface ControlCommand{id:string;actor:string;role:OperatorRole;environment:string;action:OperatorAction;reason:string;target?:string;value?:string}
export interface ControlDecision{commandId:string;status:'accepted'|'denied'|'duplicate';reason:string;occurredAtMs:number}
export interface ControlAudit extends ControlDecision{actor:string;role:OperatorRole;environment:string;action:OperatorAction;target:string;value:string|null}
export interface ControlState{environment:string;simulationEnabled:boolean;interactionsEnabled:boolean;publicTextEnabled:boolean;safeScene:boolean;emergencyHalt:boolean;qualityPreset:string;restoreRequests:number;freshRunRequests:number;snapshotRequests:number;componentRestarts:number}
const permissions:Record<OperatorRole,ReadonlySet<OperatorAction>>={viewer:new Set(),operator:new Set(['safe-scene','disable-interactions','disable-public-text','restart-component','request-snapshot','quality-preset']),admin:new Set(['safe-scene','disable-interactions','disable-public-text','restart-component','request-snapshot','verified-restore','fresh-run','quality-preset','emergency-halt'])};
export class OperatorControlPlane{
  private readonly decisions=new Map<string,ControlDecision>();private readonly audits:ControlAudit[]=[];
  private current:ControlState;
  constructor(private readonly options:{environment:string;auditCapacity?:number}){if(!options.environment)throw new RangeError('environment');this.current={environment:options.environment,simulationEnabled:true,interactionsEnabled:true,publicTextEnabled:true,safeScene:false,emergencyHalt:false,qualityPreset:'normal',restoreRequests:0,freshRunRequests:0,snapshotRequests:0,componentRestarts:0}}
  execute(command:ControlCommand,occurredAtMs:number):ControlDecision{
    if(!command.id||!command.actor||!command.reason||!Number.isFinite(occurredAtMs))throw new RangeError('control command');
    const existing=this.decisions.get(command.id);if(existing)return{...existing,status:'duplicate',reason:'duplicate'};
    let status:'accepted'|'denied'='accepted',reason='accepted';
    if(command.environment!==this.options.environment){status='denied';reason='environment-mismatch'}
    else if(!permissions[command.role].has(command.action)){status='denied';reason='role-denied'}
    const decision:ControlDecision={commandId:command.id,status,reason,occurredAtMs};this.decisions.set(command.id,decision);
    const audit:ControlAudit={...decision,actor:command.actor,role:command.role,environment:command.environment,action:command.action,target:(command.target??'channel').slice(0,120),value:command.value?command.value.slice(0,120):null};
    this.audits.push(Object.freeze(audit));while(this.audits.length>(this.options.auditCapacity??10000))this.audits.shift();
    if(status==='accepted')this.apply(command);
    return structuredClone(decision);
  }
  state():ControlState{return structuredClone(this.current)}
  audit():ControlAudit[]{return structuredClone(this.audits)}
  private apply(command:ControlCommand){
    if(command.action==='safe-scene')this.current.safeScene=true;
    if(command.action==='disable-interactions')this.current.interactionsEnabled=false;
    if(command.action==='disable-public-text')this.current.publicTextEnabled=false;
    if(command.action==='quality-preset')this.current.qualityPreset=(command.value??'safe').slice(0,40);
    if(command.action==='verified-restore')this.current.restoreRequests++;
    if(command.action==='fresh-run')this.current.freshRunRequests++;
    if(command.action==='request-snapshot')this.current.snapshotRequests++;
    if(command.action==='restart-component')this.current.componentRestarts++;
    if(command.action==='emergency-halt'){this.current.emergencyHalt=true;this.current.simulationEnabled=false;this.current.safeScene=true;this.current.interactionsEnabled=false}
  }
}
