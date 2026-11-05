'use strict';
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {createHash} = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public', 'ai-city-traffic');
const RUNTIME = path.join(ROOT, 'dist', 'city-traffic-browser');
const THREE = path.join(ROOT, 'node_modules', 'three');
const MIME = Object.freeze({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg',
 '.webp':'image/webp','.svg':'image/svg+xml','.webm':'video/webm'});
const REQUIRED_ROUTES=Object.freeze(['/traffic/','/traffic/styles.css','/traffic/main.mjs',
 '/traffic/world.mjs','/traffic/world-assets.mjs','/traffic/audio.mjs',
 '/traffic/runtime/simulation.js','/traffic/runtime/traffic-network.js',
 '/traffic/vendor/three.module.js','/traffic/vendor/three.core.js','/traffic/vendor/addons/controls/OrbitControls.js']);

function send(res, status, body, headers={}) {
 const buffer=Buffer.from(body);
 res.writeHead(status,{'content-type':'text/plain; charset=utf-8','content-length':buffer.length,
  'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',...headers});
 res.end(buffer);
}

function resolveAsset(pathname) {
 let root,relative;
 if(pathname.startsWith('/traffic/vendor/addons/')) {
  root=path.join(THREE,'examples','jsm');relative=pathname.slice('/traffic/vendor/addons/'.length);
 } else if(pathname.startsWith('/traffic/vendor/')) {
  root=path.join(THREE,'build');relative=pathname.slice('/traffic/vendor/'.length);
  if(!['three.module.js','three.core.js'].includes(relative))return null;
 } else if(pathname.startsWith('/traffic/runtime/')) {
  root=RUNTIME;relative=pathname.slice('/traffic/runtime/'.length);
 } else if(pathname.startsWith('/traffic/')) {
  root=PUBLIC;relative=pathname.slice('/traffic/'.length);
  if(!relative||relative.endsWith('/'))relative+='index.html';
 } else return null;
 if(relative.split('/').some(part=>!part||part.startsWith('.')||part.includes('\\')))return null;
 const filename=path.resolve(root,relative);
 if(!filename.startsWith(root+path.sep)||!MIME[path.extname(filename)])return null;
 return {filename,root};
}

function fileResponse(req,res,asset) {
 try {
  const real=fs.realpathSync(asset.filename),root=fs.realpathSync(asset.root);
  if(!real.startsWith(root+path.sep))return send(res,403,'Forbidden');
  const stat=fs.statSync(real);
  if(!stat.isFile()||stat.size>24*1024*1024)return send(res,404,'Not found');
  const body=fs.readFileSync(real),extension=path.extname(real);
  const hashes=extension==='.html'?[...body.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
   .filter(match=>match[1].trim()).map(match=>`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`):[];
  res.writeHead(200,{'content-type':MIME[extension],'content-length':body.length,
   'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
   'content-security-policy':`default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`});
  res.end(req.method==='HEAD'?undefined:body);
 } catch(error) {
  if(['ENOENT','ENOTDIR'].includes(error.code))return send(res,404,'Not found');
  console.error('[city-traffic] Asset unavailable', {code:error.code});
  send(res,500,'Asset unavailable');
 }
}

function buildAvailable(){
 return REQUIRED_ROUTES.every(route=>{
  const asset=resolveAsset(route);
  try{
   const root=fs.realpathSync(asset.root),file=fs.realpathSync(asset.filename),stat=fs.statSync(file);
   return file.startsWith(root+path.sep)&&stat.isFile()&&stat.size>0&&stat.size<=24*1024*1024;
  }catch{return false;}
 });
}

function createTrafficServer() {
 return http.createServer({requestTimeout:15000,headersTimeout:10000},(req,res)=>{
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'Method not allowed',{'allow':'GET, HEAD'});
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url||'/','http://local.invalid').pathname);}
  catch {return send(res,400,'Malformed path');}
  if(pathname.includes('\0')||pathname.includes('\\'))return send(res,400,'Malformed path');
  if(pathname==='/'||pathname==='/traffic'||pathname==='/traffic/progress') {
   res.writeHead(302,{location:pathname==='/traffic/progress'?'/traffic/progress/':'/traffic/','cache-control':'no-store'});res.end();return;
  }
  if(pathname==='/traffic/health')return send(res,200,JSON.stringify({game:'ai-city-traffic',status:'development',
   buildReady:buildAvailable(),
   productionReady:false}),{'content-type':'application/json; charset=utf-8'});
  if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const asset=resolveAsset(pathname);
  if(!asset)return send(res,404,'Not found');
  fileResponse(req,res,asset);
 });
}

if(require.main===module) {
 const argument=process.argv.find(value=>value.startsWith('--port='));
 const port=Number(argument?.slice(7)||process.env.TRAFFIC_PORT||4311);
 if(!Number.isInteger(port)||port<1||port>65535)throw new RangeError('Traffic port must be an integer from 1 to 65535');
 const server=createTrafficServer();
 server.on('error',error=>{console.error('[city-traffic] Server could not start',error.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`City / Flow: http://127.0.0.1:${port}/traffic/\nProgress: http://127.0.0.1:${port}/traffic/progress/`));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.closeAllConnections();server.close(()=>process.exit(0));});
}
module.exports={createTrafficServer};
