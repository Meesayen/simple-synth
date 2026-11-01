import { watch, type Ref } from 'vue';
import type { Control } from './Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { showHitboxes } from '../canvas/debug';

export interface KnobOptions {
  x: number;
  y: number;
  radius?: number;
  min?: number;
  max?: number;
  step?: number;
  value: Ref<number>;
  label?: string;
  host?: CanvasHost;
}

export class Knob implements Control {
  host?: CanvasHost;
  x: number;
  y: number;
  radius: number;
  min: number;
  max: number;
  step: number;
  value: Ref<number>;
  label: string;

  private dragging = false;
  private startY = 0;
  private startValue = 0;

  constructor(options: KnobOptions) {
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius ?? 32;
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this.step = options.step ?? 0;
    this.value = options.value;
    this.label = options.label ?? '';
    this.host = options.host;

    watch(this.value, () => this.host?.requestRedraw(), { flush: 'post' });
    watch(showHitboxes, () => this.host?.requestRedraw(), { flush: 'post' });
  }

  hitTest(x: number, y: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  onPointerDown(_e: PointerEvent, _x: number, y: number): void {
    this.dragging = true;
    this.startY = y;
    this.startValue = this.value.value;
  }

  onPointerMove(_e: PointerEvent, _x: number, y: number): void {
    if (!this.dragging) return;
    const delta = (this.startY - y) / 120;
    let next = this.startValue + delta * (this.max - this.min);
    next = Math.min(this.max, Math.max(this.min, next));
    if (this.step > 0) {
      next = Math.round(next / this.step) * this.step;
    }
    this.value.value = next;
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const norm = (this.value.value - this.min) / (this.max - this.min || 1);
    const startAngle = Math.PI * 0.75;
    const sweep = Math.PI * 1.5;
    const angle = startAngle + norm * sweep;

    // track
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, startAngle, startAngle + sweep);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // value arc
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, startAngle, angle);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // knob body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius - 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // indicator
    const ix = this.x + Math.cos(angle) * (this.radius - 12);
    const iy = this.y + Math.sin(angle) * (this.radius - 12);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(ix, iy);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // hitbox (debug)
    if (showHitboxes.value) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.label, this.x, this.y + this.radius + 6);

    // value
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(this.value.value.toFixed(2), this.x, this.y + this.radius + 20);
  }
}
