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

  // Attribute locations
  private instancePositionAttribute: number = -1;
  // private instanceCharAttribute: number = -1; // Currently using position.z for char index
  private instanceBrightnessAttribute: number = -1;

  constructor() {
    super({
      canvasId: "matrix-rain-canvas",
      targetFPS: 24, // Classic cinematic 24fps for film-like digital rain
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "green-phosphor";
  }

  protected getShaders(): ShaderSource {
    const vertex = `
      attribute vec2 a_position;
      attribute vec3 a_instancePosition; // x, y, charIndex
      attribute float a_instanceBrightness;
      
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_charSize;
      
      varying float v_brightness;
      varying float v_charIndex;
      varying vec2 v_texCoord;
      
      void main() {
        // Calculate character position
        vec2 position = a_position * u_charSize + a_instancePosition.xy;
        
        // Convert to clip space
        vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        
        gl_Position = vec4(clipSpace, 0.0, 1.0);
        
        v_brightness = a_instanceBrightness;
        v_charIndex = a_instancePosition.z;
        v_texCoord = a_position + 0.5; // Convert from -0.5,0.5 to 0,1
      }
    `;

    const fragment = `
      precision mediump float;
      
      uniform sampler2D u_charTexture;
      uniform float u_time;
      uniform float u_charCount;
      
      varying float v_brightness;
      varying float v_charIndex;
      varying vec2 v_texCoord;
      
      void main() {
        // Calculate which character to display
        float charOffset = v_charIndex / u_charCount;
        vec2 texCoord = vec2(v_texCoord.x / u_charCount + charOffset, v_texCoord.y);
        
        // Sample character texture
        vec4 charColor = texture2D(u_charTexture, texCoord);
        
        // Apply green phosphor color with brightness
        float green = 100.0 + v_brightness * 155.0;
        vec3 color = vec3(0.0, green / 255.0, 0.0);
        
        // Fade based on brightness
        float alpha = charColor.a * v_brightness;
        
        // Add slight glow for bright characters
        if (v_brightness > 0.8) {
          alpha *= 1.2;
        }
        
        gl_FragColor = vec4(color * charColor.rgb, alpha);
      }
    `;

    return { vertex, fragment };
  }

  protected setupGeometry(): void {
    if (!this.gl || !this.program) return;

    // Create quad vertices for character rendering
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

    // Create character texture atlas
    this.createCharacterTexture();

    // Get additional attribute locations
    this.instancePositionAttribute = this.gl.getAttribLocation(this.program, "a_instancePosition");
    // this.instanceCharAttribute = this.gl.getAttribLocation(this.program, 'a_instanceChar');
    this.instanceBrightnessAttribute = this.gl.getAttribLocation(
      this.program,
      "a_instanceBrightness"
    );

    // Initialize columns
    this.initializeColumns();
  }

  private createCharacterTexture(): void {
    if (!this.gl) return;

    // Create canvas for rendering characters
    const charCanvas = document.createElement("canvas");
    const charCtx = charCanvas.getContext("2d");
    if (!charCtx) return;

    // Setup canvas for character atlas
    const charWidth = 32;
    const charHeight = 32;
    charCanvas.width = charWidth * CHAR_ARRAY.length;
    charCanvas.height = charHeight;

    // Configure font - increased size for better visibility
    charCtx.font = '28px "DepartureMono Nerd Font", monospace';
    charCtx.textAlign = "center";
    charCtx.textBaseline = "middle";
    charCtx.fillStyle = "white";

    // Render each character
    CHAR_ARRAY.forEach((char, i) => {
      const x = i * charWidth + charWidth / 2;
      const y = charHeight / 2;
      charCtx.fillText(char, x, y);
    });

    // Create WebGL texture from canvas
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

    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.textures.set("characters", texture);
  }

  private initializeColumns(): void {
    if (!this.canvas) return;

    this.columnCount = Math.floor(this.canvas.width / this.charSize);
    this.columns = [];

    for (let i = 0; i < this.columnCount; i++) {
      const column: MatrixColumn = {
        x: i * this.charSize,
        y: Math.random() * -this.canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        length: Math.floor(Math.random() * this.maxDropLength) + 10,
        chars: [],
        brightness: 1.0,
      };

      // Initialize character indices
      for (let j = 0; j < column.length; j++) {
        column.chars.push(Math.floor(Math.random() * CHAR_ARRAY.length));
      }

      this.columns.push(column);
    }

    // Calculate total particles needed
    this.totalParticles = this.columnCount * this.particlesPerColumn;

    // Allocate particle data buffer (x, y, charIndex, brightness per particle)
    this.particleData = new Float32Array(this.totalParticles * 4);

    // Create instance buffer
    this.createInstanceBuffer("particles", this.particleData);
  }

  private updateParticles(_time: number): void {
    if (!this.particleData || !this.canvas) return;

    let particleIndex = 0;

    for (let i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];

      // Update column position
      column.y += column.speed * this.charSize;

      // Reset column if it goes off screen
      if (column.y > this.canvas.height + column.length * this.charSize) {
        column.y = -column.length * this.charSize;

        // Randomize characters
        for (let j = 0; j < column.chars.length; j++) {
          column.chars[j] = Math.floor(Math.random() * CHAR_ARRAY.length);
        }
      }

      // Update characters occasionally
      for (let j = 0; j < column.chars.length; j++) {
        if (Math.random() < 0.01) {
          column.chars[j] = Math.floor(Math.random() * CHAR_ARRAY.length);
        }
      }

      // Write particle data for this column
      for (let j = 0; j < this.particlesPerColumn && j < column.length; j++) {
        const baseIndex = particleIndex * 4;
        const charY = column.y + j * this.charSize;

        // Only render if on screen
        if (charY > -this.charSize && charY < this.canvas.height + this.charSize) {
          this.particleData[baseIndex] = column.x; // x position
          this.particleData[baseIndex + 1] = charY; // y position
          this.particleData[baseIndex + 2] = column.chars[j % column.chars.length]; // char index

          // Calculate brightness (fade from head to tail)
          const brightness = j === 0 ? 1.0 : Math.max(0, 1.0 - j / column.length);
          this.particleData[baseIndex + 3] = brightness;
        } else {
          // Set off-screen particles to invisible
          this.particleData[baseIndex + 3] = 0;
        }

        particleIndex++;
      }
    }

    // Update GPU buffer
    this.updateBuffer("particles", this.particleData);
  }

  protected draw(time: number): void {
    if (!this.gl || !this.program) return;

    // Update particle positions
    this.updateParticles(time);

    // Get instanced arrays extension
    const ext = this.getInstancedArraysExt();
    if (!ext) return;

    // Bind quad geometry
    const quadBuffer = this.buffers.get("quad");
    if (quadBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer);
      this.gl.enableVertexAttribArray(this.positionAttribute);
      this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Bind instance data
    const particleBuffer = this.buffers.get("particles");
    if (particleBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, particleBuffer);

      // Setup instance attributes
      this.gl.enableVertexAttribArray(this.instancePositionAttribute);
      this.gl.vertexAttribPointer(this.instancePositionAttribute, 3, this.gl.FLOAT, false, 16, 0);
      ext.vertexAttribDivisorANGLE(this.instancePositionAttribute, 1);

      this.gl.enableVertexAttribArray(this.instanceBrightnessAttribute);
      this.gl.vertexAttribPointer(
        this.instanceBrightnessAttribute,
        1,
        this.gl.FLOAT,
        false,
        16,
        12
      );
      ext.vertexAttribDivisorANGLE(this.instanceBrightnessAttribute, 1);
    }

    // Bind character texture
    const charTexture = this.textures.get("characters");
    if (charTexture) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, charTexture);
      const textureLocation = this.gl.getUniformLocation(this.program, "u_charTexture");
      this.gl.uniform1i(textureLocation, 0);
    }

    // Set additional uniforms
    const charSizeLocation = this.gl.getUniformLocation(this.program, "u_charSize");
    this.gl.uniform1f(charSizeLocation, this.charSize);

    const charCountLocation = this.gl.getUniformLocation(this.program, "u_charCount");
    this.gl.uniform1f(charCountLocation, CHAR_ARRAY.length);

    // Draw all particles with instancing
    ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, this.totalParticles);

    // Reset divisors
    ext.vertexAttribDivisorANGLE(this.instancePositionAttribute, 0);
    ext.vertexAttribDivisorANGLE(this.instanceBrightnessAttribute, 0);
  }

  protected handleResize(): void {
    super.handleResize();
    // Reinitialize columns on resize
    this.initializeColumns();
  }
}
