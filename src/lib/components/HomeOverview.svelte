<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import ListLibrary from './ListLibrary.svelte';
  import PdfUpload from './PdfUpload.svelte';
  import PlanLibrary from './PlanLibrary.svelte';
</script>

<section class="mx-auto max-w-3xl space-y-3" aria-labelledby="home-title">
  <header class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 shadow-sm sm:px-5">
    <div>
    <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Plan activo</p>
      <h1 id="home-title" class="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{appState.activePlanName}</h1>
    </div>
    <div class="flex flex-wrap justify-end gap-2">
      <PlanLibrary />
      <ListLibrary />
    </div>
  </header>
  <PdfUpload />
</section>
