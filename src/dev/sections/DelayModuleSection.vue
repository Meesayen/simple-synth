<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { DelayModule } from '../../modules/DelayModule';
import { getAudioContext, getMasterGain, resumeAudio } from '../../audio/AudioEngine';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let host: CanvasHost | null = null;
let module: DelayModule | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  module = new DelayModule({ x: 10, y: 10, host: host ?? undefined });
  host.add(module);
  host.fit();
  module.output.connect(getMasterGain());
});

function trigger() {
  if (!module) return;
  const ctx = getAudioContext();
  void resumeAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 220;
  gain.gain.value = 0.1;
  osc.connect(gain);
  gain.connect(module.input);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // already disconnected
    }
  };
}

onBeforeUnmount(() => {
  host?.dispose();
  host = null;
  module = null;
});
</script>

<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Delay Module</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="260"
        height="200"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-400 text-sm max-w-xs space-y-3">
        <p>
          Short sawtooth impulse (10% volume) through the delay. Adjust time, feedback, mix and
          tone.
        </p>
        <button
          class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium text-white select-none"
          @click="trigger"
        >
          Trigger
        </button>
      </div>
    </div>
  </section>
</template>
