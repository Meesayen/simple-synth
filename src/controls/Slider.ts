import { type Ref } from 'vue';
import { ControlBase, type ControlBaseOptions } from './ControlBase';
import { showHitboxes } from '../canvas/debug';

export interface SliderOptions extends ControlBaseOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  value: Ref<number>;
}

export class Slider extends ControlBase {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(options: SliderOptions) {
    super(options);
    this.x = options.x;
    this.y = options.y;
    this.width = options.width ?? 16;
    this.height = options.height ?? 120;
  }

  hitTest(x: number, y: number): boolean {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  onPointerDown(_e: PointerEvent, _x: number, y: number): void {
    this.dragging = true;
    const norm = 1 - (y - this.y) / this.height;
    let next = this.min + Math.min(1, Math.max(0, norm)) * (this.max - this.min);
    next = Math.min(this.max, Math.max(this.min, next));
    if (this.step > 0) {
      next = Math.round(next / this.step) * this.step;
    }
    this.value.value = next;
    this.startY = y;
    this.startValue = this.value.value;
  }

  onPointerMove(_e: PointerEvent, _x: number, y: number): void {
    if (!this.dragging) return;
    this.updateFromPointer(this.startY - y, this.height);
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const norm = this.normalized();
    const thumbY = this.y + this.height - norm * this.height;
    const radius = this.width / 2;

    // track
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // fill (clipped to the rounded track)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.clip();
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(this.x, thumbY, this.width, this.y + this.height - thumbY);
    ctx.restore();

    // thumb with top shadow (light from above)
    const thumbGradient = ctx.createLinearGradient(this.x - 4, thumbY - 7, this.x - 4, thumbY + 7);
    thumbGradient.addColorStop(0, '#cbd5e1');
    thumbGradient.addColorStop(1, '#f1f5f9');
    ctx.beginPath();
    ctx.roundRect(this.x - 4, thumbY - 7, this.width + 8, 14, 4);
    ctx.fillStyle = thumbGradient;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // grip lines (slightly transparent)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, thumbY - 2);
    ctx.lineTo(this.x + this.width, thumbY - 2);
    ctx.moveTo(this.x, thumbY + 2);
    ctx.lineTo(this.x + this.width, thumbY + 2);
    ctx.stroke();

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

    // value
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(this.value.value.toFixed(2), this.x + this.width / 2, this.y + this.height + 6);
  }
}
