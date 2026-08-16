export interface RngSnapshot{seed:string;streams:Record<string,number>}
function hash(s:string){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h||0x9e3779b9}
function next(x:number){x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}
export class NamedRng{private streams:Record<string,number>;private constructor(public readonly seed:string,streams?:Record<string,number>){this.streams=streams?{...streams}:{}}
static fromSeed(seed:string){return new NamedRng(seed)}
static restore(s:RngSnapshot){return new NamedRng(s.seed,s.streams)}
nextInt(stream:string,maxExclusive:number){if(!Number.isInteger(maxExclusive)||maxExclusive<=0)throw new RangeError('maxExclusive');let state=this.streams[stream]??hash(`${this.seed}:${stream}`);state=next(state);this.streams[stream]=state;return state%maxExclusive}
snapshot():RngSnapshot{return{seed:this.seed,streams:{...this.streams}}}
}
