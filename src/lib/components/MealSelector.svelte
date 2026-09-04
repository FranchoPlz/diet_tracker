<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DietPlan, IngredientItem } from '$lib/types';
  import { 
    formatQuantity, 
    getEffectiveMealOptionIndex, 
    getEffectiveAlternativeChoice,
    setMealOptionIndex,
    setAlternativeChoice,
  } from '$lib/utils';

  let { dayIndex, dietData, asException, ignoreDayException = false } = $props<{
    dayIndex: number;
    dietData: DietPlan;
    asException: boolean;
    ignoreDayException?: boolean;
  }>();

  let day = $derived(appState.weekConfig.days[dayIndex]);
  let expandedMeals = $state<Record<number, boolean>>({});

  function formatItem(item: IngredientItem): string {
    if (item.is_combination && item.sub_items && item.sub_items.length > 0) {
      return item.sub_items.map(si => {
        const qty = formatQuantity(si.quantity, si.unit);
        return qty === 'sin cantidad' ? si.name : `${si.name} ${qty}`;
      }).join(' + ');
    }
    const qty = formatQuantity(item.quantity, item.unit);
    return qty === 'sin cantidad' ? item.name : `${item.name} ${qty}`;
  }

  function invalidateShoppingList() {
    appState.shoppingList = [];
    appState.checkedShoppingItems = {};
  }

  function isExpanded(mealIndex: number): boolean {
    return expandedMeals[mealIndex] ?? false;
  }

  function setAllExpanded(expanded: boolean) {
    dietData.meals.forEach((_: unknown, mealIndex: number) => {
      expandedMeals[mealIndex] = expanded;
    });
  }

  function selectedMealOption(mealType: DietPlan['meals'][number]['type']): number {
    return ignoreDayException
      ? appState.weekConfig.dietDefaults[day.diet]?.mealOptionIndexes[mealType] ?? 0
      : getEffectiveMealOptionIndex(appState.weekConfig, dayIndex, mealType);
  }

  function selectedAlternative(altKey: string): number {
    return ignoreDayException
      ? appState.weekConfig.dietDefaults[day.diet]?.alternativeChoices[altKey] ?? 0
      : getEffectiveAlternativeChoice(appState.weekConfig, dayIndex, altKey);
  }
</script>

<div class="compact-meals flex flex-col gap-4">
  <div class="flex items-center justify-end gap-1 px-1">
    <button class="rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white" onclick={() => setAllExpanded(true)}>Abrir todo</button>
    <span class="text-stone-300 dark:text-stone-700">·</span>
    <button class="rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white" onclick={() => setAllExpanded(false)}>Cerrar todo</button>
  </div>

  {#each dietData.meals as meal, mealIndex}
    {@const selectedOptionIndex = selectedMealOption(meal.type)}
    {@const option = meal.options[selectedOptionIndex]}

    <section class="compact-meal-card overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
      <button
        class="compact-meal-heading flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800/70"
        onclick={() => expandedMeals[mealIndex] = !isExpanded(mealIndex)}
        aria-expanded={isExpanded(mealIndex)}
        aria-controls="meal-{dayIndex}-{mealIndex}"
      >
        <span class="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-black text-stone-500 transition-transform dark:bg-stone-800 dark:text-stone-300 {isExpanded(mealIndex) ? 'rotate-90' : ''}">›</span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-black tracking-[0.12em] text-stone-800 dark:text-white">{meal.type}</span>
          <span class="mt-0.5 block truncate text-xs text-stone-500 dark:text-stone-400">{option?.name || `Opción ${selectedOptionIndex + 1}`}</span>
        </span>
        {#if meal.options.length > 1}
          <span class="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">{meal.options.length} opciones</span>
        {/if}
      </button>

      {#if isExpanded(mealIndex)}
        <div id="meal-{dayIndex}-{mealIndex}" class="compact-meal-body border-t border-stone-100 p-4 dark:border-stone-800">
          {#if meal.options.length > 1}
            <fieldset class="compact-option-grid mb-5 grid grid-cols-1 gap-2 rounded-xl bg-stone-100 p-2 dark:bg-stone-950/60 sm:grid-cols-2">
              <legend class="sr-only">Opciones para {meal.type}</legend>
              {#each meal.options as opt, optIdx}
                <label class="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-red-500 {selectedOptionIndex === optIdx ? 'border-red-500 bg-red-50 shadow-sm dark:border-red-500 dark:bg-red-950/40' : 'border-transparent bg-white hover:border-stone-300 dark:bg-stone-800 dark:hover:border-stone-600'}">
                  <input
                    type="radio"
                    name="meal-{dayIndex}-{meal.type}"
                    class="peer sr-only"
                    checked={selectedOptionIndex === optIdx}
                    onchange={() => {
                      setMealOptionIndex(appState.weekConfig, dayIndex, meal.type, optIdx, asException);
                      invalidateShoppingList();
                    }}
                  />
                  <span aria-hidden="true" class="grid size-5 shrink-0 place-items-center rounded-full border-2 bg-white transition dark:bg-stone-900 {selectedOptionIndex === optIdx ? 'border-red-600' : 'border-stone-300 dark:border-stone-500'}"><span class="size-2.5 rounded-full bg-red-600 transition {selectedOptionIndex === optIdx ? 'opacity-100' : 'opacity-0'}"></span></span>
                  <span class="text-sm font-bold {selectedOptionIndex === optIdx ? 'text-red-800 dark:text-red-200' : 'text-stone-700 dark:text-stone-200'}">{opt.name || `Opción ${optIdx + 1}`}</span>
                </label>
              {/each}
            </fieldset>
          {/if}

          {#if option}
            <div class="flex flex-col gap-4">
              {#if option.name && option.name !== meal.type && !option.name.startsWith('OPCIÓN')}
                <div class="text-sm font-bold text-teal-700 dark:text-teal-300">{option.name}</div>
              {/if}

              {#each option.ingredient_lines as line, lineIndex}
                {@const altKey = `${mealIndex}-${selectedOptionIndex}-${lineIndex}`}

                <div class="flex flex-col py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0 last:pb-0">
                  {#if line.is_alternatives}
                    {@const selectedAltIndex = selectedAlternative(altKey)}
                    <span class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Elegir una opción:</span>
                    <fieldset class="flex flex-col gap-2">
                      <legend class="sr-only">Alternativas de ingredientes</legend>
                      {#each line.items as item, itemIndex}
                        <label class="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-red-500 {selectedAltIndex === itemIndex ? 'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/40' : 'border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600'}">
                          <input
                            type="radio"
                            name="alt-{dayIndex}-{altKey}"
                            class="peer sr-only"
                            checked={selectedAltIndex === itemIndex}
                            onchange={() => {
                              setAlternativeChoice(appState.weekConfig, dayIndex, altKey, itemIndex, asException);
                              invalidateShoppingList();
                            }}
                          />
                          <span aria-hidden="true" class="grid size-5 shrink-0 place-items-center rounded-full border-2 bg-white transition dark:bg-stone-900 {selectedAltIndex === itemIndex ? 'border-red-600' : 'border-stone-300 dark:border-stone-500'}"><span class="size-2.5 rounded-full bg-red-600 transition {selectedAltIndex === itemIndex ? 'opacity-100' : 'opacity-0'}"></span></span>
                          <span class="text-sm font-semibold leading-relaxed {selectedAltIndex === itemIndex ? 'text-red-800 dark:text-red-200' : 'text-stone-700 dark:text-stone-200'}">
                            {formatItem(item)}
                          </span>
                        </label>
                      {/each}
                    </fieldset>
                  {:else}
                    <div class="flex items-start gap-3 pl-2">
                      <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
                      <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {#if line.is_combination || line.items.length > 1}
                          {line.items.map((item: IngredientItem) => formatItem(item)).join(' + ')}
                        {:else if line.items.length === 1}
                          {formatItem(line.items[0])}
                        {/if}
                      </span>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
          </div>
      {/if}
    </section>
  {/each}
</div>
