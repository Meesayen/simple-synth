# Synth Modules

Modules are **plain TypeScript classes**, not Vue components. They are rendered on the
canvas by the canvas host and own their audio nodes.

## Architecture (subtractive synth)

Audio graph (left to right):

```
Oscillator(s) -> Mixer -> Filter -> Envelope (VCA) -> Output (Master)
                      ^            ^
                      |            |
                     LFO --------+
```

## Module contract

Each module implements the `Module` interface:

- `id: string`
- `position: { x: number; y: number }`
- `size: { w: number; h: number }`
- `render(ctx: CanvasRenderingContext2D): void`
- `update(dt: number): void`
- `dispose(): void`
- `controls: Control[]`
- `ports: Port[]`
- audio node references (Web Audio `AudioNode` / `AudioParam`)

## State (Vue Reactivity)

State is managed with Vue reactivity primitives imported from `vue`
(`ref`, `computed`, `watch`, `reactive`), usable outside Vue components:

- Parameters are `ref<number | string | boolean>` (e.g. `frequency = ref(440)`).
- Controls read/write the shared `ref` via pointer events.
- `watch(paramRef, ...)` syncs values to `AudioParam`.
- `watch` on module state triggers `canvasHost.requestRedraw()`.

## Conventions

- File naming: `XxxModule.ts` (class `XxxModule`).
- Composable helpers: `useXxx.ts` when a module needs shared logic.
- No DOM/Vue template logic inside modules.
- Coordinates are in canvas units (fixed layout grid).
- Modules must call `dispose()` to release audio nodes.
