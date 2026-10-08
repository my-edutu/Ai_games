'use strict';
/**
 * Offline guardrails for independent CI security criticism of the 3D renderer.
 * This is NOT an aesthetic comparison with Jusant or a substitute for real footage.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=[
  'public/infinite-tower-climb/scene3d.js',
  'public/infinite-tower-climb/character3d.js',
  'public/infinite-tower-climb/environment3d.js'
];
const source=scripts.map(read);
const publicApp=read('public/infinite-tower-climb/app.js');
const host=read('scripts/serve-tower-stream.cjs');
const sim=read('games/infinite-tower-climb/src/presentation/snapshot.ts');
const pack=JSON.parse(read('package.json'));
const ledger=JSON.parse(read('public/infinite-tower-climb/gauntlet.json'));
assert.equal(pack.dependencies.three,'0.186.0','3D engine must remain pinned');
assert.equal(new Set(scripts).size,scripts.length);
for(let i=0;i<source.length;i++){
  const s=source[i];
  assert(!/https?:\/\//.test(s),scripts[i]+' must use no third-party CDN');
  assert(!/\beval\s*\(|new Function\s*\(|\binnerHTML\s*=|document\.write/.test(s),scripts[i]+' must avoid dynamic code/markup');
  const imports=[...s.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m=>m[1]);
  for(const url of imports){
    assert(url.startsWith('/tower/'),scripts[i]+' must import same-origin modules');
    assert(host.includes(url),scripts[i]+' import '+url+' missing host route');
  }
}
assert(publicApp.includes("params.get('renderer')!=='2d'"),'2D explicit fallback missing');
assert(publicApp.includes("body.dataset.towerRenderer='2d-fallback'"),'2D automatic fallback missing');
assert(publicApp.includes('(v-s.chunkBaseY)/1000'),'2D floor coordinates must be relative');
assert(sim.includes('deepFreeze(snapshot)'),'Immutable authority snapshot required');
assert(source[0].includes('getFrame()'),'3D must consume read-only public snapshots');
assert(!source.join('\n').includes('runtime.step('),'Renderer cannot advance game authority');
assert(ledger.round>=1,'Gauntlet ledger must identify active round');
assert(!/quality bar met|production complete|AAA achieved/i.test(ledger.status),'Unreviewed visual quality must not be claimed');
const result={ok:true,modules:scripts,renderAuthority:'snapshot-only',localModules:true,immutableSnapshot:true,threeVersion:pack.dependencies.three,gauntletRound:ledger.round};
process.stdout.write(JSON.stringify(result)+'\n');
