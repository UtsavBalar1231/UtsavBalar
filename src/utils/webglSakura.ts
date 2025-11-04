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
  private petalCount: number = 150; // Optimized for performance (50% reduction)
  private particleData: Float32Array | null = null;

  // Additional uniforms
  private windUniform: WebGLUniformLocation | null = null;

  constructor() {
    super({
      canvasId: "sakura-fall-canvas",
      targetFPS: 30, // Slightly smoother 30fps for organic petal motion
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "monochrome";
  }

  protected getShaders(): ShaderSource {
    const vertex = `
      precision mediump float;

      attribute vec2 a_position;
      attribute vec3 a_instancePosition; // x, y, z (depth)
      attribute vec3 a_instanceRotation; // rotation, size, opacity

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_wind;
      
      varying float v_opacity;
      varying vec2 v_texCoord;
      varying float v_depth;
      
      void main() {
        // Apply rotation
        float rotation = a_instanceRotation.x + u_time * 0.5;
        float size = a_instanceRotation.y;
        float opacity = a_instanceRotation.z;
        
        // Calculate sway
        float swayX = sin(a_instancePosition.y * 0.01 + u_time * 2.0) * 20.0;
        
        // Rotation matrix
        float c = cos(rotation);
        float s = sin(rotation);
        mat2 rotMatrix = mat2(c, -s, s, c);
        
        // Apply rotation and scale to vertex position
        vec2 rotatedPos = rotMatrix * (a_position * size);
        
        // Add instance position and sway
        vec2 position = rotatedPos + a_instancePosition.xy + vec2(swayX + u_wind.x * 10.0, 0.0);
        
        // Apply parallax based on depth
        float parallaxScale = 0.5 + a_instancePosition.z * 0.5;
        position *= parallaxScale;
        
        // Convert to clip space
        vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        
        gl_Position = vec4(clipSpace, a_instancePosition.z * 0.1, 1.0);
        
        v_opacity = opacity * (0.5 + a_instancePosition.z * 0.5);
        v_texCoord = a_position + 0.5;
        v_depth = a_instancePosition.z;
      }
    `;

    const fragment = `
      precision mediump float;
      
      uniform sampler2D u_petalTexture;
      uniform float u_time;
      
      varying float v_opacity;
      varying vec2 v_texCoord;
      varying float v_depth;
      
      void main() {
        // Sample petal texture
        vec4 texColor = texture2D(u_petalTexture, v_texCoord);
        
        // Distance from center for petal shape
        float dist = length(v_texCoord - 0.5) * 2.0;
        
        // Create petal shape using distance field
        float petalShape = 1.0 - smoothstep(0.3, 0.5, dist);
        
        // Add inner detail
        float innerDetail = 1.0 - smoothstep(0.0, 0.2, dist);
        petalShape += innerDetail * 0.3;
        
        // Create 5-petal flower shape
        vec2 centered = v_texCoord - 0.5;
        float angle = atan(centered.y, centered.x);
        float petalPattern = sin(angle * 5.0) * 0.5 + 0.5;
        petalShape *= petalPattern;
        
        // Monochrome white to light gray gradient
        vec3 color = mix(
          vec3(0.9, 0.9, 0.9),  // Light gray
          vec3(1.0, 1.0, 1.0),  // White
          petalShape
        );
        
        // Add subtle depth-based shading
        color *= 0.8 + v_depth * 0.2;
        
        // Apply opacity with shape
        float alpha = petalShape * v_opacity * texColor.a;
        
        // Add subtle glow for closer petals
        if (v_depth > 0.7) {
          alpha *= 1.2;
          color *= 1.1;
        }
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    return { vertex, fragment };
  }

  protected setupGeometry(): void {
    if (!this.gl || !this.program) return;

    // Create quad vertices for petal rendering
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

    // Create petal texture
    this.createPetalTexture();

    // Get additional uniform locations
    this.windUniform = this.gl.getUniformLocation(this.program, "u_wind");

    // Get attribute locations for instancing
    // const instancePosAttr = this.gl.getAttribLocation(this.program, 'a_instancePosition');
    // const instanceRotAttr = this.gl.getAttribLocation(this.program, 'a_instanceRotation');

    // Initialize petals
    this.initializePetals();
  }

  private createPetalTexture(): void {
    if (!this.gl) return;

    // Create canvas for petal texture
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 512; // Larger texture for bigger petals
    canvas.height = 512;

    // Create radial gradient for petal
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(245, 245, 245, 0.9)");
    gradient.addColorStop(1, "rgba(230, 230, 230, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Create texture from canvas
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

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.textures.set("petal", texture);
  }

  private initializePetals(): void {
    if (!this.canvas) return;

    this.petals = [];

    for (let i = 0; i < this.petalCount; i++) {
      const petal: SakuraPetal = {
        x: Math.random() * (this.canvas.width + 200) - 100,
        y: Math.random() * this.canvas.height * 2 - this.canvas.height,
        z: Math.random(), // 0 = far, 1 = near
        size: (Math.random() * 20 + 20) * (0.5 + Math.random() * 0.5), // Increased from 10-25 to 20-40
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        fallSpeed: Math.random() * 1.2 + 0.4, // Slightly slower for larger petals
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayAmount: Math.random() * 40 + 30, // More sway for larger petals
        opacity: Math.random() * 0.5 + 0.4, // Slightly more opaque
      };

      this.petals.push(petal);
    }

    // Allocate particle data buffer
    // 6 floats per petal: x, y, z, rotation, size, opacity
    this.particleData = new Float32Array(this.petalCount * 6);

    // Create instance buffer
    this.createInstanceBuffer("petals", this.particleData);
  }

  private updatePetals(time: number): void {
    if (!this.particleData || !this.canvas) return;

    // Calculate wind effect
    const windX = Math.sin(time * 0.5) * 0.3;
    const windY = Math.cos(time * 0.3) * 0.1;

    for (let i = 0; i < this.petals.length; i++) {
      const petal = this.petals[i];

      // Update position
      const depthFactor = 0.5 + petal.z * 0.5;
      petal.y += petal.fallSpeed * depthFactor;

      // Apply sway
      const sway = Math.sin(petal.y * petal.swaySpeed + petal.swayPhase) * petal.swayAmount;
      petal.x += sway * 0.02 + windX * depthFactor;

      // Update rotation
      petal.rotation += petal.rotationSpeed;

      // Reset petal if it goes off screen
      if (petal.y > this.canvas.height + 50) {
        petal.y = -50 - Math.random() * 200;
        petal.x = Math.random() * (this.canvas.width + 200) - 100;
        petal.rotation = Math.random() * Math.PI * 2;
      }

      // Wrap horizontally
      if (petal.x < -100) {
        petal.x = this.canvas.width + 100;
      } else if (petal.x > this.canvas.width + 100) {
        petal.x = -100;
      }

      // Update particle data
      const baseIndex = i * 6;
      this.particleData[baseIndex] = petal.x;
      this.particleData[baseIndex + 1] = petal.y;
      this.particleData[baseIndex + 2] = petal.z;
      this.particleData[baseIndex + 3] = petal.rotation;
      this.particleData[baseIndex + 4] = petal.size;
      this.particleData[baseIndex + 5] = petal.opacity;
    }

    // Update GPU buffer
    this.updateBuffer("petals", this.particleData);

    // Update wind uniform
    if (this.gl && this.program && this.windUniform) {
      this.gl.uniform2f(this.windUniform, windX, windY);
    }
  }

  protected draw(time: number): void {
    if (!this.gl || !this.program) return;

    // Update petal positions
    this.updatePetals(time);

    // Get instanced arrays extension
    const ext = this.getInstancedArraysExt();
    if (!ext) return;

    // Depth testing removed for better performance - using painter's algorithm via z-based opacity

    // Bind quad geometry
    const quadBuffer = this.buffers.get("quad");
    if (quadBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
      this.gl.enableVertexAttribArray(this.positionAttribute);
      this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Bind instance data
    const petalBuffer = this.buffers.get("petals");
    if (petalBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, petalBuffer);

      // Setup instance attributes
      const instancePosAttr = this.gl.getAttribLocation(this.program, "a_instancePosition");
      const instanceRotAttr = this.gl.getAttribLocation(this.program, "a_instanceRotation");

      this.gl.enableVertexAttribArray(instancePosAttr);
      this.gl.vertexAttribPointer(instancePosAttr, 3, this.gl.FLOAT, false, 24, 0);
      ext.vertexAttribDivisorANGLE(instancePosAttr, 1);

      this.gl.enableVertexAttribArray(instanceRotAttr);
      this.gl.vertexAttribPointer(instanceRotAttr, 3, this.gl.FLOAT, false, 24, 12);
      ext.vertexAttribDivisorANGLE(instanceRotAttr, 1);
    }

    // Bind petal texture
    const petalTexture = this.textures.get("petal");
    if (petalTexture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, petalTexture);
      const textureLocation = this.gl.getUniformLocation(this.program, "u_petalTexture");
      this.gl.uniform1i(textureLocation, 0);
    }

    // Draw all petals with instancing
    ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, this.petalCount);

    // Reset divisors
    const instancePosAttr = this.gl.getAttribLocation(this.program, "a_instancePosition");
    const instanceRotAttr = this.gl.getAttribLocation(this.program, "a_instanceRotation");
    ext.vertexAttribDivisorANGLE(instancePosAttr, 0);
    ext.vertexAttribDivisorANGLE(instanceRotAttr, 0);
  }

  protected handleResize(): void {
    super.handleResize();
    // Reinitialize petals on resize
    this.initializePetals();
  }
}
