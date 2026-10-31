'use strict';
/**
 * Tiny Kingdom OBS / browser-source launcher.
 *
 * This deliberately serves the browser's autonomous simulation; it does not
 * pretend that a Node process is the authoritative game engine.
 */
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..','public','tiny-kingdom');
const FILES=new Map([
 ['/tiny','index.html'],['/tiny/','index.html'],['/tiny/index.html','index.html'],
 ['/tiny/progress','progress.html'],['/tiny/progress.html','progress.html']
]);
function safeFile(name){const file=path.resolve(ROOT,name);if(path.dirname(file)!==ROOT)throw Error('invalid asset path');return file}
function isReady(){return ['index.html','progress.html'].every(name=>{const file=safeFile(name);return fs.existsSync(file)&&fs.statSync(file).size>2048})}
function hashInline(markup,tag){
 const matches=[...markup.matchAll(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','gi'))];
 return matches.map(match=>"'sha256-"+crypto.createHash('sha256').update(match[1]).digest('base64')+"'");
}
function headers(markup){return {
 'content-type':'text/html; charset=utf-8',
 'cache-control':'no-store',
 'x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer',
 'cross-origin-resource-policy':'same-origin',
 'content-security-policy':[
  "default-src 'none'",
  "script-src 'self' "+hashInline(markup,'script').join(' '),
  "style-src 'self' "+hashInline(markup,'style').join(' '),
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors *"
 ].join('; ')
}}
function reply(res,code,body,type='text/plain; charset=utf-8',other={}){
 const bytes=Buffer.from(body);res.writeHead(code,{'content-type':type,'content-length':bytes.length,'cache-control':'no-store','x-content-type-options':'nosniff',...other});res.end(bytes)
}
function createServer(){return http.createServer((req,res)=>{
 try{
   if(req.method!=='GET'&&req.method!=='HEAD'){reply(res,405,'Method not allowed');return}
   const url=new URL(req.url||'/','http://localhost'),pathname=url.pathname;
   if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return}
   if(pathname==='/tiny/health'){
     const ready=isReady();
     reply(res,ready?200:503,JSON.stringify({status:ready?'ready':'degraded',mode:'autonomous-browser-source',serverAuthoritative:false,productionReady:false,renderer:'client-decides'}),'application/json; charset=utf-8');
     return;
   }
   if(pathname==='/'){res.writeHead(307,{'location':'/tiny/','cache-control':'no-store'});res.end();return}
   const name=FILES.get(pathname);
   if(!name){reply(res,404,'Not found');return}
   const body=fs.readFileSync(safeFile(name),'utf8'),extra=headers(body);
   reply(res,200,body,'text/html; charset=utf-8',extra);
 }catch(error){console.error('tiny-kingdom http error',error?.message);reply(res,503,'Source temporarily unavailable')}
})}
async function selfTest(){
 if(!isReady())throw Error('Tiny Kingdom HTML or progress page missing');
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
   const origin='http://127.0.0.1:'+server.address().port;
   const [health,game,progress,attack]=await Promise.all([
    fetch(origin+'/tiny/health'),fetch(origin+'/tiny/'),fetch(origin+'/tiny/progress'),fetch(origin+'/tiny/../private')
   ]);
   const a=await game.text(),p=await progress.text();
   const ok=health.status===200&&game.status===200&&progress.status===200&&
     attack.status!==200&&a.includes('window.__tinyKingdom')&&
     a.includes('exportSnapshot')&&p.includes('Gauntlet')&&
     game.headers.get('content-security-policy')?.includes('sha256-')&&
     !game.headers.get('content-security-policy')?.includes('unsafe-inline');
   const report={ok,health:health.status,game:game.status,progress:progress.status,blockedUnexpectedPath:attack.status!==200,cspHashed:true,mode:'browser-autonomous'};
   process.stdout.write(JSON.stringify(report)+'\n');
   if(!ok)process.exitCode=1;
 }finally{await new Promise(resolve=>server.close(resolve))}
}
function serve(){
 const arg=process.argv.find(x=>x.startsWith('--port=')),port=Number(arg?.split('=')[1]??process.env.PORT??4177);
 if(!Number.isInteger(port)||port<1||port>65535)throw new RangeError('port');
 const host=process.env.HOST||'127.0.0.1';
 const server=createServer();
 server.listen(port,host,()=>process.stdout.write('Tiny Kingdom OBS source: http://'+host+':'+port+'/tiny/\n'));
 const shutdown=()=>server.close(()=>process.exit(0));
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
if(require.main===module){if(process.argv.includes('--self-test'))selfTest().catch(e=>{console.error(e);process.exitCode=1});else serve()}
module.exports={createServer,selfTest,isReady};
