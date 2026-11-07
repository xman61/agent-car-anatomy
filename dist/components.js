export const components = [
  {
    "id": "engine",
    "name": "发动机",
    "title": "大模型",
    "description": "大模型像发动机，为活动设计提供理解与推理：读懂“5—6岁、20分钟”等要求，组织观察、配对和回顾的内容，再生成可供教师调整的活动草案。",
    "actions": [
      "理解年龄、时长与活动目标",
      "安排活动顺序与讲解重点",
      "生成草案并根据反馈调整"
    ],
    "example": "收到“为5—6岁儿童设计20分钟认识汽车活动”后，先规划观察5分钟、配对10分钟、回顾5分钟，再拟出每个环节的教师提问，交给教师核对。",
    "category": "engine",
    "focusKey": "engine",
    "prefix": "engine",
    "symbol": "⚙"
  },
  {
    "id": "wheel",
    "name": "车轮",
    "title": "工具执行",
    "description": "车轮把动力变成行进，工具把方案变成具体执行：可检索汽车图片、生成配对卡片或整理计时清单。每次只承担明确步骤，执行结果仍需教师查看。",
    "actions": [
      "按当前步骤选择合适工具",
      "把活动要求转成执行参数",
      "返回图片、卡片或清单结果"
    ],
    "example": "让文件工具把“车轮—滚动、车门—上下车”等内容排成配对卡。工具返回文件后，教师检查文字和图片，再用于10分钟的配对活动。",
    "category": "tools",
    "focusKey": "wheel_0",
    "prefix": "wheel",
    "symbol": "◉"
  },
  {
    "id": "door",
    "name": "车门",
    "title": "输入输出接口",
    "description": "车门是进出的通道，输入输出接口负责接收要求并返回结果：把教师填写的文字、表单或上传资料整理成可处理的信息，再把回答或文件送回使用者。",
    "actions": [
      "接收教师填写的活动条件",
      "校验年龄时长等必填字段",
      "将回答或文件返回使用者"
    ],
    "example": "教师提供“5—6岁、20分钟、有玩具汽车”，接口整理出年龄、时长、材料三个字段；处理完成后，再把活动流程以清晰的表格返回给教师。",
    "category": "tools",
    "focusKey": "door_F_0",
    "prefix": "door",
    "symbol": "▱"
  },
  {
    "id": "hood",
    "name": "引擎盖",
    "title": "权限与安全边界",
    "description": "引擎盖保护核心部件，权限边界限定智能体可以访问哪些资料、调用哪些能力。普通读取按已有授权进行；覆盖文件、对外发送等操作先核对权限与影响，缺少授权时再确认。",
    "actions": [
      "限定可读取和修改的资源",
      "执行前核对授权范围与影响",
      "缺少授权时请求确认或停止"
    ],
    "example": "读取已授权的汽车素材可以直接进行；准备覆盖原有课件或向家长群发送活动资料时，先核对是否获得相应授权，未授权就请教师确认。",
    "category": "tools",
    "focusKey": "hood",
    "prefix": "hood",
    "symbol": "▰"
  },
  {
    "id": "steering",
    "name": "方向盘",
    "title": "目标与约束",
    "description": "方向盘控制行驶方向，目标与约束决定任务朝哪里推进。用“认识汽车”筛选内容，用年龄、总时长和材料条件限制方案；发现偏离时，回到这些条件调整。",
    "actions": [
      "明确要完成的学习目标",
      "记录年龄、时长与材料限制",
      "发现偏离时调整后续计划"
    ],
    "example": "草案把配对活动写成15分钟，总时长变成25分钟。检查20分钟的要求后，把配对调整为10分钟，保留5分钟观察和5分钟回顾。",
    "category": "tools",
    "focusKey": "interior_SteeringWheel",
    "prefix": "interior_Steering",
    "symbol": "⊕"
  },
  {
    "id": "chassis",
    "name": "底盘",
    "title": "任务编排与运行",
    "description": "底盘连接并承载各部件，任务编排连接理解、工具、接口与交付：先解析需求，再准备素材和生成活动，最后汇总结果；某步失败时保留状态并提示重试。",
    "actions": [
      "拆分需求解析与素材准备",
      "按依赖顺序调度各步骤",
      "记录进度并处理失败重试"
    ],
    "example": "先解析年龄和时长，再检索素材，最后整理活动单。素材检索失败时，保留已完成的需求解析，处理失败步骤后继续，而不是从头重复整个任务。",
    "category": "tools",
    "focusKey": "chassis",
    "prefix": "chassis",
    "symbol": "▤"
  },
  {
    "id": "context",
    "name": "油箱与汽油",
    "title": "本次上下文",
    "description": "汽油供本次行驶使用，上下文提供当前任务所需的信息：目标、年龄、时间、参考资料以及工具返回的结果。信息随处理过程更新，相关且充分更有用；它不同于模型参数或跨任务记忆。",
    "actions": [
      "装入本次年龄与时长要求",
      "随步骤传递已选汽车素材",
      "任务需要时更新上下文内容"
    ],
    "example": "教师补充“教室里已有玩具汽车，不用打印图片”。这条信息进入本次上下文后，后续方案改用实物观察，并继续满足5分钟观察、10分钟配对、5分钟回顾的安排。",
    "category": "context",
    "focusKey": "context",
    "prefix": "context",
    "symbol": "◕"
  },
  {
    "id": "body",
    "name": "车身",
    "title": "系统整合",
    "description": "车身把不同部件组成完整车辆，系统整合把大模型、工具、上下文和交互界面连在一起。统一各模块的数据格式与衔接方式，让一次任务能在多个能力之间顺利传递。",
    "actions": [
      "统一模块间的数据格式",
      "连接模型、工具与交互界面",
      "把各环节组合成完整服务"
    ],
    "example": "教师只需提出一次“设计20分钟汽车活动”。同一份要求传给模型规划、素材检索和文件生成，各模块的结果最后汇成一份完整活动方案。",
    "category": "tools",
    "focusKey": "body",
    "prefix": "body",
    "symbol": "◇"
  },
  {
    "id": "tailgate",
    "name": "后备厢门",
    "title": "成果整理与交付",
    "description": "后备厢门打开后可取走物品，成果交付把已完成内容整理成教师能直接检查和使用的结果：活动流程、配对卡片与回顾问题集中呈现，并标出版本。",
    "actions": [
      "汇总流程卡片与回顾问题",
      "按课堂使用顺序整理成果",
      "提供预览下载与版本标识"
    ],
    "example": "将20分钟活动流程、配对卡片和回顾问题按课堂顺序整理，标注资料名称与版本。教师先预览核对，再取用需要的活动单和卡片文件。",
    "category": "tools",
    "focusKey": "tailgate",
    "prefix": "tailgate",
    "symbol": "▣"
  },
  {
    "id": "seats",
    "name": "座椅",
    "title": "用户偏好与记忆",
    "description": "座椅按乘坐者需要调整，用户偏好与记忆让后续活动更贴合教师：可保存常用年龄段、语言风格和卡片版式，但须先获许可，仅在有必要时读取，也可随时删除。",
    "actions": [
      "获得许可后保存常用偏好",
      "仅在当前任务需要时读取",
      "允许教师查看修改或删除"
    ],
    "example": "经教师允许，保存“大图少字、提问简短”的常用偏好。下次设计汽车活动时按需读取，沿用这种卡片风格；教师删除偏好后，就不再继续使用。",
    "category": "tools",
    "focusKey": "interior_Seats",
    "prefix": "interior_Seats",
    "symbol": "▥"
  },
  {
    "id": "cabin",
    "name": "座舱",
    "title": "任务状态与反馈",
    "description": "座舱让驾驶者看见车速并操作车辆，任务状态与反馈让教师知道进展并能介入：显示当前环节、等待事项和结果提示，同时提供修改目标、暂停或重试入口。",
    "actions": [
      "实时显示当前步骤与进度",
      "突出等待确认或异常事项",
      "接收修改暂停与重试反馈"
    ],
    "example": "准备配对卡片时显示“素材整理中”。教师反馈“图片太小，要大图少字”，系统记录这条反馈，调整相关步骤，并让教师看见新的处理状态。",
    "category": "tools",
    "focusKey": "cabin",
    "prefix": "cabin",
    "symbol": "◴"
  }
];
export const defaultKey = category => category === "tools" ? "wheel_0" : category;
export function componentFor(key,category="tools"){return components.find(p=>key?.startsWith(p.prefix)) || components.find(p=>p.focusKey===defaultKey(category));}
