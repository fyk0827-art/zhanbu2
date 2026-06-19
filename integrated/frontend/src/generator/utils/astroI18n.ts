const PLANET_EN: Record<string, string> = {
  太阳: "Sun",
  月亮: "Moon",
  水星: "Mercury",
  金星: "Venus",
  火星: "Mars",
  木星: "Jupiter",
  土星: "Saturn",
  天王星: "Uranus",
  海王星: "Neptune",
  冥王星: "Pluto",
  天王: "Uranus",
  海王: "Neptune",
  冥王: "Pluto",
  北交点: "North Node",
  南交点: "South Node",
  凯龙星: "Chiron",
  凯龙: "Chiron",
};

const SIGN_EN: Record<string, string> = {
  白羊座: "Aries",
  金牛座: "Taurus",
  双子座: "Gemini",
  巨蟹座: "Cancer",
  狮子座: "Leo",
  处女座: "Virgo",
  天秤座: "Libra",
  天蝎座: "Scorpio",
  射手座: "Sagittarius",
  摩羯座: "Capricorn",
  水瓶座: "Aquarius",
  双鱼座: "Pisces",
  白羊: "Aries",
  金牛: "Taurus",
  双子: "Gemini",
  巨蟹: "Cancer",
  狮子: "Leo",
  处女: "Virgo",
  天秤: "Libra",
  天蝎: "Scorpio",
  射手: "Sagittarius",
  摩羯: "Capricorn",
  水瓶: "Aquarius",
  双鱼: "Pisces",
};

const DIGNITY_EN: Record<string, string> = {
  入庙: "domicile",
  入旺: "exalted",
  中性: "neutral",
  失势: "detriment",
  落陷: "fall",
};

const FIELD_EN: Record<string, string> = {
  恋爱: "Love",
  正财: "Earned income",
  婚姻: "Marriage",
  人生钥匙: "Life key",
  家庭: "Family",
  事业: "Career",
  工作健康: "Work and health",
  偏财: "Shared resources",
  情感: "Emotion",
  财富: "Wealth",
  健康: "Health",
  成长: "Growth",
  亲密: "Intimacy",
  合作: "Partnership",
  根基: "Foundation",
  名声: "Reputation",
  工作: "Work",
  深层: "Depth",
};

const TERM_EN: Record<string, string> = {
  上升点: "Ascendant",
  上升: "Ascendant",
  下降点: "Descendant",
  下降: "Descendant",
  天顶: "Midheaven",
  天底: "IC",
  命主星: "chart ruler",
  宫主星: "house ruler",
  守护星: "ruler",
  飞宫: "house-ruler link",
  宫位: "house",
  星座: "zodiac sign",
  行星: "planet",
  星体: "planet",
  主行星: "dominant planet",
  能量评分: "energy score",
  能量得分: "energy score",
  能量分布: "energy distribution",
  能量: "energy",
  分数: "score",
  得分: "score",
  逆行: "retrograde",
  顺行: "direct",
  合相: "conjunction",
  对冲: "opposition",
  刑克: "square",
  三分: "trine",
  六合: "sextile",
  相位: "aspect",
  洞察: "Insight",
  环境与贵人: "Environment & Allies",
  最适合的环境: "Best-fit environment",
  最适合你的环境: "Best-fit environment",
  环境适应: "Environmental fit",
  适合的环境: "Suitable environment",
  最需要的贵人: "Most-needed ally",
  身边需要谁: "Who you need around you",
  需要的贵人: "Needed ally",
  贵人建议: "Ally guidance",
  旺财贵人: "Wealth-supporting ally",
  财运贵人: "Wealth ally",
  必须远离: "Must avoid",
  远离谁: "Who to avoid",
  一定要远离: "Must stay away",
  远离的人: "People to avoid",
  需要远离: "Need to avoid",
  避坑指南: "Pitfall Guide",
  避坑要点: "Pitfall Highlights",
  一定要避开的人: "People to avoid",
  避开的人: "People to avoid",
  不要靠近的人: "People not to get close to",
  一定要避开的事: "Things to avoid",
  避开的事: "Things to avoid",
  不要做的事: "Things not to do",
  一定要避开的环境: "Environments to avoid",
  避开的环境: "Environments to avoid",
  危险环境: "Risky environments",
  特别版避坑: "Personalized Pitfalls",
  针对你的特别版: "Personalized Edition",
  特别版: "Personalized Edition",
  最容易踩的3个坑: "Top 3 easiest traps to fall into",
  最容易踩的坑: "Easiest traps to fall into",
  核心避坑: "Core pitfalls",
  总结与行动指令: "Summary & Action Plan",
  人生脉络建议: "Life Timeline Guidance",
  人生脉络: "Life Timeline",
  人生各领域: "Life Areas",
  飞星结论: "House-ruler conclusions",
  内心深处: "Deep Inside",
  你不说: "What you do not say",
  但我懂: "but I understand",
  天赋与行业: "Talents & Career Fit",
  性格与资源: "Character & Resources",
  性格优势: "Strengths",
  性格劣势: "Growth Edges",
  机会与资源: "Opportunities & Resources",
  最适合的事业方向: "Best Career Direction",
  来源: "Source",
  入口: "Entry",
  建议: "Advice",
};

function shouldUseChinese(language?: string): boolean {
  return (language || "").toLowerCase().startsWith("zh");
}

function ordinal(n: string): string {
  const value = Number(n);
  if (!Number.isFinite(value)) return n;
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function localizeAstroText(text: string, language?: string): string {
  if (!text || shouldUseChinese(language)) return text;

  let out = text;
  for (const [zh, en] of Object.entries(SIGN_EN)) out = out.replaceAll(zh, en);
  for (const [zh, en] of Object.entries(PLANET_EN)) {
    out = out.replaceAll(`${zh}人`, `${en} type`);
    out = out.replaceAll(zh, en);
  }
  for (const [zh, en] of Object.entries(DIGNITY_EN)) out = out.replaceAll(zh, en);
  for (const [zh, en] of Object.entries(FIELD_EN)) out = out.replaceAll(`【${zh}】`, `【${en}】`);

  out = out.replace(/第\s*(\d+)\s*宫/g, (_m, n) => `${ordinal(n)} house`);
  out = out.replace(/(\d+)\s*宫/g, (_m, n) => `${ordinal(n)} house`);
  out = out.replace(/(\d+)\s*分/g, "$1 pts");
  out = out.replace(/(\d+)\s*岁/g, "age $1");
  out = out.replace(/(\d+)\s*飞\s*(\d+)/g, "$1 -> $2");
  out = out.replace(/([1-9]|1[0-2])飞([1-9]|1[0-2])/g, "$1 -> $2");
  for (const [zh, en] of Object.entries(TERM_EN)) out = out.replaceAll(zh, en);
  return out;
}
