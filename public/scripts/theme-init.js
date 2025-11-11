// Theme colors mapping for meta theme-color tag
const themeColors = {
  "green-phosphor": "#00ff00",
  "amber-phosphor": "#ffb000",
  monochrome: "#ffffff",
  "doom-red": "#ff4100",
};

// Update theme-color meta tag
function updateThemeColor(theme) {
  const color = themeColors[theme] || themeColors["monochrome"];
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", color);
  }
}

// Device detection utilities
async function shouldEnablePerformanceMode() {
  // Auto-enable for mobile viewport
  if (window.innerWidth < 768) {
    return true;
  }

  // Auto-enable for low-end devices
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory;

  if (cores < 4 || (memory !== undefined && memory < 4)) {
    return true;
  }

  return false;
}

// Theme initialization function
async function applyStoredTheme() {
  const theme = localStorage.getItem("selectedTheme") || "monochrome";
  document.documentElement.setAttribute("data-theme", theme);
  if (document.body) {
    document.body.setAttribute("data-theme", theme);
    // Force browser reflow to ensure CSS variables recompute before view transition completes
    void document.body.offsetHeight;
  }

  // Update browser theme color
  updateThemeColor(theme);

  // Performance mode initialization with device detection
  const performanceStored = localStorage.getItem("performanceMode");
  let performanceMode = false;

  if (performanceStored !== null) {
    // User has explicitly set preference
    performanceMode = performanceStored === "true";
  } else {
    // Auto-detect based on device capabilities
    performanceMode = await shouldEnablePerformanceMode();
  }

  if (document.body) {
    document.body.setAttribute("data-performance", performanceMode.toString());
  }
}

// Run on initial page load
applyStoredTheme();

// Re-run after view transition navigation
document.addEventListener("astro:page-load", applyStoredTheme);

// Listen for theme changes
window.addEventListener("themeChanged", (event) => {
  updateThemeColor(event.detail.theme);
});
