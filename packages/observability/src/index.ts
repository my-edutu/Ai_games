export interface MetricRegistryOptions{maxSeries:number;maxLabelLength:number}
export interface MetricSeries{name:string;labels:Record<string,string>;count:number;sum:number;min:number;max:number;last:number}
const privateLabels=new Set(['viewerId','viewerRef','email','token','secret','paymentId','providerUserId']);
function problem(code:string,message:string){const error=new Error(message);Object.assign(error,{code});return error}
function seriesKey(name:string,labels:Record<string,string>){return`${name}|${Object.entries(labels).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join(',')}`}
export class MetricRegistry{
  private readonly data=new Map<string,MetricSeries>();private dropped=0;
  constructor(private readonly options:MetricRegistryOptions){if(!Number.isInteger(options.maxSeries)||options.maxSeries<1)throw new RangeError('maxSeries');if(!Number.isInteger(options.maxLabelLength)||options.maxLabelLength<1)throw new RangeError('maxLabelLength')}
  observe(name:string,value:number,labels:Record<string,string>={}):'recorded'|'dropped-cardinality'{
    if(!name||!Number.isFinite(value))throw new RangeError('metric');
    const bounded:Record<string,string>={};
    for(const[k,v]of Object.entries(labels)){if(privateLabels.has(k))throw problem('PRIVATE_LABEL',`private metric label ${k}`);if(String(v).length>this.options.maxLabelLength)throw new RangeError('label length');bounded[k]=String(v)}
    const key=seriesKey(name,bounded),existing=this.data.get(key);
    if(!existing&&this.data.size>=this.options.maxSeries){this.dropped++;return'dropped-cardinality'}
    if(existing){existing.count++;existing.sum+=value;existing.min=Math.min(existing.min,value);existing.max=Math.max(existing.max,value);existing.last=value}
    else this.data.set(key,{name,labels:bounded,count:1,sum:value,min:value,max:value,last:value});
    return'recorded';
  }
  value(name:string):number|undefined{const matching=[...this.data.values()].filter(x=>x.name===name);return matching.length?Math.max(...matching.map(x=>x.last)):undefined}
  snapshot(){return{schemaVersion:1,series:structuredClone([...this.data.values()]),droppedSeries:this.dropped}}
}

export interface AlertRule{id:string;metric:string;operator:'gt'|'gte'|'lt'|'lte';threshold:number;forSamples:number;recoverSamples:number;severity:'ticket'|'page';runbook:string}
export interface AlertTransition{type:'fired'|'resolved';id:string;severity:AlertRule['severity'];runbook:string;metric:string;value:number;occurredAtMs:number}
interface AlertState{active:boolean;breaches:number;recoveries:number}
export class AlertEngine{
  private readonly states=new Map<string,AlertState>();
  constructor(private readonly rules:AlertRule[]){for(const rule of rules){if(!rule.id||!rule.metric||!rule.runbook||!Number.isFinite(rule.threshold)||!Number.isInteger(rule.forSamples)||rule.forSamples<1||!Number.isInteger(rule.recoverSamples)||rule.recoverSamples<1)throw new RangeError('alert rule');this.states.set(rule.id,{active:false,breaches:0,recoveries:0})}}
  evaluate(values:Record<string,number>,occurredAtMs:number):AlertTransition[]{const transitions:AlertTransition[]=[];for(const rule of this.rules){const value=values[rule.metric];if(!Number.isFinite(value))continue;const state=this.states.get(rule.id)!;const breached=this.compare(value,rule);if(!state.active){if(breached)state.breaches++;else state.breaches=0;if(state.breaches>=rule.forSamples){state.active=true;state.breaches=0;state.recoveries=0;transitions.push({type:'fired',id:rule.id,severity:rule.severity,runbook:rule.runbook,metric:rule.metric,value,occurredAtMs})}}else{if(breached)state.recoveries=0;else state.recoveries++;if(state.recoveries>=rule.recoverSamples){state.active=false;state.recoveries=0;transitions.push({type:'resolved',id:rule.id,severity:rule.severity,runbook:rule.runbook,metric:rule.metric,value,occurredAtMs})}}}return transitions}
  active():string[]{return[...this.states.entries()].filter(([,state])=>state.active).map(([id])=>id)}
  private compare(value:number,rule:AlertRule){if(rule.operator==='gt')return value>rule.threshold;if(rule.operator==='gte')return value>=rule.threshold;if(rule.operator==='lt')return value<rule.threshold;return value<=rule.threshold}
}
