<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { calculateShoppingList } from '$lib/calculation';
  import { scheduleWorkspaceAutosave } from '$lib/workspace-controller';

  const hasEnabledDays = $derived(appState.weekConfig.days.length > 0);

  const isDisabled = $derived(
    !appState.parsedData ||
    !hasEnabledDays ||
    appState.loading
  );

  async function handleCalculate() {
    if (!appState.parsedData) {
      appState.error = 'No hay una dieta cargada. Por favor, selecciona un PDF primero.';
      return;
    }

    appState.loading = true;
    appState.error = null;

    try {
      appState.shoppingList = calculateShoppingList(appState.parsedData, appState.weekConfig);
      appState.checkedShoppingItems = {};
      appState.activeListId = null;
      appState.activeListName = `${appState.activePlanName} - compra`;
      scheduleWorkspaceAutosave(0);
    } catch (e) {
      console.error('Error calculating totals:', e);
      appState.error = 'Error al calcular la lista: ' + String(e);
    } finally {
      appState.loading = false;
    }
  }

</script>

<div class="w-full">
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

  {#if appState.error}
    <div class="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
      {appState.error}
    </div>
  {/if}
</div>
