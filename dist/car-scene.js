import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { RoomEnvironment } from './environments/RoomEnvironment.js';
import { assembleSedan } from './sedan-assembly.js';
import { createSelectionOutline } from './selection-outline.js';
import { componentFor } from './components.js';
import { brands, createAnimatedSUV } from './brand-models.js';

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
  function reset(){if(focused){fitFocus();return;}camera.position.set(-7.5,5.8,9.2);controls.target.set(0,1,0);controls.update();}
  let focused=null,savedView=null,focusRadius=1;
  reset();
  scene.add(new THREE.HemisphereLight(0xffffff,0x99a593,1.2));
  const sun=new THREE.DirectionalLight(0xfff5e8,3.2);sun.position.set(-4,9,4);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xf0f6ff,1.4);fill.position.set(5,4,-7);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:0x48513d,opacity:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(18,36,0xb8c5ae,0xc8d0bf);grid.material.transparent=true;grid.material.opacity=.22;grid.position.y=.005;scene.add(grid);
  const observer=new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(35/2))*Math.max(1,1.28/camera.aspect)));camera.updateProjectionMatrix();});observer.observe(viewport);
  renderer.render(scene,camera);
  const loader=new GLTFLoader();
  const [sedan,engineAsset]=await Promise.all([loader.loadAsync('./models/bmw-x5.gltf'),loader.loadAsync('./models/engine.glb')]);
  const bmw=assembleSedan(scene,sedan,engineAsset);
  function prepare({car,moving,wheels,engine}){
  const fuel=new THREE.Group();fuel.name='context';fuel.userData.partName='油箱与汽油';fuel.position.set(1.68,.65,0);car.add(fuel);
  moving.push({g:fuel,id:'context',base:fuel.position.clone(),delta:new THREE.Vector3(3.35,.65,-.7)});
  const metal=new THREE.MeshStandardMaterial({color:0x737d78,metalness:.82,roughness:.32});
  const amber=new THREE.MeshPhysicalMaterial({color:0xf2a33f,metalness:0,roughness:.18,transmission:.15});
  const tankMat=new THREE.MeshPhysicalMaterial({color:0xd1d9d1,metalness:.1,roughness:.13,transparent:true,opacity:.25,depthWrite:false});
  function box(material,size,pos){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;m.userData.part='context';m.userData.focusKey='context';fuel.add(m);return m;}
  box(tankMat,[.78,.62,1.06],[0,0,0]);const fluid=box(amber,[.68,.48,.96],[0,-.02,0]);
  box(metal,[.82,.045,1.1],[0,-.32,0]);box(metal,[.82,.045,1.1],[0,.32,0]);for(const z of [-.36,.36])box(metal,[.83,.67,.035],[0,0,z]);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.12,24),metal);cap.position.y=.4;cap.userData.part='context';cap.userData.focusKey='context';fuel.add(cap);
  const frontWheel=wheels.find(w=>w.position.x<0&&w.position.z>0)||wheels[0];
  const labels=[['engine',engine,new THREE.Vector3(0,0,0)],['tools',frontWheel,new THREE.Vector3(0,0,0)],['context',fuel,new THREE.Vector3(0,0,0)]];
    return{car,moving,wheels,engine,fuel,fluid,amber,labels};
  }
  const fleet=new Map([['bmw',prepare(bmw)],...brands.filter(b=>b.id!=='bmw').map(b=>[b.id,prepare(createAnimatedSUV(scene,b,bmw.engine))])]);
  let {car,moving,wheels,engine,fuel,fluid,amber,labels}=fleet.get('bmw');
  let currentBrand='bmw',brandAnimation=null;
  const focusRoot=new THREE.Group();scene.add(focusRoot);
  const selectionColors={engine:0xb7e83f,tools:0x37d5ee,context:0xffbc36};
  const selectionOutline=createSelectionOutline(renderer);
  let highlightedGroup=null,highlightedId=null;
  function highlightPart(id,g){
    highlightedGroup=g;highlightedId=id;
  }
  function fitFocus(){
    const half=THREE.MathUtils.degToRad(camera.fov/2),angle=Math.min(half,Math.atan(Math.tan(half)*camera.aspect));
    const distance=focusRadius/Math.sin(angle)*1.18;
    controls.target.set(0,1,0);camera.position.copy(new THREE.Vector3(-.75,.46,1).normalize().multiplyScalar(distance).add(controls.target));
    camera.zoom=1;controls.minDistance=distance*.55;controls.maxDistance=distance*2.5;camera.updateProjectionMatrix();controls.update();
  }
  function focus(id,key){
    const g=key?moving.find(o=>o.g.name===key)?.g:labels.find(o=>o[0]===id)?.[1];if(!g)return;
    if(!focused)savedView={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};
    focusRoot.clear();highlightPart(id,g);const model=g.clone(true);model.position.set(0,0,0);model.visible=true;focusRoot.add(model);focusRoot.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(model),center=b.getCenter(new THREE.Vector3());model.position.sub(center).add(new THREE.Vector3(0,1,0));focusRadius=b.getSize(new THREE.Vector3()).length()/2;
    focused={id,key:g.name};car.visible=false;floor.visible=grid.visible=false;fitFocus();
    viewport.dataset.focus=id;viewport.dataset.focusKey=g.name;$('#back-to-car').hidden=false;$('#focus-name').hidden=false;$('#focus-name').textContent=g.userData.partName+' · '+componentFor(g.name,id).title;
    $('.stage').classList.add('is-focused');
    document.querySelectorAll('.nav-part').forEach(b=>{const active=!!b.dataset.match&&g.name.startsWith(b.dataset.match);b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  }
  function exitFocus(){if(!focused)return;focused=null;focusRoot.clear();car.visible=true;floor.visible=grid.visible=true;
    camera.position.copy(savedView.position);controls.target.copy(savedView.target);camera.zoom=savedView.zoom;controls.minDistance=7;controls.maxDistance=23;camera.updateProjectionMatrix();controls.update();
    delete viewport.dataset.focus;delete viewport.dataset.focusKey;$('#back-to-car').hidden=true;$('#focus-name').hidden=true;$('.stage').classList.remove('is-focused');
    document.querySelectorAll('.nav-part').forEach(b=>{const active=b.id==='overview';b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  }
  function switchBrand(id){
    if(id===currentBrand||!fleet.has(id))return;
    exitFocus();car.visible=false;car.scale.setScalar(1);car.rotation.y=0;car.position.y=0;
    ({car,moving,wheels,engine,fuel,fluid,amber,labels}=fleet.get(id));
    currentBrand=id;car.visible=true;highlightedGroup=null;
    for(const o of moving){const detached=o.id==='tools'?o.g.name.startsWith('wheel')&&!state.tools:!state[o.id];o.g.position.copy(o.base).addScaledVector(o.delta,detached?Math.max(state.spread,1.15):state.spread);if(detached)o.g.position.y+=.35;}
    brandAnimation=reduced?null:performance.now();
    viewport.dataset.brand=id;viewport.dataset.model=id==='bmw'?'bmw-x5':id+'-animated';
    const brand=brands.find(b=>b.id===id);$('.model-tag').lastChild.textContent=' '+brand.model+' / '+brand.kind;
    $('.parts-nav-heading>span').textContent=brand.name;
  }
  let priorAspect=camera.aspect;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start,last=0;
  renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);if(focused)return;const hit=raycaster.intersectObjects(car.children,true).find(h=>h.object.userData.part&&h.object.visible);if(hit){const id=hit.object.userData.part;selectPart(id,true,hit.object.userData.focusKey);}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#fallback').hidden=false;$('#labels').hidden=true;});
  $('#loading').hidden=true;viewport.dataset.model='bmw-x5';viewport.dataset.brand='bmw';
  const tmp=new THREE.Vector3(),fuelColor=new THREE.Color();
  function frame(t){requestAnimationFrame(frame);if(document.hidden)return;const dt=Math.min((t-last)/1000,.05);last=t;const a=reduced?1:1-Math.exp(-7*dt);
    if(brandAnimation!==null){const progress=Math.min((t-brandAnimation)/650,1),ease=1-Math.pow(1-progress,3);car.scale.setScalar(.9+.1*ease);car.rotation.y=-.28*(1-ease);car.position.y=.25*(1-ease);if(progress===1)brandAnimation=null;}
    if(highlightedGroup?.name!==state.selectedKey)highlightPart(state.selected,moving.find(o=>o.g.name===state.selectedKey)?.g||labels.find(o=>o[0]===state.selected)[1]);
    for(const o of moving){const detached=o.id==='tools'?o.g.name.startsWith('wheel')&&!state.tools:!state[o.id],amount=detached?Math.max(state.spread,1.15):state.spread;tmp.copy(o.base).addScaledVector(o.delta,amount);if(detached)tmp.y+=.35;o.g.position.lerp(tmp,a);}
    fuel.visible=state.spread>.08||!state.context;
    fluid.scale.y=THREE.MathUtils.lerp(fluid.scale.y,!state.context?.02:state.contextMode==='brief'?.3:1,a);fluid.position.y=-.26+.24*fluid.scale.y;
    amber.color.lerp(fuelColor.set(state.contextMode==='noisy'?0x8b8758:0xf2a33f),a);
    if(!focused){camera.zoom=THREE.MathUtils.lerp(camera.zoom,(1.75-state.spread*.9)*(currentBrand==='bmw'?1:.86)*(viewport.clientWidth<500?.85+.05*state.spread:1),a);controls.target.y=THREE.MathUtils.lerp(controls.target.y,1+state.spread*.85,a);controls.target.x=THREE.MathUtils.lerp(controls.target.x,-.55*state.spread,a);camera.updateProjectionMatrix();}else if(camera.aspect!==priorAspect)fitFocus();priorAspect=camera.aspect;controls.update();
    const stageRect=viewport.parentElement.getBoundingClientRect(),vr=viewport.getBoundingClientRect();
    for(const [id,g,offset] of labels){const anchor=id==='tools'&&state.selected==='tools'?highlightedGroup:g;const p=anchor.localToWorld(offset.clone()).project(camera),el=$(`.part-label.${id}`),lr=el.getBoundingClientRect();const x=(p.x*.5+.5)*vr.width+vr.left-stageRect.left,y=(-p.y*.5+.5)*vr.height+vr.top-stageRect.top,tx=lr.left+lr.width/2-stageRect.left,ty=lr.top-stageRect.top;
      const path=$(`#leader-${id}`),dot=$(`#dot-${id}`);path.setAttribute('d',`M ${tx} ${ty} L ${tx} ${ty-12} L ${x} ${y}`);dot.setAttribute('cx',x);dot.setAttribute('cy',y);path.style.opacity=dot.style.opacity=!focused&&p.z<1?'1':'0';}
    renderer.render(scene,camera);
    selectionOutline.render(focused?focusRoot.children[0]:highlightedGroup,camera,selectionColors[state.selected]);
  }requestAnimationFrame(frame);
  return{controls,reset,focus,exitFocus,switchBrand,get focusedId(){return focused?.id;},get focusedKey(){return focused?.key;}};
}
