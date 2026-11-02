<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CanvasHost } from '../../canvas/CanvasHost';
import { MixModule } from '../../modules/MixModule';
import { getAudioContext, resumeAudio } from '../../audio/AudioEngine';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const testEnabled = ref(false);

let host: CanvasHost | null = null;
let module: MixModule | null = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  host = new CanvasHost(canvasRef.value);
  module = new MixModule({ x: 10, y: 10, host: host ?? undefined });
  host.add(module);
  host.fit();
});

watch(testEnabled, (on) => {
  if (!module) return;
  const ctx = getAudioContext();
  void resumeAudio();
  if (on) {
    if (osc1) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 220;
    osc1.connect(gain);
    gain.connect(module.input1);
    osc1.start();

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.1;
    osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 330;
    osc2.connect(gain2);
    gain2.connect(module.input2);
    osc2.start();
  } else {
    if (osc1) {
      try {
        osc1.stop();
      } catch {
        /* already stopped */
      }
      osc1.disconnect();
      osc1 = null;
    }
    if (osc2) {
      try {
        osc2.stop();
      } catch {
        /* already stopped */
      }
      osc2.disconnect();
      osc2 = null;
    }
  }
});

onBeforeUnmount(() => {
  if (osc1) {
    try {
      osc1.stop();
    } catch {
      /* */
    }
    osc1.disconnect();
    osc1 = null;
  }
  if (osc2) {
    try {
      osc2.stop();
    } catch {
      /* */
    }
    osc2.disconnect();
    osc2 = null;
  }
  host?.dispose();
  host = null;
  module = null;
});
</script>

<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <h2 class="text-xl font-semibold text-white mb-4">Mix Module</h2>
    <div class="flex items-center gap-6">
      <canvas
        ref="canvasRef"
        width="200"
        height="160"
        class="rounded-lg border border-slate-700 bg-slate-950 touch-none select-none"
      ></canvas>
      <div class="text-slate-400 text-sm max-w-xs space-y-3">
        <p>Crossfade between two inputs. Mix 0 = input 1, Mix 1 = input 2.</p>
        <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
          <input
            v-model="testEnabled"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
          />
          Test tones (220Hz + 330Hz)
        </label>
      </div>
    </div>
  </section>
</template>
