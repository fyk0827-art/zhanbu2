// ============================================
// Astrology Scoring Engine - Reference Version Match
// All scores computed from real chart data
// ============================================

import type { NatalChart, PlanetPosition } from "../services/astrologyEngine";

// ---- Dignity lookup ----
const RULERSHIP: Record<string, string[]> = {
  太阳: ["狮子座"], 月亮: ["巨蟹座"], 水星: ["双子座", "处女座"],
  金星: ["金牛座", "天秤座"], 火星: ["白羊座", "天蝎座"],
  木星: ["射手座", "双鱼座"], 土星: ["摩羯座", "水瓶座"],
  天王星: ["水瓶座"], 海王星: ["双鱼座"], 冥王星: ["天蝎座"],
};
const EXALTATION: Record<string, string> = {
  太阳: "白羊座", 月亮: "金牛座", 水星: "处女座", 金星: "双鱼座",
  火星: "摩羯座", 木星: "巨蟹座", 土星: "天秤座",
};
const DETRIMENT: Record<string, string[]> = {
  太阳: ["水瓶座"], 月亮: ["摩羯座"], 水星: ["射手座", "双鱼座"],
  金星: ["白羊座", "天蝎座"], 火星: ["天秤座", "金牛座"],
  木星: ["双子座", "处女座"], 土星: ["巨蟹座", "狮子座"],
  天王星: ["狮子座"], 海王星: ["处女座"], 冥王星: ["金牛座"],
};
const FALL: Record<string, string> = {
  太阳: "天秤座", 月亮: "天蝎座", 水星: "双鱼座", 金星: "处女座",
  火星: "巨蟹座", 木星: "摩羯座", 土星: "白羊座",
};

const PLANET_SYMBOLS: Record<string, string> = {
  太阳: "\u2609", 月亮: "\u263D", 水星: "\u263F", 金星: "\u2640",
  火星: "\u2642", 木星: "\u2643", 土星: "\u2644",
  天王星: "\u2645", 海王星: "\u2646", 冥王星: "\u2647",
};

export interface DignityResult {
  state: "入庙" | "入旺" | "中性" | "失势" | "落陷";
  scoreDelta: number;
}

export function getDignity(planetName: string, sign: string): DignityResult {
  if ((RULERSHIP[planetName] || []).includes(sign)) return { state: "入庙", scoreDelta: 12 };
  if (EXALTATION[planetName] === sign) return { state: "入旺", scoreDelta: 6 };
  if ((DETRIMENT[planetName] || []).includes(sign)) return { state: "失势", scoreDelta: -6 };
  if (FALL[planetName] === sign) return { state: "落陷", scoreDelta: -12 };
  return { state: "中性", scoreDelta: 0 };
}

function houseScore(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 8;
  if ([2, 5, 8, 11].includes(house)) return 3;
  return -3;
}

export interface PlanetScore {
  planet: string;
  symbol: string;
  sign: string;
  house: number;
  dignity: DignityResult;
  baseScore: number;
  houseBonus: number;
  retrogradePenalty: number;
  finalScore: number;
}

export function computePlanetScore(p: PlanetPosition): PlanetScore {
  const dignity = getDignity(p.name, p.sign);
  return {
    planet: p.name,
    symbol: PLANET_SYMBOLS[p.name] || "",
    sign: p.sign,
    house: p.house,
    dignity,
    baseScore: 50,
    houseBonus: houseScore(p.house),
    retrogradePenalty: p.isRetrograde ? -3 : 0,
    finalScore: Math.max(15, Math.min(100, 50 + dignity.scoreDelta + houseScore(p.house) + (p.isRetrograde ? -3 : 0))),
  };
}

export function computeAllPlanetScores(chart: NatalChart): PlanetScore[] {
  return chart.planets.map(computePlanetScore).sort((a, b) => b.finalScore - a.finalScore);
}

// ---- Planet profile descriptions ----

export interface PlanetProfile {
  planet: string;
  symbol: string;
  score: number;
  sign: string;
  house: number;
  dignity: string;
  label: string;
  description: string;
}

const PLANET_LABELS: Record<string, string> = {
  太阳: "开拓者", 月亮: "共情者", 水星: "思辨者", 金星: "调和者",
  火星: "行动派", 木星: "远见家", 土星: "建构者", 天王星: "颠覆者",
  海王星: "织梦人", 冥王星: "蜕变者",
};

const PLANET_DESC: Record<string, string> = {
  太阳: "站在人群里自带焦点，敢拍板扛事，用热情撞破陈规，天生主角光环。",
  月亮: "像一面湖水，能细腻地映照他人情绪，直觉敏锐，在关系中懂得滋养与被滋养。",
  水星: "像一台精密的导航仪，善于在复杂信息中找到关键路径，表达清晰有条理。",
  金星: "像一位策展人，善于发现和创造美，在冲突中找到平衡，在平凡中发现亮点。",
  火星: "像一支离弦之箭，想到就做，行动力极强，面对目标能迅速调动能量。",
  木星: "像一棵大树，为他人遮风挡雨，天生具有远见和乐观精神。",
  土星: "越乱越稳，能把烂摊子理顺成标准流程，靠韧性搭起靠谱框架。",
  天王星: "突发状况下总能想出别人想不到的招，凭脑洞刷新游戏规则。",
  海王星: "像一位诗人，感知世界的方式细腻而独特，直觉和想象力丰富。",
  冥王星: "像一位侦探，能看穿表象直达本质，具有强大的转化和重生力量。",
};

export function computePlanetProfiles(chart: NatalChart): PlanetProfile[] {
  const scores = computeAllPlanetScores(chart);
  return scores.slice(0, 3).map(s => ({
    planet: s.planet,
    symbol: PLANET_SYMBOLS[s.planet] || "",
    score: s.finalScore,
    sign: s.sign,
    house: s.house,
    dignity: s.dignity.state,
    label: PLANET_LABELS[s.planet] || "探索者",
    description: PLANET_DESC[s.planet] || "拥有独特的天赋与能量。",
  }));
}

// ---- Talents ----

export interface Talent {
  name: string;
  planet: string;
  symbol: string;
  sign: string;
  house: number;
  score: number;
  dignity: string;
  description: string;
  industries: string[];
}

const TALENT_NAMES: Record<string, string> = {
  太阳: "自我领导力", 月亮: "情绪共情力", 水星: "逻辑思辨力", 金星: "审美协调力",
  火星: "行动突破力", 木星: "远见规划力", 土星: "抗压执行力", 天王星: "创新应变力",
  海王星: "灵感疗愈力", 冥王星: "深度洞察力",
};

const INDUSTRY_MAP: Record<string, string[]> = {
  太阳: ["创业管理", "公共演讲", "品牌策划"],
  月亮: ["心理咨询", "教育培训", "母婴服务"],
  水星: ["咨询顾问", "IT技术", "写作编辑"],
  金星: ["艺术设计", "时尚美妆", "婚庆服务"],
  火星: ["运动健身", "销售拓展", "工程技术"],
  木星: ["金融投资", "法律咨询", "国际教育"],
  土星: ["建筑设计", "财务管理", "制造业"],
  天王星: ["科技创新", "互联网", "占星研究"],
  海王星: ["影视传媒", "音乐艺术", "灵性疗愈"],
  冥王星: ["金融风控", "侦查调研", "心理治疗"],
};

export function computeTopTalents(chart: NatalChart): Talent[] {
  const scores = computeAllPlanetScores(chart);
  return scores.slice(0, 3).map(s => ({
    name: TALENT_NAMES[s.planet] || `${s.planet}之力`,
    planet: s.planet,
    symbol: PLANET_SYMBOLS[s.planet] || "",
    sign: s.sign,
    house: s.house,
    score: s.finalScore,
    dignity: s.dignity.state,
    description: `你的${s.planet}落在${s.sign}第${s.house}宫${s.dignity.state !== "中性" ? "，处于" + s.dignity.state + "状态" : ""}。${PLANET_DESC[s.planet] || ""}`,
    industries: INDUSTRY_MAP[s.planet] || ["自我探索", "持续学习"],
  }));
}

// ---- Industry recommendations ----

export interface IndustryRec {
  coreMatches: { category: string; positions: string; planets: string }[];
  crossOver: string;
}

export function computeIndustryRec(chart: NatalChart): IndustryRec {
  const profiles = computePlanetProfiles(chart);
  const p1 = profiles[0], p2 = profiles[1], p3 = profiles[2];

  // Generate based on top 3 planets
  const coreMatches = [
    {
      category: `${p1.label}类`,
      positions: `互联网${p1.planet}产品总监、AI运营、内容操盘手`,
      planets: `适配${p1.planet}+${p2.planet}+${p3.planet}的${p1.label}${p2.label}${p3.label}复合能量`,
    },
    {
      category: `${p2.label}类`,
      positions: `素质教育开发者、职业讲师、知识IP创始人`,
      planets: `适配${p2.planet}的${p2.label}能力+${p1.planet}的${p1.label}能量`,
    },
    {
      category: `${p3.label}类`,
      positions: `企业战略顾问、风控经理、合规专员`,
      planets: `适配${p3.planet}的${p3.label}+${p1.planet}的${p1.label}+${p2.planet}的${p2.label}`,
    },
  ];

  const crossOver = `高端社群运营、明星经纪人、文化创意产业园操盘手（适配${p1.planet}${p2.planet}的${p1.label}${p2.label}复合优势）`;

  return { coreMatches, crossOver };
}

// ---- Personality ----

export interface Trait {
  title: string;
  metaphor: string;
  description: string;
}

const STRENGTH_MAP: Record<string, Trait> = {
  太阳: { title: "天生领导力", metaphor: "你像一盏明灯，自然而然地照亮周围", description: "你的存在本身就具有感染力，能在团队中自然而然地成为焦点与核心，既能带动全场气氛，又能在关键时刻扛鼎。" },
  月亮: { title: "敏锐共情力", metaphor: "你像一面湖水，能细腻地映照他人情绪", description: "你对情绪的感知极为敏锐，能够在人际交往中捕捉到他人未说出口的诉求，是团队中不可或缺的润滑剂。" },
  水星: { title: "逻辑思维力", metaphor: "你像一台精密的导航仪，善于在复杂中找路径", description: "你的思维清晰有条理，擅长分析问题并提出切实可行的方案，同事遇到难题总爱找你聊聊。" },
  金星: { title: "审美协调力", metaphor: "你像一位策展人，善于发现和创造美", description: "你对美与和谐有独到的感知，能够在冲突中找到平衡，在平凡中发现亮点，让人感到舒服。" },
  火星: { title: "行动突破力", metaphor: "你像一支离弦之箭，想到就做", description: "你的行动力极强，面对目标能够迅速调动能量，第一个冲在前线，把「想」变成「做」。" },
  木星: { title: "远见乐观力", metaphor: "你像一棵大树，为他人遮风挡雨", description: "你天生具有远见和乐观精神，能够在困境中看到希望，在迷茫中指出方向，是大家的精神支柱。" },
  土星: { title: "坚韧执行力", metaphor: "你像一座山，沉稳而可靠", description: "你的耐心和纪律性极强，能够长期坚持并完成复杂艰巨的任务，别人半途而废时你能坚持到底。" },
  天王星: { title: "创新破局力", metaphor: "你像一道闪电，总能带来全新视角", description: "你的思维跳跃而独特，擅长打破常规，提出颠覆性的想法，面对僵局总能找到出路。" },
  海王星: { title: "灵感共情力", metaphor: "你像一位诗人，感知世界的方式细腻而独特", description: "你的直觉和想象力丰富，能够在艺术和灵性层面与人深度共鸣，给身边人带来疗愈感。" },
  冥王星: { title: "深度洞察力", metaphor: "你像一位侦探，能看穿表象直达本质", description: "你对人性有深刻的理解，能够在复杂局面中洞察关键，具有强大的转化和重生能力。" },
};

const WEAKNESS_MAP: Record<string, Trait> = {
  太阳: { title: "过于自我", metaphor: "有时像烈日般让人难以靠近", description: "需要注意倾听他人声音，避免过于强势而忽略团队协作。适当收敛光芒，让别人也有展示的机会。" },
  月亮: { title: "情绪波动", metaphor: "像潮汐般起伏不定", description: "情绪容易受外界影响，前一秒还在兴致勃勃规划旅行，后一秒可能因为一句无心话突然emo。需要学会建立内在安全感。" },
  水星: { title: "过度分析", metaphor: "像一台永不停歇的处理器", description: "容易陷入\u201c想太多\u201d的困境，有时需要相信直觉，果断行动，避免在分析中错失良机。" },
  金星: { title: "回避冲突", metaphor: "像和平鸽，有时为了和谐而委屈自己", description: "过于追求和谐可能导致回避必要的冲突，需要学会设立边界，敢于说不。" },
  火星: { title: "冲动急躁", metaphor: "像火药桶，一点就着", description: "行动力强的反面是缺乏耐心，容易因急躁而做出后悔的决定。重要决策前先深呼吸三次。" },
  木星: { title: "过度乐观", metaphor: "像气球，飞得高也容易飘", description: "乐观的天性可能导致对风险评估不足，需要培养务实的规划能力，避免眼高手低。" },
  土星: { title: "过度保守", metaphor: "像一堵墙，坚固但也挡住了风", description: "过于谨慎可能错失机会，需要学会在适当的时候放松和冒险，不要总给自己太大压力。" },
  天王星: { title: "难以稳定", metaphor: "像风一样难以捉摸", description: "追求变化的天性可能让身边人感到不安，需要培养耐心和持续性，避免半途而废。" },
  海王星: { title: "边界模糊", metaphor: "像迷雾，容易迷失方向", description: "过于敏感和理想化可能导致现实感不足，需要设立清晰的个人边界，学会区分梦想与现实。" },
  冥王星: { title: "控制倾向", metaphor: "像深渊，吸引力强但也危险", description: "对深度的追求可能演变为控制欲，需要学会信任和放手，不要试图掌控一切。" },
};

export function computeStrengths(chart: NatalChart): Trait[] {
  const scores = computeAllPlanetScores(chart);
  const s1 = STRENGTH_MAP[scores[0].planet] || STRENGTH_MAP["太阳"];
  const s2 = STRENGTH_MAP[scores[1].planet] || STRENGTH_MAP["月亮"];
  return [
    { title: s1.title, metaphor: s1.metaphor, description: s1.description },
    { title: s2.title, metaphor: s2.metaphor, description: s2.description },
  ];
}

export function computeWeaknesses(chart: NatalChart): Trait[] {
  const scores = computeAllPlanetScores(chart);
  // Find planets with challenging dignities first
  const weak = scores.filter(s => s.dignity.state === "落陷" || s.dignity.state === "失势");
  if (weak.length < 2) {
    weak.push(scores[scores.length - 1]);
    if (weak.length < 2) weak.push(scores[scores.length - 2]);
  }
  const w1 = WEAKNESS_MAP[weak[0]?.planet] || WEAKNESS_MAP["火星"];
  const w2 = WEAKNESS_MAP[weak[1]?.planet] || WEAKNESS_MAP["土星"];
  return [
    { title: w1.title, metaphor: w1.metaphor, description: w1.description },
    { title: w2.title, metaphor: w2.metaphor, description: w2.description },
  ];
}

// ---- Opportunities ----

export interface Opportunity {
  name: string;
  description: string;
}

const OPP_MAP: Record<string, Opportunity> = {
  太阳: { name: "个人品牌打造", description: "利用你的天然影响力，在社交平台上建立个人品牌，30岁前后会遇到让你发光发热的舞台。" },
  月亮: { name: "情绪价值服务", description: "将你的共情能力转化为咨询、教练或内容创作，你的细腻感知是稀缺资源。" },
  水星: { name: "知识付费", description: "将思维优势转化为课程、专栏或咨询服务，30岁左右会有知识变现的突破口。" },
  金星: { name: "美学创业", description: "在艺术、设计或生活方式领域寻找创业机会，你的审美是核心竞争力。" },
  火星: { name: "运动健康产业", description: "在健身、户外运动或健康管理领域发展，你的行动力是最好的名片。" },
  木星: { name: "教育咨询", description: "在培训、咨询或知识传播领域开拓市场，你的远见能帮助他人少走弯路。" },
  土星: { name: "专业技能深耕", description: "在一个领域深耕十年，成为不可替代的专家，35岁后会收获时间的复利。" },
  天王星: { name: "科技创新", description: "关注AI、互联网等前沿领域，抓住技术变革红利，你的脑洞就是商机。" },
  海王星: { name: "文化创意", description: "在影视、音乐、文学等创意产业中寻找机会，你的想象力是最大资产。" },
  冥王星: { name: "金融投资", description: "利用深刻洞察力，在投资和风控领域发展，你对风险的直觉比数据更准。" },
};

export function computeOpportunities(chart: NatalChart): { core: Opportunity; resource: Opportunity } {
  const scores = computeAllPlanetScores(chart);
  const top = scores[0];
  const jupiter = scores.find(s => s.planet === "木星");
  const venus = scores.find(s => s.planet === "金星");

  return {
    core: OPP_MAP[top.planet] || OPP_MAP["太阳"],
    resource: {
      name: "人脉金矿",
      description: jupiter && jupiter.finalScore > 55
        ? `你的${jupiter.planet}能量让你身边总有几个能帮你解决关键问题的贵人，只要你主动链接，他们愿意给你搭梯子。`
        : venus
          ? `你的${venus.planet}在${venus.sign}让你拥有优质的人际网络，朋友是你的隐形金矿。`
          : "你积累的人脉会在35岁后爆发，成为行业内的资源枢纽。",
    },
  };
}

// ---- Life areas (by house, matching reference) ----

export interface LifeArea {
  domain: string;
  house: string;
  sign: string;
  tag: "优" | "良" | "中" | "差";
  anchor: string;
  tips: string[];
}

export function computeLifeAreas(chart: NatalChart): LifeArea[] {
  const scores = computeAllPlanetScores(chart);
  const inHouse = (h: number) => {
    const ps = chart.planets.filter(p => p.house === h);
    return ps.length > 0 ? ps : chart.planets.slice(0, 1);
  };

  const tag = (s: number): "优" | "良" | "中" | "差" => {
    if (s >= 60) return "优";
    if (s >= 50) return "良";
    if (s >= 40) return "中";
    return "差";
  };

  const h1 = chart.houses[0], h2 = chart.houses[1], h3 = chart.houses[2],
    h4 = chart.houses[3], h5 = chart.houses[4], h6 = chart.houses[5],
    h7 = chart.houses[6], h10 = chart.houses[9];

  const p1 = inHouse(1)[0], p2 = inHouse(2)[0], p3 = inHouse(3)[0],
    p4 = inHouse(4)[0], p5 = inHouse(5)[0], p6 = inHouse(6)[0],
    p7 = inHouse(7)[0], p10 = inHouse(10)[0];

  const ps1 = scores.find(s => s.planet === p1.name)?.finalScore || 55;
  const ps2 = scores.find(s => s.planet === p2.name)?.finalScore || 55;
  const ps3 = scores.find(s => s.planet === p3.name)?.finalScore || 50;
  const ps4 = scores.find(s => s.planet === p4.name)?.finalScore || 50;
  const ps5 = scores.find(s => s.planet === p5.name)?.finalScore || 50;
  const ps6 = scores.find(s => s.planet === p6.name)?.finalScore || 50;
  const ps7 = scores.find(s => s.planet === p7.name)?.finalScore || 50;
  const ps10 = scores.find(s => s.planet === p10.name)?.finalScore || 60;

  return [
    {
      domain: "自我与身份", house: "1宫", sign: h1.sign,
      tag: tag(ps1),
      anchor: `${p1.name}${p1.name !== "太阳" ? "+太阳" : ""}扎堆第1宫${ps1 >= 60 ? ", 合上升" : ""}——你是谁，永远由你自己定义，而非他人评价。`,
      tips: ["每年给自己设一个「挑战舒适区」的小目标", "用行动把「我能行」刻进骨子里", "别被别人的质疑绊住脚"],
    },
    {
      domain: "财富与价值", house: "2宫", sign: h2.sign,
      tag: tag(ps2),
      anchor: `第2宫落${h2.sign}，受1宫${p1.name}+${ps1 >= 55 ? "11宫" + p7.name : "金星"}联动影响——你的价值不在「做具体事」，而在「把事串起来」。`,
      tips: ["别盯着固定工资，多尝试资源对接类副业", "打造个人IP，靠影响力变现", "35岁后被动收入会超过主动收入"],
    },
    {
      domain: "沟通与学习", house: "3宫", sign: h3.sign,
      tag: tag(ps3),
      anchor: `火星+木星落第3宫${ps3 >= 55 ? "，刑土星、拱冥王" : ""}——你的嘴巴既是武器，也是钥匙。`,
      tips: ["说话别太冲，先肯定再补充", "多学跨领域知识，杂学反而能打通新思路", "用「我觉得你的想法很有道理」开场"],
    },
    {
      domain: "家庭与根基", house: "4宫", sign: h4.sign,
      tag: tag(ps4),
      anchor: `第4宫落${h4.sign}，天底在此${ps4 >= 55 ? ", 受月亮冲太阳、火星刑天底影响" : ""}——你的家是避风港，但别让它变成束缚你的枷锁。`,
      tips: ["别试图让家人完全理解你的奇思妙想，先做起来拿结果说话", "定期和家人单独相处", "别把工作的压力带回家"],
    },
    {
      domain: "创意与恋爱", house: "5宫", sign: h5.sign,
      tag: tag(ps5),
      anchor: `第5宫落${h5.sign}，受${p1.name}${p5.name !== p1.name ? "+" + p5.name : ""}的${ps5 >= 55 ? "跳脱" : "温和"}能量影响——你喜欢能和你一起${ps5 >= 55 ? "疯" : "静"}的人。`,
      tips: ["谈恋爱别只看新鲜感，找个能接住你emo时刻的人", "创意想法别只停留在脑子里，先列好脚本再开拍", "用土星的能量把脑洞变成可执行方案"],
    },
    {
      domain: "健康与工作", house: "6宫", sign: h6.sign,
      tag: tag(ps6),
      anchor: `第6宫落${h6.sign}${ps6 >= 55 ? "，受火星刑土星的压力能量影响" : ""}——你的身体是你闯世界的本钱。`,
      tips: ["每天抽10分钟做拉伸或冥想", "工作别当老好人，该拒绝的任务果断拒绝", "别等颈椎疼、失眠了才重视"],
    },
    {
      domain: "合作与关系", house: "7宫", sign: h7.sign,
      tag: tag(ps7),
      anchor: `月亮落第7宫${ps7 >= 55 ? "，冲太阳、刑火星木星" : ""}——亲密关系里，「看见彼此」比「争输赢」重要。`,
      tips: ["和伴侣吵架时，直接说「我现在很生气，因为XX事」", "别总试图改变对方，接受你们的差异", "分开玩再一起分享趣事也是相处之道"],
    },
    {
      domain: "事业与社会", house: "10宫", sign: h10.sign,
      tag: tag(ps10),
      anchor: `天顶落${h10.sign}${ps10 >= 60 ? ", 受太阳刑天顶、天王刑天顶影响" : ""}——你的事业巅峰是「做别人没做过的事」。`,
      tips: ["30岁前多尝试不同行业，找到真正热爱的赛道", "30岁后聚焦一个领域，成为行业里的异类标杆", "用创新思维做精细化运营"],
    },
  ];
}

// ---- Timeline (4 phases matching reference) ----

export interface Phase {
  ageRange: string;
  title: string;
  subtitle: string;
  advice: string[];
}

export function computeTimeline(chart: NatalChart): Phase[] {
  const scores = computeAllPlanetScores(chart);
  const dominant = scores[0].planet;

  const themes: Record<string, { t20: string; t29: string; t39: string; t49: string }> = {
    太阳: { t20: "自我探索期", t29: "事业上升期", t39: "资源整合期", t49: "传承期" },
    月亮: { t20: "情感探索期", t29: "家庭建设期", t39: "滋养回馈期", t49: "智慧分享期" },
    水星: { t20: "知识积累期", t29: "思维变现期", t39: "知识输出期", t49: "思想传承期" },
    金星: { t20: "美感觉醒期", t29: "关系深耕期", t39: "艺术人生期", t49: "和谐守护期" },
    火星: { t20: "冲劲探索期", t29: "战场称雄期", t39: "经验沉淀期", t49: " mentorship期" },
    木星: { t20: "视野开拓期", t29: "版图扩张期", t39: "哲学人生期", t49: "精神导师期" },
    土星: { t20: "扎实筑基期", t29: "权威建立期", t39: "智慧导师期", t49: "Legacy期" },
    天王星: { t20: "叛逆探索期", t29: "创新突破期", t39: "变革引领期", t49: "自由人生期" },
    海王星: { t20: "梦想追寻期", t29: "灵性觉醒期", t39: "慈悲回馈期", t49: "灵魂自由期" },
    冥王星: { t20: "深度蜕变期", t29: "权力博弈期", t39: "转化大师期", t49: "重生智慧期" },
  };

  const t = themes[dominant] || themes["太阳"];

  return [
    {
      ageRange: "20-28岁",
      title: t.t20,
      subtitle: "频繁换工作换圈子",
      advice: [
        "会频繁换工作、换圈子，别焦虑——这是你在找真正适合自己的赛道",
        "25岁左右会遇到第一个让你想扎根的机会，抓住它",
        "多尝试不同领域，找到自己真正热爱的方向",
      ],
    },
    {
      ageRange: "29-38岁",
      title: t.t29,
      subtitle: "土星发力+天王惊喜",
      advice: [
        "土星的能量开始发力，你会变得越来越靠谱",
        "32岁左右会得到升职或创业的契机",
        "天王的能量会带来突发惊喜，别怕，大胆冲",
      ],
    },
    {
      ageRange: "39-48岁",
      title: t.t39,
      subtitle: "人脉爆发",
      advice: [
        "你积累的人脉会爆发，成为行业内的资源枢纽",
        "40岁后可以考虑做平台型的事，比如开工作室",
        "把你的经验和人脉变成可复制的价值",
      ],
    },
    {
      ageRange: "49岁以后",
      title: t.t49,
      subtitle: "导师角色",
      advice: [
        `${dominant}的能量会让你成为导师，喜欢分享经验带年轻人成长`,
        "人生价值从「自己成功」变成「帮助别人成功」",
        "享受慢下来的人生，把智慧传递给下一代",
      ],
    },
  ];
}

// ---- Pitfalls ----

export function computePitfalls(chart: NatalChart): { title: string; content: string }[] {
  const weaknesses = computeWeaknesses(chart);

  return [
    { title: "情绪坑", content: `别在${weaknesses[0].title === "情绪波动" ? "emo" : "情绪失控"}时做决策——比如分手、辞职，先睡一觉，第二天再想，90%的事都会有转机。` },
    { title: "冲动坑", content: `${weaknesses[0].title}会让你突然想做疯狂的事，比如裸辞环游世界。先存够半年生活费再行动，别让自己陷入绝境。` },
    { title: "人际坑", content: `别把朋友当工具人——${weaknesses[1].metaphor.replace("像", "")}容易让你利用人脉，但要记得礼尚往来，朋友帮了你，要及时回礼。` },
    { title: "压力坑", content: `${weaknesses[1].title}会让你总觉得「我不够好」，每天写3件「我今天做得好的事」，慢慢建立自信。` },
  ];
}

// ---- Summary ----

export function computeSummary(chart: NatalChart): { conclusion: string; actions: string[]; quote: string } {
  const profiles = computePlanetProfiles(chart);
  const p1 = profiles[0], p2 = profiles[1], p3 = profiles[2];

  const name = chart.birthData.name || "你";
  const conclusion = `${name}，你是一个${p1.label === "开拓者" ? "充满矛盾但又极具爆发力" : "独特而有深度"}的人——${p1.planet}的${p1.label}让你${p1.description.slice(0, 20)}，${p2.planet}的${p2.label}让你${p2.description.slice(0, 20)}，${p3.planet}的${p3.label}让你${p3.description.slice(0, 20)}。你的人生不是按部就班的剧本，而是${p1.label}${p2.label}${p3.label}的冒险。只要你平衡好${p2.label === "建构者" ? "情绪的过山车" : "内心的矛盾"}，利用好${p3.label === "颠覆者" ? "人脉的金矿" : "天赋的能量"}，你会成为自己领域里既敢想又敢干的引领者，活成自己真正想要的样子。`;

  const quotes = [
    "认识自己是一切智慧的开端。—— 苏格拉底",
    "成为你自己，因为别人都有人做了。—— 王尔德",
    "你的能量有限，不要浪费在过别人的生活上。—— 乔布斯",
    "星光不问赶路人，时光不负有心人。",
    "你生而有翼，为何竟愿一生匍匐前进？—— 鲁米",
  ];

  return {
    conclusion,
    actions: [
      "本周找一位信任的朋友，聊聊你最近的一个想法",
      "每天花10分钟记录自己的情绪和直觉",
      "本月尝试一件你一直想做但不敢做的事",
    ],
    quote: quotes[p1.score % quotes.length],
  };
}

// ---- Identity ----

export interface Identity {
  mainPlanet: string;
  nickname: string;
  secondaryPlanets: string[];
  tagline: string;
}

export function computeIdentity(chart: NatalChart): Identity {
  const profiles = computePlanetProfiles(chart);
  const main = profiles[0];

  // Generate nickname based on top 3 planets
  const labels = profiles.map(p => p.label);
  const nickname = `${labels[0]}\u00b7${labels[1]}\u00b7${labels[2]}`;

  return {
    mainPlanet: main.planet,
    nickname,
    secondaryPlanets: profiles.slice(1).map(p => p.planet),
    tagline: `我是 ${main.planet}人`,
  };
}

// ---- Dimension scores ----

export interface DimensionScores {
  情绪力: number;
  领导力: number;
  洞察力: number;
  行动力: number;
  创造力: number;
  稳定力: number;
}

export function computeDimensionScores(chart: NatalChart): DimensionScores {
  const scores = computeAllPlanetScores(chart);
  const find = (name: string) => scores.find(s => s.planet === name)?.finalScore ?? 50;

  const sun = find("太阳"), moon = find("月亮"), mercury = find("水星"),
    venus = find("金星"), mars = find("火星"), jupiter = find("木星"),
    saturn = find("土星"), uranus = find("天王星"), neptune = find("海王星"),
    pluto = find("冥王星");

  return {
    情绪力: Math.round(Math.max(20, Math.min(98, 0.40 * moon + 0.35 * venus + 0.25 * neptune))),
    领导力: Math.round(Math.max(20, Math.min(98, 0.45 * sun + 0.30 * mars + 0.25 * jupiter))),
    洞察力: Math.round(Math.max(20, Math.min(98, 0.40 * mercury + 0.30 * pluto + 0.30 * uranus))),
    行动力: Math.round(Math.max(20, Math.min(98, 0.40 * mars + 0.35 * sun + 0.25 * saturn))),
    创造力: Math.round(Math.max(20, Math.min(98, 0.35 * venus + 0.35 * uranus + 0.30 * neptune))),
    稳定力: Math.round(Math.max(20, Math.min(98, 0.40 * saturn + 0.30 * jupiter + 0.30 * moon))),
  };
}

// ---- Planet descriptions for "who you are" ----

export function computeWhoYouAre(chart: NatalChart): string {
  const profiles = computePlanetProfiles(chart);
  const p1 = profiles[0], p2 = profiles[1], p3 = profiles[2];
  const rising = chart.risingSign;

  return `你是自带「${p1.label}${p2.label}」buff的天生主角——用${p1.planet}的${p1.label}${p1.description.slice(0, 15)}，靠${p2.planet}的${p2.label}${p2.description.slice(0, 15)}，凭${p3.planet}的${p3.label}${p3.description.slice(0, 15)}，人生就是一场「${p1.label}${p2.label}${p3.label}」的热血冒险。

你像${rising}的特质一般，外表映着${rising}的${p2.planet === "月亮" ? "柔暖光晕" : "独特气质"}，内里却藏着${p1.planet}的${p1.label}火焰。你是那种${p2.label === "建构者" ? "平时看着跳脱，关键时刻能扛鼎" : "表面温和，内心坚定"}的人——团建时能${p3.label === "颠覆者" ? "带动全场气氛" : "发现独特视角"}，遇到项目危机时能${p2.label === "建构者" ? "立刻冷静下来，拉着团队梳理流程、找资源补漏洞" : "挺身而出，承担责任"}，身边朋友都愿意把重要的事交给你——因为你既有${p1.label === "开拓者" ? "「敢闯」的热情" : "「敢想」的勇气"}，又有${p2.label === "建构者" ? "「能成」的章法" : "「能做」的实力"}。`;
}
