<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { CanvasHost } from '../canvas/CanvasHost';
import { HStack, VStack } from '../layout/Container';
import { OscillatorModule } from '../modules/OscillatorModule';
import { MixModule } from '../modules/MixModule';
import { FilterModule } from '../modules/FilterModule';
import { EnvelopeModule } from '../modules/EnvelopeModule';
import { OutputModule } from '../modules/OutputModule';
import { KeyboardModule } from '../modules/KeyboardModule';
import { DelayModule } from '../modules/DelayModule';
import { ReverbModule } from '../modules/ReverbModule';
import { resumeAudio } from '../audio/AudioEngine';
import { VoiceManager, type VoiceParams } from '../audio/VoiceManager';

const canvasRef = ref<HTMLCanvasElement | null>(null);

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'] as const;
const FILTER_TYPES = ['lowpass', 'bandpass', 'highpass'] as const;

let host: CanvasHost | null = null;
let voiceManager: VoiceManager | null = null;

const osc1Ref = shallowRef<OscillatorModule | null>(null);
const osc2Ref = shallowRef<OscillatorModule | null>(null);
const mixRef = shallowRef<MixModule | null>(null);
const filterRef = shallowRef<FilterModule | null>(null);
const ampEnvRef = shallowRef<EnvelopeModule | null>(null);
const outputRef = shallowRef<OutputModule | null>(null);
const delayRef = shallowRef<DelayModule | null>(null);
const reverbRef = shallowRef<ReverbModule | null>(null);

const params = computed<VoiceParams>(() => {
  const o1 = osc1Ref.value as OscillatorModule | null;
  const o2 = osc2Ref.value as OscillatorModule | null;
  const m = mixRef.value as MixModule | null;
  const f = filterRef.value as FilterModule | null;
  const e = ampEnvRef.value as EnvelopeModule | null;
  const out = outputRef.value as OutputModule | null;
  return {
    waveform1: WAVEFORMS[o1?.waveform?.value ?? 0],
    waveform2: WAVEFORMS[o2?.waveform?.value ?? 0],
    volume1: o1?.volume?.value ?? 0.8,
    volume2: o2?.volume?.value ?? 0.8,
    pan1: o1?.pan?.value ?? 0,
    pan2: o2?.pan?.value ?? 0,
    octave1: o1?.octave?.value ?? 0,
    octave2: o2?.octave?.value ?? 0,
    detune1: o1?.detune?.value ?? 0,
    detune2: o2?.detune?.value ?? 0,
    osc1Enabled: o1?.power?.value ?? false,
    osc2Enabled: o2?.power?.value ?? false,
    mix: m?.mix?.value ?? 0.5,
    filterType: (FILTER_TYPES[f?.filterType?.value ?? 0] ?? 'lowpass') as BiquadFilterType,
    cutoff: f?.cutoff?.value ?? 1000,
    resonance: f?.resonance?.value ?? 1,
    slope: f?.slope?.value ?? 0,
    attack: e?.attack?.value ?? 0.1,
    decay: e?.decay?.value ?? 0.15,
    sustain: e?.sustain?.value ?? 0.8,
    release: e?.release?.value ?? 0.2,
    masterVolume: out?.volume?.value ?? 0.8,
    muted: !(out?.active?.value ?? true),
  };
});

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);

  const osc1 = new OscillatorModule({ x: 10, y: 10, host: host ?? undefined });
  const osc2 = new OscillatorModule({ x: 10, y: 10, host: host ?? undefined });
  const mix = new MixModule({ x: 10, y: 10, host: host ?? undefined });
  const filter = new FilterModule({ x: 10, y: 10, host: host ?? undefined });
  const ampEnv = new EnvelopeModule({ x: 10, y: 10, title: 'AMP ENV', host: host ?? undefined });
  const output = new OutputModule({ x: 10, y: 10, host: host ?? undefined });
  const delay = new DelayModule({ x: 10, y: 10, host: host ?? undefined });
  const reverb = new ReverbModule({ x: 10, y: 10, host: host ?? undefined });

  osc1Ref.value = osc1;
  osc2Ref.value = osc2;
  mixRef.value = mix;
  filterRef.value = filter;
  ampEnvRef.value = ampEnv;
  outputRef.value = output;
  delayRef.value = delay;
  reverbRef.value = reverb;

  // Power on oscillators by default
  osc1.power.value = true;
  osc2.power.value = true;

  voiceManager = new VoiceManager(8, delay.input);
  delay.output.connect(reverb.input);
  reverb.output.connect(output.input);
  voiceManager.updateParams(params.value);

  // Update voice params when controls change
  watch(params, (p) => voiceManager?.updateParams(p), { deep: true });

  const row1 = new HStack(10, 10, [osc1, osc2, mix], 16, 'top');

  const keyboard = new KeyboardModule({
    x: 10,
    y: 10,
    width: row1.boundingBox().w,
    host: host ?? undefined,
    onNoteOn: async (note, velocity) => {
      await resumeAudio();
      voiceManager?.noteOn(note, velocity, params.value);
    },
    onNoteOff: (note) => {
      voiceManager?.noteOff(note, params.value);
    },
  });

  const row2Mods = [filter, ampEnv, delay, reverb, output];
  const row2MaxH = Math.max(...row2Mods.map((m) => m.height));
  for (const m of row2Mods) m.height = row2MaxH;
  const row2 = new HStack(10, 10, row2Mods, 16, 'top');
  const row3 = new HStack(10, 10, [keyboard], 16, 'top');
  const layout = new VStack(10, 10, [row1, row2, row3], 16);

  host.add(layout);
  host.fit();
});

onBeforeUnmount(() => {
  voiceManager?.dispose();
  voiceManager = null;
  delayRef.value?.dispose();
  reverbRef.value?.dispose();
  delayRef.value = null;
  reverbRef.value = null;
  host?.dispose();
  host = null;
});
</script>

<template>
  <section class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
    <canvas
      ref="canvasRef"
      width="960"
      height="420"
      class="rounded-xl border border-slate-800 bg-slate-900 touch-none select-none"
    ></canvas>
  </section>
</template>
