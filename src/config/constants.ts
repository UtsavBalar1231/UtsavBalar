// Timing constants (in milliseconds)
export const TIMING = {
  API_TIMEOUT: 5000,
  EASTER_EGG_DURATION: 64000,
  EASTER_EGG_INIT_DELAY: 500,
  THEME_TRANSITION: 200,
  TOAST_DURATION: 5000,
  TOAST_ANIMATION: 300,
  DEBOUNCE_DELAY: 150,
  THROTTLE_DELAY: 100,
} as const;

// Audio/Video settings
export const MEDIA = {
  DEFAULT_VOLUME: 0.25,
  FADE_IN_DURATION: 200,
  FADE_OUT_DURATION: 200,
} as const;

// Performance thresholds
export const PERFORMANCE = {
  MAX_PARTICLES: 100,
  MAX_ANIMATIONS: 10,
  VIEWPORT_THRESHOLD: 768,
  REDUCED_MOTION_QUERY: "(prefers-reduced-motion: reduce)",
} as const;

// Z-index values (use CSS variables when possible, these are fallbacks)
export const Z_INDEX = {
  BACKGROUND: 1,
  NOISE: 4,
  GRUNGE: 5,
  CONTENT: 10,
  HEADER: 20,
  MOBILE_NAV: 30,
  DROPDOWN: 40,
  THEME_SELECTOR: 45,
  THEME_DROPDOWN: 50,
  MODAL: 60,
  TOAST: 70,
  TOOLTIP: 80,
  MAX: 999,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: "selectedTheme",
  PERFORMANCE_MODE: "performanceMode",
  EASTER_EGG_COUNT: "easterEggCount",
  LAST_VISIT: "lastVisit",
} as const;

// API endpoints
export const API = {
  GITHUB_USER: "https://api.github.com/users/",
  GITHUB_TIMEOUT: TIMING.API_TIMEOUT,
} as const;
