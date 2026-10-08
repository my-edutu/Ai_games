'use strict';
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const ROOT=path.resolve(__dirname,'..');
const PUBLIC=path.join(ROOT,'public','ai-dungeon');
const {DungeonRuntime}=require('../dist/games/ai-dungeon/src/index.js');
const DEFAULT_SEED=process.env.DUNGEON_SEED||'endless-adventure-season-one';
function createHost(seed=DEFAULT_SEED,{stateFile=null}={}){
 // Reload the last checksum-verified authoritative snapshot, never a public client projection.
 // Snapshot corruption/version mismatch aborts startup rather than silently erasing a run.
 let game=DungeonRuntime.create(seed),restored=false,lastSavedAt=null,checkpointTick=null;
 if(stateFile&&fs.existsSync(stateFile)){
  const data=JSON.parse(fs.readFileSync(stateFile,'utf8'));
  if(data.seed!==seed)throw Error('Dungeon checkpoint seed mismatch: refusing implicit reset');
  game=DungeonRuntime.restore(data);restored=true;checkpointTick=game.state.tick;
 }
 let fault=null,lastStep=Date.now(),steps=0;
 const flush=()=>{
  if(!stateFile)return false;
  fs.mkdirSync(path.dirname(stateFile),{recursive:true});
  const temp=stateFile+'.tmp',payload=JSON.stringify(game.save())+'\n';
  fs.writeFileSync(temp,payload,{mode:0o600});fs.renameSync(temp,stateFile);
  lastSavedAt=Date.now();checkpointTick=game.state.tick;return true;
 };
 const tick=()=>{
  if(fault)return;
  try{game.step();steps++;lastStep=Date.now();if(steps%15===0)flush()}
  catch(e){fault=String(e);console.error('[DUNGEON] quarantined simulation:',fault)}
 };
 return{game,tick,flush,status:()=>({status:fault?'quarantined':'healthy',reason:fault,steps,lastStepAgeMs:Date.now()-lastStep,restored,checkpointTick,lastSavedAt}),get fault(){return fault}};
}
function json(res,value,code=200){const body=JSON.stringify(value);res.writeHead(code,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(body)}
function file(res,filepath,contentType){if(!fs.existsSync(filepath)){res.writeHead(404);res.end('Not found');return}const body=fs.readFileSync(filepath);res.writeHead(200,{'content-type':contentType,'content-length':body.length,'cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors *",'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(body)}
function serve(port=Number(process.env.PORT||4181)){
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
 const stateFile=process.env.DUNGEON_STATE_FILE||path.join(ROOT,'runtime','dungeon-checkpoint.json');
 const host=createHost(DEFAULT_SEED,{stateFile});const interval=setInterval(()=>{if(!host.fault)host.tick()},350);
 const paths=new Map([['/dungeon','index.html'],['/dungeon/','index.html'],['/dungeon/index.html','index.html'],['/dungeon/app.js','app.js'],['/dungeon/environment.js','environment.js'],['/dungeon/characters.js','characters.js'],['/dungeon/biome-atmosphere.js','biome-atmosphere.js'],['/dungeon/combat-overlay.js','combat-overlay.js'],['/dungeon/combat-director.js','combat-director.js'],['/dungeon/styles.css','styles.css'],['/dungeon/gauntlet','gauntlet.html'],['/dungeon/gauntlet.html','gauntlet.html'],['/dungeon/gauntlet.js','gauntlet.js']]);
 const server=http.createServer((req,res)=>{try{
  const url=new URL(req.url||'/','http://localhost');
  if(req.method!=='GET'){res.writeHead(405);res.end('Method not allowed');return}
  if(url.pathname==='/dungeon/state')return json(res,host.game.publicState(),host.fault?503:200);
  if(url.pathname==='/dungeon/health')return json(res,host.status(),host.fault?503:200);
  if(url.pathname==='/dungeon/gauntlet/state'){const s=host.game.publicState(),status=host.status();return json(res,{status,game:{floor:s.floor,run:s.run,tick:s.tick,kills:s.kills,gold:s.gold,phase:s.phase,bossPhase:s.bossPhase,heroesAlive:s.units.filter(u=>u.faction==='party'&&u.hp>0).length,hazardsActive:s.traps.filter(t=>t.active).length,checksum:s.checksum},evidence:'/dungeon/gauntlet-latest.json'})}
  if(url.pathname==='/dungeon/gauntlet-latest.json')return file(res,path.join(PUBLIC,'gauntlet-latest.json'),'application/json; charset=utf-8');
  if(url.pathname==='/dungeon/gauntlet-history.json')return file(res,path.join(PUBLIC,'gauntlet-history.json'),'application/json; charset=utf-8');
  if(url.pathname==='/dungeon/evidence/desktop.png')return file(res,path.join(ROOT,'artifacts/dungeon-desktop.png'),'image/png');
  if(url.pathname==='/dungeon/evidence/mobile.png')return file(res,path.join(ROOT,'artifacts/dungeon-mobile.png'),'image/png');
  if(url.pathname==='/dungeon/evidence/visual-metrics.json')return file(res,path.join(ROOT,'artifacts/dungeon-visual-metrics.json'),'application/json; charset=utf-8');
  if(url.pathname==='/dungeon/evidence/world-only.png')return file(res,path.join(ROOT,'artifacts/dungeon-3d-world-only.png'),'image/png');
  if(url.pathname.startsWith('/dungeon/assets/')){
   const suffix=url.pathname.slice('/dungeon/assets/'.length);
   if(!/^(player|enemy|environment)\/[\w-]+\.(glb|png)$/.test(suffix)){res.writeHead(404);res.end('Not found');return}
   return file(res,path.join(PUBLIC,'models',suffix),suffix.endsWith('.glb')?'model/gltf-binary':'image/png');
  }
  if(url.pathname.startsWith('/dungeon/vendor/addons/')){
   const suffix=url.pathname.slice('/dungeon/vendor/addons/'.length);
   if(!/^(loaders|utils|postprocessing|shaders)\/[\w-]+\.js$/.test(suffix)){res.writeHead(404);res.end('Not found');return}
   const addon=path.join(ROOT,'node_modules/three/examples/jsm',suffix);
   if(!fs.existsSync(addon)){res.writeHead(404);res.end('Not found');return}
   const source=fs.readFileSync(addon,'utf8').replace(/from ['"]three['"]/g,"from '/dungeon/vendor/three.module.js'");
   const body=Buffer.from(source);
   res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','content-length':body.length,'cache-control':'no-store','x-content-type-options':'nosniff'});
   res.end(body);return;
  }
  if(url.pathname==='/dungeon/vendor/three.module.js')return file(res,path.join(ROOT,'node_modules/three/build/three.module.js'),'text/javascript; charset=utf-8');
  if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return}
  const name=paths.get(url.pathname);if(!name){res.writeHead(404);res.end('Not found');return}
  const ext=path.extname(name),mime=ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':'text/html; charset=utf-8';
  return file(res,path.join(PUBLIC,name),mime);
 }catch(e){console.error('[DUNGEON] request error',String(e));json(res,{error:'internal-error'},500)}});
 server.listen(port,'0.0.0.0',()=>console.log('AI Dungeon 3D stream at http://127.0.0.1:'+port+'/dungeon'));
 const stop=()=>{clearInterval(interval);try{if(!host.fault)host.flush()}catch(e){console.error('[DUNGEON] final snapshot failed',String(e))}server.close()};
 process.once('SIGINT',stop);process.once('SIGTERM',stop);return server;
}
if(require.main===module){const arg=process.argv.find(v=>v.startsWith('--port='));serve(arg?Number(arg.split('=')[1]):undefined)}
module.exports={createHost,serve};
