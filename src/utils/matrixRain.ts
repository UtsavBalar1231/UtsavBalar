import { VisualEffect, MATRIX_CONSTANTS } from "./visualEffect";

const MATRIX_CHARS = "01ABCDEF!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789";
const CHAR_ARRAY = MATRIX_CHARS.split("");

interface MatrixDrop {
  y: number;
  chars: string[];
  charChangeCounters: number[];
}

export class MatrixRainEffect extends VisualEffect {
  private columns: number = 0;
  private drops: MatrixDrop[] = [];
  private columnWidth: number = MATRIX_CONSTANTS.FONT_SIZE;

  constructor() {
    super({
      canvasId: "matrix-rain-canvas",
      targetFPS: 30,
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "green-phosphor" && !this.checkPerformanceMode();
  }

  protected onResize(): void {
    if (!this.canvas) return;

    this.columns = Math.floor(this.canvas.width / this.columnWidth);
    this.initializeDrops();
  }

  private initializeDrops(): void {
    this.drops = [];
    const rowsPerColumn = Math.ceil(window.innerHeight / MATRIX_CONSTANTS.FONT_SIZE) + 1;

    for (let i = 0; i < this.columns; i++) {
      const chars = [];
      const charChangeCounters = [];

      for (let j = 0; j < rowsPerColumn; j++) {
        chars.push(CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)]);
        charChangeCounters.push(0);
      }

      this.drops.push({
        y: Math.random() * -100,
        chars,
        charChangeCounters,
      });
    }
  }

  protected update(): void {
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];

      for (let j = 0; j < drop.chars.length; j++) {
        drop.charChangeCounters[j]++;

        if (Math.random() < MATRIX_CONSTANTS.CHAR_CHANGE_PROBABILITY * drop.charChangeCounters[j]) {
          drop.chars[j] = CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)];
          drop.charChangeCounters[j] = 0;
        }
      }

      drop.y += MATRIX_CONSTANTS.DROP_SPEED;

      const maxY = drop.chars.length;
      if (drop.y > maxY) {
        drop.y = Math.random() * -50;

        for (let j = 0; j < drop.chars.length; j++) {
          drop.chars[j] = CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)];
          drop.charChangeCounters[j] = 0;
        }
      }
    }
  }

  protected render(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = `rgba(0, 0, 0, ${MATRIX_CONSTANTS.FADE_SPEED})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = `${MATRIX_CONSTANTS.FONT_SIZE}px "DepartureMono Nerd Font", monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      const x = i * this.columnWidth;

      for (let j = 0; j < drop.chars.length; j++) {
        const y = (drop.y + j) * MATRIX_CONSTANTS.FONT_SIZE;

        if (y > 0 && y < this.canvas.height + MATRIX_CONSTANTS.FONT_SIZE) {
          const opacity = 1 - j / drop.chars.length;
          const brightness = j === 0 ? 255 : Math.floor(100 + opacity * 155);

          this.ctx.fillStyle = `rgba(0, ${brightness}, 0, ${opacity})`;
          this.ctx.fillText(drop.chars[j], x, y);
        }
      }
    }
  }
}
