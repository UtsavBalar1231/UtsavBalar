export interface WebGLEffectConfig {
  canvasId: string;
  targetFPS?: number;
  themeAttribute?: string;
  performanceAttribute?: string;
}

export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export abstract class WebGLEffect {
  protected canvas: HTMLCanvasElement | null = null;
  protected gl: WebGLRenderingContext | null = null;
  protected program: WebGLProgram | null = null;
  protected animationId: number = 0;
  protected startTime: number = 0;
  protected config: WebGLEffectConfig;
  protected observers: MutationObserver[] = [];

  // Frame rate limiting
  protected frameInterval: number;
  protected lastFrameTime: number = 0;

  // Common uniforms
  protected timeUniform: WebGLUniformLocation | null = null;
  protected resolutionUniform: WebGLUniformLocation | null = null;

  // Common attributes
  protected positionAttribute: number = -1;

  // Buffers
  protected buffers: Map<string, WebGLBuffer> = new Map();
  protected textures: Map<string, WebGLTexture> = new Map();
  protected framebuffers: Map<string, WebGLFramebuffer> = new Map();

  // Bound event handlers (stored for proper cleanup)
  private boundHandleResize: () => void;
  private boundCleanup: () => void;
  private boundAnimate: (time: number) => void;
  private boundPageLoad: () => void;

  constructor(config: WebGLEffectConfig) {
    this.config = config;
    this.frameInterval = 1000 / (config.targetFPS || 24);

    // Bind once to prevent memory leaks from addEventListener/removeEventListener mismatch
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundCleanup = this.cleanup.bind(this);
    this.boundAnimate = this.animate.bind(this);
    this.boundPageLoad = () => this.updateVisibility();
  }

  protected abstract getShaders(): ShaderSource;
  protected abstract setupGeometry(): void;
  protected abstract draw(time: number): void;
  protected abstract shouldShow(): boolean;

  public initialize(): void {
    this.canvas = document.getElementById(this.config.canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      console.warn(`Canvas element with id "${this.config.canvasId}" not found`);
      return;
    }

    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    };

    this.gl = (this.canvas.getContext("webgl", contextOptions) ||
      this.canvas.getContext("experimental-webgl", contextOptions)) as WebGLRenderingContext | null;

    if (!this.gl) {
      console.error(`WebGL not supported for canvas "${this.config.canvasId}"`);
      return;
    }

    this.enableExtensions();

    if (!this.initializeShaders()) {
      console.error("Failed to initialize shaders");
      return;
    }

    this.setupGeometry();
    this.setupEventListeners();
    this.setupObservers();
    this.updateVisibility();
  }

  protected enableExtensions(): void {
    if (!this.gl) return;

    // Enable instancing extension for particle rendering
    const instancedArrays = this.gl.getExtension("ANGLE_instanced_arrays");
    if (!instancedArrays) {
      console.warn("ANGLE_instanced_arrays not supported");
    }

    // Enable float textures for advanced effects
    this.gl.getExtension("OES_texture_float");
    this.gl.getExtension("OES_texture_float_linear");
  }

  protected compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  protected initializeShaders(): boolean {
    if (!this.gl) return false;

    const shaders = this.getShaders();

    const vertexShader = this.compileShader(shaders.vertex, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(shaders.fragment, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return false;

    this.program = this.gl.createProgram();
    if (!this.program) return false;

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error("Shader linking error:", this.gl.getProgramInfoLog(this.program));
      return false;
    }

    // Clean up shaders (they're linked into the program now)
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    // Get common uniform locations
    this.timeUniform = this.gl.getUniformLocation(this.program, "u_time");
    this.resolutionUniform = this.gl.getUniformLocation(this.program, "u_resolution");

    // Get common attribute locations
    this.positionAttribute = this.gl.getAttribLocation(this.program, "a_position");

    return true;
  }

  protected createBuffer(
    name: string,
    data: Float32Array | Uint16Array,
    target: number = 0
  ): WebGLBuffer | null {
    if (!this.gl) return null;

    const buffer = this.gl.createBuffer();
    if (!buffer) return null;

    const bufferTarget = target || this.gl.ARRAY_BUFFER;

    this.gl.bindBuffer(bufferTarget, buffer);
    this.gl.bufferData(bufferTarget, data, this.gl.STATIC_DRAW);

    this.buffers.set(name, buffer);
    return buffer;
  }

  protected createTexture(
    name: string,
    width: number,
    height: number,
    data?: Uint8Array | null
  ): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Upload texture data
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data || null
    );

    this.textures.set(name, texture);
    return texture;
  }

  protected createFramebuffer(
    name: string,
    width: number,
    height: number
  ): WebGLFramebuffer | null {
    if (!this.gl) return null;

    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) return null;

    // Create texture for framebuffer
    const texture = this.createTexture(`${name}_texture`, width, height);
    if (!texture) return null;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer not complete");
      return null;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    this.framebuffers.set(name, framebuffer);
    return framebuffer;
  }

  protected setupEventListeners(): void {
    window.addEventListener("resize", this.boundHandleResize);

    document.addEventListener("astro:before-preparation", this.boundCleanup);
    document.addEventListener("astro:page-load", this.boundPageLoad);
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
    if (!this.canvas || !this.gl) return;

    // Set canvas size to match display size
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  protected animate(currentTime: number): void {
    // Frame rate limiting - skip frame if not enough time has passed
    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime < this.frameInterval) {
      this.animationId = requestAnimationFrame(this.boundAnimate);
      return;
    }

    // Update frame timing for consistent intervals
    // This prevents drift and maintains steady frame rate
    this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

    if (!this.gl || !this.program) return;

    const time = (currentTime - this.startTime) * 0.001; // Convert to seconds

    // Clear canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use shader program
    this.gl.useProgram(this.program);

    // Set common uniforms
    if (this.timeUniform) {
      this.gl.uniform1f(this.timeUniform, time);
    }

    if (this.resolutionUniform) {
      this.gl.uniform2f(this.resolutionUniform, this.canvas!.width, this.canvas!.height);
    }

    // Draw the effect
    this.draw(time);

    this.animationId = requestAnimationFrame(this.boundAnimate);
  }

  protected updateVisibility(): void {
    if (!this.canvas) return;

    if (this.shouldShow() && !this.checkPerformanceMode()) {
      this.canvas.style.display = "block";
      this.start();
    } else {
      this.canvas.style.display = "none";
      this.stop();
    }
  }

  protected start(): void {
    if (!this.animationId && this.gl) {
      this.handleResize();
      this.startTime = performance.now();
      this.lastFrameTime = this.startTime;

      // Setup WebGL state
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.clearColor(0, 0, 0, 0);

      this.animationId = requestAnimationFrame(this.boundAnimate);
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

    // Clean up WebGL resources
    if (this.gl) {
      // Delete buffers
      this.buffers.forEach((buffer) => this.gl!.deleteBuffer(buffer));
      this.buffers.clear();

      // Delete textures
      this.textures.forEach((texture) => this.gl!.deleteTexture(texture));
      this.textures.clear();

      // Delete framebuffers
      this.framebuffers.forEach((framebuffer) => this.gl!.deleteFramebuffer(framebuffer));
      this.framebuffers.clear();

      // Delete program
      if (this.program) {
        this.gl.deleteProgram(this.program);
        this.program = null;
      }
    }

    // Clean up observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    // Remove event listeners using bound references
    window.removeEventListener("resize", this.boundHandleResize);
    document.removeEventListener("astro:before-preparation", this.boundCleanup);
    document.removeEventListener("astro:page-load", this.boundPageLoad);
  }

  protected checkPerformanceMode(): boolean {
    const performanceMode = document.body.getAttribute("data-performance") === "true";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return performanceMode || prefersReducedMotion;
  }

  // Helper method to get instanced arrays extension
  protected getInstancedArraysExt(): ANGLE_instanced_arrays | null {
    if (!this.gl) return null;
    return this.gl.getExtension("ANGLE_instanced_arrays");
  }

  // Helper for creating particle instance data
  protected createInstanceBuffer(name: string, data: Float32Array): WebGLBuffer | null {
    return this.createBuffer(name, data, this.gl?.ARRAY_BUFFER);
  }

  // Helper for updating buffer data dynamically
  protected updateBuffer(name: string, data: Float32Array | Uint16Array, target?: number): void {
    if (!this.gl) return;

    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const bufferTarget = target || this.gl.ARRAY_BUFFER;
    this.gl.bindBuffer(bufferTarget, buffer);

    // Check if buffer needs to be resized
    const currentSize = this.gl.getBufferParameter(bufferTarget, this.gl.BUFFER_SIZE);
    if (currentSize !== data.byteLength) {
      // Recreate buffer with new size
      this.gl.bufferData(bufferTarget, data, this.gl.DYNAMIC_DRAW);
    } else {
      // Update existing buffer
      this.gl.bufferSubData(bufferTarget, 0, data);
    }
  }
}
