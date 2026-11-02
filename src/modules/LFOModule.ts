import { ref, watch, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Knob } from '../controls/Knob';
import { WaveSelector } from '../controls/WaveSelector';
import { HStack } from '../layout/Container';
import { getAudioContext } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface LFOModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class LFOModule extends ModuleBase {
  // State
  waveform: Ref<number>;
  rate: Ref<number>;
  depth: Ref<number>;

  // Audio
  private ctx: AudioContext;
  private lfoOsc: OscillatorNode;
  public readonly output: GainNode;

  constructor(options: LFOModuleOptions) {
    super(options.x, options.y, options.width ?? 260, options.height ?? 120, options.host);

    this.waveform = ref(0);
    this.rate = ref(0.5);
    this.depth = ref(0.5);

    const cx = this.x;
    const cy = this.y;

    // Audio graph: LFO osc -> depth gain -> output
    this.ctx = getAudioContext();
    this.lfoOsc = this.ctx.createOscillator();
    const depthGain = this.ctx.createGain();
    this.lfoOsc.type = ['sine', 'triangle', 'sawtooth', 'square'][
      this.waveform.value
    ] as OscillatorType;
    this.lfoOsc.frequency.value = this.rate.value * 20; // 0..1 -> 0..20 Hz
    depthGain.gain.value = this.depth.value;
    this.lfoOsc.connect(depthGain);
    this.lfoOsc.start();
    this.output = depthGain;

    // WaveSelector (no visualizer)
    const waveSelector = new WaveSelector({
      x: 0,
      y: 0,
      knobRadius: 22,
      vizWidth: 0,
      vizHeight: 0,
      value: this.waveform,
      showVisualizer: false,
      host: this.host,
    });

    // Knobs
    const rateKnob = new Knob({
      x: 0,
      y: 0,
      radius: 22,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.rate,
      label: 'Rate',
      host: this.host,
    });
    const depthKnob = new Knob({
      x: 0,
      y: 0,
      radius: 22,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.depth,
      label: 'Depth',
      host: this.host,
    });

    const layout = new HStack(cx + 12, cy + 40, [waveSelector, rateKnob, depthKnob], 16, 'center');
    this.addControl(layout);

    this.fitFrame(10, 24);

    // Watches
    watch(this.waveform, (v) => {
      this.lfoOsc.type = ['sine', 'triangle', 'sawtooth', 'square'][v] as OscillatorType;
    });
    watch(this.rate, (v) => {
      this.lfoOsc.frequency.setTargetAtTime(v * 20, this.ctx.currentTime, 0.01);
    });
    watch(this.depth, (v) => {
      this.output.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    });
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
    ctx.fillText('LFO', this.x + this.width / 2, this.y + 10);

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    try {
      this.lfoOsc.stop();
    } catch {
      // already stopped
    }
    this.lfoOsc.disconnect();
    this.output.disconnect();
    super.dispose();
  }
}
