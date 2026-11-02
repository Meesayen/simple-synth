export interface VoiceParams {
  waveform1: string;
  waveform2: string;
  volume1: number;
  volume2: number;
  pan1: number;
  pan2: number;
  octave1: number;
  octave2: number;
  detune1: number;
  detune2: number;
  osc1Enabled: boolean;
  osc2Enabled: boolean;
  mix: number;
  filterType: BiquadFilterType;
  cutoff: number;
  resonance: number;
  slope: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  masterVolume: number;
  muted: boolean;
}

export class Voice {
  ctx: AudioContext;
  osc1: OscillatorNode;
  gain1: GainNode;
  osc2: OscillatorNode;
  gain2: GainNode;
  stage1: BiquadFilterNode;
  stage2: BiquadFilterNode;
  vca: GainNode;
  output: GainNode;
  note: number | null = null;
  velocity = 1;
  state: 'idle' | 'playing' | 'releasing' = 'idle';
  private started = false;
  private sustainLevel = 0.0001;
  private releaseTimer: number | null = null;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.osc1 = ctx.createOscillator();
    this.gain1 = ctx.createGain();
    this.osc2 = ctx.createOscillator();
    this.gain2 = ctx.createGain();
    this.stage1 = ctx.createBiquadFilter();
    this.stage2 = ctx.createBiquadFilter();
    this.vca = ctx.createGain();
    this.output = ctx.createGain();

    this.osc1.connect(this.gain1);
    this.osc2.connect(this.gain2);
    this.gain1.connect(this.stage1);
    this.gain2.connect(this.stage1);
    this.stage1.connect(this.stage2);
    this.stage2.connect(this.vca);
    this.vca.connect(this.output);
    this.output.connect(destination);

    this.vca.gain.value = 0;
    this.output.gain.value = 1;
  }

  private toSeconds(n: number): number {
    return Math.max(0.001, n * n * 5);
  }

  configure(params: VoiceParams): void {
    this.osc1.type = params.waveform1 as OscillatorType;
    this.osc2.type = params.waveform2 as OscillatorType;
    const type = params.filterType;
    this.stage1.type = type;
    this.stage1.frequency.value = params.cutoff;
    this.stage1.Q.value = params.resonance;
    if (params.slope >= 1) {
      this.stage2.type = type;
      this.stage2.frequency.value = params.cutoff;
      this.stage2.Q.value = params.resonance;
    } else {
      this.stage2.type = 'allpass';
    }
  }

  noteOn(note: number, velocity: number, params: VoiceParams): void {
    if (!this.started) {
      this.osc1.start(this.ctx.currentTime);
      this.osc2.start(this.ctx.currentTime);
      this.started = true;
    }
    this.note = note;
    this.velocity = velocity;
    this.state = 'playing';
    if (this.releaseTimer !== null) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }

    const now = this.ctx.currentTime;
    const freq1 =
      440 *
      Math.pow(2, (note - 69) / 12) *
      Math.pow(2, params.octave1) *
      Math.pow(2, params.detune1 / 1200);
    const freq2 =
      440 *
      Math.pow(2, (note - 69) / 12) *
      Math.pow(2, params.octave2) *
      Math.pow(2, params.detune2 / 1200);

    this.osc1.type = params.waveform1 as OscillatorType;
    this.osc2.type = params.waveform2 as OscillatorType;
    this.osc1.frequency.cancelScheduledValues(now);
    this.osc1.frequency.setValueAtTime(freq1, now);
    this.osc2.frequency.cancelScheduledValues(now);
    this.osc2.frequency.setValueAtTime(freq2, now);

    const filterType = params.filterType;
    this.stage1.type = filterType;
    this.stage1.frequency.cancelScheduledValues(now);
    this.stage1.frequency.setValueAtTime(params.cutoff, now);
    this.stage1.Q.cancelScheduledValues(now);
    this.stage1.Q.setValueAtTime(params.resonance, now);
    if (params.slope >= 1) {
      this.stage2.type = filterType;
      this.stage2.frequency.cancelScheduledValues(now);
      this.stage2.frequency.setValueAtTime(params.cutoff, now);
      this.stage2.Q.cancelScheduledValues(now);
      this.stage2.Q.setValueAtTime(params.resonance, now);
    } else {
      this.stage2.type = 'allpass';
    }

    const g1 = params.osc1Enabled ? Math.cos((params.mix * Math.PI) / 2) : 0;
    const g2 = params.osc2Enabled ? Math.sin((params.mix * Math.PI) / 2) : 0;
    this.gain1.gain.setValueAtTime(g1 * params.volume1 * velocity, now);
    this.gain2.gain.setValueAtTime(g2 * params.volume2 * velocity, now);

    const a = this.toSeconds(params.attack);
    const d = this.toSeconds(params.decay);
    const s = Math.max(0.0001, params.sustain);
    const peak = params.masterVolume * (params.muted ? 0 : 1) * velocity;
    const floor = 0.0001;
    const eps = 0.001;

    this.sustainLevel = Math.max(floor, s * peak);

    this.vca.gain.cancelScheduledValues(now);
    this.vca.gain.setValueAtTime(Math.max(floor, 0), now);
    if (a <= eps) {
      this.vca.gain.setValueAtTime(peak, now);
    } else {
      this.vca.gain.linearRampToValueAtTime(peak, now + a);
    }
    const decayEnd = now + a + Math.max(eps, d);
    this.vca.gain.exponentialRampToValueAtTime(Math.max(floor, s * peak), decayEnd);
    this.vca.gain.setValueAtTime(Math.max(floor, s * peak), decayEnd);
  }

  noteOff(params: VoiceParams): void {
    if (this.state !== 'playing') return;
    this.state = 'releasing';
    const now = this.ctx.currentTime;
    const r = this.toSeconds(params.release);
    const eps = 0.001;
    const floor = 0.0001;
    const raw = this.vca.gain.value;
    const current = Math.max(floor, raw > floor ? raw : this.sustainLevel);
    const releaseEnd = now + Math.max(eps, r);
    this.vca.gain.cancelScheduledValues(now);
    this.vca.gain.setValueAtTime(current, now);
    this.vca.gain.exponentialRampToValueAtTime(floor, releaseEnd);
    this.vca.gain.setValueAtTime(0, releaseEnd + 0.001);

    const total = r + 0.05;
    this.releaseTimer = window.setTimeout(() => {
      this.state = 'idle';
      this.note = null;
      this.releaseTimer = null;
    }, total * 1000);
  }

  dispose(): void {
    if (this.releaseTimer !== null) clearTimeout(this.releaseTimer);
    try {
      this.osc1.stop();
    } catch {
      /* already stopped */
    }
    try {
      this.osc2.stop();
    } catch {
      /* already stopped */
    }
    this.osc1.disconnect();
    this.gain1.disconnect();
    this.osc2.disconnect();
    this.gain2.disconnect();
    this.stage1.disconnect();
    this.stage2.disconnect();
    this.vca.disconnect();
    this.output.disconnect();
  }
}
