import { ref, watch, type Ref } from 'vue';
import type { Control } from '../controls/Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { ModuleBase } from './ModuleBase';
import { Knob } from '../controls/Knob';
import { Toggle } from '../controls/Toggle';
import { getAudioContext } from '../audio/AudioEngine';
import { VStack, HStack } from '../layout/Container';

const FILTER_TYPES = ['lowpass', 'bandpass', 'highpass'] as const;

export interface FilterModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class FilterModule extends ModuleBase {
  // State
  filterType: Ref<number>;
  isLP: Ref<boolean>;
  isBP: Ref<boolean>;
  isHP: Ref<boolean>;
  cutoff: Ref<number>;
  resonance: Ref<number>;

  // Children
  private lpToggle: Toggle;
  private bpToggle: Toggle;
  private hpToggle: Toggle;
  private cutoffKnob: Knob;
  private resonanceKnob: Knob;
  private layout: HStack;
  private activeChild: Control | null = null;

  // Audio
  private ctx: AudioContext;
  private filterNode: BiquadFilterNode;
  public readonly input: GainNode;
  public readonly output: GainNode;

  constructor(options: FilterModuleOptions) {
    super(options.x, options.y, options.width ?? 280, options.height ?? 190, options.host);

    this.filterType = ref(0);
    this.isLP = ref(true);
    this.isBP = ref(false);
    this.isHP = ref(false);
    this.cutoff = ref(1000);
    this.resonance = ref(1);

    const cx = this.x;
    const cy = this.y;

    // Audio graph
    this.ctx = getAudioContext();
    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = FILTER_TYPES[this.filterType.value];
    this.filterNode.frequency.value = this.cutoff.value;
    this.filterNode.Q.value = this.resonance.value;
    this.input.connect(this.filterNode);
    this.filterNode.connect(this.output);

    // Filter type toggles (radio behavior)
    const toggleW = 60;
    const toggleH = 20;
    this.lpToggle = new Toggle({
      x: 0,
      y: 0,
      width: toggleW,
      height: toggleH,
      value: this.isLP,
      label: 'LP',
      showState: false,
      host: this.host,
    });
    this.bpToggle = new Toggle({
      x: 0,
      y: 0,
      width: toggleW,
      height: toggleH,
      value: this.isBP,
      label: 'BP',
      showState: false,
      host: this.host,
    });
    this.hpToggle = new Toggle({
      x: 0,
      y: 0,
      width: toggleW,
      height: toggleH,
      value: this.isHP,
      label: 'HP',
      showState: false,
      host: this.host,
    });
    const toggleStack = new VStack(
      cx + 18,
      cy + 34,
      [this.lpToggle, this.bpToggle, this.hpToggle],
      8,
    );

    // Knobs
    this.cutoffKnob = new Knob({
      x: 0,
      y: 0,
      radius: 26,
      min: 20,
      max: 20000,
      step: 1,
      value: this.cutoff,
      label: 'Cutoff',
      host: this.host,
    });
    this.resonanceKnob = new Knob({
      x: 0,
      y: 0,
      radius: 26,
      min: 0.5,
      max: 20,
      step: 0.1,
      value: this.resonance,
      label: 'Reso',
      host: this.host,
    });
    const knobStack = new HStack(cx + 100, cy + 95, [this.cutoffKnob, this.resonanceKnob], 28);

    // Wrap both groups in an HStack
    this.layout = new HStack(cx + 18, cy + 28, [toggleStack, knobStack], 24, 'bottom');

    // Register children
    this.addControl(this.layout);

    // Auto-size frame to children (no title height)
    this.fitFrame(10, 0);

    // Radio logic
    watch(this.isLP, (v) => {
      if (v) {
        this.isBP.value = false;
        this.isHP.value = false;
        this.filterType.value = 0;
      } else if (this.filterType.value === 0) {
        this.isLP.value = true;
      }
    });
    watch(this.isBP, (v) => {
      if (v) {
        this.isLP.value = false;
        this.isHP.value = false;
        this.filterType.value = 1;
      } else if (this.filterType.value === 1) {
        this.isBP.value = true;
      }
    });
    watch(this.isHP, (v) => {
      if (v) {
        this.isLP.value = false;
        this.isBP.value = false;
        this.filterType.value = 2;
      } else if (this.filterType.value === 2) {
        this.isHP.value = true;
      }
    });
    watch(this.filterType, (v) => {
      this.filterNode.type = FILTER_TYPES[v];
      this.host?.requestRedraw();
    });
    watch(this.cutoff, (v) => {
      this.filterNode.frequency.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    });
    watch(this.resonance, (v) => {
      this.filterNode.Q.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    });
  }

  onPointerDown(e: PointerEvent, x: number, y: number): void {
    for (const c of this.childControls) {
      if (c.hitTest(x, y)) {
        this.activeChild = c;
        c.onPointerDown?.(e, x, y);
        return;
      }
    }
    this.activeChild = null;
  }

  onPointerMove(e: PointerEvent, x: number, y: number): void {
    if (this.activeChild) {
      this.activeChild.onPointerMove?.(e, x, y);
    }
  }

  onPointerUp(e: PointerEvent, x: number, y: number): void {
    if (this.activeChild) {
      this.activeChild.onPointerUp?.(e, x, y);
      this.activeChild = null;
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
    ctx.fillText('FLT', this.x + this.width / 2, this.y + 10);

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.filterNode.disconnect();
    super.dispose();
  }
}
