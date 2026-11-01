<script setup lang="ts">
import { showHitboxes } from './canvas/debug';
import KnobSection from './dev/sections/KnobSection.vue';
import SliderSection from './dev/sections/SliderSection.vue';
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dev Page</h1>
        <p class="text-slate-400 max-w-2xl">
          Development surface for canvas components and synth modules.
        </p>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
        <input
          v-model="showHitboxes"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
        />
        Show hitboxes
      </label>
    </div>
    <KnobSection />
    <SliderSection />
  </main>
</template>
