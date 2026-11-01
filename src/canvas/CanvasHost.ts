import type { Control } from '../controls/Control';

export class CanvasHost {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private controls: Control[] = [];
  private dirty = true;
  private rafId = 0;
  private dragging: Control | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
    this.resizeTo(this.canvas.clientWidth, this.canvas.clientHeight);
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resizeTo(width, height);
      }
    });
    this.resizeObserver.observe(this.canvas);
    window.addEventListener('resize', this.handleWindowResize);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    this.loop();
  }

  add(control: Control): void {
    control.host = this;
    this.controls.push(control);
    this.requestRedraw();
  }

  remove(control: Control): void {
    this.controls = this.controls.filter((c) => c !== control);
    this.requestRedraw();
  }

  requestRedraw(): void {
    this.dirty = true;
  }

  private handleWindowResize = (): void => {
    this.resizeTo(this.canvas.clientWidth, this.canvas.clientHeight);
  };

  private resizeTo(width: number, height: number): void {
    const w = Math.max(1, Math.round(width || this.canvas.width));
    const h = Math.max(1, Math.round(height || this.canvas.height));
    if (this.canvas.width === w && this.canvas.height === h) {
      this.dirty = true;
      return;
    }
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.dirty = true;
  }

  private loop = (): void => {
    if (this.dirty) {
      this.dirty = false;
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx.clearRect(0, 0, w, h);
      for (const control of this.controls) control.render(this.ctx);
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private toLocal(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private handlePointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    const { x, y } = this.toLocal(e);
    for (let i = this.controls.length - 1; i >= 0; i--) {
      const control = this.controls[i];
      if (control.hitTest(x, y)) {
        this.dragging = control;
        control.onPointerDown?.(e, x, y);
        this.canvas.setPointerCapture(e.pointerId);
        this.requestRedraw();
        return;
      }
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const { x, y } = this.toLocal(e);
    this.dragging.onPointerMove?.(e, x, y);
    this.requestRedraw();
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const { x, y } = this.toLocal(e);
    this.dragging.onPointerUp?.(e, x, y);
    this.dragging = null;
    this.requestRedraw();
  };

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.handleWindowResize);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
  }
}
