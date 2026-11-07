import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { selected: 'engine', spread: 0, engine: true, tools: true, context: true, contextMode: 'relevant', step: -1, playing: false };
const parts = {
  engine: { title: '大模型', name: '发动机', symbol: '⚙', mapping: '发动机 → 思考与规划', color: '#40695d', description: '理解任务、提出计划，并决定下一步如何行动。像发动机一样提供核心能力，输出仍需要核对。', example: '理解“设计一节认识汽车的活动”，先安排观察、配对和回顾三个环节。' },
  tools: { title: '工具', name: '工具零部件', symbol: '⌘', mapping: '零部件 → 具体行动', color: '#587c99', description: '检索、读取资料、计算、生成文件，让想法变成行动。模型按任务选择工具，也要核验工具返回的结果。', example: '检索汽车素材、读取活动模板，再生成一份可使用的活动单。' },
  context: { title: '上下文', name: '汽油', symbol: '◕', mapping: '汽油 → 本次可用的信息', color: '#cf7446', description: '目标、学情、要求、参考资料和工具反馈，都是本次任务可用的信息。相关、充分，比单纯堆积更有用。', example: '“5—6 岁儿童，20 分钟，认识轮胎和车门；教室里有玩具汽车。”' }
};
const contexts = {
  brief: '只给一句：“做一个汽车活动。”',
  relevant: '5—6 岁 · 20 分钟 · 认识轮胎和车门 · 有玩具汽车',
  noisy: '相关要求之外，还夹杂上周菜单、无关新闻与过期活动安排。'
};
let demoTimer, graphics, lastTime = 0;

function stopDemo(message) {
  clearTimeout(demoTimer); state.playing = false;
  if (message) { state.step = -1; $('#output-label').textContent = '配置已改变'; $('#output-text').textContent = message; }
  renderSteps();
}
function selectPart(id, open = true) {
  state.selected = id; const p = parts[id];
  document.documentElement.style.setProperty('--accent', p.color);
  $('#part-title').textContent = p.title; $('#mapping').textContent = p.mapping;
  $('#part-symbol').textContent = p.symbol; $('#part-description').textContent = p.description;
  $('#part-example').textContent = p.example;
  $('#part-index').textContent = `0${Object.keys(parts).indexOf(id) + 1} / 03`;
  $$('.part-tabs button').forEach(b => { const active = b.dataset.select === id; b.setAttribute('aria-selected', active); b.tabIndex = active ? 0 : -1; });
  $('#detail').setAttribute('aria-labelledby', `tab-${id}`);
  $$('.part-label').forEach(b => b.classList.toggle('selected', b.dataset.select === id));
  $('#context-options').hidden = id !== 'context';
  $('#detach').innerHTML = `${state[id] ? (id === 'context' ? '移除汽油' : '拆下' + p.name) : (id === 'context' ? '补充汽油' : '装回' + p.name)} <span>${state[id] ? '↗' : '↙'}</span>`;
  $('#part-state').textContent = state[id] ? '已装配 · 可以参与任务' : '已移除 · 启动演示看看变化';
  $('#context-preview').textContent = contexts[state.contextMode];
  if (open) setSpread(Math.max(state.spread, .76));
}
function setSpread(value) {
  state.spread = value; $('#spread').value = Math.round(value * 100); $('#spread-value').value = `${Math.round(value * 100)}%`;
  $('#assemble').classList.toggle('active', value < .5); $('#explode').classList.toggle('active', value >= .5);
  $('#assemble').setAttribute('aria-pressed', value < .5); $('#explode').setAttribute('aria-pressed', value >= .5);
}
function renderSteps() {
  $$('.steps button').forEach((b, i) => { b.classList.toggle('active', i === state.step); b.classList.toggle('done', i < state.step); if (i === state.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  $('#pause').disabled = state.step < 0 || state.step >= 4;
  $('#pause').textContent = state.playing ? '暂停' : '继续';
  $('#next').disabled = state.step < 0 || state.step >= 4;
  $('#run').innerHTML = state.step >= 0 ? '<span>↻</span> 重新演示' : '<span>▶</span> 启动演示';
}
function getSteps() {
  const thin = !state.context || state.contextMode === 'brief';
  const noisy = state.context && state.contextMode === 'noisy';
  return [
    ['明确目标', thin ? '已收到“做一个汽车活动”。信息还不充分，需要确认年龄、时长和学习目标。' : '目标：为 5—6 岁儿童设计 20 分钟的活动，认识轮胎和车门，使用教室里的玩具汽车。', 'context'],
    ['模型规划', thin ? '先提出澄清问题：给谁上课？多长时间？想学什么？模型可以先给通用建议，但不能假装已知学情。' : noisy ? '先筛选与本课有关的年龄、时长和材料，排除菜单、新闻与过期安排，再规划活动。' : '把任务分成三段：观察汽车 5 分钟、部件配对 10 分钟、回顾表达 5 分钟。', 'engine'],
    ['调用工具', state.tools ? '示意调用：检索汽车素材 → 读取活动模板 → 生成活动单。实际任务可以选择不同工具，也可能不需要工具。' : '工具已拆下：模型仍能提出活动建议，但本演示无法检索新素材、读取模板或生成文件。', 'tools'],
    ['读取反馈', state.tools ? '素材与模板返回后，模型读取结果并检查是否适龄、是否符合任务；不合适时应调整计划。' : '没有工具返回结果：只能依据已有上下文继续，不能声称“已经检索”或“文件已经生成”。', 'engine'],
    ['整理结果', thin ? '当前得到一份待补充条件的草案。先补齐年龄、时间与目标，再核对活动是否适合。' : state.tools ? '演示结果：观察 5 分钟 → 配对 10 分钟 → 回顾 5 分钟。由教师检查内容与学情，再决定采用。' : '得到文字建议：观察 5 分钟 → 配对 10 分钟 → 回顾 5 分钟。素材检索和文件制作仍待完成。', 'engine']
  ];
}
function showStep(index, autoplay = false) {
  clearTimeout(demoTimer);
  if (!state.engine) {
    state.step = -1; state.playing = false; $('#output-label').textContent = '缺少发动机 · 大模型';
    $('#output-text').textContent = '这辆“智能体”无法进行模型驱动的理解与规划。先装回发动机，再启动演示。';
    selectPart('engine'); renderSteps(); return;
  }
  state.step = index; state.playing = autoplay && index < 4;
  const [title, text, part] = getSteps()[index];
  $('#output-label').textContent = `${String(index + 1).padStart(2, '0')} / ${title}`;
  $('#output-text').textContent = text; selectPart(part, false); renderSteps();
  if (state.playing) demoTimer = setTimeout(() => showStep(index + 1, true), 5500);
}
$$('[data-select]').forEach(b => b.addEventListener('click', () => selectPart(b.dataset.select)));
$('.part-tabs').addEventListener('keydown', e => {
  const tabs = $$('.part-tabs button'); let index = tabs.indexOf(document.activeElement);
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
  e.preventDefault(); index = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (index + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
  tabs[index].focus(); selectPart(tabs[index].dataset.select);
});
$('#spread').addEventListener('input', e => setSpread(+e.target.value / 100));
$('#assemble').onclick = () => setSpread(0); $('#explode').onclick = () => setSpread(1);
$('#detach').onclick = () => { const id = state.selected; state[id] = !state[id]; stopDemo('部件配置已更新。重新启动，观察任务如何变化。'); selectPart(id); };
$$('[data-context]').forEach(b => b.onclick = () => { state.contextMode = b.dataset.context; state.context = true; $$('[data-context]').forEach(x => x.classList.toggle('active', x === b)); stopDemo('上下文已更新。重新启动，比较任务处理过程。'); selectPart('context'); });
$('#run').onclick = () => showStep(0, true);
$('#pause').onclick = () => { if (state.playing) stopDemo(); else showStep(state.step, true); };
$('#next').onclick = () => showStep(Math.min(4, state.step + 1), false);
$$('[data-step]').forEach(b => b.onclick = () => showStep(+b.dataset.step, false));
$('#reset').onclick = () => graphics?.reset();
$('#auto-rotate').onclick = () => { const on = $('#auto-rotate').getAttribute('aria-pressed') !== 'true'; $('#auto-rotate').setAttribute('aria-pressed', on); if (graphics) graphics.controls.autoRotate = on; };
$('#reset-all').onclick = () => {
  stopDemo(); Object.assign(state, { engine: true, tools: true, context: true, contextMode: 'relevant', step: -1 });
  $$('[data-context]').forEach(x => x.classList.toggle('active', x.dataset.context === 'relevant'));
  setSpread(0); selectPart('engine', false); renderSteps(); graphics?.reset();
  $('#auto-rotate').setAttribute('aria-pressed','false'); if(graphics) graphics.controls.autoRotate = false;
  $('#output-label').textContent = '准备出发'; $('#output-text').textContent = '试着拆下一个部件，再启动演示，看看会发生什么。';
};
const dialog = $('#about'); $('#help').onclick = $('#learn-more').onclick = () => dialog.showModal();
$('.dialog-close').onclick = () => dialog.close(); dialog.onclick = e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } };
$('#fullscreen').onclick = async () => { try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { $('#fullscreen').title = '当前浏览器不支持全屏，请使用浏览器菜单'; } };
if (!document.fullscreenEnabled) $('#fullscreen').hidden = true;
document.addEventListener('fullscreenchange', () => $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏'));
selectPart('engine', false); renderSteps();

function buildScene() {
  const viewport = $('#viewport');
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  viewport.prepend(renderer.domElement); renderer.domElement.setAttribute('aria-label', '三维汽车，可拖动旋转；也可用部件按钮选择');
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced; controls.enablePan = false; controls.minDistance = 9; controls.maxDistance = 23;
  controls.maxPolarAngle = Math.PI / 2.13; controls.minPolarAngle = .22; controls.autoRotateSpeed = .65;
  function reset() { camera.position.set(-7.5, 5.7, 8.3); controls.target.set(0, 1.35, 0); controls.update(); }
  reset();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x99ac85, 3));
  const sun = new THREE.DirectionalLight(0xfff4de, 4.5); sun.position.set(-4, 10, 5); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .1, far: 40 }); sun.shadow.mapSize.set(2048,2048); sun.shadow.bias = -.0003; sun.shadow.normalBias = .025; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 1.5); fill.position.set(5,4,-6); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.ShadowMaterial({color:0x536447,opacity:.14})); floor.rotation.x = -Math.PI/2; floor.position.y = .025; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(18, 36, 0xb8c5ae, 0xc8d0bf); grid.position.y = .02; grid.material.transparent = true; grid.material.opacity = .28; scene.add(grid);
  const car = new THREE.Group(); scene.add(car);
  const mat = (color, metalness = .1, roughness = .6) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const cream = mat(0xeee9d9), orange = mat(0xd77043,.16,.4), dark = mat(0x303d38), rubber = mat(0x293632,0,.95), silver = mat(0xa8b4aa,.6,.3), green = mat(0x477a6b,.35,.4), blue = mat(0x577a94,.3,.4), glass = mat(0x426b6c,.45,.22), amber = mat(0xf3ae4f,.1,.35), black = mat(0x23352d);
  const moving = [], wheels = [], selectable = [];
  function mesh(geo, material, parent, pos = [0,0,0], rot = [0,0,0]) { const m = new THREE.Mesh(geo,material); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const box = (p,m,s,pos,rot) => mesh(new THREE.BoxGeometry(...s),m,p,pos,rot);
  function cyl(p,m,r,h,pos,rot=[0,0,0],r2=r,segments=32) { return mesh(new THREE.CylinderGeometry(r,r2,h,segments),m,p,pos,rot); }
  function group(id, pos, delta) { const g = new THREE.Group(); g.position.set(...pos); g.userData.part = id; car.add(g); moving.push({g,base:new THREE.Vector3(...pos),delta:new THREE.Vector3(...delta),id}); return g; }
  function slab(parent, material, points, depth, z=0) { const shape = new THREE.Shape(); points.forEach(([x,y],i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath(); const geo = new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.055}); return mesh(geo,material,parent,[0,0,z-depth/2]); }
  const base = new THREE.Group(); car.add(base);
  box(base,dark,[5.3,.2,2.15],[0,.63,0]);
  box(base,silver,[4.65,.1,.12],[0,.84,.95]); box(base,silver,[4.65,.1,.12],[0,.84,-.95]);
  for (const x of [-1.75,1.65]) cyl(base,silver,.09,3,[x,.66,0],[Math.PI/2,0,0]);
  box(base,dark,[.17,.24,2.45],[-2.67,.78,0]); box(base,dark,[.15,.2,2.45],[2.67,.78,0]);
  const shell = group('body',[0,0,0],[0,2.5,0]);
  slab(shell,cream,[[-2.6,.84],[-2.6,1.18],[-2.3,1.42],[-.9,1.44],[1.83,1.48],[2.6,1.25],[2.6,.85]],2.16);
  // Front/rear fenders and the passenger cabin form the recognisable silhouette.
  slab(shell,orange,[[-.88,1.4],[-.35,2.35],[1.13,2.35],[1.87,1.4]],2.04);
  slab(shell,glass,[[-.7,1.5],[-.28,2.21],[.26,2.21],[.26,1.5]],.035,1.061);
  slab(shell,glass,[[.4,1.5],[.4,2.21],[1.05,2.21],[1.63,1.5]],.035,1.061);
  slab(shell,glass,[[-.7,1.5],[-.28,2.21],[.26,2.21],[.26,1.5]],.035,-1.061);
  slab(shell,glass,[[.4,1.5],[.4,2.21],[1.05,2.21],[1.63,1.5]],.035,-1.061);
  box(shell,glass,[.04,.82,1.88],[-.74,1.87,0],[0,0,-.51]);
  box(shell,glass,[.045,.89,1.88],[1.5,1.87,0],[0,0,.65]);
  box(shell,cream,[1.65,.13,2.08],[.4,2.39,0]);
  box(shell,orange,[1.55,.13,2.14],[-1.75,1.47,0],[0,0,.015]);
  box(shell,cream,[.63,.1,2.12],[2.18,1.42,0]);
  for(const z of [-1.11,1.11]) {
    box(shell,silver,[.3,.055,.05],[.98,1.35,z]); box(shell,silver,[.27,.055,.05],[-.17,1.35,z]);
    box(shell,dark,[4.8,.07,.04],[0,.92,z]);
    box(shell,orange,[.2,.18,.36],[-.72,1.53,z*1.13]);
  }
  for(const z of [-.79,.79]) { box(shell,mat(0xffebbc),[.08,.22,.41],[-2.66,1.15,z]); box(shell,mat(0xb64e34),[.06,.24,.33],[2.65,1.1,z]); }
  box(shell,dark,[.04,.19,.92],[-2.67,1.12,0]);
  for (let z=-.4;z<=.4;z+=.16) box(shell,silver,[.055,.015,.09],[-2.7,1.13,z]);
  box(shell,silver,[.07,.12,.72],[-2.72,.83,0]);
  // Engine assembly: block, cylinder head, ribs, intake and belt.
  const engine = group('engine',[-1.55,.8,0],[-1.2,1.91,0]);
  box(engine,green,[1.03,.58,1.2],[0,.06,0]); box(engine,dark,[1.1,.13,1.29],[0,-.27,0]);
  box(engine,silver,[1.11,.16,1.28],[0,.41,0]);
  for(let x=-.43;x<=.44;x+=.17) box(engine,green,[.08,.14,1.18],[x,.54,0]);
  for(let z of [-.69,.69]) { cyl(engine,silver,.1,.81,[0,.16,z],[0,0,Math.PI/2]); for(let x of [-.36,0,.36]) cyl(engine,dark,.06,.2,[x,.18,z],[Math.PI/2,0,0]); }
  cyl(engine,black,.24,.12,[-.59,-.04,0],[0,0,Math.PI/2]); cyl(engine,silver,.12,.14,[-.61,-.04,0],[0,0,Math.PI/2]);
  box(engine,orange,[.28,.07,.38],[0,.64,0]);
  // The amber tank visibly stands for task context, not vehicle battery power.
  const fuel = group('context',[1.85,1.05,0],[1.25,1.22,0]);
  const tank = new THREE.MeshPhysicalMaterial({color:0xe9c58c,metalness:.1,roughness:.25,transparent:true,opacity:.36,depthWrite:false});
  box(fuel,tank,[.88,.76,1.4],[0,0,0]);
  const fluid = box(fuel,amber,[.76,.53,1.28],[0,-.055,0]);
  box(fuel,silver,[.95,.06,1.47],[0,-.41,0]); box(fuel,silver,[.95,.06,1.47],[0,.41,0]);
  for(const z of [-.46,.46]) box(fuel,dark,[.98,.85,.045],[0,0,z]);
  cyl(fuel,dark,.14,.16,[0,.5,0]);
  // Four detachable wheel modules represent the available tool set.
  for(const x of [-1.75,1.65]) for(const z of [-1.29,1.29]) {
    const wheel = group('tools',[x,.66,z],[x < 0 ? -.2 : .2,.18,Math.sign(z)*1.22]); wheels.push(wheel);
    cyl(wheel,rubber,.62,.44,[0,0,0],[Math.PI/2,0,0]);
    const out = Math.sign(z)*.235;
    cyl(wheel,blue,.43,.05,[0,0,out],[Math.PI/2,0,0]);
    cyl(wheel,dark,.33,.06,[0,0,out*1.13],[Math.PI/2,0,0]);
    for(let a=0;a<6;a++) { const angle=a*Math.PI/3; box(wheel,silver,[.075,.61,.045],[0,0,out*1.24],[0,0,angle]); }
    cyl(wheel,blue,.15,.08,[0,0,out*1.37],[Math.PI/2,0,0]);
    for(let a=0;a<32;a++) { const angle=a*Math.PI/16; box(wheel,dark,[.045,.055,.46],[Math.sin(angle)*.608,Math.cos(angle)*.608,0],[0,0,-angle]); }
  }
  moving.forEach(({g,id}) => { g.traverse(o=> { if(o.isMesh) { o.userData.part=id; if(id!=='body') selectable.push(o); } }); });
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let start;
  renderer.domElement.addEventListener('pointerdown', e => start = [e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup', e => {
    if(!start || Math.hypot(e.clientX-start[0],e.clientY-start[1])>7) return;
    const r=renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(car.children,true); const hit=hits.find(h=>h.object.userData.part);
    if(hit) { const id=hit.object.userData.part; if(id==='body') setSpread(state.spread>.5?0:1); else selectPart(id); }
  });
  renderer.domElement.addEventListener('webglcontextlost', e=> {e.preventDefault(); $('#fallback').hidden=false; $('#labels').hidden=true;});
  const labels = [['engine',engine,new THREE.Vector3(0,.95,0)],['tools',wheels[1],new THREE.Vector3(0,.9,.1)],['context',fuel,new THREE.Vector3(0,.8,0)]];
  const observer = new ResizeObserver(() => {const w=viewport.clientWidth,h=viewport.clientHeight; renderer.setSize(w,h); camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(35/2))*Math.max(1,1.28/camera.aspect)));camera.updateProjectionMatrix();}); observer.observe(viewport);
  $('#loading').hidden = true;
  const tmp=new THREE.Vector3();
  function frame(t) {
    requestAnimationFrame(frame); if(document.hidden) return;
    const dt=Math.min((t-lastTime)/1000,.05);lastTime=t; const lerp=reduced?1:1-Math.exp(-7*dt);
    for(const o of moving) {
      const detached = o.id!=='body' && !state[o.id];
      let amount = detached ? Math.max(state.spread,1.15) : state.spread;
      tmp.copy(o.base).addScaledVector(o.delta,amount);
      if(detached) tmp.y += .45;
      o.g.position.lerp(tmp,lerp);
      o.g.rotation.y = THREE.MathUtils.lerp(o.g.rotation.y,detached?.16:0,lerp);
    }
    fluid.scale.y=THREE.MathUtils.lerp(fluid.scale.y,!state.context?.025:state.contextMode==='brief'?.3:.95,lerp);
    fluid.position.y=-.32+.265*fluid.scale.y;
    amber.color.lerp(new THREE.Color(state.contextMode==='noisy'?0x8c895d:0xf3ae4f),lerp);
    for(const [id,g,offset] of labels) {
      const p=g.localToWorld(offset.clone()).project(camera); const el=$(`.part-label.${id}`);
      const x=Math.max(65,Math.min(viewport.clientWidth-65,(p.x*.5+.5)*viewport.clientWidth));
      const y=Math.max(67,Math.min(viewport.clientHeight-30,(-p.y*.5+.5)*viewport.clientHeight));
      el.style.left=`${x}px`;el.style.top=`${y}px`;el.style.opacity=p.z<1?'1':'0';
    }
    controls.update(); renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
  return { controls, reset };
}
try { graphics=buildScene(); } catch(error) { console.error('3D 初始化失败',error); $('#loading').hidden=true; $('#fallback').hidden=false; $('#labels').hidden=true; }
