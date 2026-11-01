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
  host?: CanvasHost;
}

export class Toggle implements Control {
  host?: CanvasHost;
  x: number;
  y: number;
  width: number;
  height: number;
  value: Ref<boolean>;
  label: string;

  constructor(options: ToggleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width ?? 44;
    this.height = options.height ?? 24;
    this.value = options.value;
    this.label = options.label ?? '';
    this.host = options.host;

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

  render(ctx: CanvasRenderingContext2D): void {
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

    // hitbox (debug)
    if (showHitboxes.value) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      ctx.setLineDash([]);
    }

    // label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.label, this.x + this.width / 2, this.y - 6);

    // state
    ctx.fillStyle = isOn ? '#818cf8' : '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(isOn ? 'ON' : 'OFF', this.x + this.width / 2, this.y + this.height + 6);
  }
}
