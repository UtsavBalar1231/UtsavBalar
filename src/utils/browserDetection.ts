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
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  if (edgeMatch) {
    const version = parseInt(edgeMatch[1], 10);
    return {
      name: "Edge",
      version,
      isSupported: version >= 90,
    };
  }

  // Chrome detection
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && !/Edg\//.test(ua)) {
    const version = parseInt(chromeMatch[1], 10);
    return {
      name: "Chrome",
      version,
      isSupported: version >= 90,
    };
  }

  // Firefox detection
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  if (firefoxMatch) {
    const version = parseInt(firefoxMatch[1], 10);
    return {
      name: "Firefox",
      version,
      isSupported: version >= 88,
    };
  }

  // Safari detection (check for Version/xx.x)
  const safariMatch = ua.match(/Version\/(\d+)/);
  if (/Safari\//.test(ua) && safariMatch) {
    const version = parseInt(safariMatch[1], 10);
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
