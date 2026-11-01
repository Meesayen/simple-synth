<script setup lang="ts">
import { ref } from 'vue';
import Synth from './components/Synth.vue';
import DevPage from './DevPage.vue';

const page = ref<'synth' | 'dev'>('synth');
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <nav class="flex justify-center gap-4 py-4 border-b border-slate-800">
      <button
        class="px-4 py-2 rounded-lg font-medium transition-colors"
        :class="
          page === 'synth'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        "
        @click="page = 'synth'"
      >
        Synth
      </button>
      <button
        class="px-4 py-2 rounded-lg font-medium transition-colors"
        :class="
          page === 'dev'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        "
        @click="page = 'dev'"
      >
        Dev
      </button>
    </nav>

    <Synth v-if="page === 'synth'" />
    <DevPage v-else />
  </div>
</template>
