// Structured report data types for the 7-section blueprint report

export interface ReportData {
  // Section 0: Identity
  identity: {
    mainPlanet: string;       // e.g. "月亮"
    nickname: string;         // e.g. "静水织梦"
    tagline: string;          // e.g. "以情绪为锚点，用感知力编织生活的温暖织梦者"
    metaphor: string;         // e.g. "像深夜窗边的暖灯，藏着细腻的情绪宇宙"
    secondaryPlanets: string[]; // e.g. ["太阳", "冥王"]
    avatarPrompt: string;     // For AI image generation
    coverPrompt: string;      // For AI cover image
  };

  // Section 1: Who you are
  whoYouAre: string;

  // Section 2: Talents & Career
  talents: {
    top3: Talent[];
    coreTrack: {
      name: string;
      reasons: string[];
      avoid: string[];
      startup: string;
    };
  };

  // Section 3: Personality & Resources
  personality: {
    strengths: StrengthWeakness[];
    weaknesses: StrengthWeakness[];
    opportunities: Opportunity[];
  };

  // Section 4: 8 Life Areas
  lifeAreas: LifeArea[];

  // Section 5: Life Timeline
  timeline: {
    phases: LifePhase[];
    dimensions: DimensionAdvice[];
  };

  // Section 6: Pitfalls
  pitfalls: {
    people: string[];
    things: string[];
    environments: string[];
    special: string[];
  };

  // Section 7: Summary & Action
  summary: {
    conclusion: string;
    actions: string[];
    quote: string;
  };

  // Scores for charts
  scores: {
    planets: PlanetScore[];
    dimensions: Record<string, number>; // For radar chart: 情绪力, 领导力, 洞察力, etc.
  };
}

export interface Talent {
  name: string;        // e.g. "情绪织梦"
  planet: string;      // e.g. "月亮"
  sign: string;        // e.g. "双鱼"
  house: number;
  dignity?: string;    // e.g. "入庙" or undefined
  score: number;
  description: string;
  industries: string[];
}

export interface StrengthWeakness {
  title: string;
  metaphor: string;
  description: string;
}

export interface Opportunity {
  name: string;
  description: string;
}

export interface LifeArea {
  domain: string;      // e.g. "恋爱与亲密关系"
  tag: string;         // e.g. "事业牵缘"
  flyStar: string;     // e.g. "5飞10"
  anchor: string;      // description
  tips: string[];
}

export interface LifePhase {
  ageRange: string;    // e.g. "25-30岁"
  title: string;       // e.g. "深耕期"
  subtitle: string;    // e.g. "打磨核心技能"
  advice: string[];
}

export interface DimensionAdvice {
  dimension: string;   // e.g. "事业"
  tips: string[];
}

export interface PlanetScore {
  planet: string;
  score: number;
  maxScore: number;
}
