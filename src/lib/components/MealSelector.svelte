<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DietPlan, IngredientItem } from '$lib/types';
  import { formatQuantity } from '$lib/utils';

  let { dayIndex, dietData } = $props<{ 
    dayIndex: number;
    dietData: DietPlan;
  }>();

  let day = $derived(appState.weekConfig.days[dayIndex]);
  let dietIndex = $derived(appState.parsedData?.diets.findIndex(d => d.name === day.diet) ?? 0);

  function formatItem(item: IngredientItem): string {
    if (item.is_combination && item.sub_items && item.sub_items.length > 0) {
      return item.sub_items.map(si => {
        const qty = formatQuantity(si.quantity, si.unit);
        return qty === 'variable' ? si.name : `${si.name} ${qty}`;
      }).join(' + ');
    }
    const qty = formatQuantity(item.quantity, item.unit);
    return qty === 'variable' ? item.name : `${item.name} ${qty}`;
  }
</script>

<div class="flex flex-col gap-6">
  {#each dietData.meals as meal, mealIndex}
    {@const mealStateIndex = day.meals.findIndex(m => m.type === meal.type)}
    {@const mealSelection = day.meals[mealStateIndex]}
    {@const selectedOptionIndex = mealSelection?.selected_option_index ?? 0}
    {@const option = meal.options[selectedOptionIndex]}

    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
        <h4 class="text-lg font-black tracking-tight text-gray-800 dark:text-white">{meal.type}</h4>
      </div>

      {#if meal.options.length > 1}
        <div class="flex flex-wrap gap-3 mb-5 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
          {#each meal.options as opt, optIdx}
            <label class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md {selectedOptionIndex === optIdx ? 'bg-white dark:bg-gray-700 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}">
              <input 
                type="radio" 
                name="meal-{dayIndex}-{meal.type}"
                class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                checked={selectedOptionIndex === optIdx}
                onchange={() => {
                  if (mealStateIndex !== -1) {
                    appState.weekConfig.days[dayIndex].meals[mealStateIndex].selected_option_index = optIdx;
                  }
                }}
              />
              <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Opción {optIdx + 1}</span>
            </label>
          {/each}
        </div>
      {/if}

      {#if option}
        <div class="flex flex-col gap-4">
          {#if option.name && option.name !== meal.type && !option.name.startsWith('OPCIÓN')}
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400">{option.name}</div>
          {/if}
          
          {#each option.ingredient_lines as line, lineIndex}
            {@const altKey = `${dietIndex}-${mealIndex}-${selectedOptionIndex}-${lineIndex}`}
            
            <div class="flex flex-col py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0 last:pb-0">
              {#if line.is_alternatives}
                {@const selectedAltIndex = appState.weekConfig.alternative_choices[altKey] ?? 0}
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Elegir una opción:</span>
                <div class="flex flex-col gap-2 pl-2">
                  
                  {#each line.items as item, itemIndex}
                    <label class="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="alt-{dayIndex}-{altKey}"
                        class="mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        checked={selectedAltIndex === itemIndex}
                        onchange={() => appState.weekConfig.alternative_choices[altKey] = itemIndex}
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white">
                        {formatItem(item)}
                      </span>
                    </label>
                  {/each}
                </div>
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
  {/each}
</div>