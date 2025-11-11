import { WebGLEffect, type ShaderSource } from "./webglEffect";

interface LightningBolt {
  vertices: Float32Array; // [x,y,...]
  vertexCount: number;
  buffer: WebGLBuffer | null; // Dedicated buffer for this bolt (from pool)
  bufferSize: number; // Size of allocated buffer data
  life: number; // seconds left
  intensity: number;
  color: [number, number, number];
  createdAt: number;
  pulses: number[]; // times relative to createdAt when pulses happen
}

/**
 * Buffer pool entry for efficient buffer reuse
 */
interface BufferPoolEntry {
  buffer: WebGLBuffer;
  maxSize: number; // Maximum data size this buffer can hold
}

/**
 * Buffer pool for efficient WebGL buffer management
 * Reuses WebGL buffers across frames to avoid gl.createBuffer() calls
 */
class BufferPool {
  private availableBuffers: BufferPoolEntry[] = [];
  private gl: WebGL2RenderingContext;

  constructor(gl: WebGL2RenderingContext, poolSize: number = 16) {
    this.gl = gl;
    for (let i = 0; i < poolSize; i++) {
      const buffer = gl.createBuffer();
      if (buffer) {
        this.availableBuffers.push({
          buffer,
          maxSize: 0,
        });
      }
    }
  }

  /**
   * Acquire a buffer from the pool and upload data
   * Returns [buffer, actualSize] tuple
   */
  acquire(data: Float32Array): [WebGLBuffer | null, number] {
    const entryIndex = this.availableBuffers.findIndex((e) => e.maxSize >= data.byteLength);
    let entry: BufferPoolEntry | undefined;

    if (entryIndex >= 0) {
      entry = this.availableBuffers.splice(entryIndex, 1)[0];
    } else if (this.availableBuffers.length > 0) {
      entry = this.availableBuffers.pop()!;
    } else {
      const buffer = this.gl.createBuffer();
      if (!buffer) return [null, 0];
      entry = { buffer, maxSize: 0 };
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, entry.buffer);
    if (entry.maxSize < data.byteLength) {
      // Need to allocate new GPU storage
      this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
      entry.maxSize = data.byteLength;
    } else {
      // Reuse existing storage via bufferSubData (avoids reallocation)
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data);
    }

    return [entry.buffer, entry.maxSize];
  }

  /**
   * Release a buffer back to the pool for reuse
   */
  release(buffer: WebGLBuffer | null, maxSize: number): void {
    if (!buffer) return;

    this.availableBuffers.push({
      buffer,
      maxSize,
    });
  }

  /**
   * Cleanup all buffers in the pool
   */
  cleanup(): void {
    for (const entry of this.availableBuffers) {
      this.gl.deleteBuffer(entry.buffer);
    }
    this.availableBuffers = [];
  }
}

export class WebGLLightningStorm extends WebGLEffect {
  private lightningBolts: LightningBolt[] = [];
  private maxBolts = 8;

  private bufferPool: BufferPool | null = null;

  private lightningProgram: WebGLProgram | null = null;
  private lightningUniforms: {
    resolution?: WebGLUniformLocation | null;
    time?: WebGLUniformLocation | null;
    color?: WebGLUniformLocation | null;
    opacity?: WebGLUniformLocation | null;
  } = {};
  private lightningPosAttr: number = -1;

  private flashProgram: WebGLProgram | null = null;
  private flashPosAttr: number = -1;
  private quadBuffer: WebGLBuffer | null = null;

  private stormPhase = Math.random() * 1000;
  private stormIntensity = 0.5; // 0..1
  private lastTriggerTime = 0;
  private flashValue = 0;

  constructor() {
    super({
      canvasId: "lightning-storm-canvas",
      targetFPS: 30, // Reduced from 60 to limit draw calls and buffer updates
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });

    // Enable UBO for common uniforms
    this.useUBO = true;
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "amber-phosphor";
  }

  protected getShaders(): ShaderSource {
    // Dummy shaders since we use separate programs for lightning and flash
    // Note: Uses UBO for common uniforms like other effects
    const dummyVertex = `#version 300 es
precision mediump float;
in vec2 a_position;
// Common uniforms via UBO (std140 layout)
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

    const dummyFragment = `#version 300 es
precision mediump float;
// Common uniforms via UBO (std140 layout)
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
`;

    return {
      vertex: dummyVertex,
      fragment: dummyFragment,
    };
  }
  protected setupGeometry(): void {
    if (!this.gl || !this.program || !this.canvas) return;

    this.bufferPool = new BufferPool(this.gl, 16);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.quadBuffer = this.createBuffer("flashQuad", quad);

    this.setupLightningShader();
    this.setupFlashShader();
  }

  private setupLightningShader() {
    if (!this.gl) return;
    const vs = this.compileShader(
      `#version 300 es
precision mediump float;
in vec2 a_pos;
// Common uniforms via UBO (std140 layout)
layout(std140) uniform CommonUniforms {
  vec2 u_resolution;  // offset 0, 8 bytes
  float u_time;        // offset 8, 4 bytes
  float _padding;      // offset 12, 4 bytes (alignment)
};
void main(){
  vec2 clip = ((a_pos / u_resolution) * 2.0 - 1.0) * vec2(1.0, -1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`,
      this.gl.VERTEX_SHADER
    );
    const fs = this.compileShader(
      `#version 300 es
precision mediump float;
uniform vec3 u_color;
uniform float u_opacity;
out vec4 fragColor;
void main(){
  fragColor = vec4(u_color, u_opacity);
}
`,
      this.gl.FRAGMENT_SHADER
    );
    if (!vs || !fs) return;
    const program = this.gl.createProgram();
    if (!program) return;
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error("Lightning shader link failed", this.gl.getProgramInfoLog(program));
      return;
    }
    this.lightningProgram = program;

    // Setup UBO for lightning program (bind to same binding point as main program)
    const blockIndex = this.gl.getUniformBlockIndex(this.lightningProgram, "CommonUniforms");
    if (blockIndex !== this.gl.INVALID_INDEX) {
      this.gl.uniformBlockBinding(this.lightningProgram, blockIndex, 0);
    }

    // Cache uniform locations for lightning program (non-UBO uniforms only)
    this.lightningUniforms.color = this.gl.getUniformLocation(program, "u_color");
    this.lightningUniforms.opacity = this.gl.getUniformLocation(program, "u_opacity");

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
  }

  private flashUniforms: {
    flash?: WebGLUniformLocation | null;
    color?: WebGLUniformLocation | null;
  } = {};

  private setupFlashShader() {
    if (!this.gl) return;
    const vs = this.compileShader(
      `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos,0,1); }
`,
      this.gl.VERTEX_SHADER
    );
    const fs = this.compileShader(
      `#version 300 es
precision mediump float;
uniform float u_flash;
uniform vec3 u_color;
out vec4 fragColor;
void main(){
  fragColor = vec4(u_color, u_flash * 0.9);
}
`,
      this.gl.FRAGMENT_SHADER
    );
    if (!vs || !fs) return;
    const program = this.gl.createProgram();
    if (!program) return;
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error("Flash shader link failed", this.gl.getProgramInfoLog(program));
      return;
    }
    this.flashProgram = program;

    this.flashUniforms.flash = this.gl.getUniformLocation(program, "u_flash");
    this.flashUniforms.color = this.gl.getUniformLocation(program, "u_color");

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
  }

  // fractal midpoint subdivision for lightning bolt + simple branching (kept)
  private generateBolt(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    detail = 5,
    chaos = 120
  ): Float32Array {
    const pts: number[] = [x0, y0, x1, y1];

    for (let d = 0; d < detail; d++) {
      const next: number[] = [];
      for (let i = 0; i < pts.length; i += 2) {
        const xA = pts[i],
          yA = pts[i + 1];
        if (i + 2 >= pts.length) {
          next.push(xA, yA);
          continue;
        }
        const xB = pts[i + 2],
          yB = pts[i + 3];
        const mx = (xA + xB) / 2;
        const my = (yA + yB) / 2;
        const dx = xB - xA;
        const dy = yB - yA;
        const dist = Math.hypot(dx, dy);
        const disp = (Math.random() - 0.5) * (chaos / (d + 1)) * (dist / 200);
        const px = -dy / (dist + 0.0001);
        const py = dx / (dist + 0.0001);
        const nx = mx + px * disp;
        const ny = my + py * disp;

        next.push(xA, yA);
        next.push(nx, ny);
      }
      next.push(pts[pts.length - 2], pts[pts.length - 1]);
      pts.length = 0;
      pts.push(...next);

      if (Math.random() < 0.35 && d > 1) {
        const branchIndex = Math.floor(Math.random() * (pts.length / 2 - 2)) * 2;
        const bx = pts[branchIndex],
          by = pts[branchIndex + 1];
        const branchLen = Math.random() * 80 + 30;
        const ang = (Math.random() - 0.5) * Math.PI * 0.7;
        const nx = bx + Math.cos(ang) * branchLen;
        const ny = by + Math.sin(ang) * branchLen;
        pts.push(bx, by);
        pts.push(nx, ny);
      }
    }

    return new Float32Array(pts);
  }

  private triggerLightningCluster() {
    if (!this.canvas || !this.bufferPool) return;
    const w = this.canvas.width;
    const strikeX = Math.random() * w;
    const startY = -50 + Math.random() * 60;
    const endX = strikeX + (Math.random() - 0.5) * 400;
    const endY = this.canvas.height * (0.65 + Math.random() * 0.35);

    const pts = this.generateBolt(strikeX, startY, endX, endY, 6, 220);

    // Acquire buffer from pool and upload vertices (done once, never updated)
    const [buffer, bufferSize] = this.bufferPool.acquire(pts);
    if (!buffer) return;

    const now = performance.now();
    const bolt: LightningBolt = {
      vertices: pts,
      vertexCount: pts.length / 2,
      buffer: buffer,
      bufferSize: bufferSize,
      life: 0.9 + Math.random() * 0.9,
      intensity: 0.8 + Math.random() * 0.6,
      color: [1.0, 0.98, 0.85],
      createdAt: now,
      pulses: [],
    };

    const pCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pCount; i++) {
      bolt.pulses.push(i * (0.06 + Math.random() * 0.08));
    }

    if (this.lightningBolts.length >= this.maxBolts) {
      const oldBolt = this.lightningBolts.shift();
      if (oldBolt && this.bufferPool) {
        this.bufferPool.release(oldBolt.buffer, oldBolt.bufferSize);
      }
    }
    this.lightningBolts.push(bolt);

    this.flashValue = Math.max(this.flashValue, 0.9 * bolt.intensity);
    this.lastTriggerTime = now;
  }

  private updateStorm(dt: number) {
    this.stormPhase += dt * 0.001;
    this.stormIntensity = 0.5 + Math.sin(this.stormPhase) * 0.3 + Math.random() * 0.1;

    const baseChance = 0.001 + this.stormIntensity * 0.008;
    if (Math.random() < baseChance) {
      this.triggerLightningCluster();
      // Cluster strikes during intense storms
      if (Math.random() < 0.4 && this.stormIntensity > 0.6) {
        const cluster = 1 + Math.floor(Math.random() * 3);
        for (let i = 1; i < cluster; i++) {
          setTimeout(() => this.triggerLightningCluster(), 80 + Math.random() * 220);
        }
      }
    }

    this.flashValue *= 0.86;
    if (this.flashValue < 0.01) this.flashValue = 0;
  }

  protected draw(_timeMs: number): void {
    if (!this.gl || !this.canvas) return;
    const dt = Math.min(0.04, 1 / 60);
    this.updateStorm(dt);

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.01, 0.02, 0.03, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // --- LIGHTNING PASS (additive) ---
    if (this.lightningBolts.length > 0 && this.lightningProgram) {
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
      this.gl.useProgram(this.lightningProgram);
      // Note: u_resolution and u_time are now provided via UBO (bound in setupLightningShader)

      // Cache attribute location for lightning program (once per program)
      if (this.lightningPosAttr < 0) {
        this.lightningPosAttr = this.gl.getAttribLocation(this.lightningProgram, "a_pos");
      }

      for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
        const bolt = this.lightningBolts[i];
        const age = (performance.now() - bolt.createdAt) / 1000;
        const lifeFrac = age / bolt.life;

        if (lifeFrac > 1.0) {
          if (this.bufferPool) {
            this.bufferPool.release(bolt.buffer, bolt.bufferSize);
          }
          this.lightningBolts.splice(i, 1);
          continue;
        }

        // Use bolt's pre-allocated buffer (no upload needed!)
        if (!bolt.buffer) continue;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bolt.buffer);

        if (this.lightningPosAttr >= 0) {
          this.gl.enableVertexAttribArray(this.lightningPosAttr);
          this.gl.vertexAttribPointer(this.lightningPosAttr, 2, this.gl.FLOAT, false, 0, 0);
        }

        let pulseMul = 0.6;
        for (const pulseTime of bolt.pulses) {
          const dtPulse = Math.abs(age - pulseTime);
          pulseMul = Math.max(pulseMul, Math.max(0.0, 1.0 - dtPulse * 30.0));
        }
        const baseOpacity = (1.0 - lifeFrac) * bolt.intensity * pulseMul;

        // Draw bolt with glow effect (two passes)
        if (this.lightningUniforms.color)
          this.gl.uniform3fv(this.lightningUniforms.color, bolt.color);
        if (this.lightningUniforms.opacity)
          this.gl.uniform1f(this.lightningUniforms.opacity, Math.min(0.5, baseOpacity * 0.9));
        this.gl.lineWidth(6.0);
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, bolt.vertexCount);

        if (this.lightningUniforms.opacity)
          this.gl.uniform1f(this.lightningUniforms.opacity, Math.min(1.0, baseOpacity * 1.6));
        this.gl.lineWidth(2.0);
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, bolt.vertexCount);

        if (this.lightningPosAttr >= 0) this.gl.disableVertexAttribArray(this.lightningPosAttr);
      }

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    // --- FLASH OVERLAY ---
    if (this.flashValue > 0.003 && this.flashProgram && this.quadBuffer) {
      this.gl.useProgram(this.flashProgram);

      if (this.flashUniforms.flash)
        this.gl.uniform1f(this.flashUniforms.flash, Math.min(1.0, this.flashValue));
      if (this.flashUniforms.color) this.gl.uniform3f(this.flashUniforms.color, 1.0, 0.98, 0.9);

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);

      // Cache attribute location for flash program (once per program)
      if (this.flashPosAttr < 0) {
        this.flashPosAttr = this.gl.getAttribLocation(this.flashProgram, "a_pos");
      }

      if (this.flashPosAttr >= 0) {
        this.gl.enableVertexAttribArray(this.flashPosAttr);
        this.gl.vertexAttribPointer(this.flashPosAttr, 2, this.gl.FLOAT, false, 0, 0);
      }
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      if (this.flashPosAttr >= 0) this.gl.disableVertexAttribArray(this.flashPosAttr);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    if (Math.random() < 0.0006 + this.stormIntensity * 0.0012) {
      const now = performance.now();
      if (now - this.lastTriggerTime > 150) {
        this.triggerLightningCluster();
      }
    }
  }

  protected handleResize(): void {
    super.handleResize();
    // nothing cloud-specific to reinitialize; quad covers viewport
  }

  public cleanup(): void {
    if (this.bufferPool) {
      for (const bolt of this.lightningBolts) {
        this.bufferPool.release(bolt.buffer, bolt.bufferSize);
      }
      this.lightningBolts = [];

      this.bufferPool.cleanup();
      this.bufferPool = null;
    }

    super.cleanup();
  }
}
