import { ref, watch, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Knob } from '../controls/Knob';
import { Toggle } from '../controls/Toggle';
import { Grid } from '../layout/Container';
import { getAudioContext } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface ReverbModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class ReverbModule extends ModuleBase {
  // State (normalized 0..1)
  mix: Ref<number>;
  decay: Ref<number>;
  size: Ref<number>;
  tone: Ref<number>;
  enabled: Ref<boolean>;

  // Audio
  private ctx: AudioContext;
  public readonly input: GainNode;
  public readonly output: GainNode;
  private convolver: ConvolverNode;
  private toneFilter: BiquadFilterNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(options: ReverbModuleOptions) {
    super(options.x, options.y, options.width ?? 260, options.height ?? 170, options.host);

    this.mix = ref(0.4);
    this.decay = ref(0.5);
    this.size = ref(0.5);
    this.tone = ref(0.7);
    this.enabled = ref(true);

    const cx = this.x;
    const cy = this.y;

    this.ctx = getAudioContext();
    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();
    this.convolver = this.ctx.createConvolver();
    this.toneFilter = this.ctx.createBiquadFilter();
    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = 200 + this.tone.value * (8000 - 200);
    this.toneFilter.Q.value = 0.7;
    this.wetGain.gain.value = this.mix.value;
    this.dryGain.gain.value = 1 - this.mix.value;

    // Generate initial IR
    this.convolver.buffer = this.generateIR(this.decay.value, this.size.value);

    // input -> dry -> output
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    // input -> convolver -> tone -> wet -> output
    this.input.connect(this.convolver);
    this.convolver.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.wetGain.connect(this.output);

    // Knobs
    const mixKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.mix,
      label: 'Mix',
      valueFormatter: (v) => Math.round(v * 100) + '%',
      host: this.host,
    });
    const decayKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.decay,
      label: 'Decay',
      valueFormatter: (v) => {
        const s = 0.1 + v * (5 - 0.1);
        return s.toFixed(2) + ' s';
      },
      host: this.host,
    });
    const sizeKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.size,
      label: 'Size',
      valueFormatter: (v) => Math.round(v * 100) + '%',
      host: this.host,
    });
    const toneKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.tone,
      label: 'Tone',
      host: this.host,
    });

    const grid = new Grid(cx + 12, cy + 40, [mixKnob, decayKnob, sizeKnob, toneKnob], 2, 16, 16);
    this.addControl(grid);

    const toggle = new Toggle({
      x: 0,
      y: 0,
      width: 52,
      height: 20,
      value: this.enabled,
      label: '',
      showState: false,
      vertical: true,
      host: this.host,
    });
    const gridBB = grid.boundingBox();
    toggle.x = gridBB.x - toggle.width - 12;
    toggle.y = gridBB.y;
    this.addControl(toggle);

    this.fitFrame(10, 24);
    this.applyGains();

    // Watches
    watch(this.mix, () => this.applyGains());
    watch(this.enabled, () => this.applyGains());
    watch(this.decay, () => {
      this.convolver.buffer = this.generateIR(this.decay.value, this.size.value);
    });
    watch(this.size, () => {
      this.convolver.buffer = this.generateIR(this.decay.value, this.size.value);
    });
    watch(this.tone, (v) => {
      const cutoff = 200 + v * (8000 - 200);
      this.toneFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.01);
    });
  }

  private generateIR(decayNorm: number, sizeNorm: number): AudioBuffer {
    const decayTime = 0.1 + decayNorm * (5 - 0.1);
    const preDelay = Math.round(sizeNorm * 0.05 * this.ctx.sampleRate);
    const length = Math.max(1, Math.round(decayTime * this.ctx.sampleRate));
    const buffer = this.ctx.createBuffer(2, length + preDelay, this.ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      // pre-delay silence
      for (let i = 0; i < preDelay; i++) data[i] = 0;
      for (let i = 0; i < length; i++) {
        const t = i / this.ctx.sampleRate;
        const env = Math.exp(-t / (decayTime * 0.3 + 0.001));
        data[preDelay + i] = (Math.random() * 2 - 1) * env * 0.5;
      }
    }
    return buffer;
  }

  private applyGains(): void {
    const now = this.ctx.currentTime;
    if (this.enabled.value) {
      this.dryGain.gain.setTargetAtTime(1 - this.mix.value, now, 0.01);
      this.wetGain.gain.setTargetAtTime(this.mix.value, now, 0.01);
    } else {
      this.dryGain.gain.setTargetAtTime(1, now, 0.01);
      this.wetGain.gain.setTargetAtTime(0, now, 0.01);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('RVB', this.x + this.width / 2, this.y + 10);

    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.convolver.disconnect();
    this.toneFilter.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    super.dispose();
  }
}
