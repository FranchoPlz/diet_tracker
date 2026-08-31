<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection, IngredientItem } from '$lib/types';
  import { formatQuantity, hasException } from '$lib/utils';

  let { onReconfigure, onEditException } = $props<{
    onReconfigure: () => void;
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

<section class="space-y-5" aria-label="Resumen de dietas">
  <header class="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between sm:p-7">
    <div>
      <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Tu selección</p>
      <h2 class="mt-1 text-2xl font-black tracking-tight text-stone-950 dark:text-white">Resumen global de las dietas</h2>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Consulta los platos elegidos y abre cualquier día para crear o revisar una excepción.</p>
    </div>
    <button type="button" class="shrink-0 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-black text-stone-700 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800" onclick={onReconfigure}>
      Reconfigurar dietas
    </button>
  </header>

  <div class="grid gap-5 xl:grid-cols-2">
    {#each dietNames as dietName, dietIndex}
      {@const dayIndex = representativeDayIndex(dietName)}
      {@const dietData = appState.parsedData?.diets.find(diet => diet.name === dietName)}
      <article class="min-w-0 overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-stone-900 {dietIndex === 0 ? 'border-amber-300 dark:border-amber-800' : 'border-teal-300 dark:border-teal-800'}">
        <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <h3 class="text-xl font-black text-stone-950 dark:text-white">{dietName}</h3>
          <span class="rounded-full px-3 py-1 text-xs font-bold {dietIndex === 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200'}">Selección actual</span>
        </div>

        {#if dietData && dayIndex >= 0}
          <div class="divide-y divide-stone-100 dark:divide-stone-800">
            {#each dietData.meals as meal, mealIndex}
              {@const optionIndex = appState.weekConfig.dietDefaults[dietName]?.mealOptionIndexes[meal.type] ?? 0}
              {@const option = meal.options[optionIndex]}
              <section class="p-5">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 class="text-xs font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">{meal.type}</h4>
                  <p class="text-sm font-black text-stone-900 dark:text-white">{option?.name || `Opción ${optionIndex + 1}`}</p>
                </div>
                {#if option}
                  <ul class="mt-3 space-y-2">
                    {#each option.ingredient_lines as line, lineIndex}
                      {@const altKey = `${mealIndex}-${optionIndex}-${lineIndex}`}
                      {@const selectedAlternative = line.is_alternatives ? appState.weekConfig.dietDefaults[dietName]?.alternativeChoices[altKey] ?? 0 : 0}
                      <li class="flex items-start gap-2 text-sm leading-5 text-stone-600 dark:text-stone-300">
                        <span class="mt-2 size-1.5 shrink-0 rounded-full {line.is_alternatives ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-600'}"></span>
                        <span>
                          {#if line.is_alternatives}
                            <span class="mr-1 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400">Alternativa elegida:</span>
                            {line.items[selectedAlternative] ? formatItem(line.items[selectedAlternative]) : 'Sin selección'}
                          {:else}
                            {line.items.map(formatItem).join(' + ')}
                          {/if}
                        </span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </section>
            {/each}
          </div>
        {:else}
          <p class="m-5 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {dietData ? `No hay ningún día asignado a ${dietName}.` : `No se encontraron datos para ${dietName}.`}
          </p>
        {/if}
      </article>
    {/each}
  </div>

  <section class="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-6" aria-labelledby="exceptions-heading">
    <div class="mb-4">
      <h3 id="exceptions-heading" class="text-lg font-black text-stone-950 dark:text-white">Excepciones de la semana</h3>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Abre un día para adaptar sus platos sin cambiar la selección global.</p>
    </div>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
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
  </section>
</section>
