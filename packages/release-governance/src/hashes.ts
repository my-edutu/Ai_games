import{checksum}from '../../replay/src/index';
export function deepFreeze<T>(value:T):Readonly<T>{
  if(value!==null&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const child of Object.values(value as Record<string,unknown>))deepFreeze(child);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}
export function canonicalClone<T>(value:T):T{return JSON.parse(JSON.stringify(value))as T}
export function evidenceDigest(value:unknown):string{return`checksum:${checksum(value)}`}
export function isDigest(value:string):boolean{return/^(sha256:[a-f0-9]{8,64}|checksum:[a-f0-9]{8})$/i.test(value)}
