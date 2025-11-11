/**
 * Browser detection for minimum version requirements
 * Minimum supported versions: Chrome 90+, Firefox 88+, Safari 16+, Edge 90+
 */

export interface BrowserInfo {
  name: string;
  version: number;
  isSupported: boolean;
}

/**
 * Detect browser and version from user-agent string
 * Returns browser info with support status
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;

  // Edge detection (check first since it contains "Chrome")
  if (/Edg\/(\d+)/.test(ua)) {
    const version = parseInt(RegExp.$1, 10);
    return {
      name: "Edge",
      version,
      isSupported: version >= 90,
    };
  }

  // Chrome detection
  if (/Chrome\/(\d+)/.test(ua) && !/Edg\//.test(ua)) {
    const version = parseInt(RegExp.$1, 10);
    return {
      name: "Chrome",
      version,
      isSupported: version >= 90,
    };
  }

  // Firefox detection
  if (/Firefox\/(\d+)/.test(ua)) {
    const version = parseInt(RegExp.$1, 10);
    return {
      name: "Firefox",
      version,
      isSupported: version >= 88,
    };
  }

  // Safari detection (check for Version/xx.x)
  if (/Safari\//.test(ua) && /Version\/(\d+)/.test(ua)) {
    const version = parseInt(RegExp.$1, 10);
    return {
      name: "Safari",
      version,
      isSupported: version >= 16,
    };
  }

  // Unknown browser - assume unsupported for safety
  return {
    name: "Unknown",
    version: 0,
    isSupported: false,
  };
}

/**
 * Get minimum required version for a browser
 */
export function getMinimumVersion(browserName: string): number {
  const minimumVersions: Record<string, number> = {
    Chrome: 90,
    Firefox: 88,
    Safari: 16,
    Edge: 90,
  };

  return minimumVersions[browserName] || 0;
}

/**
 * Check if current browser meets minimum requirements
 */
export function isBrowserSupported(): boolean {
  const browserInfo = detectBrowser();
  return browserInfo.isSupported;
}
