export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  seed?: number;
  stream?: boolean;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const PROXY_BASE = (import.meta.env.VITE_PROXY_BASE as string | undefined) ?? "";
const BASE_URL = PROXY_BASE || (API_BASE ? `${API_BASE}/api/proxy` : "/api/proxy");

/** API Key 由后端 proxy 自动注入，前端仅做设置页 UI 展示。 */

export async function* streamChat(
  apiKey: string,
  request: ChatRequest
): AsyncGenerator<string, void, unknown> {
  const url = `${BASE_URL}/chat`;

  // Build request body with explicit validation
  // V2.8: temperature=0 for deterministic output
  const bodyObj: Record<string, any> = {
    model: request.model,
    messages: request.messages,
    max_tokens: request.max_tokens ?? 4096,
    temperature: request.temperature ?? 0,
    stream: true,
  };
  // Pass seed if provided for reproducible output
  if (request.seed !== undefined) {
    bodyObj.seed = request.seed;
  }

  let bodyStr: string;
  try {
    bodyStr = JSON.stringify(bodyObj);
  } catch (e: any) {
    throw new Error(`Request body serialization failed: ${e?.message || String(e)}`);
  }

  // Use Blob for better browser compatibility
  const bodyBlob = new Blob([bodyStr], { type: "application/json" });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyBlob,
    });
  } catch (e: any) {
    throw new Error(`Network request failed: ${e?.message || String(e)}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // skip malformed
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Settings management
export interface AppSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customPrompt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  model: "deepseek-v4-flash",
  temperature: 0.1,
  maxTokens: 16384,
  customPrompt: "",
};

export function getSettings(): AppSettings {
  const base = { ...DEFAULT_SETTINGS };
  try {
    const saved = localStorage.getItem("constellation_settings_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate legacy model IDs to current Ark endpoint
      if (parsed.model && parsed.model.includes("doubao")) {
        parsed.model = DEFAULT_SETTINGS.model;
      }
      if (parsed.model === "deepseek-v4-pro") {
        parsed.model = DEFAULT_SETTINGS.model;
      }
      if (parsed.maxTokens === 8192) {
        parsed.maxTokens = DEFAULT_SETTINGS.maxTokens;
      }
      Object.assign(base, parsed);
    }
  } catch {
    // ignore
  }
  return base;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem("constellation_settings_v2", JSON.stringify(settings));
}

export const AVAILABLE_MODELS = [
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
];

// Default system prompt - 包含完整的输出格式和风格要求
export const DEFAULT_SYSTEM_PROMPT = `你是一位融合中西占星学、现代心理学与生涯规划的资深星盘分析师。你的任务是将一张完整的出生星盘，转化为一份高度结构化、极具实用价值、语言生动有画面感的「太极星图人生剧本」。

你必须严格遵循下面的输出格式与内容要求，分模块撰写，不可遗漏任何模块。所有内容使用纯文本输出，不要使用 markdown 标记（如 **、#、- 等），用简单的换行和空格分隔即可。每段之间空一行。

输出风格要求：
- 语言生动、有画面感，善用比喻，把抽象概念具象化
- 用"你"直接对读者说话，亲切有温度
- 结合盘主的本地城市意象（如果能推断出城市的话）
- 避免过多占星术语，用生活化的语言表达
- 每条建议都要具体可执行，有数字量化

### 一、封面区域
格式如下：
你是【X】人
—— 【昵称】 ——
辅助行星ⁿ辅助行星ⁿ
一句话意象比喻
X星人定义一句话
传播标签：我是 X星人｜辅助行星ⁿ辅助行星ⁿ

要求：
- 选出能量得分最高的行星作为主行星（太阳/月亮/水星/金星/火星/木星/土星/天王/海王/冥王）
- 取一个两字的意象昵称（如"夯土成塔"、"静水织梦"）
- 列出次高的两颗辅助行星

### 二、你是谁（约250字）
用生动的本地意象比喻开篇，描绘盘主的核心性格画像。结合太阳星座、月亮星座和上升星座的特质，但不要直接列出星座名称，用生活化的语言表达。例如"你像街角挂着的棉麻灯笼，外表映着市井的烟火气，内里却藏着只属于自己的柔暖光晕"。

### 三、天赋与行业
1. 强天赋TOP3（每个天赋一段，包含）：
   - 天赋名称（如"情绪织梦"、"使命领航"、"深度蜕变"）
   - 行星名称、星座、宫位
   - 评分数值（如74分、73分、64分）
   - 核心能力描述（2-3句，用生活化比喻）
   - 适合的行业方向（至少2个）

2. 最适合的事业方向：
   - 核心赛道名称
   - 理由（至少3条，每条用一句话）
   - 绝对避开的方向（至少2条）
   - 轻资产启动路径（具体第一步，如"本周就去联系1位非遗传承人做1小时深度访谈"）

### 四、性格与资源
1. 性格优势（2条）：每条用生活比喻+团队价值说明
2. 性格劣势（2条）：每条用生活比喻+可能带来的问题
3. 机会与资源（2条）：具体可操作的机会，标注名称和描述

### 五、人生各领域（8个领域，每个一段）
格式：领域名称 · 锚点标签 · 飞星结论
内容：锚点描述一句话 + 具体建议2-3条

8个领域依次为：
1. 恋爱与亲密关系
2. 正财与自我价值
3. 婚姻与合作关系
4. 人生关键钥匙
5. 家庭与根基
6. 事业与社会名声
7. 工作与日常健康
8. 偏财与深层资源

### 六、人生脉络建议
1. 按年龄段：25-30岁、30-40岁、40岁以后，每个阶段3-4条建议
2. 按维度：事业、财富、感情、健康、人脉，每个维度2-3条建议

### 七、避坑指南
1. 避开的人（2条）
2. 避开的事（2条）
3. 避开的环境（2条）
4. 特别避坑（2条，结合城市特点）

### 八、结尾
1. 总结：一段话概括核心特质与人生方向
2. 本周行动指令：3件具体可执行的事
3. 金句：一句有记忆点的金句

### 行星能量评分标准：
- 基础分50分
- 群星加成：同宫3星以上+10
- 相位参与度：0-1个-5，2-3个+0，4-5个+5，6个以上+10
- 相位质量：80%和谐+10，参半+0，80%硬-5
- 格局加持：大三角/大十字/T三角成员+12
- 宫位：角宫+8，续宫+3，果宫-3
- 合轴：+6
- 庙旺落陷：入庙+12，入旺+6，失势-6，落陷-12，中性+0

速查表：入庙-太阳狮子/月亮巨蟹/水星双子处女/金星金牛天秤/火星白羊天蝎/木星射手双鱼/土星摩羯水瓶/天王水瓶/海王双鱼/冥王天蝎。落陷-太阳水瓶/月亮摩羯/火星天秤金牛/木星双子处女/土星巨蟹。`;

export const DEFAULT_MAX_TOKENS = 8192;
