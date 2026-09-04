<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection } from '$lib/types';
  import MealSelector from './MealSelector.svelte';
  import WeekGrid from './WeekGrid.svelte';
  import DayDetail from './DayDetail.svelte';

  let { onComplete, initialDayIndex = null } = $props<{ onComplete: () => void; initialDayIndex?: number | null }>();

  const dietNames: DaySelection['diet'][] = ['DIETA 1', 'DIETA 2'];
  let selectedDayIndex = $state<number | null>(null);

  $effect.pre(() => {
    selectedDayIndex = initialDayIndex;
  });

  function representativeDayIndex(dietName: DaySelection['diet']): number {
    return appState.weekConfig.days.findIndex(day => day.diet === dietName);
  }
</script>

<section class="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 shadow-sm dark:border-stone-700 dark:bg-stone-950">
  <header class="border-b border-stone-200 bg-white px-4 py-4 dark:border-stone-700 dark:bg-stone-900 sm:px-6">
    <h2 class="text-xl font-black tracking-tight text-stone-950 dark:text-white sm:text-2xl">Configurar dietas</h2>
  </header>

  <div class="space-y-3 p-3 sm:p-4">
    <WeekGrid onDayClick={(dayIndex) => selectedDayIndex = dayIndex} onCollapse={() => selectedDayIndex = null} {selectedDayIndex} />
    {#if selectedDayIndex !== null}
      <DayDetail dayIndex={selectedDayIndex} onClose={() => selectedDayIndex = null} />
    {/if}
    <div class="grid gap-3 xl:grid-cols-2">
    {#each dietNames as dietName, dietIndex}
      {@const dayIndex = representativeDayIndex(dietName)}
      {@const dietData = appState.parsedData?.diets.find(diet => diet.name === dietName)}
      <details class="group min-w-0 overflow-hidden rounded-2xl border bg-white dark:bg-stone-900 {dietIndex === 0 ? 'border-orange-300 dark:border-orange-800' : 'border-red-300 dark:border-red-800'}">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] {dietIndex === 0 ? 'text-orange-700 dark:text-orange-400' : 'text-red-700 dark:text-red-300'}">Selección global</p>
            <h3 class="text-lg font-black text-stone-950 dark:text-white">{dietName}</h3>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-bold {dietIndex === 0 ? 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200' : 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'}"><span class="group-open:hidden">Abrir</span><span class="hidden group-open:inline">Cerrar</span></span>
        </summary>

        <div class="border-t border-stone-200 p-3 dark:border-stone-700">
          {#if dietData && dayIndex >= 0}
            <MealSelector {dayIndex} {dietData} asException={false} ignoreDayException={true} />
          {:else if !dietData}
            <p class="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">No se encontraron datos para {dietName}.</p>
          {:else}
            <p class="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Asigna al menos un día a {dietName} para poder configurar sus opciones globales.</p>
          {/if}
        </div>
      </details>
    {/each}
    </div>
  </div>

  <footer class="flex flex-col gap-3 border-t border-stone-200 bg-white px-5 py-5 dark:border-stone-700 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between sm:px-8">
    <button type="button" class="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900" onclick={onComplete}>
      Guardar cambios de dieta
    </button>
  </footer>
</section>
