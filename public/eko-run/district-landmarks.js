// EKO RUN: distinctive original Lagos neighborhood hero landmark kit.
// Purely decorative — every mesh stays behind z=-5 so no live hazard becomes hidden.
// Small crafted foreground landmarks help each district have a memorably different skyline.
export function buildDistrictLandmarks(THREE,{terrain,district,length,box,cylinder,ball,labelSprite,material,quality='high'}){
  const root=new THREE.Group();root.name='Eko district identity landmarks';terrain.add(root);
  const counts={meshes:0,signs:0,arches:0};
  const variants={
    'mainland-morning':{name:'EKO CULTURE',primary:0x21c8ba,secondary:0xffc55a,trim:0xf4deab,roof:0x125976},
    'market-rush':{name:'OJA ARCADE',primary:0xf5687c,secondary:0xffca58,trim:0xf0e2b4,roof:0x7b3f8b},
    'danfo-junction':{name:'DANFO TERMINAL',primary:0xffc73d,secondary:0x38c0bb,trim:0xfff1b8,roof:0x164e63},
    'rainy-lagos':{name:'LAGOON HOUSE',primary:0x5caee2,secondary:0xa6d8dd,trim:0xd5e7ee,roof:0x294c80},
    'island-night':{name:'EKO NEON',primary:0xa48cff,secondary:0xff8e7b,trim:0xfce5b6,roof:0x343667},
    'bridge-run':{name:'THIRD MAINLAND',primary:0x70e5d0,secondary:0xffc77b,trim:0xe4eff1,roof:0x26718e}
  };
  const p=variants[district]||variants['mainland-morning'];
  const stations=Math.max(1,Math.floor(Math.min(length,176)/68));
  const signs=[];
  const radiusGeo=new THREE.TorusGeometry(.84,.095,7,14,Math.PI);
  const displayPlateGeo=new THREE.CylinderGeometry(1.16,1.16,.18,12);
  const instancing=quality==='high';
  const facadeMaterial=material(p.primary),archMaterial=material(p.trim);
  function b(w,h,d,x,y,z,color){
    counts.meshes++;
    return box(root,w,h,d,x,y,z,color,false);
  }
  function arch(x,y,z,r=1.05,hex=p.trim){
    // Recognizable actual curved arch, not another rectangular block.
    const archMesh=new THREE.Mesh(radiusGeo,material(hex));
    archMesh.position.set(x,y,z);
    archMesh.rotation.set(0,0,0);
    archMesh.scale.set(r,r,.95);
    root.add(archMesh);counts.meshes++;counts.arches++;
    b(r*.14,1.48,.18,x-r*.84,y-.75,z,hex);
    b(r*.14,1.48,.18,x+r*.84,y-.75,z,hex);
  }
  function sign(txt,x,y,z,size=.7){
    signs.push(txt);
    counts.signs++;
    labelSprite(root,txt,x,y,z,{scale:size,bg:'#153c53',color:'#fff6d4'});
  }
  function planters(x,z){
    for(const sx of [-1,1]){
      b(.95,.38,.94,x+sx*3.9,.2,z,p.roof);
      b(.82,.12,.81,x+sx*3.9,.48,z,p.secondary);
      const hedge=ball(root,.35,x+sx*3.9,.82,z,0x2eac80);
      hedge.scale.set(1.10,.82,.88);counts.meshes++;
      if(quality==='high'){
        for(const dz of [-.28,.28]){
          const leaf=ball(root,.19,x+sx*3.9+sx*.12,1.08,z+dz,0x54c889);
          leaf.scale.set(1.05,1.6,.8);counts.meshes++;
        }
      }
    }
  }
  function crest(x,y,z){
    const disk=new THREE.Mesh(displayPlateGeo,material(p.secondary));
    disk.rotation.z=Math.PI/2;
    disk.position.set(x,y,z);
    root.add(disk);counts.meshes++;
    const sunburst=ball(root,.44,x+.10,y,z,p.trim);
    sunburst.scale.set(.24,1.2,1.2);counts.meshes++;
    b(.12,.70,.07,x+.20,y,z,p.roof);
  }
  for(let site=0;site<stations;site++){
    const x=24+site*68,z=-9.2;
    // Signature pavilion with curved archways, pilasters, sunburst frieze and planters.
    b(8.3,3.75,2.35,x,1.88,z,p.primary);
    b(8.75,.24,2.9,x,3.92,z,p.secondary);
    b(8.8,.09,3.1,x,4.13,z,p.trim);
    b(7.1,.33,.25,x,3.42,z+1.26,p.roof);
    b(7.4,.17,.22,x,3.18,z+1.25,p.trim);
    for(const offset of [-2.5,0,2.5]){
      const xx=x+offset;
      b(1.65,2.15,.05,xx,1.35,z+1.24,0x173d51);
      arch(xx,2.18,z+1.36,.90,p.trim);
      if(offset===0)crest(xx,3.05,z+1.54);
      else b(.20,.20,.06,xx,2.80,z+1.39,p.secondary);
    }
    b(.31,3.5,.26,x-4.0,1.76,z+1.28,p.trim);
    b(.31,3.5,.26,x+4.0,1.76,z+1.28,p.trim);
    sign(site?district==='island-night'?'EKO NIGHT MARKET':'EKO COMMUNITY':p.name,
      x,4.65,z+1.28,quality==='low'?.60:.83);
    planters(x,z+1.5);
    if(district==='market-rush'||district==='mainland-morning'){
      // Bright market scene: sheltered produce display, no flat billboard.
      for(const sx of [-1,1]){
        const xx=x+sx*5.45;
        b(2,.22,1.25,xx,.94,z+1.45,0x9a7050);
        b(2.35,.12,1.40,xx,2.54,z+1.42,p.secondary);
        for(let i=0;i<7;i++){
          const y=1.12+Math.floor(i/4)*.17;
          const fruit=ball(root,.11,xx+(i%4-1.5)*.40,y,z+1.12+(i%2)*.3,i%2?0xffaa58:0x43b97e);
          fruit.scale.set(1,.90,1.1);counts.meshes++;
        }
      }
    }
    if(district==='island-night'){
      // Add cutout light strips rather than many actual point lights.
      for(const dx of [-3.6,3.6]){
        b(.045,2.8,.12,x+dx,2.02,z+1.37,p.secondary);
        b(.10,2.55,.14,x+dx*.91,1.98,z+1.37,0x58cfee);
      }
    }
    if(district==='bridge-run'){
      // Two recognizable cable-stayed towers well outside the active lane.
      for(const dx of [-5.6,5.6]){
        b(.58,8.4,.70,x+dx,4.20,z-2.1,p.roof);
        b(1.35,.30,1.4,x+dx,8.38,z-2.1,p.secondary);
        for(let j=0;j<5;j++){
          const wire=b(.055,5.4-j*.52,.054,x+dx+(dx>0?-1:1)*(j+1)*.30,5.2,z-2.1,p.trim);
          wire.rotation.z=(dx>0?-1:1)*(.17+j*.045);
        }
      }
    }
  }
  root.userData.neverGameplayCollision=true;
  return Object.freeze({district,stations,meshCount:counts.meshes,arches:counts.arches,
    signs:Object.freeze(signs),authorityNeutral:true});
}
