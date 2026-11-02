<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { Knob } from '../../controls/Knob';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const value = ref(0.5);

let host: CanvasHost | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  host.add(
    new Knob({
      x: 120,
      y: 80,
      radius: 44,
      min: 0,
      max: 1,
      step: 0.01,
      value,
      label: 'Gain',
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
    <h2 class="text-xl font-semibold text-white mb-4">Knob</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="240"
        height="160"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-300">
        <div class="text-sm text-slate-500">Value</div>
        <div class="text-2xl font-mono text-indigo-400">{{ value.toFixed(3) }}</div>
        <div class="text-xs text-slate-500 mt-2">Drag vertically to change</div>
      </div>
    </div>
  </section>
</template>
