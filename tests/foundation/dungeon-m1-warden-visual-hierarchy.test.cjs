'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const THREE=require('three');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'warden-court-priority-plan.js'),'utf8')).toString('base64'));
function actualWardenWarning(){
 const game=DungeonRuntime.create('gauntlet-corpus-v1-0');
 for(let i=0;i<500;i++){
  const snapshot=game.step();if(snapshot.bossWarning?.cells?.length&&snapshot.units.some(u=>u.kind==='warden'&&u.hp>0))return snapshot;
 }
 throw Error('Natural seeded Warden warning unavailable');
}
test('genuine Warden danger takes visual precedence over ceremonial court without hiding one authority cell',async()=>{
 const {planWardenCourtPriority}=await load(),s=actualWardenWarning(),before=JSON.stringify(s);
 const plan=planWardenCourtPriority(s);
 assert.equal(plan.mode,'warning');
 assert.ok(plan.courtRingOpacity<=.15,'huge decorative cyan rings no longer compete with real hazard');
 assert.ok(plan.ritualGlyphOpacity<=.35,'decorative runes subordinate to true marked floor');
 assert.ok(plan.ritualConduitOpacity<=.30);
 assert.equal(plan.threatCells,s.bossWarning.cells.length);
 assert.ok(s.bossWarning.cells.length>=20&&s.bossWarning.cells.length<=48,'genuine multi-cell warning is not suppressed or replaced');
 assert.equal(JSON.stringify(s),before,'presentation never alters simulation');
});
test('scene hierarchy restores for ward, strike, earned recovery, death and stale warnings',async()=>{
 const {planWardenCourtPriority:plan}=await load(),s=actualWardenWarning();
 const normal={...s,bossWarning:null};
 assert.equal(plan(normal).mode,s.guardianWard?'sealed':'approach');
 const release={...normal,units:s.units.map(u=>u.kind==='warden'?{...u,action:'cast',actionTick:s.tick}:u)};
 assert.equal(plan(release).mode,'release');
 const recovered={...normal,guardianWard:false,bossRecovery:{remaining:2}};
 assert.equal(plan(recovered).mode,'counter');
 assert.ok(plan(recovered).courtRingOpacity < plan(normal).courtRingOpacity);
 assert.equal(plan({...s,tick:s.bossWarning.attackTick+1}).mode,normal.guardianWard?'sealed':'approach','stale hazard must not hide ceremony');
 const defeated={...s,units:s.units.map(u=>u.kind==='warden'?{...u,hp:0}:u)};
 assert.equal(plan(defeated).mode,'vanquished');
 assert.equal(plan({...s,bossWarning:{...s.bossWarning,cells:[{x:NaN,z:0}]}}).mode,normal.guardianWard?'sealed':'approach');
 assert.equal(plan(null).mode,'inactive');
});
test('source read-only priority integrates with both real scene layers and records actual visual alpha',async()=>{
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const ritual=fs.readFileSync(path.join(root,'warden-ritual.js'),'utf8');
 const server=fs.readFileSync(path.resolve(__dirname,'../../scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(source,/planWardenCourtPriority\(s\)/);
 assert.match(source,/courtGlow\.opacity\s*=/);
 assert.match(ritual,/function setDecorativePriority\(/);
 assert.match(source,/setDecorativePriority\(courtPriority\)/);
 assert.match(ritual,/ritualGlyphOpacity/);
 assert.ok(server.includes('warden-court-priority-plan.js'));
});

test('actual original THREE Warden cathedral subordinates decorations while retaining 3D hazard stones',async()=>{
 const code=name=>fs.readFileSync(path.join(root,name),'utf8');
 const uri=src=>'data:text/javascript;base64,'+Buffer.from(src).toString('base64');
 let ritualSource=code('warden-ritual.js');
 ritualSource=ritualSource.replace("'/dungeon/vendor/three.module.js'",JSON.stringify(pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href));
 for(const name of ['warden-chapter-plan','warden-tell-plan'])
  ritualSource=ritualSource.replace(`'/dungeon/${name}.js'`,JSON.stringify(uri(code(`${name}.js`))));
 const {createWardenRitual}=await import(uri(ritualSource));
 const scene=new THREE.Group(),snapshot=actualWardenWarning();
 const ritual=createWardenRitual(scene,snapshot.exit,{map:snapshot.map,reducedMotion:true});
 ritual.setDecorativePriority((await load()).planWardenCourtPriority(snapshot));
 ritual.accept(snapshot);ritual.animate(.08,.016);
 const observed=ritual.metrics();
 assert.equal(observed.warningTiles,snapshot.bossWarning.cells.length);
 assert.equal(observed.decorativePriority.mode,'warning');
 assert.ok(observed.decorativePriority.glyphOpacity<=.35);
 assert.ok(observed.decorativePriority.conduitOpacity<=.30);
 assert.equal(observed.warningBoundaryEdges>0,true,'real authority warning physical perimeter still exists');
 assert.equal(observed.warningIncisions>0,true,'original warning incisions remain');
 ritual.setDecorativePriority((await load()).planWardenCourtPriority({...snapshot,bossWarning:null}));
 ritual.accept({...snapshot,bossWarning:null});ritual.animate(.2,.05);
 assert.notEqual(ritual.metrics().decorativePriority.mode,'warning');
 assert.ok(ritual.metrics().decorativePriority.glyphOpacity>.35,'ornamental scene comes back after true threat ends');
 ritual.dispose();assert.equal(scene.children.length,0);
});

test('the real Warden warning engraves every dangerous tile at spectator scale without adding a draw family',async()=>{
 const code=name=>fs.readFileSync(path.join(root,name),'utf8');
 const uri=src=>'data:text/javascript;base64,'+Buffer.from(src).toString('base64');
 let ritualSource=code('warden-ritual.js');
 ritualSource=ritualSource.replace("'/dungeon/vendor/three.module.js'",JSON.stringify(pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href));
 for(const name of ['warden-chapter-plan','warden-tell-plan'])
  ritualSource=ritualSource.replace(`'/dungeon/${name}.js'`,JSON.stringify(uri(code(`${name}.js`))));
 const {createWardenRitual}=await import(uri(ritualSource));
 const scene=new THREE.Group(),snapshot=actualWardenWarning(),before=JSON.stringify(snapshot);
 const ritual=createWardenRitual(scene,snapshot.exit,{map:snapshot.map,reducedMotion:true});
 ritual.setDecorativePriority((await load()).planWardenCourtPriority(snapshot));
 ritual.accept(snapshot);ritual.animate(.07,.016);
 const stages=[];scene.traverse(node=>{if(node.name==='Warden authoritative marked floor'||node.name==='Warden physically incised authority warning stone'||node.name==='Authoritative Warden strike perimeter in stone')stages.push(node)});
 assert.equal(stages.length,3,'retain exactly the three original draw families');
 const floor=stages.find(node=>node.name==='Warden authoritative marked floor');
 const incisions=stages.find(node=>node.name==='Warden physically incised authority warning stone');
 assert.equal(floor.count,snapshot.bossWarning.cells.length,'all and only true hazard cells have a stone');
 assert.equal(incisions.count,floor.count,'all and only true hazard cells carry a carved, non-color-only fracture');
 const angles=new Set();const instance=new THREE.Matrix4(),rotation=new THREE.Quaternion();
 for(let i=0;i<incisions.count;i++){
  incisions.getMatrixAt(i,instance);instance.decompose(new THREE.Vector3(),rotation,new THREE.Vector3());
  angles.add(Math.round(Math.abs(rotation.y)*100));
 }
 assert.ok(angles.size>=3,'genuine NOVA tiles have physically radial crack directions, not colour alone');
 assert.ok(floor.material.opacity>=.48,'original danger floor must be visible during sparse mobile frames');
 assert.ok(incisions.material.opacity>=.80,'one readable low-profile crack per cell');
 assert.equal(JSON.stringify(snapshot),before,'the autonomous authority is unchanged');
 ritual.dispose();assert.equal(scene.children.length,0);
});
