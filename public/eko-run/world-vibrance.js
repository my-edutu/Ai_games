// EKO / CITY VIBRANCE PASS
// Original stylized Lagos art direction. Cosmetics only: no simulation coordinates change.
export function composeStreetVibrance(THREE, { terrain, box, ball, cylinder, labelSprite, material, district, length, quality }) {
  const colors = {
    'mainland-morning':{walls:[0xffa96c,0x1ca4aa,0xf5d378,0x676ad5],awnings:[0xff6d4e,0xffd154,0x21c8b4,0x7a62cc],leaf:0x3cbb84,cloth:0xffca59},
    'market-rush':{walls:[0xfa7e6f,0x21c6ae,0xf9cc63,0xba68c3],awnings:[0xff586c,0x00baa7,0xffbd3f,0x9457d2],leaf:0x44c97f,cloth:0xfaa263},
    'danfo-junction':{walls:[0xffb84f,0x5ec5e2,0xdb5c59,0xf0d79b],awnings:[0xfcc32f,0xfa743e,0x3ec6cb,0xdf5977],leaf:0x53b889,cloth:0xffb540},
    'rainy-lagos':{walls:[0x4b9bb6,0x4d8bc0,0xb5b6e9,0xffaa7a],awnings:[0x469ac5,0x645b9a,0x19b9ad,0xe9ad65],leaf:0x468b80,cloth:0x6ccee7},
    'island-night':{walls:[0x4f537c,0x365d79,0x77507c,0x788bb4],awnings:[0xff8d6c,0xa78eff,0x42d3de,0xedca74],leaf:0x3b8a81,cloth:0xb59fff},
    'bridge-run':{walls:[0x70bfc5,0xc8b58f,0xfbb668,0x8cb1bd],awnings:[0x25c3b8,0xf0ba67,0xea8774,0x528db0],leaf:0x5aac87,cloth:0xffb975}
  };
  const p=colors[district]||colors['mainland-morning'];
  let features=0;
  const maxX=Math.min(184,length);
  const h=(v)=>{let n=(Math.imul((v|0)+17,2654435761)>>>0);n^=n>>>16;n=Math.imul(n,2246822507)>>>0;return (n>>>0)/4294967295;};
  const choose=(array,n)=>array[Math.floor(h(n)*array.length)%array.length];
  const group=new THREE.Group();group.name='Eko vibrant street block';terrain.add(group);
  function b(w,hg,d,x,y,z,c) { features++;return box(group,w,hg,d,x,y,z,c,false); }
  function sp(text,x,y,z,scale=.52,fg='#fff4cf',bg='#154758') {
    features++;return labelSprite(group,text,x,y,z,{scale,color:fg,bg});
  }
  function pole(x,z,top=5.8){
    cylinder(group,.065,.09,top,x,top/2,z,0x52666a,10);features++;
    b(.4,.09,.48,x,top,z,0xabb9b5);
  }
  // Palette-rich painted facade slabs, overhanging roof edges, roll-up doors and market signage.
  // All visible close-architecture sits beyond far sidewalk (negative Z): no runner obstruction.
  for(let block=0;block<Math.ceil(maxX/14);block++){
    const x=block*14-1.7;
    const z=-9.2-(block%3)*.33;
    const facade=choose(p.walls,block+101);
    const height=4.6+h(block+202)*2.8;
    b(5.4,height,3.1,x,height/2,z,facade);
    b(5.9,.23,3.4,x,height+.12,z,0xf3e6c2);
    b(5.85,.12,3.45,x,height+.25,z,choose(p.awnings,block+119));
    b(5.15,.12,.17,x,2.72,z+1.66,0x17384a);
    b(5.1,.72,1.2,x,2.48,z+2.01,choose(p.awnings,block+22));
    for(let stripe=0;stripe<7;stripe++)
      b(.24,.62,1.25,x-2.22+stripe*.72,2.32,z+2.03,stripe%2?0xfaf0d1:choose(p.awnings,block+22));
    b(4.3,.18,.24,x,3.13,z+1.71,0x112d40);
    b(3.85,1.78,.10,x,1.27,z+1.66,0x194759);
    for(let stripe=0;stripe<10;stripe++)
      b(3.7,.032,.115,x,.48+stripe*.13,z+1.73,stripe%2?0x6592a5:0x367186);
    for(let pane=0;pane<3;pane++){
      const wx=x-1.6+pane*1.6;
      b(1.02,.92,.08,wx,height-1.20,z+1.68,0x215274);
      b(.08,1.03,.14,wx,height-1.20,z+1.76,0xdad1b3);
      b(1.19,.10,.16,wx,height-1.73,z+1.81,0xd9d9b8);
    }
    const shopNames=['EKO GOODS','LAGOS JOLLOF','OJA MARKET','YABA EXPRESS','IKOTA CAFE','VIBE & STYLE','OJUELEGBA','FRESH PICK'];
    if(block%2===0)sp(shopNames[block%shopNames.length],x,3.31,z+2.15,.47,'#fff5c8','#122f48');
    if(block%3===1){
      b(1.8,.14,.95,x-1.55,.74,z+2.23,0x95754d);
      for(let basket=0;basket<3;basket++){
        const fz=z+2.06+basket*.3;
        for(let fruit=0;fruit<3;fruit++){
          ball(group,.11,x-2.12+fruit*.22,.90,fz,choose([0xffb73c,0x6ac270,0xf46f4c],fruit+basket+block));features++;
        }
      }
    }
    // Festive folded fabrics on a rack keep the signature Nigerian street color and texture.
    if(block%4===2 && quality!=='low'){
      for(let stripe=0;stripe<6;stripe++)
        b(.29,1.34,.035,x+2.0,1.28,z+2.08+(stripe-3)*.17,choose(p.awnings,block+stripe));
      b(.08,1.42,.10,x+2.0,1.33,z+2.09,0x335b60);
    }
    // Luminous display light in the shopfront, without costly per-shop point lights.
    b(4.2,.035,.15,x,2.12,z+1.93,district==='island-night'?0xffd68c:0xece1c8);
    features++;
  }
  // Signature landmark every 42 metres. Horizontal clearance and hazard recognition preserved.
  const landmarkNames=['WELCOME TO EKO','LAGOS NEVER SLEEPS','MOVE WITH THE CITY','STREET RUN'];
  for(let i=0;i<Math.ceil(maxX/42);i++){
    const x=14+i*42,z=-5.45;
    pole(x,z,6.0);
    b(4.8,1.95,.28,x+2.43,6.45,z,0x0c3447);
    b(4.56,1.73,.32,x+2.44,6.46,z+.09,choose(p.walls,i+300));
    b(4.34,1.36,.33,x+2.44,6.48,z+.26,0x153d53);
    sp(landmarkNames[i%landmarkNames.length],x+2.43,6.50,z+.48,.85,'#fff5bd','#185368');
    b(1.4,.09,.2,x+2.48,5.51,z+.26,0xfbcf6e);
  }
  // Hand-painted colorful geometric murals form recognizable neighborhoods instead of endless grey boxes.
  for(let i=0;i<Math.ceil(maxX/28);i++){
    const x=i*28+9,z=-13.6;
    b(7.1,3.5,.32,x,2.0,z,0x1b6479);
    b(6.5,3.08,.35,x,2.0,z+.02,choose(p.walls,i+778));
    for(let j=0;j<7;j++){
      const y=.80+j*.33;
      const w=1.4+.2*(j%3);
      b(w,.20,.38,x-2.25+j*.78,y,z+.21,choose(p.awnings,j+i*13));
    }
    sp(i%2?'EKO TO THE WORLD':'THIS IS LAGOS',x,3.12,z+.65,.58,'#fffada','#244b63');
  }
  // Layered distant colored rooftops and shipping-container stacks.
  if(quality!=='low'){
    for(let i=0;i<Math.ceil(maxX/12);i++){
      const x=i*12-3.2,depth=-20-(i%3)*2;
      const height=8+h(i+17)*7;
      b(4.0,height,2.5,x,height*.5,depth,choose(p.walls,i+40));
      b(4.18,.3,2.65,x,height+.12,depth,0x2c5363);
      for(let floor=1;floor<=5;floor++){
        if(floor*1.65>height-.5)break;
        for(let pane=-1;pane<=1;pane++){
          b(.54,.52,.05,x+pane*.95,floor*1.65,depth+1.29,district==='island-night'?0xffcb83:0x2b536c);
        }
      }
      if(i%4===0){
        b(1.8,.5,1.4,x+1.1,height+.48,depth,0x3b8497);
        cylinder(group,.30,.30,.8,x-1.1,height+.58,depth,0x286d9f,12);features++;
      }
    }
  }
  // Elegant striped crosswalk decals — location readable, no collision interaction.
  for(let i=0;i<Math.ceil(maxX/40);i++){
    const x=5+i*40;
    for(let stripe=0;stripe<7;stripe++)
      b(.21,.018,5.4,x+stripe*.55,-.025,0,0xefe9c8);
  }
  // Palm trees and city garden planters only on far side; occlusion avoidance is intentional.
  for(let i=0;i<Math.ceil(maxX/22);i++){
    const x=7+i*22;
    const z=-5.3;
    b(2.3,.54,1.0,x,.27,z,0x71655a);
    for(let k=0;k<4;k++){
      const xx=x-0.70+k*.45;
      ball(group,.28,xx,.68,z,choose([p.leaf,0x388f6b,0x5cc48c],k+i));features++;
    }
    cylinder(group,.11,.18,3.3,x,2.05,z,0x7d6049,9);features++;
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3,ex=x+Math.cos(a)*1.10,ez=z+Math.sin(a)*.9;
      const leaf=ball(group,.57,ex,3.72+Math.sin(a)*.19,ez,p.leaf);
      leaf.scale.set(1.7,.48,.74);leaf.rotation.y=a;features++;
    }
  }
  return Object.freeze({kind:'original-lagos-chromatic',features,blocks:Math.ceil(maxX/14),district});
}
