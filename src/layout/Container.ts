import type { Control, Hitbox } from '../controls/Control';

export abstract class Container implements Control {
  protected _x = 0;
  protected _y = 0;
  readonly children: Control[];
  spacing = 8;
  cols = 1;
  hSpacing = 8;
  vSpacing = 8;

  constructor(x: number, y: number, children: Control[]) {
    this.children = children;
    this._x = x;
    this._y = y;
    this.layoutAt(x, y);
  }

  get x(): number {
    return this._x;
  }
  set x(v: number) {
    const dx = v - this._x;
    this._x = v;
    for (const c of this.children) c.x += dx;
  }

  get y(): number {
    return this._y;
  }
  set y(v: number) {
    const dy = v - this._y;
    this._y = v;
    for (const c of this.children) c.y += dy;
  }

  get childControls(): Control[] {
    return this.children;
  }

  protected abstract layoutAt(x: number, y: number): void;

  render(ctx: CanvasRenderingContext2D): void {
    for (const c of this.children) c.render(ctx);
  }

  hitTest(px: number, py: number): boolean {
    return this.children.some((c) => c.hitTest(px, py));
  }

  hitbox(): Hitbox | Hitbox[] {
    const result: Hitbox[] = [];
    for (const c of this.children) {
      const hb = c.hitbox();
      if (Array.isArray(hb)) result.push(...hb);
      else result.push(hb);
    }
    return result;
  }

  boundingBox(): { x: number; y: number; w: number; h: number } {
    if (this.children.length === 0) {
      return { x: this._x, y: this._y, w: 0, h: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of this.children) {
      const bb = c.boundingBox();
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.w);
      maxY = Math.max(maxY, bb.y + bb.h);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  onPointerDown(e: PointerEvent, x: number, y: number): void {
    for (const c of this.children) {
      if (c.hitTest(x, y)) {
        c.onPointerDown?.(e, x, y);
        return;
      }
    }
  }

  onPointerMove(e: PointerEvent, x: number, y: number): void {
    for (const c of this.children) {
      c.onPointerMove?.(e, x, y);
    }
  }

  onPointerUp(e: PointerEvent, x: number, y: number): void {
    for (const c of this.children) {
      c.onPointerUp?.(e, x, y);
    }
  }

  dispose(): void {
    for (const c of this.children) c.dispose?.();
  }
}

export class VStack extends Container {
  align: 'left' | 'center' | 'right';

  constructor(
    x: number,
    y: number,
    children: Control[],
    spacing = 8,
    align: 'left' | 'center' | 'right' = 'left',
  ) {
    super(x, y, children);
    this.spacing = spacing;
    this.align = align;
    this.layoutAt(x, y);
  }

  protected layoutAt(x: number, y: number): void {
    let curY = y;
    let maxW = 0;
    for (const c of this.children) {
      maxW = Math.max(maxW, c.boundingBox().w);
    }
    for (const c of this.children) {
      const bb = c.boundingBox();
      const offsetX = bb.x - c.x;
      const offsetY = bb.y - c.y;
      if (this.align === 'center') {
        c.x = x + (maxW - bb.w) / 2 - offsetX;
      } else if (this.align === 'right') {
        c.x = x + (maxW - bb.w) - offsetX;
      } else {
        c.x = x - offsetX;
      }
      c.y = curY - offsetY;
      curY += bb.h + this.spacing;
    }
  }
}

export class HStack extends Container {
  align: 'top' | 'center' | 'bottom';
  justify: 'start' | 'between';
  fixedWidth?: number;

  constructor(
    x: number,
    y: number,
    children: Control[],
    spacing = 8,
    align: 'top' | 'center' | 'bottom' = 'top',
    fixedWidth?: number,
    justify: 'start' | 'between' = 'start',
  ) {
    super(x, y, children);
    this.spacing = spacing;
    this.align = align;
    this.fixedWidth = fixedWidth;
    this.justify = justify;
    this.layoutAt(x, y);
  }

  protected layoutAt(x: number, y: number): void {
    const positions: number[] = [];
    let curX = x;
    let maxH = 0;
    const bbs = this.children.map((c) => c.boundingBox());
    for (const bb of bbs) maxH = Math.max(maxH, bb.h);

    if (this.fixedWidth && this.justify === 'between' && this.children.length > 1) {
      const totalW = bbs.reduce((s, bb) => s + bb.w, 0);
      const gap = (this.fixedWidth - totalW) / (this.children.length - 1);
      curX = x;
      for (let i = 0; i < this.children.length; i++) {
        positions.push(curX);
        curX += bbs[i].w + gap;
      }
    } else {
      for (let i = 0; i < this.children.length; i++) {
        positions.push(curX);
        curX += bbs[i].w + this.spacing;
      }
    }

    let i = 0;
    for (const c of this.children) {
      const bb = bbs[i];
      const offsetX = bb.x - c.x;
      c.x = positions[i] - offsetX;
      const offsetY =
        this.align === 'center' ? (maxH - bb.h) / 2 : this.align === 'bottom' ? maxH - bb.h : 0;
      const offsetYOrigin = bb.y - c.y;
      c.y = y + offsetY - offsetYOrigin;
      i++;
    }
  }

  boundingBox(): { x: number; y: number; w: number; h: number } {
    const bb = super.boundingBox();
    if (this.fixedWidth) {
      return { x: bb.x, y: bb.y, w: this.fixedWidth, h: bb.h };
    }
    return bb;
  }
}

export class Grid extends Container {
  cols: number;
  hSpacing: number;
  vSpacing: number;

  constructor(x: number, y: number, children: Control[], cols = 2, hSpacing = 8, vSpacing = 8) {
    super(x, y, children);
    this.cols = cols;
    this.hSpacing = hSpacing;
    this.vSpacing = vSpacing;
    this.layoutAt(x, y);
  }

  protected layoutAt(x: number, y: number): void {
    let curX = x;
    let curY = y;
    let col = 0;
    let rowHeight = 0;
    for (const c of this.children) {
      const bb0 = c.boundingBox();
      const offsetX0 = bb0.x - c.x;
      const offsetY0 = bb0.y - c.y;
      c.x = curX - offsetX0;
      c.y = curY - offsetY0;
      const bb = c.boundingBox();
      rowHeight = Math.max(rowHeight, bb.h);
      col++;
      if (col >= this.cols) {
        col = 0;
        curX = x;
        curY += rowHeight + this.vSpacing;
        rowHeight = 0;
      } else {
        curX += bb.w + this.hSpacing;
      }
    }
  }
}
