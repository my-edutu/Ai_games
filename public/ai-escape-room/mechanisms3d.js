'use strict';
(function () {
  const THREE=window.THREE;if(!THREE)return;
  const geometries=new Map(),TAU=Math.PI*2;
  const cached=(key,create)=>{if(!geometries.has(key))geometries.set(key,create());return geometries.get(key);};
  const box=(x=.3,y=.3,z=.12)=>cached(`b:${x}:${y}:${z}`,()=>new THREE.BoxGeometry(x,y,z));
  const cyl=(r=.1,h=.1,segments=24)=>cached(`c:${r}:${h}:${segments}`,()=>new THREE.CylinderGeometry(r,r,h,segments));
  const torus=(r=.2,t=.025,segments=r>.3?64:32)=>cached(`t:${r}:${t}:${segments}`,()=>new THREE.TorusGeometry(r,t,8,segments));
  const sphere=(r=.08,segments=16)=>cached(`s:${r}:${segments}`,()=>new THREE.SphereGeometry(r,segments,Math.max(8,segments/2)));
  function bevel(w,h,d,r=.035) {
    return cached(`bevel:${w}:${h}:${d}:${r}`,()=>{
      const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
      const g=new THREE.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:1,curveSegments:4});g.translate(0,0,-d/2);return g;
    });
  }
  function polygon(radius,sides,depth=.02,phase=0) {
    return cached(`poly:${radius}:${sides}:${depth}:${phase}`,()=>{const s=new THREE.Shape();for(let i=0;i<sides;i++){const a=phase+Math.PI/2+i*TAU/sides,x=Math.cos(a)*radius,y=Math.sin(a)*radius;if(i)s.lineTo(x,y);else s.moveTo(x,y);}s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1});g.translate(0,0,-depth/2);return g;});
  }
  function machinedRim(outer,inner,depth,segments=64) {
    return cached(`rim:${outer}:${inner}:${depth}:${segments}`,()=>{
      const b=Math.min(.005,depth/4,(outer-inner)/4),h=depth/2;
      const profile=[[inner,-h+b],[inner+b,-h],[outer-b,-h],[outer,-h+b],[outer,h-b],[outer-b,h],[inner+b,h],[inner,h-b],[inner,-h+b]];
      const geometry=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),segments);geometry.rotateX(Math.PI/2);return geometry;
    });
  }
  function quadrantPlate() {
    return cached('vault-quadrant-plate',()=>{
      const shape=new THREE.Shape(),span=.66;shape.absarc(0,0,.555,-span,span,false);shape.lineTo(Math.cos(span)*.255,Math.sin(span)*.255);shape.absarc(0,0,.255,span,-span,true);shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:.032,steps:1,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1,curveSegments:12});geometry.translate(0,0,-.016);return geometry;
    });
  }
  function cog(outer,root,count,depth,bore) {
    return cached(`cog:${outer}:${root}:${count}:${depth}:${bore}`,()=>{
      const shape=new THREE.Shape();
      for(let tooth=0;tooth<count;tooth++)for(const [offset,r] of [[-.45,root],[-.20,outer],[.20,outer],[.45,root]]){const a=(tooth+offset)*TAU/count,x=Math.cos(a)*r,y=Math.sin(a)*r;if(tooth===0&&offset===-.45)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
      const hole=new THREE.Path();hole.absarc(0,0,bore,0,TAU,true);shape.holes.push(hole);
      for(let i=0;i<3;i++){const a=i*TAU/3,cutout=new THREE.Path();cutout.absarc(Math.cos(a)*outer*.59,Math.sin(a)*outer*.59,outer*.13,0,TAU,true);shape.holes.push(cutout);}
      const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,curveSegments:5});geometry.translate(0,0,-depth/2);return geometry;
    });
  }
  function fineMetal(geometry) {
    // A fixed set of cached profiles shares the room's iron map at a finer scale.
    return cached(`fine-metal:${geometry.uuid}`,()=>{const copy=geometry.clone(),uv=copy.getAttribute('uv');if(uv)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*4,uv.getY(i)*4);return copy;});
  }
  function forgedSpoke() {
    return cached('vault-forged-spoke',()=>{
      const shape=new THREE.Shape();shape.moveTo(.06,-.025);shape.lineTo(.12,-.032);shape.lineTo(.253,-.021);shape.lineTo(.283,-.036);shape.lineTo(.297,-.018);shape.lineTo(.297,.018);shape.lineTo(.283,.036);shape.lineTo(.253,.021);shape.lineTo(.12,.032);shape.lineTo(.06,.025);shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth:.027,steps:1,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:1});geometry.translate(0,0,-.0135);return geometry;
    });
  }
  function add(group,geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]) {const value=new THREE.Mesh(geometry,material);value.position.set(...position);value.rotation.set(...rotation);value.scale.set(...scale);value.castShadow=true;value.receiveShadow=true;group.add(value);return value;}
  function rod(group,from,to,r,material) {const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a),value=add(group,cyl(r,d.length(),12),material,a.add(b).multiplyScalar(.5).toArray());value.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return value;}
  function ring(group,m,r,t,z=0) {return add(group,torus(r,t),m,[0,0,z]);}
  function disc(group,m,r,depth,z=0) {return add(group,cyl(r,depth,40),m,[0,0,z],[Math.PI/2,0,0]);}
  const variant=object=>Math.abs(Number(object.placement?.variant)||0)%8;
  function screw(group,m,x,y,z,r=.016) {add(group,cyl(r,.016,12),m.brass,[x,y,z],[Math.PI/2,0,0]);add(group,box(r*1.2,.003,.003),m.dark,[x,y,z+.009],[0,0,.5]);}
  function flangeBolt(group,m,x,y,z,r=.017) {add(group,cyl(r*1.45,.008,12),m.dark,[x,y,z-.008],[Math.PI/2,0,0]);add(group,polygon(r,6,.012,Math.PI/6),m.brass,[x,y,z]);add(group,box(r*.9,.0025,.002),m.dark,[x,y,z+.011],[0,0,.45]);}
  function romanIndex(group,material,text,x,y,z,angle=0) {
    const spacing=.011,width=(text.length-1)*spacing;
    for(let i=0;i<text.length;i++){
      const offset=i*spacing-width/2;
      const stroke=(dx,tilt)=>add(group,box(.0022,.022,.0015),material,[x+Math.cos(angle)*(offset+dx),y+Math.sin(angle)*(offset+dx),z],[0,0,angle+tilt]);
      if(text[i]==='I')stroke(0,0);else{stroke(-.0035,text[i]==='V'?.32:-.32);stroke(.0035,text[i]==='V'?-.32:.32);}
    }
  }
  function radialMarks(group,m,r,z,count=40,length=.025) {for(let i=0;i<count;i++){const a=i*TAU/count,l=i%5===0?length*1.65:length;add(group,box(i%5===0?.009:.004,l,.005),m,[Math.sin(a)*(r-l/2),Math.cos(a)*(r-l/2),z],[0,0,-a]);}}
  function teeth(group,m,r,z,count=28,depth=.045) {for(let i=0;i<count;i++){const a=i*TAU/count;add(group,box(.025,.055,depth),m,[Math.sin(a)*r,Math.cos(a)*r,z],[0,0,-a]);}}
  function artifact(kind,object) {
    const g=new THREE.Group(),root=new THREE.Group();root.name='crafted-housing';g.add(root);
    g.userData={mechanismKind:kind,staticRoot:root,animatedParts:[],preserveArticulation:true,solved:Boolean(object.solved),inspected:Boolean(object.inspected),motion:{progress:object.solved?1:0}};return g;
  }
  function moving(g,name) {const part=new THREE.Group();part.name=name;g.add(part);g.userData.animatedParts.push(part);return part;}
  function seal(g) {
    // A movable assembly remains a real pivot, but its rigid decorative details are batched.
    for(const part of g.userData.animatedParts)if(!part.userData.keepInstances)window.EscapeScenery?.merge(part);
    animate(g,0,0,true);return g;
  }
  function housing(root,m,w,h,depth=.17) {
    add(root,bevel(w,h,depth,.045),m.wood,[0,0,-.035]);
    add(root,bevel(w-.04,h-.04,.045,.035),m.brass,[0,0,.065]);
    add(root,bevel(w-.075,h-.075,.035,.025),m.dark,[0,0,.094]);
    for(const side of[-1,1]){add(root,box(.014,h-.12,.009),m.brass,[side*(w/2-.065),0,.12]);add(root,box(w-.12,.014,.009),m.brass,[0,side*(h/2-.065),.12]);}
    for(const x of[-1,1])for(const y of[-1,1])screw(root,m,x*(w/2-.045),y*(h/2-.045),.14);
    for(const side of[-1,1])add(root,polygon(.034,4,.012,Math.PI/4),m.brass,[side*(w/2-.10),h/2-.10,.125]);
    add(root,bevel(w*.30,.055,.008,.01),m.brass,[0,-h/2+.068,.125]);
    for(let i=0;i<5;i++)add(root,box(.018+i%2*.008,.003,.003),m.dark,[(i-2)*.03,-h/2+.068,.132]);
  }
  function sequenceLock(object,ctx) {
    const m=ctx.materials,g=artifact('sequence-lock',object),s=g.userData.staticRoot;housing(s,m,1.02,.61,.2);
    rod(s,[-.43,0,.2],[.43,0,.2],.024,m.metal);
    const drums=moving(g,'four-knurled-drums');drums.position.z=.21;
    for(let i=0;i<4;i++) {
      const x=(i-1.5)*.205;
      add(drums,cyl(.118,.15,32),m.brass,[x,0,0],[0,0,Math.PI/2]);
      for(const offset of[-.068,.068])add(drums,torus(.118,.009),m.metal,[x+offset,0,0],[0,Math.PI/2,0]);
      for(let j=0;j<20;j++){const a=j*TAU/20;add(drums,box(.11,.012,.012),j%5===0?m.paper:m.dark,[x,Math.sin(a)*.119,Math.cos(a)*.119],[a,0,0]);}
      // These are slot markers, not an invented solution code.
      for(let bar=0;bar<=i;bar++)add(s,box(.006,.032,.004),m.paper,[x+(bar-i/2)*.012,.198,.13]);
      add(s,polygon(.019,3,.006,Math.PI),m.brass,[x,.146,.132]);
    }
    const bolt=moving(g,'release-bolt');add(bolt,bevel(.70,.07,.06,.02),m.metal,[0,-.178,.17]);
    for(const x of[-.31,.31])add(bolt,cyl(.027,.12,16),m.brass,[x,-.178,.19],[Math.PI/2,0,0]);
    g.userData.parts={drums,bolt};return seal(g);
  }
  function symbolCipher(object,ctx) {
    const m=ctx.materials,g=artifact('symbol-cipher',object),s=g.userData.staticRoot;housing(s,m,.83,.87,.19);
    disc(s,m.metal,.335,.06,.14);ring(s,m.brass,.339,.019,.178);ring(s,m.dark,.306,.015,.186);radialMarks(s,m.paper,.30,.186,36,.017);
    const rotor=moving(g,'cipher-medallion-carousel');rotor.position.z=.20;
    ring(rotor,m.brass,.231,.015,0);ring(rotor,m.metal,.16,.009,0);
    for(let i=0;i<3;i++) {
      const a=i*TAU/3+Math.PI/2,x=Math.cos(a)*.20,y=Math.sin(a)*.20;
      add(rotor,cyl(.083,.024,24),m.brass,[x,y,0],[Math.PI/2,0,0]);add(rotor,cyl(.067,.025,24),m.paper,[x,y,.008],[Math.PI/2,0,0]);
      if(i===0)add(rotor,polygon(.04,3,.005),m.ink,[x,y,.026]);
      else if(i===1)add(rotor,box(.052,.052,.006),m.ink,[x,y,.026],[0,0,Math.PI/4]);
      else add(rotor,torus(.029,.005),m.ink,[x,y,.026]);
    }
    disc(rotor,m.brass,.062,.04,.024);screw(rotor,m,0,0,.05,.023);
    const tray=moving(g,'cipher-compartment');add(tray,bevel(.46,.085,.08,.015),m.wood,[0,-.34,.12]);add(tray,torus(.032,.007),m.brass,[0,-.34,.173]);
    g.userData.parts={rotor,tray};return seal(g);
  }
  function shapeOrder(object,ctx) {
    const m=ctx.materials,g=artifact('shape-order',object),s=g.userData.staticRoot;housing(s,m,.94,.67,.22);
    const tokens=moving(g,'three-inlaid-tokens');
    for(let i=0;i<3;i++) {
      const x=(i-1)*.245,sides=[3,4,6][i];
      add(s,cyl(.116,.018,32),m.brass,[x,.015,.13],[Math.PI/2,0,0]);add(s,polygon(.092,sides,.026,i===1?Math.PI/4:0),m.ink,[x,.015,.15]);
      add(tokens,polygon(.078,sides,.045,i===1?Math.PI/4:0),m.paper,[x,.015,.205]);add(tokens,polygon(.057,sides,.008,i===1?Math.PI/4:0),m.brass,[x,.015,.234]);
      add(s,box(.12,.007,.006),m.brass,[x,-.16,.14]);
    }
    const clasp=moving(g,'locking-clasp');add(clasp,bevel(.60,.048,.04,.01),m.brass,[0,-.115,.18]);for(const x of[-.26,.26])add(clasp,box(.035,.17,.05),m.metal,[x,-.04,.17]);
    g.userData.parts={tokens,clasp};return seal(g);
  }
  function toolDependency(object,ctx) {
    const m=ctx.materials,g=artifact('tool-dependency',object),s=g.userData.staticRoot;housing(s,m,.67,.79,.23);
    disc(s,m.brass,.205,.045,.145);ring(s,m.metal,.182,.012,.177);radialMarks(s,m.dark,.155,.175,24,.016);
    add(s,cyl(.045,.014,24),m.ink,[0,.036,.181],[Math.PI/2,0,0]);add(s,box(.035,.108,.016),m.ink,[0,-.027,.184]);
    for(const x of[-.23,.23])rod(s,[x,-.22,.15],[x,.22,.15],.023,m.brass);
    const key=moving(g,'turned-skeleton-key');key.position.set(0,.035,.20);
    rod(key,[0,0,0],[0,0,.27],.022,m.brass);add(key,box(.065,.032,.027),m.brass,[.03,-.04,.07]);add(key,torus(.071,.014),m.brass,[0,0,.30]);add(key,torus(.038,.006),m.metal,[0,0,.302]);
    const bolt=moving(g,'retracted-key-bolt');add(bolt,bevel(.46,.06,.06,.015),m.metal,[0,-.235,.15]);
    const hatch=moving(g,'unlocked-tool-compartment');hatch.position.set(-.23,-.28,.12);add(hatch,bevel(.46,.14,.05,.015),m.wood,[.23,0,.01]);add(hatch,box(.028,.06,.025),m.brass,[.40,0,.05]);
    g.userData.parts={key,bolt,hatch};return seal(g);
  }
  function switchNetwork(object,ctx) {
    const m=ctx.materials,g=artifact('switch-network',object),s=g.userData.staticRoot;housing(s,m,.99,.77,.19);
    const toggles=moving(g,'five-porcelain-switches');toggles.position.set(0,.065,.19);
    for(let i=0;i<5;i++) {
      const x=(i-2)*.158;
      add(s,bevel(.112,.265,.03,.025),m.metal,[x,.045,.137]);add(s,box(.028,.184,.025),m.ink,[x,.045,.163]);
      add(toggles,cyl(.037,.07,20),m.brass,[x,0,0],[0,0,Math.PI/2]);rod(toggles,[x,0,0],[x,.10,.03],.013,m.brass);add(toggles,sphere(.032),m.paper,[x,.11,.032]);
      add(s,cyl(.021,.018,16),object.solved?m.success:m.brass,[x,.247,.15],[Math.PI/2,0,0]);
      rod(s,[x,-.12,.147],[x,-.19-(i%2)*.025,.147],.007,m.brass);
      if(i<4)rod(s,[x,-.19-(i%2)*.025,.147],[x+.158,-.19-((i+1)%2)*.025,.147],.007,m.brass);
    }
    const bridge=moving(g,'circuit-release-bridge');add(bridge,bevel(.62,.066,.04,.012),m.brass,[0,-.23,.175]);add(bridge,box(.23,.016,.014),m.paper,[0,-.23,.201]);
    g.userData.parts={toggles,bridge};return seal(g);
  }
  function balanceClue(object,ctx) {
    const m=ctx.materials,g=artifact('balance-clue',object),s=g.userData.staticRoot;
    add(s,bevel(.61,.38,.15,.045),m.wood,[0,-.13,0],[Math.PI/2,0,0]);add(s,cyl(.13,.06,32),m.brass,[0,-.03,0]);
    rod(s,[0,-.02,0],[0,.38,0],.029,m.brass);for(const y of[.035,.27])add(s,torus(.055,.01),m.metal,[0,y,0],[Math.PI/2,0,0]);
    add(s,sphere(.055),m.brass,[0,.38,0]);
    const beam=moving(g,'balance-crossbeam');beam.position.y=.38;rod(beam,[-.34,0,0],[.34,0,0],.022,m.brass);for(const x of[-.34,.34])add(beam,sphere(.035),m.metal,[x,0,0]);
    add(beam,box(.01,.135,.014),m.brass,[0,-.07,.035]);
    const pans=[];
    for(const side of[-1,1]) {
      const pan=moving(g,side<0?'left-hanging-pan':'right-hanging-pan');pan.userData.side=side;
      for(let i=0;i<3;i++){const a=i*TAU/3;rod(pan,[0,0,0],[Math.sin(a)*.125,-.22,Math.cos(a)*.125],.005,m.brass);}
      add(pan,cyl(.132,.022,24),m.metal,[0,-.23,0]);add(pan,torus(.131,.009),m.brass,[0,-.22,0],[Math.PI/2,0,0]);add(pan,cyl(.037,.07,20),m.brass,[0,-.185,0]);add(pan,sphere(.017),m.brass,[0,-.14,0]);pans.push(pan);
    }
    g.userData.parts={beam,pans};return seal(g);
  }
  function directionPattern(object,ctx) {
    const m=ctx.materials,g=artifact('direction-pattern',object),s=g.userData.staticRoot;housing(s,m,.81,.86,.17);
    disc(s,m.brass,.326,.045,.135);disc(s,m.paper,.297,.022,.163);ring(s,m.metal,.3,.012,.18);radialMarks(s,m.ink,.282,.179,48,.017);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;add(s,polygon(.041,3,.006,a),m.ink,[Math.sin(a)*.218,Math.cos(a)*.218,.18]);}
    ring(s,m.brass,.166,.006,.18);ring(s,m.brass,.08,.005,.18);
    const needle=moving(g,'compass-needle');needle.position.z=.205;
    const hand=cached('compass-hand',()=>{const shape=new THREE.Shape();shape.moveTo(0,.205);shape.lineTo(.035,-.065);shape.lineTo(0,-.045);shape.lineTo(-.035,-.065);shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.01,bevelEnabled:false});});
    add(needle,hand,m.brass);add(needle,hand,m.dark,[0,0,0],[0,0,Math.PI]);disc(needle,m.brass,.042,.035,.015);screw(needle,m,0,0,.04,.013);
    const slider=moving(g,'compass-release-slide');add(slider,bevel(.42,.07,.06,.015),m.metal,[0,-.34,.15]);add(slider,torus(.025,.006),m.brass,[0,-.34,.185]);
    g.userData.parts={needle,slider,angle:variant(object)*Math.PI/4};return seal(g);
  }
  function finalVault(object,ctx) {
    const m=ctx.materials,g=artifact('final-vault',object),s=g.userData.staticRoot;
    // One recessed cast housing, separate service plates, and a flat machined
    // flange replace the old stack of round rails around an empty black face.
    add(s,fineMetal(polygon(.69,64,.15)),m.metal,[0,0,-.006]);
    add(s,machinedRim(.675,.557,.07),m.brass,[0,0,.110]);
    add(s,machinedRim(.688,.674,.018),m.dark,[0,0,.148]);
    disc(s,m.dark,.558,.032,.108);
    for(let i=0;i<4;i++)add(s,fineMetal(quadrantPlate()),m.metal,[0,0,.134],[0,0,i*Math.PI/2]);
    radialMarks(s,m.dark,.655,.148,96,.017);
    const numerals=['I','II','III','IV','V','VI','VII','VIII'];
    for(let i=0;i<8;i++){
      const a=i*TAU/8,between=a+Math.PI/8,c=Math.cos(a),sn=Math.sin(a);
      flangeBolt(s,m,Math.cos(between)*.658,Math.sin(between)*.658,.153);
      romanIndex(s,m.dark,numerals[i],Math.cos(between)*.602,Math.sin(between)*.602,.148,between-Math.PI/2);
      // The iron guide cheeks enclose each sliding bolt. Small retaining screws
      // belong to the cheeks, not to arbitrary points on the dial.
      add(s,bevel(.094,.154,.055,.018),m.dark,[c*.571,sn*.571,.171],[0,0,a-Math.PI/2]);
      add(s,fineMetal(bevel(.077,.139,.018,.012)),m.metal,[c*.571,sn*.571,.202],[0,0,a-Math.PI/2]);
      add(s,box(.045,.145,.004),m.dark,[c*.571,sn*.571,.214],[0,0,a-Math.PI/2]);
      for(const side of[-1,1])screw(s,m,c*(.571+side*.047)-sn*side*.033,sn*(.571+side*.047)+c*side*.033,.220,.009);
      const anchorAngle=a+(i%2===0?.20:-.20);
      add(s,cyl(.025,.032,16),m.brass,[Math.cos(anchorAngle)*.244,Math.sin(anchorAngle)*.244,.224],[Math.PI/2,0,0]);
    }
    // These are instrument graduations and a workshop crest, never a solution.
    add(s,bevel(.192,.074,.021,.016),m.brass,[0,.486,.174]);
    add(s,bevel(.165,.047,.009,.010),m.dark,[0,.486,.190]);
    romanIndex(s,m.brass,'VIII',0,.486,.196);
    for(const x of[-.079,.079])screw(s,m,x,.486,.197,.007);

    const gearLayout=[Math.PI/6,Math.PI*5/6,Math.PI*3/2].map(angle=>({angle,x:Math.cos(angle)*.326,y:Math.sin(angle)*.326,phase:angle*3+Math.PI+Math.PI/16}));
    for(const gear of gearLayout){
      const c=Math.cos(gear.angle),sn=Math.sin(gear.angle);
      add(s,cyl(.131,.016,32),m.dark,[gear.x,gear.y,.150],[Math.PI/2,0,0]);
      add(s,cyl(.024,.100,16),m.metal,[gear.x,gear.y,.202],[Math.PI/2,0,0]);
      // A bridge actually reaches the gear bearing and the outer service plate.
      add(s,fineMetal(bevel(.054,.228,.025,.014)),m.metal,[c*.409,sn*.409,.253],[0,0,gear.angle-Math.PI/2]);
      add(s,box(.012,.110,.004),m.brass,[c*.442,sn*.442,.277],[0,0,gear.angle-Math.PI/2]);
      add(s,cyl(.036,.064,20),m.brass,[gear.x,gear.y,.240],[Math.PI/2,0,0]);
      add(s,cyl(.025,.012,16),m.dark,[gear.x,gear.y,.276],[Math.PI/2,0,0]);
      screw(s,m,gear.x,gear.y,.287,.017);flangeBolt(s,m,c*.507,sn*.507,.279,.014);
    }

    const wheel=moving(g,'six-spoke-vault-wheel');wheel.position.z=.205;
    add(wheel,fineMetal(cog(.228,.202,32,.032,.065)),m.metal,[0,0,-.028]);
    disc(wheel,m.brass,.081,.078,.022);
    add(wheel,machinedRim(.301,.273,.036),m.brass,[0,0,.105]);
    add(wheel,machinedRim(.296,.292,.002),m.dark,[0,0,.125]);
    for(let i=0;i<6;i++) {
      const a=i*TAU/6,c=Math.cos(a),sn=Math.sin(a);
      add(wheel,forgedSpoke(),m.brass,[0,0,.105],[0,0,a]);
      add(wheel,box(.117,.008,.002),m.dark,[c*.182,sn*.182,.125],[0,0,a]);
      if(i%2===0){
        add(wheel,cyl(.022,.081,16),m.wood,[c*.286,sn*.286,.171],[Math.PI/2,0,0]);
        for(const z of[.136,.211])add(wheel,cyl(.026,.013,16),m.brass,[c*.286,sn*.286,z],[Math.PI/2,0,0]);
        screw(wheel,m,c*.286,sn*.286,.222,.012);
      }else flangeBolt(wheel,m,c*.286,sn*.286,.135,.013);
    }
    disc(wheel,m.brass,.093,.058,.120);add(wheel,machinedRim(.075,.059,.013,40),m.dark,[0,0,.155]);
    add(wheel,polygon(.050,6,.010,Math.PI/6),m.brass,[0,0,.166]);screw(wheel,m,0,0,.179,.023);
    const bolts=moving(g,'eight-radial-locking-bolts');bolts.userData.keepInstances=true;
    const instances=(geometry,material,count)=>{const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.castShadow=true;mesh.receiveShadow=true;bolts.add(mesh);return mesh;};
    const boltInstances=instances(fineMetal(cyl(.027,.16,16)),m.metal,8);
    const gearInstances=instances(cog(.120,.094,16,.028,.027),m.brass,gearLayout.length);
    const linkInstances=instances(cyl(.008,1,10),m.metal,8),sleeveInstances=instances(cyl(.014,1,10),m.brass,8),jointInstances=instances(cyl(.016,.026,12),m.brass,16);
    const sealPlate=moving(g,'released-vault-seal');add(sealPlate,bevel(.27,.10,.04,.015),object.solved?m.success:m.brass,[0,-.52,.205]);
    add(sealPlate,bevel(.174,.050,.008,.010),m.dark,[0,-.52,.232]);romanIndex(sealPlate,object.solved?m.success:m.brass,'VIII',0,-.52,.238);
    for(const x of[-.10,.10])screw(sealPlate,m,x,-.52,.23,.012);
    g.userData.parts={wheel,bolts,boltInstances,sealPlate,gearInstances,gearLayout,linkInstances,sleeveInstances,jointInstances};return seal(g);
  }
  const scratchMatrix=new THREE.Matrix4(),scratchPosition=new THREE.Vector3(),scratchQuaternion=new THREE.Quaternion(),unit=new THREE.Vector3(1,1,1),scratchEuler=new THREE.Euler(),scratchFrom=new THREE.Vector3(),scratchTo=new THREE.Vector3(),scratchDirection=new THREE.Vector3(),scratchScale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  function animate(g,deltaMs,now,reducedMotion=false) {
    if(!g?.userData?.parts)return;const d=g.userData,motion=d.motion,parts=d.parts;
    const alpha=reducedMotion?1:1-Math.exp(-Math.min(100,Math.max(0,deltaMs))*.009);
    motion.progress+=(Number(d.solved)-motion.progress)*alpha;
    const p=motion.progress;
    switch(d.mechanismKind) {
      case'sequence-lock':parts.drums.rotation.x=-p*Math.PI*.72;parts.bolt.position.x=p*.16;parts.bolt.position.z=p*.025;break;
      case'symbol-cipher':parts.rotor.rotation.z=p*Math.PI*2/3;parts.tray.position.set(0,-p*.06,p*.18);break;
      case'shape-order':parts.tokens.position.z=-p*.055;parts.clasp.position.y=p*.14;break;
      case'tool-dependency':parts.key.visible=p>.01;parts.key.rotation.z=-p*Math.PI*.5;parts.bolt.position.x=-p*.17;parts.hatch.rotation.y=-p*1.05;break;
      case'switch-network':parts.toggles.rotation.x=.48-p*.96;parts.bridge.position.x=p*.10;parts.bridge.position.z=p*.04;break;
      case'balance-clue':{const tilt=.17*(1-p);parts.beam.rotation.z=tilt;for(const pan of parts.pans){const x=pan.userData.side*.34;pan.position.set(x*Math.cos(tilt),.38+x*Math.sin(tilt),0);}break;}
      case'direction-pattern':parts.needle.rotation.z=parts.angle-p*Math.PI*.6;parts.slider.position.y=-p*.075;parts.slider.position.z=p*.12;break;
      case'final-vault':{
        parts.wheel.rotation.z=-p*Math.PI*.65;parts.wheel.position.z=.205+p*.015;parts.sealPlate.position.y=-p*.09;
        for(let i=0;i<parts.gearLayout.length;i++){
          const gear=parts.gearLayout[i];scratchPosition.set(gear.x,gear.y,.177+p*.015);scratchEuler.set(0,0,gear.phase-parts.wheel.rotation.z*2);scratchQuaternion.setFromEuler(scratchEuler);scratchMatrix.compose(scratchPosition,scratchQuaternion,unit);parts.gearInstances.setMatrixAt(i,scratchMatrix);
        }
        for(let i=0;i<8;i++){
          const a=i*TAU/8,r=.535-p*.13,c=Math.cos(a),sn=Math.sin(a);
          scratchPosition.set(c*r,sn*r,.19);scratchEuler.set(0,0,a-Math.PI/2);scratchQuaternion.setFromEuler(scratchEuler);scratchMatrix.compose(scratchPosition,scratchQuaternion,unit);parts.boltInstances.setMatrixAt(i,scratchMatrix);
          // Sliding drawbars have fixed bearing pivots and telescopic sleeves.
          // Their visible ends remain joined throughout the inherited bolt travel.
          const anchorAngle=a+(i%2===0?.20:-.20);scratchFrom.set(Math.cos(anchorAngle)*.244,Math.sin(anchorAngle)*.244,.24);scratchTo.set(c*(r-.08),sn*(r-.08),.24);
          scratchDirection.subVectors(scratchTo,scratchFrom);const length=scratchDirection.length();scratchQuaternion.setFromUnitVectors(up,scratchDirection.normalize());scratchPosition.copy(scratchFrom).add(scratchTo).multiplyScalar(.5);scratchScale.set(1,length,1);scratchMatrix.compose(scratchPosition,scratchQuaternion,scratchScale);parts.linkInstances.setMatrixAt(i,scratchMatrix);
          scratchPosition.copy(scratchFrom).lerp(scratchTo,.28);scratchScale.set(1,length*.56,1);scratchMatrix.compose(scratchPosition,scratchQuaternion,scratchScale);parts.sleeveInstances.setMatrixAt(i,scratchMatrix);
          scratchEuler.set(Math.PI/2,0,0);scratchQuaternion.setFromEuler(scratchEuler);
          scratchMatrix.compose(scratchFrom,scratchQuaternion,unit);parts.jointInstances.setMatrixAt(i*2,scratchMatrix);scratchMatrix.compose(scratchTo,scratchQuaternion,unit);parts.jointInstances.setMatrixAt(i*2+1,scratchMatrix);
        }
        for(const mesh of[parts.boltInstances,parts.gearInstances,parts.linkInstances,parts.sleeveInstances,parts.jointInstances])mesh.instanceMatrix.needsUpdate=true;break;
      }
    }
    d.staticRoot.position.z=d.inspected?.004:0;
  }
  function makeClue(object,ctx) {
    const g=new THREE.Group(),m=ctx.materials,v=variant(object);
    for(let i=0;i<3;i++)add(g,box(.38,.007,.27),m.paper,[i*.005,.015+i*.009,0],[0,(i-1)*.035,0]);
    for(let row=0;row<7;row++){const width=.12+(row%3)*.045;add(g,box(width,.001,.003),m.ink,[-.018,.043,-.075+row*.018]);}
    add(g,torus(.04,.002,20),m.ink,[.105,.043,.06],[Math.PI/2,0,0]);add(g,box(.067,.001,.002),m.ink,[.105,.043,.06],[0,.55,0]);
    // The decorative field-note marks do not encode an invented clue or answer.
    add(g,cyl(.026,.008,20),m.wood,[-.135,.047,.086]);add(g,torus(.018,.002,16),m.brass,[-.135,.052,.086],[Math.PI/2,0,0]);
    if(v%2===0){rod(g,[-.16,.055,-.10],[-.05,.055,.09],.005,m.brass);add(g,sphere(.009),m.brass,[-.16,.055,-.10]);}return g;
  }
  function makeTool(object,ctx) {
    const g=new THREE.Group(),m=ctx.materials;rod(g,[0,.065,-.22],[0,.065,.13],.018,m.brass);
    add(g,torus(.085,.015,28),m.brass,[0,.065,.19],[Math.PI/2,0,0]);add(g,torus(.047,.006,24),m.metal,[0,.065,.19],[Math.PI/2,0,0]);
    for(let i=0;i<3;i++)add(g,box(.058-i%2*.018,.024,.023),m.brass,[.02,.065,-.205+i*.034]);
    for(const z of[-.08,.04])add(g,torus(.023,.005,20),m.metal,[0,.065,z]);return g;
  }
  function makeDecoy(object,ctx) {
    const g=new THREE.Group(),m=ctx.materials,v=variant(object)%3;
    if(v===0){add(g,bevel(.29,.39,.055,.015),m.wood,[0,.04,0],[Math.PI/2,0,.08]);add(g,box(.264,.047,.35),m.paper,[0,.08,0]);add(g,box(.29,.012,.39),m.wood,[0,.108,0]);for(const z of[-.13,.13])add(g,box(.29,.003,.012),m.brass,[0,.116,z]);add(g,box(.035,.025,.06),m.brass,[.146,.08,.02]);}
    else if(v===1){add(g,cyl(.115,.25,24),m.metal,[0,.14,0]);add(g,torus(.115,.013),m.brass,[0,.265,0],[Math.PI/2,0,0]);add(g,torus(.115,.012),m.brass,[0,.035,0],[Math.PI/2,0,0]);add(g,cyl(.122,.025,24),m.brass,[0,.28,0]);add(g,sphere(.025),m.brass,[0,.31,0]);for(let i=0;i<12;i++){const a=i*TAU/12;rod(g,[Math.sin(a)*.116,.05,Math.cos(a)*.116],[Math.sin(a)*.116,.25,Math.cos(a)*.116],.004,m.brass);}}
    else{const instrument=new THREE.Group();instrument.position.y=.23;instrument.rotation.z=.4;g.add(instrument);add(instrument,cyl(.065,.29,24),m.brass,[0,0,0],[Math.PI/2,0,0]);for(const z of[-.145,.145])add(instrument,torus(.066,.009),m.metal,[0,0,z]);add(instrument,cyl(.05,.01,24),m.dark,[0,0,.15],[Math.PI/2,0,0]);for(const x of[-.12,.12])rod(g,[x,.018,0],[0,.23,0],.009,m.brass);add(g,box(.28,.025,.14),m.wood,[0,.025,0]);}return g;
  }
  const builders={'sequence-lock':sequenceLock,'symbol-cipher':symbolCipher,'shape-order':shapeOrder,'tool-dependency':toolDependency,'switch-network':switchNetwork,'balance-clue':balanceClue,'direction-pattern':directionPattern,'final-vault':finalVault};
  window.EscapeMechanisms=Object.freeze({supported:Object.keys(builders),build(kind,object,ctx){return builders[kind]?.(object,ctx)??null;},animate,makeClue,makeTool,makeDecoy});
})();
