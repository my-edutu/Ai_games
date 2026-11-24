'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
async function production(){
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-tideglass-court-'));
  try{
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const game=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    return {game,cleanup:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  }catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e}
}
const approach=()=>({cell:3,neighbors:[4],blocked:false,trap:false,checkpoint:false,clue:false});
const hazard=()=>({cell:4,neighbors:[3],blocked:false,trap:true,checkpoint:false,clue:false});
const publicState=(a=approach(),b=hazard(),doors=[])=>({
  runToken:'open-pressure-court',tick:1,width:3,height:3,currentCell:3,
  cells:[a,b],visibleCells:[3,4],doors,keys:[],inventory:[],threats:[],
  exitCell:null,result:null
});
test('real public Tideglass court never visually promises a closed, false, private or elevated passage',async()=>{
  const {game,cleanup}=await production();
  try{
    const s=publicState(),before=JSON.stringify(s);
    assert.equal(game.publicPressureCourtLink(s.cells[0],s.cells[1],s),true);
    assert.equal(JSON.stringify(s),before,'the public view cannot be mutated');
    const broken=publicState({...approach(),neighbors:[]});
    assert.equal(game.publicPressureCourtLink(broken.cells[0],broken.cells[1],broken),false);
    const reverse=publicState(approach(),{...hazard(),neighbors:[]});
    assert.equal(game.publicPressureCourtLink(reverse.cells[0],reverse.cells[1],reverse),false);
    const sealed=publicState(approach(),hazard(),[{a:3,b:4,open:false}]);
    assert.equal(game.publicPressureCourtLink(sealed.cells[0],sealed.cells[1],sealed),false);
    const open=publicState(approach(),hazard(),[{a:4,b:3,open:true}]);
    assert.equal(game.publicPressureCourtLink(open.cells[0],open.cells[1],open),true);
    const unknown=publicState();unknown.cells=[approach()];
    assert.equal(game.publicPressureCourtLink(unknown.cells[0],hazard(),unknown),false);
    const blocked=publicState({...approach(),blocked:true});
    assert.equal(game.publicPressureCourtLink(blocked.cells[0],blocked.cells[1],blocked),false);
    const fake=publicState(approach(),{...hazard(),trap:false});
    assert.equal(game.publicPressureCourtLink(fake.cells[0],fake.cells[1],fake),false);
    const diagonal=publicState({...approach(),cell:0,neighbors:[4]},
      {...hazard(),neighbors:[0]});
    assert.equal(game.publicPressureCourtLink(diagonal.cells[0],diagonal.cells[1],diagonal),false);
    const stair=publicState({...approach(),cell:1,neighbors:[4]},
      {...hazard(),neighbors:[1]});
    assert.equal(game.publicPressureCourtLink(stair.cells[0],stair.cells[1],stair),false);
    const world=game.createMazeWorld({balanced:true});
    try{
      world.update(s);
      const initial=world.stats();
      assert.equal(initial.responsiveTrapSignals,1);
      assert.ok(initial.geometryCount<100,'the unchanged strict resource budget applies');
      world.update(sealed);world.update(s);
      assert.equal(world.stats().geometryCount,initial.geometryCount,
        'a public gate transition must reuse all geometry classes');
      assert.ok(world.stats().geometryCount<100);
    }finally{world.dispose()}
  }finally{cleanup()}
});
