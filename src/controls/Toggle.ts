import { watch, type Ref } from 'vue';
import type { Control } from './Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { showHitboxes } from '../canvas/debug';

export interface ToggleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  value: Ref<boolean>;
  label?: string;
  showState?: boolean;
  host?: CanvasHost;
  vertical?: boolean;
}

export class Toggle implements Control {
  host?: CanvasHost;
  x: number;
  y: number;
  width: number;
  height: number;
  value: Ref<boolean>;
  label: string;
  showState: boolean;
  vertical: boolean;

  constructor(options: ToggleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width ?? 44;
    this.height = options.height ?? 24;
    this.value = options.value;
    this.label = options.label ?? '';
    this.showState = options.showState ?? true;
    this.host = options.host;
    this.vertical = options.vertical ?? false;
    if (this.vertical) {
      const tmp = this.width;
      this.width = this.height;
      this.height = tmp;
    }

    watch(this.value, () => this.host?.requestRedraw(), { flush: 'post' });
    watch(showHitboxes, () => this.host?.requestRedraw(), { flush: 'post' });
  }

  hitTest(x: number, y: number): boolean {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  onPointerDown(_e: PointerEvent, _x: number, _y: number): void {
    this.value.value = !this.value.value;
  }

  onPointerMove(): void {
    // no-op
  }

  onPointerUp(): void {
    // no-op
  }

  hitbox(): { type: 'rect'; x: number; y: number; w: number; h: number } {
    return { type: 'rect', x: this.x, y: this.y, w: this.width, h: this.height };
  }

  boundingBox(): { x: number; y: number; w: number; h: number } {
    const topMargin = this.label ? 17 : 0;
    const bottomMargin = this.showState ? 16 : 0;
    return {
      x: this.x,
      y: this.y - topMargin,
      w: this.width,
      h: this.height + topMargin + bottomMargin,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.vertical) {
      this.drawHorizontal(ctx);
      return;
    }
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 2);
    const origX = this.x;
    const origY = this.y;
    const origW = this.width;
    const origH = this.height;
    this.x = -origH / 2;
    this.y = -origW / 2;
    this.width = origH;
    this.height = origW;
    this.drawHorizontal(ctx);
    this.x = origX;
    this.y = origY;
    this.width = origW;
    this.height = origH;
    ctx.restore();
  }

  private drawHorizontal(ctx: CanvasRenderingContext2D): void {
    const isOn = this.value.value;
    const radius = 3;
    const innerW = this.width - 10;
    const innerH = this.height - 10;
    const innerX = this.x + 5;
    const innerY = this.y + 5;

    // body
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // inner light
    ctx.save();
    if (isOn) {
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.roundRect(innerX, innerY, innerW, innerH, 2);
    ctx.fillStyle = isOn ? '#818cf8' : '#334155';
    ctx.fill();
    ctx.restore();

    // inner part has no border

    // label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.label, this.x + this.width / 2, this.y - 6);

    // state (optional)
    if (this.showState) {
      ctx.fillStyle = isOn ? '#818cf8' : '#94a3b8';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(isOn ? 'ON' : 'OFF', this.x + this.width / 2, this.y + this.height + 6);
    }
  }
}
