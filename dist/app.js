import { createCarScene } from './car-scene.js';

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
  $('#detail').setAttribute('aria-labelledby', 'part-title');
  $$('.part-label').forEach(b => b.classList.toggle('selected', b.dataset.select === id));
  $('#context-options').hidden = id !== 'context';
  $('#detach').innerHTML = `${state[id] ? (id === 'context' ? '移除汽油' : '拆下' + p.name) : (id === 'context' ? '补充汽油' : '装回' + p.name)} <span>${state[id] ? '↗' : '↙'}</span>`;
  $('#part-state').textContent = state[id] ? '已装配 · 可以参与任务' : '已移除 · 启动演示看看变化';
  $('#context-preview').textContent = contexts[state.contextMode];
  if (open) graphics?.focus(id);
  else if(graphics?.focusedId && graphics.focusedId !== id) graphics.exitFocus();
}
function setSpread(value) {
  graphics?.exitFocus();
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
    ['调用工具', state.tools ? '检索汽车素材 → 读取活动模板 → 整理活动单。' : '工具已拆下：模型仍能提出活动建议，但本演示无法检索新素材、读取模板或生成文件。', 'tools'],
    ['读取反馈', state.tools ? '素材与模板返回后，模型读取结果并检查是否适龄、是否符合任务；不合适时应调整计划。' : '没有工具返回结果：只能依据已有上下文继续，不能声称“已经检索”或“文件已经生成”。', 'engine'],
    ['整理结果', thin ? '当前得到一份待补充条件的草案。先补齐年龄、时间与目标，再核对活动是否适合。' : state.tools ? '活动安排：观察 5 分钟 → 配对 10 分钟 → 回顾 5 分钟。由教师检查内容与学情，再决定采用。' : '得到文字建议：观察 5 分钟 → 配对 10 分钟 → 回顾 5 分钟。素材检索和文件制作仍待完成。', 'engine']
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
$$('.nav-part[data-part]').forEach(b=>b.onclick=()=>{selectPart(b.dataset.part,false);graphics?.focus(b.dataset.part,b.dataset.focusKey);});
$('#overview').onclick=()=>{graphics?.exitFocus();graphics?.reset();};
$('#back-to-car').onclick = () => graphics?.exitFocus();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#about').open)graphics?.exitFocus();});
$('#auto-rotate').onclick = () => { const on = $('#auto-rotate').getAttribute('aria-pressed') !== 'true'; $('#auto-rotate').setAttribute('aria-pressed', on); if (graphics) graphics.controls.autoRotate = on; };
$('#reset-all').onclick = () => {
  stopDemo(); Object.assign(state, { engine: true, tools: true, context: true, contextMode: 'relevant', step: -1 });
  $$('[data-context]').forEach(x => x.classList.toggle('active', x.dataset.context === 'relevant'));
  setSpread(0); selectPart('engine', false); renderSteps(); graphics?.reset();
  $('#auto-rotate').setAttribute('aria-pressed','false'); if(graphics) graphics.controls.autoRotate = false;
  $('#output-label').textContent = '准备出发'; $('#output-text').textContent = '试着拆下一个部件，再启动演示，看看会发生什么。';
};
const dialog = $('#about'); $('#help').onclick = () => dialog.showModal();
$('.dialog-close').onclick = () => dialog.close(); dialog.onclick = e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } };
$('#fullscreen').onclick = async () => { try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { $('#fullscreen').title = '当前浏览器不支持全屏，请使用浏览器菜单'; } };
if (!document.fullscreenEnabled) $('#fullscreen').hidden = true;
document.addEventListener('fullscreenchange', () => $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏'));
selectPart('engine', false); renderSteps();

createCarScene({state,selectPart,setSpread,reduced}).then(g=>{graphics=g;}).catch(error=>{console.error(error);$('#loading').hidden=true;$('#fallback').hidden=false;$('#labels').hidden=true;});
