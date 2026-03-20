# 服务器部署说明

当前线上部署采用“最小侵入”策略，适用于共享服务器：

- 宿主机 `nginx` 继续作为统一入口
- 前端容器仅绑定 `127.0.0.1:18080`
- 后端不暴露宿主机端口，仅供前端容器内网访问
- 新增独立域名站点 `lr.wxwx.me`，不改已有项目的公网入口

## 目录建议

```bash
/srv/laoren-peiban-zhushou
```

## 启动方式

```bash
docker compose -f deploy/docker-compose.server.yml up -d --build
```

## Nginx 接入

将 [lr.wxwx.me.conf](/Users/t1st/Documents/aicoding/python/auto-post/老人陪伴助手/deploy/nginx/lr.wxwx.me.conf) 放到宿主机 Nginx 站点目录，并确认：

- `proxy_pass` 指向 `http://127.0.0.1:18080`
- 证书路径按服务器实际情况调整
- `nginx -t` 通过后再 reload

## 验收

```bash
curl http://127.0.0.1:18080/
curl http://127.0.0.1:18080/api/v1/health
curl https://lr.wxwx.me/api/v1/health
```

## 回滚

```bash
docker compose -f deploy/docker-compose.server.yml down
```

同时移除宿主机 `lr.wxwx.me` 的独立站点配置并 reload `nginx`。
