<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { Toggle } from '../../controls/Toggle';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const value = ref(false);

let host: CanvasHost | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  host.add(
    new Toggle({
      x: 28,
      y: 20,
      width: 44,
      height: 24,
      value,
      label: 'Power',
      host: host ?? undefined,
    }),
  );
});

onBeforeUnmount(() => {
  host?.dispose();
  host = null;
});
</script>

<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Toggle</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="100"
        height="80"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-300">
        <div class="text-sm text-slate-500">State</div>
        <div class="text-2xl font-mono" :class="value ? 'text-indigo-400' : 'text-slate-500'">
          {{ value ? 'ON' : 'OFF' }}
        </div>
        <div class="text-xs text-slate-500 mt-2">Click or drag up/down</div>
      </div>
    </div>
  </section>
</template>
