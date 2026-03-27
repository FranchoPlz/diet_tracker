<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { IngredientItem } from '$lib/types';

  // We manage the expanded state of each diet and each meal.
  // Using $state for object tracking.
  let expandedDiets = $state<Record<number, boolean>>({});
  let expandedMeals = $state<Record<string, boolean>>({});

  function toggleDiet(index: number) {
    expandedDiets[index] = !expandedDiets[index];
  }

  function toggleMeal(dietIndex: number, mealIndex: number) {
    const key = `${dietIndex}-${mealIndex}`;
    expandedMeals[key] = !expandedMeals[key];
  }

  function formatQuantity(item: IngredientItem): string {
    if (item.quantity === null || item.quantity === undefined) return '';
    return `${item.quantity} ${item.unit || ''}`.trim();
  }
</script>

{#if appState.parsedData && appState.parsedData.diets.length > 0}
  <div class="space-y-4">
    {#each appState.parsedData.diets as diet, dietIndex}
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <button
          class="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-bold text-lg text-gray-800 dark:text-gray-200"
          onclick={() => toggleDiet(dietIndex)}
        >
          <span>{diet.name}</span>
          <span class="text-xl">{expandedDiets[dietIndex] ? '▾' : '▸'}</span>
        </button>

        {#if expandedDiets[dietIndex]}
          <div class="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {#if diet.intro}
              <div class="mb-4 text-gray-600 dark:text-gray-400 italic whitespace-pre-wrap">
                {diet.intro}
              </div>
            {/if}

            {#each diet.meals as meal, mealIndex}
              <div class="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                <button
                  class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-semibold text-gray-700 dark:text-gray-300"
                  onclick={() => toggleMeal(dietIndex, mealIndex)}
                >
                  <span>{meal.type}</span>
                  <span>{expandedMeals[`${dietIndex}-${mealIndex}`] ? '▾' : '▸'}</span>
                </button>

                {#if expandedMeals[`${dietIndex}-${mealIndex}`]}
                  <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
                    {#each meal.options as option, optionIndex}
                      <div class="space-y-2">
                        <div class="font-medium text-gray-800 dark:text-gray-200">
                          {option.name}
                          {#if option.description}
                            <span class="text-gray-500 dark:text-gray-400 text-sm font-normal ml-2">({option.description})</span>
                          {/if}
                        </div>
                        
                        <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {#each option.ingredient_lines as line}
                            <li>
                              {#if line.is_alternatives}
                                <div class="flex flex-wrap items-center">
                                  {#each line.items as item, i}
                                    <span>
                                      <span class="font-medium">{formatQuantity(item)}</span> {item.name}
                                    </span>
                                    {#if i < line.items.length - 1}
                                      <span class="mx-2 text-gray-400">/</span>
                                    {/if}
                                  {/each}
                                </div>
                              {:else if line.is_combination}
                                <div class="flex flex-wrap items-center">
                                  {#each line.items as item, i}
                                    <span>
                                      <span class="font-medium">{formatQuantity(item)}</span> {item.name}
                                    </span>
                                    {#if i < line.items.length - 1}
                                      <span class="mx-2 text-gray-400">+</span>
                                    {/if}
                                  {/each}
                                </div>
                              {:else}
                                {#if line.items.length > 0}
                                  <span>
                                    <span class="font-medium">{formatQuantity(line.items[0])}</span> {line.items[0].name}
                                  </span>
                                {/if}
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </div>
                      
                      {#if optionIndex < meal.options.length - 1}
                        <hr class="border-gray-200 dark:border-gray-700 my-4" />
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{:else if appState.parsedData && appState.parsedData.diets.length === 0}
  <div class="text-center p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
    <p class="text-gray-500 dark:text-gray-400">No se encontraron dietas en el documento.</p>
  </div>
{/if}
