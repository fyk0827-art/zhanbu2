// ============================================
// Swiss Ephemeris Astrology Engine
// Direct WASM module calls to avoid CJS/ESM issues
// ============================================

import swissephWasmUrl from "@swisseph/browser/dist/swisseph.wasm?url";

const Planet = {
  Sun: 0, Moon: 1, Mercury: 2, Venus: 3, Mars: 4,
  Jupiter: 5, Saturn: 6, Uranus: 7, Neptune: 8, Pluto: 9,
} as const;
type PlanetType = typeof Planet[keyof typeof Planet];

const HOUSE_PLACIDUS = 80; // charCode of 'P'
const FLAG_SPEED = 256;
const FLAG_MOSHIER = 4;
const DEFAULT_FLAGS = FLAG_MOSHIER | FLAG_SPEED; // 260

// Emscripten module reference
let emModule: any = null;
let initPromise: Promise<any> | null = null;

// Emscripten cwrap wrappers - initialized after module load
let _swe_calc_ut_wrap: any = null;
let _swe_houses_wrap: any = null;
let _swe_julday_wrap: any = null;

export async function initSwissEph(): Promise<any> {
  if (emModule) return emModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { SwissEphemeris } = await import("@swisseph/browser");
      const swe = new SwissEphemeris();
      await swe.init(swissephWasmUrl);

      // Access the underlying Emscripten module (bypass private)
      emModule = (swe as any).module || (swe as any)['module'];

      if (!emModule) {
        throw new Error("Failed to get Emscripten module from SwissEphemeris");
      }

      // Ensure critical runtime functions exist with polyfills if needed
      ensureRuntimeFunctions(emModule);

      // Pre-wrap C functions using ccall (cwrap returns undefined in this build)
      _swe_calc_ut_wrap = (jd: number, body: number, flags: number, xxPtr: number, serrPtr: number) =>
        emModule.ccall("swe_calc_ut_wrap", "number", ["number", "number", "number", "number", "number"], [jd, body, flags, xxPtr, serrPtr]);
      _swe_houses_wrap = (jd: number, lat: number, lng: number, hsys: number, cuspsPtr: number, ascmcPtr: number) =>
        emModule.ccall("swe_houses_wrap", "number", ["number", "number", "number", "number", "number", "number"], [jd, lat, lng, hsys, cuspsPtr, ascmcPtr]);
      _swe_julday_wrap = (year: number, month: number, day: number, hour: number, cal: number) =>
        emModule.ccall("swe_julday_wrap", "number", ["number", "number", "number", "number", "number"], [year, month, day, hour, cal]);

      console.log("[SwissEph] WASM initialized successfully");
      console.log("[SwissEph] Runtime functions:", {
        hasMalloc: !!emModule._malloc,
        hasFree: !!emModule._free,
        hasCcall: !!emModule.ccall,
        hasCwrap: !!emModule.cwrap,
        hasGetValue: !!emModule.getValue,
      });

      return emModule;
    } catch (error) {
      console.error("[SwissEph] Initialization failed:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Ensure critical Emscripten runtime functions are available.
 * If _malloc/_free are missing (due to build mangling), provide polyfills.
 */
function ensureRuntimeFunctions(mod: any) {
  // Check if _malloc exists
  if (typeof mod._malloc !== "function") {
    console.warn("[SwissEph] _malloc not found, attempting to locate via wasm exports...");
    // Try to find malloc in wasm exports
    const exports = mod.asm || mod.wasmExports || (mod.wasmTable && mod.wasmTable.grow) || {};
    for (const [key, val] of Object.entries(exports)) {
      if (typeof val === "function" && key.toLowerCase().includes("malloc")) {
        mod._malloc = val;
        console.log("[SwissEph] Found malloc alternative:", key);
        break;
      }
    }
    // Last resort: try cwrap to get malloc
    if (typeof mod._malloc !== "function" && typeof mod.ccall === "function") {
      try {
        mod._malloc = mod.cwrap("malloc", "number", ["number"]);
        console.log("[SwissEph] Using cwrap fallback for malloc");
      } catch {
        // ignore
      }
    }
  }

  if (typeof mod._free !== "function") {
    try {
      mod._free = mod.cwrap("free", null, ["number"]);
      console.log("[SwissEph] Using cwrap fallback for free");
    } catch {
      // ignore - memory will leak but functionally ok for short sessions
    }
  }

  // Ensure getValue exists
  if (typeof mod.getValue !== "function") {
    mod.getValue = (ptr: number, type: string) => {
      const heap = mod.HEAPF64;
      if (type === "double" || type === "float") {
        return heap[ptr >> 3];
      }
      return mod.HEAP32[ptr >> 2];
    };
  }
}

/** Allocate memory - tries _malloc first, falls back to stackAlloc */
function allocMem(size: number): number {
  if (emModule._malloc) return emModule._malloc(size);
  if (emModule.stackAlloc) return emModule.stackAlloc(size);
  throw new Error("No memory allocation function available (_malloc or stackAlloc)");
}

function freeMem(ptr: number) {
  if (emModule._free) emModule._free(ptr);
  // stackAlloc memory doesn't need free
}

// ===== Interfaces =====
export interface BirthData {
  year: number; month: number; day: number;
  hour: number; minute: number;
  latitude: number; longitude: number;
  timezone: number;
  gender: "male" | "female";
  name?: string;
}

export interface PlanetPosition {
  name: string; body: PlanetType;
  longitude: number; latitude: number; speed: number;
  sign: string; signDegree: number;
  house: number; isRetrograde: boolean;
}

export interface HouseCusp {
  house: number; longitude: number; sign: string; signDegree: number;
}

export interface ChartAngles {
  ascendant: number; mc: number; descendant: number; ic: number;
  ascendantSign: string; mcSign: string;
}

export interface Aspect {
  planet1: string; planet2: string; aspectType: string; angle: number; orb: number;
}

export interface NatalChart {
  birthData: BirthData; julianDay: number;
  planets: PlanetPosition[]; houses: HouseCusp[];
  angles: ChartAngles; aspects: Aspect[];
  sunSign: string; moonSign: string; risingSign: string;
}

// ===== Utility functions =====
const SIGNS = ["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"];
const SIGN_SYMBOLS = ["\u2648","\u2649","\u264A","\u264B","\u264C","\u264D","\u264E","\u264F","\u2650","\u2651","\u2652","\u2653"];

export function getSignFromLongitude(lon: number): number { return Math.floor(((lon % 360) + 360) % 360 / 30) % 12; }
export function getSignName(lon: number): string { return SIGNS[getSignFromLongitude(lon)]; }
export function getSignElement(lon: number): string { return ["火","土","风","水","火","土","风","水","火","土","风","水"][getSignFromLongitude(lon)]; }
export function getSignQuality(lon: number): string { return ["开创","固定","变动","开创","固定","变动","开创","固定","变动","开创","固定","变动"][getSignFromLongitude(lon)]; }
export function getDegreeInSign(lon: number): number { return ((lon % 360) + 360) % 360 % 30; }
export function formatDegree(deg: number): string { const d = Math.floor(deg); const m = Math.floor((deg - d) * 60); return `${d}°${m.toString().padStart(2,"0")}'`; }

const PLANET_NAMES: Record<number, string> = {
  [Planet.Sun]:"太阳",[Planet.Moon]:"月亮",[Planet.Mercury]:"水星",[Planet.Venus]:"金星",
  [Planet.Mars]:"火星",[Planet.Jupiter]:"木星",[Planet.Saturn]:"土星",
  [Planet.Uranus]:"天王星",[Planet.Neptune]:"海王星",[Planet.Pluto]:"冥王星",
};
const PLANET_SYMBOLS: Record<number, string> = {
  [Planet.Sun]:"\u2609",[Planet.Moon]:"\u263D",[Planet.Mercury]:"\u263F",[Planet.Venus]:"\u2640",
  [Planet.Mars]:"\u2642",[Planet.Jupiter]:"\u2643",[Planet.Saturn]:"\u2644",
  [Planet.Uranus]:"\u2645",[Planet.Neptune]:"\u2646",[Planet.Pluto]:"\u2647",
};

export function getPlanetName(body: PlanetType): string { return PLANET_NAMES[body] || "未知"; }
export function getPlanetSymbol(body: PlanetType): string { return PLANET_SYMBOLS[body] || "?"; }

function getHouseFromLongitude(lon: number, houses: HouseCusp[]): number {
  for (let i = 0; i < 12; i++) {
    const cusp = houses[i].longitude;
    const next = houses[(i + 1) % 12].longitude;
    if (next > cusp) { if (lon >= cusp && lon < next) return i + 1; }
    else { if (lon >= cusp || lon < next) return i + 1; }
  }
  return 1;
}

// ===== Core calculations =====
function calcJulianDay(year: number, month: number, day: number, hour: number): number {
  return _swe_julday_wrap(year, month, day, hour, 1);
}

function calcPlanetPosition(jd: number, body: PlanetType): PlanetPosition {
  const mod = emModule;
  const resultPtr = allocMem(8 * 6);
  const serrPtr = allocMem(256);

  try {
    const retflag = _swe_calc_ut_wrap(jd, body, DEFAULT_FLAGS, resultPtr, serrPtr);

    if (retflag < 0) {
      const error = mod.UTF8ToString ? mod.UTF8ToString(serrPtr) : "Calculation error";
      console.warn(`[SwissEph] calcPlanet(${body}) warning:`, error);
    }

    const lon = mod.getValue(resultPtr, "double");
    const lat = mod.getValue(resultPtr + 8, "double");
    // const dist = mod.getValue(resultPtr + 16, "double"); // distance not used
    const speed = mod.getValue(resultPtr + 24, "double");

    return {
      name: getPlanetName(body),
      body,
      longitude: lon,
      latitude: lat,
      speed,
      sign: getSignName(lon),
      signDegree: getDegreeInSign(lon),
      house: 0,
      isRetrograde: speed < 0,
    };
  } finally {
    freeMem(resultPtr);
    freeMem(serrPtr);
  }
}

function calcHousesData(jd: number, lat: number, lng: number): { houses: HouseCusp[]; angles: ChartAngles } {
  const mod = emModule;
  const cuspsPtr = allocMem(8 * 13);
  const ascmcPtr = allocMem(8 * 10);

  try {
    _swe_houses_wrap(jd, lat, lng, HOUSE_PLACIDUS, cuspsPtr, ascmcPtr);

    const houses: HouseCusp[] = [];
    for (let i = 1; i <= 12; i++) {
      const lon = mod.getValue(cuspsPtr + i * 8, "double");
      houses.push({ house: i, longitude: lon, sign: getSignName(lon), signDegree: getDegreeInSign(lon) });
    }

    const asc = mod.getValue(ascmcPtr + 0 * 8, "double");
    const mc = mod.getValue(ascmcPtr + 1 * 8, "double");

    return {
      houses,
      angles: {
        ascendant: asc,
        mc,
        descendant: (asc + 180) % 360,
        ic: (mc + 180) % 360,
        ascendantSign: getSignName(asc),
        mcSign: getSignName(mc),
      },
    };
  } finally {
    freeMem(cuspsPtr);
    freeMem(ascmcPtr);
  }
}

// ===== Aspect calculations =====
const ASPECT_DEFS = [
  { name: "合相", angle: 0, orb: 8 },
  { name: "六合", angle: 60, orb: 6 },
  { name: "刑克", angle: 90, orb: 6 },
  { name: "拱相", angle: 120, orb: 8 },
  { name: "冲相", angle: 180, orb: 8 },
];

function calcAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i], p2 = planets[j];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({ planet1: p1.name, planet2: p2.name, aspectType: def.name, angle: Math.round(diff * 10) / 10, orb: Math.round(orb * 10) / 10 });
          break;
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

// ===== Main calculation =====
export async function calculateNatalChart(birthData: BirthData): Promise<NatalChart> {
  await initSwissEph(); // initializes global emModule

  // Convert to decimal hour (UT = local time - timezone)
  const decimalHour = birthData.hour + birthData.minute / 60 - birthData.timezone;

  // Julian Day
  const jd = calcJulianDay(birthData.year, birthData.month, birthData.day, decimalHour);

  if (!Number.isFinite(jd) || jd < 0) {
    throw new Error(`Invalid Julian Day: ${jd}. Check birth date/time.`);
  }

  // Houses
  const { houses, angles } = calcHousesData(jd, birthData.latitude, birthData.longitude);

  // Planets
  const bodies = [Planet.Sun, Planet.Moon, Planet.Mercury, Planet.Venus, Planet.Mars, Planet.Jupiter, Planet.Saturn, Planet.Uranus, Planet.Neptune, Planet.Pluto];
  const planets: PlanetPosition[] = bodies.map(b => {
    const p = calcPlanetPosition(jd, b);
    p.house = getHouseFromLongitude(p.longitude, houses);
    return p;
  });

  // Aspects
  const aspects = calcAspects(planets);

  return {
    birthData,
    julianDay: jd,
    planets,
    houses,
    angles,
    aspects,
    sunSign: planets.find(p => p.body === Planet.Sun)?.sign || "",
    moonSign: planets.find(p => p.body === Planet.Moon)?.sign || "",
    risingSign: angles.ascendantSign,
  };
}

// ===== Distribution analysis =====
export function getElementDistribution(planets: PlanetPosition[]) {
  const el: Record<string, number> = { 火: 0, 土: 0, 风: 0, 水: 0 };
  planets.forEach(p => { const e = getSignElement(p.longitude); el[e] = (el[e] || 0) + 1; });
  return el;
}
export function getModalityDistribution(planets: PlanetPosition[]) {
  const m: Record<string, number> = { 开创: 0, 固定: 0, 变动: 0 };
  planets.forEach(p => { const q = getSignQuality(p.longitude); m[q] = (m[q] || 0) + 1; });
  return m;
}
export function getHemisphereDistribution(planets: PlanetPosition[], angles: ChartAngles) {
  let n = 0, s = 0, e = 0, w = 0;
  const desc = (angles.ascendant + 180) % 360;
  const ic = (angles.mc + 180) % 360;
  planets.forEach(p => {
    let isAbove = false;
    if (desc > angles.ascendant) isAbove = p.longitude >= angles.ascendant && p.longitude < desc;
    else isAbove = p.longitude >= angles.ascendant || p.longitude < desc;
    if (isAbove) s++; else n++;
    let isEast = false;
    if (ic > angles.mc) isEast = p.longitude >= angles.mc && p.longitude < ic;
    else isEast = p.longitude >= angles.mc || p.longitude < ic;
    if (isEast) e++; else w++;
  });
  return { northern: n, southern: s, eastern: e, western: w };
}

export { Planet, SIGN_SYMBOLS };
