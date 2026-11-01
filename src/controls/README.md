# Canvas Controls

Controls are **plain TypeScript classes** rendered on the canvas (no DOM, no Vue
components). They provide the low-level interaction layer for synth modules.

## Control contract

Each control implements the `Control` interface:

- `render(ctx: CanvasRenderingContext2D): void`
- `hitTest(x: number, y: number): boolean`
- `onPointerDown / onPointerMove / onPointerUp`
- `getValue() / setValue(value)`
- `min`, `max`, `step`, `value`, `label`

## Interaction

- Knob / Slider: vertical drag to change value.
- Toggle: click to flip boolean.
- Jack: click-drag to create/remove connections.

## State (Vue Reactivity)

Controls bind to shared `ref` values (see `src/modules/README.md`):

- A control receives a `ref` (or getter/setter) and updates `.value` on input.
- The same `ref` is watched by the owning module to sync audio + redraw.

## Styling

- Palette: slate background (`#0f172a`/`#020617`), indigo accent (`#6366f1`),
  slate text (`#e2e8f0`), borders (`#1e293b`).
- Standard sizes: knob 48px, slider 120x24px, toggle 40x20px.
- All dimensions in canvas units.
