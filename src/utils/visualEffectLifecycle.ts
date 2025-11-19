import type { hasIsRunning, hasStartMethod, hasStopMethod } from "@/types/webglEffect";

/**
 * Configuration for visual effect lifecycle management
 */
export interface EffectLifecycleConfig<T> {
  /** Canvas element ID */
  canvasId: string;
  /** Function to initialize the effect */
  initEffect: () => void;
  /** Reference to the effect instance (will be mutated) */
  effectRef: { current: T | null };
  /** Type guards for effect methods */
  typeGuards: {
    hasIsRunning: typeof hasIsRunning;
    hasStartMethod: typeof hasStartMethod;
    hasStopMethod: typeof hasStopMethod;
  };
}

/**
 * Sets up lifecycle management for a visual effect component
 * Handles: intersection observer for viewport-based pausing
 * Note: Theme changes are handled by WebGLEffect.setupObservers()
 */
export function setupEffectLifecycle<T>(config: EffectLifecycleConfig<T>) {
  const { canvasId, initEffect, effectRef, typeGuards } = config;

  let intersectionObserver: IntersectionObserver | null = null;

  /**
   * Setup intersection observer to pause effect when off-screen
   */
  function setupIntersectionObserver() {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !effectRef.current) return;

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const effect = effectRef.current;
          if (effect) {
            if (entry.isIntersecting) {
              if (typeGuards.hasStartMethod(effect)) {
                effect.start();
              }
            } else {
              if (typeGuards.hasStopMethod(effect)) {
                effect.stop();
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    intersectionObserver.observe(canvas);

    // Manually check if canvas is already in viewport and start effect
    // IntersectionObserver only fires on state CHANGE, not initial state
    const rect = canvas.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (isInViewport && effectRef.current) {
      const effect = effectRef.current;
      if (typeGuards.hasStartMethod(effect)) {
        effect.start();
      }
    }
  }

  /**
   * Cleanup intersection observer
   */
  function cleanup() {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }

    if (
      effectRef.current &&
      typeof effectRef.current === "object" &&
      "cleanup" in effectRef.current
    ) {
      (effectRef.current as { cleanup: () => void }).cleanup();
    }

    effectRef.current = null;
  }

  /**
   * Initialize intersection observer for viewport-based pausing
   */
  function initialize() {
    initEffect();
    setupIntersectionObserver();
  }

  // Setup initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  // Setup Astro page transitions cleanup
  document.addEventListener("astro:before-preparation", cleanup);

  // Return cleanup function for manual cleanup if needed
  return cleanup;
}
