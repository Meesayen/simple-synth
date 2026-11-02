import { getAudioContext, getMasterGain } from './AudioEngine';
import { Voice, type VoiceParams } from './Voice';
export type { VoiceParams } from './Voice';

export class VoiceManager {
  private ctx: AudioContext;
  private destination: AudioNode;
  private voices: Voice[] = [];
  private activeNotes = new Map<number, Voice>();

  constructor(voiceCount = 8, destination?: AudioNode) {
    this.ctx = getAudioContext();
    this.destination = destination ?? getMasterGain();
    for (let i = 0; i < voiceCount; i++) {
      this.voices.push(new Voice(this.ctx, this.destination));
    }
  }

  noteOn(note: number, velocity: number, params: VoiceParams): void {
    // If note already playing, retrigger
    const existing = this.activeNotes.get(note);
    if (existing) {
      existing.noteOff(params);
    }

    // Find idle voice
    let voice = this.voices.find((v) => v.state === 'idle');
    if (!voice) {
      // Steal oldest (first playing)
      voice = this.voices.find((v) => v.state === 'playing') ?? this.voices[0];
      if (voice.note !== null) {
        voice.noteOff(params);
      }
    }

    voice.noteOn(note, velocity, params);
    this.activeNotes.set(note, voice);
  }

  noteOff(note: number, params: VoiceParams): void {
    const voice = this.activeNotes.get(note);
    if (!voice) return;
    voice.noteOff(params);
    this.activeNotes.delete(note);
  }

  updateParams(params: VoiceParams): void {
    for (const voice of this.voices) {
      if (voice.state === 'playing' || voice.state === 'releasing') {
        voice.configure(params);
      }
    }
  }

  dispose(): void {
    for (const voice of this.voices) voice.dispose();
    this.voices = [];
    this.activeNotes.clear();
  }
}
