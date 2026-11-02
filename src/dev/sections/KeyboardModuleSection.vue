<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { KeyboardModule } from '../../modules/KeyboardModule';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let host: CanvasHost | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  host.add(
    new KeyboardModule({
      x: 10,
      y: 10,
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
    <h2 class="text-xl font-semibold text-white mb-4">Keyboard Module</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="300"
        height="100"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-400 text-sm max-w-xs">
        Click keys or use QWERTY. Shift = second octave.
      </div>
    </div>
  </section>
</template>
