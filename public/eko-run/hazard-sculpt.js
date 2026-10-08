// Eko Run: original hazard art grammar. Each hazard has a recognizable silhouette.
// Render only. Every model must preserve the public authoritative collision location.
export function sculptStreetHazard(THREE,parent,h,{box,ball,cylinder,material,labelSprite,makeBus,makePedestrian}){
  if(!h || !Number.isFinite(h.width)|| !Number.isFinite(h.height))throw new TypeError('Invalid public hazard');
  const g=new THREE.Group();g.name='hazard-visual:'+h.family;parent.add(g);
  const family=h.family, width=h.width, height=h.height;
  let featureCount=0;
  function b(w,hg,d,x,y,z,hex){
    const node=box(g,w,hg,d,x,y,z,hex,false);featureCount++;return node;
  }
  function sphere(radius,x,y,z,hex,sx=1,sy=1,sz=1){
    const node=ball(g,radius,x,y,z,hex);node.scale.set(sx,sy,sz);featureCount++;return node;
  }
  function cyl(rt,rb,hg,x,y,z,hex){
    const node=cylinder(g,rt,rb,hg,x,y,z,hex);featureCount++;return node;
  }
  function disk(radius,x,y,z,hex){
    const mesh=new THREE.Mesh(new THREE.CircleGeometry(radius,18),material(hex));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=false;
    g.add(mesh);featureCount++;return mesh;
  }
  const caution=0xffca55,red=0xef7057,dark=0x12222a,light=0xf2e7c7;
  if(family==='danfo-pull-out'||family==='molue-crossing'){
    const bus=makeBus(g,0,0,family==='molue-crossing'?5:1);
    bus.scale.set(family==='molue-crossing'?1.2:.91,.86,family==='molue-crossing'?1.14:1);
    bus.rotation.y=family==='molue-crossing'?.04:-.08;
    b(.12,.19,2.1,-width*.52,.10,0,red);
    b(.12,.19,2.1,width*.52,.10,0,red);
  }else if(family==='pothole'||family==='open-drain'||family==='construction-trench'){
    const isTrench=family==='construction-trench',isDrain=family==='open-drain';
    const w=width*(isTrench?1.18:1.04),depth=isTrench?2.4:isDrain?1.65:1.2;
    const opening=b(w,.055,depth,0,.015,0,dark);
    opening.material=material(0x101c27,.18,.78);
    b(w+.12,.06,.10,0,.071,-depth*.51,0x77736b);
    b(w+.12,.06,.10,0,.071,depth*.51,0xa5a49b);
    if(!isDrain&&!isTrench){
      for(let i=0;i<7;i++){
        const x=(i-3)*w*.12,z=(i%3-1)*.19;
        sphere(.08,x,.058,z,i%2?0x535452:0x393e41,.85,.17,.9);
      }
      sphere(.23,.1,.04,-.1,0x2e4047,.77,.12,1.1);
    }else {
      for(let k=0;k<3;k++){
        b(.08,.024,depth*.78,(k-1)*w*.26,.055,0,0x445261);
      }
      for(const side of [-1,1]){
        b(.06,.50,.07,side*w*.56,.26,-depth*.28,0xc7c4b4);
        b(.06,.50,.07,side*w*.56,.26,depth*.28,0xc7c4b4);
        b(.10,.10,depth*.77,side*w*.56,.46,0,caution);
      }
      b(w+.28,.08,.12,0,.12,-depth*.62,caution);
      b(w+.28,.08,.12,0,.12,depth*.62,caution);
      if(isTrench)for(let i=0;i<4;i++)b(.19,.065,.13,(i-1.5)*w*.24,.16,-depth*.62,dark);
    }
  }else if(family==='flood-puddle'){
    for(let n=0;n<5;n++){
      const x=(n-2)*width*.16, z=(n%3-1)*.28;
      const puddle=disk(width*(.29+n*.025),x,.025+n*.003,z,n%2?0x4db5d1:0x62e0f0);
      puddle.scale.set(1,.62,1);
    }
    b(width*.76,.018,1.25,0,.026,0,0x5a9fac);
    for(let j=0;j<3;j++){
      const ring=new THREE.Mesh(new THREE.RingGeometry(.14+j*.11,.145+j*.11,22),
        new THREE.MeshBasicMaterial({color:0xd9f8ff,transparent:true,opacity:.62,side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2;ring.position.set((j-1)*width*.21,.057,-.10);
      g.add(ring);featureCount++;
    }
  }else if(family==='handcart'){
    b(width*.8,.09,1.0,0,.96,0,0x936d47);
    b(width*.8,.4,.98,0,1.20,0,0x39a78b);
    for(const s of [-1,1]){
      b(.075,.82,.075,s*width*.36,.49,0,0x4d5b5c);
      const wheel=cyl(.24,.24,.12,s*width*.36,.32,.52,0x232d31);wheel.rotation.x=Math.PI/2;
      const hub=cyl(.09,.09,.14,s*width*.36,.32,.58,0xf0d6a1);hub.rotation.x=Math.PI/2;
    }
    b(.09,.08,1.6,0,1.10,.90,0x6c5743);
    for(let fruit=0;fruit<10;fruit++)
      sphere(.12,(fruit%5-2)*.15,1.51,Math.floor(fruit/5)*.30-.22,
        fruit%3?0xfeb856:0x4ac97c);
  }else if(family==='rolling-object'){
    sphere(.45,0,.44,0,0xd47750,1,1,1);
    for(const side of [-1,1]){
      b(.38,.055,.055,0,.37,side*.40,caution);
      sphere(.09,0,.43,side*.43,0x6a4e36);
    }
  }else if(family==='temporary-block'){
    b(width,.55,.60,0,.40,0,0xbcc5b8);
    b(width+.10,.12,.72,0,.80,0,caution);
    for(let j=0;j<5;j++)b(.17,.14,.77,-width*.40+j*width*.20,.65,0,j%2===0?red:light);
    for(const s of [-1,1]){
      b(.10,.82,.09,s*width*.43,.65,0,dark);
      b(.45,.08,.52,s*width*.43,.14,0,dark);
    }
  }else if(family==='crowd-compression'||family==='street-disturbance'){
    const xes=[-.57,0,.57];
    for(let i=0;i<xes.length;i++){
      const entity=new THREE.Group();entity.position.set(xes[i],0,(i-1)*.20);g.add(entity);
      makePedestrian(entity,0,0,i+12);featureCount++;
    }
    b(width+.12,.085,.10,0,.11,-.80,caution);
  }else{
    b(Math.max(.55,width),Math.max(.14,height*.68),.7,0,Math.max(.11,height*.35),0,red);
  }
  // Warning cues live ABOVE the obstacle but are compact to avoid cinematic clutter.
  const marker=sphere(.11,0,Math.max(1.0,height+.30),0,caution,1.1,1.1,1.1);
  marker.name='hazard-warning-beacon';marker.visible=false;
  const cue=h.legalResponses.includes('jump')?'JUMP':h.legalResponses.includes('slide')?'SLIDE':
    h.legalResponses.includes('vault')?'VAULT':h.legalResponses.includes('slow')?'SLOW':'WAIT';
  labelSprite(g,cue,0,Math.max(1.75,height+1.04),0,{scale:.35,bg:'#692f3a',color:'#fff4bf'});
  return {root:g,marker,featureCount,artFamily:family,warning:cue};
}
