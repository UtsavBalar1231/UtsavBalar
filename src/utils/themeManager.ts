import { themes, type Theme, type ThemeValue } from "../data/themes";

export type { Theme, ThemeValue } from "../data/themes";
export type ThemeChangeCallback = (theme: Theme) => void;

const STORAGE_KEY = "selectedTheme";
const DEFAULT_THEME: ThemeValue = "monochrome";

let currentTheme: Theme | null = null;
const listeners = new Set<ThemeChangeCallback>();

const themeColors: Record<string, string> = {
  "green-phosphor": "#00ff00",
  "amber-phosphor": "#ffb000",
  monochrome: "#0a0a0a",
  "doom-red": "#ff0000",
};

function getThemeByValue(value: string): Theme {
  return themes.find((t) => t.value === value) || themes[0];
}

function loadTheme(): Theme {
  if (typeof window === "undefined") {
    return getThemeByValue(DEFAULT_THEME);
  }

  try {
    const storedThemeValue = localStorage.getItem(STORAGE_KEY);
    if (storedThemeValue) {
      const foundTheme = getThemeByValue(storedThemeValue);
      if (foundTheme) return foundTheme;
    }
  } catch (e) {
    console.warn("localStorage unavailable:", e);
  }

  return getThemeByValue(DEFAULT_THEME);
}

function updateMetaTheme(theme: Theme): void {
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", themeColors[theme.value] || "#0a0a0a");
  }
}

function notifyListeners(theme: Theme): void {
  listeners.forEach((callback) => callback(theme));
}

function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme.value);
  document.body.setAttribute("data-theme", theme.value);

  try {
    localStorage.setItem(STORAGE_KEY, theme.value);
  } catch (e) {
    console.warn("localStorage unavailable:", e);
  }

  updateMetaTheme(theme);
  notifyListeners(theme);
}

function initializeTheme(): void {
  if (!currentTheme) {
    currentTheme = loadTheme();
    applyTheme(currentTheme);
  }
}

function getCurrentTheme(): Theme {
  if (!currentTheme) {
    initializeTheme();
  }
  return currentTheme!;
}

function setTheme(value: ThemeValue | string): void {
  const newTheme = getThemeByValue(value);
  if (newTheme && newTheme !== currentTheme) {
    currentTheme = newTheme;
    applyTheme(newTheme);
  }
}

function cycleTheme(): void {
  const current = getCurrentTheme();
  const currentIndex = themes.findIndex((t) => t.value === current.value);
  // If theme not found in array, start from beginning
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;
  setTheme(themes[nextIndex].value);
}

function subscribe(callback: ThemeChangeCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getThemes(): readonly Theme[] {
  return themes;
}

// Initialize on module load
if (typeof window !== "undefined") {
  initializeTheme();
}

export const themeManager = {
  getCurrentTheme,
  setTheme,
  cycleTheme,
  subscribe,
  getThemes,
};
