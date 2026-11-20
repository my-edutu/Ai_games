'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('const ECONOMIC_COURT_PROFILES=');
const end=source.indexOf('function market(x,z)',start);
function construct(){
 assert.ok(start>0&&end>start,'real civic court renderer required');
 const data=[],quads=[];
 const factory=new Function('data','MATERIAL','materialScope','rgb',
  'biomeHash','terrain','upwardRoadQuad',
  source.slice(start,end)+'return {renderEconomicCourtyardPaving,getEconomicCourtyardAudit};');
 const terrain=(x,z)=>.018*x-.012*z;
 const api=factory(data,{STONE:1},(_,fn)=>fn(),v=>v,
  n=>{const a=Math.sin(n*12.9898)*43758.5453;return a-Math.floor(a);},
  terrain,(a,b,c,d,color)=>{
   quads.push({corners:[a,b,c,d],color});
   for(let i=0;i<60;i++)data.push(0);
  });
 return {...api,data,quads,terrain};
}
test('W484 original market and granary are BOTH built in the retained civic scene',()=>{
 assert.match(source,/renderEconomicCourtyardPaving\('market'\)/);
 assert.match(source,/granaryArchitecture\(\);renderEconomicCourtyardPaving\('granary'\)/);
 assert.match(source,/window\.__tinyKingdom=\{getEconomicCourtyardAudit,/);
 const s=construct(),m=s.renderEconomicCourtyardPaving('market'),
  g=s.renderEconomicCourtyardPaving('granary'),a=s.getEconomicCourtyardAudit();
 assert.ok(m.tiles>100&&g.tiles>25);
 assert.equal(m.triangles,2*m.tiles);assert.equal(g.triangles,2*g.tiles);
 assert.ok(m.triangles<1200&&g.triangles<1200);
 assert.equal(s.quads.length,m.tiles+g.tiles);
 assert.equal(a.extraGpuBuffers,0);assert.equal(a.changedAuthority,false);
 assert.equal(a.changedNavigation,false);assert.equal(a.changedInventory,false);
 assert.equal(a.last.market.sameOriginalSite,true);
 assert.equal(a.last.granary.sameOriginalSite,true);
});
test('W484 full material grade + 2.4m genuine courier aisle with deterministic look',()=>{
 const s=construct(),m=s.renderEconomicCourtyardPaving('market');
 for(const {corners} of s.quads){
  for(const pt of corners){
   assert.ok(pt.every(Number.isFinite));
   assert.ok(Math.abs(pt[1]-s.terrain(pt[0],pt[2])-.085)<.007);
  }
 }
 for(const {corners} of s.quads.slice(0,m.tiles)){
  const xs=corners.map(p=>p[0]);
  assert.ok(Math.max(...xs)<=-1.2||Math.min(...xs)>=1.2,
   'real loaded grain courier road MUST stay unpaved');
 }
 const other=construct();other.renderEconomicCourtyardPaving('market');
 assert.deepEqual(s.quads.map(q=>q.corners),other.quads.map(q=>q.corners));
 assert.throws(()=>s.renderEconomicCourtyardPaving('fabricated'),/real civic site/);
});
test('W484 source parses without altering autonomous food and save pipeline',()=>{
 for(const script of source.match(/<script>([\s\S]*?)<\/script>/g)||[])
  new Function(script.replace(/^<script>|<\/script>$/g,''));
 for(const name of ['farmMarketStreet','inhabitedHighStreet',
  'renderVerifiedHomeMeal','advanceRealGrainJourney','exportSnapshot','restoreSnapshot'])
  assert.ok(source.includes('function '+name+'('),name);
});
