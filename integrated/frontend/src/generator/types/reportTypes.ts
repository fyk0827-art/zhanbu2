/** 报告产品线（与 reportId 哈希、订单解锁一一对应） */
export type ReportTypeId = "simple" | "full" | "marriage" | "career";

export interface ReportTypeMeta {
  id: ReportTypeId;
  name: string;
  subtitle: string;
  wordCount: string;
  /** 是否可进入生成流程 */
  available: boolean;
  /** 展示用参考价（实际金额由后端订单决定） */
  priceYuan: string;
  /** 匹配 Markdown ## 标题，用于判定付费区块 */
  premiumKeywords: string[];
  paywallTitle: string;
  paywallItems: string[];
}

export const REPORT_TYPES: ReportTypeMeta[] = [
  {
    id: "simple",
    name: "简版人生剧本",
    subtitle: "核心画像速览",
    wordCount: "约 1000 字",
    available: true,
    priceYuan: "19.90",
    premiumKeywords: ["人生各领域", "总结"],
    paywallTitle: "解锁简版完整内容",
    paywallItems: [
      "八大领域飞星结论（精简版）",
      "总结与本月行动指令",
    ],
  },
  {
    id: "full",
    name: "完整版人生剧本",
    subtitle: "行动蓝图 · 含脉络与避坑",
    wordCount: "约 3500–4500 字",
    available: true,
    priceYuan: "29.90",
    premiumKeywords: ["人生脉络", "环境与贵人", "避坑", "总结"],
    paywallTitle: "解锁完整行动蓝图",
    paywallItems: [
      "人生脉络建议（分阶段成长路径）",
      "环境与贵人（旺财 / 必须远离）",
      "避坑指南（人 / 事 / 环境）",
      "总结与行动指令",
    ],
  },
  {
    id: "marriage",
    name: "婚姻版",
    subtitle: "恋爱模式 · 正缘导航 · 关系修复",
    wordCount: "约 3000–3500 字",
    available: true,
    priceYuan: "39.90",
    premiumKeywords: ["正缘", "关系痛点", "关系修复", "行动指令"],
    paywallTitle: "解锁婚姻版完整报告",
    paywallItems: [
      "正缘导航（场合 · 识别特征 · 时间窗口）",
      "关系痛点（模式拆解 + 具体话术）",
      "关系修复与经营（3 条铁律）",
      "行动指令（本周清单 + 时间线）",
    ],
  },
  {
    id: "career",
    name: "事业版",
    subtitle: "职业赛道 · 财富节奏 · 突破策略",
    wordCount: "约 3000–3500 字",
    available: true,
    priceYuan: "39.90",
    premiumKeywords: ["事业卡点", "突破策略", "创业还是打工", "行动指令"],
    paywallTitle: "解锁事业版完整报告",
    paywallItems: [
      "事业卡点（模式拆解 + 具体行动）",
      "突破策略（加速器 + 财富护城河）",
      "创业还是打工（含前提条件）",
      "行动指令（本周清单 + 事业时间线）",
    ],
  },
];

export function getReportTypeMeta(id: ReportTypeId): ReportTypeMeta {
  return REPORT_TYPES.find((t) => t.id === id) ?? REPORT_TYPES[1];
}

export function isReportTypeId(v: string | null | undefined): v is ReportTypeId {
  return v === "simple" || v === "full" || v === "marriage" || v === "career";
}

export function parseReportTypeId(v: string | null | undefined): ReportTypeId {
  return isReportTypeId(v) ? v : "full";
}
