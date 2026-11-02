export interface PresetData {
  name: string;
  data: Record<string, unknown>;
}

export const PRESETS: PresetData[] = [
  {
    name: 'Pixie',
    data: {
      osc1: { power: true, waveform: 0, volume: 0.7, pan: 0, octave: 0, detune: 0 },
      osc2: { power: true, waveform: 0, volume: 0.7, pan: 0, octave: 0, detune: 0 },
      mix: { mix: 0.5, master: 0.8 },
      filter: { filterType: 0, cutoff: 1000, resonance: 1, slope: 0 },
      ampEnv: { attack: 0.1, decay: 0.15, sustain: 0.7, release: 0.15 },
      output: { volume: 0.8, active: true },
      delay: { time: 0.3, feedback: 0.4, mix: 0.5, tone: 0.7, enabled: true },
      reverb: { mix: 0.4, decay: 0.5, size: 0.5, tone: 0.7, enabled: true },
    },
  },
  {
    name: 'Acid Bass',
    data: {
      osc1: { power: true, waveform: 2, volume: 0.8, pan: 0, octave: 0, detune: 0 },
      osc2: { power: true, waveform: 2, volume: 0.58, pan: 0, octave: 0, detune: -22 },
      mix: { mix: 0.5, master: 0.85 },
      filter: { filterType: 0, cutoff: 2246, resonance: 8.8, slope: 2 },
      ampEnv: { attack: 0.09, decay: 0.26, sustain: 0, release: 0.08 },
      output: { volume: 0.85, active: true },
      delay: { time: 0.15, feedback: 0.2, mix: 0.15, tone: 0.4, enabled: true },
      reverb: { mix: 0.06, decay: 0.3, size: 0.3, tone: 0.5, enabled: true },
    },
  },
  {
    name: 'Warm Pad',
    data: {
      osc1: { power: true, waveform: 2, volume: 0.6, pan: -0.2, octave: 0, detune: 0 },
      osc2: { power: true, waveform: 2, volume: 0.6, pan: 0.2, octave: 0, detune: 7 },
      mix: { mix: 0.5, master: 0.7 },
      filter: { filterType: 0, cutoff: 800, resonance: 1, slope: 0 },
      ampEnv: { attack: 0.4, decay: 0.3, sustain: 0.7, release: 0.6 },
      output: { volume: 0.7, active: true },
      delay: { time: 0.4, feedback: 0.3, mix: 0.2, tone: 0.5, enabled: false },
      reverb: { mix: 0.5, decay: 0.7, size: 0.7, tone: 0.5, enabled: true },
    },
  },
  {
    name: 'Bright Lead',
    data: {
      osc1: { power: true, waveform: 2, volume: 0.7, pan: 0, octave: 0, detune: 0 },
      osc2: { power: true, waveform: 3, volume: 0.5, pan: 0, octave: 1, detune: 0 },
      mix: { mix: 0.4, master: 0.75 },
      filter: { filterType: 0, cutoff: 2500, resonance: 2, slope: 1 },
      ampEnv: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.2 },
      output: { volume: 0.75, active: true },
      delay: { time: 0.3, feedback: 0.4, mix: 0.3, tone: 0.6, enabled: true },
      reverb: { mix: 0.2, decay: 0.4, size: 0.5, tone: 0.6, enabled: true },
    },
  },
  {
    name: 'Pluck',
    data: {
      osc1: { power: true, waveform: 2, volume: 0.8, pan: 0, octave: 0, detune: 0 },
      osc2: { power: false, waveform: 0, volume: 0.5, pan: 0, octave: 0, detune: 0 },
      mix: { mix: 0.5, master: 0.8 },
      filter: { filterType: 0, cutoff: 1500, resonance: 3, slope: 0 },
      ampEnv: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 },
      output: { volume: 0.8, active: true },
      delay: { time: 0.25, feedback: 0.3, mix: 0.25, tone: 0.5, enabled: false },
      reverb: { mix: 0.3, decay: 0.5, size: 0.6, tone: 0.6, enabled: true },
    },
  },
  {
    name: 'Deep Bass',
    data: {
      osc1: { power: true, waveform: 3, volume: 0.8, pan: 0, octave: -1, detune: 0 },
      osc2: { power: true, waveform: 2, volume: 0.4, pan: 0, octave: -1, detune: 0 },
      mix: { mix: 0.6, master: 0.85 },
      filter: { filterType: 0, cutoff: 300, resonance: 4, slope: 1 },
      ampEnv: { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.1 },
      output: { volume: 0.85, active: true },
      delay: { time: 0.2, feedback: 0.2, mix: 0.1, tone: 0.4, enabled: false },
      reverb: { mix: 0.1, decay: 0.3, size: 0.3, tone: 0.4, enabled: false },
    },
  },
];
