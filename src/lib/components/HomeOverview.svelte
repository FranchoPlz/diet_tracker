<script lang="ts">
  import { appState } from '$lib/state.svelte';
</script>

<section class="mx-auto max-w-3xl" aria-labelledby="home-title">
  <header class="rounded-2xl border border-stone-200 bg-white px-5 py-6 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:px-6">
    <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Plan activo</p>
    <h1 id="home-title" class="mt-1 text-2xl font-black tracking-tight text-stone-950 dark:text-white sm:text-3xl">{appState.activePlanName}</h1>
    <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">Elige una pestaña para consultar tu dieta, entrenamiento o compra.</p>
  </header>
</section>
