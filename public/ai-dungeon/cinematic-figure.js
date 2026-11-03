/**
 * Original adult-scale cinematic figures for Dungeon regulars. This is an
 * entire skinned presentation candidate, not another overlay on toy anatomy.
 * Licensed CC0 GLB animations and every authoritative game rule remain intact.
 * Build all meshes before hiding any source; fail closed to textured originals.
 */
const ROLES=Object.freeze({
 vanguard:{shoulders:1.05,waist:.93,head:.88,garment:.72,weapon:'sword',metal:'#53656f',trim:'#bda77a',cloth:'#39434b',leather:'#373230',face:'#988370'},
 ranger:{shoulders:.87,waist:.79,head:.88,garment:.84,weapon:'bow',metal:'#57665f',trim:'#a18b6e',cloth:'#35473c',leather:'#3f3830',face:'#a28b73'},
 mystic:{shoulders:.83,waist:.94,head:.91,garment:1.07,weapon:'staff',metal:'#706b78',trim:'#b4a68e',cloth:'#48445c',leather:'#464047',face:'#af9a89'},
 revenant:{shoulders:.99,waist:.79,head:.90,garment:.60,weapon:'sword',metal:'#414b50',trim:'#91877b',cloth:'#30393d',leather:'#292b2e',face:'#7a807d'},
 cultist:{shoulders:.83,waist:.91,head:.89,garment:.97,weapon:'staff',metal:'#64535a',trim:'#af8875',cloth:'#4b3740',leather:'#392f31',face:'#9c847d'},
 // The same physically articulate figure system now carries the Warden's
 // towering martial anatomy. Its existing 24 original, phase-driven pieces
 // remain on top, instead of surrounding a toy-scale source body.
 warden:{shoulders:1.17,waist:1.04,head:.84,garment:.68,weapon:'sword',metal:'#323b43',trim:'#b99160',cloth:'#3c3440',leather:'#302b29',face:'#7e7772'}
});
export const CRITICAL_FIGURE_JOINTS=Object.freeze([
 'chest','pelvis','head','leftUpperArm','rightUpperArm','leftForearm','rightForearm',
 'leftUpperLeg','rightUpperLeg','leftLowerLeg','rightLowerLeg','rightHand'
]);
const part=(id,shape,finish,x,y,z,anchor='chest',sx=1,sy=1,sz=1)=>
 Object.freeze({id,shape,finish,x,y,z,anchor,sx,sy,sz});
export function planCinematicFigure(kind){
 if(!Object.hasOwn(ROLES,kind))return null;
 const p=ROLES[kind],s=p.shoulders,w=p.waist;
 const pieces=[
  part('torso','torso','metal',0,1.2,-.006,'chest',s,1,.99),
  part('surcoat','surcoat','cloth',0,1.20,.075,'chest',w,1,.87),
  part('pelvis','hips','leather',0,.86,0,'pelvis',w,1,1),
  part('gorget','neck','trim',0,1.52,-.015),
  part('helmet','head','metal',0,1.70,-.019,'head',p.head,1,p.head),
  part('face','visage','face',0,1.68,-.12,'head',p.head,1,p.head),
  part('visor','eyes','trim',0,1.77,-.17,'head',p.head,1,1),
  part('front-crest','crest','trim',0,1.3,-.24,'chest',.8,1,1),
  part('hem','hem','cloth',0,.65,.075,'pelvis',w,p.garment,1)
 ];
 for(const side of [-1,1]){
  const n=side===-1?'left':'right';
  pieces.push(
   part(n+'-shoulder','shoulder','metal',side*.36,1.39,-.005,n+'UpperArm',s*.85,.85,.95),
   part(n+'-upper-arm','arm','cloth',side*.41,1.18,0,n+'UpperArm'),
   part(n+'-bracer','bracer','metal',side*.45,.94,-.018,n+'Forearm'),
   part(n+'-thigh','thigh','leather',side*.18,.65,.015,n+'UpperLeg',w,1,1),
   part(n+'-shin','shin','metal',side*.18,.35,-.025,n+'LowerLeg'),
   part(n+'-boot','boot','leather',side*.18,.13,-.08,n+'LowerLeg')
  );
 }
 if(['ranger','mystic','cultist'].includes(kind))
  pieces.push(part('folded-hood','cowl','cloth',0,1.73,.052,'head',p.head*1.04,1,p.head));
 else if(kind==='vanguard')
  pieces.push(part('raised-helmet-ridge','cowl','trim',0,1.77,.055,'head',.79,.63,.73));
 else pieces.push(part('bone-death-crown','cowl','face',0,1.76,.047,'head',.81,.63,.72));
 if(kind==='warden')pieces.push(
  // Raised iron oath-keel, mobile knee defenses and heavy separated skirts:
  // these FOLLOW native bones during the true warning, charge and recovery.
  part('oathbreaker-keel','crest','trim',0,1.37,-.30,'chest',1.1,1.38,.90),
  part('oathbreaker-left-knee','shoulder','metal',-.18,.43,-.18,'leftLowerLeg',.47,.46,.62),
  part('oathbreaker-right-knee','shoulder','metal',.18,.43,-.18,'rightLowerLeg',.47,.46,.62),
  part('oathbreaker-left-skirt','hem','cloth',-.23,.66,.10,'pelvis',.47,.81,.88),
  part('oathbreaker-right-skirt','hem','cloth',.23,.66,.10,'pelvis',.47,.81,.88)
 );
 pieces.push(part('true-hand-weapon','weapon','trim',.49,1.0,-.18,'rightHand'));
 return Object.freeze({
  kind,statureMeters:kind==='warden'?2.30:1.82,weapon:p.weapon,
  palette:Object.freeze({...p}),
  pieces:Object.freeze(pieces)
 });
}
export function planFigureJointCoverage(joints){
 const missing=CRITICAL_FIGURE_JOINTS.filter(key=>joints?.[key]?.isBone!==true);
 return Object.freeze({valid:missing.length===0,count:CRITICAL_FIGURE_JOINTS.length-missing.length,missing:Object.freeze(missing)});
}
function createHull(T,rings,sides=20){
 const positions=[],uv=[],index=[];
 for(let i=0;i<rings.length;i++){
  const [y,rx,rz]=rings[i];
  for(let j=0;j<=sides;j++){
   const a=j*Math.PI*2/sides,cos=Math.cos(a),sin=Math.sin(a);
   positions.push(rx*Math.sign(cos)*Math.pow(Math.abs(cos),.88),y,
    rz*Math.sign(sin)*Math.pow(Math.abs(sin),.93));
   uv.push(j/sides,i/(rings.length-1));
  }
 }
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
  const a=i*(sides+1)+j,b=a+1,c=a+sides+1,d=c+1;
  index.push(a,c,b,b,c,d);
 }
 const lo=positions.length/3,hi=lo+1;
 positions.push(0,rings[0][0],0,0,rings.at(-1)[0],0);
 uv.push(.5,0,.5,1);
 const top=(rings.length-1)*(sides+1);
 for(let j=0;j<sides;j++){index.push(lo,j,j+1);index.push(hi,top+j+1,top+j);}
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(index);g.computeVertexNormals();return g;
}
function createForms(T,kind){
 const profiles={
  torso:[[-.34,.20,.155],[-.27,.25,.18],[-.09,.30,.20],[.12,.36,.215],[.23,.37,.20],[.34,.25,.15]],
  surcoat:[[-.34,.20,.17],[-.24,.26,.18],[.03,.29,.20],[.23,.315,.20],[.34,.24,.15]],
  hips:[[-.15,.23,.17],[-.055,.28,.19],[.07,.27,.185],[.14,.20,.14]],
  neck:[[-.08,.12,.10],[-.035,.15,.12],[.05,.14,.115],[.095,.10,.09]],
  head:[[-.16,.10,.09],[-.105,.152,.127],[.055,.16,.135],[.13,.135,.12],[.18,.09,.075]],
  visage:[[-.125,.065,.03],[-.055,.105,.05],[.06,.11,.049],[.13,.07,.025]],
  shoulder:[[-.135,.075,.075],[-.03,.145,.13],[.035,.18,.154],[.14,.13,.115]],
  arm:[[-.22,.072,.08],[-.13,.095,.10],[.01,.123,.119],[.14,.14,.127],[.23,.082,.087]],
  bracer:[[-.22,.066,.075],[-.12,.09,.10],[.0,.106,.11],[.14,.125,.115],[.22,.10,.09]],
  thigh:[[-.23,.083,.089],[-.14,.111,.118],[.02,.13,.13],[.15,.14,.135],[.23,.10,.10]],
  shin:[[-.22,.07,.078],[-.14,.085,.093],[.01,.109,.121],[.15,.125,.122],[.22,.09,.09]],
  boot:[[-.12,.10,.12],[-.04,.146,.18],[.05,.147,.19],[.10,.114,.14]],
  hem:[[-.18,.28,.20],[-.06,.31,.22],[.06,.27,.2],[.18,.21,.14]],
  cowl:[[-.18,.122,.105],[-.12,.17,.16],[.04,.18,.17],[.17,.16,.13],[.235,.08,.09]]
 };
 const forms=Object.fromEntries(Object.entries(profiles).map(([key,rows])=>[key,createHull(T,rows)]));
 forms.eyes=new T.BoxGeometry(.27,.052,.065);
 // Each faction receives original raised metal heraldry rather than a
 // generic sphere or a borrowed insignia. These marks remain legible in 3D.
 const crests={
  vanguard:[[0,-.15],[.12,-.08],[.13,.105],[0,.17],[-.13,.105],[-.12,-.08]],
  ranger:[[0,-.16],[.10,.14],[.03,.09],[0,.015],[-.03,.09],[-.10,.14]],
  mystic:[[0,-.19],[.06,-.07],[.14,0],[.06,.07],[0,.19],[-.06,.07],[-.14,0],[-.06,-.07]],
  revenant:[[0,-.17],[.08,-.12],[.04,-.015],[.13,.11],[0,.17],[-.13,.11],[-.04,-.015],[-.08,-.12]],
  cultist:[[0,-.16],[.13,-.06],[.05,.015],[.10,.15],[0,.09],[-.10,.15],[-.05,.015],[-.13,-.06]]
 };
 const emblem=new T.Shape(),polygon=crests[kind]||crests.vanguard;
 polygon.forEach(([x,y],i)=>i===0?emblem.moveTo(x,y):emblem.lineTo(x,y));
 emblem.closePath();
 forms.crest=new T.ExtrudeGeometry(emblem,{depth:.025,steps:1,
  bevelEnabled:true,bevelThickness:.007,bevelSize:.008,bevelSegments:1});
 return forms;
}
// One reusable, deterministic five-surface PBR atlas: grit on hammered metal,
 // grain on leather and a bounded weave on fabric. No downloaded art, pixel
 // uploads per frame, new shader passes or use of authoritative randomness.
const surfaceTextures=new Map();
function originalSurface(T,finish){
 if(surfaceTextures.has(finish))return surfaceTextures.get(finish);
 const size=96,bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let v=Math.imul(x+19,374761393)^Math.imul(y+47,668265263);
  v=Math.imul(v^(v>>>13),1274126177);
  const n=((v^(v>>>16))>>>0)/4294967295-.5;
  const wave=finish==='cloth'?
   .19*Math.sin(x*1.55)*Math.cos(y*1.44):
   finish==='leather'?.14*Math.sin(x*1.8)*Math.sin(y*1.62):
   finish==='metal'?.12*Math.sin(x*.35+y*.14):.09*Math.sin((x+y)*.24);
  const grain=.59+wave+n*(finish==='leather'?.28:.16);
  const p=Math.round(Math.max(.14,Math.min(.92,grain))*255),i=(y*size+x)*4;
  bytes[i]=bytes[i+1]=bytes[i+2]=p;bytes[i+3]=255;
 }
 const t=new T.DataTexture(bytes,size,size,T.RGBAFormat,T.UnsignedByteType);
 t.name='Original cinematic '+finish+' material microrelief';
 t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);
 t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;
 t.generateMipmaps=true;t.anisotropy=2;t.needsUpdate=true;
 surfaceTextures.set(finish,t);return t;
}
const material=(T,finish,color,metalness,roughness)=>{
 const micro=originalSurface(T,finish);
 return new T.MeshStandardMaterial({color,metalness,roughness,
  bumpMap:micro,roughnessMap:micro,
  bumpScale:finish==='cloth'?.019:finish==='leather'?.024:.029});
};
function attachWeapon(T,group,hand,recipe,materialMap,geometry,built){
 const grip=new T.Group();grip.name='Original '+recipe.weapon+' skinned-hand weapon';
 grip.position.set(.5,1.03,-.22);
 // Hand-mounted Warden steel grows with the already-scaled 2.30m skeleton.
 // Attach preserves the resulting world-space size, never adds an authority hitbox.
 grip.scale.setScalar(recipe.statureMeters/1.82);group.add(grip);
 const piece=(g,m,x,y,z)=>{
  const mesh=new T.Mesh(g,materialMap[m]);mesh.position.set(x,y,z);
  mesh.name='cinematic-weapon-'+recipe.weapon;
  mesh.userData.cinematicFigurePiece=true;
  mesh.castShadow=false;grip.add(mesh);built.push(mesh);return mesh;
 };
 if(recipe.weapon==='sword'){
  const blade=new T.Shape();
  blade.moveTo(-.045,-.26);blade.lineTo(.045,-.26);
  blade.lineTo(.065,.30);blade.lineTo(0,.56);blade.lineTo(-.065,.30);blade.closePath();
  geometry.blade=new T.ExtrudeGeometry(blade,{depth:.026,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1});
  geometry.guard=new T.BoxGeometry(.32,.045,.09);
  geometry.grip=new T.CylinderGeometry(.032,.042,.25,9);
  piece(geometry.blade,'metal',0,.22,-.16);
  piece(geometry.guard,'trim',0,-.07,-.16);
  piece(geometry.grip,'leather',0,-.195,-.16);
 }else if(recipe.weapon==='bow'){
  geometry.bow=new T.TorusGeometry(.36,.028,8,24,Math.PI);
  geometry.bowstring=new T.CylinderGeometry(.008,.008,.72,6);
  piece(geometry.bow,'trim',0,0,-.16).rotation.y=Math.PI/2;
  piece(geometry.bowstring,'leather',0,0,-.16);
 }else{
  geometry.staff=new T.CylinderGeometry(.033,.045,1.06,10);
  geometry.crystal=new T.OctahedronGeometry(.13,1);
  piece(geometry.staff,'leather',0,-.29,-.16);
  piece(geometry.crystal,'trim',0,.30,-.16);
 }
 group.updateWorldMatrix(true,true);
 hand.attach(grip);
 // Object3D.attach preserves the old world position. The correct contact
 // point is the actual imported skinned right hand, NOT the legacy costume
 // coordinates that can leave a full metre of visual blade/hand separation.
 grip.position.set(0,0,0);
 hand.updateWorldMatrix(true,true);
 return hand.getWorldPosition(new T.Vector3()).distanceTo(grip.getWorldPosition(new T.Vector3()));
}
/**
 * Complete visual replacement, carrying exact scene-space body proportions.
 * Source CC0 meshes are hidden only after all native bone-mounted parts and
 * the physical weapon have been constructed, with a safe fallback on failure.
 */
export function createCinematicFigure(T,actor,joints){
 const recipe=planCinematicFigure(actor?.u?.kind);
 if(!recipe||!T?.BufferGeometry||!actor?.assetRoot||!actor?.visualPivot||
  !planFigureJointCoverage(joints).valid)return null;
 const geometry=createForms(T,recipe.kind),mat={
  metal:material(T,'metal',recipe.palette.metal,.70,.42),
  trim:material(T,'trim',recipe.palette.trim,.62,.41),
  cloth:material(T,'cloth',recipe.palette.cloth,.028,.91),
  leather:material(T,'leather',recipe.palette.leather,.06,.82),
  face:material(T,'face',recipe.palette.face,.055,.78)
 };
 const group=new T.Group(),built=[],figureScale=recipe.statureMeters/1.82;
 group.name='Original anatomically articulated '+recipe.kind;
 try{
  actor.visualPivot.add(group);
  actor.visualPivot.updateWorldMatrix(true,true);actor.assetRoot.updateWorldMatrix(true,true);
  for(const p of recipe.pieces){
   if(p.shape==='weapon')continue;
   const mesh=new T.Mesh(geometry[p.shape],mat[p.finish]);
   mesh.name='cinematic-'+recipe.kind+'-'+p.id;
   mesh.position.set(p.x*figureScale,p.y*figureScale,p.z*figureScale);
   mesh.scale.set(p.sx*figureScale,p.sy*figureScale,p.sz*figureScale);
   mesh.userData.cinematicFigurePiece=true;
   mesh.castShadow=false;mesh.receiveShadow=true;
   group.add(mesh);built.push(mesh);
   group.updateWorldMatrix(true,true);joints[p.anchor].attach(mesh);
  }
  const gripOffset=attachWeapon(T,group,joints.rightHand,recipe,mat,geometry,built);
  if(!Number.isFinite(gripOffset)||gripOffset>.015)
   throw Error('Native right-hand grip did not align: '+gripOffset);
  // A partial skeleton never reaches this point. Do not hide user's real art
  // until every replacement and weapon follows their TRUE animation bones.
  actor.assetRoot.traverse(obj=>{
   if(obj.isMesh&&!obj.userData?.cinematicFigurePiece)obj.visible=false;
  });
  actor.assetGeometries.push(...Object.values(geometry));
  actor.assetMaterials.push(...Object.values(mat));
  const vertices=Object.values(geometry).reduce((n,g)=>n+(g.getAttribute?.('position')?.count||0),0);
  return Object.freeze({kind:recipe.kind,meshes:built.length,joints:12,
   vertices,mappedMaterials:Object.values(mat).filter(m=>m.bumpMap).length,
   handGripOffsetMeters:gripOffset,
   weapon:recipe.weapon,sourceMeshesHidden:true,height:recipe.statureMeters});
 }catch(e){
  // Object3D.attach reparents the limb pieces beneath source bones. Remove
  // them individually so an incomplete frame cannot leave detached geometry.
  for(const item of built)item.removeFromParent();
  group.removeFromParent();
  actor.assetRoot.traverse(obj=>{if(obj.isMesh)obj.visible=true;});
  Object.values(geometry).forEach(g=>g.dispose());
  Object.values(mat).forEach(m=>m.dispose());
  console.warn('[DUNGEON] cinematic figure fallback to original GLB:',String(e));
  return null;
 }
}
