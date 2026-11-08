'use strict';
// Offline transport for locally archived source. No navigation or external
// requests: genuine modules, models and DungeonRuntime, not a mock renderer.
const fs=require('node:fs');const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..'),PUB=path.join(ROOT,'public/ai-dungeon');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const ts=require('typescript');
function resolveModule(id,parent='/dungeon/app.js'){
 if(id==='three')return '/dungeon/vendor/three.module.js';
 if(id.startsWith('three/addons/'))return '/dungeon/vendor/addons/'+id.slice('three/addons/'.length);
 if(id.startsWith('/dungeon/'))return id;
 if(id.startsWith('.'))return path.posix.normalize(path.posix.join(path.posix.dirname(parent),id));
 throw Error('Unresolved module '+id+' from '+parent);
}
function modulePath(id){
 if(id.startsWith('/dungeon/vendor/addons/'))return path.join(ROOT,'node_modules/three/examples/jsm',id.slice('/dungeon/vendor/addons/'.length));
 if(id.startsWith('/dungeon/vendor/'))return path.join(ROOT,'node_modules/three/build',id.slice('/dungeon/vendor/'.length));
 if(!/^\/dungeon\/[\w-]+\.js$/.test(id))throw Error('Disallowed module '+id);
 return path.join(PUB,id.slice('/dungeon/'.length));
}
function collect(entry,modules={},overrides={}){
 if(modules[entry])return modules;
 const source=overrides[entry]??fs.readFileSync(modulePath(entry),'utf8');
 const mod=modules[entry]={source,imports:[]};
 const ast=ts.createSourceFile(entry,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 function visit(node){
  let spec;
  if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))spec=node.moduleSpecifier;
  else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword)spec=node.arguments[0];
  if(spec&&ts.isStringLiteral(spec)){
   const target=resolveModule(spec.text,entry);
   mod.imports.push({start:spec.getStart(ast)+1,end:spec.end-1,target});collect(target,modules,overrides);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);return modules;
}
async function openOfflineGame(page,{seed='dungeon-ui-round17',ticks=18,game:provided,live=false,size={width:390,height:844},sourceOverrides={}}={}){
 const game=provided||DungeonRuntime.create(seed);if(!provided)for(let i=0;i<ticks;i++)game.step();
 let snapshot=game.publicState(),offline=false;const receipts=[];
 await page.setViewportSize(size);
 await page.exposeFunction('__offlineSnapshot',()=>{if(offline)return {status:503};const s=JSON.parse(JSON.stringify(snapshot));receipts.push({run:s.run,tick:s.tick,checksum:s.checksum});return {status:200,state:s};});
 await page.exposeFunction('__offlineAsset',id=>{
  if(!/^\/dungeon\/assets\/(player|enemy|environment)\/[\w-]+\.(glb|png)$/.test(id))throw Error('Unexpected asset '+id);
  const p=path.join(PUB,'models',id.slice('/dungeon/assets/'.length));return fs.readFileSync(p).toString('base64');
 });
 const html=(sourceOverrides['/dungeon/index.html']??fs.readFileSync(path.join(PUB,'index.html'),'utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g,'');
 await page.setContent(html.replace('<head>','<head><base href="https://dungeon.offline.invalid/dungeon/">'));await page.addStyleTag({content:sourceOverrides['/dungeon/styles.css']??fs.readFileSync(path.join(PUB,'styles.css'),'utf8')});
 const modules=collect('/dungeon/app.js',{},sourceOverrides);
 await page.evaluate(async modules=>{
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,options)=>{
   const raw=typeof input==='string'?input:input.url;
   const url=raw.startsWith('https://dungeon.offline.invalid/')?new URL(raw).pathname:raw;
   if(url==='/dungeon/state'){
    const r=await window.__offlineSnapshot();return new Response(JSON.stringify(r.state||{}),{status:r.status,headers:{'content-type':'application/json'}});
   }
   if(url.startsWith('/dungeon/assets/')){
    const base64=await window.__offlineAsset(url);const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    return new Response(bytes,{status:200,headers:{'content-type':url.endsWith('.glb')?'model/gltf-binary':'image/png','content-length':String(bytes.length)}});
   }
   if(url.startsWith('blob:')||url.startsWith('data:'))return nativeFetch(input,options);
   throw Error('External fetch disabled in offline harness: '+url);
  };
  const urls={},visiting=new Set();
  function build(id){
   if(urls[id])return urls[id];if(visiting.has(id))throw Error('Module cycle '+id);visiting.add(id);
   const mod=modules[id];if(!mod)throw Error('Missing source '+id);
   let source=mod.source;
   for(const spec of [...mod.imports].sort((a,b)=>b.start-a.start))
    source=source.slice(0,spec.start)+build(spec.target)+source.slice(spec.end);
   urls[id]=URL.createObjectURL(new Blob([source+'\n//# sourceURL=offline:'+id],{type:'text/javascript'}));visiting.delete(id);return urls[id];
  }
  await import(build('/dungeon/app.js'));window.__OFFLINE_MODULE_URLS__=urls;
 },modules);
 // Watchdog is unchanged production source; the browser receives real frame
 // and authoritative tick signals from the application, not fake diagnostics.
 await page.addScriptTag({content:sourceOverrides['/dungeon/boot-watchdog.js']??fs.readFileSync(path.join(PUB,'boot-watchdog.js'),'utf8')});
 let timer;if(live)timer=setInterval(()=>snapshot=game.step(),350);
 return {game,receipts,get snapshot(){return snapshot},advance(n=1){for(let i=0;i<n;i++)snapshot=game.step();return snapshot},setOffline(v){offline=v},close(){clearInterval(timer)}};
}
module.exports={openOfflineGame,collect};
