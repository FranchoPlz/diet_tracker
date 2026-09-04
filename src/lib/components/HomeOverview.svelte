<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import PdfUpload from './PdfUpload.svelte';
  import PlanLibrary from './PlanLibrary.svelte';

  let { onResetWeek } = $props<{ onResetWeek: () => void }>();
</script>

<section class="mx-auto max-w-3xl space-y-3" aria-labelledby="home-title">
  <header class="app-surface relative z-40 flex flex-wrap items-center justify-between gap-3 overflow-visible rounded-3xl border px-4 py-4 sm:px-5">
    <div>
    <p class="text-xs font-black uppercase tracking-[0.22em]" style="color: var(--warm);">Plan activo</p>
      <h1 id="home-title" class="mt-1 text-xl font-black tracking-tight sm:text-2xl" style="color: var(--text-primary);">{appState.activePlanName}</h1>
    </div>
    <div class="flex flex-wrap justify-end gap-2">
      <PlanLibrary />
      <PdfUpload compact actionLabel="Cambiar PDF" />
    </div>
  </header>
  <button class="w-full rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:border-red-400 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50" onclick={onResetWeek}>Reiniciar semana manualmente</button>
</section>
