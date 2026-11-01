<script setup lang="ts">
import { onMounted, ref } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 960, 600);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Synth Canvas', 480, 290);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('960 × 600 · 16:10', 480, 320);
});
</script>

<template>
  <section class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
    <div class="w-[960px] max-w-full aspect-[16/10]">
      <canvas
        ref="canvas"
        width="960"
        height="600"
        class="w-full h-full rounded-xl border border-slate-800 bg-slate-900"
      ></canvas>
    </div>
  </section>
</template>
