<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { IngredientItem } from '$lib/types';
  import { formatQuantity, getEffectiveAlternativeChoice, getEffectiveMealOptionIndex } from '$lib/utils';

  let { onEdit } = $props<{ onEdit: (dayIndex: number) => void }>();
  let expandedMeals = $state<Record<number, boolean>>({});
  const dayIndex = $derived(appState.weekTracker.activeDayIndex);
  const day = $derived(appState.weekConfig.days[dayIndex]);
  const diet = $derived(appState.parsedData?.diets.find((item) => item.name === day?.diet));

  function formatItem(item: IngredientItem): string {
    if (item.is_combination && item.sub_items?.length) return item.sub_items.map(formatItem).join(' + ');
    const quantity = formatQuantity(item.quantity, item.unit);
    return quantity === 'sin cantidad' ? item.name : `${item.name} ${quantity}`;
  }
</script>

<section class="app-surface overflow-hidden rounded-3xl border" aria-label={`Dieta del día ${dayIndex + 1}`}>
  <header class="flex items-center gap-3 border-b border-stone-200 px-4 py-4 dark:border-stone-700 sm:px-6">
    <div class="min-w-0 flex-1">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Hoy toca · {day?.diet}</p>
      <h2 class="mt-1 text-2xl font-black">Día {dayIndex + 1}</h2>
    </div>
    <button class="min-h-11 rounded-xl border border-stone-300 px-3 text-sm font-black dark:border-stone-600" onclick={() => onEdit(dayIndex)}>Modificar día</button>
  </header>
  {#if diet}
    <div class="space-y-2 p-3 sm:p-4">
      {#each diet.meals as meal, mealIndex}
        {@const optionIndex = getEffectiveMealOptionIndex(appState.weekConfig, dayIndex, meal.type)}
        {@const option = meal.options[optionIndex]}
        <article class="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700">
          <button class="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800" onclick={() => expandedMeals[mealIndex] = !expandedMeals[mealIndex]} aria-expanded={expandedMeals[mealIndex] ?? false} aria-controls="current-meal-{mealIndex}">
            <span><span class="block text-xs font-black uppercase tracking-[0.15em] text-stone-500">{meal.type}</span><span class="mt-0.5 block text-base font-black">{option?.name ?? `Opción ${optionIndex + 1}`}</span></span>
            <span aria-hidden="true" class="text-xl text-stone-400 transition-transform {expandedMeals[mealIndex] ? 'rotate-180' : ''}">⌄</span>
          </button>
          {#if option && expandedMeals[mealIndex]}
            <ul class="mt-3 space-y-2">
              {#each option.ingredient_lines as line, lineIndex}
                {@const selected = getEffectiveAlternativeChoice(appState.weekConfig, dayIndex, `${mealIndex}-${optionIndex}-${lineIndex}`)}
                <li class="flex gap-2 text-sm text-stone-600 dark:text-stone-300"><span class="text-orange-600">•</span><span>{line.is_alternatives ? (line.items[selected] ? formatItem(line.items[selected]) : 'Sin selección') : line.items.map(formatItem).join(' + ')}</span></li>
              {/each}
            </ul>
          {/if}
        </article>
      {/each}
    </div>
  {:else}
    <p class="p-5 text-sm text-stone-500">No hay una dieta disponible para este día.</p>
  {/if}
</section>
