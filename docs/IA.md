# 老人陪伴助手 IA 与流程补充

## 1. 站点地图（移动端）
```text
老人陪伴助手
├── 首页
│   ├── 语音主入口
│   ├── 快捷提醒
│   ├── 紧急入口
│   └── 最近会话摘要
├── 对话
│   ├── 当前会话
│   ├── 历史会话列表
│   └── 会话详情
├── 提醒
│   ├── 今日提醒
│   ├── 周期提醒
│   └── 新建/编辑提醒
├── 应急
│   ├── 紧急模式首页
│   ├── 求助引导步骤
│   └── 应急记录详情
└── 我的
    ├── 基础资料
    ├── 紧急联系人管理
    ├── 语音设置
    └── 隐私与授权说明
```

## 2. 实体关系（业务视角）
```text
[UserProfile] 1 ─── n [ConversationSession]
[ConversationSession] 1 ─── n [ConversationMessage]
[UserProfile] 1 ─── n [Reminder]
[UserProfile] 1 ─── n [EmergencyContact]
[UserProfile] 1 ─── n [EmergencyEvent]
[EmergencyEvent] 1 ─── n [EventActionLog]
```

## 3. 导航与跳转规则
- 首页语音按钮直达对话页并自动进入录音态。
- 任意页面若触发高危词，强制切换到应急页。
- 应急页结束后，默认返回首页并弹出“通知家属”确认。
- 我的页仅放配置项，不承载高频任务型动作。

## 4. 状态模型（应急）
```text
idle -> risk_detected -> emergency_guiding -> help_called -> follow_up -> closed
```

状态说明：
- `idle`：普通对话与任务状态。
- `risk_detected`：命中风险规则，进入判定提示。
- `emergency_guiding`：执行分步引导，强调先求助。
- `help_called`：用户已触发电话动作（120 或联系人）。
- `follow_up`：记录补充信息、等待家属确认。
- `closed`：事件关闭，可追溯不可删除（仅归档）。

## 5. 可观测性字段建议
- 会话级：会话 ID、开始时间、结束时间、轮次数、风险标签。
- 提醒级：提醒 ID、触发时间、完成时间、完成方式。
- 应急级：事件 ID、触发词、风险级别、关键动作、闭环结果。
