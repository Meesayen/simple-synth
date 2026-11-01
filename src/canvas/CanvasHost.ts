import { watch } from 'vue';
import type { Control } from '../controls/Control';
import { showHitboxes, showBBoxes } from './debug';

export class CanvasHost {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private controls: Control[] = [];
  private dirty = true;
  private rafId = 0;
  private dragging: Control | null = null;
  private dpr = window.devicePixelRatio || 1;
  private cssWidth = 0;
  private cssHeight = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not available');
    this.ctx = ctx;
    // Capture CSS size from the initial attributes before overwriting them.
    this.cssWidth = Math.max(1, canvas.width || 1);
    this.cssHeight = Math.max(1, canvas.height || 1);
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
    this.canvas.width = Math.max(1, Math.round(this.cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.cssHeight * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    window.addEventListener('resize', this.handleWindowResize);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    watch(showHitboxes, () => this.requestRedraw());
    watch(showBBoxes, () => this.requestRedraw());
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
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
    this.canvas.width = Math.max(1, Math.round(this.cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.cssHeight * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.dirty = true;
  };

  private loop = (): void => {
    if (this.dirty) {
      this.dirty = false;
      const w = this.canvas.width / this.dpr;
      const h = this.canvas.height / this.dpr;
      this.ctx.clearRect(0, 0, w, h);
      for (const control of this.controls) control.render(this.ctx);
      // Debug overlays (centralized)
      if (showHitboxes.value) {
        for (const control of this.controls) {
          const hb = control.hitbox();
          const list = Array.isArray(hb) ? hb : [hb];
          this.ctx.strokeStyle = '#ef4444';
          this.ctx.lineWidth = 1.5;
          this.ctx.setLineDash([4, 3]);
          for (const h of list) {
            if (h.type === 'circle') {
              this.ctx.beginPath();
              this.ctx.arc(h.cx, h.cy, h.r, 0, Math.PI * 2);
              this.ctx.stroke();
            } else {
              this.ctx.strokeRect(h.x, h.y, h.w, h.h);
            }
          }
          this.ctx.setLineDash([]);
        }
      }
      if (showBBoxes.value) {
        for (const control of this.controls) {
          const drawBBox = (bb: { x: number; y: number; w: number; h: number }, color: string) => {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1.5;
            this.ctx.setLineDash([4, 3]);
            this.ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);
            this.ctx.setLineDash([]);
          };
          drawBBox(control.boundingBox(), '#3b82f6');
          if (control.childControls) {
            for (const child of control.childControls) {
              drawBBox(child.boundingBox(), '#60a5fa');
            }
          }
        }
      }
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
    for (const control of this.controls) control.dispose?.();
    window.removeEventListener('resize', this.handleWindowResize);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
  }
}
