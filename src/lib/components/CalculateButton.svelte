<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import type { MealType } from '$lib/types';
  import { getEffectiveMealOptionIndex, getEffectiveAlternativeChoice } from '$lib/utils';

  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);

  const MEAL_TYPES: MealType[] = ['ALMUERZO', 'COMIDA', 'MERIENDA', 'CENA'];

  const hasEnabledDays = $derived(appState.weekConfig.days.length > 0);

  const isDisabled = $derived(
    !appState.parsedData ||
    !hasEnabledDays ||
    appState.loading
  );

  function serializeSelectionForBackend(): string {
    const config = appState.weekConfig;
    const diets = appState.parsedData?.diets ?? [];

    const serialized = {
      weeks: config.weeks,
      pdf_path: config.pdf_path ?? appState.pdfPath,
      days: config.days.map((day, dayIndex) => {
        const dietIndex = day.diet === 'DIETA 1' ? 0 : 1;
        const diet = diets[dietIndex];

        return {
          day: day.day,
          diet: day.diet,
          meals: MEAL_TYPES.map((mealType) => {
            const optIndex = getEffectiveMealOptionIndex(config, dayIndex, mealType);
            const mealIndex = diet ? diet.meals.findIndex(m => m.type === mealType) : -1;

            const mealAltChoices: Record<string, number> = {};
            if (diet && mealIndex !== -1) {
              const meal = diet.meals[mealIndex];
              const option = meal.options[optIndex];
              if (option) {
                option.ingredient_lines.forEach((line, lineIndex) => {
                  if (line.is_alternatives) {
                    const altKey = `${mealIndex}-${optIndex}-${lineIndex}`;
                    mealAltChoices[String(lineIndex)] = getEffectiveAlternativeChoice(config, dayIndex, altKey);
                  }
                });
              }
            }

            return {
              type: mealType,
              selected_option_index: optIndex,
              alternative_choices: mealAltChoices,
            };
          }),
        };
      }),
    };
    return JSON.stringify(serialized);
  }

  async function handleCalculate() {
    if (!appState.pdfPath) {
      appState.error = 'No hay PDF cargado. Por favor, selecciona un archivo primero.';
      return;
    }

    appState.loading = true;
    appState.error = null;

    try {
      const selectionJson = serializeSelectionForBackend();
      const jsonStr = await invoke<string>('calculate_totals', {
        pdfPath: appState.pdfPath,
        selectionJson,
      });
      const result = JSON.parse(jsonStr) as { status: string; totals: Array<{ ingredient: string; quantity: number; unit: string }> };
      appState.shoppingList = result.totals.map(t => ({
        name: t.ingredient,
        quantity: t.quantity,
        unit: t.unit,
        count: 1,
      }));
    } catch (e) {
      console.error('Error calculating totals:', e);
      appState.error = 'Error al calcular la lista: ' + String(e);
    } finally {
      appState.loading = false;
    }
  }

  function handleMockCalculate() {
    appState.error = 'El cálculo real requiere ejecutar la aplicación en modo Tauri. Usa los datos de prueba cargados para explorar la interfaz.';
  }
</script>

<div class="w-full">
  {#if isTauri}
    <button
      class="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow"
      onclick={handleCalculate}
      disabled={isDisabled}
    >
      {#if appState.loading}
        Calculando...
      {:else}
        Calcular Lista de Compra
      {/if}
    </button>
  {:else}
    <button
      class="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow"
      onclick={handleMockCalculate}
      disabled={isDisabled}
    >
      Calcular Lista de Compra
    </button>
    <p class="mt-2 text-sm text-amber-600 dark:text-amber-400 text-center">
      ⚠️ Requiere modo Tauri para ejecutar el backend
    </p>
  {/if}

  {#if appState.error}
    <div class="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
      {appState.error}
    </div>
  {/if}
</div>
