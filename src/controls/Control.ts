import type { CanvasHost } from '../canvas/CanvasHost';

export interface Control {
  host?: CanvasHost;
  render(ctx: CanvasRenderingContext2D): void;
  hitTest(x: number, y: number): boolean;
  boundingBox(): { x: number; y: number; w: number; h: number };
  onPointerDown?(e: PointerEvent, x: number, y: number): void;
  onPointerMove?(e: PointerEvent, x: number, y: number): void;
  onPointerUp?(e: PointerEvent, x: number, y: number): void;
  dispose?(): void;
}
