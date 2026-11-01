import { ref, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Slider } from '../controls/Slider';
import { HStack } from '../layout/Container';
import { getAudioContext, getMasterGain } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface EnvelopeModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class EnvelopeModule extends ModuleBase {
  // State (normalized 0..1, mapped to seconds with a curve)
  attack: Ref<number>;
  decay: Ref<number>;
  sustain: Ref<number>;
  release: Ref<number>;

  // Audio
  private ctx: AudioContext;
  public readonly input: GainNode;
  private vca: GainNode;
  public readonly output: GainNode;

  constructor(options: EnvelopeModuleOptions) {
    super(options.x, options.y, options.width ?? 320, options.height ?? 120, options.host);

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
    this.output.connect(getMasterGain());

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
      host: this.host,
    });

    const sliderStack = new HStack(
      cx + 12,
      cy + 40,
      [attackSlider, decaySlider, sustainSlider, releaseSlider],
      18,
    );
    this.addControl(sliderStack);

    this.fitFrame(10, 24);
  }

  trigger(): void {
    const now = this.ctx.currentTime;
    const a = Math.max(0.001, this.attack.value * this.attack.value * 2);
    const d = Math.max(0.001, this.decay.value * this.decay.value * 1);
    const s = Math.max(0.0001, this.sustain.value);
    const r = Math.max(0.001, this.release.value * this.release.value * 2);
    const peak = 1.0;
    const hold = 0.2;
    const eps = 0.001;
    const floor = 0.0001;

    this.vca.gain.cancelScheduledValues(now);
    this.vca.gain.setValueAtTime(Math.max(floor, 0), now);

    // Attack (linear)
    if (a <= eps) {
      this.vca.gain.setValueAtTime(peak, now);
    } else {
      this.vca.gain.linearRampToValueAtTime(peak, now + a);
    }

    // Decay (exponential -> sustain level)
    const decayEnd = now + a + Math.max(eps, d);
    this.vca.gain.exponentialRampToValueAtTime(Math.max(floor, s), decayEnd);

    // Sustain hold
    this.vca.gain.setValueAtTime(Math.max(floor, s), decayEnd + hold);

    // Release (exponential -> floor, then zero)
    const releaseEnd = decayEnd + hold + Math.max(eps, r);
    this.vca.gain.exponentialRampToValueAtTime(floor, releaseEnd);
    this.vca.gain.setValueAtTime(0, releaseEnd + 0.001);
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
    ctx.fillText('ENV', this.x + this.width / 2, this.y + 10);

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
