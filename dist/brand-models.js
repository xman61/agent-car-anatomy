import * as THREE from 'three';

export const brands = [
  {id:'bmw',name:'宝马',model:'BMW X5',kind:'真实车模',color:'#637d89'},
  {id:'mercedes',name:'奔驰',model:'Mercedes-Benz',kind:'动画版',color:'#929e91'},
  {id:'mazda',name:'马自达',model:'Mazda',kind:'动画版',color:'#a92336'}
];

// Independent teaching models: shared component keys keep every explanation usable.
export function createAnimatedSUV(scene,brand,engineTemplate){
 const boxy=brand.id==='mercedes',car=new THREE.Group(),moving=[],wheels=[];scene.add(car);
 const paint=new THREE.MeshPhysicalMaterial({color:brand.color,metalness:.68,roughness:.26,clearcoat:1,clearcoatRoughness:.18});
 const black=new THREE.MeshStandardMaterial({color:0x182127,roughness:.48}),rubber=new THREE.MeshStandardMaterial({color:0x151b1f,roughness:.87});
 const chrome=new THREE.MeshStandardMaterial({color:0xc9d0d1,metalness:.92,roughness:.22});
 const glass=new THREE.MeshPhysicalMaterial({color:0x29434a,metalness:.35,roughness:.17,transparent:true,opacity:.94,depthWrite:false});
 const leather=new THREE.MeshStandardMaterial({color:boxy?0x78654e:0x433b3a,roughness:.8});
 const white=new THREE.MeshStandardMaterial({color:0xf0f9ff,emissive:0x9fc5d7,emissiveIntensity:.3});
 const red=new THREE.MeshStandardMaterial({color:0xb80f28,emissive:0x7d0716,emissiveIntensity:.35});
 function mesh(g,geo,mat,pos=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
 function block(g,size,pos,mat=paint){
  if((mat===paint||mat===leather)&&Math.min(...size)>.06){const [w,h,d]=size,r=Math.min(.055,w/6,h/6,d/6),shape=new THREE.Shape();shape.moveTo(-w/2+r,-h/2+r);shape.lineTo(w/2-r,-h/2+r);shape.lineTo(w/2-r,h/2-r);shape.lineTo(-w/2+r,h/2-r);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,steps:1});geo.translate(0,0,-d/2+r);return mesh(g,geo,mat,pos);}
  return mesh(g,new THREE.BoxGeometry(...size),mat,pos);
 }
 function rod(g,a,b,r=.025,mat=chrome){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),d=w.clone().sub(v);const m=mesh(g,new THREE.CylinderGeometry(r,r,d.length(),10),mat,v.add(w).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
 function panel(g,points,z,mat=paint,depth=.04){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});return mesh(g,geo,mat,[0,0,z-depth/2]);}
 function part(key,name,delta,make,id='tools'){const g=new THREE.Group();g.name=key;car.add(g);make(g);g.updateMatrixWorld(true);const center=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());for(const child of g.children)child.position.sub(center);g.position.copy(center);g.userData={part:id,partName:name};g.traverse(n=>{if(n.isMesh){n.userData.part=id;n.userData.focusKey=key;}});moving.push({g,id,base:center.clone(),delta:new THREE.Vector3(...delta)});return g;}
 const top=boxy?2.54:2.31,frontRoof=boxy?-1.04:-.35,backRoof=boxy?2.14:1.63;
 const body=part('body','车身',[0,2.3,0],g=>{
  const shape=new THREE.Shape();shape.moveTo(-2.78,.63);shape.lineTo(-2.78,1.23);shape.lineTo(-1.14,1.45);shape.lineTo(2.59,1.44);shape.lineTo(2.77,1.12);shape.lineTo(2.77,.63);shape.lineTo(2.46,.63);shape.absarc(1.8,.63,.66,0,Math.PI,false);shape.lineTo(-1.16,.63);shape.absarc(-1.82,.63,.66,0,Math.PI,false);shape.lineTo(-2.78,.63);
  mesh(g,new THREE.ExtrudeGeometry(shape,{depth:1.96,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1}),paint,[0,0,-.98]);
  block(g,[backRoof-frontRoof,.10,1.78],[(backRoof+frontRoof)/2,top,0]);
  for(const z of [-.91,.91]){
   rod(g,[-1.18,1.43,z],[frontRoof,top,z],.055,paint);rod(g,[backRoof,top,z],[2.46,1.44,z],.065,paint);
   rod(g,[.52,1.45,z],[.52,top,z],.045,black);
   rod(g,[frontRoof+.14,top+.08,z*.87],[backRoof-.12,top+.08,z*.87],.025,chrome);
   block(g,[4.8,.12,.1],[0,.48,z*1.18],black);
   panel(g,[[1.79,1.58],[2.36,1.56],[backRoof-.05,top-.12],[1.79,top-.12]],z,glass);
  }
  const windshield=new THREE.BufferGeometry();windshield.setAttribute('position',new THREE.Float32BufferAttribute([-1.17,1.5,-.85,-1.17,1.5,.85,frontRoof+.02,top-.08,.85,frontRoof+.02,top-.08,-.85],3));windshield.setIndex([0,1,2,0,2,3]);windshield.computeVertexNormals();const windMat=glass.clone();windMat.side=THREE.DoubleSide;mesh(g,windshield,windMat);
  block(g,[.13,.38,1.98],[-2.78,.76,0],black);block(g,[.13,.26,1.98],[2.76,.73,0],black);
  if(boxy)block(g,[.08,.48,1.13],[-2.82,1.12,0],black);
  else {const grille=new THREE.Shape();grille.moveTo(-.72,.22);grille.lineTo(.72,.22);grille.lineTo(.62,-.12);grille.lineTo(0,-.27);grille.lineTo(-.62,-.12);grille.closePath();const m=mesh(g,new THREE.ExtrudeGeometry(grille,{depth:.07,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2}),black,[-2.84,1.12,0]);m.rotation.y=-Math.PI/2;for(const side of [-1,1]){rod(g,[-2.91,1.34,side*.72],[-2.91,1,side*.62],.025,chrome);rod(g,[-2.91,1,side*.62],[-2.91,.85,0],.025,chrome);}}
  for(let i=-3;i<=3;i++){if(boxy)block(g,[.10,.025,1.05],[-2.88,.96+(i+3)*.055,0],chrome);else rod(g,[-2.88,.93,i*.16],[-2.88,1.32,i*.16],.012,chrome);}
  for(const z of [-.77,.77]){
   if(boxy){const lamp=mesh(g,new THREE.CylinderGeometry(.21,.21,.08,36),white,[-2.85,1.15,z]);lamp.rotation.z=Math.PI/2;const ring=mesh(g,new THREE.TorusGeometry(.225,.025,10,40),chrome,[-2.9,1.15,z]);ring.rotation.y=Math.PI/2;}
   else {const light=block(g,[.09,.12,.52],[-2.79,1.29,z],white);light.rotation.x=z>0?-.13:.13;}
   block(g,[.09,.15,boxy?.30:.58],[2.78,1.22,z],red);
  }
  // Brand motifs are drawn geometrically; these are stylized animation vehicles.
  const emblem=mesh(g,new THREE.TorusGeometry(boxy?.17:.15,.016,8,36),chrome,[-2.94,1.17,0]);emblem.rotation.y=Math.PI/2;if(!boxy)emblem.scale.y=.67;
  if(boxy)for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(g,[-2.96,1.17,0],[-2.96,1.17+Math.cos(a)*.16,Math.sin(a)*.16],.016,chrome);}
  else {rod(g,[-2.96,1.21,-.13],[-2.96,1.12,0],.015,chrome);rod(g,[-2.96,1.12,0],[-2.96,1.21,.13],.015,chrome);}
 });
 part('hood','引擎盖',[-1.2,3.1,0],g=>{const h=block(g,[1.57,.10,1.86],[-1.97,1.45,0]);h.rotation.z=.07;for(const z of [-.60,.60])rod(g,[-2.65,1.47,z],[-1.25,1.57,z*.85],.012,chrome);block(g,[1.35,.08,1.66],[-1.95,1.36,0],black);});
 for(let i=0;i<4;i++){const front=i<2,z=i%2===0?1.01:-1.01,x=front?-.34:1.15,w=front?1.53:1.35;part('door_'+(front?'F':'B')+'_'+(i%2),front?'前车门':'后车门',[front?-.5:.65,.7,Math.sign(z)*1.75],g=>{
  panel(g,[[x-w/2,.88],[x+w/2,.88],[x+w/2,1.47],[x-w/2,1.47]],z,paint,.065);
  const pts=front?[[x-w/2+.06,1.52],[x+w/2-.06,1.52],[x+w/2-.06,top-.1],[frontRoof+.05,top-.1]]:[[x-w/2+.06,1.52],[x+w/2-.06,1.52],[Math.min(x+w/2-.06,backRoof-.04),top-.1],[x-w/2+.06,top-.1]];
  panel(g,pts,z*.94,glass);for(let k=0;k<4;k++)rod(g,[...pts[k],z*.94],[...pts[(k+1)%4],z*.94],.025,black);
  block(g,[.23,.035,.05],[x+.3,1.32,z*1.045],chrome);
  if(front){block(g,[.3,.16,.25],[x-.62,1.62,z*1.12]);block(g,[.25,.11,.015],[x-.6,1.62,z*1.24],chrome);}
 });}
 part('tailgate','后备厢门',[1.65,1.6,0],g=>{
  block(g,[.08,.66,1.65],[2.74,1.18,0]);const rear=new THREE.BufferGeometry();rear.setAttribute('position',new THREE.Float32BufferAttribute([2.45,1.5,-.82,2.45,1.5,.82,backRoof,top-.12,.82,backRoof,top-.12,-.82],3));rear.setIndex([0,2,1,0,3,2]);rear.computeVertexNormals();const mat=glass.clone();mat.side=THREE.DoubleSide;mesh(g,rear,mat);block(g,[.09,.08,.45],[2.81,1.35,0],chrome);
  if(boxy){const spare=mesh(g,new THREE.CylinderGeometry(.43,.43,.20,36),black,[2.94,1.4,0]);spare.rotation.z=Math.PI/2;const cover=mesh(g,new THREE.CylinderGeometry(.37,.37,.22,36),paint,[2.97,1.4,0]);cover.rotation.z=Math.PI/2;}
 });
 for(let i=0;i<4;i++){const x=i<2?-1.82:1.8,z=i%2===0?1.04:-1.04;wheels.push(part('wheel_'+i,'车轮',[Math.sign(x)*.65,-.05,Math.sign(z)*2.7],g=>{
  const tire=mesh(g,new THREE.TorusGeometry(.43,.17,16,48),rubber,[x,.62,z]);
  const rim=mesh(g,new THREE.CylinderGeometry(.32,.32,.22,40),black,[x,.62,z]);rim.rotation.x=Math.PI/2;
  const side=z+Math.sign(z)*.14;mesh(g,new THREE.TorusGeometry(.30,.025,10,40),chrome,[x,.62,side]);
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;rod(g,[x,.62,side],[x+Math.sin(a)*.28,.62+Math.cos(a)*.28,side],.032,chrome);}
  const hub=mesh(g,new THREE.CylinderGeometry(.08,.08,.05,20),chrome,[x,.62,side]);hub.rotation.x=Math.PI/2;
 }));}
 part('chassis','底盘',[0,0,0],g=>{block(g,[5.12,.16,1.72],[0,.48,0],black);for(const x of [-1.82,1.8])rod(g,[x,.62,-1.1],[x,.62,1.1],.075,chrome);});
 part('cabin','座舱',[0,0,0],g=>{block(g,[3.3,.10,1.66],[.55,.87,0],black);block(g,[.38,.25,1.62],[-.87,1.34,0],black);block(g,[.04,.18,.34],[-.63,1.5,0],glass);block(g,[1.3,.25,.32],[.24,1.02,0],leather);});
 part('interior_Seats','座椅',[0,0,0],g=>{for(const x of [0,1.26])for(const z of [-.49,.49]){block(g,[.57,.17,.55],[x,.99,z],leather);const seat=block(g,[.15,.7,.57],[x+.24,1.34,z],leather);seat.rotation.z=.1;block(g,[.15,.2,.36],[x+.28,1.77,z],leather);}});
 part('interior_SteeringWheel','方向盘',[0,0,0],g=>{const ring=mesh(g,new THREE.TorusGeometry(.21,.025,10,36),black,[-.54,1.51,.48]);ring.rotation.y=Math.PI/2;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(g,[-.54,1.51,.48],[-.54,1.51+Math.cos(a)*.18,.48+Math.sin(a)*.18],.018,chrome);}});
 const engine=engineTemplate.clone(true);engine.name='engine';car.add(engine);moving.push({g:engine,id:'engine',base:engine.position.clone(),delta:new THREE.Vector3(-3.5,1.1,1.7)});
 car.visible=false;return{car,moving,wheels,engine};
}
