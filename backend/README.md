# 老人陪伴助手后端（FastAPI MVP）

面向“老人陪伴助手”的后端最小可用版本，提供：

- 配置管理（`.env` + 环境变量）
- SQLite 数据存储
- 用户画像 / 紧急联系人 / 提醒 / 对话记录 / 应急事件
- 陪伴聊天与风险识别（规则引擎）
- OpenAI 兼容接口预留（当前为占位降级）

## 1. 目录结构

```text
backend/
├── app/
│   ├── api/routes.py
│   ├── core/config.py
│   ├── db/{connection.py,repository.py,schema.py}
│   ├── schemas/
│   ├── services/companion.py
│   └── main.py
├── tests/
├── .env.example
└── pyproject.toml
```

## 2. 快速启动

### 2.1 安装依赖

```bash
cd backend
uv sync --all-extras
```

### 2.2 配置环境变量

```bash
cp .env.example .env
```

### 2.3 启动服务

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

打开接口文档：

- `http://127.0.0.1:8000/docs`

## 3. 测试

```bash
cd backend
uv run pytest
```

## 4. 关键配置项

所有变量都以 `LPS_` 为前缀：

- `LPS_DATABASE_URL`：例如 `sqlite:///./data/laoren_companion.db`
- `LPS_CHAT_PROVIDER`：`rule` 或 `openai_compatible`
- `LPS_OPENAI_BASE_URL` / `LPS_OPENAI_API_KEY`：OpenAI 兼容模式预留

## 5. 主要 API（MVP）

健康检查：

- `GET /api/v1/health`

用户画像：

- `POST /api/v1/users`
- `GET /api/v1/users`
- `GET /api/v1/users/{user_id}`
- `PATCH /api/v1/users/{user_id}`

紧急联系人：

- `POST /api/v1/users/{user_id}/contacts`
- `GET /api/v1/users/{user_id}/contacts`
- `DELETE /api/v1/contacts/{contact_id}`

提醒：

- `POST /api/v1/users/{user_id}/reminders`
- `GET /api/v1/users/{user_id}/reminders`
- `PATCH /api/v1/reminders/{reminder_id}`

陪伴与应急：

- `POST /api/v1/users/{user_id}/chat`
- `GET /api/v1/users/{user_id}/chat/history`
- `GET /api/v1/users/{user_id}/events`
- `PATCH /api/v1/events/{event_id}/resolve`

## 6. 聊天风控逻辑说明（当前版本）

- 识别到“胸痛/呼吸困难/晕倒”等关键词时，自动进入应急模式。
- 系统会写入 `emergency_events`，并返回 `guidance` 指引。
- 不做医疗诊断，只做风险提示与求助流程引导。

