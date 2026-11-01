import { watch, type Ref } from 'vue';
import type { Control } from './Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { showHitboxes } from '../canvas/debug';

export interface ControlBaseOptions {
  min?: number;
  max?: number;
  step?: number;
  value: Ref<number>;
  label?: string;
  host?: CanvasHost;
}

export abstract class ControlBase implements Control {
  host?: CanvasHost;
  min: number;
  max: number;
  step: number;
  value: Ref<number>;
  label: string;

  protected dragging = false;
  protected startY = 0;
  protected startValue = 0;

  constructor(options: ControlBaseOptions) {
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this.step = options.step ?? 0;
    this.value = options.value;
    this.label = options.label ?? '';
    this.host = options.host;

    watch(this.value, () => this.host?.requestRedraw(), { flush: 'post' });
    watch(showHitboxes, () => this.host?.requestRedraw(), { flush: 'post' });
  }

  protected clamp(next: number): number {
    return Math.min(this.max, Math.max(this.min, next));
  }

  protected applyStep(next: number): number {
    if (this.step > 0) {
      return Math.round(next / this.step) * this.step;
    }
    return next;
  }

  protected normalized(): number {
    const range = this.max - this.min || 1;
    return (this.value.value - this.min) / range;
  }

  protected updateFromPointer(deltaPx: number, totalPx: number): void {
    const delta = deltaPx / (totalPx || 1);
    let next = this.startValue + delta * (this.max - this.min);
    next = this.clamp(next);
    next = this.applyStep(next);
    this.value.value = next;
  }

  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract hitTest(x: number, y: number): boolean;
  abstract boundingBox(): { x: number; y: number; w: number; h: number };
  abstract hitbox():
    | { type: 'circle'; cx: number; cy: number; r: number }
    | { type: 'rect'; x: number; y: number; w: number; h: number }
    | (
        | { type: 'circle'; cx: number; cy: number; r: number }
        | { type: 'rect'; x: number; y: number; w: number; h: number }
      )[];
}
