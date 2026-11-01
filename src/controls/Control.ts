import type { CanvasHost } from '../canvas/CanvasHost';

export type Hitbox =
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number };

export interface Control {
  host?: CanvasHost;
  render(ctx: CanvasRenderingContext2D): void;
  hitTest(x: number, y: number): boolean;
  boundingBox(): { x: number; y: number; w: number; h: number };
  hitbox(): Hitbox | Hitbox[];
  childControls?: Control[];
  onPointerDown?(e: PointerEvent, x: number, y: number): void;
  onPointerMove?(e: PointerEvent, x: number, y: number): void;
  onPointerUp?(e: PointerEvent, x: number, y: number): void;
  dispose?(): void;
}
