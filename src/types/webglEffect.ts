/**
 * Type definitions for WebGL effect components with dynamic property access
 */

/**
 * Interface for WebGL effects with controllable properties
 */
export interface ControllableEffect {
  targetFPS?: number;
  isRunning?: boolean;
  start?: () => void;
  stop?: () => void;
  cleanup?: () => void;
  initialize?: () => void;
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Type guard for effects with targetFPS property
 */
export function hasTargetFPS(effect: unknown): effect is { targetFPS: number } {
  return typeof effect === "object" && effect !== null && "targetFPS" in effect;
}

/**
 * Type guard for effects with isRunning property
 */
export function hasIsRunning(effect: unknown): effect is { isRunning: boolean } {
  return typeof effect === "object" && effect !== null && "isRunning" in effect;
}

/**
 * Type guard for effects with start method
 */
export function hasStartMethod(effect: unknown): effect is { start: () => void } {
  return (
    typeof effect === "object" &&
    effect !== null &&
    "start" in effect &&
    typeof (effect as Record<string, unknown>).start === "function"
  );
}

/**
 * Type guard for effects with stop method
 */
export function hasStopMethod(effect: unknown): effect is { stop: () => void } {
  return (
    typeof effect === "object" &&
    effect !== null &&
    "stop" in effect &&
    typeof (effect as Record<string, unknown>).stop === "function"
  );
}
