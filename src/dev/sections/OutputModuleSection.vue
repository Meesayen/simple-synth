<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { OutputModule } from '../../modules/OutputModule';
import { getAudioContext, resumeAudio } from '../../audio/AudioEngine';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const testEnabled = ref(false);

let host: CanvasHost | null = null;
let module: OutputModule | null = null;
let testOsc: OscillatorNode | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  module = new OutputModule({ x: 10, y: 10, host: host ?? undefined });
  host.add(module);
  host.fit();
});

watch(testEnabled, (on) => {
  if (!module) return;
  const ctx = getAudioContext();
  void resumeAudio();
  if (on) {
    if (testOsc) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    testOsc = ctx.createOscillator();
    testOsc.type = 'sawtooth';
    testOsc.frequency.value = 220;
    testOsc.connect(gain);
    gain.connect(module.input);
    testOsc.start();
  } else {
    if (!testOsc) return;
    try {
      testOsc.stop();
    } catch {
      // already stopped
    }
    testOsc.disconnect();
    testOsc = null;
  }
});

onBeforeUnmount(() => {
  if (testOsc) {
    try {
      testOsc.stop();
    } catch {
      // already stopped
    }
    testOsc.disconnect();
    testOsc = null;
  }
  host?.dispose();
  host = null;
  module = null;
});
</script>

<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Output Module</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="200"
        height="160"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-400 text-sm max-w-xs space-y-3">
        <p>Master volume and mute.</p>
        <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
          <input
            v-model="testEnabled"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
          />
          Test tone (sawtooth)
        </label>
      </div>
    </div>
  </section>
</template>
