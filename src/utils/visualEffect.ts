export interface VisualEffectConfig {
  canvasId: string;
  targetFPS?: number;
  themeAttribute?: string;
  performanceAttribute?: string;
}

export abstract class VisualEffect {
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;
  protected animationId: number = 0;
  protected lastTime: number = 0;
  protected frameInterval: number;
  protected observers: MutationObserver[] = [];
  protected config: VisualEffectConfig;

  constructor(config: VisualEffectConfig) {
    this.config = config;
    this.frameInterval = 1000 / (config.targetFPS || 30);
  }

  protected abstract shouldShow(): boolean;
  protected abstract update(): void;
  protected abstract render(): void;
  protected abstract onResize(): void;

  public initialize(): void {
    this.canvas = document.getElementById(this.config.canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      console.warn(`Canvas element with id "${this.config.canvasId}" not found`);
      return;
    }

    const contextOptions = {
      alpha: true,
      desynchronized: true,
    };

    this.ctx = this.canvas.getContext("2d", contextOptions) as CanvasRenderingContext2D | null;
    if (!this.ctx) {
      console.error(`Failed to get 2D context for canvas "${this.config.canvasId}"`);
      return;
    }

    this.setupEventListeners();
    this.setupObservers();
    this.updateVisibility();
  }

  protected setupEventListeners(): void {
    window.addEventListener("resize", this.handleResize.bind(this));

    this.canvas?.addEventListener("contextlost", this.handleContextLost.bind(this));
    this.canvas?.addEventListener("contextrestored", this.handleContextRestored.bind(this));

    document.addEventListener("astro:before-preparation", this.cleanup.bind(this));
  }

  protected setupObservers(): void {
    const htmlObserver = new MutationObserver(() => {
      this.updateVisibility();
    });

    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [this.config.themeAttribute || "data-theme"],
    });

    this.observers.push(htmlObserver);

    if (this.config.performanceAttribute) {
      const bodyObserver = new MutationObserver(() => {
        this.updateVisibility();
      });

      bodyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: [this.config.performanceAttribute],
      });

      this.observers.push(bodyObserver);
    }
  }

  protected handleResize(): void {
    if (!this.canvas) return;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.onResize();
  }

  protected handleContextLost(event: Event): void {
    event.preventDefault();
    console.warn(`Context lost for canvas "${this.config.canvasId}"`);
    this.stop();
  }

  protected handleContextRestored(): void {
    this.initialize();
  }

  protected animate(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= this.frameInterval) {
      this.update();
      this.render();
      this.lastTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  protected updateVisibility(): void {
    if (!this.canvas) return;

    if (this.shouldShow()) {
      this.canvas.style.display = "block";
      this.start();
    } else {
      this.canvas.style.display = "none";
      this.stop();
    }
  }

  protected start(): void {
    if (!this.animationId && this.ctx) {
      this.handleResize();
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  protected stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  public cleanup(): void {
    this.stop();

    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    window.removeEventListener("resize", this.handleResize.bind(this));

    if (this.canvas) {
      this.canvas.removeEventListener("contextlost", this.handleContextLost.bind(this));
      this.canvas.removeEventListener("contextrestored", this.handleContextRestored.bind(this));
    }

    document.removeEventListener("astro:before-preparation", this.cleanup.bind(this));
  }

  protected checkPerformanceMode(): boolean {
    const performanceMode = document.body.getAttribute("data-performance") === "true";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return performanceMode || prefersReducedMotion;
  }
}

export const FIRE_CONSTANTS = {
  WIDTH: 160,
  HEIGHT: 100,
  MAX_INTENSITY: 36,
  DECAY_RANGE: 3,
  SPREAD_RANGE: 3,
} as const;

export const MATRIX_CONSTANTS = {
  FONT_SIZE: 14,
  DROP_SPEED: 0.05,
  FADE_SPEED: 0.03,
  CHAR_CHANGE_PROBABILITY: 0.005,
} as const;

export const LIGHTNING_CONSTANTS = {
  FORK_PROBABILITY: 0.0008,
  MAX_BRANCHES: 5,
  FADE_MULTIPLIER: 0.95,
  ANGLE_VARIANCE: 2.3,
  MIN_OPACITY: 0.7,
  BOLT_WIDTH: 3.7,
} as const;

export const SAKURA_CONSTANTS = {
  PETAL_COUNT: 40,
  MIN_SIZE: 3,
  MAX_SIZE: 8,
  FALL_SPEED_MIN: 0.5,
  FALL_SPEED_MAX: 2,
  SWAY_AMPLITUDE: 30,
  SWAY_FREQUENCY: 0.02,
} as const;
