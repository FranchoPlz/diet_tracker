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
      <div class="app-surface overflow-hidden rounded-2xl border">
        <button
          class="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-black hover:opacity-90"
          style="background: color-mix(in srgb, var(--surface-strong) 70%, transparent); color: var(--text-primary);"
          onclick={() => toggleDiet(dietIndex)}
        >
          <span>{diet.name}</span>
          <span class="text-xl" style="color: var(--warm);">{expandedDiets[dietIndex] ? '▾' : '▸'}</span>
        </button>

        {#if expandedDiets[dietIndex]}
          <div class="space-y-4 border-t p-4 sm:p-5" style="border-color: var(--border);">
            {#if diet.intro}
              <div class="whitespace-pre-wrap rounded-2xl p-4 text-sm italic" style="background: var(--surface-muted); color: var(--text-secondary);">
                {diet.intro}
              </div>
            {/if}

            {#each diet.meals as meal, mealIndex}
              <div class="overflow-hidden rounded-2xl border" style="border-color: var(--border); background: color-mix(in srgb, var(--surface-strong) 64%, transparent);">
                <button
                  class="flex w-full items-center justify-between px-4 py-3 text-left font-bold hover:opacity-90"
                  style="background: color-mix(in srgb, var(--warm-soft) 48%, transparent); color: var(--text-primary);"
                  onclick={() => toggleMeal(dietIndex, mealIndex)}
                >
                  <span>{meal.type}</span>
                  <span style="color: var(--warm);">{expandedMeals[`${dietIndex}-${mealIndex}`] ? '▾' : '▸'}</span>
                </button>

                {#if expandedMeals[`${dietIndex}-${mealIndex}`]}
                  <div class="space-y-5 border-t p-4" style="border-color: var(--border);">
                    {#each meal.options as option, optionIndex}
                      <div class="space-y-2">
                        <div class="font-bold" style="color: var(--text-primary);">
                          {option.name}
                          {#if option.description}
                            <span class="ml-2 text-sm font-normal" style="color: var(--text-muted);">({option.description})</span>
                          {/if}
                        </div>
                        
                        <ul class="space-y-1.5 pl-1 text-sm" style="color: var(--text-secondary);">
                          {#each option.ingredient_lines as line}
                            <li class="rounded-xl px-3 py-2" style="background: color-mix(in srgb, var(--surface-strong) 58%, transparent);">
                              {#if line.is_alternatives}
                                <div class="flex flex-wrap items-center">
                                  {#each line.items as item, i}
                                    <span>
                                      <span class="font-medium">{formatQuantity(item)}</span> {item.name}
                                    </span>
                                    {#if i < line.items.length - 1}
                                      <span class="mx-2" style="color: var(--warm);">/</span>
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
                                      <span class="mx-2" style="color: var(--warm);">+</span>
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
                        <hr class="my-4" style="border-color: var(--border);" />
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
  <div class="app-surface rounded-2xl border p-8 text-center">
    <p style="color: var(--text-muted);">No se encontraron dietas en el documento.</p>
  </div>
{/if}
