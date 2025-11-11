import { WebGLEffect, type ShaderSource } from "./webglEffect";

interface SakuraPetal {
  x: number;
  y: number;
  z: number; // Depth for parallax
  size: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmount: number;
  opacity: number;
}

export class WebGLSakuraFall extends WebGLEffect {
  private petals: SakuraPetal[] = [];
  private petalCount: number = 150; // 150 petals * 48 bytes = 7.2KB instance buffer (TF)
  private particleData: Float32Array | null = null;

  // Transform Feedback ping-pong buffers
  private tfBufferA: WebGLBuffer | null = null;
  private tfBufferB: WebGLBuffer | null = null;
  private currentReadBuffer: WebGLBuffer | null = null;
  private currentWriteBuffer: WebGLBuffer | null = null;

  // Separate programs for update (TF) and render
  private updateProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;

  // Additional uniforms
  private windUniform: WebGLUniformLocation | null = null;
  private updateWindUniform: WebGLUniformLocation | null = null;

  constructor() {
    super({
      canvasId: "sakura-fall-canvas",
      targetFPS: 30, // 30fps: physics timestep for petal falling/rotation simulation
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });

    // Enable UBO for common uniforms
    this.useUBO = true;
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "monochrome";
  }

  /**
   * Create Transform Feedback update program
   * This shader reads particle state from input buffer and writes updated state to output buffer
   */
  private createUpdateProgram(): void {
    if (!this.gl) return;

    // Update vertex shader - performs physics simulation on GPU
    // Particle data: 12 floats per particle
    // - vec3 position (x, y, z)
    // - float rotation
    // - vec4 constants (size, opacity, rotationSpeed, fallSpeed)
    // - vec4 physics (swayPhase, swaySpeed, swayAmount, depthFactor)
    const updateVertex = `#version 300 es
precision mediump float;

// Input: current particle state (from buffer)
in vec3 in_position;        // x, y, z (depth)
in float in_rotation;       // current rotation
in vec4 in_constants;       // size, opacity, rotationSpeed, fallSpeed
in vec4 in_physics;         // swayPhase, swaySpeed, swayAmount, unused

// Common uniforms via UBO
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;
  float u_time;
  float _padding;
};

uniform vec2 u_wind;
uniform float u_deltaTime;  // Frame delta for consistent physics

// Output: updated particle state (to buffer via Transform Feedback)
out vec3 out_position;
out float out_rotation;
out vec4 out_constants;    // Pass through unchanged
out vec4 out_physics;      // Pass through unchanged

void main() {
  float size = in_constants.x;
  float opacity = in_constants.y;
  float rotationSpeed = in_constants.z;
  float fallSpeed = in_constants.w;

  float swayPhase = in_physics.x;
  float swaySpeed = in_physics.y;
  float swayAmount = in_physics.z;

  float depthFactor = 0.5 + in_position.z * 0.5;

  float newY = in_position.y + fallSpeed * depthFactor * u_deltaTime;

  float sway = sin(newY * swaySpeed + swayPhase) * swayAmount;
  float newX = in_position.x + sway * 0.02 * u_deltaTime + u_wind.x * depthFactor * u_deltaTime;

  float newRotation = in_rotation + rotationSpeed * u_deltaTime;

  // Boundary wrapping
  if (newY > u_resolution.y + 50.0) {
    newY = -50.0 - mod(u_time * 100.0 + float(gl_VertexID), 200.0);  // Pseudo-random offset
    newX = mod(u_time * 200.0 + float(gl_VertexID) * 13.37, u_resolution.x + 200.0) - 100.0;
    newRotation = mod(u_time + float(gl_VertexID) * 0.123, 6.28318);  // Random rotation
  }

  if (newX < -100.0) {
    newX = u_resolution.x + 100.0;
  } else if (newX > u_resolution.x + 100.0) {
    newX = -100.0;
  }

  out_position = vec3(newX, newY, in_position.z);  // Z (depth) never changes
  out_rotation = newRotation;
  out_constants = in_constants;  // Pass through
  out_physics = in_physics;      // Pass through
}
`;

    // Update fragment shader - not used (rasterizer discarded) but required
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
      console.error("Failed to create update shaders");
      return;
    }

    this.updateProgram = this.gl.createProgram();
    if (!this.updateProgram) {
      console.error("Failed to create update program");
      return;
    }

    this.gl.attachShader(this.updateProgram, vs);
    this.gl.attachShader(this.updateProgram, fs);

    // Specify Transform Feedback varyings (must match output order)
    this.gl.transformFeedbackVaryings(
      this.updateProgram,
      ["out_position", "out_rotation", "out_constants", "out_physics"],
      this.gl.INTERLEAVED_ATTRIBS
    );

    this.gl.linkProgram(this.updateProgram);

    if (!this.gl.getProgramParameter(this.updateProgram, this.gl.LINK_STATUS)) {
      console.error("Update program link error:", this.gl.getProgramInfoLog(this.updateProgram));
      this.gl.deleteProgram(this.updateProgram);
      this.updateProgram = null;
      return;
    }

    this.updateWindUniform = this.gl.getUniformLocation(this.updateProgram, "u_wind");

    // Setup UBO for update program (bind to same binding point as render program)
    const blockIndex = this.gl.getUniformBlockIndex(this.updateProgram, "CommonUniforms");
    if (blockIndex !== this.gl.INVALID_INDEX) {
      this.gl.uniformBlockBinding(this.updateProgram, blockIndex, 0);
    }

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
  }

  protected getShaders(): ShaderSource {
    // RENDER shaders - display particles (unchanged from original)
    const vertex = `#version 300 es
precision mediump float;

in vec2 a_position;
in vec3 a_instancePosition; // x, y, z (depth)
in vec3 a_instanceRotation; // rotation, size, opacity

// Common uniforms via UBO (std140 layout)
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};

uniform vec2 u_wind;

out float v_opacity;
out vec2 v_texCoord;
out float v_depth;

void main() {
  float rotation = a_instanceRotation.x;
  float size = a_instanceRotation.y;
  float opacity = a_instanceRotation.z;

  // Calculate sway for rendering (visual effect only, physics handled in update shader)
  float swayX = sin(a_instancePosition.y * 0.01 + u_time * 2.0) * 20.0;

  float c = cos(rotation);
  float s = sin(rotation);
  mat2 rotMatrix = mat2(c, -s, s, c);

  vec2 rotatedPos = rotMatrix * (a_position * size);

  vec2 position = rotatedPos + a_instancePosition.xy + vec2(swayX + u_wind.x * 10.0, 0.0);

  float parallaxScale = 0.5 + a_instancePosition.z * 0.5;
  position *= parallaxScale;

  vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);

  gl_Position = vec4(clipSpace, a_instancePosition.z * 0.1, 1.0);

  v_opacity = opacity * (0.5 + a_instancePosition.z * 0.5);
  v_texCoord = a_position + 0.5;
  v_depth = a_instancePosition.z;
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

uniform sampler2D u_petalTexture;

in float v_opacity;
in vec2 v_texCoord;
in float v_depth;

out vec4 fragColor;

void main() {
  vec4 texColor = texture(u_petalTexture, v_texCoord);

  float dist = length(v_texCoord - 0.5) * 2.0;

  float petalShape = 1.0 - smoothstep(0.3, 0.5, dist);

  float innerDetail = 1.0 - smoothstep(0.0, 0.2, dist);
  petalShape += innerDetail * 0.3;

  vec2 centered = v_texCoord - 0.5;
  float angle = atan(centered.y, centered.x);
  float petalPattern = sin(angle * 5.0) * 0.5 + 0.5;
  petalShape *= petalPattern;

  vec3 color = mix(
    vec3(0.9, 0.9, 0.9),  // Light gray
    vec3(1.0, 1.0, 1.0),  // White
    petalShape
  );

  color *= 0.8 + v_depth * 0.2;

  float alpha = petalShape * v_opacity * texColor.a;

  if (v_depth > 0.7) {
    alpha *= 1.2;
    color *= 1.1;
  }

  fragColor = vec4(color, alpha);
}
`;

    return { vertex, fragment };
  }

  protected setupGeometry(): void {
    if (!this.gl || !this.program) return;

    const quadVertices = new Float32Array([
      -0.5,
      -0.5, // Bottom left
      0.5,
      -0.5, // Bottom right
      -0.5,
      0.5, // Top left
      0.5,
      0.5, // Top right
    ]);

    this.createBuffer("quad", quadVertices);
    this.createPetalTexture();

    this.windUniform = this.gl.getUniformLocation(this.program, "u_wind");

    this.createUpdateProgram();

    this.initializePetals();
  }

  private createPetalTexture(): void {
    if (!this.gl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 512; // Larger texture for bigger petals
    canvas.height = 512;

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(245, 245, 245, 0.9)");
    gradient.addColorStop(1, "rgba(230, 230, 230, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = this.gl.createTexture();
    if (!texture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      canvas
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.textures.set("petal", texture);
  }

  private initializePetals(): void {
    if (!this.canvas || !this.gl) return;

    this.petals = [];

    // Allocate particle data buffer for Transform Feedback
    // 12 floats per petal:
    // - vec3 position (x, y, z) = 3 floats
    // - float rotation = 1 float
    // - vec4 constants (size, opacity, rotationSpeed, fallSpeed) = 4 floats
    // - vec4 physics (swayPhase, swaySpeed, swayAmount, unused) = 4 floats
    // Total: 48 bytes per particle
    this.particleData = new Float32Array(this.petalCount * 12);

    for (let i = 0; i < this.petalCount; i++) {
      const petal: SakuraPetal = {
        x: Math.random() * (this.canvas.width + 200) - 100,
        y: Math.random() * this.canvas.height * 2 - this.canvas.height,
        z: Math.random(), // 0 = far, 1 = near
        size: (Math.random() * 20 + 20) * (0.5 + Math.random() * 0.5), // 20-40px
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        fallSpeed: Math.random() * 1.2 + 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayAmount: Math.random() * 40 + 30,
        opacity: Math.random() * 0.5 + 0.4,
      };

      this.petals.push(petal);

      const baseIndex = i * 12;
      this.particleData[baseIndex + 0] = petal.x; // position.x
      this.particleData[baseIndex + 1] = petal.y; // position.y
      this.particleData[baseIndex + 2] = petal.z; // position.z
      this.particleData[baseIndex + 3] = petal.rotation; // rotation
      this.particleData[baseIndex + 4] = petal.size; // constants.x (size)
      this.particleData[baseIndex + 5] = petal.opacity; // constants.y (opacity)
      this.particleData[baseIndex + 6] = petal.rotationSpeed; // constants.z
      this.particleData[baseIndex + 7] = petal.fallSpeed; // constants.w
      this.particleData[baseIndex + 8] = petal.swayPhase; // physics.x
      this.particleData[baseIndex + 9] = petal.swaySpeed; // physics.y
      this.particleData[baseIndex + 10] = petal.swayAmount; // physics.z
      this.particleData[baseIndex + 11] = 0.0; // physics.w (unused)
    }

    // Create Transform Feedback ping-pong buffers
    this.tfBufferA = this.gl.createBuffer();
    this.tfBufferB = this.gl.createBuffer();

    if (!this.tfBufferA || !this.tfBufferB) {
      console.error("Failed to create Transform Feedback buffers");
      return;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tfBufferA);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleData, this.gl.DYNAMIC_COPY);

    // Initialize buffer B (same size, will be filled by Transform Feedback)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tfBufferB);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleData.byteLength, this.gl.DYNAMIC_COPY);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.currentReadBuffer = this.tfBufferA;
    this.currentWriteBuffer = this.tfBufferB;

    // Store render program pointer for later use
    this.renderProgram = this.program;
  }

  protected draw(time: number): void {
    if (
      !this.gl ||
      !this.renderProgram ||
      !this.updateProgram ||
      !this.currentReadBuffer ||
      !this.currentWriteBuffer
    )
      return;

    const deltaTime = 1.0; // Fixed timestep for consistent physics at 30fps

    // Calculate wind effect (same formula as before)
    const windX = Math.sin(time * 0.5) * 0.3;
    const windY = Math.cos(time * 0.3) * 0.1;

    // ========================================
    // PASS 1: UPDATE PASS (Transform Feedback)
    // ========================================

    this.gl.useProgram(this.updateProgram);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentReadBuffer);

    // Setup vertex attributes for update shader (12 floats per particle, 48 bytes stride)
    const inPositionLoc = this.gl.getAttribLocation(this.updateProgram, "in_position");
    const inRotationLoc = this.gl.getAttribLocation(this.updateProgram, "in_rotation");
    const inConstantsLoc = this.gl.getAttribLocation(this.updateProgram, "in_constants");
    const inPhysicsLoc = this.gl.getAttribLocation(this.updateProgram, "in_physics");

    this.gl.enableVertexAttribArray(inPositionLoc);
    this.gl.vertexAttribPointer(inPositionLoc, 3, this.gl.FLOAT, false, 48, 0); // offset 0

    this.gl.enableVertexAttribArray(inRotationLoc);
    this.gl.vertexAttribPointer(inRotationLoc, 1, this.gl.FLOAT, false, 48, 12); // offset 12

    this.gl.enableVertexAttribArray(inConstantsLoc);
    this.gl.vertexAttribPointer(inConstantsLoc, 4, this.gl.FLOAT, false, 48, 16); // offset 16

    this.gl.enableVertexAttribArray(inPhysicsLoc);
    this.gl.vertexAttribPointer(inPhysicsLoc, 4, this.gl.FLOAT, false, 48, 32); // offset 32

    if (this.updateWindUniform) {
      this.gl.uniform2f(this.updateWindUniform, windX, windY);
    }

    const deltaTimeLoc = this.gl.getUniformLocation(this.updateProgram, "u_deltaTime");
    if (deltaTimeLoc) {
      this.gl.uniform1f(deltaTimeLoc, deltaTime);
    }

    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.currentWriteBuffer);

    // Perform Transform Feedback update (no rendering)
    this.gl.enable(this.gl.RASTERIZER_DISCARD);
    this.gl.beginTransformFeedback(this.gl.POINTS);
    this.gl.drawArrays(this.gl.POINTS, 0, this.petalCount);
    this.gl.endTransformFeedback();
    this.gl.disable(this.gl.RASTERIZER_DISCARD);

    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    this.gl.disableVertexAttribArray(inPositionLoc);
    this.gl.disableVertexAttribArray(inRotationLoc);
    this.gl.disableVertexAttribArray(inConstantsLoc);
    this.gl.disableVertexAttribArray(inPhysicsLoc);

    // Swap ping-pong buffers for next frame
    const bufferSwap = this.currentReadBuffer;
    this.currentReadBuffer = this.currentWriteBuffer;
    this.currentWriteBuffer = bufferSwap;

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

    // Bind UPDATED particle data (from currentReadBuffer which now has new data)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentReadBuffer);

    // Setup instance attributes for render shader
    // Render shader expects: vec3 a_instancePosition (x,y,z) and vec3 a_instanceRotation (rotation, size, opacity)
    // Buffer layout: position(3), rotation(1), constants(4), physics(4)
    // So: a_instancePosition reads position(3), a_instanceRotation reads rotation(1) + first 2 of constants
    const instancePosAttr = this.getAttributeLocation("a_instancePosition");
    const instanceRotAttr = this.getAttributeLocation("a_instanceRotation");

    this.gl.enableVertexAttribArray(instancePosAttr);
    this.gl.vertexAttribPointer(instancePosAttr, 3, this.gl.FLOAT, false, 48, 0); // position at offset 0
    this.gl.vertexAttribDivisor(instancePosAttr, 1);

    this.gl.enableVertexAttribArray(instanceRotAttr);
    this.gl.vertexAttribPointer(instanceRotAttr, 3, this.gl.FLOAT, false, 48, 12); // rotation + size + opacity at offset 12, 16, 20
    this.gl.vertexAttribDivisor(instanceRotAttr, 1);

    if (this.windUniform) {
      this.gl.uniform2f(this.windUniform, windX, windY);
    }

    const petalTexture = this.textures.get("petal");
    if (petalTexture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, petalTexture);
      const textureLocation = this.getUniformLocation("u_petalTexture");
      if (textureLocation) this.gl.uniform1i(textureLocation, 0);
    }

    this.gl.drawArraysInstanced(this.gl.TRIANGLE_STRIP, 0, 4, this.petalCount);

    this.gl.vertexAttribDivisor(instancePosAttr, 0);
    this.gl.vertexAttribDivisor(instanceRotAttr, 0);
  }

  protected handleResize(): void {
    super.handleResize();
    this.initializePetals();
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

    super.cleanup();
  }
}
