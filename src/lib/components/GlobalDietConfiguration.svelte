<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection } from '$lib/types';
  import MealSelector from './MealSelector.svelte';

  let { onComplete } = $props<{ onComplete: () => void }>();

  const dietNames: DaySelection['diet'][] = ['DIETA 1', 'DIETA 2'];

  function representativeDayIndex(dietName: DaySelection['diet']): number {
    return appState.weekConfig.days.findIndex(day => day.diet === dietName);
  }
</script>

<section class="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm dark:border-stone-700 dark:bg-stone-950">
  <header class="border-b border-stone-200 bg-white px-5 py-6 dark:border-stone-700 dark:bg-stone-900 sm:px-8">
    <h2 class="text-2xl font-black tracking-tight text-stone-950 dark:text-white sm:text-3xl">Configurar dietas</h2>
  </header>

  <div class="grid gap-5 p-4 sm:p-6 xl:grid-cols-2 xl:p-8">
    {#each dietNames as dietName, dietIndex}
      {@const dayIndex = representativeDayIndex(dietName)}
      {@const dietData = appState.parsedData?.diets.find(diet => diet.name === dietName)}
      <article class="min-w-0 rounded-3xl border bg-white p-4 dark:bg-stone-900 sm:p-5 {dietIndex === 0 ? 'border-amber-300 dark:border-amber-800' : 'border-teal-300 dark:border-teal-800'}">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] {dietIndex === 0 ? 'text-amber-700 dark:text-amber-400' : 'text-teal-700 dark:text-teal-400'}">Selección global</p>
            <h3 class="mt-1 text-xl font-black text-stone-950 dark:text-white">{dietName}</h3>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-bold {dietIndex === 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200'}">Todos sus días</span>
        </div>

        {#if dietData && dayIndex >= 0}
          <MealSelector {dayIndex} {dietData} asException={false} ignoreDayException={true} />
        {:else if !dietData}
          <p class="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">No se encontraron datos para {dietName}.</p>
        {:else}
          <p class="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Asigna al menos un día a {dietName} para poder configurar sus opciones globales.</p>
        {/if}
      </article>
    {/each}
  </div>

  <footer class="flex flex-col gap-3 border-t border-stone-200 bg-white px-5 py-5 dark:border-stone-700 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between sm:px-8">
    <button type="button" class="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900" onclick={onComplete}>
      Guardar configuración global
    </button>
  </footer>
</section>
