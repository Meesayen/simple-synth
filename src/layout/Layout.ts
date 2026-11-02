import type { Control } from '../controls/Control';

export function vstack(controls: Control[], x: number, y: number, spacing = 8): void {
  let curY = y;
  for (const c of controls) {
    c.x = x;
    c.y = curY;
    curY += c.boundingBox().h + spacing;
  }
}

export function hstack(controls: Control[], x: number, y: number, spacing = 8): void {
  let curX = x;
  for (const c of controls) {
    c.x = curX;
    c.y = y;
    curX += c.boundingBox().w + spacing;
  }
}

export function grid(
  controls: Control[],
  x: number,
  y: number,
  cols: number,
  hSpacing = 8,
  vSpacing = 8,
): void {
  let curX = x;
  let curY = y;
  let col = 0;
  let rowHeight = 0;
  for (const c of controls) {
    c.x = curX;
    c.y = curY;
    const bb = c.boundingBox();
    rowHeight = Math.max(rowHeight, bb.h);
    col++;
    if (col >= cols) {
      col = 0;
      curX = x;
      curY += rowHeight + vSpacing;
      rowHeight = 0;
    } else {
      curX += bb.w + hSpacing;
    }
  }
}
