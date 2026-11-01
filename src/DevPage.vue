<script setup lang="ts">
import { ref } from 'vue';
import { showHitboxes, showBBoxes } from './canvas/debug';
import KnobSection from './dev/sections/KnobSection.vue';
import SliderSection from './dev/sections/SliderSection.vue';
import ToggleSection from './dev/sections/ToggleSection.vue';
import WaveSelectorSection from './dev/sections/WaveSelectorSection.vue';
import OscillatorModuleSection from './dev/sections/OscillatorModuleSection.vue';
import FilterModuleSection from './dev/sections/FilterModuleSection.vue';
import EnvelopeModuleSection from './dev/sections/EnvelopeModuleSection.vue';

const activeTab = ref<'components' | 'modules'>('components');
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
      <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
        <input
          v-model="showBBoxes"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
        />
        Show bboxes
      </label>
    </div>

    <div class="flex gap-2 border-b border-slate-800">
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2"
        :class="
          activeTab === 'components'
            ? 'border-indigo-500 text-white'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        "
        @click="activeTab = 'components'"
      >
        Components
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2"
        :class="
          activeTab === 'modules'
            ? 'border-indigo-500 text-white'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        "
        @click="activeTab = 'modules'"
      >
        Modules
      </button>
    </div>

    <div v-if="activeTab === 'components'" class="space-y-6">
      <KnobSection />
      <SliderSection />
      <ToggleSection />
      <WaveSelectorSection />
    </div>
    <div v-else class="space-y-6">
      <OscillatorModuleSection />
      <FilterModuleSection />
      <EnvelopeModuleSection />
    </div>
  </main>
</template>
