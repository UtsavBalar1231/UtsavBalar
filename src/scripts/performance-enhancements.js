// Performance Enhancements for Mobile
// Add passive listeners for better scroll performance

export function initPerformanceEnhancements() {
  // Add passive touch listeners for better scroll performance
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
      // Re-check performance mode on resize
      checkPerformanceMode();
    }, 250);
  });

  // Pause animations when tab is not visible
  document.addEventListener("visibilitychange", () => {
    const elements = document.querySelectorAll(
      ".crt-screen, .crt-overlay, .crt-static, .matrix-bg"
    );
    elements.forEach((el) => {
      el.setAttribute("data-paused", document.hidden ? "true" : "false");
    });
  });

  // Network speed detection for adaptive loading
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
    document.documentElement.style.setProperty("--crt-intensity", "0");
  } else {
    document.documentElement.classList.remove("performance-mode");
    document.documentElement.style.setProperty("--crt-intensity", "1");
  }
}
