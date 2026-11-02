import { ref, watch, type Ref } from 'vue';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Knob } from '../controls/Knob';
import { Toggle } from '../controls/Toggle';
import { VStack } from '../layout/Container';
import { getAudioContext, getMasterGain } from '../audio/AudioEngine';
import { ModuleBase } from './ModuleBase';

export interface OutputModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class OutputModule extends ModuleBase {
  // State
  volume: Ref<number>;
  active: Ref<boolean>;

  // Audio
  private ctx: AudioContext;
  public readonly input: GainNode;
  private outputGain: GainNode;

  constructor(options: OutputModuleOptions) {
    super(options.x, options.y, options.width ?? 160, options.height ?? 140, options.host);

    this.volume = ref(0.8);
    this.active = ref(true);

    const cx = this.x;
    const cy = this.y;

    // Audio graph: input -> outputGain -> master
    this.ctx = getAudioContext();
    this.input = this.ctx.createGain();
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.value = this.volume.value;
    this.input.connect(this.outputGain);
    this.outputGain.connect(getMasterGain());

    // Toggle active
    const activeToggle = new Toggle({
      x: 0,
      y: 0,
      width: 44,
      height: 20,
      value: this.active,
      label: '',
      showState: false,
      host: this.host,
    });

    // Volume knob
    const volumeKnob = new Knob({
      x: 0,
      y: 0,
      radius: 24,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.volume,
      label: 'Master',
      host: this.host,
    });

    const stack = new VStack(cx + 12, cy + 40, [volumeKnob, activeToggle], 8, 'center');
    this.addControl(stack);

    this.fitFrame(10, 24);

    // Watches
    watch(this.volume, (v) => {
      if (this.active.value) {
        this.outputGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
      }
    });
    watch(this.active, (a) => {
      this.outputGain.gain.setTargetAtTime(a ? this.volume.value : 0, this.ctx.currentTime, 0.01);
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
    ctx.fillText('OUT', this.x + this.width / 2, this.y + 10);

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.input.disconnect();
    this.outputGain.disconnect();
    super.dispose();
  }
}
