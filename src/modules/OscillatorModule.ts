import { ref, watch, type Ref } from 'vue';
import { ModuleBase } from './ModuleBase';
import type { Control } from '../controls/Control';
import type { CanvasHost } from '../canvas/CanvasHost';
import { Knob } from '../controls/Knob';
import { WaveSelector } from '../controls/WaveSelector';
import { Toggle } from '../controls/Toggle';
import { getAudioContext, getMasterGain, resumeAudio } from '../audio/AudioEngine';

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'] as const;

export interface OscillatorModuleOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  host?: CanvasHost;
}

export class OscillatorModule extends ModuleBase {
  // State
  power: Ref<boolean>;
  waveform: Ref<number>;
  volume: Ref<number>;
  pan: Ref<number>;
  octave: Ref<number>;
  detune: Ref<number>;

  // Children
  private powerToggle: Toggle;
  private waveSelector: WaveSelector;
  private volumeKnob: Knob;
  private panKnob: Knob;
  private octaveKnob: Knob;
  private detuneKnob: Knob;
  private activeChild: Control | null = null;

  // Audio
  private ctx: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode;
  private pannerNode: StereoPannerNode;

  constructor(options: OscillatorModuleOptions) {
    super(options.x, options.y, options.width ?? 400, options.height ?? 195, options.host);

    this.power = ref(false);
    this.waveform = ref(0);
    this.volume = ref(0.7);
    this.pan = ref(0);
    this.octave = ref(0);
    this.detune = ref(0);

    const cx = this.x;
    const cy = this.y;

    // Audio graph (oscillator created lazily on power-on)
    this.ctx = getAudioContext();
    this.gainNode = this.ctx.createGain();
    this.pannerNode = this.ctx.createStereoPanner();
    this.gainNode.gain.value = 0;
    this.pannerNode.pan.value = this.pan.value;
    this.gainNode.connect(this.pannerNode);
    this.pannerNode.connect(getMasterGain());

    // Children
    this.powerToggle = new Toggle({
      x: cx + 12,
      y: cy + 28,
      width: 40,
      height: 18,
      value: this.power,
      label: 'PWR',
      host: this.host,
    });

    this.waveSelector = new WaveSelector({
      x: cx + 12,
      y: cy + 104,
      knobRadius: 22,
      vizWidth: 110,
      vizHeight: 64,
      value: this.waveform,
      host: this.host,
    });

    const knobX = cx + 245;
    const topY = cy + 58;
    const bottomY = cy + 136;
    const colSpacing = 78;
    this.volumeKnob = new Knob({
      x: knobX,
      y: topY,
      radius: 22,
      min: 0,
      max: 1,
      step: 0.01,
      value: this.volume,
      label: 'Vol',
      host: this.host,
    });
    this.panKnob = new Knob({
      x: knobX + colSpacing,
      y: topY,
      radius: 22,
      min: -1,
      max: 1,
      step: 0.01,
      value: this.pan,
      label: 'Pan',
      host: this.host,
    });
    this.octaveKnob = new Knob({
      x: knobX,
      y: bottomY,
      radius: 22,
      min: -2,
      max: 2,
      step: 1,
      value: this.octave,
      label: 'Oct',
      host: this.host,
    });
    this.detuneKnob = new Knob({
      x: knobX + colSpacing,
      y: bottomY,
      radius: 22,
      min: -100,
      max: 100,
      step: 1,
      value: this.detune,
      label: 'Det',
      host: this.host,
    });

    // Register children
    this._children = [
      this.powerToggle,
      this.waveSelector,
      this.volumeKnob,
      this.panKnob,
      this.octaveKnob,
      this.detuneKnob,
    ];

    // Auto-size frame to children (no title height)
    this.fitFrame(10, 0);

    // Watches -> audio + redraw
    watch(this.power, (on) => {
      if (on) {
        void resumeAudio();
        this.ensureOscillator();
        this.gainNode.gain.setTargetAtTime(this.volume.value, this.ctx.currentTime, 0.01);
        this.oscillator!.frequency.setTargetAtTime(
          this.frequencyValue(),
          this.ctx.currentTime,
          0.01,
        );
        this.oscillator!.type = WAVEFORMS[this.waveform.value] as OscillatorType;
        this.pannerNode.pan.setTargetAtTime(this.pan.value, this.ctx.currentTime, 0.01);
      } else {
        this.stopOscillator();
        this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      }
      this.host?.requestRedraw();
    });
    watch(this.waveform, (v) => {
      if (this.oscillator) this.oscillator.type = WAVEFORMS[v] as OscillatorType;
      this.host?.requestRedraw();
    });
    watch(this.volume, (v) => {
      if (this.power.value) this.gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    });
    watch(this.pan, (v) => {
      this.pannerNode.pan.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    });
    watch(this.octave, () => {
      if (this.oscillator)
        this.oscillator.frequency.setTargetAtTime(
          this.frequencyValue(),
          this.ctx.currentTime,
          0.01,
        );
    });
    watch(this.detune, () => {
      if (this.oscillator)
        this.oscillator.frequency.setTargetAtTime(
          this.frequencyValue(),
          this.ctx.currentTime,
          0.01,
        );
    });
  }

  private ensureOscillator(): void {
    if (this.oscillator) return;
    this.oscillator = this.ctx.createOscillator();
    this.oscillator.type = WAVEFORMS[this.waveform.value] as OscillatorType;
    this.oscillator.frequency.value = this.frequencyValue();
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
  }

  private stopOscillator(): void {
    if (!this.oscillator) return;
    try {
      this.oscillator.stop();
    } catch {
      // already stopped
    }
    this.oscillator.disconnect();
    this.oscillator = null;
  }

  private frequencyValue(): number {
    const base = 440;
    const oct = Math.pow(2, this.octave.value);
    const det = Math.pow(2, this.detune.value / 1200);
    return base * oct * det;
  }

  // children assigned in constructor

  onPointerDown(e: PointerEvent, x: number, y: number): void {
    void resumeAudio();
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
    ctx.fillText('OSC', this.x + this.width / 2, this.y + 10);

    // Frequency readout
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.power.value ? `${this.frequencyValue().toFixed(1)} Hz` : 'OFF',
      this.x + this.width - 12,
      this.y + 12,
    );

    // Children
    for (const c of this.childControls) c.render(ctx);
  }

  dispose(): void {
    this.stopOscillator();
    this.gainNode.disconnect();
    this.pannerNode.disconnect();
    super.dispose();
  }
}
