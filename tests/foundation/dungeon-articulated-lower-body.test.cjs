'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../../public/ai-dungeon');
const load=async filename=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(dir,filename),'utf8')).toString('base64'));
test('native pelvis selector never guesses a thigh',async()=>{
 const {selectPelvisBone}=await load('rig-attachment-plan.js');
 assert.equal(selectPelvisBone([{name:'LeftUpLeg',isBone:true},{name:'mixamorig:Hips',isBone:true}]).name,'mixamorig:Hips');
 assert.equal(selectPelvisBone([{name:'LeftHip',isBone:true}]),null);
 assert.equal(selectPelvisBone(null),null);
});
test('all six roles mount thigh and waist art to genuine imported leg joints',async()=>{
 const {planAnatomicalKit,planAnatomicalDrawGroups}=await load('anatomical-kit-plan.js');
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const kit=planAnatomicalKit(kind),groups=planAnatomicalDrawGroups(kind);
  assert.equal(kit.filter(x=>x.mount==='hips').length,2);
  assert.equal(kit.filter(x=>x.mount==='leftUpperLeg'||x.mount==='rightUpperLeg').length,2);
  assert.equal(groups.jointPieces.filter(x=>['hips','leftUpperLeg','rightUpperLeg'].includes(x.mount)).length,4);
 }
 const renderer=fs.readFileSync(path.join(dir,'model-assets.js'),'utf8');
 assert.match(renderer,/actor\.rigPelvisBone=selectPelvisBone\(bones\)/);
 assert.match(renderer,/hips:actor\.rigPelvisBone/);
 assert.match(renderer,/if\(joint\?\.isBone\)\{mounts\.push\(\{mesh,bone:joint\}\);attached\+\+;\}/,
  'genuine native hip/leg skeletal joints must still own their forged armour');
 assert.match(renderer,/bindBoneInverse:bone\.matrixWorld\.clone\(\)\.invert\(\)/,
  'skinned attachment must retain the real joint bind inverse');
 assert.match(renderer,/mount\.targetWorld\.multiplyMatrices\(mount\.bone\.matrixWorld,mount\.bindBoneInverse\)/,
  'every displayed frame must update the real bone-driven armour stage');
 assert.doesNotMatch(renderer,/joint\.attach\(mesh\)/,
  'unsafe nonuniform GLB parent attach would shear animated fittings');
});
