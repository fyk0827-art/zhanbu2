export interface ThemeColors {
  primary: string;
  secondary: string;
  dark: string;
  cream: string;
  gold: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  cardBg: string;
  cardBorder: string;
}

// Theme presets based on main planet
const THEME_PRESETS: Record<string, ThemeColors> = {
  sun: {
    primary: "#C17817",
    secondary: "#D4A373",
    dark: "#5D4037",
    cream: "#FAF3E8",
    gold: "#D4A373",
    accent: "#E67E22",
    textPrimary: "#3D3428",
    textSecondary: "#6B5E54",
    textMuted: "#9A8B7A",
    border: "rgba(196,162,101,0.15)",
    cardBg: "rgba(255,253,249,0.85)",
    cardBorder: "rgba(196,162,101,0.12)",
  },
  moon: {
    primary: "#2E3A59",
    secondary: "#E8C87A",
    dark: "#1A2238",
    cream: "#F0E6D3",
    gold: "#E8C87A",
    accent: "#4A6088",
    textPrimary: "#2A3040",
    textSecondary: "#5A6070",
    textMuted: "#8A90A0",
    border: "rgba(46,58,89,0.15)",
    cardBg: "rgba(240,230,211,0.88)",
    cardBorder: "rgba(46,58,89,0.1)",
  },
  saturn: {
    primary: "#6B5E54",
    secondary: "#A89880",
    dark: "#3D3428",
    cream: "#F5F0EA",
    gold: "#C4A265",
    accent: "#8B7355",
    textPrimary: "#3D3428",
    textSecondary: "#6B5E54",
    textMuted: "#9A8B7A",
    border: "rgba(107,94,84,0.15)",
    cardBg: "rgba(245,240,234,0.88)",
    cardBorder: "rgba(107,94,84,0.1)",
  },
  pluto: {
    primary: "#5B3A7A",
    secondary: "#B898D0",
    dark: "#2D1B4E",
    cream: "#F0EAFA",
    gold: "#B898D0",
    accent: "#7B68EE",
    textPrimary: "#2D2040",
    textSecondary: "#5A4A6E",
    textMuted: "#8A7A9E",
    border: "rgba(91,58,122,0.15)",
    cardBg: "rgba(240,234,250,0.88)",
    cardBorder: "rgba(91,58,122,0.1)",
  },
  mercury: {
    primary: "#1E3A5F",
    secondary: "#4A90A4",
    dark: "#0F1F2E",
    cream: "#E8F4F8",
    gold: "#4A90A4",
    accent: "#2E7D9E",
    textPrimary: "#1A2F40",
    textSecondary: "#4A6A7A",
    textMuted: "#7A9AAA",
    border: "rgba(30,58,95,0.15)",
    cardBg: "rgba(232,244,248,0.88)",
    cardBorder: "rgba(30,58,95,0.1)",
  },
  mars: {
    primary: "#B85042",
    secondary: "#D4857A",
    dark: "#5D2820",
    cream: "#FAF0EE",
    gold: "#D4857A",
    accent: "#C45B4E",
    textPrimary: "#3D2420",
    textSecondary: "#6B4A44",
    textMuted: "#9A7A74",
    border: "rgba(184,80,66,0.15)",
    cardBg: "rgba(250,240,238,0.88)",
    cardBorder: "rgba(184,80,66,0.1)",
  },
  jupiter: {
    primary: "#4A7C59",
    secondary: "#8BB89A",
    dark: "#1E3A28",
    cream: "#EEF5F0",
    gold: "#8BB89A",
    accent: "#5A9E6E",
    textPrimary: "#1E3020",
    textSecondary: "#4A6A50",
    textMuted: "#7A9A80",
    border: "rgba(74,124,89,0.15)",
    cardBg: "rgba(238,245,240,0.88)",
    cardBorder: "rgba(74,124,89,0.1)",
  },
  venus: {
    primary: "#B86B8E",
    secondary: "#D4A0B8",
    dark: "#4A2038",
    cream: "#FAF0F4",
    gold: "#D4A0B8",
    accent: "#C87E9E",
    textPrimary: "#3D2030",
    textSecondary: "#6B4A5E",
    textMuted: "#9A7A8E",
    border: "rgba(184,107,142,0.15)",
    cardBg: "rgba(250,240,244,0.88)",
    cardBorder: "rgba(184,107,142,0.1)",
  },
  neptune: {
    primary: "#3E6B8E",
    secondary: "#7AA8C4",
    dark: "#1A3048",
    cream: "#EAF0F5",
    gold: "#7AA8C4",
    accent: "#4E8AAE",
    textPrimary: "#1A2838",
    textSecondary: "#4A6880",
    textMuted: "#7A98A8",
    border: "rgba(62,107,142,0.15)",
    cardBg: "rgba(234,240,245,0.88)",
    cardBorder: "rgba(62,107,142,0.1)",
  },
  uranus: {
    primary: "#4A6088",
    secondary: "#8AA0C8",
    dark: "#1A2440",
    cream: "#ECF0F8",
    gold: "#8AA0C8",
    accent: "#5A78A8",
    textPrimary: "#1A2240",
    textSecondary: "#4A5880",
    textMuted: "#7A88A8",
    border: "rgba(74,96,136,0.15)",
    cardBg: "rgba(236,240,248,0.88)",
    cardBorder: "rgba(74,96,136,0.1)",
  },
};

export function getTheme(planetName: string): ThemeColors {
  const key = planetName.toLowerCase().replace(/星$/, "");
  return THEME_PRESETS[key] || THEME_PRESETS["sun"];
}

export function applyThemeCSS(theme: ThemeColors): void {
  const root = document.documentElement;
  root.style.setProperty("--rp-primary", theme.primary);
  root.style.setProperty("--rp-secondary", theme.secondary);
  root.style.setProperty("--rp-dark", theme.dark);
  root.style.setProperty("--rp-cream", theme.cream);
  root.style.setProperty("--rp-gold", theme.gold);
  root.style.setProperty("--rp-accent", theme.accent);
  root.style.setProperty("--rp-text-primary", theme.textPrimary);
  root.style.setProperty("--rp-text-secondary", theme.textSecondary);
  root.style.setProperty("--rp-text-muted", theme.textMuted);
  root.style.setProperty("--rp-border", theme.border);
  root.style.setProperty("--rp-card-bg", theme.cardBg);
  root.style.setProperty("--rp-card-border", theme.cardBorder);
}
