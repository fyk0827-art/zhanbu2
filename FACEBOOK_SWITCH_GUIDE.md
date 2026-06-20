# Facebook 数据集更换操作指南

> 基于多次实际踩坑总结，严格按照步骤执行，不要跳步。

---

## 前置信息

| 环境 | 域名 | 分支 | 后端端口 | Systemd Service | 项目目录 | 数据库 |
|---|---|---|---|---|---|---|
| 正式 | divinlove.com | main | 8890 | divinlove-main-backend | /var/www/divinlove-main/ | integrated_platform_main |
| 开发 | dev.divinlove.com | dev | 8880 | divinlove-backend | /var/www/divinlove/ | integrated_platform |

---

## 步骤 1：收集新数据集信息

从 Facebook Events Manager 获取：

| 参数 | 示例 |
|---|---|
| Pixel ID | `1000287272912455` |
| CAPI Access Token | `EAA...ZDZD`（长字符串） |
| Test Event Code（可选） | `TEST56505` |

> ⚠️ CAPI Token 需要有 `ads_management` 权限，并且授权给对应的 Pixel。
> ⚠️ Token 刚生成后可能有几分钟权限延迟，400 不一定是配置错了。

---

## 步骤 2：修改代码（本地）

### 2a. 浏览器 Pixel — `frontend/index.html`

```diff
- fbq('init', '旧ID');
+ fbq('init', '新ID');
```

以及同一文件底部的 noscript 标签：

```diff
- <img ... src="https://www.facebook.com/tr?id=旧ID&ev=PageView...
+ <img ... src="https://www.facebook.com/tr?id=新ID&ev=PageView...
```

> ❌ **不要** 加 `{testEventCode: '...'}` 参数——它对这个 Pixel 不起作用（传的是 `ud[]` 用户数据，不是测试事件标记）。

### 2b. 后端 CAPI — `backend/src/main/resources/application-prod.yml`

```yaml
meta:
  pixel-id: 新ID                              # ← 改
  capi-access-token: ${META_CAPI_ACCESS_TOKEN} # 保持环境变量引用
  test-event-code: "TEST56505"                 # 测试阶段加上，上线前清空
  product-name: Full Life Blueprint Report
  currency: USD
```

### 2c. 提交到 git

```bash
git add -A
git commit -m "feat: switch Facebook pixel to 新ID"
git push origin main
```

---

## 步骤 3：更新服务器（最容易漏的坑）

### ⚠️ 必须同时更新两处，缺一不可

**第一处：`application-prod.yml`（源码）**

```bash
ssh ubuntu@43.162.105.233
cd /var/www/divinlove-main
git pull origin main
```

git pull 会自动拉取步骤 2b 的改动。

**第二处：`/etc/divinlove/main.env`（环境变量，优先级更高！）**

```bash
sudo sed -i 's|^META_CAPI_ACCESS_TOKEN=.*|META_CAPI_ACCESS_TOKEN=新TOKEN|' /etc/divinlove/main.env
```

> ⚠️ **环境变量优先级高于 `application-prod.yml`**，如果只改 yml 不改 env，
> 后端会继续用旧 token → 请求新 pixel → Facebook 返回 400 permission error → 排查数小时。

### 重建并重启

```bash
cd /var/www/divinlove-main/integrated/backend
mvn package -DskipTests -q
sudo systemctl restart divinlove-main-backend
```

---

## 步骤 4：构建前端并部署

```bash
# 本地构建
cd integrated/frontend
rm -rf dist
VITE_API_BASE_URL=https://divinlove.com npx vite build

# 同步到服务器
rsync -avz --delete -e "ssh" dist/ ubuntu@43.162.105.233:/var/www/divinlove-main/integrated/frontend/dist/
```

---

## 步骤 5：验证

### 5a. CAPI 测试（从服务器执行）

```bash
ssh ubuntu@43.162.105.233

TOKEN='你的CAPI_ACCESS_TOKEN'
PIXEL='你的PIXEL_ID'

curl -s -X POST "https://graph.facebook.com/v19.0/${PIXEL}/events?access_token=${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\":[{
      \"event_name\":\"PageView\",
      \"event_time\":$(date +%s),
      \"action_source\":\"website\",
      \"event_id\":\"test-$(date +%s)\",
      \"event_source_url\":\"https://divinlove.com\",
      \"user_data\":{
        \"client_ip_address\":\"127.0.0.1\",
        \"client_user_agent\":\"curl\"
      }
    }],
    \"test_event_code\":\"TEST56505\"
  }"
```

> 返回 `{"events_received":1}` 即 CAPI 正常工作。
> ⚠️ `user_data` 必须有 `client_ip_address` 和 `client_user_agent`，否则返回 `error_subcode: 2804050`。

### 5b. 浏览器 Pixel 验证

打开浏览器开发者工具 → Network → 过滤 `facebook.com/tr` → 访问网站：
- 确认 Pixel ID 是新 ID
- 确认无 `ud[testEventCode]` 参数（干净的真实事件）
- 确认 HTTP 200

### 5c. 查看 facebook_events 表

```bash
sudo mysql -e "SELECT order_id, status, LEFT(response_text,80) AS resp \
  FROM integrated_platform_main.facebook_events ORDER BY created_at DESC LIMIT 5;"
```

---

## 步骤 6：测试事件 → 正式

测试阶段 `test-event-code` 设为 `TEST56505`，此时所有 CAPI Purchase 事件会出现在 Facebook Events Manager → **测试事件** 面板。

确认测试通过后清空：

```yaml
test-event-code: ""
```

然后重新 mvn package + restart。

---

## 常见错误及排查

| 错误 | 原因 | 解决 |
|---|---|---|
| `400 Object with ID does not exist` | Token 没权限 / yml 和 env 不一致 | 检查 `main.env` 的 `META_CAPI_ACCESS_TOKEN` |
| `400 user_data 不足` | `user_data` 缺少必填字段 | 加上 `client_ip_address` 和 `client_user_agent` |
| 浏览器 Pixel 看不到测试事件 | 浏览器 Pixel 的 `testEventCode` 无效 | 去 Events Manager UI 「测试事件→打开链接」 |
| `events_received: 0` | Token 格式不对 | 确认 token 没有换行符或多余空格 |

---

## 关键教训（不要重复踩）

1. ❌ 不要在 `fbq('init')` 加 `{testEventCode: '...'}` —— 对浏览器 Pixel 无效
2. ⚠️ 改完 `application-prod.yml` 必须同时改 `main.env`
3. ✅ CAPI 的 `test_event_code` 在请求体顶层 → Test Events 能显示
4. ✅ 浏览器 PageView 是真实事件 → 去 Events Dashboard 主面板看
