import type { Control, Hitbox } from '../controls/Control';
import type { CanvasHost } from '../canvas/CanvasHost';

export abstract class ModuleBase implements Control {
  protected _x = 0;
  protected _y = 0;
  width: number;
  height: number;
  host?: CanvasHost;
  protected _children: Control[] = [];

  constructor(x: number, y: number, width: number, height: number, host?: CanvasHost) {
    this.width = width;
    this.height = height;
    this.host = host;
    // Set position via setters (moves children, but none yet)
    this._x = x;
    this._y = y;
  }

  get x(): number {
    return this._x;
  }
  set x(v: number) {
    const dx = v - this._x;
    this._x = v;
    for (const c of this._children) c.x += dx;
  }

  get y(): number {
    return this._y;
  }
  set y(v: number) {
    const dy = v - this._y;
    this._y = v;
    for (const c of this._children) c.y += dy;
  }

  get childControls(): Control[] {
    return this._children;
  }

  addControl(control: Control): void {
    this._children.push(control);
  }

  fitFrame(padding = 10, titleHeight = 0): void {
    if (this.childControls.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of this.childControls) {
      const bb = c.boundingBox();
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.w);
      maxY = Math.max(maxY, bb.y + bb.h);
    }
    const dx = this.x + padding - minX;
    const dy = this.y + titleHeight + padding - minY;
    for (const c of this.childControls) {
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
    for (const c of this.childControls) {
      const hb = c.hitbox();
      if (Array.isArray(hb)) result.push(...hb);
      else result.push(hb);
    }
    return result;
  }

  hitTest(px: number, py: number): boolean {
    for (const c of this.childControls) {
      if (c.hitTest(px, py)) return true;
    }
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  onPointerDown(e: PointerEvent, x: number, y: number): void {
    for (const c of this.childControls) {
      if (c.hitTest(x, y)) {
        c.onPointerDown?.(e, x, y);
        return;
      }
    }
  }

  onPointerMove(e: PointerEvent, x: number, y: number): void {
    for (const c of this.childControls) {
      c.onPointerMove?.(e, x, y);
    }
  }

  onPointerUp(e: PointerEvent, x: number, y: number): void {
    for (const c of this.childControls) {
      c.onPointerUp?.(e, x, y);
    }
  }

  abstract render(ctx: CanvasRenderingContext2D): void;
  dispose(): void {
    for (const c of this.childControls) c.dispose?.();
  }
}
