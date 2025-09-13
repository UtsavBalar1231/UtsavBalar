import { VisualEffect, FIRE_CONSTANTS } from "./visualEffect";

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

export class DoomFireEffect extends VisualEffect {
  private firePixels: number[] = [];
  private pixelSize: number = 1;

  constructor() {
    super({
      canvasId: "doom-fire-canvas",
      targetFPS: 30,
      themeAttribute: "data-theme",
      performanceAttribute: "data-performance",
    });
  }

  protected shouldShow(): boolean {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "doom-red" && !this.checkPerformanceMode();
  }

  protected onResize(): void {
    this.pixelSize = Math.ceil(
      Math.max(window.innerWidth / FIRE_CONSTANTS.WIDTH, window.innerHeight / FIRE_CONSTANTS.HEIGHT)
    );
  }

  protected start(): void {
    this.firePixels = new Array(FIRE_CONSTANTS.WIDTH * FIRE_CONSTANTS.HEIGHT).fill(0);
    this.createFireSource();
    super.start();
  }

  private createFireSource(): void {
    const baseIndex = FIRE_CONSTANTS.WIDTH * (FIRE_CONSTANTS.HEIGHT - 1);
    for (let column = 0; column < FIRE_CONSTANTS.WIDTH; column++) {
      this.firePixels[baseIndex + column] = FIRE_CONSTANTS.MAX_INTENSITY;
    }
  }

  protected update(): void {
    for (let column = 0; column < FIRE_CONSTANTS.WIDTH; column++) {
      for (let row = 0; row < FIRE_CONSTANTS.HEIGHT - 1; row++) {
        const pixelIndex = column + FIRE_CONSTANTS.WIDTH * row;
        this.updateFireIntensityPerPixel(pixelIndex);
      }
    }
  }

  private updateFireIntensityPerPixel(currentPixelIndex: number): void {
    const belowPixelIndex = currentPixelIndex + FIRE_CONSTANTS.WIDTH;

    if (belowPixelIndex >= FIRE_CONSTANTS.WIDTH * FIRE_CONSTANTS.HEIGHT) {
      return;
    }

    const decay = Math.floor(Math.random() * FIRE_CONSTANTS.DECAY_RANGE);
    const belowPixelFireIntensity = this.firePixels[belowPixelIndex];
    const newFireIntensity = Math.max(0, belowPixelFireIntensity - decay);

    const spread = Math.floor(Math.random() * FIRE_CONSTANTS.SPREAD_RANGE) - 1;
    const targetPixelIndex = currentPixelIndex + spread;

    if (targetPixelIndex >= 0 && targetPixelIndex < this.firePixels.length) {
      this.firePixels[targetPixelIndex] = newFireIntensity;
    }
  }

  protected render(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let row = 0; row < FIRE_CONSTANTS.HEIGHT; row++) {
      for (let column = 0; column < FIRE_CONSTANTS.WIDTH; column++) {
        const pixelIndex = column + FIRE_CONSTANTS.WIDTH * row;
        const fireIntensity = this.firePixels[pixelIndex];

        if (fireIntensity > 0) {
          const color = FIRE_PALETTE[Math.min(fireIntensity, FIRE_PALETTE.length - 1)];
          this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

          const x = column * this.pixelSize;
          const y = this.canvas.height - (FIRE_CONSTANTS.HEIGHT - row) * this.pixelSize;

          this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
        }
      }
    }
  }
}
