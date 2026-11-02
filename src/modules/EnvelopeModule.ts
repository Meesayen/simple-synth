import { ref, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Slider } from '../controls/Slider';
import { HStack } from '../layout/Container';
import { getAudioContext } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface EnvelopeModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  title?: string;
  host?: CanvasHost;
}

export class EnvelopeModule extends ModuleBase {
  // State (normalized 0..1, mapped to seconds with a curve)
  attack: Ref<number>;
  decay: Ref<number>;
  sustain: Ref<number>;
  release: Ref<number>;
  title: string;

  // Audio
  private ctx: AudioContext;
  public readonly input: GainNode;
  private vca: GainNode;
  public readonly output: GainNode;

  constructor(options: EnvelopeModuleOptions) {
    super(options.x, options.y, options.width ?? 320, options.height ?? 120, options.host);

    this.title = options.title ?? 'ENV';
    this.attack = ref(0.1);
    this.decay = ref(0.15);
    this.sustain = ref(0.7);
    this.release = ref(0.15);

    const cx = this.x;
    const cy = this.y;

    // Audio graph: input -> vca -> output -> master
    this.ctx = getAudioContext();
    this.input = this.ctx.createGain();
    this.vca = this.ctx.createGain();
    this.output = this.ctx.createGain();
    this.vca.gain.value = 0;
    this.input.connect(this.vca);
    this.vca.connect(this.output);

    // Sliders (normalized 0..1)
    const attackSlider = new Slider({
      x: 0,
      y: 0,
      width: 16,
      height: 80,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.attack,
      label: 'A',
      valueFormatter: (v) => {
        const ms = v * v * 5 * 1000;
        return ms < 500 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s';
      },
      host: this.host,
    });
    const decaySlider = new Slider({
      x: 0,
      y: 0,
      width: 16,
      height: 80,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.decay,
      label: 'D',
      valueFormatter: (v) => {
        const ms = v * v * 5 * 1000;
        return ms < 500 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s';
      },
      host: this.host,
    });
    const sustainSlider = new Slider({
      x: 0,
      y: 0,
      width: 16,
      height: 80,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.sustain,
      label: 'S',
      valueFormatter: (v) => Math.round(v * 100) + '%',
      host: this.host,
    });
    const releaseSlider = new Slider({
      x: 0,
      y: 0,
      width: 16,
      height: 80,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.release,
      label: 'R',
      valueFormatter: (v) => {
        const ms = v * v * 5 * 1000;
        return ms < 500 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s';
      },
      host: this.host,
    });

    const sliderStack = new HStack(
      cx + 12,
      cy + 40,
      [attackSlider, decaySlider, sustainSlider, releaseSlider],
      24,
    );
    this.addControl(sliderStack);

    this.fitFrame(20, 24);
  }

  gate(on: boolean, velocity = 1): void {
    const now = Number.isFinite(this.ctx.currentTime) ? this.ctx.currentTime : 0;
    const a = Number.isFinite(this.attack.value)
      ? Math.max(0.001, this.attack.value * this.attack.value * 5)
      : 0.01;
    const d = Number.isFinite(this.decay.value)
      ? Math.max(0.001, this.decay.value * this.decay.value * 5)
      : 0.1;
    const s = Number.isFinite(this.sustain.value) ? Math.max(0.0001, this.sustain.value) : 0.7;
    const r = Number.isFinite(this.release.value)
      ? Math.max(0.001, this.release.value * this.release.value * 5)
      : 0.2;
    const peak = Math.max(0.05, Math.min(1, velocity));
    const eps = 0.001;
    const floor = 0.0001;

    if (on) {
      this.vca.gain.cancelScheduledValues(now);
      this.vca.gain.setValueAtTime(Math.max(floor, 0), now);
      if (a <= eps) {
        this.vca.gain.setValueAtTime(peak, now);
      } else {
        this.vca.gain.linearRampToValueAtTime(peak, now + a);
      }
      const decayEnd = now + a + Math.max(eps, d);
      this.vca.gain.exponentialRampToValueAtTime(Math.max(floor, s), decayEnd);
      // Hold at sustain indefinitely
      this.vca.gain.setValueAtTime(Math.max(floor, s), decayEnd);
    } else {
      const current = Math.max(floor, this.vca.gain.value);
      const releaseEnd = now + Math.max(eps, r);
      this.vca.gain.cancelScheduledValues(now);
      this.vca.gain.setValueAtTime(current, now);
      this.vca.gain.exponentialRampToValueAtTime(floor, releaseEnd);
      this.vca.gain.setValueAtTime(0, releaseEnd + 0.001);
    }
  }

  trigger(): void {
    this.gate(true);
    const a = Math.max(0.001, this.attack.value * this.attack.value * 5);
    const d = Math.max(0.001, this.decay.value * this.decay.value * 5);
    const r = Math.max(0.001, this.release.value * this.release.value * 5);
    const hold = 0.2;
    const total = a + d + hold + r;
    setTimeout(() => this.gate(false), total * 1000);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Frame
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.title, this.x + this.width / 2, this.y + 10);

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.input.disconnect();
    this.vca.disconnect();
    this.output.disconnect();
    super.dispose();
  }
}
