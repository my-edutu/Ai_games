'use strict';
// Independent isolated-filesystem readiness probe. Never alters product assets.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {createHash}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..');
const label=process.argv.find(x=>x.startsWith('--label='))?.slice(8)||'review1';
if(!/^[a-z0-9-]+$/.test(label))throw new Error('Invalid evidence label');
const source=fs.readFileSync(path.join(ROOT,'scripts/serve-city-traffic.cjs'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Independently enumerated from the current HTML and transitive startup imports.
const routes=[
 ['/traffic/','public/ai-city-traffic/index.html'],
 ['/traffic/styles.css','public/ai-city-traffic/styles.css'],
 ['/traffic/main.mjs','public/ai-city-traffic/main.mjs'],
 ['/traffic/world.mjs','public/ai-city-traffic/world.mjs'],
 ['/traffic/world-assets.mjs','public/ai-city-traffic/world-assets.mjs'],
 ['/traffic/audio.mjs','public/ai-city-traffic/audio.mjs'],
 ['/traffic/runtime/simulation.js','dist/city-traffic-browser/simulation.js'],
 ['/traffic/runtime/traffic-network.js','dist/city-traffic-browser/traffic-network.js'],
 ['/traffic/vendor/three.module.js','node_modules/three/build/three.module.js'],
 ['/traffic/vendor/three.core.js','node_modules/three/build/three.core.js'],
 ['/traffic/vendor/addons/controls/OrbitControls.js','node_modules/three/examples/jsm/controls/OrbitControls.js'],
];
const results={capturedAt:new Date().toISOString(),reviewer:'runtime_closure_review',source:'scripts/serve-city-traffic.cjs',sourceSha256:sha(source),node:process.version,scope:'Isolated HTTP asset readiness; no rendering',cases:[]};
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'traffic-independent-closure-'));
fs.chmodSync(temp,0o755);
let child;
const write=(relative,body='// isolated fixture\n')=>{
 const name=path.join(temp,relative);fs.mkdirSync(path.dirname(name),{recursive:true,mode:0o755});
 fs.writeFileSync(name,body,{mode:0o644});return name;
};
const worker=String.raw`
const {createTrafficServer}=require(process.argv[1]);
const server=createTrafficServer();
server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({port:server.address().port,uid:process.getuid?.()})+'\n'));
process.on('SIGTERM',()=>{server.closeAllConnections();server.close(()=>process.exit(0));});
`;
async function main(){
 try{
  const script=write('scripts/serve-city-traffic.cjs',source);
  write('dist/city-traffic-browser/simulation.js');write('public/ai-city-traffic/world.mjs');
  const options={cwd:temp,stdio:['ignore','pipe','pipe']};
  // Use an unprivileged fixture process when run as root so chmod(000) is meaningful.
  if(process.getuid?.()===0){options.uid=65534;options.gid=65534;}
  child=spawn(process.execPath,['-e',worker,script],options);
  let stderr='';child.stderr.on('data',b=>{stderr+=b;});
  const hello=await new Promise((resolve,reject)=>{
   let buf='';const timer=setTimeout(()=>reject(new Error('Fixture server did not start')),5000);
   child.once('error',e=>{clearTimeout(timer);reject(e);});
   child.once('exit',code=>{clearTimeout(timer);reject(new Error('Fixture server exited '+code+': '+stderr));});
   child.stdout.on('data',b=>{buf+=b;const i=buf.indexOf('\n');if(i>=0){clearTimeout(timer);resolve(JSON.parse(buf.slice(0,i)));}});
  });
  results.fixtureUid=hello.uid;
  const origin=`http://127.0.0.1:${hello.port}`;
  const get=async route=>{const r=await fetch(origin+route,{signal:AbortSignal.timeout(5000)});const body=await r.text();return{status:r.status,length:Buffer.byteLength(body),...(route==='/traffic/health'?{health:JSON.parse(body)}:{})};};
  const check=async(name,expected,route)=>{
   const h=await get('/traffic/health');const asset=route?await get(route):undefined;
   results.cases.push({name,expectedBuildReady:expected,actualBuildReady:h.health.buildReady,productionReady:h.health.productionReady,healthStatus:h.status,...(route?{route,asset}:{}),pass:h.status===200&&h.health.buildReady===expected&&h.health.productionReady===false});
  };
  await check('original two-file partial build',false,'/traffic/main.mjs');
  for(const [,file]of routes)write(file);
  await check('all eleven nonempty required files',true);
  results.completeBuildAssets=[];
  for(const [route,file]of routes)results.completeBuildAssets.push({route,file,...await get(route)});
  for(const [route,file]of routes){
   const name=path.join(temp,file);fs.renameSync(name,name+'.saved');
   await check('missing '+file,false,route);fs.renameSync(name+'.saved',name);
  }
  for(const [route,file]of routes){
   write(file,'');await check('empty '+file,false,route);write(file);
  }
  const target='public/ai-city-traffic/main.mjs',name=path.join(temp,target);
  fs.unlinkSync(name);fs.mkdirSync(name);await check('required path is a directory',false,'/traffic/main.mjs');fs.rmdirSync(name);write(target);
  const outside=write('outside.mjs');fs.unlinkSync(name);fs.symlinkSync(outside,name);
  await check('required symlink escapes allowed root',false,'/traffic/main.mjs');fs.unlinkSync(name);write(target);
  fs.truncateSync(name,24*1024*1024+1);await check('required file exceeds serving size limit',false,'/traffic/main.mjs');write(target);
  fs.chmodSync(name,0o000);await check('required file is not readable by the server uid',false,'/traffic/main.mjs');fs.chmodSync(name,0o644);
  await check('recovered complete fixture',true,'/traffic/main.mjs');
  results.fixtureStderr=stderr;
 }finally{
  if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill('SIGKILL');resolve();},3000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
  fs.rmSync(temp,{recursive:true,force:true});
 }
 results.sourceStable=sha(fs.readFileSync(path.join(ROOT,results.source)))===results.sourceSha256;
 results.allExpectedOutcomes=results.cases.every(x=>x.pass)&&results.completeBuildAssets.every(x=>x.status===200)&&results.sourceStable;
 fs.writeFileSync(path.join(__dirname,`server-${label}.cjs`),source);
 fs.writeFileSync(path.join(__dirname,`server-${label}-results.json`),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({sourceSha256:results.sourceSha256,cases:results.cases.length,allExpectedOutcomes:results.allExpectedOutcomes,failedCases:results.cases.filter(x=>!x.pass)},null,2));
 if(!results.allExpectedOutcomes)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
