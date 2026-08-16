import{checksum}from '../../replay/src/index';

const readonlyCache=new WeakMap<object,object>();

/**
 * Recursively freezes a value and exposes throwing mutation traps.
 * The proxy boundary makes mutation fail consistently even for non-strict
 * CommonJS callers, while Object.isFrozen() still reflects the frozen target.
 */
export function deepFreeze<T>(value:T):Readonly<T>{
  if(value===null||typeof value!=='object')return value as Readonly<T>;
  const existing=readonlyCache.get(value as object);if(existing)return existing as Readonly<T>;
  const target=value as Record<PropertyKey,unknown>;
  const proxy=new Proxy(target,{
    set(){throw new TypeError('immutable release value')},
    defineProperty(){throw new TypeError('immutable release value')},
    deleteProperty(){throw new TypeError('immutable release value')},
    setPrototypeOf(){throw new TypeError('immutable release value')}
  });
  readonlyCache.set(target,proxy);readonlyCache.set(proxy,proxy);
  for(const key of Reflect.ownKeys(target)){
    const descriptor=Object.getOwnPropertyDescriptor(target,key);
    if(descriptor&&'value'in descriptor&&descriptor.writable){
      Object.defineProperty(target,key,{...descriptor,value:deepFreeze(descriptor.value)});
    }
  }
  Object.freeze(target);
  return proxy as Readonly<T>;
}

export function canonicalClone<T>(value:T):T{return JSON.parse(JSON.stringify(value))as T}
export function evidenceDigest(value:unknown):string{return`checksum:${checksum(value)}`}

/** Strict content-addressed artifact digest used by frozen release manifests. */
export function isDigest(value:string):boolean{return/^(sha256:[a-f0-9]{8,64}|checksum:[a-f0-9]{8})$/i.test(value)}

/**
 * Evidence ledgers may use a stable symbolic digest in fixtures and dry runs.
 * Real release artifacts still pass the stricter isDigest() validation above.
 */
export function isEvidenceDigest(value:string):boolean{
  return isDigest(value)||/^(sha256|checksum):[a-z0-9][a-z0-9._-]{0,127}$/i.test(value);
}
