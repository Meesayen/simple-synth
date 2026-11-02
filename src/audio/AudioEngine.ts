let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

export function getMasterGain(): GainNode {
  getAudioContext();
  if (!masterGain) throw new Error('Master gain not initialized');
  return masterGain;
}

export async function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
