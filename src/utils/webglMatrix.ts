import { WebGLEffect, type ShaderSource } from "./webglEffect";

const MATRIX_CHARS = "01ABCDEF!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789";
const CHAR_ARRAY = MATRIX_CHARS.split("");

interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: number[]; // Character indices
  brightness: number;
}

export class WebGLMatrixRain extends WebGLEffect {
  private columns: MatrixColumn[] = [];
  private columnCount: number = 0;
  private charSize: number = 20; // Increased from 14px for better visibility
  private maxDropLength: number = 20;

  // Particle data for instanced rendering
  private particleData: Float32Array | null = null;
  private particlesPerColumn: number = 30;
  private totalParticles: number = 0;

  // Transform Feedback ping-pong buffers
  private tfBufferA: WebGLBuffer | null = null;
  private tfBufferB: WebGLBuffer | null = null;
  private currentReadBuffer: WebGLBuffer | null = null;
  private currentWriteBuffer: WebGLBuffer | null = null;

  // Separate programs for update (TF) and render
  private updateProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;

  // Attribute locations
  private instancePositionAttribute: number = -1;
  private instanceBrightnessAttribute: number = -1;

  constructor() {
    super({
      canvasId: "matrix-rain-canvas",
      targetFPS: 24, // 24fps matches other WebGL effect framerates
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });

    // Enable UBO for common uniforms
    this.useUBO = true;
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "green-phosphor";
  }

  /**
   * Create Transform Feedback update program for Matrix Rain
   * Handles column falling, character randomization, and brightness calculation
   */
  private createUpdateProgram(): void {
    if (!this.gl) return;

    // Particle data: 8 floats per particle (32 bytes)
    // - vec2 position (x, y screen position)
    // - vec2 display (charIndex, brightness)
    // - vec4 column (columnY, speed, length, particleIndexInColumn)
    const updateVertex = `#version 300 es
precision mediump float;

// Input: current particle state
in vec2 in_position;      // x, y
in vec2 in_display;       // charIndex, brightness
in vec4 in_column;        // columnY, speed, length, particleIndex

// Common uniforms via UBO
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;
  float u_time;
  float _padding;
};

uniform float u_charSize;
uniform float u_charCount;

// Output: updated particle state (Transform Feedback)
out vec2 out_position;
out vec2 out_display;
out vec4 out_column;

// Hash function for pseudo-random numbers
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  float columnY = in_column.x;
  float speed = in_column.y;
  float length = in_column.z;
  float particleIndex = in_column.w;

  // Update column Y position
  float newColumnY = columnY + speed * u_charSize;

  // Check if column is off screen (with extra margin for full length)
  float offScreenThreshold = u_resolution.y + length * u_charSize;

  // Reset column if off screen
  if (newColumnY > offScreenThreshold) {
    // Reset to top with random offset
    float resetSeed = u_time + in_position.x;
    newColumnY = -length * u_charSize - hash(resetSeed) * 100.0;

    // Randomize all characters in this column when it resets
    float newCharIndex = floor(hash(resetSeed + particleIndex * 17.3) * u_charCount);
    out_display = vec2(newCharIndex, in_display.y);
  } else {
    // Occasionally randomize character (1% chance per frame)
    float randomSeed = u_time * 60.0 + float(gl_VertexID) * 0.123;
    float shouldRandomize = step(0.99, hash(randomSeed));

    float newCharIndex = mix(
      in_display.x,
      floor(hash(randomSeed + 7.89) * u_charCount),
      shouldRandomize
    );

    out_display = vec2(newCharIndex, in_display.y);
  }

  float particleY = newColumnY + particleIndex * u_charSize;

  // Calculate brightness (fade from head to tail)
  float brightness = particleIndex == 0.0 ? 1.0 : max(0.0, 1.0 - particleIndex / length);

  out_position = vec2(in_position.x, particleY);
  out_display.y = brightness;
  out_column = vec4(newColumnY, speed, length, particleIndex);
}
`;

    const updateFragment = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0);  // Never rendered
}
`;

    const vs = this.compileShader(updateVertex, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(updateFragment, this.gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      console.error("Failed to create Matrix Rain update shaders");
      return;
    }

    this.updateProgram = this.gl.createProgram();
    if (!this.updateProgram) {
      console.error("Failed to create Matrix Rain update program");
      return;
    }

    this.gl.attachShader(this.updateProgram, vs);
    this.gl.attachShader(this.updateProgram, fs);

    this.gl.transformFeedbackVaryings(
      this.updateProgram,
      ["out_position", "out_display", "out_column"],
      this.gl.INTERLEAVED_ATTRIBS
    );

    this.gl.linkProgram(this.updateProgram);

    if (!this.gl.getProgramParameter(this.updateProgram, this.gl.LINK_STATUS)) {
      console.error(
        "Matrix Rain update program link error:",
        this.gl.getProgramInfoLog(this.updateProgram)
      );
      this.gl.deleteProgram(this.updateProgram);
      this.updateProgram = null;
      return;
    }

    const blockIndex = this.gl.getUniformBlockIndex(this.updateProgram, "CommonUniforms");
    if (blockIndex !== this.gl.INVALID_INDEX) {
      this.gl.uniformBlockBinding(this.updateProgram, blockIndex, 0);
    }

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
  }

  protected getShaders(): ShaderSource {
    const vertex = `#version 300 es
precision mediump float;

in vec2 a_position;
in vec3 a_instancePosition; // x, y, charIndex
in float a_instanceBrightness;

// Common uniforms via UBO (std140 layout)
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};

uniform float u_charSize;

out float v_brightness;
out float v_charIndex;
out vec2 v_texCoord;

void main() {
  vec2 position = a_position * u_charSize + a_instancePosition.xy;
  vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);

  gl_Position = vec4(clipSpace, 0.0, 1.0);

  v_brightness = a_instanceBrightness;
  v_charIndex = a_instancePosition.z;
  v_texCoord = a_position + 0.5; // Convert from -0.5,0.5 to 0,1
}
`;

    const fragment = `#version 300 es
precision mediump float;

// Common uniforms via UBO (std140 layout)
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};

uniform sampler2D u_charTexture;
uniform float u_charCount;

in float v_brightness;
in float v_charIndex;
in vec2 v_texCoord;

out vec4 fragColor;

void main() {
  float charOffset = v_charIndex / u_charCount;
  vec2 texCoord = vec2(v_texCoord.x / u_charCount + charOffset, v_texCoord.y);

  vec4 charColor = texture(u_charTexture, texCoord);

  float green = 100.0 + v_brightness * 155.0;
  vec3 color = vec3(0.0, green / 255.0, 0.0);

  float alpha = charColor.a * v_brightness;

  // Add slight glow for bright characters
  if (v_brightness > 0.8) {
    alpha *= 1.2;
  }

  fragColor = vec4(color * charColor.rgb, alpha);
}
`;

    return { vertex, fragment };
  }

  protected setupGeometry(): void {
    if (!this.gl || !this.program) return;

    const quadVertices = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);

    this.createBuffer("quad", quadVertices);

    this.createCharacterTexture();

    this.instancePositionAttribute = this.getAttributeLocation("a_instancePosition");
    this.instanceBrightnessAttribute = this.getAttributeLocation("a_instanceBrightness");

    this.createUpdateProgram();

    this.initializeColumns();
  }

  private createCharacterTexture(): void {
    if (!this.gl) return;

    const charCanvas = document.createElement("canvas");
    const charCtx = charCanvas.getContext("2d");
    if (!charCtx) return;

    const charWidth = 32;
    const charHeight = 32;
    charCanvas.width = charWidth * CHAR_ARRAY.length;
    charCanvas.height = charHeight;

    // Increased size for better visibility
    charCtx.font = '28px "DepartureMono Nerd Font", monospace';
    charCtx.textAlign = "center";
    charCtx.textBaseline = "middle";
    charCtx.fillStyle = "white";

    CHAR_ARRAY.forEach((char, charIndex) => {
      const x = charIndex * charWidth + charWidth / 2;
      const y = charHeight / 2;
      charCtx.fillText(char, x, y);
    });

    const texture = this.gl.createTexture();
    if (!texture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      charCanvas
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.textures.set("characters", texture);
  }

  private initializeColumns(): void {
    if (!this.canvas || !this.gl) return;

    this.columnCount = Math.floor(this.canvas.width / this.charSize);
    this.columns = [];

    this.totalParticles = this.columnCount * this.particlesPerColumn;

    // Allocate particle data buffer for Transform Feedback
    // 8 floats per particle (32 bytes):
    // - vec2 position (x, y)
    // - vec2 display (charIndex, brightness)
    // - vec4 column (columnY, speed, length, particleIndexInColumn)
    this.particleData = new Float32Array(this.totalParticles * 8);

    let particleIndex = 0;

    for (let colIndex = 0; colIndex < this.columnCount; colIndex++) {
      const column: MatrixColumn = {
        x: colIndex * this.charSize,
        y: Math.random() * -this.canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        length: Math.floor(Math.random() * this.maxDropLength) + 10,
        chars: [],
        brightness: 1.0,
      };

      for (let charIdx = 0; charIdx < column.length; charIdx++) {
        column.chars.push(Math.floor(Math.random() * CHAR_ARRAY.length));
      }

      this.columns.push(column);

      for (let particleIdx = 0; particleIdx < this.particlesPerColumn; particleIdx++) {
        const baseIndex = particleIndex * 8;
        const particleY = column.y + particleIdx * this.charSize;
        const charIndex = particleIdx < column.chars.length ? column.chars[particleIdx] : 0;
        const brightness = particleIdx === 0 ? 1.0 : Math.max(0, 1.0 - particleIdx / column.length);

        // position (x, y)
        this.particleData[baseIndex + 0] = column.x;
        this.particleData[baseIndex + 1] = particleY;

        // display (charIndex, brightness)
        this.particleData[baseIndex + 2] = charIndex;
        this.particleData[baseIndex + 3] = brightness;

        // column (columnY, speed, length, particleIndex)
        this.particleData[baseIndex + 4] = column.y;
        this.particleData[baseIndex + 5] = column.speed;
        this.particleData[baseIndex + 6] = column.length;
        this.particleData[baseIndex + 7] = particleIdx;

        particleIndex++;
      }
    }

    this.tfBufferA = this.gl.createBuffer();
    this.tfBufferB = this.gl.createBuffer();

    if (!this.tfBufferA || !this.tfBufferB) {
      console.error("Failed to create Matrix Rain Transform Feedback buffers");
      return;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tfBufferA);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleData, this.gl.DYNAMIC_COPY);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tfBufferB);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleData.byteLength, this.gl.DYNAMIC_COPY);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.currentReadBuffer = this.tfBufferA;
    this.currentWriteBuffer = this.tfBufferB;

    this.renderProgram = this.program;
  }

  protected draw(_time: number): void {
    if (
      !this.gl ||
      !this.renderProgram ||
      !this.updateProgram ||
      !this.currentReadBuffer ||
      !this.currentWriteBuffer
    )
      return;

    // ========================================
    // PASS 1: UPDATE PASS (Transform Feedback)
    // ========================================

    this.gl.useProgram(this.updateProgram);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentReadBuffer);

    const inPosLoc = this.gl.getAttribLocation(this.updateProgram, "in_position");
    const inDisplayLoc = this.gl.getAttribLocation(this.updateProgram, "in_display");
    const inColumnLoc = this.gl.getAttribLocation(this.updateProgram, "in_column");

    this.gl.enableVertexAttribArray(inPosLoc);
    this.gl.vertexAttribPointer(inPosLoc, 2, this.gl.FLOAT, false, 32, 0);

    this.gl.enableVertexAttribArray(inDisplayLoc);
    this.gl.vertexAttribPointer(inDisplayLoc, 2, this.gl.FLOAT, false, 32, 8);

    this.gl.enableVertexAttribArray(inColumnLoc);
    this.gl.vertexAttribPointer(inColumnLoc, 4, this.gl.FLOAT, false, 32, 16);

    const charSizeLoc = this.gl.getUniformLocation(this.updateProgram, "u_charSize");
    if (charSizeLoc) this.gl.uniform1f(charSizeLoc, this.charSize);

    const charCountLoc = this.gl.getUniformLocation(this.updateProgram, "u_charCount");
    if (charCountLoc) this.gl.uniform1f(charCountLoc, CHAR_ARRAY.length);

    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.currentWriteBuffer);

    // Perform Transform Feedback update (no rendering)
    this.gl.enable(this.gl.RASTERIZER_DISCARD);
    this.gl.beginTransformFeedback(this.gl.POINTS);
    this.gl.drawArrays(this.gl.POINTS, 0, this.totalParticles);
    this.gl.endTransformFeedback();
    this.gl.disable(this.gl.RASTERIZER_DISCARD);

    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    this.gl.disableVertexAttribArray(inPosLoc);
    this.gl.disableVertexAttribArray(inDisplayLoc);
    this.gl.disableVertexAttribArray(inColumnLoc);

    // Swap ping-pong buffers for next frame
    const previousReadBuffer = this.currentReadBuffer;
    this.currentReadBuffer = this.currentWriteBuffer;
    this.currentWriteBuffer = previousReadBuffer;

    // ========================================
    // PASS 2: RENDER PASS
    // ========================================

    this.gl.useProgram(this.renderProgram);

    const quadBuffer = this.buffers.get("quad");
    if (quadBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
      this.gl.enableVertexAttribArray(this.positionAttribute);
      this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Bind UPDATED particle data (from currentReadBuffer)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentReadBuffer);

    // Setup instance attributes for render shader
    // Render shader expects: vec3 a_instancePosition (x, y, charIndex) and float a_instanceBrightness
    // Buffer layout: position(2), display(2), column(4)
    // So: a_instancePosition reads position(2) + display.x(1), a_instanceBrightness reads display.y(1)
    this.gl.enableVertexAttribArray(this.instancePositionAttribute);
    this.gl.vertexAttribPointer(this.instancePositionAttribute, 3, this.gl.FLOAT, false, 32, 0);
    this.gl.vertexAttribDivisor(this.instancePositionAttribute, 1);

    this.gl.enableVertexAttribArray(this.instanceBrightnessAttribute);
    this.gl.vertexAttribPointer(this.instanceBrightnessAttribute, 1, this.gl.FLOAT, false, 32, 12);
    this.gl.vertexAttribDivisor(this.instanceBrightnessAttribute, 1);

    const charTexture = this.textures.get("characters");
    if (charTexture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, charTexture);
      const textureLocation = this.getUniformLocation("u_charTexture");
      if (textureLocation) this.gl.uniform1i(textureLocation, 0);
    }

    const charSizeLocation = this.getUniformLocation("u_charSize");
    if (charSizeLocation) this.gl.uniform1f(charSizeLocation, this.charSize);

    const charCountLocation = this.getUniformLocation("u_charCount");
    if (charCountLocation) this.gl.uniform1f(charCountLocation, CHAR_ARRAY.length);

    this.gl.drawArraysInstanced(this.gl.TRIANGLE_STRIP, 0, 4, this.totalParticles);

    this.gl.vertexAttribDivisor(this.instancePositionAttribute, 0);
    this.gl.vertexAttribDivisor(this.instanceBrightnessAttribute, 0);
  }

  protected handleResize(): void {
    super.handleResize();
    this.initializeColumns();
  }

  public cleanup(): void {
    if (this.gl) {
      if (this.tfBufferA) {
        this.gl.deleteBuffer(this.tfBufferA);
        this.tfBufferA = null;
      }
      if (this.tfBufferB) {
        this.gl.deleteBuffer(this.tfBufferB);
        this.tfBufferB = null;
      }

      if (this.updateProgram) {
        this.gl.deleteProgram(this.updateProgram);
        this.updateProgram = null;
      }
    }

    this.currentReadBuffer = null;
    this.currentWriteBuffer = null;
    this.renderProgram = null;
    this.particleData = null;
    this.columns = [];

    super.cleanup();
  }
}
