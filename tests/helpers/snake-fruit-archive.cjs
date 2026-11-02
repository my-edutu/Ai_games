'use strict';
const begin='  // BEGIN R44 HARVEST FRUIT REPROFILE\n';
const end='  // END R44 HARVEST FRUIT REPROFILE\n';
const anchor='  const crown=new THREE.Mesh(geometry(new THREE.OctahedronGeometry(.13)),gold);crown.position.y=1.19;fruit.add(crown);\n';
function block(source){
  const a=source.indexOf(begin),b=source.indexOf(end);
  if(a<0||b<=a||source.indexOf(begin,a+1)>=0||source.indexOf(end,b+1)>=0)
    throw new Error('Expected one reversible R44 fruit block');
  return {a,b,body:source.slice(a,b+end.length)};
}
function stripR44Fruit(source){
  const {a,b}=block(source);
  return source.slice(0,a)+source.slice(b+end.length);
}
function reapplyR44Fruit(historical,current){
  const {body}=block(current);
  if(historical.includes(begin)||historical.split(anchor).length!==2)
    throw new Error('R44 historical insertion anchor is not unique');
  return historical.replace(anchor,anchor+body);
}
module.exports={stripR44Fruit,reapplyR44Fruit};
