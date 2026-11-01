import { watch, type Ref } from 'vue';
import type { Control } from './Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { showHitboxes } from '../canvas/debug';

export interface WaveSelectorOptions {
  x: number;
  y: number;
  knobRadius?: number;
  vizWidth?: number;
  vizHeight?: number;
  value: Ref<number>;
  label?: string;
  host?: CanvasHost;
}

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'] as const;
const ARC_DEG = 180;
const ARC_RAD = (ARC_DEG * Math.PI) / 180;
const START = -Math.PI / 2; // -90° (North)
const TICK_ANGLES = [START, START + ARC_RAD / 3, START + (ARC_RAD * 2) / 3, START + ARC_RAD];

function normalizeAngle(a: number): number {
  while (a < 0) a += Math.PI * 2;
  while (a >= Math.PI * 2) a -= Math.PI * 2;
  return a;
}

function nearestTick(angle: number): number {
  const a = normalizeAngle(angle);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < TICK_ANGLES.length; i++) {
    const t = normalizeAngle(TICK_ANGLES[i]);
    let diff = Math.abs(t - a);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < bestDist) {
      bestDist = diff;
      best = i;
    }
  }
  return best;
}

export class WaveSelector implements Control {
  host?: CanvasHost;
  x: number;
  y: number;
  knobRadius: number;
  vizWidth: number;
  vizHeight: number;
  value: Ref<number>;
  label: string;

  private rafId = 0;
  private running = true;
  private glowPos = 0;
  private flicker = 1;

  constructor(options: WaveSelectorOptions) {
    this.x = options.x;
    this.y = options.y;
    this.knobRadius = options.knobRadius ?? 22;
    this.vizWidth = options.vizWidth ?? 120;
    this.vizHeight = options.vizHeight ?? this.knobRadius * 2;
    this.value = options.value;
    this.label = options.label ?? '';
    this.host = options.host;

    watch(this.value, () => this.host?.requestRedraw(), { flush: 'post' });
    watch(showHitboxes, () => this.host?.requestRedraw(), { flush: 'post' });

    this.rafId = requestAnimationFrame(this.animate);
  }

  private animate = (): void => {
    if (!this.running) return;
    if (this.host) {
      this.glowPos = (this.glowPos + 0.004) % 1;
      // Random flicker: occasional dip in brightness.
      if (Math.random() < 0.06) {
        this.flicker = 0.35 + Math.random() * 0.35;
      } else {
        this.flicker = Math.min(1, this.flicker + 0.08);
      }
      this.host.requestRedraw();
    }
    this.rafId = requestAnimationFrame(this.animate);
  };

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  get waveform(): string {
    const idx = Math.max(0, Math.min(3, Math.round(this.value.value)));
    return WAVEFORMS[idx];
  }

  get knobCenterY(): number {
    // Vertically center the knob against the visualizer only (label excluded).
    return this.y + this.vizHeight / 2;
  }

  hitTest(px: number, py: number): boolean {
    const cx = this.x + this.knobRadius;
    const cy = this.knobCenterY;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= this.knobRadius * this.knobRadius;
  }

  onPointerDown(_e: PointerEvent, px: number, py: number): void {
    this.updateFromPointer(px, py);
  }

  onPointerMove(_e: PointerEvent, px: number, py: number): void {
    this.updateFromPointer(px, py);
  }

  onPointerUp(): void {
    // no-op
  }

  private updateFromPointer(px: number, py: number): void {
    const cx = this.x + this.knobRadius;
    const cy = this.knobCenterY;
    const angle = Math.atan2(py - cy, px - cx);
    const idx = nearestTick(angle);
    this.value.value = idx;
  }

  hitbox(): { type: 'circle'; cx: number; cy: number; r: number } {
    return {
      type: 'circle',
      cx: this.x + this.knobRadius,
      cy: this.knobCenterY,
      r: this.knobRadius,
    };
  }

  boundingBox(): { x: number; y: number; w: number; h: number } {
    const cx = this.x + this.knobRadius;
    const cy = this.knobCenterY;
    const tickExtent = this.knobRadius + 11;
    const vizX = this.x + this.knobRadius * 2 + 28;
    const vizW = this.vizWidth;
    const vizH = this.vizHeight;
    const minX = Math.min(this.x, cx - tickExtent);
    const maxX = Math.max(cx + tickExtent, vizX + vizW);
    const minY = Math.min(this.y, cy - tickExtent);
    const maxY = Math.max(cy + tickExtent, this.y + vizH + 14);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.knobRadius;
    const cy = this.knobCenterY;
    const idx = Math.max(0, Math.min(3, Math.round(this.value.value)));
    const selectedAngle = TICK_ANGLES[idx];

    // knob body
    ctx.beginPath();
    ctx.arc(cx, cy, this.knobRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ticks
    for (let i = 0; i < TICK_ANGLES.length; i++) {
      const a = TICK_ANGLES[i];
      const tx = cx + Math.cos(a) * (this.knobRadius + 11);
      const ty = cy + Math.sin(a) * (this.knobRadius + 11);
      const wave = WAVEFORMS[i];
      const size = 10;
      const ix = tx - size / 2;
      const iy = ty - size / 2;
      ctx.beginPath();
      ctx.strokeStyle = i === idx ? '#818cf8' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let k = 0; k <= size; k++) {
        const t = k / size;
        const phase = t * Math.PI * 2;
        let sample = 0;
        switch (wave) {
          case 'sine':
            sample = Math.sin(phase);
            break;
          case 'triangle':
            sample = 1 - 4 * Math.abs(t - 0.5);
            break;
          case 'sawtooth':
            sample = 2 * (t - Math.floor(t + 0.5));
            break;
          case 'square':
            sample = Math.sin(phase) >= 0 ? 1 : -1;
            break;
        }
        const px = ix + k;
        const py = iy + size / 2 - sample * (size / 2 - 1);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // indicator
    const ix = cx + Math.cos(selectedAngle) * (this.knobRadius - 4);
    const iy = cy + Math.sin(selectedAngle) * (this.knobRadius - 4);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ix, iy);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // visualizer
    const vx = this.x + this.knobRadius * 2 + 28;
    const vy = this.y;
    const vw = this.vizWidth;
    const vh = this.vizHeight;

    ctx.beginPath();
    ctx.roundRect(vx, vy, vw, vh, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = `rgba(51, 65, 85, ${0.5 + this.flicker * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const midY = vy + vh / 2;
    const amp = vh / 2 - 8;
    // base waveform (static, flicker)
    ctx.globalAlpha = this.flicker;
    ctx.beginPath();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let i = 0; i <= vw; i++) {
      const t = i / vw;
      const phase = t * Math.PI * 2;
      let sample = 0;
      switch (WAVEFORMS[idx]) {
        case 'sine':
          sample = Math.sin(phase);
          break;
        case 'triangle':
          sample = 1 - 4 * Math.abs(t - 0.5);
          break;
        case 'sawtooth':
          sample = 2 * (t - Math.floor(t + 0.5));
          break;
        case 'square':
          sample = Math.sin(phase) >= 0 ? 1 : -1;
          break;
      }
      const px = vx + i;
      const py = midY - sample * amp;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // traveling glow along the waveform
    const glowCenter = Math.round(this.glowPos * vw);
    const glowHalf = 12;
    const gStart = Math.max(0, glowCenter - glowHalf);
    const gEnd = Math.min(vw, glowCenter + glowHalf);
    ctx.save();
    ctx.globalAlpha = 0.55 * this.flicker;
    ctx.beginPath();
    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(129, 140, 248, 0.85)';
    ctx.shadowBlur = 18;
    for (let i = gStart; i <= gEnd; i++) {
      const t = i / vw;
      const phase = t * Math.PI * 2;
      let sample = 0;
      switch (WAVEFORMS[idx]) {
        case 'sine':
          sample = Math.sin(phase);
          break;
        case 'triangle':
          sample = 1 - 4 * Math.abs(t - 0.5);
          break;
        case 'sawtooth':
          sample = 2 * (t - Math.floor(t + 0.5));
          break;
        case 'square':
          sample = Math.sin(phase) >= 0 ? 1 : -1;
          break;
      }
      const px = vx + i;
      const py = midY - sample * amp;
      if (i === gStart) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // center line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(vx, midY);
    ctx.lineTo(vx + vw, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // scanlines (CRT effect)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let ly = vy + 2; ly < vy + vh; ly += 3) {
      ctx.beginPath();
      ctx.moveTo(vx, ly);
      ctx.lineTo(vx + vw, ly);
      ctx.stroke();
    }
    ctx.restore();

    // waveform name (below visualizer)
    ctx.fillStyle = '#818cf8';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(WAVEFORMS[idx], vx + vw / 2, vy + vh + 6);
  }
}
