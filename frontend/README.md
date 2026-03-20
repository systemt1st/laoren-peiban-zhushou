# 老人陪伴助手前端（移动端 MVP）

面向老人使用的手机 Web 前端，语音优先、文字兜底，包含：

- 首页：快速进入聊天、提醒、应急、联系人。
- 陪伴对话：语音识别输入、文本输入、语音播报回复。
- 提醒区：新增提醒、启停提醒。
- 应急区：一键拨打 120、快速症状上报、求助步骤。
- 家属区：联系人列表与关键记录摘要。

## 目录结构

```text
frontend/
├── src/
│   ├── components/      # 公共组件（底部导航、语音输入按钮）
│   ├── lib/             # 语音封装 + API 调用层
│   ├── pages/           # 首页/聊天/提醒/应急/家属页
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── types.ts
├── index.html
├── package.json
└── vite.config.ts
```

## 本地启动

```bash
cd frontend
npm install
npm run dev
```

开发服务默认监听 `0.0.0.0:5173`，同局域网手机可访问：

`http://你的电脑IP:5173`

## 构建

```bash
npm run build
npm run preview
```

## 环境变量

在 `frontend/.env` 中配置后端地址：

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

默认值也是 `http://localhost:8000/api/v1`。

## API 对接约定（占位）

- `GET /profiles/default`
- `GET /reminders`
- `POST /reminders`
- `PATCH /reminders/{id}`
- `GET /contacts`
- `GET /records?limit=20`
- `POST /chat`
- `POST /emergency-events`

## 已知限制

- 语音识别依赖浏览器 `Web Speech API`，部分安卓浏览器不支持。
- 语音播报依赖 `speechSynthesis`，旧设备可能不可用。
- 当前未接入登录鉴权，默认单用户演示模式。
