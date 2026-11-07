import * as THREE from 'three';
export function assembleSedan(scene,sedan,engineAsset){
 const car=new THREE.Group();scene.add(car);const root=sedan.scene;car.add(root);root.updateMatrixWorld(true);
 let b=new THREE.Box3().setFromObject(root);root.scale.setScalar(5.9/b.getSize(new THREE.Vector3()).x);root.updateMatrixWorld(true);b.setFromObject(root);const c=b.getCenter(new THREE.Vector3());root.position.set(-c.x,-b.min.y+.04,-c.z);root.updateMatrixWorld(true);
 const moving=[],wheels=[];
 const paint=new THREE.MeshPhysicalMaterial({color:0x637d89,metalness:.72,roughness:.27,clearcoat:1,clearcoatRoughness:.16});
 root.traverse(n=>{if(!n.isMesh)return;n.castShadow=n.receiveShadow=true;const name=n.material.name;
  // Ramses light-effect meshes are shader overlays, not physical lamp surfaces.
  if(/LightEffect/.test(name)){n.visible=false;n.castShadow=n.receiveShadow=false;return;}
  if(name==='M_E_common_Paint')n.material=paint;
  else{n.material=n.material.clone();const m=n.material;m.envMapIntensity=1;
   if(/Headlights|Taillights/.test(n.name)){
    const lens=/Lens|lens/.test(n.name),red=/red/.test(n.name),dark=/body|plastic_black_glossy/.test(n.name);
    m.transparent=lens;m.opacity=lens?(red?.48:.18):1;m.depthWrite=!lens;
    m.color.set(red?0xa9101e:dark?0x11191d:/opaque_lightgray/.test(n.name)?0xd9dedc:/glass_gray/.test(n.name)?0x4c5356:/glass_glossy/.test(n.name)?0x81969c:/chrome|alu_glossy/.test(n.name)?0xc4cdcf:0x171d20);
    m.metalness=/chrome|alu_glossy/.test(n.name)?.9:.15;m.roughness=lens?.09:.24;
    n.castShadow=!lens;n.receiveShadow=!lens;
   }
   else if(/Glass|Lens/.test(name)){m.transparent=true;m.opacity=/red/.test(name)?.85:.42;m.color.set(/red/.test(name)?0x9c1726:0x263e48);m.depthWrite=false;m.roughness=.16;}
   else if(/Tire/.test(name)){m.color.set(0x171c1d);m.roughness=.85;}
   else if(/Chrome|Aluminum|Rim|Brake/.test(name)){m.color.set(/black/.test(name)?0x252a2d:0xbac5c9);m.metalness=.85;m.roughness=.28;}
   else if(/M_I_/.test(name)){m.color.set(0x4f4540);m.roughness=.8;}
   else if(/Plastic|M_none/.test(name)){m.color.set(0x1c2326);m.roughness=.55;}
   else if(/LightEffect|Emission/.test(name)){m.color.set(0xe6eceb);m.emissive?.set(/_B/.test(name)?0x621018:0x747d7e);}
  }
 });
 function group(nodes,id,key,name,delta){const box=new THREE.Box3();nodes.forEach(n=>box.union(new THREE.Box3().setFromObject(n)));const p=box.getCenter(new THREE.Vector3()),g=new THREE.Group();g.name=key;g.position.copy(p);car.add(g);nodes.forEach(n=>g.attach(n));g.userData={part:id,partName:name};g.traverse(o=>{if(o.isMesh){o.userData.part=id;o.userData.focusKey=key;}});moving.push({g,id,base:p.clone(),delta:new THREE.Vector3(...delta)});return g;}
 // Inner rear lamps are mounted on the tailgate; retain their world transform.
 const tailgate=root.getObjectByName('tailgate'),innerLamps=root.getObjectByName('Pivot_Taillights');
 if(tailgate&&innerLamps){root.updateMatrixWorld(true);tailgate.attach(innerLamps);}
 const body=[],cabin=[];
 for(const node of [...root.children]){const key=node.name;
  if(key.startsWith('wheel')){const p=new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());wheels.push(group([node],'tools',key,'车轮',[Math.sign(p.x)*.65,-.05,Math.sign(p.z)*2.7]));}
  else if(key.startsWith('door')){const p=new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());group([node],'tools',key,key.includes('_F')?'前车门':'后车门',[key.includes('_F')?-.5:.65,.7,Math.sign(p.z)*1.75]);}
  else if(key==='hood')group([node],'tools',key,'引擎盖',[-1.2,3.1,0]);
  else if(key==='tailgate')group([node],'tools',key,'后备厢门',[1.65,1.6,0]);
  else if(key==='interior_Interior_Color'||key==='interior_Interior_non-Color')cabin.push(node);
  else if(key.startsWith('interior'))group([node],'tools',key,key.includes('Steering')?'方向盘':'座椅',[0,0,0]);
  else body.push(node);
 }
 group(cabin,'tools','cabin','座舱',[0,0,0]);
 group(body,'tools','body','车身',[0,2.3,0]);
 const chassis=new THREE.Mesh(new THREE.BoxGeometry(5.1,.14,1.8),new THREE.MeshStandardMaterial({color:0x47504d,metalness:.65,roughness:.5}));chassis.position.y=.35;chassis.castShadow=chassis.receiveShadow=true;car.add(chassis);group([chassis],'tools','chassis','底盘',[0,0,0]);
 const model=engineAsset.scene;model.rotation.y=-Math.PI/2;model.updateMatrixWorld(true);let eb=new THREE.Box3().setFromObject(model);model.scale.setScalar(1.42/eb.getSize(new THREE.Vector3()).z);model.updateMatrixWorld(true);eb.setFromObject(model);model.position.sub(eb.getCenter(new THREE.Vector3()));const engine=new THREE.Group();engine.add(model);engine.position.set(-1.7,.9,0);car.add(engine);engine.name='engine';engine.userData.partName='发动机';engine.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.part='engine';o.userData.focusKey='engine';}});moving.push({g:engine,id:'engine',base:engine.position.clone(),delta:new THREE.Vector3(-3.5,1.1,1.7)});
 return{car,moving,wheels,engine};
}
