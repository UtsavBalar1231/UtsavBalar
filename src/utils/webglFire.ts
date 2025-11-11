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
  private fireWidth: number = 80; // 80x50 grid for GPU simulation
  private fireHeight: number = 50;
  private paletteTexture: WebGLTexture | null = null;
  private initialFireData: Uint8Array | null = null;

  // Frame buffers for ping-pong rendering
  private framebuffer1: WebGLFramebuffer | null = null;
  private framebuffer2: WebGLFramebuffer | null = null;
  private texture1: WebGLTexture | null = null;
  private texture2: WebGLTexture | null = null;

  private simulationProgram: WebGLProgram | null = null;
  private simulationUniforms: {
    prevState?: WebGLUniformLocation | null;
    resolution?: WebGLUniformLocation | null;
    time?: WebGLUniformLocation | null;
  } = {};

  private currentTexture: 0 | 1 = 0; // 0 = texture1, 1 = texture2

  constructor() {
    super({
      canvasId: "doom-fire-canvas",
      targetFPS: 24, // 24fps matches target framerate for other WebGL effects
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });

    this.useUBO = true;
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "doom-red";
  }

  protected getShaders(): ShaderSource {
    // These are the RENDER shaders (display fire with palette)
    const vertex = `#version 300 es
precision mediump float;
in vec2 a_position;

layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};

out vec2 v_texCoord;

void main() {
  // Flip Y: fire starts from bottom and goes to top
  vec2 adjustedPos = a_position;
  adjustedPos.y = (1.0 - a_position.y);

  gl_Position = vec4(adjustedPos.x * 2.0 - 1.0, adjustedPos.y * 2.0 - 1.0, 0.0, 1.0);
  v_texCoord = a_position;
}
`;

    const fragment = `#version 300 es
precision mediump float;

layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};

uniform sampler2D u_fireTexture;
uniform sampler2D u_paletteTexture;

in vec2 v_texCoord;
out vec4 fragColor;

void main() {
  vec2 uv = v_texCoord;

  float fireValue = texture(u_fireTexture, uv).r;

  // Height-based fadeout for top edge (subtle fade at very top)
  float heightFade = 1.0 - smoothstep(0.85, 1.0, uv.y);
  fireValue *= heightFade;

  // Map fire intensity to palette with discrete steps for pixelation
  float paletteIndex = floor(fireValue * 36.0) / 37.0;
  vec4 fireColor = texture(u_paletteTexture, vec2(paletteIndex, 0.5));

  // No smooth glow - keep it pixelated
  if (fireValue > 0.7) {
    fireColor.rgb *= 1.2;
  }

  float finalAlpha = fireValue > 0.05 ? 0.9 * heightFade : 0.0;
  fragColor = vec4(fireColor.rgb, finalAlpha);
}
`;

    return { vertex, fragment };
  }

  protected setupGeometry(): void {
    if (!this.gl || !this.program) return;

    const quadVertices = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    this.createBuffer("quad", quadVertices);

    this.createPaletteTexture();
    this.initializeFireTexture();

    // Ping-pong buffers avoid GPU→CPU read-back
    this.setupFramebuffers();

    this.setupSimulationShader();
  }

  private setupSimulationShader(): void {
    if (!this.gl) return;

    const simVertex = `#version 300 es
precision mediump float;
in vec2 a_position;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position * 2.0 - 1.0, 0.0, 1.0);
  v_texCoord = a_position;
}
`;

    // Note: This shader uses manual uniforms instead of UBO because it needs
    // different resolution (fireWidth/fireHeight) than main program (canvas dimensions)
    const simFragment = `#version 300 es
precision mediump float;

uniform sampler2D u_prevState;
uniform vec2 u_resolution;
uniform float u_time;

in vec2 v_texCoord;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = v_texCoord;
  vec2 pixelSize = 1.0 / u_resolution;

  float fireValue = 0.0;

  // Bottom row is always hot (fire source)
  if (uv.y > 1.0 - pixelSize.y * 1.5) {
    fireValue = 1.0;
  } else {
    vec2 belowPos = uv + vec2(0.0, pixelSize.y * 2.0);

    float wind = sin(u_time * 3.0 + uv.y * 10.0) * pixelSize.x * 2.0;
    belowPos.x += wind;

    fireValue = texture(u_prevState, belowPos).r;

    float randSeed = hash(uv * u_resolution + u_time * 0.1);
    float decay = randSeed * 0.02;

    // Height-based decay (more decay at top)
    decay += (1.0 - uv.y) * 0.01;

    fireValue = max(0.0, fireValue - decay);

    float spreadRand = hash(uv * u_resolution * 2.0 + u_time * 0.2);
    float spread = (spreadRand - 0.5) * pixelSize.x;
    vec2 spreadPos = uv + vec2(spread, pixelSize.y);
    float spreadValue = texture(u_prevState, spreadPos).r;
    fireValue = mix(fireValue, spreadValue, 0.3);
  }

  fragColor = vec4(fireValue, 0.0, 0.0, 1.0);
}
`;

    const vs = this.compileShader(simVertex, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(simFragment, this.gl.FRAGMENT_SHADER);

    if (!vs || !fs) {
      console.error("Failed to compile simulation shaders");
      return;
    }

    this.simulationProgram = this.gl.createProgram();
    if (!this.simulationProgram) return;

    this.gl.attachShader(this.simulationProgram, vs);
    this.gl.attachShader(this.simulationProgram, fs);
    this.gl.linkProgram(this.simulationProgram);

    if (!this.gl.getProgramParameter(this.simulationProgram, this.gl.LINK_STATUS)) {
      console.error(
        "Simulation shader link failed:",
        this.gl.getProgramInfoLog(this.simulationProgram)
      );
      return;
    }

    // Note: Simulation shader can't use UBO because it needs different resolution
    // (fireWidth/fireHeight) than the main program (canvas.width/height)
    this.simulationUniforms.prevState = this.gl.getUniformLocation(
      this.simulationProgram,
      "u_prevState"
    );
    this.simulationUniforms.resolution = this.gl.getUniformLocation(
      this.simulationProgram,
      "u_resolution"
    );
    this.simulationUniforms.time = this.gl.getUniformLocation(this.simulationProgram, "u_time");

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
  }

  private createPaletteTexture(): void {
    if (!this.gl) return;

    const paletteData = new Uint8Array(FIRE_PALETTE.length * 4);

    for (let i = 0; i < FIRE_PALETTE.length; i++) {
      const color = FIRE_PALETTE[i];
      paletteData[i * 4] = color[0];
      paletteData[i * 4 + 1] = color[1];
      paletteData[i * 4 + 2] = color[2];
      paletteData[i * 4 + 3] = 255;
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

    // This will be uploaded to both framebuffer textures
    const fireData = new Uint8Array(this.fireWidth * this.fireHeight * 4);

    for (let x = 0; x < this.fireWidth; x++) {
      const bufferIndex = ((this.fireHeight - 1) * this.fireWidth + x) * 4;
      fireData[bufferIndex] = 255;
      fireData[bufferIndex + 1] = 0;
      fireData[bufferIndex + 2] = 0;
      fireData[bufferIndex + 3] = 255;
    }

    // Upload initial state to both ping-pong textures (will be created in setupFramebuffers)
    this.initialFireData = fireData;
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

    // NEAREST filtering for pixelated effect
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    this.textures.set(name, texture);
    return texture;
  }

  private setupFramebuffers(): void {
    if (!this.gl || !this.initialFireData) return;

    this.texture1 = this.createPixelatedTexture("fb_texture1", this.fireWidth, this.fireHeight);
    this.texture2 = this.createPixelatedTexture("fb_texture2", this.fireWidth, this.fireHeight);

    if (this.texture1) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.fireWidth,
        this.fireHeight,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.initialFireData
      );
    }

    if (this.texture2) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture2);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.fireWidth,
        this.fireHeight,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.initialFireData
      );
    }

    this.framebuffer1 = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer1);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.texture1,
      0
    );

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

    // Free initial fire data after upload (no longer needed)
    this.initialFireData = null;
  }

  protected draw(time: number): void {
    if (!this.gl || !this.program || !this.simulationProgram) return;
    if (!this.framebuffer1 || !this.framebuffer2 || !this.texture1 || !this.texture2) return;

    const quadBuffer = this.buffers.get("quad");
    if (!quadBuffer) return;

    const srcTexture = this.currentTexture === 0 ? this.texture2 : this.texture1;
    const dstFramebuffer = this.currentTexture === 0 ? this.framebuffer1 : this.framebuffer2;
    const dstTexture = this.currentTexture === 0 ? this.texture1 : this.texture2;

    // ===== PASS 1: SIMULATION (GPU fire propagation) =====
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, dstFramebuffer);
    this.gl.viewport(0, 0, this.fireWidth, this.fireHeight);

    this.gl.useProgram(this.simulationProgram);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, srcTexture);
    if (this.simulationUniforms.prevState) {
      this.gl.uniform1i(this.simulationUniforms.prevState, 0);
    }

    // Simulation uses fireWidth/fireHeight, not canvas dimensions
    // Can't use UBO here because simulation needs different resolution than display
    if (this.simulationUniforms.resolution) {
      this.gl.uniform2f(this.simulationUniforms.resolution, this.fireWidth, this.fireHeight);
    }
    if (this.simulationUniforms.time) {
      this.gl.uniform1f(this.simulationUniforms.time, time);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
    const simPosAttr = this.gl.getAttribLocation(this.simulationProgram, "a_position");
    if (simPosAttr >= 0) {
      this.gl.enableVertexAttribArray(simPosAttr);
      this.gl.vertexAttribPointer(simPosAttr, 2, this.gl.FLOAT, false, 0, 0);
    }

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    if (simPosAttr >= 0) {
      this.gl.disableVertexAttribArray(simPosAttr);
    }

    // ===== PASS 2: RENDER TO SCREEN (display with palette) =====
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.canvas!.width, this.canvas!.height);

    this.gl.useProgram(this.program);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, dstTexture);
    const fireLocation = this.getUniformLocation("u_fireTexture");
    if (fireLocation) this.gl.uniform1i(fireLocation, 0);

    if (this.paletteTexture) {
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
      const paletteLocation = this.getUniformLocation("u_paletteTexture");
      if (paletteLocation) this.gl.uniform1i(paletteLocation, 1);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
    this.gl.enableVertexAttribArray(this.positionAttribute);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.currentTexture = this.currentTexture === 0 ? 1 : 0;
  }

  protected handleResize(): void {
    super.handleResize();
    // Fire dimensions can stay constant for performance
  }
}
