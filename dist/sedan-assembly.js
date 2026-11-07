import * as THREE from 'three';

export function assembleSedan(scene,sedan,engineAsset){
  const car=new THREE.Group();scene.add(car);const root=sedan.scene;car.add(root);root.updateMatrixWorld(true);
  let b=new THREE.Box3().setFromObject(root);root.scale.setScalar(5.9/b.getSize(new THREE.Vector3()).x);root.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(root);const c=b.getCenter(new THREE.Vector3());root.position.set(-c.x,-b.min.y+.04,-c.z);root.updateMatrixWorld(true);
  const moving=[];const worldCenter=o=>new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  function makeGroup(nodes,id,delta){const box=new THREE.Box3();nodes.forEach(n=>box.union(new THREE.Box3().setFromObject(n)));const p=box.getCenter(new THREE.Vector3()),g=new THREE.Group();g.position.copy(p);car.add(g);nodes.forEach(n=>g.attach(n));g.traverse(o=>{if(o.isMesh)o.userData.part=id;});moving.push({g,id,base:p.clone(),delta:new THREE.Vector3(...delta)});return g;}
  const nodes=[];root.traverse(n=>{if(n.isMesh)nodes.push(n);});
  const wheelSets=[[],[],[],[]],body=[],roof=[],interior=[];
  const tyres=nodes.filter(n=>/Sculpted_tyre/.test(n.name));const centers=tyres.map(worldCenter);
  for(const n of nodes){n.castShadow=true;n.receiveShadow=true;n.userData.part='body';const name=n.name;const p=worldCenter(n);
    if(/107.reused|Brake.caliper|Brake.rotor|Rotor.drill|Siped.tread|Ventilated.brake/.test(name)){let i=0;for(let k=1;k<centers.length;k++)if(p.distanceToSquared(centers[k])<p.distanceToSquared(centers[i]))i=k;wheelSets[i].push(n);}
    else if(/Adjustable|Cabin.carpet|Center.console|Contoured.seat|Instrument.panel|Steering/.test(name))interior.push(n);
    else if(/roof|pillar|windshield|side.door.glass|Sloping.rear.glass|Wiper|glazing|Beltline|Shark.fin/i.test(name))roof.push(n);
    else body.push(n);
    for(const m of Array.isArray(n.material)?n.material:[n.material]){m.envMapIntensity=1;if(m.name==='paint'){m.color.set(0x53777b);m.metalness=.65;m.roughness=.27;m.clearcoat=1;m.clearcoatRoughness=.15;}if(/glass/i.test(m.name)){m.transmission=0;m.transparent=true;m.opacity=.48;m.color.set(0x354b53);m.roughness=.15;m.depthWrite=false;}if(m.map)m.map.anisotropy=4;}
  }
  makeGroup(body,'body',[0,2.65,0]);makeGroup(roof,'body',[0,3.65,0]);
  const wheels=wheelSets.map((nodes,i)=>{const p=centers[i];return makeGroup(nodes,'tools',[Math.sign(p.x)*.95,.1,Math.sign(p.z)*2.15]);});
  const chassis=new THREE.Mesh(new THREE.BoxGeometry(5.2,.14,1.8),new THREE.MeshStandardMaterial({color:0x47504d,metalness:.65,roughness:.5}));chassis.position.y=.32;chassis.castShadow=true;chassis.receiveShadow=true;car.add(chassis);
  const model=engineAsset.scene;model.rotation.y=-Math.PI/2;model.updateMatrixWorld(true);let eb=new THREE.Box3().setFromObject(model);model.scale.setScalar(1.42/eb.getSize(new THREE.Vector3()).z);model.updateMatrixWorld(true);eb=new THREE.Box3().setFromObject(model);const ec=eb.getCenter(new THREE.Vector3());model.position.sub(ec);const engine=new THREE.Group();engine.add(model);engine.position.set(-1.85,.83,0);car.add(engine);engine.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.part='engine';}});moving.push({g:engine,id:'engine',base:engine.position.clone(),delta:new THREE.Vector3(-3.7,1.4,1.6)});
  return{car,moving,wheels,engine};
}
