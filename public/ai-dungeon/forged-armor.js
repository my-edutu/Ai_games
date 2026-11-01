/**
 * Original forged platework attached to the actual animated Dungeon rigs.
 * A bounded shell profile gives each class defined shoulders, chest, flutes,
 * mask and greaves rather than the previous spherical/cylindrical overlays.
 * Presentation only: no simulation state, damage, navigation, RNG or network.
 */
const PROFILES=Object.freeze({
 vanguard:Object.freeze({name:'bastion',shoulders:1.18,waist:.88,hem:1.00,keel:.065,flutes:8}),
 ranger:Object.freeze({name:'wayfinder',shoulders:.92,waist:.78,hem:.88,keel:.035,flutes:10}),
 mystic:Object.freeze({name:'oracle',shoulders:.91,waist:.94,hem:1.18,keel:.040,flutes:12}),
 revenant:Object.freeze({name:'hollow',shoulders:1.09,waist:.72,hem:.86,keel:.09,flutes:6}),
 cultist:Object.freeze({name:'penitent',shoulders:.87,waist:.91,hem:1.13,keel:.052,flutes:9}),
 warden:Object.freeze({name:'oathbreaker',shoulders:1.30,waist:.96,hem:1.19,keel:.11,flutes:10})
});
export function planForgedArmor(kind){
 return typeof kind==='string'&&Object.hasOwn(PROFILES,kind)?PROFILES[kind]:null;
}
const PROFILES_Y=Object.freeze({
 cuirass:Object.freeze([[-.50,.34,.32],[-.43,.39,.39],[-.36,.41,.44],[-.18,.44,.46],[.02,.50,.51],[.22,.56,.52],[.37,.50,.46],[.47,.34,.34],[.50,.29,.30]]),
 pauldron:Object.freeze([[-.50,.38,.37],[-.44,.51,.46],[-.34,.56,.51],[-.17,.59,.53],[.12,.50,.46],[.32,.29,.29],[.47,.10,.12],[.50,.065,.09]]),
 vambrace:Object.freeze([[-.50,.23,.22],[-.44,.28,.28],[-.31,.27,.27],[0,.32,.32],[.25,.40,.37],[.42,.47,.41],[.50,.42,.38]]),
 greave:Object.freeze([[-.50,.28,.27],[-.42,.32,.30],[-.29,.28,.31],[-.05,.32,.34],[.21,.38,.38],[.39,.45,.42],[.50,.39,.38]]),
 fauld:Object.freeze([[-.50,.57,.53],[-.43,.61,.56],[-.32,.58,.54],[-.22,.53,.49],[.19,.45,.43],[.42,.39,.38],[.50,.37,.36]]),
 mask:Object.freeze([[-.50,.23,.24],[-.40,.29,.31],[-.25,.34,.37],[0,.36,.40],[.29,.34,.35],[.44,.28,.29],[.50,.22,.23]])
});
const SEGMENTS=24,TAU=Math.PI*2;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function forgeShell(THREE,kind,profile){
 const rings=PROFILES_Y[kind];
 if(!rings)throw Error('Unsupported forged shell shape');
 const positions=[],uvs=[],indices=[];
 for(let row=0;row<rings.length;row++){
  const [y,rx,rz]=rings[row],t=clamp(y+.5,0,1);
  const shoulder=t*t*(3-2*t);
  const width=kind==='cuirass'?profile.waist+(profile.shoulders-profile.waist)*shoulder:
   kind==='pauldron'?profile.shoulders:kind==='fauld'?profile.hem:1;
  for(let j=0;j<=SEGMENTS;j++){
   const a=j/SEGMENTS*TAU,s=Math.sin(a),c=Math.cos(a);
   const fluteAmplitude=kind==='cuirass'?.023:kind==='pauldron'?.019:kind==='fauld'?.027:.013;
   const fluted=1+fluteAmplitude*Math.cos(profile.flutes*a);
   const keel=(kind==='mask'?1.15:kind==='cuirass'?.78:0)*profile.keel*Math.pow(Math.max(0,-s),10);
   const forgedRidge=(kind==='greave'||kind==='vambrace')?.010*Math.cos(2*a)*Math.sin(Math.PI*t):0;
   positions.push(rx*width*fluted*c,y,rz*fluted*s-keel-forgedRidge);
   uvs.push(j/SEGMENTS,t);
  }
 }
 for(let row=0;row<rings.length-1;row++)for(let j=0;j<SEGMENTS;j++){
  const a=row*(SEGMENTS+1)+j,b=a+1,c=a+SEGMENTS+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 // Solid end caps: the close-up lens must not reveal open black tubes.
 const bottom=positions.length/3;
 positions.push(0,rings[0][0],0);uvs.push(.5,0);
 const top=positions.length/3;
 positions.push(0,rings[rings.length-1][0],0);uvs.push(.5,1);
 const last=(rings.length-1)*(SEGMENTS+1);
 for(let j=0;j<SEGMENTS;j++){
  indices.push(bottom,j,j+1);
  indices.push(top,last+j+1,last+j);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.name='Original '+profile.name+' forged '+kind;
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 geometry.computeBoundingBox();
 return geometry;
}
export function createForgedArmorForms(THREE,kind){
 const profile=planForgedArmor(kind);
 if(!profile||!THREE?.BufferGeometry||!THREE?.TorusGeometry)return null;
 return {
  cuirass:forgeShell(THREE,'cuirass',profile),
  pauldron:forgeShell(THREE,'pauldron',profile),
  vambrace:forgeShell(THREE,'vambrace',profile),
  greave:forgeShell(THREE,'greave',profile),
  fauld:forgeShell(THREE,'fauld',profile),
  mask:forgeShell(THREE,'mask',profile),
  collar:new THREE.TorusGeometry(.5,.10,9,24),
  rib:new THREE.TorusGeometry(.5,.08,9,24,Math.PI),
  tabard:new THREE.BoxGeometry(1,1,.15)
 };
}
