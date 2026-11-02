<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { EnvelopeModule } from '../../modules/EnvelopeModule';
import { getAudioContext, getMasterGain, resumeAudio } from '../../audio/AudioEngine';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let host: CanvasHost | null = null;
let module: EnvelopeModule | null = null;
let testOsc: OscillatorNode | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  module = new EnvelopeModule({ x: 10, y: 10, host: host ?? undefined });
  host.add(module);
  host.fit();
  module.output.connect(getMasterGain());

  const ctx = getAudioContext();
  void resumeAudio();
  testOsc = ctx.createOscillator();
  testOsc.type = 'sawtooth';
  testOsc.frequency.value = 220;
  testOsc.connect(module.input);
  testOsc.start();
});

function trigger() {
  void resumeAudio();
  module?.trigger();
}

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
    <h2 class="text-xl font-semibold text-white mb-4">Envelope Module</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="340"
        height="180"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-400 text-sm max-w-xs space-y-3">
        <p>ADSR envelope controlling a VCA. Adjust A, D, S, R.</p>
        <button
          class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium text-white"
          @click="trigger"
        >
          Trigger
        </button>
      </div>
    </div>
  </section>
</template>
