import { ref, watch, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Knob } from '../controls/Knob';
import { Toggle } from '../controls/Toggle';
import { Grid } from '../layout/Container';
import { getAudioContext } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface DelayModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class DelayModule extends ModuleBase {
  // State (normalized 0..1)
  time: Ref<number>;
  feedback: Ref<number>;
  mix: Ref<number>;
  tone: Ref<number>;
  enabled: Ref<boolean>;

  // Audio
  private ctx: AudioContext;
  public readonly input: GainNode;
  public readonly output: GainNode;
  private delayNode: DelayNode;
  private feedbackFilter: BiquadFilterNode;
  private feedbackGain: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(options: DelayModuleOptions) {
    super(options.x, options.y, options.width ?? 260, options.height ?? 170, options.host);

    this.time = ref(0.3);
    this.feedback = ref(0.4);
    this.mix = ref(0.5);
    this.tone = ref(0.7);
    this.enabled = ref(true);

    const cx = this.x;
    const cy = this.y;

    // Audio graph
    this.ctx = getAudioContext();
    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();
    this.delayNode = this.ctx.createDelay(2.0);
    this.feedbackFilter = this.ctx.createBiquadFilter();
    this.feedbackGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();

    this.feedbackFilter.type = 'lowpass';
    this.feedbackFilter.frequency.value = 200 + this.tone.value * (8000 - 200);
    this.feedbackFilter.Q.value = 0.7;
    this.delayNode.delayTime.value = this.time.value * 2;
    this.applyGains();

    // input -> dry -> output
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    // input -> delay -> wet -> output
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.output);
    // feedback loop: delay -> filter -> feedbackGain -> delay
    this.delayNode.connect(this.feedbackFilter);
    this.feedbackFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    // Knobs
    const timeKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.time,
      label: 'Time',
      valueFormatter: (v) => {
        const ms = v * 2 * 1000;
        return ms < 500 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s';
      },
      host: this.host,
    });
    const feedbackKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.feedback,
      label: 'Fdbk',
      valueFormatter: (v) => Math.round(v * 0.9 * 100) + '%',
      host: this.host,
    });
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

    const grid = new Grid(cx + 12, cy + 40, [timeKnob, feedbackKnob, mixKnob, toneKnob], 2, 16, 16);
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

    // Watches
    watch(this.time, (v) => {
      this.delayNode.delayTime.setTargetAtTime(v * 2, this.ctx.currentTime, 0.01);
    });
    watch(this.feedback, () => this.applyGains());
    watch(this.mix, () => this.applyGains());
    watch(this.enabled, () => this.applyGains());
    watch(this.tone, (v) => {
      const cutoff = 200 + v * (8000 - 200);
      this.feedbackFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.01);
    });
  }

  private applyGains(): void {
    const now = this.ctx.currentTime;
    if (this.enabled.value) {
      this.dryGain.gain.setTargetAtTime(1 - this.mix.value, now, 0.01);
      this.wetGain.gain.setTargetAtTime(this.mix.value, now, 0.01);
      this.feedbackGain.gain.setTargetAtTime(this.feedback.value * 0.9, now, 0.01);
    } else {
      this.dryGain.gain.setTargetAtTime(1, now, 0.01);
      this.wetGain.gain.setTargetAtTime(0, now, 0.01);
      this.feedbackGain.gain.setTargetAtTime(0, now, 0.01);
    }
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
    ctx.fillText('DLY', this.x + this.width / 2, this.y + 10);

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.delayNode.disconnect();
    this.feedbackFilter.disconnect();
    this.feedbackGain.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    super.dispose();
  }
}
