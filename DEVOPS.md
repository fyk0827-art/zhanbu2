# DevOps & 配置备忘录

## 环境

| 域名 | 分支 | 端口 | Systemd Service | 项目目录 | 数据库 | PayPal |
|---|---|---|---|---|---|---|
| dev.divinlove.com | dev | 8880 | divinlove-backend | /var/www/divinlove/ | integrated_platform | sandbox |
| divinlove.com | main | 8890 | divinlove-main-backend | /var/www/divinlove-main/ | integrated_platform_main | **live** |

## 管理员

- 后台: https://divinlove.com/admin
- 账号: admin / admin123

## Facebook 数据集

| 项目 | 当前值 |
|---|---|
| Pixel ID | `1000287272912455` |
| CAPI Access Token | 见服务器 `/etc/divinlove/main.env` 和 `application-prod.yml` |
| Test Event Code | `TEST56505` |

### 换数据集流程

1. **改 3 处：**
   - `frontend/index.html` — `fbq('init', '新ID')` + noscript 的 `tr?id=`
   - `backend/application-prod.yml` (main) — `pixel-id` + `capi-access-token` + `test-event-code`
   - dev 服务器的 `application-prod.yml` 同理

2. **测试（不要踩的坑）：**
   ```bash
   # CAPI 测试（从服务器执行，不要本地测）
   curl -s -X POST "https://graph.facebook.com/v19.0/${PIXEL}/events?access_token=${TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"data":[{"event_name":"PageView","event_time":$(date +%s),"action_source":"website","event_id":"test-$(date +%s)","event_source_url":"https://divinlove.com","user_data":{"client_ip_address":"127.0.0.1","client_user_agent":"curl"}}],"test_event_code":"TEST56505"}'
   # 返回 events_received:1 即 OK
   ```

3. **浏览器 Pixel 测试（只看 CAPI，浏览器不要折腾了）：**
   - ❌ `fbq('init', ..., {testEventCode: '...'})` 传的是 `ud[testEventCode]`（用户数据），不是测试事件标记
   - ❌ Cookie `fb_test_event_code` 也没用，Pixel SDK 不认
   - ❌ 手机浏览器没办法主动进入测试模式（除非 Events Manager UI 「打开链接」）
   - ✅ 直接用 Events Dashboard 主面板看实时 PageView
   - ✅ CAPI 的 `test_event_code` 放请求体顶层 → Test Events 能正常显示

4. **⚠️ 必须同时更新两处（最容易忘的坑）：**
   - `application-prod.yml` — 改 `pixel-id` + `capi-access-token`
   - `/etc/divinlove/main.env` — 改 `META_CAPI_ACCESS_TOKEN`（环境变量优先级高于 yml，不更新的话旧 token 会覆盖新配置）
   - 只改 yml 不改 env → 后端用旧 token 请求新 pixel → Facebook 报 400 permission error → 排查半天

5. **CAPI 的 user_data 不能为空：**
   - Facebook 要求至少包含 `client_ip_address` 和 `client_user_agent`
   - 后端已加 fallback：`127.0.0.1` + `unknown`
   - 测试时也要带上这两个字段，否则 Facebook 返回 `error_subcode: 2804050`

4. **注意事项：**
   - CAPI `user_data` 不能为空！至少要有 `client_ip_address` 和 `client_user_agent`
   - 新 token 生成后有几分钟权限延迟，400 不代表一定有问题，等几分钟重试
   - CAPI 的 `test_event_code` 和浏览器 Pixel 的 `testEventCode` 是两回事

## 51.la 事件埋点

| 事件标识 | 触发时机 |
|---|---|
| name | 输入名字失焦 |
| birth | 选择出生日期 |
| Place | 选择城市 |
| next | 点击"连接星盘" |
| chart_calculate | 开始计算星盘 |
| report_generating | AI 开始生成报告 |
| report_success | 报告生成成功 |
| report_fail | 报告生成失败 |
| pay_click | 点击支付按钮 |
| pay_success | 支付成功 |
| pay_fail | 支付失败 |

API: `LA.track(event_identification)` — 需要在 51.la 后台先创建事件标识

## AI 模型

| 项目 | 当前值 |
|---|---|
| Base URL | `https://api.deepseek.com` |
| API Key | `sk-e3ed505dbeae45e8b9a2b3c923b118a1` |
| Model | `deepseek-v4-pro` |

## 付费内容控制

| 文件 | 控制什么 |
|---|---|
| `types/reportTypes.ts` | `premiumKeywords` — 付费关键词匹配 |
| `pages/BlueprintReport.tsx` | `getGenericFreeCount()` — 免费段落数 |
| `pages/BlueprintReport.tsx:premiumKeywordsFor()` | 英文关键词（要和中文章对应一致） |

## 后端配置（application-prod.yml）

存储在 `backend/src/main/resources/application-prod.yml`（每个分支各自一份）。
服务器上也有一份副本，`mvn package` 后打入 jar 包。

### 环境变量（/etc/divinlove/main.env）

```
DB_PASSWORD=...
JWT_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID_PROD=...
CORS_ALLOWED_ORIGINS=https://divinlove.com
PAYMENT_BASE_URL=https://divinlove.com
PAYMENT_FRONTEND_URL=https://divinlove.com
```

## 常用命令

```bash
# 查看后端日志
sudo journalctl -u divinlove-main-backend --no-pager -n 100

# 重启后端
sudo systemctl restart divinlove-main-backend

# 查看 facebook 事件
sudo mysql -e 'SELECT order_id, status, LEFT(response_text,80) AS resp FROM integrated_platform_main.facebook_events ORDER BY created_at DESC LIMIT 10;'

# 前端构建（本地）
cd integrated/frontend && rm -rf dist && VITE_API_BASE_URL=https://divinlove.com npx vite build
```

## 常见问题

| 现象 | 原因 | 解决 |
|---|---|---|
| JS 加载 500 / MIME 错误 | Vite `base: "./"` 导致相对路径 | 已改为 `base: "/"` |
| 浏览器报 network error | 火山方舟国内接口海外访问慢 | 已切 DeepSeek 官方 API |
| CAPI 返回 400 pixel不存在 | Token 权限延迟 / 新 pixel 未就绪 | 等几分钟重试 |
| CAPI 返回 400 user_data 不足 | `user_data` 缺少必填字段 | 已加 fallback IP+UA |
| 51.la 收不到事件 | `LA.track()` 不是 51.la API | 已在后台创建事件标识即可 |
| 付费内容不生效 | 中文关键词不匹配英文报告标题 | `premiumKeywordsFor()` 加英文关键词 |
