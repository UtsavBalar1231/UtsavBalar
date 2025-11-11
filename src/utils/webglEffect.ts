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
  protected gl: WebGL2RenderingContext | null = null;
  protected program: WebGLProgram | null = null;
  protected animationId: number = 0;
  protected startTime: number = 0;
  protected config: WebGLEffectConfig;
  protected observers: MutationObserver[] = [];

  // Frame rate limiting
  protected frameInterval: number;
  protected lastFrameTime: number = 0;

  // Guard flags to prevent concurrent operations
  private isInitializing: boolean = false;
  private isDestroying: boolean = false;

  // Debounce timer for observer
  private observerDebounceTimer: number = 0;

  // Vertex Array Object (WebGL 2.0)
  protected vao: WebGLVertexArrayObject | null = null;

  // Uniform location caching
  protected uniformLocations: Map<string, WebGLUniformLocation> = new Map();

  // Attribute location caching
  protected attributeLocations: Map<string, number> = new Map();

  // Common uniforms (legacy - kept for compatibility with effects that don't use UBO yet)
  protected timeUniform: WebGLUniformLocation | null = null;
  protected resolutionUniform: WebGLUniformLocation | null = null;

  // Uniform Buffer Object (UBO) for common uniforms
  protected uniformBuffer: WebGLBuffer | null = null;
  protected uniformBufferData: Float32Array | null = null;
  protected useUBO: boolean = false; // Subclasses can opt-in to UBO

  // Common attributes
  protected positionAttribute: number = -1;

  // Buffers
  protected buffers: Map<string, WebGLBuffer> = new Map();
  protected textures: Map<string, WebGLTexture> = new Map();
  protected framebuffers: Map<string, WebGLFramebuffer> = new Map();

  // Texture unit management (Phase 6)
  private textureUnits: Map<number, WebGLTexture | null> = new Map();
  private textureToUnit: Map<WebGLTexture, number> = new Map();
  private maxTextureUnits: number = 16; // WebGL 2.0 minimum
  private nextFreeTextureUnit: number = 0;

  // State caching (Phase 6)
  private currentState: {
    vao: WebGLVertexArrayObject | null;
    framebuffer: WebGLFramebuffer | null;
    renderbuffer: WebGLRenderbuffer | null;
    viewport: { x: number; y: number; width: number; height: number } | null;
    blendEnabled: boolean;
    blendSrcFactor: number | null;
    blendDstFactor: number | null;
    depthTestEnabled: boolean;
    depthFunc: number | null;
    cullFaceEnabled: boolean;
    cullFace: number | null;
    program: WebGLProgram | null;
    activeTextureUnit: number;
  } = {
    vao: null,
    framebuffer: null,
    renderbuffer: null,
    viewport: null,
    blendEnabled: false,
    blendSrcFactor: null,
    blendDstFactor: null,
    depthTestEnabled: false,
    depthFunc: null,
    cullFaceEnabled: false,
    cullFace: null,
    program: null,
    activeTextureUnit: 0,
  };

  // sRGB color space support (Phase 6)
  protected srgbSupported: boolean = false;

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
    // Prevent concurrent initialization
    if (this.isInitializing || this.isDestroying) {
      return;
    }

    this.isInitializing = true;

    this.canvas = document.getElementById(this.config.canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      console.warn(`Canvas element with id "${this.config.canvasId}" not found`);
      this.isInitializing = false;
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

    this.gl = this.canvas.getContext("webgl2", contextOptions) as WebGL2RenderingContext | null;

    if (!this.gl) {
      this.isInitializing = false;
      throw new Error("WebGL 2.0 is required but not supported by your browser");
    }

    // Initialize texture unit management (Phase 6)
    this.initializeTextureUnits();

    // Detect sRGB support (Phase 6)
    // WebGL 2.0 has native sRGB support
    this.srgbSupported = true;

    if (!this.initializeShaders()) {
      console.error("Failed to initialize shaders");
      this.isInitializing = false;
      return;
    }

    this.setupGeometry();

    // Setup UBO if effect opts in
    if (this.useUBO) {
      this.setupUBO();
    }

    this.setupEventListeners();
    this.setupObservers();
    this.updateVisibility();

    this.isInitializing = false;
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

    this.timeUniform = this.getUniformLocation("u_time");
    this.resolutionUniform = this.getUniformLocation("u_resolution");

    this.positionAttribute = this.getAttributeLocation("a_position");

    return true;
  }

  // Helper method to get and cache uniform locations
  protected getUniformLocation(name: string): WebGLUniformLocation | null {
    if (!this.gl || !this.program) return null;

    if (this.uniformLocations.has(name)) {
      return this.uniformLocations.get(name)!;
    }

    const location = this.gl.getUniformLocation(this.program, name);
    if (location) {
      this.uniformLocations.set(name, location);
    }

    return location;
  }

  // Helper method to get and cache attribute locations
  protected getAttributeLocation(name: string): number {
    if (!this.gl || !this.program) return -1;

    if (this.attributeLocations.has(name)) {
      return this.attributeLocations.get(name)!;
    }

    const location = this.gl.getAttribLocation(this.program, name);
    this.attributeLocations.set(name, location);

    return location;
  }

  /**
   * Setup Uniform Buffer Object for common uniforms (u_time, u_resolution)
   * Uses std140 layout for efficient GPU memory access
   * Layout:
   *   vec2 u_resolution;  // offset 0, 8 bytes
   *   float u_time;        // offset 8, 4 bytes
   *   float _padding;      // offset 12, 4 bytes (std140 alignment)
   * Total: 16 bytes
   */
  protected setupUBO(): void {
    if (!this.gl || !this.program) return;

    this.uniformBuffer = this.gl.createBuffer();
    if (!this.uniformBuffer) {
      console.error("Failed to create uniform buffer");
      return;
    }

    // Allocate buffer data (16 bytes for std140 layout)
    this.uniformBufferData = new Float32Array(4); // 4 floats = 16 bytes

    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.uniformBuffer);
    this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.uniformBufferData, this.gl.DYNAMIC_DRAW);

    const blockIndex = this.gl.getUniformBlockIndex(this.program, "CommonUniforms");
    if (blockIndex === this.gl.INVALID_INDEX) {
      console.warn("CommonUniforms block not found in shader - ensure shader uses uniform block");
      return;
    }

    this.gl.uniformBlockBinding(this.program, blockIndex, 0);
    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, this.uniformBuffer);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }

  /**
   * Update UBO with current time and resolution
   * UBO batches uniforms into single GPU memory block (std140 layout)
   */
  protected updateUBO(time: number, width: number, height: number): void {
    if (!this.gl || !this.uniformBuffer || !this.uniformBufferData) return;

    // Update buffer data (std140 layout)
    this.uniformBufferData[0] = width; // u_resolution.x
    this.uniformBufferData[1] = height; // u_resolution.y
    this.uniformBufferData[2] = time; // u_time
    this.uniformBufferData[3] = 0; // padding

    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.uniformBuffer);
    this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this.uniformBufferData);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
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

    // Use new texture unit management (Phase 6)
    this.bindTextureToUnit(texture, 0);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

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

    const texture = this.createTexture(`${name}_texture`, width, height);
    if (!texture) return null;

    // Use new state caching (Phase 6)
    this.bindFramebuffer(framebuffer);
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

    this.bindFramebuffer(null);

    this.framebuffers.set(name, framebuffer);
    return framebuffer;
  }

  protected setupEventListeners(): void {
    window.addEventListener("resize", this.boundHandleResize);

    document.addEventListener("astro:before-preparation", this.boundCleanup);
    document.addEventListener("astro:page-load", this.boundPageLoad);
  }

  protected setupObservers(): void {
    // Debounced update visibility to prevent race conditions during rapid theme switches
    const debouncedUpdateVisibility = () => {
      if (this.observerDebounceTimer) {
        clearTimeout(this.observerDebounceTimer);
      }
      this.observerDebounceTimer = window.setTimeout(() => {
        this.updateVisibility();
        this.observerDebounceTimer = 0;
      }, 150);
    };

    const htmlObserver = new MutationObserver(debouncedUpdateVisibility);

    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [this.config.themeAttribute || "data-theme"],
    });

    this.observers.push(htmlObserver);

    if (this.config.performanceAttribute) {
      const bodyObserver = new MutationObserver(debouncedUpdateVisibility);

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
      // Use new state caching (Phase 6)
      this.setViewport(0, 0, displayWidth, displayHeight);
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

    const time = (currentTime - this.startTime) * 0.001;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use shader program with state caching (Phase 6)
    this.useProgram(this.program);

    // Set common uniforms (UBO or legacy individual uniforms)
    if (this.useUBO) {
      // Use UBO for common uniforms (more efficient)
      this.updateUBO(time, this.canvas!.width, this.canvas!.height);
    } else {
      // Legacy: individual uniform calls
      if (this.timeUniform) {
        this.gl.uniform1f(this.timeUniform, time);
      }

      if (this.resolutionUniform) {
        this.gl.uniform2f(this.resolutionUniform, this.canvas!.width, this.canvas!.height);
      }
    }

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

      // Setup WebGL state using new state caching (Phase 6)
      this.setBlendMode(true, this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
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
    // Prevent concurrent cleanup
    if (this.isDestroying) {
      return;
    }

    this.isDestroying = true;

    this.stop();

    if (this.observerDebounceTimer) {
      clearTimeout(this.observerDebounceTimer);
      this.observerDebounceTimer = 0;
    }

    // Clean up WebGL resources
    if (this.gl) {
      if (this.vao) {
        this.gl.deleteVertexArray(this.vao);
        this.vao = null;
      }

      if (this.uniformBuffer) {
        this.gl.deleteBuffer(this.uniformBuffer);
        this.uniformBuffer = null;
        this.uniformBufferData = null;
      }

      this.buffers.forEach((buffer) => this.gl!.deleteBuffer(buffer));
      this.buffers.clear();

      this.textures.forEach((texture) => this.gl!.deleteTexture(texture));
      this.textures.clear();

      this.framebuffers.forEach((framebuffer) => this.gl!.deleteFramebuffer(framebuffer));
      this.framebuffers.clear();

      if (this.program) {
        this.gl.deleteProgram(this.program);
        this.program = null;
      }

      this.uniformLocations.clear();
      this.attributeLocations.clear();

      this.clearStateCache();

      // Null out references to allow garbage collection
      // Note: We don't force context loss anymore - the browser will automatically
      // reclaim GPU resources when gl reference is nulled and GC runs. Forcing
      // context loss causes browser warnings and is unnecessary in modern WebGL.
      this.gl = null;
    }

    this.canvas = null;

    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    // Remove event listeners using bound references
    window.removeEventListener("resize", this.boundHandleResize);
    document.removeEventListener("astro:before-preparation", this.boundCleanup);
    document.removeEventListener("astro:page-load", this.boundPageLoad);

    this.isDestroying = false;
  }

  protected checkPerformanceMode(): boolean {
    const performanceMode = document.body.getAttribute("data-performance") === "true";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return performanceMode || prefersReducedMotion;
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
      this.gl.bufferData(bufferTarget, data, this.gl.DYNAMIC_DRAW);
    } else {
      this.gl.bufferSubData(bufferTarget, 0, data);
    }
  }

  // ============================================================================
  // PHASE 6: Texture Unit Management
  // ============================================================================

  /**
   * Initialize texture unit tracking
   * Queries WebGL for max texture units and initializes tracking maps
   */
  private initializeTextureUnits(): void {
    if (!this.gl) return;

    // Query actual max texture units (typically 16-32 in WebGL 2.0)
    this.maxTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);

    for (let i = 0; i < this.maxTextureUnits; i++) {
      this.textureUnits.set(i, null);
    }

    this.nextFreeTextureUnit = 0;
  }

  /**
   * Allocate a texture unit for a given texture
   * Returns the unit number or null if all units are in use
   *
   * @param texture - The texture to allocate a unit for
   * @returns The allocated unit number, or null if all units are in use
   */
  protected allocateTextureUnit(texture: WebGLTexture): number | null {
    if (!this.gl) return null;

    const existingUnit = this.textureToUnit.get(texture);
    if (existingUnit !== undefined) {
      return existingUnit;
    }

    for (let i = 0; i < this.maxTextureUnits; i++) {
      const unit = (this.nextFreeTextureUnit + i) % this.maxTextureUnits;
      if (this.textureUnits.get(unit) === null) {
        this.textureUnits.set(unit, texture);
        this.textureToUnit.set(texture, unit);
        this.nextFreeTextureUnit = (unit + 1) % this.maxTextureUnits;
        return unit;
      }
    }

    console.warn("All texture units are in use");
    return null;
  }

  /**
   * Free a texture unit
   *
   * @param unit - The unit number to free
   */
  protected freeTextureUnit(unit: number): void {
    if (unit < 0 || unit >= this.maxTextureUnits) return;

    const texture = this.textureUnits.get(unit);
    if (texture) {
      this.textureToUnit.delete(texture);
      this.textureUnits.set(unit, null);
    }
  }

  /**
   * Bind a texture to a specific unit with state caching
   * Only performs the bind if the texture is not already bound to that unit
   *
   * @param texture - The texture to bind
   * @param unit - The texture unit to bind to (0-based)
   */
  protected bindTextureToUnit(texture: WebGLTexture | null, unit: number): void {
    if (!this.gl) return;
    if (unit < 0 || unit >= this.maxTextureUnits) return;

    // Check if this texture is already bound to this unit
    const currentTexture = this.textureUnits.get(unit);
    if (currentTexture === texture && this.currentState.activeTextureUnit === unit) {
      // Already bound, skip redundant operation
      return;
    }

    // Activate texture unit if not already active
    if (this.currentState.activeTextureUnit !== unit) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.currentState.activeTextureUnit = unit;
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    if (texture) {
      this.textureUnits.set(unit, texture);
      this.textureToUnit.set(texture, unit);
    } else {
      const oldTexture = this.textureUnits.get(unit);
      if (oldTexture) {
        this.textureToUnit.delete(oldTexture);
      }
      this.textureUnits.set(unit, null);
    }
  }

  /**
   * Get the unit number a texture is currently bound to
   *
   * @param texture - The texture to look up
   * @returns The unit number, or null if not bound
   */
  protected getTextureUnit(texture: WebGLTexture): number | null {
    return this.textureToUnit.get(texture) ?? null;
  }

  /**
   * Bind a texture with automatic unit allocation
   * Allocates a unit if needed, then binds the texture
   *
   * @param texture - The texture to bind
   * @returns The unit number the texture was bound to, or null on failure
   */
  protected bindTexture(texture: WebGLTexture): number | null {
    const unit = this.allocateTextureUnit(texture);
    if (unit === null) return null;

    this.bindTextureToUnit(texture, unit);
    return unit;
  }

  // ============================================================================
  // PHASE 6: State Caching
  // ============================================================================

  /**
   * Clear all cached state
   * Call this when context is lost or on major state changes
   */
  private clearStateCache(): void {
    this.currentState.vao = null;
    this.currentState.framebuffer = null;
    this.currentState.renderbuffer = null;
    this.currentState.viewport = null;
    this.currentState.blendEnabled = false;
    this.currentState.blendSrcFactor = null;
    this.currentState.blendDstFactor = null;
    this.currentState.depthTestEnabled = false;
    this.currentState.depthFunc = null;
    this.currentState.cullFaceEnabled = false;
    this.currentState.cullFace = null;
    this.currentState.program = null;
    this.currentState.activeTextureUnit = 0;

    this.textureUnits.clear();
    this.textureToUnit.clear();
    this.nextFreeTextureUnit = 0;
    if (this.gl) {
      this.initializeTextureUnits();
    }
  }

  /**
   * Bind a VAO with state caching
   * Only performs the bind if the VAO is different from the currently bound one
   *
   * @param vao - The VAO to bind, or null to unbind
   */
  protected bindVAO(vao: WebGLVertexArrayObject | null): void {
    if (!this.gl) return;

    if (this.currentState.vao === vao) {
      return;
    }

    this.gl.bindVertexArray(vao);
    this.currentState.vao = vao;
  }

  /**
   * Bind a framebuffer with state caching
   * Only performs the bind if the framebuffer is different from the currently bound one
   *
   * @param framebuffer - The framebuffer to bind, or null for default framebuffer
   */
  protected bindFramebuffer(framebuffer: WebGLFramebuffer | null): void {
    if (!this.gl) return;

    if (this.currentState.framebuffer === framebuffer) {
      return;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.currentState.framebuffer = framebuffer;
  }

  /**
   * Bind a renderbuffer with state caching
   * Only performs the bind if the renderbuffer is different from the currently bound one
   *
   * @param renderbuffer - The renderbuffer to bind, or null to unbind
   */
  protected bindRenderbuffer(renderbuffer: WebGLRenderbuffer | null): void {
    if (!this.gl) return;

    if (this.currentState.renderbuffer === renderbuffer) {
      return;
    }

    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
    this.currentState.renderbuffer = renderbuffer;
  }

  /**
   * Set blend mode with state caching
   * Only changes blend state if different from current state
   *
   * @param enabled - Whether blending should be enabled
   * @param srcFactor - Source blend factor (default: SRC_ALPHA)
   * @param dstFactor - Destination blend factor (default: ONE_MINUS_SRC_ALPHA)
   */
  protected setBlendMode(enabled: boolean, srcFactor?: number, dstFactor?: number): void {
    if (!this.gl) return;

    const src = srcFactor ?? this.gl.SRC_ALPHA;
    const dst = dstFactor ?? this.gl.ONE_MINUS_SRC_ALPHA;

    if (this.currentState.blendEnabled !== enabled) {
      if (enabled) {
        this.gl.enable(this.gl.BLEND);
      } else {
        this.gl.disable(this.gl.BLEND);
      }
      this.currentState.blendEnabled = enabled;
    }

    if (
      enabled &&
      (this.currentState.blendSrcFactor !== src || this.currentState.blendDstFactor !== dst)
    ) {
      this.gl.blendFunc(src, dst);
      this.currentState.blendSrcFactor = src;
      this.currentState.blendDstFactor = dst;
    }
  }

  /**
   * Set depth test state with state caching
   * Only changes depth test if different from current state
   *
   * @param enabled - Whether depth testing should be enabled
   * @param func - Depth comparison function (default: LESS)
   */
  protected setDepthTest(enabled: boolean, func?: number): void {
    if (!this.gl) return;

    const depthFunc = func ?? this.gl.LESS;

    if (this.currentState.depthTestEnabled !== enabled) {
      if (enabled) {
        this.gl.enable(this.gl.DEPTH_TEST);
      } else {
        this.gl.disable(this.gl.DEPTH_TEST);
      }
      this.currentState.depthTestEnabled = enabled;
    }

    if (enabled && this.currentState.depthFunc !== depthFunc) {
      this.gl.depthFunc(depthFunc);
      this.currentState.depthFunc = depthFunc;
    }
  }

  /**
   * Set cull face state with state caching
   * Only changes cull face if different from current state
   *
   * @param enabled - Whether face culling should be enabled
   * @param face - Which face to cull (default: BACK)
   */
  protected setCullFace(enabled: boolean, face?: number): void {
    if (!this.gl) return;

    const cullFace = face ?? this.gl.BACK;

    if (this.currentState.cullFaceEnabled !== enabled) {
      if (enabled) {
        this.gl.enable(this.gl.CULL_FACE);
      } else {
        this.gl.disable(this.gl.CULL_FACE);
      }
      this.currentState.cullFaceEnabled = enabled;
    }

    if (enabled && this.currentState.cullFace !== cullFace) {
      this.gl.cullFace(cullFace);
      this.currentState.cullFace = cullFace;
    }
  }

  /**
   * Set viewport with state caching
   * Only changes viewport if different from current viewport
   *
   * @param x - X coordinate of viewport origin
   * @param y - Y coordinate of viewport origin
   * @param width - Viewport width
   * @param height - Viewport height
   */
  protected setViewport(x: number, y: number, width: number, height: number): void {
    if (!this.gl) return;

    const current = this.currentState.viewport;
    if (
      current &&
      current.x === x &&
      current.y === y &&
      current.width === width &&
      current.height === height
    ) {
      return;
    }

    this.gl.viewport(x, y, width, height);
    this.currentState.viewport = { x, y, width, height };
  }

  /**
   * Use shader program with state caching
   * Only calls useProgram if different from current program
   *
   * @param program - The shader program to use
   */
  protected useProgram(program: WebGLProgram | null): void {
    if (!this.gl) return;

    if (this.currentState.program === program) {
      return;
    }

    this.gl.useProgram(program);
    this.currentState.program = program;
  }

  // ============================================================================
  // PHASE 6: sRGB Color Space Support
  // ============================================================================

  /**
   * Create an sRGB texture
   * sRGB textures store colors in gamma-corrected space
   * WebGL 2.0 has native sRGB support via SRGB8_ALPHA8 internal format
   *
   * Use this for:
   * - Textures that store color data (not data textures)
   * - Framebuffer attachments that need gamma correction
   *
   * Workflow:
   * 1. Create sRGB texture/framebuffer
   * 2. Render to it in linear space (shader outputs linear colors)
   * 3. WebGL automatically converts to sRGB on write
   * 4. WebGL automatically converts to linear on read (when sampling in shader)
   *
   * @param name - Name to store texture under
   * @param width - Texture width
   * @param height - Texture height
   * @param data - Optional initial data (assumed to be in sRGB space)
   * @returns The created texture or null on failure
   */
  protected createSRGBTexture(
    name: string,
    width: number,
    height: number,
    data?: Uint8Array | null
  ): WebGLTexture | null {
    if (!this.gl) return null;

    if (!this.srgbSupported) {
      console.warn("sRGB textures not supported, falling back to RGBA");
      return this.createTexture(name, width, height, data);
    }

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.bindTextureToUnit(texture, 0);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Upload texture data with sRGB internal format
    // SRGB8_ALPHA8: 8-bit sRGB with 8-bit alpha
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.SRGB8_ALPHA8,
      width,
      height,
      0,
      this.gl.RGBA, // Format (data is provided as RGBA)
      this.gl.UNSIGNED_BYTE,
      data || null
    );

    this.textures.set(name, texture);
    return texture;
  }

  /**
   * Create a framebuffer with sRGB color attachment
   * Useful for post-processing pipelines that need gamma-correct rendering
   *
   * @param name - Name to store framebuffer under
   * @param width - Framebuffer width
   * @param height - Framebuffer height
   * @returns The created framebuffer or null on failure
   */
  protected createSRGBFramebuffer(
    name: string,
    width: number,
    height: number
  ): WebGLFramebuffer | null {
    if (!this.gl) return null;

    if (!this.srgbSupported) {
      console.warn("sRGB framebuffers not supported, falling back to RGBA");
      return this.createFramebuffer(name, width, height);
    }

    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) return null;

    const texture = this.createSRGBTexture(`${name}_texture`, width, height);
    if (!texture) return null;

    this.bindFramebuffer(framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error("sRGB framebuffer not complete");
      return null;
    }

    this.bindFramebuffer(null);

    this.framebuffers.set(name, framebuffer);
    return framebuffer;
  }

  /**
   * Helper to convert linear color to sRGB (for shader use)
   * Returns GLSL code for the conversion function
   *
   * Usage in fragment shader:
   * ```glsl
   * vec3 linearColor = vec3(1.0, 0.5, 0.0);
   * vec3 srgbColor = linearToSRGB(linearColor);
   * gl_FragColor = vec4(srgbColor, 1.0);
   * ```
   */
  protected getLinearToSRGBShaderCode(): string {
    return `
vec3 linearToSRGB(vec3 linear) {
  vec3 sRGB;
  for (int i = 0; i < 3; i++) {
    if (linear[i] <= 0.0031308) {
      sRGB[i] = linear[i] * 12.92;
    } else {
      sRGB[i] = 1.055 * pow(linear[i], 1.0 / 2.4) - 0.055;
    }
  }
  return sRGB;
}
`;
  }

  /**
   * Helper to convert sRGB color to linear (for shader use)
   * Returns GLSL code for the conversion function
   *
   * Usage in fragment shader:
   * ```glsl
   * vec3 srgbColor = texture2D(u_texture, v_uv).rgb;
   * vec3 linearColor = sRGBToLinear(srgbColor);
   * // Perform calculations in linear space
   * ```
   */
  protected getSRGBToLinearShaderCode(): string {
    return `
vec3 sRGBToLinear(vec3 sRGB) {
  vec3 linear;
  for (int i = 0; i < 3; i++) {
    if (sRGB[i] <= 0.04045) {
      linear[i] = sRGB[i] / 12.92;
    } else {
      linear[i] = pow((sRGB[i] + 0.055) / 1.055, 2.4);
    }
  }
  return linear;
}
`;
  }
}
