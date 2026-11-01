<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

const cards = [
  { title: 'Vite+', description: 'Unified toolchain powered by Rolldown.' },
  { title: 'Vue 3', description: 'Reactive UI with Composition API.' },
  { title: 'Tailwind v4', description: 'Utility-first styling via @tailwindcss/vite.' },
];
</script>

<template>
  <main
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-8 p-8"
  >
    <h1 class="text-4xl font-bold tracking-tight text-white">Project Synth</h1>
    <p class="text-slate-400 max-w-md text-center">
      Demo scaffolded with Vite+, Vue 3, TypeScript and Tailwind CSS v4.
    </p>

    <div class="flex items-center gap-4">
      <button
        class="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors font-medium"
        @click="count++"
      >
        Count: {{ count }}
      </button>
      <span class="text-sm text-slate-500">Click to increment</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
      <div
        v-for="card in cards"
        :key="card.title"
        class="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-indigo-500 transition-colors"
      >
        <h2 class="text-lg font-semibold text-white">{{ card.title }}</h2>
        <p class="text-sm text-slate-400 mt-1">{{ card.description }}</p>
      </div>
    </div>
  </main>
</template>
