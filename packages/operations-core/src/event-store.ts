export interface StoredEvent{ id:string; seq:number; type:string; payload:Record<string,unknown>; }
export class InMemoryEventStore{
  private runs=new Map<string,StoredEvent[]>();
  append(runId:string,event:StoredEvent){const list=this.runs.get(runId)??[];const duplicate=list.find(e=>e.id===event.id);if(duplicate)return{status:'duplicate' as const,event:structuredClone(duplicate)};const expected=list.length;if(event.seq!==expected)throw new Error(`sequence gap: expected ${expected}, got ${event.seq}`);list.push(structuredClone(event));this.runs.set(runId,list);return{status:'appended' as const,event:structuredClone(event)}}
  events(runId:string){return structuredClone(this.runs.get(runId)??[])}
  rebuild(runId:string){const events=this.runs.get(runId)??[];let result:any=undefined;for(const e of events)if(e.type==='result')result=structuredClone(e.payload);return{eventCount:events.length,lastSeq:events.length?events[events.length-1].seq:-1,...(result?{result}:{})}}
}
