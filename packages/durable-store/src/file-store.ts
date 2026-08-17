import { checksum } from '../../replay/src/index';
import type { AuditEntry, CompatibilityKey, SnapshotRecord, StoredEvent } from '../../ops-contracts/src/index';
import { InMemoryDurableStore, type AppendResult, type DurableStore, type DurableStoreOptions } from './index';

declare const require: (id: string) => unknown;
declare const process: { pid: number };

interface FileSystemBoundary {
  mkdirSync(path: string, options: { recursive: boolean }): void;
  openSync(path: string, flags: string, mode?: number): number;
  writeSync(fd: number, value: string): number;
  fsyncSync(fd: number): void;
  closeSync(fd: number): void;
  writeFileSync(path: string, value: string, encoding: 'utf8'): void;
  renameSync(oldPath: string, newPath: string): void;
  readFileSync(path: string, encoding: 'utf8'): string;
  readdirSync(path: string): string[];
  existsSync(path: string): boolean;
}

interface PathBoundary {
  join(...parts: string[]): string;
  dirname(value: string): string;
  basename(value: string): string;
}

const fs = require('node:fs') as FileSystemBoundary;
const path = require('node:path') as PathBoundary;

function storeError(code:string,message:string,cause?:unknown):Error{const error=new Error(message);Object.assign(error,{code,cause});return error}
function safeName(value:string){return checksum(value).slice(0,32)}
function appendDurable(file:string,line:string){fs.mkdirSync(path.dirname(file),{recursive:true});const fd=fs.openSync(file,'a',0o600);try{fs.writeSync(fd,line);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}}
function writeTextAtomic(file:string,value:string){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=`${file}.${process.pid}.tmp`;fs.writeFileSync(temp,value,'utf8');const fd=fs.openSync(temp,'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}fs.renameSync(temp,file);const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}}
function writeAtomic(file:string,value:unknown){writeTextAtomic(file,JSON.stringify(value))}
function readJsonLines<T>(file:string):T[]{const text=fs.readFileSync(file,'utf8');const result:T[]=[];for(const line of text.split('\n')){if(!line.trim())continue;try{result.push(JSON.parse(line)as T)}catch(error){throw storeError('CORRUPT_STORE',`invalid JSON evidence in ${path.basename(file)}`,error)}}return result}

export class FileDurableStore implements DurableStore{
  private readonly memory:InMemoryDurableStore;private readonly eventCapacity:number;private readonly snapshotCapacity:number;private readonly auditCapacity:number;
  private readonly eventsDir:string;private readonly snapshotsDir:string;private readonly auditFile:string;
  constructor(public readonly root:string,options:DurableStoreOptions={}){
    if(!root)throw new RangeError('root');this.eventCapacity=options.eventCapacity??100000;this.snapshotCapacity=options.snapshotCapacity??8;this.auditCapacity=options.auditCapacity??10000;this.memory=new InMemoryDurableStore(options);
    this.eventsDir=path.join(root,'events');this.snapshotsDir=path.join(root,'snapshots');this.auditFile=path.join(root,'audits.jsonl');
    fs.mkdirSync(this.eventsDir,{recursive:true});fs.mkdirSync(this.snapshotsDir,{recursive:true});this.load();
  }
  appendEvent(event:StoredEvent):AppendResult<StoredEvent>{
    const existing=this.memory.events(event.streamId).find(item=>item.eventId===event.eventId);
    if(existing)return this.memory.appendEvent(event);
    const{checksum:supplied,...base}=event;if(checksum(base)!==supplied)throw storeError('EVENT_CONFLICT','event checksum is invalid');
    const commandId=event.type==='runtime-command'&&typeof event.payload.commandId==='string'?event.payload.commandId:'';
    if(commandId&&this.memory.runtimeCommand(event.streamId,commandId))throw storeError('EVENT_CONFLICT',`runtime command ${commandId} is already durably reserved`);
    const stream=this.memory.events(event.streamId),expected=stream.length?stream[stream.length-1].seq+1:0;if(event.seq!==expected)throw storeError('SEQUENCE_GAP',`expected ${expected}, received ${event.seq}`);if(stream.length>=this.eventCapacity)throw storeError('CAPACITY_EXCEEDED',`stream ${event.streamId} reached its bounded segment capacity`);
    try{appendDurable(path.join(this.eventsDir,`${safeName(event.streamId)}.jsonl`),`${JSON.stringify(event)}\n`)}catch(error){throw storeError('DURABILITY_WRITE_FAILED','event fsync failed',error)}
    return this.memory.appendEvent(event);
  }
  events(streamId:string){return this.memory.events(streamId)}
  runtimeCommand(streamId:string,commandId:string){return this.memory.runtimeCommand(streamId,commandId)}
  putSnapshot(record:SnapshotRecord){
    const current=this.memory.snapshots(record.streamId).filter(item=>item.id!==record.id);current.push(structuredClone(record));current.sort((a,b)=>b.createdAtMs-a.createdAtMs||b.commandSeq-a.commandSeq||a.id.localeCompare(b.id));while(current.length>this.snapshotCapacity)current.pop();
    try{writeAtomic(path.join(this.snapshotsDir,`${safeName(record.streamId)}.json`),current)}catch(error){throw storeError('DURABILITY_WRITE_FAILED','snapshot atomic write failed',error)}
    return this.memory.putSnapshot(record);
  }
  snapshots(streamId:string){return this.memory.snapshots(streamId)}
  compatibleSnapshots(streamId:string,compatibility:CompatibilityKey){return this.memory.compatibleSnapshots(streamId,compatibility)}
  appendAudit(entry:AuditEntry):AppendResult<AuditEntry>{
    const existing=this.memory.audits().find(item=>item.id===entry.id);if(existing)return this.memory.appendAudit(entry);
    try{appendDurable(this.auditFile,`${JSON.stringify(entry)}\n`)}catch(error){throw storeError('DURABILITY_WRITE_FAILED','audit fsync failed',error)}
    const result=this.memory.appendAudit(entry);
    if(this.memory.audits().length>=this.auditCapacity){try{writeTextAtomic(this.auditFile,`${this.memory.audits().map(item=>JSON.stringify(item)).join('\n')}\n`)}catch(error){throw storeError('DURABILITY_WRITE_FAILED','audit compaction failed',error)}}
    return result;
  }
  audits(){return this.memory.audits()}
  stats(){return this.memory.stats()}
  private load(){
    try{
      for(const name of fs.readdirSync(this.eventsDir).filter((name:string)=>name.endsWith('.jsonl')).sort())for(const event of readJsonLines<StoredEvent>(path.join(this.eventsDir,name)))this.memory.appendEvent(event);
      for(const name of fs.readdirSync(this.snapshotsDir).filter((name:string)=>name.endsWith('.json')).sort()){
        let records:SnapshotRecord[];try{records=JSON.parse(fs.readFileSync(path.join(this.snapshotsDir,name),'utf8'))as SnapshotRecord[]}catch(error){throw storeError('CORRUPT_STORE',`invalid snapshot index ${name}`,error)}
        if(!Array.isArray(records))throw storeError('CORRUPT_STORE',`snapshot index ${name} is not an array`);for(const record of [...records].reverse())this.memory.putSnapshot(record);
      }
      if(fs.existsSync(this.auditFile))for(const audit of readJsonLines<AuditEntry>(this.auditFile))this.memory.appendAudit(audit);
    }catch(error){if((error as{code?:string}).code==='CORRUPT_STORE')throw error;throw storeError('CORRUPT_STORE','failed to reconstruct durable store',error)}
  }
}
