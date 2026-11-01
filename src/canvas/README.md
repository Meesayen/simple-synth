# Canvas Host

The canvas host owns the single `<canvas>` element and drives rendering.

## Responsibilities

- `requestAnimationFrame` render loop.
- DPR-aware sizing and resize handling.
- Dirty flag: redraw only when `requestRedraw()` is called.
- Top-down hit-testing and pointer event dispatch to controls/modules.
- Coordinate conversion (CSS pixels <-> canvas units).

## Reactivity integration

- Modules/controls hold `ref` state (Vue reactivity).
- Watchers call `canvasHost.requestRedraw()` on change.
- The loop checks the dirty flag and redraws modules + controls.
