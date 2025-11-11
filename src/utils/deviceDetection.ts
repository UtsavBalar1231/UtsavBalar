/**
 * Device capability detection for performance optimization
 */

export interface DeviceCapabilities {
  cores: number;
  memory: number | undefined;
  isMobile: boolean;
  isLowEnd: boolean;
  batteryLevel: number | null;
  gpuTier: "high" | "mid" | "low";
}

/**
 * Get number of CPU cores (logical processors)
 */
export function getCPUCores(): number {
  const cores = navigator.hardwareConcurrency;
  if (!cores) {
    console.warn("Hardware concurrency unavailable, defaulting to 4 cores");
    return 4;
  }
  return cores;
}

/**
 * Get device memory in GB
 * Note: Only available in Chromium browsers
 */
export function getDeviceMemory(): number | undefined {
  return navigator.deviceMemory;
}

/**
 * Check if device is mobile based on viewport width
 */
export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

/**
 * Get GPU tier by analyzing WebGL renderer string
 */
export function getGPUTier(): "high" | "mid" | "low" {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) {
      return "low";
    }

    let renderer: string;

    // Try standard RENDERER parameter first (modern Firefox, Chrome 123+)
    try {
      renderer = (gl as WebGLRenderingContext)
        .getParameter((gl as WebGLRenderingContext).RENDERER)
        .toLowerCase();
    } catch {
      // Fall back to WEBGL_debug_renderer_info extension (older browsers)
      const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) {
        return "mid";
      }

      renderer = (gl as WebGLRenderingContext)
        .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        .toLowerCase();
    }

    // High-end GPUs
    if (
      renderer.includes("nvidia") ||
      renderer.includes("geforce") ||
      renderer.includes("radeon") ||
      renderer.includes("amd") ||
      renderer.includes("apple m1") ||
      renderer.includes("apple m2") ||
      renderer.includes("apple m3")
    ) {
      return "high";
    }

    // Low-end indicators
    if (
      renderer.includes("mali") ||
      renderer.includes("adreno 3") ||
      renderer.includes("adreno 4") ||
      renderer.includes("powervr") ||
      renderer.includes("intel hd")
    ) {
      return "low";
    }

    // Default to mid-tier
    return "mid";
  } catch (error) {
    console.warn("GPU detection failed:", error);
    return "mid";
  }
}

/**
 * Get current battery level (0-100) or null if unavailable
 */
export async function getBatteryLevel(): Promise<number | null> {
  try {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    }
    return null;
  } catch (error) {
    console.warn("Battery API unavailable:", error);
    return null;
  }
}

/**
 * Detect if device is low-end based on hardware specs
 */
export function meetsLowEndThresholds(): boolean {
  const cores = getCPUCores();
  const memory = getDeviceMemory();
  const gpuTier = getGPUTier();

  // Low-end criteria:
  // - Less than 4 CPU cores
  // - Less than 4GB RAM (if available)
  // - Low-tier GPU
  const hasLowCPU = cores < 4;
  const hasLowMemory = memory !== undefined && memory < 4;
  const hasLowGPU = gpuTier === "low";

  // Device is low-end if it meets 2 or more criteria
  const lowEndScore = (hasLowCPU ? 1 : 0) + (hasLowMemory ? 1 : 0) + (hasLowGPU ? 1 : 0);

  return lowEndScore >= 2;
}

/**
 * Check if device should have effects reduced for battery savings
 */
export async function shouldReduceForBattery(): Promise<boolean> {
  const batteryLevel = await getBatteryLevel();
  if (batteryLevel === null) {
    return false; // Battery API unavailable, don't reduce
  }

  // Reduce effects if battery is below 20%
  return batteryLevel < 20;
}

/**
 * Determine if performance mode should be automatically enabled
 */
export async function shouldEnablePerformanceMode(): Promise<boolean> {
  const storedPreference = (() => {
    try {
      return localStorage.getItem("performanceMode");
    } catch {
      return null;
    }
  })();

  if (storedPreference !== null) {
    return storedPreference === "true";
  }

  // Auto-enable for low-end devices
  if (meetsLowEndThresholds()) {
    return true;
  }

  // Auto-enable for mobile viewport
  if (isMobileViewport()) {
    return true;
  }

  // Auto-enable if battery is critically low
  const batteryLevel = await getBatteryLevel();
  if (batteryLevel !== null && batteryLevel < 15) {
    return true;
  }

  // Default: performance mode off
  return false;
}

/**
 * Get comprehensive device capabilities
 */
export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  const cores = getCPUCores();
  const memory = getDeviceMemory();
  const isMobile = isMobileViewport();
  const isLowEnd = meetsLowEndThresholds();
  const batteryLevel = await getBatteryLevel();
  const gpuTier = getGPUTier();

  return {
    cores,
    memory,
    isMobile,
    isLowEnd,
    batteryLevel,
    gpuTier,
  };
}

/**
 * Get recommended FPS for visual effects based on device capabilities
 */
export function getRecommendedFPS(): number {
  const gpuTier = getGPUTier();
  const isMobile = isMobileViewport();

  if (gpuTier === "high" && !isMobile) {
    return 30; // Desktop high-end GPU
  }

  if (gpuTier === "high" && isMobile) {
    return 24; // Mobile high-end GPU
  }

  if (gpuTier === "mid") {
    return 20; // Mid-tier GPU
  }

  return 15; // Low-end GPU
}

/**
 * Get formatted device capabilities for debugging
 */
export async function getDeviceCapabilitiesForLogging(): Promise<
  Record<string, string | number | boolean>
> {
  const capabilities = await getDeviceCapabilities();
  return {
    "CPU Cores": capabilities.cores,
    "Memory (GB)": capabilities.memory || "Unknown",
    "GPU Tier": capabilities.gpuTier,
    "Is Mobile": capabilities.isMobile,
    "Is Low-End": capabilities.isLowEnd,
    "Battery Level": capabilities.batteryLevel ? `${capabilities.batteryLevel}%` : "Unknown",
    "Recommended FPS": getRecommendedFPS(),
  };
}
