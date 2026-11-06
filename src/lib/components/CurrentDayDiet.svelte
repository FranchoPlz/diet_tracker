<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { formatIngredient, resolveDayMeals } from '$lib/utils';
  import RecipeInstructions from './RecipeInstructions.svelte';

  let { onEdit } = $props<{ onEdit: (dayIndex: number) => void }>();
  let expandedMeals = $state<Record<number, boolean>>({});
  const dayIndex = $derived(appState.weekTracker.activeDayIndex);
  const day = $derived(appState.weekConfig.days[dayIndex]);
  const meals = $derived(appState.parsedData ? resolveDayMeals(appState.weekConfig, appState.parsedData.diets, dayIndex) : []);
</script>

<section class="app-surface overflow-hidden rounded-3xl border" aria-label={`Dieta del día ${dayIndex + 1}`}>
  <header class="flex items-center gap-3 border-b border-stone-200 px-4 py-4 dark:border-stone-700 sm:px-6">
    <div class="min-w-0 flex-1">
      <h2 class="text-xl font-black uppercase tracking-tight text-warm">Hoy toca {day?.diet}</h2>
    </div>
    <button class="min-h-11 rounded-xl border border-stone-300 px-3 text-sm font-black dark:border-stone-600" onclick={() => onEdit(dayIndex)}>Modificar día</button>
  </header>
  {#if meals.length > 0}
    <div class="space-y-2 p-3 sm:p-4">
      {#each meals as { meal, mealIndex, optionIndex, option, lines } (mealIndex)}
        <article class="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700">
          <button class="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800" onclick={() => expandedMeals[mealIndex] = !expandedMeals[mealIndex]} aria-expanded={expandedMeals[mealIndex] ?? false} aria-controls="current-meal-{mealIndex}">
            <span><span class="block text-xs font-black uppercase tracking-[0.15em] text-stone-500">{meal.type}</span><span class="mt-0.5 block text-base font-black">{option?.name ?? `Opción ${optionIndex + 1}`}</span></span>
            <span aria-hidden="true" class="text-xl text-stone-400 transition-transform {expandedMeals[mealIndex] ? 'rotate-180' : ''}">⌄</span>
          </button>
          {#if option && expandedMeals[mealIndex]}
            <div id="current-meal-{mealIndex}" class="space-y-3 border-t border-stone-200 px-4 py-3 dark:border-stone-700">
              <ul class="space-y-2">
                {#each lines as { items }}
                  <li class="flex gap-2 text-sm text-stone-600 dark:text-stone-300">
                    <span class="text-warm">•</span>
                    <span>{items.length ? items.map(formatIngredient).join(' + ') : 'Sin selección'}</span>
                  </li>
                {/each}
              </ul>
              {#if option.description}
                <RecipeInstructions text={option.description} />
              {/if}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {:else}
    <p class="p-5 text-sm text-stone-500">No hay una dieta disponible para este día.</p>
  {/if}
</section>
