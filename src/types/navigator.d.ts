/**
 * TypeScript type declarations for non-standard Navigator APIs
 * These extend the standard Navigator interface with browser-specific capabilities
 */

interface Navigator {
  /**
   * Device Memory API - Provides approximate amount of RAM in gigabytes
   * Only available in Chromium-based browsers
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
   */
  readonly deviceMemory?: number;

  /**
   * Battery Status API - Provides information about system battery charge level
   * Note: Deprecated but still widely supported
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery
   * @deprecated Use sparingly as this API is being phased out
   */
  getBattery?: () => Promise<BatteryManager>;
}

/**
 * Battery Manager interface for the Battery Status API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BatteryManager
 */
interface BatteryManager extends EventTarget {
  /** Battery charge level between 0 and 1 (0% to 100%) */
  readonly level: number;

  /** Whether the device is currently charging */
  readonly charging: boolean;

  /** Time in seconds until battery is fully charged, or Infinity if not charging */
  readonly chargingTime: number;

  /** Time in seconds until battery is fully discharged, or Infinity if charging */
  readonly dischargingTime: number;

  /** Event handler for when charging state changes */
  onchargingchange: ((this: BatteryManager, ev: Event) => void) | null;

  /** Event handler for when charge level changes */
  onlevelchange: ((this: BatteryManager, ev: Event) => void) | null;

  /** Event handler for when charging time changes */
  onchargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;

  /** Event handler for when discharging time changes */
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
}
