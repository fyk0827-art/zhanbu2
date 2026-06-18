// ============================================
// V2.8 Scoring Engine - Complete 6-Step Calculation
// Translated from Python generate_report.py
// All scores computed deterministically in browser
// ============================================

import type { NatalChart } from "./astrologyEngine";

// ===== Constants (exact match from Python) =====

const PLANET_BASE: Record<string, number> = {
  太阳: 65, 月亮: 61, 金星: 57, 水星: 53,
  木星: 51, 土星: 50, 火星: 47, 天王星: 43,
  海王星: 42, 冥王星: 41,
};

const PLANET_ORDER = ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星", "天王星", "海王星", "冥王星"];

const DIGNITY_TABLE: Record<string, { 入庙: string[]; 入旺: string[]; 失势: string[]; 落陷: string[] }> = {
  太阳: { 入庙: ["狮子座"], 入旺: ["白羊座"], 失势: ["天秤座"], 落陷: ["水瓶座"] },
  月亮: { 入庙: ["巨蟹座"], 入旺: ["金牛座"], 失势: ["天蝎座"], 落陷: ["摩羯座"] },
  水星: { 入庙: ["双子座", "处女座"], 入旺: [], 失势: [], 落陷: ["射手座", "双鱼座"] },
  金星: { 入庙: ["天秤座", "金牛座"], 入旺: ["双鱼座"], 失势: ["白羊座"], 落陷: ["天蝎座", "处女座"] },
  火星: { 入庙: ["白羊座", "天蝎座"], 入旺: ["摩羯座"], 失势: ["巨蟹座"], 落陷: ["天秤座", "金牛座"] },
  木星: { 入庙: ["射手座", "双鱼座"], 入旺: ["巨蟹座"], 失势: ["摩羯座"], 落陷: ["双子座", "处女座"] },
  土星: { 入庙: ["摩羯座", "水瓶座"], 入旺: ["天秤座"], 失势: ["白羊座"], 落陷: ["巨蟹座", "狮子座"] },
  天王星: { 入庙: ["水瓶座"], 入旺: [], 失势: [], 落陷: ["狮子座"] },
  海王星: { 入庙: ["双鱼座"], 入旺: [], 失势: [], 落陷: ["处女座"] },
  冥王星: { 入庙: ["天蝎座"], 入旺: [], 失势: [], 落陷: ["金牛座"] },
};

// Traditional rulers (for dispositorship / lord of ascendant)
const TRADITIONAL_RULERS: Record<string, string> = {
  白羊座: "火星", 金牛座: "金星", 双子座: "水星", 巨蟹座: "月亮",
  狮子座: "太阳", 处女座: "水星", 天秤座: "金星", 天蝎座: "火星",
  射手座: "木星", 摩羯座: "土星", 水瓶座: "土星", 双鱼座: "木星",
};

// Modern rulers (for oikodespotes)
const MODERN_RULERS: Record<string, string> = {
  白羊座: "火星", 金牛座: "金星", 双子座: "水星", 巨蟹座: "月亮",
  狮子座: "太阳", 处女座: "水星", 天秤座: "金星", 天蝎座: "冥王星",
  射手座: "木星", 摩羯座: "土星", 水瓶座: "天王星", 双鱼座: "海王星",
};

const SIGN_ELEMENTS: Record<string, string> = {
  白羊座: "火", 金牛座: "土", 双子座: "风", 巨蟹座: "水",
  狮子座: "火", 处女座: "土", 天秤座: "风", 天蝎座: "水",
  射手座: "火", 摩羯座: "土", 水瓶座: "风", 双鱼座: "水",
};

const SIGN_LONGITUDE: Record<string, number> = {
  白羊座: 0, 金牛座: 30, 双子座: 60, 巨蟹座: 90,
  狮子座: 120, 处女座: 150, 天秤座: 180, 天蝎座: 210,
  射手座: 240, 摩羯座: 270, 水瓶座: 300, 双鱼座: 330,
};

const HOUSE_TYPES: Record<number, string> = {
  1: "角宫", 4: "角宫", 7: "角宫", 10: "角宫",
  2: "续宫", 5: "续宫", 8: "续宫", 11: "续宫",
  3: "果宫", 6: "果宫", 9: "果宫", 12: "果宫",
};

const HOUSE_HEALING: Record<number, string> = {
  4: "温暖包容型",
  8: "深度真相型",
  12: "超越世俗型",
};

const ASPECT_SCORE_MAP: Record<string, number> = { 合: 3, 拱: 2, 六合: 2, 刑: 1, 冲: 1 };
const HOUSE_SCORE_MAP: Record<number, number> = {
  1: 10, 10: 9, 7: 9, 4: 9, 2: 4, 5: 4, 8: 4, 11: 4, 3: -2, 6: -2, 9: -2, 12: -2,
};

const AXIS_POINTS = ["上升", "下降", "天顶", "天底"];
const SPECIAL_POINTS = ["宿命点"];

// ===== Internal data structures =====

interface PlanetData {
  sign: string;
  degree: number;
  house: number;
}

interface ChartData {
  planets: Record<string, PlanetData>;
  ascendant: { sign: string; degree: number } | null;
  midheaven: { sign: string; degree: number } | null;
  houses: Record<number, { sign: string; degree: number }>;
  aspects: Record<string, [string, string][]>; // planet -> [[aspectType, target], ...]
}

interface SectResult {
  sect_type: "day" | "night";
  planet_sect: Record<string, number>;
  predominator: string;
  oikodespotes: string;
}

interface DignityResult {
  status: string;
  score: number;
}

interface ScoreDetail {
  基础分: number;
  发光体: number;
  Sect: number;
  命主星: number;
  船东: number;
  群星: number;
  相位能量: number;
  大三角: number;
  T三角: number;
  大十字: number;
  宫位: number;
  合轴: number;
  庙旺落陷: number;
}

interface Patterns {
  grand_trines: string[][];
  t_squares: string[][];
  grand_crosses: string[][];
  stelliums: { house: number; planets: string[] }[];
}

// ===== Step 0: Sect + Oikodespotes =====

function calculateSect(chartData: ChartData): SectResult {
  const sunData = chartData.planets["太阳"];
  const mercuryData = chartData.planets["水星"];

  if (!sunData) {
    return { sect_type: "day", planet_sect: {}, predominator: "太阳", oikodespotes: "太阳" };
  }

  const sunSign = sunData.sign;
  const sunHouse = sunData.house;

  // Day = sun in houses 7-12 (above horizon), Night = houses 1-6
  const sect_type: "day" | "night" = sunHouse >= 7 ? "day" : "night";

  const planet_sect: Record<string, number> = {};

  if (sect_type === "day") {
    for (const p of ["太阳", "木星", "土星"]) planet_sect[p] = 5;
    for (const p of ["月亮", "金星", "火星"]) planet_sect[p] = -3;
  } else {
    for (const p of ["月亮", "金星", "火星"]) planet_sect[p] = 5;
    for (const p of ["太阳", "木星", "土星"]) planet_sect[p] = -3;
  }

  // Mercury by oriental/occidental
  if (mercuryData) {
    const sunLon = (SIGN_LONGITUDE[sunSign] || 0) + sunData.degree;
    const mercuryLon = (SIGN_LONGITUDE[mercuryData.sign] || 0) + mercuryData.degree;
    const diff = ((mercuryLon - sunLon) % 360 + 360) % 360;

    if (diff < 180) {
      // Oriental (day sect)
      planet_sect["水星"] = sect_type === "day" ? 5 : -3;
    } else {
      // Occidental (night sect)
      planet_sect["水星"] = sect_type === "day" ? -3 : 5;
    }
  }

  // Predominator
  let predominator = sect_type === "day" ? "太阳" : "月亮";
  const predHouse = chartData.planets[predominator]?.house;
  if (predHouse && [3, 6, 9, 12].includes(predHouse)) {
    predominator = predominator === "太阳" ? "月亮" : "太阳";
  }

  // Oikodespotes = modern ruler of predominator's sign
  const predFinalSign = chartData.planets[predominator]?.sign;
  const oikodespotes = MODERN_RULERS[predFinalSign || ""] || predominator;

  return { sect_type, planet_sect, predominator, oikodespotes };
}

// ===== Step 1: Dignity =====

function checkDignity(chartData: ChartData): Record<string, DignityResult> {
  const result: Record<string, DignityResult> = {};

  for (const [planet, data] of Object.entries(chartData.planets)) {
    const sign = data.sign;
    const table = DIGNITY_TABLE[planet];
    if (!table) {
      result[planet] = { status: "中性", score: 0 };
      continue;
    }
    if (table.入庙.includes(sign)) result[planet] = { status: "入庙", score: 7 };
    else if (table.入旺.includes(sign)) result[planet] = { status: "入旺", score: 6 };
    else if (table.失势.includes(sign)) result[planet] = { status: "失势", score: -5 };
    else if (table.落陷.includes(sign)) result[planet] = { status: "落陷", score: -4 };
    else result[planet] = { status: "中性", score: 0 };
  }

  return result;
}

// ===== Step 3: Patterns (called before Step 2) =====

function detectPatterns(chartData: ChartData): Patterns {
  const patterns: Patterns = {
    grand_trines: [],
    t_squares: [],
    grand_crosses: [],
    stelliums: [],
  };

  // Build aspect pair sets (planet-only)
  const trinePairs = new Set<string>();
  const squarePairs = new Set<string>();
  const oppositionPairs = new Set<string>();

  const validPlanets = Object.keys(chartData.planets);

  for (const [planet, aspects] of Object.entries(chartData.aspects)) {
    if (AXIS_POINTS.includes(planet) || SPECIAL_POINTS.includes(planet)) continue;
    for (const [aspectType, target] of aspects) {
      if (AXIS_POINTS.includes(target) || SPECIAL_POINTS.includes(target)) continue;
      if (!validPlanets.includes(target)) continue;
      const pair = [planet, target].sort().join("|");
      if (aspectType === "拱") trinePairs.add(pair);
      else if (aspectType === "刑") squarePairs.add(pair);
      else if (aspectType === "冲") oppositionPairs.add(pair);
    }
  }

  // Grand Trine: 3 planets all trine each other, same element
  for (const pair of trinePairs) {
    const [p1, p2] = pair.split("|");
    for (const p3 of validPlanets) {
      if (p3 === p1 || p3 === p2) continue;
      const pair1 = [p1, p3].sort().join("|");
      const pair2 = [p2, p3].sort().join("|");
      if (trinePairs.has(pair1) && trinePairs.has(pair2)) {
        const signs = [chartData.planets[p1].sign, chartData.planets[p2].sign, chartData.planets[p3].sign];
        const elements = signs.map(s => SIGN_ELEMENTS[s]);
        if (new Set(elements).size === 1) {
          patterns.grand_trines.push([p1, p2, p3]);
        }
      }
    }
  }

  // T-Square: one planet squares two others that oppose each other
  for (const [planet, aspects] of Object.entries(chartData.aspects)) {
    if (AXIS_POINTS.includes(planet) || SPECIAL_POINTS.includes(planet)) continue;
    const squares = aspects.filter(([type, target]) => type === "刑" && validPlanets.includes(target)).map(([, t]) => t);
    for (let i = 0; i < squares.length; i++) {
      for (let j = i + 1; j < squares.length; j++) {
        const pair = [squares[i], squares[j]].sort().join("|");
        if (oppositionPairs.has(pair)) {
          patterns.t_squares.push([planet, squares[i], squares[j]]);
        }
      }
    }
  }

  // Grand Cross: two pairs of oppositions, all cross-squared
  for (const op1 of oppositionPairs) {
    for (const op2 of oppositionPairs) {
      const [a1, a2] = op1.split("|");
      const [b1, b2] = op2.split("|");
      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;
      const crossPairs = [
        [a1, b1].sort().join("|"),
        [a1, b2].sort().join("|"),
        [a2, b1].sort().join("|"),
        [a2, b2].sort().join("|"),
      ];
      if (crossPairs.every(p => squarePairs.has(p))) {
        const cross = [a1, a2, b1, b2].sort();
        patterns.grand_crosses.push(cross);
      }
    }
  }

  // Stellium: 3+ planets in same house
  const housePlanets: Record<number, string[]> = {};
  for (const [planet, data] of Object.entries(chartData.planets)) {
    if (!housePlanets[data.house]) housePlanets[data.house] = [];
    housePlanets[data.house].push(planet);
  }
  for (const [house, planets] of Object.entries(housePlanets)) {
    if (planets.length >= 3) {
      patterns.stelliums.push({ house: parseInt(house), planets });
    }
  }

  return patterns;
}

// ===== Step 2: 11-Dimension Scoring =====

function calculateScores(
  chartData: ChartData,
  sectResult: SectResult,
  dignityResult: Record<string, DignityResult>,
  patterns: Patterns
): { scores: Record<string, number>; details: Record<string, ScoreDetail> } {
  const scores: Record<string, number> = {};
  const details: Record<string, ScoreDetail> = {};

  const ascendantSign = chartData.ascendant?.sign;
  const lordOfAsc = ascendantSign ? TRADITIONAL_RULERS[ascendantSign] : null;

  // Count aspects per planet (planet-to-planet only)
  const planetAspectCount: Record<string, number> = {};
  for (const [planet, aspects] of Object.entries(chartData.aspects)) {
    if (AXIS_POINTS.includes(planet) || SPECIAL_POINTS.includes(planet)) continue;
    for (const [, target] of aspects) {
      if (target in chartData.planets) {
        planetAspectCount[planet] = (planetAspectCount[planet] || 0) + 1;
      }
    }
  }

  const oikodespotes = sectResult.oikodespotes;

  // Phase 1: base scores
  for (const planet of Object.keys(chartData.planets)) {
    const detail: ScoreDetail = {
      基础分: 0, 发光体: 0, Sect: 0, 命主星: 0, 船东: 0, 群星: 0,
      相位能量: 0, 大三角: 0, T三角: 0, 大十字: 0, 宫位: 0, 合轴: 0, 庙旺落陷: 0,
    };

    // 1. Base score
    const baseScore = PLANET_BASE[planet] || 40;
    scores[planet] = baseScore;
    detail.基础分 = baseScore;

    // 2. Luminary
    if (planet === "太阳" || planet === "月亮") {
      scores[planet] += 3;
      detail.发光体 = 3;
    }

    // 3. Sect
    const sectScore = sectResult.planet_sect[planet] || 0;
    scores[planet] += sectScore;
    detail.Sect = sectScore;

    // 4. Lord of Ascendant
    if (planet === lordOfAsc) {
      const aspectCount = planetAspectCount[planet] || 0;
      if (aspectCount === 0) {
        scores[planet] += 12;
        detail.命主星 = 12;
      } else if (aspectCount === 1) {
        scores[planet] += 15;
        detail.命主星 = 15;
      } else {
        scores[planet] += 20;
        detail.命主星 = 20;
      }
    }

    // 5. Oikodespotes
    if (planet === oikodespotes) {
      scores[planet] += 3;
      detail.船东 = 3;
    }

    details[planet] = detail;
  }

  // Phase 2: Stellium (3+ planets in same house)
  const housePlanets: Record<number, string[]> = {};
  for (const [planet, data] of Object.entries(chartData.planets)) {
    if (!housePlanets[data.house]) housePlanets[data.house] = [];
    housePlanets[data.house].push(planet);
  }
  for (const planets of Object.values(housePlanets)) {
    if (planets.length >= 3) {
      for (const planet of planets) {
        scores[planet] += 4;
        details[planet].群星 += 4;
      }
    }
  }

  // Phase 3: Aspect energy (planet-to-planet only)
  const aspectPlanets: Record<string, number> = {};
  for (const [srcPlanet, aspects] of Object.entries(chartData.aspects)) {
    if (AXIS_POINTS.includes(srcPlanet) || SPECIAL_POINTS.includes(srcPlanet)) continue;
    for (const [aType, target] of aspects) {
      if (target in chartData.planets) {
        const bonus = ASPECT_SCORE_MAP[aType] || 0;
        aspectPlanets[srcPlanet] = (aspectPlanets[srcPlanet] || 0) + bonus;
        aspectPlanets[target] = (aspectPlanets[target] || 0) + bonus;
      }
    }
  }
  for (const planet of Object.keys(scores)) {
    const bonus = aspectPlanets[planet] || 0;
    scores[planet] += bonus;
    details[planet].相位能量 = bonus;
  }

  // Phase 4: Pattern bonuses
  for (const trine of patterns.grand_trines) {
    for (const planet of trine) {
      if (planet in scores) {
        scores[planet] += 12;
        details[planet].大三角 = 12;
      }
    }
  }
  for (const ts of patterns.t_squares) {
    for (const planet of ts) {
      if (planet in scores) {
        scores[planet] += 8;
        details[planet].T三角 = 8;
      }
    }
  }
  for (const cross of patterns.grand_crosses) {
    for (const planet of cross) {
      if (planet in scores) {
        scores[planet] += 5;
        details[planet].大十字 = 5;
      }
    }
  }

  // Phase 5: House score
  for (const [planet, data] of Object.entries(chartData.planets)) {
    const houseBonus = HOUSE_SCORE_MAP[data.house] || 0;
    scores[planet] += houseBonus;
    details[planet].宫位 = houseBonus;
  }

  // Phase 6: Axis conjunction
  function hasConjunction(planetAspects: [string, string][], targetName: string): boolean {
    return planetAspects.some(([type, target]) => type === "合" && target === targetName);
  }

  for (const [planet, data] of Object.entries(chartData.planets)) {
    const sign = data.sign;
    const degree = data.degree;
    const house = data.house;
    const aspectsList = chartData.aspects[planet] || [];
    let axisBonus = 0;

    // Conjunct Ascendant: +8 (same sign + degree diff <= 5, not in house 1)
    if (hasConjunction(aspectsList, "上升")) {
      if (house !== 1) {
        const ascData = chartData.ascendant;
        if (ascData && sign === ascData.sign && Math.abs(degree - ascData.degree) <= 5) {
          axisBonus += 8;
        }
      }
    }

    // Conjunct MC: +6
    if (hasConjunction(aspectsList, "天顶")) {
      const mcData = chartData.midheaven;
      if (mcData && sign === mcData.sign && Math.abs(degree - mcData.degree) <= 5) {
        axisBonus += 6;
      }
    }

    // Conjunct Descendant: +4
    if (hasConjunction(aspectsList, "下降")) {
      const dsc = chartData.houses[7];
      if (dsc && sign === dsc.sign && Math.abs(degree - dsc.degree) <= 5) {
        axisBonus += 4;
      }
    }

    // Conjunct IC: +4
    if (hasConjunction(aspectsList, "天底")) {
      const ic = chartData.houses[4];
      if (ic && sign === ic.sign && Math.abs(degree - ic.degree) <= 5) {
        axisBonus += 4;
      }
    }

    scores[planet] += axisBonus;
    details[planet].合轴 = axisBonus;
  }

  // Phase 7: Dignity
  for (const planet of Object.keys(scores)) {
    const dign = dignityResult[planet];
    const bonus = dign?.score || 0;
    scores[planet] += bonus;
    details[planet].庙旺落陷 = bonus;
  }

  return { scores, details };
}

// ===== Step 4: Dispositorship (8 areas) =====

function calculateDispositorship(chartData: ChartData): Record<string, string> {
  const results: Record<string, string> = {};

  const areas: Record<string, number> = {
    恋爱: 5, 正财: 2, 婚姻: 7, "人生钥匙": 1,
    家庭: 4, 事业: 10, 工作健康: 6, 偏财: 8,
  };

  for (const [areaName, houseNum] of Object.entries(areas)) {
    const houseData = chartData.houses[houseNum];
    if (!houseData) {
      results[areaName] = `${houseNum}宫数据缺失`;
      continue;
    }

    const ruler = TRADITIONAL_RULERS[houseData.sign];
    if (!ruler || !chartData.planets[ruler]) {
      results[areaName] = `${houseNum}飞守护星(${ruler})不在盘`;
      continue;
    }

    const rulerHouse = chartData.planets[ruler].house;
    results[areaName] = `${houseNum}飞${rulerHouse}`;
  }

  return results;
}

// ===== Step 5: Elements =====

function calculateElements(chartData: ChartData): Record<string, number | string> {
  const elements: Record<string, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };

  for (const data of Object.values(chartData.planets)) {
    const element = SIGN_ELEMENTS[data.sign];
    if (element) elements[element]++;
  }

  // Dominant element from traditional planets (3+)
  const traditional = ["太阳", "月亮", "水星", "金星", "火星", "木星", "土星"];
  const tradElements: Record<string, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };

  for (const planet of traditional) {
    const data = chartData.planets[planet];
    if (data) {
      const element = SIGN_ELEMENTS[data.sign];
      if (element) tradElements[element]++;
    }
  }

  let dominant: string | null = null;
  for (const [elem, count] of Object.entries(tradElements)) {
    if (count >= 3) {
      dominant = elem;
      break;
    }
  }
  if (!dominant) {
    dominant = Object.entries(tradElements).sort((a, b) => b[1] - a[1])[0]?.[0] || "火";
  }

  return { ...elements, 基调: dominant };
}

// ===== Step 6: House Energy =====

function calculateHouseEnergy(
  chartData: ChartData,
  scores: Record<string, number>
): Record<number, { planets: string[]; max_score: number; type: string; healing_type: string | null; high_energy: boolean }> {
  const houseEnergy: Record<number, { planets: string[]; max_score: number; type: string; healing_type: string | null; high_energy: boolean }> = {};

  for (let houseNum = 1; houseNum <= 12; houseNum++) {
    houseEnergy[houseNum] = {
      planets: [],
      max_score: 0,
      type: HOUSE_TYPES[houseNum] || "未知",
      healing_type: HOUSE_HEALING[houseNum] || null,
      high_energy: false,
    };
  }

  for (const [planet, data] of Object.entries(chartData.planets)) {
    const house = data.house;
    const score = scores[planet] || 0;
    houseEnergy[house].planets.push(planet);
    if (score > houseEnergy[house].max_score) {
      houseEnergy[house].max_score = score;
    }
  }

  for (let houseNum = 1; houseNum <= 12; houseNum++) {
    const planetsCount = houseEnergy[houseNum].planets.length;
    const maxScore = houseEnergy[houseNum].max_score;
    houseEnergy[houseNum].high_energy = planetsCount >= 2 || maxScore >= 70;
  }

  return houseEnergy;
}

// ===== NatalChart -> ChartData converter =====

function natalChartToChartData(chart: NatalChart): ChartData {
  const planets: Record<string, PlanetData> = {};
  for (const p of chart.planets) {
    planets[p.name] = {
      sign: p.sign,
      degree: p.signDegree,
      house: p.house,
    };
  }

  const houses: Record<number, { sign: string; degree: number }> = {};
  for (const h of chart.houses) {
    houses[h.house] = { sign: h.sign, degree: h.signDegree };
  }

  // Convert aspects to the format expected by the scoring engine
  // The engine uses "拱" not "拱相", "刑" not "刑克", etc.
  const aspectTypeMap: Record<string, string> = {
    "拱相": "拱",
    "刑克": "刑",
    "合相": "合",
    "六合": "六合",
    "冲相": "冲",
  };

  const aspects: Record<string, [string, string][]> = {};
  for (const a of chart.aspects) {
    const type = aspectTypeMap[a.aspectType] || a.aspectType;
    if (!aspects[a.planet1]) aspects[a.planet1] = [];
    aspects[a.planet1].push([type, a.planet2]);
  }

  return {
    planets,
    ascendant: chart.angles ? { sign: chart.angles.ascendantSign, degree: chart.houses[0]?.signDegree || 0 } : null,
    midheaven: chart.angles ? { sign: chart.angles.mcSign, degree: chart.houses[9]?.signDegree || 0 } : null,
    houses,
    aspects,
  };
}

// ===== Format calculation results as text (for API input) =====

export function formatCalculationResults(
  chart: NatalChart,
  sectResult: SectResult,
  dignityResult: Record<string, DignityResult>,
  scoresResult: { scores: Record<string, number>; details: Record<string, ScoreDetail> },
  patterns: Patterns,
  dispositorship: Record<string, string>,
  elements: Record<string, number | string>,
  houseEnergy: Record<number, { planets: string[]; max_score: number; type: string; healing_type: string | null; high_energy: boolean }>
): string {
  const lines: string[] = [];
  lines.push("=" .repeat(60));
  lines.push("星盘计算结果汇总");
  lines.push("=" .repeat(60));

  // Raw data
  lines.push("\n【原始星盘数据】");
  lines.push("行星位置：");
  for (const planet of PLANET_ORDER) {
    const data = chart.planets.find(p => p.name === planet);
    if (data) {
      const d = Math.floor(data.signDegree);
      const m = Math.floor((data.signDegree % 1) * 60);
      lines.push(`  ${planet}：${data.sign}${d}°${m}′ 第${data.house}宫${data.isRetrograde ? " 逆行" : ""}`);
    }
  }

  if (chart.angles) {
    const asc = chart.houses[0];
    if (asc) {
      const d = Math.floor(asc.signDegree);
      const m = Math.floor((asc.signDegree % 1) * 60);
      lines.push(`  上升：${asc.sign}${d}°${m}′`);
    }
    const mc = chart.houses[9];
    if (mc) {
      const d = Math.floor(mc.signDegree);
      const m = Math.floor((mc.signDegree % 1) * 60);
      lines.push(`  天顶：${mc.sign}${d}°${m}′`);
    }
  }

  lines.push("\n宫头位置：");
  for (const houseNum of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    const h = chart.houses.find(hh => hh.house === houseNum);
    if (h) {
      const d = Math.floor(h.signDegree);
      const m = Math.floor((h.signDegree % 1) * 60);
      const label = houseNum === 1 ? "(上升)" : houseNum === 10 ? "(天顶)" : houseNum === 7 ? "(下降)" : houseNum === 4 ? "(天底)" : "";
      lines.push(`  第${houseNum}宫：${h.sign}${d}°${m}′${label}`);
    }
  }

  // Aspects
  lines.push("\n行星相位：");
  for (const a of chart.aspects) {
    lines.push(`  ${a.planet1} ${a.aspectType.replace("相", "")}${a.planet2}`);
  }

  // Step 0
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 0】Sect判定 + 船东判定");
  lines.push("=".repeat(60));
  lines.push(`日/夜盘：${sectResult.sect_type === "day" ? "日盘" : "夜盘"}`);
  lines.push("得派行星(已+5)：");
  for (const [planet, score] of Object.entries(sectResult.planet_sect)) {
    if (score > 0) lines.push(`  ${planet}：+${score}`);
  }
  lines.push("失派行星(已-3)：");
  for (const [planet, score] of Object.entries(sectResult.planet_sect)) {
    if (score < 0) lines.push(`  ${planet}：${score}`);
  }
  lines.push(`发光体(Predominator)：${sectResult.predominator}`);
  lines.push(`船东(Oikodespotes)：${sectResult.oikodespotes} (+3)`);

  // Step 1
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 1】庙旺落陷判定");
  lines.push("=".repeat(60));
  for (const planet of PLANET_ORDER) {
    if (dignityResult[planet]) {
      const dign = dignityResult[planet];
      lines.push(`  ${planet}：${dign.status} (${dign.score >= 0 ? "+" : ""}${dign.score})`);
    }
  }

  // Step 2
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 2】行星能量密度综合评分");
  lines.push("=".repeat(60));

  const sortedScores = Object.entries(scoresResult.scores).sort((a, b) => b[1] - a[1]);

  lines.push("\n行星能量排名：");
  for (let rank = 0; rank < sortedScores.length; rank++) {
    const [planet, score] = sortedScores[rank];
    const detail = scoresResult.details[planet];
    const detailStr = Object.entries(detail)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${k}:${v >= 0 ? "+" : ""}${v}`)
      .join(" / ");
    lines.push(`  ${rank + 1}. ${planet}：${score}分 (${detailStr})`);
  }

  // Step 3
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 3】格局识别");
  lines.push("=".repeat(60));

  if (patterns.grand_trines.length > 0) {
    lines.push("大三角(每星+12)：");
    for (const trine of patterns.grand_trines) {
      lines.push(`  ${trine.join(", ")}`);
    }
  }
  if (patterns.t_squares.length > 0) {
    lines.push("T三角(顶点+8)：");
    for (const ts of patterns.t_squares) {
      lines.push(`  ${ts.join(", ")}`);
    }
  }
  if (patterns.grand_crosses.length > 0) {
    lines.push("大十字(每星+5)：");
    for (const cross of patterns.grand_crosses) {
      lines.push(`  ${cross.join(", ")}`);
    }
  }
  if (patterns.stelliums.length > 0) {
    lines.push("群星(3星以上同宫，每颗+4)：");
    for (const st of patterns.stelliums) {
      lines.push(`  第${st.house}宫：${st.planets.join(", ")}`);
    }
  }
  if (patterns.grand_trines.length === 0 && patterns.t_squares.length === 0 &&
      patterns.grand_crosses.length === 0 && patterns.stelliums.length === 0) {
    lines.push("  无明显格局");
  }

  // Step 4
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 4】飞宫计算（8大领域）");
  lines.push("=".repeat(60));
  for (const [area, fly] of Object.entries(dispositorship)) {
    lines.push(`  ${area}：${fly}`);
  }

  // Step 5
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 5】元素分布");
  lines.push("=".repeat(60));
  lines.push(`  火象：${elements["火"]}颗`);
  lines.push(`  土象：${elements["土"]}颗`);
  lines.push(`  风象：${elements["风"]}颗`);
  lines.push(`  水象：${elements["水"]}颗`);
  lines.push(`  基调：${elements["基调"]}象`);

  // Step 6
  lines.push("\n" + "=".repeat(60));
  lines.push("【Step 6】宫位能量聚合");
  lines.push("=".repeat(60));
  for (let houseNum = 1; houseNum <= 12; houseNum++) {
    const house = houseEnergy[houseNum];
    const planetsStr = house.planets.join(", ") || "无";
    const highMark = house.high_energy ? " ⭐高能" : "";
    const healingMark = house.healing_type ? ` [${house.healing_type}]` : "";
    lines.push(`  第${houseNum}宫(${house.type})：${planetsStr} | 最高${house.max_score}分${highMark}${healingMark}`);
  }

  lines.push("\n" + "=".repeat(60));

  return lines.join("\n");
}

// ===== Main entry point =====

export interface V2CalculationResult {
  calcText: string;           // Formatted text for API
  scores: Record<string, number>;  // Raw scores for UI
  details: Record<string, ScoreDetail>;
  sectResult: SectResult;
  dignityResult: Record<string, DignityResult>;
  patterns: Patterns;
  dispositorship: Record<string, string>;
  elements: Record<string, number | string>;
  houseEnergy: Record<number, { planets: string[]; max_score: number; type: string; healing_type: string | null; high_energy: boolean }>;
  sortedPlanets: { name: string; score: number }[];
  dominantPlanet: string;
}

export function runV2Calculations(chart: NatalChart): V2CalculationResult {
  const chartData = natalChartToChartData(chart);

  // Step 0
  const sectResult = calculateSect(chartData);

  // Step 1
  const dignityResult = checkDignity(chartData);

  // Step 3 (must run before Step 2 for pattern bonuses)
  const patterns = detectPatterns(chartData);

  // Step 2
  const scoresResult = calculateScores(chartData, sectResult, dignityResult, patterns);

  // Step 4
  const dispositorship = calculateDispositorship(chartData);

  // Step 5
  const elements = calculateElements(chartData);

  // Step 6
  const houseEnergy = calculateHouseEnergy(chartData, scoresResult.scores);

  // Format
  const calcText = formatCalculationResults(
    chart, sectResult, dignityResult, scoresResult,
    patterns, dispositorship, elements, houseEnergy
  );

  const sortedPlanets = Object.entries(scoresResult.scores)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  return {
    calcText,
    scores: scoresResult.scores,
    details: scoresResult.details,
    sectResult,
    dignityResult,
    patterns,
    dispositorship,
    elements,
    houseEnergy,
    sortedPlanets,
    dominantPlanet: sortedPlanets[0]?.name || "太阳",
  };
}
