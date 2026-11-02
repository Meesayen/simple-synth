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
import * as ConfigManager from '../config/ConfigManager';

const props = defineProps<{ devEnabled?: boolean }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const configList = ref<string[]>([]);
const selectedConfig = ref<string>('');
const newConfigName = ref('');
const isDirty = ref(false);
const keyboardInputEnabled = ref(true);
let loadedSnapshot: string | null = null;
let loadedConfigName: string | null = null;

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

function getModules() {
  return {
    osc1: osc1Ref.value,
    osc2: osc2Ref.value,
    mix: mixRef.value,
    filter: filterRef.value,
    ampEnv: ampEnvRef.value,
    output: outputRef.value,
    delay: delayRef.value,
    reverb: reverbRef.value,
  };
}

async function refreshConfigList() {
  configList.value = await ConfigManager.list();
}

async function saveConfig() {
  const name = newConfigName.value.trim();
  if (!name) return;
  const mods = getModules();
  if (!mods.osc1) return;
  await ConfigManager.save(name, ConfigManager.serialize(mods as any));
  await refreshConfigList();
  selectedConfig.value = name;
  loadedConfigName = name;
  loadedSnapshot = JSON.stringify(ConfigManager.serialize(mods as any));
  isDirty.value = false;
  newConfigName.value = '';
}

async function loadConfig(name?: string) {
  const target = name ?? selectedConfig.value;
  if (!target) return;
  const data = await ConfigManager.load(target);
  if (!data) return;
  const mods = getModules();
  if (!mods.osc1) return;
  ConfigManager.deserialize(data, mods as any);
  selectedConfig.value = target;
  loadedConfigName = target;
  loadedSnapshot = JSON.stringify(ConfigManager.serialize(mods as any));
  isDirty.value = false;
}

async function deleteConfig() {
  const target = selectedConfig.value;
  if (!target) return;
  await ConfigManager.remove(target);
  await refreshConfigList();
  if (loadedConfigName === target) {
    loadedConfigName = null;
    loadedSnapshot = null;
    isDirty.value = false;
  }
  selectedConfig.value = configList.value[0] ?? '';
}

function resetConfig() {
  if (!loadedConfigName) return;
  void loadConfig(loadedConfigName);
}

function exportConfig() {
  const mods = getModules();
  if (!mods.osc1) return;
  const name = selectedConfig.value || newConfigName.value.trim() || 'synth-config';
  const data = ConfigManager.serialize(mods as any);
  const blob = new Blob([JSON.stringify({ name, data }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Full serialized state (reactive to all modules, including delay/reverb)
const serializedState = computed(() => {
  const mods = getModules();
  if (!mods.osc1) return null;
  return JSON.stringify(ConfigManager.serialize(mods as any));
});

// Dirty tracking
watch(serializedState, (current) => {
  if (loadedSnapshot === null || current === null) {
    isDirty.value = false;
    return;
  }
  isDirty.value = current !== loadedSnapshot;
});

onMounted(async () => {
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
    startNote: 24,
    inputEnabled: keyboardInputEnabled,
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

  // Config manager
  await ConfigManager.init();
  await ConfigManager.seedDefaults();
  await refreshConfigList();
  if (configList.value.length > 0) {
    await loadConfig(configList.value[0]);
  }
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
  <section
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8 gap-4"
  >
    <div class="w-full max-w-4xl flex items-center justify-end gap-2 flex-wrap">
      <label class="flex items-center gap-2 text-slate-300 text-sm cursor-pointer select-none">
        <input
          v-model="keyboardInputEnabled"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
        />
        Keyboard input
      </label>
      <select
        v-model="selectedConfig"
        class="bg-slate-800 text-slate-200 text-sm rounded px-2 py-1 border border-slate-700"
        @change="loadConfig()"
      >
        <option v-for="c in configList" :key="c" :value="c">
          {{ isDirty && c === loadedConfigName ? '*' + c : c }}
        </option>
      </select>
      <input
        v-model="newConfigName"
        type="text"
        placeholder="Config name"
        class="bg-slate-800 text-slate-200 text-sm rounded px-2 py-1 border border-slate-700 w-32"
      />
      <button
        class="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        @click="saveConfig"
      >
        Save
      </button>
      <button
        class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
        @click="deleteConfig"
        :disabled="!selectedConfig"
      >
        Delete
      </button>
      <button
        class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
        @click="resetConfig"
        :disabled="!loadedConfigName || !isDirty"
      >
        Reset
      </button>
      <button
        v-if="props.devEnabled"
        class="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
        @click="exportConfig"
      >
        Export
      </button>
    </div>
    <canvas
      ref="canvasRef"
      width="960"
      height="420"
      class="rounded-xl border border-slate-800 bg-slate-900 touch-none select-none"
    ></canvas>
  </section>
</template>
