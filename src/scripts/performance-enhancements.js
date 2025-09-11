export function initPerformanceEnhancements() {
  // Passive touch listeners for better scroll performance
  if ("ontouchstart" in window) {
    document.addEventListener("touchstart", () => {}, { passive: true });
    document.addEventListener("touchmove", () => {}, { passive: true });
    document.addEventListener("wheel", () => {}, { passive: true });
  }

  // Debounce resize events
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      checkPerformanceMode();
    }, 250);
  });

  // Pause animations when tab is not visible
  document.addEventListener("visibilitychange", () => {
    const elements = document.querySelectorAll(".noise-overlay, .grunge-overlay, .matrix-bg");
    elements.forEach((el) => {
      el.setAttribute("data-paused", document.hidden ? "true" : "false");
    });
  });

  // Network-based performance adaptation
  if ("connection" in navigator && navigator.connection) {
    const connection = navigator.connection;
    if (
      connection.saveData ||
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"
    ) {
      document.documentElement.classList.add("performance-mode");
    }
  }
}

function checkPerformanceMode() {
  const isMobile = window.innerWidth < 768;
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isMobile || isLowEnd || prefersReduced || isTouchDevice) {
    document.documentElement.classList.add("performance-mode");
    document.documentElement.style.setProperty("--noise-opacity", "0");
    document.documentElement.style.setProperty("--grunge-overlay-opacity", "0");
  } else {
    document.documentElement.classList.remove("performance-mode");
    document.documentElement.style.setProperty("--noise-opacity", "0.65");
    document.documentElement.style.setProperty("--grunge-overlay-opacity", "0.9");
  }
}
