# Simple Synth

A subtractive synthesizer demo built with canvas-based modules. All synth logic runs in TypeScript; Vue is used only for page scaffolding.

**Live demo:** https://meesayen.github.io/simple-synth/

## Motivation

I built this project just for fun: I wanted to play around with the **Web Audio API** and drawing on **canvas**, putting together a subtractive synth with a fully canvas-rendered UI from scratch.

## Features

- Polyphonic voice manager (8 voices) with ADSR envelope
- Modules: Oscillator, Filter (with slope), Envelope, LFO, Mix, Delay, Reverb, Output, Keyboard
- Canvas-rendered UI (knobs, sliders, toggles, wave selectors)
- Preset system (IndexedDB) with factory presets: Pixie, Acid Bass, Warm Pad, Bright Lead, Pluck, Deep Bass
- Save / load configurations
- Keyboard input (QWERTY) with octave selector

## Tech stack

- Vite+ (Vite, Vue 3, TypeScript, Tailwind v4)
- Web Audio API
- Canvas 2D

## Development

```bash
pnpm install
pnpm run dev
```

## Build

```bash
pnpm run build        # output in dist/
pnpm run build:pages  # output in docs/ (for GitHub Pages)
```

## Deploy

Pushing to `main` or `master` triggers the GitHub Actions workflow that builds and deploys to GitHub Pages.

## License

MIT
