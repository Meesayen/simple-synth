import { ref, watch, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Knob } from '../controls/Knob';
import { HStack } from '../layout/Container';
import { getAudioContext, getMasterGain } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface MixModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class MixModule extends ModuleBase {
  // State
  mix: Ref<number>;
  master: Ref<number>;

  // Audio
  private ctx: AudioContext;
  public readonly input1: GainNode;
  public readonly input2: GainNode;
  private gain1: GainNode;
  private gain2: GainNode;
  private outputGain: GainNode;

  constructor(options: MixModuleOptions) {
    super(options.x, options.y, options.width ?? 200, options.height ?? 140, options.host);

    this.mix = ref(0.5);
    this.master = ref(0.8);

    const cx = this.x;
    const cy = this.y;

    // Audio graph: input1->gain1->output, input2->gain2->output, output->master
    this.ctx = getAudioContext();
    this.input1 = this.ctx.createGain();
    this.input2 = this.ctx.createGain();
    this.gain1 = this.ctx.createGain();
    this.gain2 = this.ctx.createGain();
    this.outputGain = this.ctx.createGain();

    this.updateMix(this.mix.value);
    this.outputGain.gain.value = this.master.value;

    this.input1.connect(this.gain1);
    this.input2.connect(this.gain2);
    this.gain1.connect(this.outputGain);
    this.gain2.connect(this.outputGain);
    this.outputGain.connect(getMasterGain());

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
      host: this.host,
    });
    const masterKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.master,
      label: 'Master',
      host: this.host,
    });

    const knobStack = new HStack(cx + 12, cy + 30, [mixKnob, masterKnob], 16, 'center');
    this.addControl(knobStack);

    this.fitFrame(10, 24);

    // Watches
    watch(this.mix, (v) => {
      const g1 = Math.cos((v * Math.PI) / 2);
      const g2 = Math.sin((v * Math.PI) / 2);
      this.gain1.gain.setTargetAtTime(g1, this.ctx.currentTime, 0.01);
      this.gain2.gain.setTargetAtTime(g2, this.ctx.currentTime, 0.01);
    });
    watch(this.master, (v) => {
      this.outputGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    });
  }

  private updateMix(v: number): void {
    const g1 = Math.cos((v * Math.PI) / 2);
    const g2 = Math.sin((v * Math.PI) / 2);
    this.gain1.gain.value = g1;
    this.gain2.gain.value = g2;
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
    ctx.fillText('MIX', this.x + this.width / 2, this.y + 10);

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.input1.disconnect();
    this.input2.disconnect();
    this.gain1.disconnect();
    this.gain2.disconnect();
    this.outputGain.disconnect();
    super.dispose();
  }
}
