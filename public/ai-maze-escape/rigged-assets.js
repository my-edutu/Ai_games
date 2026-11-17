import {GLTFLoader} from '/maze/vendor/loaders/GLTFLoader.js';

// Optional CC0-licensed Quaternius humanoid: a real skeletal base model.
// The procedural Wayfinder remains playable if the GLB cannot be loaded.
export function attachRiggedWayfinder(THREE,hero,{keepMaterials=[],onReady=()=>{},onError=()=>{}}={}){
  if(!hero||!hero.isObject3D)throw new TypeError('Expected a Three.js explorer');
  const report={status:'loading',source:'Quaternius Universal Base Characters (CC0)',meshes:0,bones:0};
  const start=performance.now();
  const fallbackMeshes=[...hero.children];
  const fallbackMaterials=new Set(keepMaterials);
  const loader=new GLTFLoader();
  return new Promise(resolve=>{
    loader.load('/maze/models/wayfinder-rig.glb',gltf=>{
      try{
        const root=gltf.scene;
        if(!root||!root.isObject3D)throw new Error('Malformed GLB');
        let meshes=0,bones=0;
        root.traverse(part=>{
          if(part.isBone)bones++;
          if(!part.isMesh)return;
          meshes++;
          part.castShadow=true;
          part.receiveShadow=true;
          const lower=String(part.name||'').toLowerCase();
          const previous=part.material;
          if(lower.includes('eyebrow')){
            part.material=new THREE.MeshStandardMaterial({color:0x222a38,roughness:.93});
          }else if(lower.includes('eye')){
            part.material=new THREE.MeshStandardMaterial({
              color:0x9affec,emissive:0x165f75,emissiveIntensity:.68,
              metalness:.1,roughness:.39
            });
          }else{
            part.material=new THREE.MeshStandardMaterial({
              color:0xd4b6a1,metalness:.12,roughness:.78,
              side:THREE.FrontSide
            });
          }
          // The downloaded prepared material is not shared with authored world art.
          if(previous!==part.material&&previous?.dispose)previous.dispose();
        });
        if(meshes<3||bones<20)throw new Error('Rigged model does not meet geometry floor');
        const names=['thigh_l','thigh_r','calf_l','calf_r',
          'upperarm_l','upperarm_r','lowerarm_l','lowerarm_r',
          'Head','neck_01','spine_01','spine_02','pelvis'];
        const rig={};
        for(const name of names){
          const node=root.getObjectByName(name);
          if(node&&node.isBone)rig[name]={node,rest:node.rotation.clone()};
        }
        if(!rig.thigh_l||!rig.thigh_r||!rig.upperarm_l||!rig.upperarm_r)
          throw new Error('Incomplete humanoid movement rig');
        // Keep the authored cape, travel armor, backpack and lantern above the human mesh.
        // Hide only the low-detail primitive mannequin and its old pivot groups.
        for(const part of fallbackMeshes){
          if(part===hero.userData.capeRig||part===hero.userData.lantern||part===hero.userData.halo)continue;
          if(part.isMesh&&fallbackMaterials.has(part.material))continue;
          part.visible=false;
        }
        root.position.set(0,0,0);
        root.rotation.y=0;
        hero.add(root);
        hero.userData.highDetailRig=root;
        hero.userData.riggedAnimation=(now,moving,spotted,reducedMotion)=>{
          const fast=spotted?0.012:.009;
          const wave=Math.sin(now*fast);
          const stride=reducedMotion?0:moving?Math.max(-.52,Math.min(.52,wave*.47)):0;
          const sway=reducedMotion?0:Math.sin(now*.0018)*.036;
          for(const [name,side] of [['thigh_l',1],['thigh_r',-1]]){
            const b=rig[name];if(b)b.node.rotation.x=b.rest.x+stride*side;
          }
          for(const [name,side] of [['calf_l',1],['calf_r',-1]]){
            const b=rig[name];
            if(b)b.node.rotation.x=b.rest.x+
              (reducedMotion?0:moving?Math.max(0,-wave*side)*.28:0);
          }
          for(const [name,side] of [['upperarm_l',1],['upperarm_r',-1]]){
            const b=rig[name];
            if(b)b.node.rotation.x=b.rest.x-stride*side*.78;
          }
          for(const name of ['spine_01','spine_02']){
            const b=rig[name];if(b)b.node.rotation.z=b.rest.z+sway;
          }
          const head=rig.Head;
          if(head)head.node.rotation.y=head.rest.y+
            (reducedMotion?0:Math.sin(now*.0021)*(spotted?.16:.24));
        };
        report.status='loaded';report.meshes=meshes;report.bones=bones;
        report.loadMs=Math.round(performance.now()-start);
        window.__MAZE_3D_MODEL__={...report};
        onReady({...report});
        resolve({...report});
      }catch(error){
        // Roll back to the fully functioning original procedural body.
        hero.userData.highDetailRig?.removeFromParent();
        for(const part of fallbackMeshes)part.visible=true;
        report.status='fallback';
        window.__MAZE_3D_MODEL__={...report};
        onError(error);
        resolve({...report});
      }
    },undefined,error=>{
      report.status='fallback';
      window.__MAZE_3D_MODEL__={...report,error:'asset-unavailable'};
      onError(error);
      resolve({...report});
    });
  });
}
