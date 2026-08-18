'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {CivilizationRuntime}=require('../dist/games/ai-civilization/src/runtime/run.js');
const {createCivilizationRenderSnapshot}=require('../dist/games/ai-civilization/src/presentation/snapshot.js');
const root=path.resolve(__dirname,'..');
const publicRoot=path.join(root,'public','ai-civilization');
const staticFiles={
  '/':{file:'index.html',type:'text/html; charset=utf-8'},
  '/ai-civilization/':{file:'index.html',type:'text/html; charset=utf-8'},
  '/ai-civilization/index.html':{file:'index.html',type:'text/html; charset=utf-8'},
  '/ai-civilization/styles.css':{file:'styles.css',type:'text/css; charset=utf-8'},
  '/ai-civilization/app.js':{file:'app.js',type:'text/javascript; charset=utf-8'}
};
function safeJson(res,status,value){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(JSON.stringify(value))}
function publicEvents(runtime){return createCivilizationRenderSnapshot(runtime.state,runtime.peekEvents()).events}
function publicSnapshot(runtime){return createCivilizationRenderSnapshot(runtime.state,runtime.peekEvents())}
function createCivilizationStreamServer(options={}){
  const runtime=options.runtime??CivilizationRuntime.create({maxRunDays:2400},options.seed??'broadcast-demo');
  const clients=new Set();let interval=null;
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url??'/', 'http://local.invalid');
    if(req.method!=='GET'){safeJson(res,405,{error:'method-not-allowed'});return}
    if(url.pathname==='/civilization/health'){
      safeJson(res,200,{gameId:'ai-civilization',status:'healthy',tick:runtime.state.tick,lifecycle:runtime.state.lifecycle,streamClients:clients.size,authority:'host',provider:'not-required'});return;
    }
    if(url.pathname==='/civilization/state'){safeJson(res,200,publicSnapshot(runtime));return}
    if(url.pathname==='/civilization/events'){safeJson(res,200,publicEvents(runtime));return}
    if(url.pathname==='/civilization/stream'){
      if(clients.size>=32){safeJson(res,503,{error:'stream-capacity'});return}
      res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-store','connection':'keep-alive','x-accel-buffering':'no','x-content-type-options':'nosniff'});
      res.write(`event: snapshot\ndata: ${JSON.stringify(publicSnapshot(runtime))}\n\n`);clients.add(res);
      req.on('close',()=>clients.delete(res));return;
    }
    const asset=staticFiles[url.pathname];
    if(asset){
      const file=path.join(publicRoot,asset.file);
      try{const body=fs.readFileSync(file);res.writeHead(200,{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(body)}catch{safeJson(res,500,{error:'asset-unavailable'})}
      return;
    }
    safeJson(res,404,{error:'not-found'});
  });
  function broadcast(){const payload=`event: snapshot\ndata: ${JSON.stringify(publicSnapshot(runtime))}\n\n`;for(const client of clients){try{client.write(payload)}catch{clients.delete(client)}}}
  function start(port=4175,host='127.0.0.1'){
    return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);const tickMs=options.tickMs??250;if(tickMs>0)interval=setInterval(()=>{try{runtime.step();broadcast()}catch{for(const client of clients){try{client.write('event: status\ndata: {"status":"degraded"}\n\n')}catch{}}}},tickMs);resolve(server.address())})})
  }
  function stop(){if(interval)clearInterval(interval);interval=null;for(const client of clients){try{client.end()}catch{}}clients.clear();return new Promise(resolve=>server.close(()=>resolve()))}
  return{server,runtime,start,stop,clients};
}
function request(base,pathName,{stream=false}={}){return new Promise((resolve,reject)=>{const req=http.get(`${base}${pathName}`,res=>{let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk;if(stream){resolve({status:res.statusCode,body});req.destroy()}});res.on('end',()=>resolve({status:res.statusCode,body}))});req.on('error',error=>{if(stream&&error.code==='ECONNRESET')return;reject(error)});req.setTimeout(4000,()=>req.destroy(new Error('request-timeout')))});}
async function selfTest(){
  const host=createCivilizationStreamServer({seed:'stream-self-test',tickMs:0});await host.start(0);
  const address=host.server.address();const base=`http://127.0.0.1:${address.port}`;
  try{
    const [health,state,events,stream,index]=await Promise.all([request(base,'/civilization/health'),request(base,'/civilization/state'),request(base,'/civilization/events'),request(base,'/civilization/stream',{stream:true}),request(base,'/')]);
    const snapshot=JSON.parse(state.body),serialized=state.body;
    const privacySafe=!['rawText','privateId','stack','prompt','chain-of-thought'].some(token=>serialized.includes(token));
    return{pass:[health,state,events,stream,index].every(r=>r.status===200)&&snapshot.schema==='civilization-render-v1'&&privacySafe,routes:{health:health.status,state:state.status,events:events.status,stream:stream.status,index:index.status},privacySafe,schema:snapshot.schema};
  }finally{await host.stop()}
}
if(require.main===module){
  const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,raw='true']=value.replace(/^--/,'').split('=');return[key,raw]}));
  if(args['self-test']==='true')selfTest().then(report=>{process.stdout.write(`${JSON.stringify(report)}\n`);process.exitCode=report.pass?0:1}).catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1});
  else{const port=Number(args.port??4175);if(!Number.isInteger(port)||port<0||port>65535)throw new RangeError('port');const host=createCivilizationStreamServer({seed:args.seed??'broadcast-live'});host.start(port,'0.0.0.0').then(()=>process.stdout.write(`AI Civilization stream source listening on ${port}\n`));const shutdown=()=>host.stop().then(()=>process.exit(0));process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown)}
}
module.exports={createCivilizationStreamServer,selfTest};
