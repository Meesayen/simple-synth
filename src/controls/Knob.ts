import { type Ref } from 'vue';
import { ControlBase, type ControlBaseOptions } from './ControlBase';
import { showHitboxes } from '../canvas/debug';

export interface KnobOptions extends ControlBaseOptions {
  x: number;
  y: number;
  radius?: number;
  value: Ref<number>;
}

export class Knob extends ControlBase {
  x: number;
  y: number;
  radius: number;

  constructor(options: KnobOptions) {
    super(options);
    this.x = options.x;
    this.y = options.y;
    this.radius = options.radius ?? 32;
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
    this.updateFromPointer(this.startY - y, 120);
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const norm = this.normalized();
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
