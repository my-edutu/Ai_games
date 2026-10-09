'use strict';
// Deterministic CC0 asset ingestion. External content is pinned by Git blob SHA,
// is never fetched at runtime, and is optional for offline procedural fallback.
const fs=require('node:fs');
const path=require('node:path');
const https=require('node:https');
const crypto=require('node:crypto');
const manifest=require('../games/ai-dungeon/assets/manifest.json');
const ROOT=path.resolve(__dirname,'../public/ai-dungeon/models'),strict=process.argv.includes('--strict');
const MAX_BYTES=8*1024*1024;
if(!/^[a-f0-9]{40}$/.test(manifest.revision)||manifest.license!=='CC0-1.0')throw Error('Untrusted asset manifest');
function shaOf(bytes){return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')}
function get(url,hops=0){
 return new Promise((resolve,reject)=>{
  if(hops>4)return reject(Error('Too many asset redirects'));
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||!['raw.githubusercontent.com','github.com'].includes(parsed.hostname))return reject(Error('Unexpected host'));
  const req=https.get(parsed,{headers:{'user-agent':'edutu-dungeon-cc0-ingester','accept':'application/octet-stream'},timeout:18000},res=>{
   if([301,302,303,307,308].includes(res.statusCode)){const location=res.headers.location;res.resume();if(!location)return reject(Error('Redirect without location'));return get(new URL(location,url).toString(),hops+1).then(resolve,reject)}
   if(res.statusCode!==200){res.resume();return reject(Error('HTTP '+res.statusCode))}
   const chunks=[];let length=0;
   res.on('data',chunk=>{length+=chunk.length;if(length>MAX_BYTES){req.destroy(Error('Asset size exceeded'));return}chunks.push(chunk)});
   res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
  });req.on('timeout',()=>req.destroy(Error('Download timed out')));req.on('error',reject);
 });
}
async function download(entry){
 if(!/^(player|enemy|environment)\/[\w-]+\.(glb|png)$/.test(entry.target))throw Error('Illegal target '+entry.target);
 if(!/^[a-f0-9]{40}$/.test(entry.blobSha)||entry.size>MAX_BYTES)throw Error('Invalid asset hash/size');
 const destination=path.join(ROOT,entry.target);
 try{const current=fs.readFileSync(destination);if(current.length===entry.size&&shaOf(current)===entry.blobSha)return 'cached'}catch{}
 const url='https://raw.githubusercontent.com/'+manifest.source+'/'+manifest.revision+'/'+entry.sourcePath;
 let last;
 for(let attempt=1;attempt<=2;attempt++){
  try{
   const bytes=await get(url);
   if(bytes.length!==entry.size)throw Error('Size mismatch: '+bytes.length+' != '+entry.size);
   if(shaOf(bytes)!==entry.blobSha)throw Error('Integrity mismatch: '+entry.target);
   fs.mkdirSync(path.dirname(destination),{recursive:true});
   fs.writeFileSync(destination+'.partial',bytes);fs.renameSync(destination+'.partial',destination);
   return 'downloaded';
  }catch(e){last=e}
 }
 throw Error(entry.target+' → '+String(last));
}
(async()=>{
 const counts={downloaded:0,cached:0,failed:0},errors=[];
 for(const entry of manifest.assets){
  try{const result=await download(entry);counts[result]++;}
  catch(e){counts.failed++;errors.push(String(e));}
 }
 console.log('[DUNGEON] CC0 model assets:',JSON.stringify(counts));
 if(errors.length){for(const e of errors)console.warn('[DUNGEON] '+e);if(strict){console.error('[DUNGEON] strict asset gate failed');process.exitCode=1}}
 else console.log('[DUNGEON] all model binaries SHA1 verified against pinned Git tree');
})().catch(e=>{console.error(e);process.exitCode=1});
