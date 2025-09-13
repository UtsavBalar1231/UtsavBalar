import { WebGLEffect, type ShaderSource } from "./webglEffect";

interface LightningBolt {
  vertices: Float32Array; // [x,y,...]
  vertexCount: number;
  life: number; // seconds left
  intensity: number;
  color: [number, number, number];
  createdAt: number;
  pulses: number[]; // times relative to createdAt when pulses happen
}

export class WebGLLightningStorm extends WebGLEffect {
  // lightning bolts
  private lightningBolts: LightningBolt[] = [];
  private maxBolts = 8;

  private lightningProgram: WebGLProgram | null = null;
  private lightningUniforms: {
    resolution?: WebGLUniformLocation | null;
    time?: WebGLUniformLocation | null;
    color?: WebGLUniformLocation | null;
    opacity?: WebGLUniformLocation | null;
  } = {};

  private flashProgram: WebGLProgram | null = null;
  private quadBuffer: WebGLBuffer | null = null;

  // storm state
  private stormPhase = Math.random() * 1000;
  private stormIntensity = 0.5; // 0..1
  private lastTriggerTime = 0;
  private flashValue = 0;

  constructor() {
    super({
      canvasId: "lightning-storm-canvas",
      targetFPS: 60,
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "amber-phosphor";
  }

  protected getShaders(): ShaderSource {
    // Dummy shaders since we use separate programs for lightning and flash
    const dummyVertex = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

    const dummyFragment = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  `;

    return {
      vertex: dummyVertex,
      fragment: dummyFragment,
    };
  }
  protected setupGeometry(): void {
    if (!this.gl || !this.program || !this.canvas) return;

    // create fullscreen quad for flash overlay
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.quadBuffer = this.createBuffer("flashQuad", quad);

    // compile lightning shader program
    this.setupLightningShader();

    // compile flash shader program
    this.setupFlashShader();
  }

  private setupLightningShader() {
    if (!this.gl) return;
    const vs = this.compileShader(
      `
      attribute vec2 a_pos;
      uniform vec2 u_resolution;
      uniform float u_time;
      void main(){
        vec2 clip = ((a_pos / u_resolution) * 2.0 - 1.0) * vec2(1.0, -1.0);
        gl_Position = vec4(clip, 0.0, 1.0);
      }
    `,
      this.gl.VERTEX_SHADER
    );
    const fs = this.compileShader(
      `
      precision mediump float;
      uniform vec3 u_color;
      uniform float u_opacity;
      void main(){
        gl_FragColor = vec4(u_color, u_opacity);
      }
    `,
      this.gl.FRAGMENT_SHADER
    );
    if (!vs || !fs) return;
    const p = this.gl.createProgram();
    if (!p) return;
    this.gl.attachShader(p, vs);
    this.gl.attachShader(p, fs);
    this.gl.linkProgram(p);
    if (!this.gl.getProgramParameter(p, this.gl.LINK_STATUS)) {
      console.error("Lightning shader link failed", this.gl.getProgramInfoLog(p));
      return;
    }
    this.lightningProgram = p;
    this.lightningUniforms.resolution = this.gl.getUniformLocation(p, "u_resolution");
    this.lightningUniforms.time = this.gl.getUniformLocation(p, "u_time");
    this.lightningUniforms.color = this.gl.getUniformLocation(p, "u_color");
    this.lightningUniforms.opacity = this.gl.getUniformLocation(p, "u_opacity");

    this.gl.deleteShader(vs);
    this.gl.deleteShader(fs);
  }

  private setupFlashShader() {
    if (!this.gl) return;
    const vs = this.compileShader(
      `
      attribute vec2 a_pos;
      void main(){ gl_Position = vec4(a_pos,0,1); }
    `,
      this.gl.VERTEX_SHADER
    );
    const fs = this.compileShader(
      `
      precision mediump float;
      uniform float u_flash;
      uniform vec3 u_color;
      void main(){
        gl_FragColor = vec4(u_color, u_flash * 0.9);
      }
    `,
      this.gl.FRAGMENT_SHADER
    );
    if (!vs || !fs) return;
    const p = this.gl.createProgram();
    if (!p) return;
    this.gl.attachShader(p, vs);
    this.gl.attachShader(p, fs);
    this.gl.linkProgram(p);
    if (!this.gl.getProgramParameter(p, this.gl.LINK_STATUS)) {
      console.error("Flash shader link failed", this.gl.getProgramInfoLog(p));
      return;
    }
    this.flashProgram = p;
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
    if (!this.canvas) return;
    const w = this.canvas.width;
    const strikeX = Math.random() * w;
    const startY = -50 + Math.random() * 60;
    const endX = strikeX + (Math.random() - 0.5) * 400;
    const endY = this.canvas.height * (0.65 + Math.random() * 0.35);

    const pts = this.generateBolt(strikeX, startY, endX, endY, 6, 220);

    const now = performance.now();
    const bolt: LightningBolt = {
      vertices: pts,
      vertexCount: pts.length / 2,
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

    if (this.lightningBolts.length >= this.maxBolts) this.lightningBolts.shift();
    this.lightningBolts.push(bolt);

    this.flashValue = Math.max(this.flashValue, 0.9 * bolt.intensity);
    this.lastTriggerTime = now;
  }

  private updateStorm(dt: number) {
    // Simple storm intensity variation
    this.stormPhase += dt * 0.001;
    this.stormIntensity = 0.5 + Math.sin(this.stormPhase) * 0.3 + Math.random() * 0.1;

    // Lightning triggering based on storm intensity
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

    // Decay flash value
    this.flashValue *= 0.86;
    if (this.flashValue < 0.01) this.flashValue = 0;
  }

  protected draw(timeMs: number): void {
    if (!this.gl || !this.canvas) return;
    const t = timeMs / 1000; // seconds
    const dt = Math.min(0.04, 1 / 60);
    this.updateStorm(dt);

    // GL state
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.01, 0.02, 0.03, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // --- LIGHTNING PASS (additive) ---
    if (this.lightningBolts.length > 0 && this.lightningProgram) {
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
      this.gl.useProgram(this.lightningProgram);
      if (this.lightningUniforms.resolution)
        this.gl.uniform2f(this.lightningUniforms.resolution, this.canvas.width, this.canvas.height);
      if (this.lightningUniforms.time) this.gl.uniform1f(this.lightningUniforms.time, t);

      for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
        const bolt = this.lightningBolts[i];
        const age = (performance.now() - bolt.createdAt) / 1000;
        const lifeFrac = age / bolt.life;
        if (lifeFrac > 1.0) {
          this.lightningBolts.splice(i, 1);
          continue;
        }

        const requiredSize = bolt.vertices.length;
        const currentBuffer = this.buffers.get("lightning");
        if (!currentBuffer || bolt.vertices.length > 1024) {
          const newSize = Math.min(Math.ceil(requiredSize * 1.2), 8192);
          this.createBuffer("lightning", new Float32Array(newSize));
        }

        this.updateBuffer("lightning", bolt.vertices);
        const lightningBuffer = this.buffers.get("lightning");
        if (!lightningBuffer) continue;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, lightningBuffer);
        const posAttr = this.gl.getAttribLocation(this.lightningProgram, "a_pos");
        if (posAttr >= 0) {
          this.gl.enableVertexAttribArray(posAttr);
          this.gl.vertexAttribPointer(posAttr, 2, this.gl.FLOAT, false, 0, 0);
        }

        let pulseMul = 0.6;
        for (const p of bolt.pulses) {
          const dtPulse = Math.abs(age - p);
          pulseMul = Math.max(pulseMul, Math.max(0.0, 1.0 - dtPulse * 30.0));
        }
        const baseOpacity = (1.0 - lifeFrac) * bolt.intensity * pulseMul;

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

        if (posAttr >= 0) this.gl.disableVertexAttribArray(posAttr);
      }

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    // --- FLASH OVERLAY ---
    if (this.flashValue > 0.003 && this.flashProgram && this.quadBuffer) {
      this.gl.useProgram(this.flashProgram);
      const flashLoc = this.gl.getUniformLocation(this.flashProgram, "u_flash");
      const colorLoc = this.gl.getUniformLocation(this.flashProgram, "u_color");
      if (flashLoc) this.gl.uniform1f(flashLoc, Math.min(1.0, this.flashValue));
      if (colorLoc) this.gl.uniform3f(colorLoc, 1.0, 0.98, 0.9);

      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
      const pos = this.gl.getAttribLocation(this.flashProgram, "a_pos");
      if (pos >= 0) {
        this.gl.enableVertexAttribArray(pos);
        this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0);
      }
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      if (pos >= 0) this.gl.disableVertexAttribArray(pos);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    // occasional lightning trigger
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
}
