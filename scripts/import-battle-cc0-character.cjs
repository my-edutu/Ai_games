'use strict';
// First-party reproducible import of Quaternius CC0 humanoid skeleton.
// The model is never fetched by clients at stream runtime. SHA-1 verifies
// the Git blob from the exact pinned source commit, with SHA-256 manifest.
const https=require('node:https');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const upstream='ddd5fc34a445bcded3cf9836607aaeebc19a5c78';
const base='https://raw.githubusercontent.com/programasweights/avatar/'+upstream+'/public/assets/';
const sourceFiles={
  'character.glb':{dest:'quaternius-hero.glb',size:741320,gitBlob:'b3fd79533fdb9fcedd077744f7e120920eb6cc97'},
  'QUATERNIUS-LICENSE.txt':{dest:'QUATERNIUS-LICENSE.txt',size:806,gitBlob:'4b37c2d1fa14dfdc7033394635b31972fa091b77'}
};
function download(url,redirects=2){
  return new Promise((resolve,reject)=>{
    const request=https.get(url,{timeout:25000,headers:{'user-agent':'edutu-battle-asset-pin/1'}},response=>{
      if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){
        response.resume();
        if(!redirects)return reject(Error('Too many redirects'));
        return resolve(download(new URL(response.headers.location,url).href,redirects-1));
      }
      if(response.statusCode!==200){response.resume();return reject(Error('HTTP '+response.statusCode))}
      const chunks=[];let total=0;
      response.on('data',chunk=>{total+=chunk.length;if(total>2_000_000){
        request.destroy(Error('File too large'));return;
      }chunks.push(chunk)});
      response.on('end',()=>resolve(Buffer.concat(chunks)));
      response.on('error',reject);
    });
    request.on('timeout',()=>request.destroy(Error('Download timeout')));
    request.on('error',reject);
  });
}
async function main(){
  const out=path.resolve(__dirname,'../public/ai-battle-royale/models');
  const assets=[];
  fs.mkdirSync(out,{recursive:true});
  for(const [source,expected] of Object.entries(sourceFiles)){
    const bytes=await download(base+source);
    if(bytes.length!==expected.size)throw Error('Unexpected size for '+source);
    const gitHash=crypto.createHash('sha1').update('blob '+bytes.length+'\0')
      .update(bytes).digest('hex');
    if(gitHash!==expected.gitBlob)throw Error('Upstream integrity violation '+source);
    if(source.endsWith('.glb')&&bytes.toString('ascii',0,4)!=='glTF')
      throw Error('Invalid glTF binary magic');
    if(source.endsWith('.txt')&&!bytes.toString('utf8').match(/CC0|Creative Commons Zero/i))
      throw Error('CC0 license not found');
    fs.writeFileSync(path.join(out,expected.dest),bytes);
    assets.push({path:expected.dest,bytes:bytes.length,
      sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
      upstream:base+source,gitBlob:gitHash,license:'CC0-1.0'});
    process.stdout.write('[battle/character] pinned '+source+' '+bytes.length+' bytes\n');
  }
  const manifest={
    schemaVersion:1,publisher:'Quaternius',pack:'Universal Base Characters — Standard',
    specificSource:'Superhero Male full-body — CC0 humanoid reference skeleton',
    license:'CC0-1.0',licenseFile:'QUATERNIUS-LICENSE.txt',
    originalPack:'https://quaternius.com/packs/universalbasecharacters.html',
    notes:'A skinned humanoid source asset; loading, animating and replacing the existing procedural presentation requires separate visual QA.',
    assets
  };
  fs.writeFileSync(path.join(out,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
main().catch(error=>{console.error('[battle/character] '+error.message);process.exitCode=1});
