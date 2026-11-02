<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { WaveSelector } from '../../controls/WaveSelector';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const value = ref(0);

let host: CanvasHost | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  host.add(
    new WaveSelector({
      x: 16,
      y: 16,
      knobRadius: 22,
      vizWidth: 120,
      vizHeight: 72,
      value,
      label: 'WaveSelector',
      host: host ?? undefined,
    }),
  );
  host.fit();
});

onBeforeUnmount(() => {
  host?.dispose();
  host = null;
});
</script>

<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="text-xl font-semibold text-white mb-4">WaveSelector</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="280"
        height="120"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-300">
        <div class="text-sm text-slate-500">Waveform</div>
        <div class="text-2xl font-mono text-indigo-400 capitalize">
          {{ ['sine', 'triangle', 'sawtooth', 'square'][value] }}
        </div>
        <div class="text-xs text-slate-500 mt-2">Click on a tick to select</div>
      </div>
    </div>
  </section>
</template>
