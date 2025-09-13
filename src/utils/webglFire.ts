import { WebGLEffect, type ShaderSource } from "./webglEffect";

// Fire color palette
const FIRE_PALETTE = [
  [7, 7, 7],
  [31, 7, 7],
  [47, 15, 7],
  [71, 15, 7],
  [87, 23, 7],
  [103, 31, 7],
  [119, 31, 7],
  [143, 39, 7],
  [159, 47, 7],
  [175, 63, 7],
  [191, 71, 7],
  [199, 71, 7],
  [223, 79, 7],
  [223, 87, 7],
  [223, 87, 7],
  [215, 95, 7],
  [215, 95, 7],
  [215, 103, 15],
  [207, 111, 15],
  [207, 119, 15],
  [207, 127, 15],
  [207, 135, 23],
  [199, 135, 23],
  [199, 143, 23],
  [199, 151, 31],
  [191, 159, 31],
  [191, 159, 31],
  [191, 167, 39],
  [191, 167, 39],
  [191, 175, 47],
  [183, 175, 47],
  [183, 183, 47],
  [183, 183, 55],
  [207, 207, 111],
  [223, 223, 159],
  [239, 239, 199],
  [255, 255, 255],
];

export class WebGLDoomFire extends WebGLEffect {
  private fireWidth: number = 160; // Reduced from 320 for more pixelated look
  private fireHeight: number = 100; // Reduced from 200 for more pixelated look
  private fireTexture: WebGLTexture | null = null;
  private paletteTexture: WebGLTexture | null = null;
  private fireData: Uint8Array | null = null;

  // Frame buffers for ping-pong rendering
  private framebuffer1: WebGLFramebuffer | null = null;
  private framebuffer2: WebGLFramebuffer | null = null;
  private texture1: WebGLTexture | null = null;
  private texture2: WebGLTexture | null = null;

  constructor() {
    super({
      canvasId: "doom-fire-canvas",
      targetFPS: 24, // Film-standard 24fps for cinematic fire flickering
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "doom-red";
  }

  protected getShaders(): ShaderSource {
    const vertex = `
      attribute vec2 a_position;
      
      varying vec2 v_texCoord;
      
      void main() {
        // Map position to bottom 80% of viewport
        // Flip Y and scale: fire starts from bottom and goes up 80%
        vec2 adjustedPos = a_position;
        // Flip Y coordinate so fire starts from bottom, then scale to 80% height
        adjustedPos.y = (1.0 - a_position.y) * 0.8;
        
        // Convert to clip space (-1 to 1)
        gl_Position = vec4(adjustedPos.x * 2.0 - 1.0, adjustedPos.y * 2.0 - 1.0, 0.0, 1.0);
        v_texCoord = a_position;
      }
    `;

    const fragment = `
      precision mediump float;
      
      uniform sampler2D u_fireTexture;
      uniform sampler2D u_paletteTexture;
      uniform vec2 u_resolution;
      uniform float u_time;
      
      varying vec2 v_texCoord;
      
      // Random function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 uv = v_texCoord;
        
        // Height-based fadeout for top edge
        float heightFade = 1.0 - smoothstep(0.7, 1.0, uv.y);
        
        // Fire propagation simulation
        float fireValue = 0.0;
        
        if (uv.y > 0.98) {
          // Bottom row - fire source
          fireValue = 1.0;
        } else {
          // Sample from below for fire propagation
          vec2 samplePos = uv;
          samplePos.y += 1.0 / u_resolution.y * 2.0;
          
          // Add wind effect
          float wind = sin(u_time * 3.0 + uv.y * 10.0) * 0.002;
          samplePos.x += wind;
          
          // Sample fire value from below
          vec4 belowFire = texture2D(u_fireTexture, samplePos);
          fireValue = belowFire.r;
          
          // Random decay with height influence
          float decay = random(uv + u_time * 0.01) * 0.02;
          decay += (1.0 - heightFade) * 0.05; // More decay as we approach the top
          fireValue = max(0.0, fireValue - decay);
          
          // Spread horizontally
          float spread = (random(uv + u_time * 0.02) - 0.5) * 0.01;
          vec2 spreadPos = uv + vec2(spread, 1.0 / u_resolution.y);
          vec4 spreadFire = texture2D(u_fireTexture, spreadPos);
          fireValue = mix(fireValue, spreadFire.r, 0.3);
        }
        
        // Apply height fade
        fireValue *= heightFade;
        
        // Map fire intensity to palette with discrete steps for pixelation
        float paletteIndex = floor(fireValue * 36.0) / 37.0; // Discrete palette steps
        vec4 fireColor = texture2D(u_paletteTexture, vec2(paletteIndex, 0.5));
        
        // No smooth glow - keep it pixelated
        if (fireValue > 0.7) {
          fireColor.rgb *= 1.2; // Simple brightness boost
        }
        
        // Output with alpha based on intensity
        float finalAlpha = fireValue > 0.05 ? 0.9 * heightFade : 0.0;
        gl_FragColor = vec4(fireColor.rgb, finalAlpha);
      }
    `;

    return { vertex, fragment };
  }

  protected setupGeometry(): void {
    if (!this.gl || !this.program) return;

    // Create fullscreen quad
    const quadVertices = new Float32Array([
      0,
      0, // Bottom left
      1,
      0, // Bottom right
      0,
      1, // Top left
      1,
      1, // Top right
    ]);

    this.createBuffer("quad", quadVertices);

    // Create palette texture
    this.createPaletteTexture();

    // Create fire data texture
    this.initializeFireTexture();

    // Setup ping-pong framebuffers for fire simulation
    this.setupFramebuffers();
  }

  private createPaletteTexture(): void {
    if (!this.gl) return;

    // Convert palette to texture data
    const paletteData = new Uint8Array(FIRE_PALETTE.length * 4);

    for (let i = 0; i < FIRE_PALETTE.length; i++) {
      const color = FIRE_PALETTE[i];
      paletteData[i * 4] = color[0]; // R
      paletteData[i * 4 + 1] = color[1]; // G
      paletteData[i * 4 + 2] = color[2]; // B
      paletteData[i * 4 + 3] = 255; // A
    }

    this.paletteTexture = this.gl.createTexture();
    if (!this.paletteTexture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      FIRE_PALETTE.length,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      paletteData
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    this.textures.set("palette", this.paletteTexture);
  }

  private initializeFireTexture(): void {
    if (!this.gl) return;

    // Initialize fire data
    this.fireData = new Uint8Array(this.fireWidth * this.fireHeight * 4);

    // Set bottom row to maximum intensity
    for (let x = 0; x < this.fireWidth; x++) {
      const index = ((this.fireHeight - 1) * this.fireWidth + x) * 4;
      this.fireData[index] = 255; // R (intensity)
      this.fireData[index + 1] = 0; // G
      this.fireData[index + 2] = 0; // B
      this.fireData[index + 3] = 255; // A
    }

    this.fireTexture = this.gl.createTexture();
    if (!this.fireTexture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.fireTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.fireWidth,
      this.fireHeight,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.fireData
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    this.textures.set("fire", this.fireTexture);
  }

  private createPixelatedTexture(name: string, width: number, height: number): WebGLTexture | null {
    if (!this.gl) return null;

    const texture = this.gl.createTexture();
    if (!texture) return null;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );

    // Use NEAREST filtering for pixelated effect
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    this.textures.set(name, texture);
    return texture;
  }

  private setupFramebuffers(): void {
    if (!this.gl) return;

    // Create textures for framebuffers with pixelated filtering
    this.texture1 = this.createPixelatedTexture("fb_texture1", this.fireWidth, this.fireHeight);
    this.texture2 = this.createPixelatedTexture("fb_texture2", this.fireWidth, this.fireHeight);

    // Create framebuffer 1
    this.framebuffer1 = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer1);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.texture1,
      0
    );

    // Create framebuffer 2
    this.framebuffer2 = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer2);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.texture2,
      0
    );

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  private updateFire(_time: number): void {
    if (!this.gl || !this.fireData) return;

    // Update fire propagation on CPU (for initial implementation)
    // Could be moved entirely to GPU with render-to-texture

    for (let x = 0; x < this.fireWidth; x++) {
      for (let y = 0; y < this.fireHeight - 1; y++) {
        const src = ((y + 1) * this.fireWidth + x) * 4;

        // Get fire intensity from below
        let intensity = this.fireData[src];

        // Random decay
        const decay = Math.floor(Math.random() * 3);
        intensity = Math.max(0, intensity - decay);

        // Random spread
        const spread = Math.floor(Math.random() * 3) - 1;
        const spreadX = Math.max(0, Math.min(this.fireWidth - 1, x + spread));
        const spreadDst = (y * this.fireWidth + spreadX) * 4;

        this.fireData[spreadDst] = intensity;
        this.fireData[spreadDst + 1] = 0;
        this.fireData[spreadDst + 2] = 0;
        this.fireData[spreadDst + 3] = 255;
      }
    }

    // Keep bottom row hot
    for (let x = 0; x < this.fireWidth; x++) {
      const index = ((this.fireHeight - 1) * this.fireWidth + x) * 4;
      this.fireData[index] = 255;
    }

    // Update texture
    if (this.fireTexture) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.fireTexture);
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        0,
        0,
        this.fireWidth,
        this.fireHeight,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.fireData
      );
    }
  }

  protected draw(time: number): void {
    if (!this.gl || !this.program) return;

    // Update fire simulation
    this.updateFire(time);

    // Bind quad geometry
    const quadBuffer = this.buffers.get("quad");
    if (quadBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
      this.gl.enableVertexAttribArray(this.positionAttribute);
      this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Bind fire texture
    if (this.fireTexture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.fireTexture);
      const fireLocation = this.gl.getUniformLocation(this.program, "u_fireTexture");
      this.gl.uniform1i(fireLocation, 0);
    }

    // Bind palette texture
    if (this.paletteTexture) {
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
      const paletteLocation = this.gl.getUniformLocation(this.program, "u_paletteTexture");
      this.gl.uniform1i(paletteLocation, 1);
    }

    // Draw fullscreen quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  protected handleResize(): void {
    super.handleResize();
    // Fire dimensions can stay constant for performance
  }
}
