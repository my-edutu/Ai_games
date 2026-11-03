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
  // The inherited hard neck ring obscured true face/skin and added one draw
  // to every crowded expedition actor; the skinned underlay now carries it.
  part('helmet','head','metal',0,1.70,-.019,'head',p.head,.80,p.head),
  part('face','visage','face',0,1.68,-.142,'head',p.head,.80,p.head),
  part('visor','eyes','trim',0,1.77,-.184,'head',p.head,.80,1),
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
 // Distinct sculpted identity equipment is attached to animated native bones.
 // The armor moves with legal travel, casting and combat; no authority changes.
 const identity={
  vanguard:[
   part('identity-bastion-shield','shield','metal',-0.52,1.05,-0.29,'leftForearm',1.04,1.03,1),
   part('identity-bastion-sigil','crest','trim',-0.52,1.07,-0.395,'leftForearm',0.63,0.74,1)
  ],
  ranger:[
   part('identity-wayfinder-quiver','quiver','leather',0.33,1.2,0.275,'chest',0.84,1.02,0.84),
   part('identity-wayfinder-fletching','vane','trim',0.34,1.59,0.25,'chest',0.58,0.65,0.58)
  ],
  mystic:[
   part('identity-oracle-circlet','circlet','trim',0,1.89,-0.02,'head',0.95,1,0.95),
   part('identity-oracle-mantle','banner','cloth',-0.22,0.84,0.24,'chest',0.68,0.9,0.78)
  ],
  revenant:[
   part('identity-hollow-left-thorn','vane','metal',-0.37,1.49,0.08,'leftUpperArm',0.95,1.22,0.88),
   part('identity-hollow-right-thorn','vane','metal',0.37,1.49,0.08,'rightUpperArm',0.95,1.22,0.88)
  ],
  cultist:[
   part('identity-penitent-left-stole','banner','cloth',-0.24,0.85,-0.2,'leftUpperArm',0.78,1.22,0.79),
   part('identity-penitent-right-stole','banner','cloth',0.24,0.85,-0.2,'chest',0.78,1.22,0.79)
  ],
  warden:[
   part('identity-oathbreaker-guard','shield','metal',-0.63,1.07,-0.28,'leftForearm',1.18,1.26,1),
   part('identity-oathbreaker-left-oath','banner','cloth',-0.34,0.87,0.28,'chest',0.88,1.32,0.85),
   part('identity-oathbreaker-right-oath','banner','cloth',0.34,0.87,0.28,'chest',0.88,1.32,0.85)
  ],
 };
 pieces.push(...identity[kind]);
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
/** Cohesive 3D under-armour follows actual native CC0 skeleton. The former
 * discrete rigid plates visibly floated apart during true movement/attacks.
 * Every seam is bounded, animation-driven, authority-free and shader-free.
 */
export const CINEMATIC_ANATOMY_LINKS=Object.freeze([
 ['torso','pelvis'], ['torso','helmet'],
 ['torso','left-shoulder'], ['left-shoulder','left-upper-arm'], ['left-upper-arm','left-bracer'],
 ['torso','right-shoulder'], ['right-shoulder','right-upper-arm'], ['right-upper-arm','right-bracer'],
 ['pelvis','left-thigh'], ['left-thigh','left-shin'], ['left-shin','left-boot'],
 ['pelvis','right-thigh'], ['right-thigh','right-shin'], ['right-shin','right-boot']
].map(([a,b])=>Object.freeze([a,b])));
/**
 * Real source-b8be04f desktop and mobile screenshots exposed enormous opaque
 * tube-shaped "arms" between distant native-bone ornaments. This is a real
 * visual regression. Do not fabricate body continuity across bad rig gaps.
 */
export function planAnatomyBridge(span,stature=1.82){
 if(!Number.isFinite(span)||!Number.isFinite(stature)||stature<1.3||stature>2.6)
  return Object.freeze({visible:false,length:0,radius:0});
 const scale=stature/1.82;
 // Only cover true short cloth seams; no large rubber geometry spanning
 // separate poses. The larger Warden uses proportionally scaled anatomy.
 if(span<.035*scale||span>.28*scale)
  return Object.freeze({visible:false,length:0,radius:0});
 const width=(span<.14*scale?.044:.053)*scale;
 return Object.freeze({visible:true,length:span*1.055,radius:width});
}
/**
 * An animated cloth seam follows real CC0 GLB bones, never a widely spaced
 * ornamental costume pivot. Exactly fourteen bounded GPU instance slots,
 * with four old rubber-tube extensions retired. No ghost skeletons.
 */
export const CINEMATIC_NATIVE_SEAMS=Object.freeze([
 ['chest','pelvis','gambeson'],['chest','head','collar'],
 ['chest','leftUpperArm','shoulder'],['leftUpperArm','leftForearm','sleeve'],
 ['leftForearm',null,'retired'],['chest','rightUpperArm','shoulder'],
 ['rightUpperArm','rightForearm','sleeve'],['rightForearm',null,'retired'],
 ['pelvis','leftUpperLeg','hip'],['leftUpperLeg','leftLowerLeg','legging'],
 ['leftLowerLeg',null,'retired'],['pelvis','rightUpperLeg','hip'],
 ['rightUpperLeg','rightLowerLeg','legging'],['rightLowerLeg',null,'retired']
].map(([a,b,profile])=>Object.freeze({a,b,profile})));
/**
 * Bounded original cloth volume profiles for anatomically skinned figures.
 * Guard against metre-long dark capsules even when imported bones are
 * unexpectedly far apart in genuine travel, melee and Warden animations.
 */
export function planNativeGarmentSeam(span,stature=1.82,profile='sleeve',kind='vanguard'){
 const hidden=Object.freeze({visible:false,length:0,radiusX:0,radiusZ:0});
 const profiles={
  gambeson:[.09,.40,.178,.148],
  collar:[.045,.245,.083,.067],
  shoulder:[.055,.38,.111,.089],
  sleeve:[.095,.38,.077,.069],
  hip:[.075,.36,.118,.097],
  legging:[.09,.40,.100,.086]
 };
 const p=profiles[profile];
 if(!p||!Number.isFinite(span)||!Number.isFinite(stature)||
    stature<1.3||stature>2.6||!Object.hasOwn(ROLES,kind))return hidden;
 const size=stature/1.82;
 if(span<p[0]*size||span>p[1]*size)return hidden;
 const shape=ROLES[kind];
 const width=profile==='shoulder'?shape.shoulders:
  profile==='hip'||profile==='legging'?shape.waist:1;
 return Object.freeze({visible:true,length:span*1.035,
  radiusX:Math.min(.20,p[2]*size*width),
  radiusZ:Math.min(.18,p[3]*size)});
}

/** 
 * M1 anatomical continuity: preserve ONLY the artist-authored, continuously
 * SKINNED underlying torso and four limbs beneath the original forged armor.
 * Exact-head desktop Chromium exposed detached gloves and floating pauldrons
 * when we hid every CC0 character mesh. This legal KayKit underbody already
 * follows imported bone weights/clips; it never invents body movement or combat.
 * Rigid helmets, heads, accessories, weapons and oversized capes remain hidden.
 */
export function isNativeContinuityMesh(name,isSkinnedMesh){
 return isSkinnedMesh===true&&typeof name==='string'&&
  /_(?:Body|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(name);
}
const MIN_NATIVE_BODY_PIECES=5;
/**
 * Fit original armour to the ACTUAL imported adult skeleton at rest, instead
 * of assuming that six distinct licensed skeletons place their shoulder,
 * elbow, hip, knee and cranial joints at the same hard-coded XYZ values.
 * This is one-time bind-pose geometry fitting, not per-frame procedural IK.
 * Rigid/cloth parts still move with their own genuine animated native bone.
 * The maximal gap is a physical fitting envelope; ornaments (a shield,
 * quiver and hanging cloth) legitimately sit farther from the parent joint.
 * Invalid joint measurements leave the source-designed attachment untouched.
 */
export function planNativeArmorMount(piece,bone,scale=1){
 const requested=Object.freeze({x:(piece?.x??0)*scale,y:(piece?.y??0)*scale,z:(piece?.z??0)*scale});
 if(!piece||!Number.isFinite(scale)||scale<.6||scale>1.7||
    ![requested.x,requested.y,requested.z,bone?.x,bone?.y,bone?.z].every(Number.isFinite)||
    bone.y<-.25||bone.y>3.3||Math.hypot(bone.x,bone.z)>1.8)
  return Object.freeze({...requested,adjusted:false,shift:0,source:'unfitted'});
 const id=String(piece.id||''),shape=String(piece.shape||'');
 const envelope=id.startsWith('identity-')?
   (shape==='shield'?.63:shape==='quiver'||shape==='banner'?.55:.42):
   shape==='boot'?.55:shape==='bracer'?.45:shape==='shin'?.41:
   shape==='hem'?.52:shape==='thigh'?.38:shape==='surcoat'?.44:
   shape==='cowl'||shape==='head'||shape==='visage'||shape==='eyes'?.20:
   shape==='shoulder'?.32:shape==='arm'?.35:shape==='torso'?.29:
   shape==='crest'?.38:.32;
 const distance=Math.hypot(requested.x-bone.x,requested.y-bone.y,requested.z-bone.z);
 const allowance=envelope*scale;
 if(distance<=allowance)return Object.freeze({...requested,adjusted:false,shift:0,source:'native'});
 const f=allowance/distance;
 const fitted={x:bone.x+(requested.x-bone.x)*f,
  y:bone.y+(requested.y-bone.y)*f,z:bone.z+(requested.z-bone.z)*f};
 const round=v=>Number(v.toFixed(5));
 return Object.freeze({x:round(fitted.x),y:round(fitted.y),z:round(fitted.z),
  adjusted:true,shift:round(distance-allowance),source:'native'});
}


const MIRRORED_PARTS=Object.freeze(['shoulder','upper-arm','bracer','thigh','shin','boot']);
/**
 * Share one GPU draw per articulated left/right material pair without
 * welding two independently moving native skeleton joints together.
 * Source joints remain the absolute animation source of truth.
 */
export function planCinematicPairedParts(kind){
 const recipe=planCinematicFigure(kind);
 if(!recipe)return Object.freeze([]);
 const pairs=[];
 for(const suffix of MIRRORED_PARTS){
  const left=recipe.pieces.find(p=>p.id==='left-'+suffix),
   right=recipe.pieces.find(p=>p.id==='right-'+suffix);
  if(!left||!right||left.shape!==right.shape||left.finish!==right.finish)continue;
  pairs.push(Object.freeze({suffix,shape:left.shape,finish:left.finish,
   parts:Object.freeze([left,right])}));
 }
 return Object.freeze(pairs);
}

/**
 * A whole sculpted head should move as one native cranial object, not four
 * overlapping opaque meshes. Keep role silhouettes (helmet, real face,
 * separate brows and cowl/circlet) but weld their *geometry*, not bones.
 * Five original material identities survive as per-vertex color zones.
 */
export function planCinematicHeadShell(kind){
 const recipe=planCinematicFigure(kind);
 return recipe?Object.freeze(recipe.pieces.filter(p=>p.anchor==='head'&&p.shape!=='weapon')):Object.freeze([]);
}
function sculptIntegratedHeadShell(T,recipe,forms,parts){
 const pivot=parts.find(p=>p.id==='helmet');
 if(!pivot||!parts.some(p=>p.id==='face')||!parts.some(p=>p.id==='visor'))
  throw Error('Cinematic head requires genuine facial volume, helmet and visor');
 const positions=[],uvs=[],colors=[],indices=[];
 for(const p of parts){
  const source=forms[p.shape],vertex=source?.getAttribute?.('position');
  if(!vertex)throw Error('Missing original sculpted head form '+p.shape);
  const uv=source.getAttribute('uv');
  const color=new T.Color(recipe.palette[p.finish]||recipe.palette.metal);
  const offset=positions.length/3;
  for(let i=0;i<vertex.count;i++){
   // Local geometry is baked relative to ONE imported cranial bone. The
   // authored head position, crown silhouettes and face offsets stay exact.
   positions.push(vertex.getX(i)*p.sx+p.x-pivot.x,
    vertex.getY(i)*p.sy+p.y-pivot.y,
    vertex.getZ(i)*p.sz+p.z-pivot.z);
   uvs.push(uv?.getX(i)??.5,uv?.getY(i)??.5);
   colors.push(color.r,color.g,color.b);
  }
  const idx=source.index;
  if(idx){for(let i=0;i<idx.count;i++)indices.push(offset+idx.getX(i));}
  else {for(let i=0;i<vertex.count;i++)indices.push(offset+i);}
 }
 if(!indices.length||positions.length/3>20000)throw Error('Invalid bounded cinematic head shell');
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 return geo;
}

function createGambesonGusset(T){
 // Original tapered cloth rather than a constant-width hard cylinder.
 // Only genuine adjacent short bone gaps remain eligible for this draw.
 const rings=[[-.5,.64],[-.36,.82],[-.18,.98],[0,1.055],[.18,.98],[.36,.82],[.5,.64]];
 const sides=12,positions=[],uvs=[],indices=[];
 for(let r=0;r<rings.length;r++)for(let i=0;i<=sides;i++){
  const t=i*Math.PI*2/sides,fold=1+.055*Math.cos(t*6),radius=rings[r][1]*fold;
  positions.push(Math.cos(t)*radius,rings[r][0],Math.sin(t)*radius*.83);
  uvs.push(i/sides,r/(rings.length-1));
 }
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){
  const a=r*(sides+1)+i,b=a+1,c=a+sides+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 g.setIndex(indices);g.computeVertexNormals();return g;
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
/**
 * One complete sculpted human-scale facial volume: cheek arches, brows,
 * a real projecting nose, and narrowed chin are part of the SINGLE shared
 * character face draw. Nothing is a billboard or copied reference asset.
 * The existing animated cranial bone drives the whole face/helmet.
 */
function createAnatomicalFace(T,kind){
 const rows=14,columns=16,stride=columns+1;
 const positions=[],uvs=[],indices=[];
 const mask=kind==='warden'?.55:kind==='revenant'?.74:1;
 for(let layer=0;layer<2;layer++)for(let row=0;row<=rows;row++){
  const v=2*row/rows-1;
  const jaw=(v<-.25?(Math.abs(v)-.25)/.75:0);
  for(let col=0;col<=columns;col++){
   const u=2*col/columns-1;
   const x=u*(.128+.005*Math.max(0,v)-.043*jaw);
   const y=v*.176;
   const g=(dx,dy,sx,sy)=>Math.exp(-dx*dx/sx-dy*dy/sy);
   const brow=.014*g(Math.abs(u)-.49,v-.44,.078,.037);
   const cheek=.023*g(Math.abs(u)-.59,v+.05,.092,.15);
   const nose=.073*mask*g(u,v+.05,.034,.17);
   const chin=.018*g(u,v+.72,.20,.033);
   const depth=.016+.022*(1-u*u)*(1-v*v)+brow+cheek+nose+chin;
   positions.push(x,y,layer===0?-depth:.025);
   uvs.push((u+1)*.5,(v+1)*.5);
  }
 }
 const layerSize=(rows+1)*stride;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*stride+col,b=a+1,c=a+stride,d=c+1;
  indices.push(a,c,b,b,c,d);
  indices.push(layerSize+a,layerSize+b,layerSize+c,
   layerSize+b,layerSize+d,layerSize+c);
 }
 // Close the thin sculpted brow/cheek volume. Both oblique desktop and phone
 // cameras can see an actual profile rather than a flat painted face.
 const edge=(a,b)=>{
  indices.push(a,b,layerSize+b,a,layerSize+b,layerSize+a);
 };
 for(let col=0;col<columns;col++){
  edge(col,col+1);edge(rows*stride+col+1,rows*stride+col);
 }
 for(let row=0;row<rows;row++){
  edge((row+1)*stride,row*stride);
  edge(row*stride+columns,(row+1)*stride+columns);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
/** Two physically separate iron brow lenses with a narrow nose bridge,
 * all in one buffer and one material draw; avoids the toy-like flat eye bar. */
function createSplitVisor(T){
 const positions=[],uvs=[],indices=[];
 const polygon=coords=>{
  const start=positions.length/3,n=coords.length;
  for(const z of [-.028,.018])for(const [x,y] of coords){
   positions.push(x,y,z);uvs.push(x+.5,y+.5);
  }
  for(let i=1;i<n-1;i++){
   indices.push(start,start+i+1,start+i);
   indices.push(start+n,start+n+i,start+n+i+1);
  }
  for(let i=0;i<n;i++){
   const b=(i+1)%n;
   indices.push(start+i,start+b,start+n+b,start+i,start+n+b,start+n+i);
  }
 };
 polygon([[-.137,-.014],[-.052,.002],[-.038,.040],[-.122,.023]]);
 polygon([[.052,.002],[.137,-.014],[.122,.023],[.038,.040]]);
 polygon([[-.048,.011],[.048,.011],[.038,.023],[-.038,.023]]);
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function createForms(T,kind){
 const profiles={
  torso:[[-.36,.15,.13],[-.29,.23,.17],[-.17,.27,.185],[-.06,.30,.19],[.06,.34,.225],[.17,.36,.205],[.28,.29,.175],[.36,.16,.13]],
  surcoat:[[-.34,.20,.17],[-.24,.26,.18],[.03,.29,.20],[.23,.315,.20],[.34,.24,.15]],
  hips:[[-.15,.23,.17],[-.055,.28,.19],[.07,.27,.185],[.14,.20,.14]],
  neck:[[-.08,.12,.10],[-.035,.15,.12],[.05,.14,.115],[.095,.10,.09]],
  head:[[-.196,.07,.075],[-.16,.115,.099],[-.105,.145,.120],[.020,.153,.135],[.115,.135,.115],[.175,.09,.085],[.211,.052,.054]],
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
 forms.visage.dispose();forms.visage=createAnatomicalFace(T,kind);
 forms.eyes=createSplitVisor(T);
 // Original hero-scale silhouette geometry, never proprietary meshes.
 const shield=new T.Shape();
 shield.moveTo(-.32,.34);shield.lineTo(.32,.34);shield.lineTo(.34,.06);
 shield.quadraticCurveTo(.27,-.28,0,-.47);
 shield.quadraticCurveTo(-.27,-.28,-.34,.06);shield.closePath();
 forms.shield=new T.ExtrudeGeometry(shield,{depth:.085,steps:1,
  bevelEnabled:true,bevelSize:.028,bevelThickness:.018,bevelSegments:2});
 forms.shield.translate(0,0,-.0425);
 forms.quiver=createHull(T,[[-.31,.095,.09],[-.23,.115,.103],[.05,.138,.126],
  [.23,.152,.137],[.32,.141,.13]],14);
 forms.vane=createHull(T,[[-.24,.055,.07],[-.11,.105,.10],
  [.06,.095,.09],[.23,.041,.052],[.38,.009,.015]],12);
 forms.circlet=new T.TorusGeometry(.205,.034,8,32,Math.PI*1.77);
 const banner=new T.Shape();
 banner.moveTo(-.145,.30);banner.lineTo(.145,.30);banner.lineTo(.15,-.09);
 banner.lineTo(.065,-.30);banner.lineTo(0,-.22);banner.lineTo(-.09,-.37);
 banner.lineTo(-.16,-.18);banner.closePath();
 forms.banner=new T.ExtrudeGeometry(banner,{depth:.027,steps:1,
  bevelEnabled:true,bevelSize:.011,bevelThickness:.008,bevelSegments:1});
 forms.banner.translate(0,0,-.0135);
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
 if(!recipe||!T?.BufferGeometry||!T?.InstancedMesh||!T?.Matrix4||!actor?.assetRoot||
  !actor?.visualPivot||!planFigureJointCoverage(joints).valid)return null;
 const geometry=createForms(T,recipe.kind),mat={
  // The original no-reflection-probe scene made 70%-metallic armor render
  // nearly black. Restore physically readable diffuse energy to adult forms.
  metal:material(T,'metal',recipe.palette.metal,.32,.58),
  trim:material(T,'trim',recipe.palette.trim,.38,.53),
  cloth:material(T,'cloth',recipe.palette.cloth,.028,.91),
  leather:material(T,'leather',recipe.palette.leather,.06,.82),
  face:material(T,'face',recipe.palette.face,.035,.82),
  // One material per real head rather than per overlapping helmet/face/visor.
  // Vertex colours keep independent skin/iron/cloth identity at game scale;
  // rough PBR microrelief preserves face planes without fake bloom.
  integratedHead:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,
   metalness:.18,roughness:.73,bumpMap:originalSurface(T,'face'),
   roughnessMap:originalSurface(T,'face'),bumpScale:.014}),
  // Use configured, texture-bearing native skinned body materials.
 };
 const group=new T.Group(),built=[],anchors=[],batches=[],attachments=new Map();
 const figureScale=recipe.statureMeters/1.82;
 group.name='Original anatomically articulated '+recipe.kind;
 let nativeMountAdjustments=0,nativeMountLargestShift=0;
 const nativeJointRest=Object.create(null),jointWorld=new T.Vector3();
 // Sample the real imported rig ONCE in neutral pose. Shared skeleton clips
 // continue to own animation; no world-space costume drive is added.
 actor.assetRoot.updateWorldMatrix(true,true);
 actor.visualPivot.updateWorldMatrix(true,true);
 group.updateWorldMatrix(true,true);
 for(const key of CRITICAL_FIGURE_JOINTS){
  joints[key].updateWorldMatrix(true,false);
  joints[key].getWorldPosition(jointWorld);
  group.worldToLocal(jointWorld);
  nativeJointRest[key]={x:jointWorld.x,y:jointWorld.y,z:jointWorld.z};
 }
 const mount=piece=>{
  const position=planNativeArmorMount(piece,nativeJointRest[piece.anchor],figureScale);
  if(position.adjusted){nativeMountAdjustments++;
   nativeMountLargestShift=Math.max(nativeMountLargestShift,position.shift);}
  return position;
 };
 try{
  actor.visualPivot.add(group);
  actor.visualPivot.updateWorldMatrix(true,true);actor.assetRoot.updateWorldMatrix(true,true);
  const excluded=new Set();
  // This is not a static merged costume: each half of each InstancedMesh
  // follows its OWN actual native bone after the AnimationMixer, hit,
  // dodge, Warden warning, full-body travel and defeat poses.
  for(const pair of planCinematicPairedParts(recipe.kind)){
   const mesh=new T.InstancedMesh(geometry[pair.shape],mat[pair.finish],2);
   mesh.name='cinematic-'+recipe.kind+'-articulated-'+pair.suffix;
   mesh.userData.cinematicFigurePiece=true;
   mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
   group.add(mesh);built.push(mesh);
   const jointAnchors=[];
   for(const p of pair.parts){
    const anchor=new T.Object3D();anchor.name='native '+p.anchor+' '+p.id;
    const fitted=mount(p);
    anchor.position.set(fitted.x,fitted.y,fitted.z);
    anchor.scale.set(p.sx*figureScale,p.sy*figureScale,p.sz*figureScale);
    group.add(anchor);anchors.push(anchor);attachments.set(p.id,anchor);
    group.updateWorldMatrix(true,true);joints[p.anchor].attach(anchor);
    jointAnchors.push(anchor);excluded.add(p.id);
   }
   batches.push({mesh,anchors:jointAnchors});
  }
  const headPieces=planCinematicHeadShell(recipe.kind);
  const headPivot=headPieces.find(p=>p.id==='helmet');
  const sculptedHead=sculptIntegratedHeadShell(T,recipe,geometry,headPieces);
  geometry.integratedHead=sculptedHead;
  const headMesh=new T.Mesh(sculptedHead,mat.integratedHead);
  headMesh.name='cinematic-'+recipe.kind+'-cranial-sculpture';
  const fittedHead=mount(headPivot);
  headMesh.position.set(fittedHead.x,fittedHead.y,fittedHead.z);
  headMesh.scale.setScalar(figureScale);
  headMesh.userData.cinematicFigurePiece=true;
  headMesh.castShadow=false;headMesh.receiveShadow=true;
  group.add(headMesh);built.push(headMesh);
  group.updateWorldMatrix(true,true);joints.head.attach(headMesh);
  for(const p of headPieces){excluded.add(p.id);attachments.set(p.id,headMesh);}
  for(const p of recipe.pieces){
   if(p.shape==='weapon'||excluded.has(p.id))continue;
   const mesh=new T.Mesh(geometry[p.shape],mat[p.finish]);
   mesh.name='cinematic-'+recipe.kind+'-'+p.id;
   const fitted=mount(p);
   mesh.position.set(fitted.x,fitted.y,fitted.z);
   mesh.scale.set(p.sx*figureScale,p.sy*figureScale,p.sz*figureScale);
   mesh.userData.cinematicFigurePiece=true;
   mesh.castShadow=false;mesh.receiveShadow=true;
   group.add(mesh);built.push(mesh);attachments.set(p.id,mesh);
   group.updateWorldMatrix(true,true);joints[p.anchor].attach(mesh);
  }
  const gripOffset=attachWeapon(T,group,joints.rightHand,recipe,mat,geometry,built);
  if(!Number.isFinite(gripOffset)||gripOffset>.015)
   throw Error('Native right-hand grip did not align: '+gripOffset);
  // One shared GPU draw per original cloth-connected anatomical body,
  // rather than a new mesh per joint. World transforms come ONLY from
  // native animated bones after the actual actor's mixer/real combat poses.
  const bridgeGeometry=createGambesonGusset(T);
  geometry.anatomyBridge=bridgeGeometry;
  const bridge=new T.InstancedMesh(bridgeGeometry,mat.cloth,CINEMATIC_ANATOMY_LINKS.length);
  bridge.name='cinematic-'+recipe.kind+'-continuous-bone-driven-anatomy';
  bridge.userData.cinematicFigurePiece=true;bridge.frustumCulled=false;
  bridge.castShadow=false;bridge.receiveShadow=true;
  bridge.instanceMatrix.setUsage(T.DynamicDrawUsage);
  group.add(bridge);built.push(bridge);
  const inverseGroup=new T.Matrix4(),pose=new T.Matrix4(),
   bridgeStart=new T.Vector3(),bridgeEnd=new T.Vector3(),bridgeMid=new T.Vector3(),
   bridgeDirection=new T.Vector3(),bridgeScale=new T.Vector3(),
   bridgeQuat=new T.Quaternion(),bridgeUp=new T.Vector3(0,1,0);
  let activeBridges=0,rejectedLongBridges=0;
  const sync=()=>{
   group.updateWorldMatrix(true,false);
   inverseGroup.copy(group.matrixWorld).invert();
   for(const pair of batches){
    for(let i=0;i<pair.anchors.length;i++){
     pair.anchors[i].updateWorldMatrix(true,false);
     pose.multiplyMatrices(inverseGroup,pair.anchors[i].matrixWorld);
     pair.mesh.setMatrixAt(i,pose);
    }
    pair.mesh.instanceMatrix.needsUpdate=true;
   }
   activeBridges=0;rejectedLongBridges=0;
   CINEMATIC_NATIVE_SEAMS.forEach(({a:from,b:to,profile},i)=>{
    // Only true skinning joints may anchor a rendered garment. Missing bones
    // and retired long costume seams stay invisible; never fabricate anatomy.
    const a=joints[from],b=to?joints[to]:null;
    if(!a?.isBone||!b?.isBone){
     pose.makeScale(.00001,.00001,.00001);bridge.setMatrixAt(i,pose);return;
    }
    a.updateWorldMatrix(true,false);b.updateWorldMatrix(true,false);
    a.getWorldPosition(bridgeStart).applyMatrix4(inverseGroup);
    b.getWorldPosition(bridgeEnd).applyMatrix4(inverseGroup);
    bridgeDirection.subVectors(bridgeEnd,bridgeStart);
    const length=bridgeDirection.length();
    const plan=planNativeGarmentSeam(length,recipe.statureMeters,profile,recipe.kind);
    if(!plan.visible){
     if(Number.isFinite(length)&&length>.04)rejectedLongBridges++;
     pose.makeScale(.00001,.00001,.00001);bridge.setMatrixAt(i,pose);return;
    }
    bridgeMid.addVectors(bridgeStart,bridgeEnd).multiplyScalar(.5);
    bridgeQuat.setFromUnitVectors(bridgeUp,bridgeDirection.multiplyScalar(1/length));
    bridgeScale.set(plan.radiusX,plan.length,plan.radiusZ);
    pose.compose(bridgeMid,bridgeQuat,bridgeScale);
    bridge.setMatrixAt(i,pose);activeBridges++;
   });
   bridge.instanceMatrix.needsUpdate=true;
  };
  sync();
  // Require genuine skinned continuity BEFORE hiding source clothes. Failing
  // that requirement restores the complete asset instead of a hollow figure.
  const nativeAnatomy=[];
  actor.assetRoot.traverse(obj=>{
   if(obj.isSkinnedMesh&&isNativeContinuityMesh(obj.name,true))nativeAnatomy.push(obj);
  });
  if(nativeAnatomy.length<MIN_NATIVE_BODY_PIECES)
   throw Error('Continuous native skinned torso/limb underlay missing: '+nativeAnatomy.length);
  actor.assetRoot.traverse(obj=>{
   if(obj.isMesh&&!obj.userData?.cinematicFigurePiece){
    const keep=isNativeContinuityMesh(obj.name,obj.isSkinnedMesh);
    obj.visible=keep;
    if(keep){obj.userData.cinematicBodyUnderlay=true;}
   }
  });
  actor.assetGeometries.push(...Object.values(geometry));
  actor.assetMaterials.push(...Object.values(mat));
  const vertices=Object.values(geometry).reduce((n,g)=>n+(g.getAttribute?.('position')?.count||0),0);
  return Object.freeze({kind:recipe.kind,meshes:built.length,
   renderedParts:built.length+batches.length,pairedBatches:batches.length,
   joints:12,vertices,mappedMaterials:Object.values(mat).filter(m=>m.bumpMap).length,
   handGripOffsetMeters:gripOffset,weapon:recipe.weapon,
   sourceMeshesHidden:true,nativeBodyUnderlays:nativeAnatomy.length,
   integratedHeadDraws:1,integratedHeadPartCount:headPieces.length,
   nativeMountAdjusted:nativeMountAdjustments,
   nativeMountLargestShift:Number(nativeMountLargestShift.toFixed(4)),
    identityEquipmentPieces:recipe.pieces.filter(p=>p.id.startsWith('identity-')).length,
   sourceCostumeHidden:true,height:recipe.statureMeters,anatomyBridges:CINEMATIC_ANATOMY_LINKS.length,activeAnatomyBridges:()=>activeBridges,
   suppressedLongAnatomyBridges:()=>rejectedLongBridges,sync,
   dispose:()=>{for(const batch of batches)batch.mesh.dispose();bridge.dispose();}
  });
 }catch(e){
  // Anchors have been reparented to skeleton bones; remove them as well as
  // visible meshes on failure, preserving complete original GLB fallback.
  for(const anchor of anchors)anchor.removeFromParent();
  for(const item of built){item.removeFromParent();if(item.isInstancedMesh)item.dispose();}
  group.removeFromParent();
  actor.assetRoot.traverse(obj=>{if(obj.isMesh)obj.visible=true;});
  Object.values(geometry).forEach(g=>g.dispose());
  Object.values(mat).forEach(m=>m.dispose());
  console.warn('[DUNGEON] cinematic figure fallback to original GLB:',String(e));
  return null;
 }
}
