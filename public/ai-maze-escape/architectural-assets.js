import {GLTFLoader} from '/maze/vendor/loaders/GLTFLoader.js';

// Four actual Quaternius CC0 medieval architectural meshes.
// Converted to self-contained glTF binary and tinted with original maze palettes.
// Geometry decorates ONLY public cells and non-interactive cinematic horizons.
export async function loadArchitecturePack(THREE){
  const loader=new GLTFLoader();
  const names=['Wall_Arch','DoorFrame_Round_Brick','Roof_Tower_RoundTiles','Prop_Vine4'];
  const loaded=await Promise.allSettled(names.map(name=>
    loader.loadAsync('/maze/models/'+name+'.glb')
  ));
  const models=new Map();
  for(let i=0;i<names.length;i++){
    const item=loaded[i];
    if(item.status!=='fulfilled'||!item.value?.scene)continue;
    const scene=item.value.scene;
    const box=new THREE.Box3().setFromObject(scene);
    const size=new THREE.Vector3(),center=new THREE.Vector3();
    box.getSize(size);box.getCenter(center);
    if(!Number.isFinite(size.y)||size.y<.01)continue;
    scene.traverse(obj=>{
      if(!obj.isMesh)return;
      obj.castShadow=false;
      obj.receiveShadow=true;
    });
    models.set(names[i],{scene,size,center,minY:box.min.y});
  }
  if(!models.size)throw new Error('CC0 architecture bundle could not load');
  function spawn(name,parent,{x,y=0,z,height=2.8,yaw=0}){
    const entry=models.get(name);
    if(!entry||!parent||![x,y,z,height,yaw].every(Number.isFinite))return null;
    const k=height/entry.size.y;
    const container=new THREE.Group();
    container.name='CC0 '+name+' scenic mesh';
    const mesh=entry.scene.clone(true);
    mesh.scale.setScalar(k);
    mesh.position.set(-entry.center.x*k,-entry.minY*k,-entry.center.z*k);
    container.add(mesh);
    container.position.set(x,y,z);
    container.rotation.y=yaw;
    container.userData.decorativeOnly=true;
    parent.add(container);
    return container;
  }
  const stats={status:'loaded',names:[...models.keys()],source:'Quaternius Medieval Village MegaKit CC0'};
  return {spawn,models,stats};
}
