<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { CanvasHost } from '../canvas/CanvasHost';
import { HStack } from '../layout/Container';
import { OscillatorModule } from '../modules/OscillatorModule';
import { MixModule } from '../modules/MixModule';
import { OutputModule } from '../modules/OutputModule';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let host: CanvasHost | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);

  const osc1 = new OscillatorModule({ x: 10, y: 10, host: host ?? undefined });
  const osc2 = new OscillatorModule({ x: 10, y: 10, host: host ?? undefined });
  const mix = new MixModule({ x: 10, y: 10, host: host ?? undefined });
  const output = new OutputModule({ x: 10, y: 10, host: host ?? undefined });

  // Audio routing
  osc1.output.connect(mix.input1);
  osc2.output.connect(mix.input2);
  mix.output.connect(output.input);

  // Power on oscillators by default
  osc1.power.value = true;
  osc2.power.value = true;

  const layout = new HStack(10, 10, [osc1, osc2, mix, output], 16, 'top');
  host.add(layout);
  host.fit();
});

onBeforeUnmount(() => {
  host?.dispose();
  host = null;
});
</script>

<template>
  <section class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
    <canvas
      ref="canvasRef"
      width="960"
      height="260"
      class="rounded-xl border border-slate-800 bg-slate-900 touch-none select-none"
    ></canvas>
  </section>
</template>
