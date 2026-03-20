# 老人陪伴助手

老人陪伴助手是一个面向 60+ 老年人的手机 Web 端陪伴与生活助理，强调：

- 语音为主，文字为辅，尽量做到“开口就能用”
- 在陪聊之外覆盖提醒、应急引导、关键事件留痕
- 支持家属或后台追溯关键记录，降低独居风险

## 项目结构

- `frontend/`：React + TypeScript 移动端 Web
- `backend/`：FastAPI + SQLite 后端服务
- `docs/PRD.md`：完整产品需求文档
- `docs/IA.md`：信息架构与流程补充
- `docs/TEAM.md`：团队协作与发布检查建议

## 本地启动

### 1. 启动后端

```bash
cd backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认访问地址：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8000`
- API 文档：`http://127.0.0.1:8000/docs`

如果想在手机上调试，确保手机与电脑处于同一局域网，然后访问：

```bash
http://<电脑局域网 IP>:5173
```

## Docker 部署

项目已提供容器化部署文件，可直接在服务器上执行：

```bash
docker compose up -d --build
```

部署后访问：

- Web 页面：`http://<服务器 IP>:8080`
- 后端 API：`http://<服务器 IP>:8000`

前端容器会将 `/api/*` 代理到后端，因此手机浏览器直接访问 `8080` 即可。

## 验证命令

### 后端

```bash
cd backend
uv run ruff check app tests
uv run pytest
```

### 前端

```bash
cd frontend
npm run lint
npm run build
```

## 当前 MVP 能力

- 首页与陪伴对话：支持语音识别、文字输入、语音播报
- 提醒管理：新增提醒、启停提醒、列表查看
- 应急模式：风险表达识别、快速拨打 120、联系人呼叫入口
- 家属视图：联系人管理、关键记录摘要、老人基础画像
- 关键留痕：聊天记录、应急事件、提醒状态
