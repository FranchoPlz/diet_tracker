<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import { buildBackendSelection } from '$lib/utils';

  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);

  const hasEnabledDays = $derived(appState.weekConfig.days.length > 0);

  const isDisabled = $derived(
    !appState.parsedData ||
    !hasEnabledDays ||
    appState.loading
  );

  async function handleCalculate() {
    if (!appState.pdfPath) {
      appState.error = 'No hay PDF cargado. Por favor, selecciona un archivo primero.';
      return;
    }

    appState.loading = true;
    appState.error = null;

    try {
      const selectionJson = JSON.stringify(buildBackendSelection(
        appState.weekConfig,
        appState.parsedData?.diets ?? [],
        appState.pdfPath,
      ));
      const jsonStr = await invoke<string>('calculate_totals', {
        pdfPath: appState.pdfPath,
        selectionJson,
      });
      const result = JSON.parse(jsonStr) as { status: string; totals: Array<{ ingredient: string; quantity: number | null; unit: string | null; count?: number }> };
      appState.shoppingList = result.totals.map(t => ({
        name: t.ingredient,
        quantity: t.quantity,
        unit: t.unit,
        count: t.count ?? 1,
      }));
      appState.checkedShoppingItems = {};
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
      class="w-full px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm"
      onclick={handleCalculate}
      disabled={isDisabled}
    >
      {#if appState.loading}
        Calculando...
      {:else}
        Crear lista de compra
      {/if}
    </button>
  {:else}
    <button
      class="w-full px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm"
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
