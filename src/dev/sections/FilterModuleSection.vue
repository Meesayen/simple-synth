<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { FilterModule } from '../../modules/FilterModule';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let host: CanvasHost | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  host.add(new FilterModule({ x: 10, y: 10, host: host ?? undefined }));
  host.fit();
});

onBeforeUnmount(() => {
  host?.dispose();
  host = null;
});
</script>

<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Filter Module</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="300"
        height="220"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-400 text-sm max-w-xs">
        Select filter type (LP/BP/HP) and adjust cutoff and resonance.
      </div>
    </div>
  </section>
</template>
