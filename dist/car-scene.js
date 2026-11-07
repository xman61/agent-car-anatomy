import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { RoomEnvironment } from './environments/RoomEnvironment.js';

export async function createCarScene({state,selectPart,setSpread,reduced}) {
  const viewport=document.querySelector('#viewport'), $=s=>document.querySelector(s);
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;
  viewport.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','汽车三维模型，拖动旋转，点击部件拆解');
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
  scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
  const camera=new THREE.PerspectiveCamera(35,1,.1,80);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=!reduced;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=23;
  controls.maxPolarAngle=Math.PI/2.12;controls.minPolarAngle=.22;controls.autoRotateSpeed=.65;
  function reset(){camera.position.set(-7.4,4.8,8.2);controls.target.set(0,.85,0);controls.update();}
  reset();
  scene.add(new THREE.HemisphereLight(0xffffff,0x99a593,1.2));
  const sun=new THREE.DirectionalLight(0xfff5e8,3.2);sun.position.set(-4,9,4);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xf0f6ff,1.4);fill.position.set(5,4,-7);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:0x48513d,opacity:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(18,36,0xb8c5ae,0xc8d0bf);grid.material.transparent=true;grid.material.opacity=.22;grid.position.y=.005;scene.add(grid);
  const observer=new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(35/2))*Math.max(1,1.28/camera.aspect)));camera.updateProjectionMatrix();});observer.observe(viewport);
  renderer.render(scene,camera);
  const gltf=await new GLTFLoader().loadAsync('./models/car-concept.glb',event=>{if(event.total)$('#loading').textContent=`正在载入汽车 ${Math.round(event.loaded/event.total*100)}%`;});
  const root=gltf.scene;root.rotation.y=-Math.PI/2;root.updateMatrixWorld(true);
  let bounds=new THREE.Box3().setFromObject(root);const scale=5.65/bounds.getSize(new THREE.Vector3()).x;root.scale.setScalar(scale);root.updateMatrixWorld(true);
  bounds=new THREE.Box3().setFromObject(root);const center=bounds.getCenter(new THREE.Vector3());root.position.set(-center.x,-bounds.min.y+.045,-center.z);root.updateMatrixWorld(true);
  const car=new THREE.Group();scene.add(car);car.add(root);
  root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;o.userData.part='body';const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m.envMapIntensity=1.25;if(m.name.includes('Paint 1')||m.name.includes('Paint_1')){m.color.set(0xc56236);m.metalness=.72;m.roughness=.26;m.clearcoat=1;m.clearcoatRoughness=.12;}if(m.transmission>0){m.transmission=0;m.transparent=true;m.opacity=.48;m.color.set(0x39535b);m.metalness=.12;m.roughness=.13;m.depthWrite=false;m.envMapIntensity=.6;}if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}});
  root.updateMatrixWorld(true);
  const moving=[],wheels=[];
  function extract(name,id,delta){const node=root.getObjectByName(name);if(!node)throw Error('Missing car component: '+name);const b=new THREE.Box3().setFromObject(node),p=b.getCenter(new THREE.Vector3()),g=new THREE.Group();g.position.copy(p);car.add(g);g.attach(node);g.traverse(o=>{if(o.isMesh)o.userData.part=id;});moving.push({g,id,base:p.clone(),delta:new THREE.Vector3(...delta)});return g;}
  const engine=extract('Engine','engine',[-.85,1.15,0]);
  const hood=extract('BodyHood','body',[-.15,2.05,0]);
  extract('BodyRoofPanel','body',[0,2.15,0]);
  extract('BodyRearPanelsColor1','body',[.45,1.9,0]);
  for(const name of ['BodyDoorLColor1','BodyDoorRColor1']){const p=new THREE.Box3().setFromObject(root.getObjectByName(name)).getCenter(new THREE.Vector3());extract(name,'tools',[0,.38,Math.sign(p.z)*1.5]);}
  for(const name of ['WheelFrontL','WheelFrontR','WheelRearL','WheelRearR']){const p=new THREE.Box3().setFromObject(root.getObjectByName(name)).getCenter(new THREE.Vector3());wheels.push(extract(name,'tools',[Math.sign(p.x)*.15,.08,Math.sign(p.z)*1.18]));}
  const fuel=new THREE.Group();fuel.position.set(1.48,.63,0);car.add(fuel);
  moving.push({g:fuel,id:'context',base:fuel.position.clone(),delta:new THREE.Vector3(1.05,1.25,0)});
  const metal=new THREE.MeshStandardMaterial({color:0x737d78,metalness:.82,roughness:.32});
  const amber=new THREE.MeshPhysicalMaterial({color:0xf2a33f,metalness:0,roughness:.18,transmission:.15});
  const tankMat=new THREE.MeshPhysicalMaterial({color:0xd1d9d1,metalness:.1,roughness:.13,transparent:true,opacity:.25,depthWrite:false});
  function box(material,size,pos){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.userData.part='context';fuel.add(m);return m;}
  box(tankMat,[.78,.62,1.06],[0,0,0]);const fluid=box(amber,[.68,.48,.96],[0,-.02,0]);
  box(metal,[.82,.045,1.1],[0,-.32,0]);box(metal,[.82,.045,1.1],[0,.32,0]);for(const z of [-.36,.36])box(metal,[.83,.67,.035],[0,0,z]);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.12,24),metal);cap.position.y=.4;cap.userData.part='context';fuel.add(cap);
  const frontWheel=wheels.find(w=>w.position.x<0&&w.position.z>0)||wheels[0];
  const labels=[['engine',engine,new THREE.Vector3(0,.65,0)],['tools',frontWheel,new THREE.Vector3(0,.78,0)],['context',fuel,new THREE.Vector3(0,.65,0)]];
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start,last=0;
  renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(car.children,true).find(h=>h.object.userData.part);if(hit){const id=hit.object.userData.part;if(id==='body')setSpread(state.spread>.5?0:1);else selectPart(id);}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#fallback').hidden=false;$('#labels').hidden=true;});
  $('#loading').hidden=true;viewport.dataset.model='car-concept';
  const tmp=new THREE.Vector3(),fuelColor=new THREE.Color();
  function frame(t){requestAnimationFrame(frame);if(document.hidden)return;const dt=Math.min((t-last)/1000,.05);last=t;const a=reduced?1:1-Math.exp(-7*dt);
    for(const o of moving){const detached=o.id!=='body'&&!state[o.id],amount=detached?Math.max(state.spread,1.15):state.spread;tmp.copy(o.base).addScaledVector(o.delta,amount);if(detached)tmp.y+=.35;o.g.position.lerp(tmp,a);}
    fuel.visible=state.spread>.08||!state.context;
    fluid.scale.y=THREE.MathUtils.lerp(fluid.scale.y,!state.context?.02:state.contextMode==='brief'?.3:1,a);fluid.position.y=-.26+.24*fluid.scale.y;
    amber.color.lerp(fuelColor.set(state.contextMode==='noisy'?0x8b8758:0xf2a33f),a);
    camera.zoom=THREE.MathUtils.lerp(camera.zoom,1.35-state.spread*.3,a);controls.target.y=THREE.MathUtils.lerp(controls.target.y,.85+state.spread*.4,a);camera.updateProjectionMatrix();controls.update();
    for(const [id,g,offset]of labels){const p=g.localToWorld(offset.clone()).project(camera),el=$(`.part-label.${id}`);const shiftX=id==='engine'?-48:id==='context'?40:16,shiftY=id==='tools'?40:-22;el.style.left=`${Math.max(65,Math.min(viewport.clientWidth-65,(p.x*.5+.5)*viewport.clientWidth+shiftX))}px`;el.style.top=`${Math.max(67,Math.min(viewport.clientHeight-30,(-p.y*.5+.5)*viewport.clientHeight+shiftY))}px`;el.style.opacity=p.z<1?'1':'0';}
    renderer.render(scene,camera);
  }requestAnimationFrame(frame);
  return{controls,reset};
}
