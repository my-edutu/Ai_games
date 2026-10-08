'use strict';
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const ROOT=path.resolve(__dirname,'..');
const PUBLIC=path.join(ROOT,'public','ai-dungeon');
const {DungeonRuntime}=require('../dist/games/ai-dungeon/src/index.js');
const DEFAULT_SEED=process.env.DUNGEON_SEED||'endless-adventure-season-one';
function createHost(seed=DEFAULT_SEED){
 const game=DungeonRuntime.create(seed);
 let fault=null,lastStep=Date.now(),steps=0;
 const tick=()=>{try{game.step();steps++;lastStep=Date.now();fault=null}catch(e){fault=String(e);console.error('[DUNGEON] simulation stopped:',fault)}};
 return{game,tick,status:()=>({status:fault?'quarantined':'healthy',reason:fault,steps,lastStepAgeMs:Date.now()-lastStep}),get fault(){return fault}};
}
function json(res,value,code=200){const body=JSON.stringify(value);res.writeHead(code,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(body)}
function file(res,filepath,contentType){if(!fs.existsSync(filepath)){res.writeHead(404);res.end('Not found');return}const body=fs.readFileSync(filepath);res.writeHead(200,{'content-type':contentType,'content-length':body.length,'cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors *",'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(body)}
function serve(port=Number(process.env.PORT||4181)){
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
 const host=createHost();const interval=setInterval(()=>{if(!host.fault)host.tick()},350);
 const paths=new Map([['/dungeon','index.html'],['/dungeon/','index.html'],['/dungeon/index.html','index.html'],['/dungeon/app.js','app.js'],['/dungeon/styles.css','styles.css'],['/dungeon/gauntlet','gauntlet.html'],['/dungeon/gauntlet.html','gauntlet.html'],['/dungeon/gauntlet.js','gauntlet.js']]);
 const server=http.createServer((req,res)=>{try{
  const url=new URL(req.url||'/','http://localhost');
  if(req.method!=='GET'){res.writeHead(405);res.end('Method not allowed');return}
  if(url.pathname==='/dungeon/state')return json(res,host.game.publicState(),host.fault?503:200);
  if(url.pathname==='/dungeon/health')return json(res,host.status(),host.fault?503:200);
  if(url.pathname==='/dungeon/gauntlet/state'){const s=host.game.publicState(),status=host.status();return json(res,{status,game:{floor:s.floor,run:s.run,tick:s.tick,kills:s.kills,gold:s.gold,phase:s.phase,checksum:s.checksum},evidence:'/dungeon/gauntlet-latest.json'})}
  if(url.pathname==='/dungeon/gauntlet-latest.json')return file(res,path.join(PUBLIC,'gauntlet-latest.json'),'application/json; charset=utf-8');
  if(url.pathname==='/dungeon/gauntlet-history.json')return file(res,path.join(PUBLIC,'gauntlet-history.json'),'application/json; charset=utf-8');
  if(url.pathname==='/dungeon/evidence/desktop.png')return file(res,path.join(ROOT,'artifacts/dungeon-desktop.png'),'image/png');
  if(url.pathname==='/dungeon/evidence/mobile.png')return file(res,path.join(ROOT,'artifacts/dungeon-mobile.png'),'image/png');
  if(url.pathname==='/dungeon/vendor/three.module.js')return file(res,path.join(ROOT,'node_modules/three/build/three.module.js'),'text/javascript; charset=utf-8');
  if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return}
  const name=paths.get(url.pathname);if(!name){res.writeHead(404);res.end('Not found');return}
  const ext=path.extname(name),mime=ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':'text/html; charset=utf-8';
  return file(res,path.join(PUBLIC,name),mime);
 }catch(e){console.error('[DUNGEON] request error',String(e));json(res,{error:'internal-error'},500)}});
 server.listen(port,'0.0.0.0',()=>console.log('AI Dungeon 3D stream at http://127.0.0.1:'+port+'/dungeon'));
 const stop=()=>{clearInterval(interval);server.close()};process.on('SIGINT',stop);process.on('SIGTERM',stop);return server;
}
if(require.main===module){const arg=process.argv.find(v=>v.startsWith('--port='));serve(arg?Number(arg.split('=')[1]):undefined)}
module.exports={createHost,serve};
