import type { Control, Hitbox } from '../controls/Control';
import type { CanvasHost } from '../canvas/CanvasHost';

export abstract class ModuleBase implements Control {
  x: number;
  y: number;
  width: number;
  height: number;
  host?: CanvasHost;

  protected _children: Control[] = [];

  constructor(x: number, y: number, width: number, height: number, host?: CanvasHost) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.host = host;
  }

  get childControls(): Control[] {
    return this._children;
  }

  fitFrame(padding = 10, titleHeight = 0): void {
    if (this._children.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of this._children) {
      const bb = c.boundingBox();
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.w);
      maxY = Math.max(maxY, bb.y + bb.h);
    }
    const dx = this.x + padding - minX;
    const dy = this.y + titleHeight + padding - minY;
    for (const c of this._children) {
      c.x += dx;
      c.y += dy;
    }
    this.width = maxX - minX + padding * 2;
    this.height = maxY - minY + titleHeight + padding * 2;
  }

  boundingBox(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  hitbox(): Hitbox | Hitbox[] {
    const result: Hitbox[] = [];
    for (const c of this._children) {
      const hb = c.hitbox();
      if (Array.isArray(hb)) result.push(...hb);
      else result.push(hb);
    }
    return result;
  }

  hitTest(px: number, py: number): boolean {
    for (const c of this._children) {
      if (c.hitTest(px, py)) return true;
    }
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  onPointerDown(e: PointerEvent, x: number, y: number): void {
    for (const c of this._children) {
      if (c.hitTest(x, y)) {
        c.onPointerDown?.(e, x, y);
        return;
      }
    }
  }

  onPointerMove(e: PointerEvent, x: number, y: number): void {
    for (const c of this._children) {
      c.onPointerMove?.(e, x, y);
    }
  }

  onPointerUp(e: PointerEvent, x: number, y: number): void {
    for (const c of this._children) {
      c.onPointerUp?.(e, x, y);
    }
  }

  abstract render(ctx: CanvasRenderingContext2D): void;
  dispose(): void {
    for (const c of this._children) c.dispose?.();
  }
}
