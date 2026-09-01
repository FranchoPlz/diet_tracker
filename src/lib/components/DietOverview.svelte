<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection, IngredientItem } from '$lib/types';
  import { formatQuantity, hasException } from '$lib/utils';

  let { onEditException } = $props<{
    onEditException: (dayIndex: number) => void;
  }>();

  const dietNames: DaySelection['diet'][] = ['DIETA 1', 'DIETA 2'];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  function representativeDayIndex(dietName: DaySelection['diet']): number {
    return appState.weekConfig.days.findIndex(day => day.diet === dietName);
  }

  function formatItem(item: IngredientItem): string {
    if (item.is_combination && item.sub_items?.length) {
      return item.sub_items.map(formatItem).join(' + ');
    }
    const quantity = formatQuantity(item.quantity, item.unit);
    return quantity === 'sin cantidad' ? item.name : `${item.name} ${quantity}`;
  }
</script>

<section class="space-y-4" aria-label="Resumen de dietas">
  <div class="grid gap-5 xl:grid-cols-2">
    {#each dietNames as dietName, dietIndex}
      {@const dayIndex = representativeDayIndex(dietName)}
      {@const dietData = appState.parsedData?.diets.find(diet => diet.name === dietName)}
      <details class="group min-w-0 overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-stone-900 {dietIndex === 0 ? 'border-orange-300 dark:border-orange-800' : 'border-red-300 dark:border-red-800'}">
        <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 [&::-webkit-details-marker]:hidden">
          <span>
            <span class="block text-xl font-black text-stone-950 dark:text-white">{dietName}</span>
          </span>
          <span class="flex items-center gap-2">
            <span aria-hidden="true" class="text-xl font-black text-stone-400 transition-transform group-open:rotate-180">⌄</span>
          </span>
        </summary>

        {#if dietData && dayIndex >= 0}
          <div class="space-y-2 border-t border-stone-100 p-3 dark:border-stone-800">
            {#each dietData.meals as meal, mealIndex}
              {@const optionIndex = appState.weekConfig.dietDefaults[dietName]?.mealOptionIndexes[meal.type] ?? 0}
              {@const option = meal.options[optionIndex]}
              <details class="group overflow-hidden rounded-xl border border-stone-100 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-950/30">
                <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 [&::-webkit-details-marker]:hidden">
                  <span class="min-w-0">
                    <span class="block text-xs font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">{meal.type}</span>
                    <span class="mt-0.5 block truncate text-sm font-black text-stone-900 dark:text-white">{option?.name || `Opción ${optionIndex + 1}`}</span>
                  </span>
                  <span aria-hidden="true" class="shrink-0 text-lg font-black text-stone-400 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                {#if option}
                  <ul class="space-y-2 border-t border-stone-100 px-4 py-3 dark:border-stone-800">
                    {#each option.ingredient_lines as line, lineIndex}
                      {@const altKey = `${mealIndex}-${optionIndex}-${lineIndex}`}
                      {@const selectedAlternative = line.is_alternatives ? appState.weekConfig.dietDefaults[dietName]?.alternativeChoices[altKey] ?? 0 : 0}
                      <li class="flex items-start gap-2 text-sm leading-5 text-stone-600 dark:text-stone-300">
                        <span class="mt-2 size-1.5 shrink-0 rounded-full {line.is_alternatives ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-600'}"></span>
                        <span>
                          {#if line.is_alternatives}
                            {line.items[selectedAlternative] ? formatItem(line.items[selectedAlternative]) : 'Sin selección'}
                          {:else}
                            {line.items.map(formatItem).join(' + ')}
                          {/if}
                        </span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </details>
            {/each}
          </div>
        {:else}
          <p class="m-5 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {dietData ? `No hay ningún día asignado a ${dietName}.` : `No se encontraron datos para ${dietName}.`}
          </p>
        {/if}
      </details>
    {/each}
  </div>

  <details class="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
    <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 sm:px-6 [&::-webkit-details-marker]:hidden">
      <h3 class="text-lg font-black text-stone-950 dark:text-white">Excepciones</h3>
      <span aria-hidden="true" class="text-xl font-black text-stone-400 transition-transform group-open:rotate-180">⌄</span>
    </summary>
    <div class="grid grid-cols-2 gap-2 border-t border-stone-100 p-4 dark:border-stone-800 sm:grid-cols-4 sm:p-6 xl:grid-cols-7">
      {#each appState.weekConfig.days.slice(0, 7) as day, dayIndex}
        {@const isException = hasException(appState.weekConfig, dayIndex)}
        <button
          type="button"
          class="min-w-0 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm {isException ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30' : 'border-stone-200 bg-stone-50 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800/60'}"
          onclick={() => onEditException(dayIndex)}
          aria-label="Editar excepción del día {day.day}"
        >
          <span class="block text-xs font-black uppercase tracking-wide text-stone-400">{dayNames[dayIndex] ?? `Día ${day.day}`}</span>
          <span class="mt-1 block truncate text-sm font-black text-stone-900 dark:text-white">{day.diet}</span>
          <span class="mt-2 block text-[11px] font-bold {isException ? 'text-orange-700 dark:text-orange-400' : 'text-stone-500 dark:text-stone-400'}">{isException ? 'Con excepción' : 'Sin excepción'}</span>
        </button>
      {/each}
    </div>
  </details>
</section>
